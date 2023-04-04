/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Identifier,
  IdentifierId,
  InstructionId,
  InstructionKind,
  makeInstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeDependency,
  ReactiveValue,
} from "../HIR/HIR";
import {
  eachInstructionValueOperand,
  eachPatternOperand,
} from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";
import {
  ReactiveScopeDependencyTree,
  ReactiveScopePropertyDependency,
} from "./DeriveMinimalDependencies";

/**
 * Infers the dependencies of each scope to include variables whose values
 * are non-stable and created prior to the start of the scope. Also propagates
 * dependencies upwards, so that parent scope dependencies are the union of
 * their direct dependencies and those of their child scopes.
 */
export function propagateScopeDependencies(fn: ReactiveFunction): void {
  const context = new Context();
  if (fn.id !== null) {
    context.declare(fn.id, {
      id: makeInstructionId(0),
      scope: null,
    });
  }
  for (const param of fn.params) {
    context.declare(param.identifier, {
      id: makeInstructionId(0),
      scope: null,
    });
  }
  visit(context, fn.body);
}

type DeclMap = Map<IdentifierId, Decl>;
type Decl = {
  id: InstructionId;
  scope: ReactiveScope | null;
};

type Scopes = Array<ReactiveScope>;

class Context {
  #declarations: DeclMap = new Map();
  #reassignments: Map<Identifier, Decl> = new Map();
  // Reactive dependencies used in the current reactive scope.
  #dependencies: ReactiveScopeDependencyTree =
    new ReactiveScopeDependencyTree();
  // We keep a sidemap for temporaries created by PropertyLoads, and do
  // not store any control flow (i.e. #inConditionalWithinScope) here.
  //  - a ReactiveScope (A) containing a PropertyLoad may differ from the
  //    ReactiveScope (B) that uses the produced temporary.
  //  - codegen will inline these PropertyLoads back into scope (B)
  #properties: Map<Identifier, ReactiveScopePropertyDependency> = new Map();
  #temporaries: Map<Identifier, Place> = new Map();
  #inConditionalWithinScope: boolean = false;
  // Reactive dependencies used unconditionally in the current conditional.
  // Composed of dependencies:
  //  - directly accessed within block (added in visitDep)
  //  - accessed by all cfg branches (added through promoteDeps)
  #depsInCurrentConditional: ReactiveScopeDependencyTree =
    new ReactiveScopeDependencyTree();
  #scopes: Scopes = [];

  enter(scope: ReactiveScope, fn: () => void): Set<ReactiveScopeDependency> {
    // Save context of previous scope
    const prevInConditional = this.#inConditionalWithinScope;
    const previousDependencies = this.#dependencies;

    // Set context for new scope
    // A nested scope should add all deps it directly uses as its own
    // unconditional deps, regardless of whether the nested scope is itself
    // within a conditional
    const scopedDependencies = new ReactiveScopeDependencyTree();
    this.#inConditionalWithinScope = false;
    this.#dependencies = scopedDependencies;
    this.#scopes.push(scope);

    fn();

    // Restore context of previous scope
    this.#scopes.pop();
    this.#dependencies = previousDependencies;
    this.#inConditionalWithinScope = prevInConditional;

    // Derive minimal dependencies now, since next line may mutate scopedDependencies
    const minInnerScopeDependencies =
      scopedDependencies.deriveMinimalDependencies();

    // propagate dependencies upward using the same rules as normal dependency
    // collection. child scopes may have dependencies on values created within
    // the outer scope, which necessarily cannot be dependencies of the outer
    // scope
    this.#dependencies.addDepsFromInnerScope(
      scopedDependencies,
      this.#inConditionalWithinScope,
      this.#checkValidDependencyId.bind(this)
    );
    return minInnerScopeDependencies;
  }

  /**
   * Prints dependency tree to string for debugging.
   * @param includeAccesses
   * @returns string representation of DependencyTree
   */
  printDeps(includeAccesses: boolean = false): string {
    return this.#dependencies.printDeps(includeAccesses);
  }

  /**
   * We track and return unconditional accesses / deps within this conditional.
   * If an object property is always used (i.e. in every conditional path), we
   * want to promote it to an unconditional access / dependency.
   *
   * The caller of `enterConditional` is responsible determining for promotion.
   * i.e. call promoteDepsFromExhaustiveConditionals to merge returned results.
   *
   * e.g. we want to mark props.a.b as an unconditional dep here
   *  if (foo(...)) {
   *    access(props.a.b);
   *  } else {
   *    access(props.a.b);
   *  }
   */
  enterConditional(fn: () => void): ReactiveScopeDependencyTree {
    const prevInConditional = this.#inConditionalWithinScope;
    const prevUncondAccessed = this.#depsInCurrentConditional;
    this.#inConditionalWithinScope = true;
    this.#depsInCurrentConditional = new ReactiveScopeDependencyTree();
    fn();
    const result = this.#depsInCurrentConditional;
    this.#inConditionalWithinScope = prevInConditional;
    this.#depsInCurrentConditional = prevUncondAccessed;
    return result;
  }

  /**
   * Add dependencies from exhaustive CFG paths into the current ReactiveDeps
   * tree. If a property is used in every CFG path, it is promoted to an
   * unconditional access / dependency here.
   * @param depsInConditionals
   */
  promoteDepsFromExhaustiveConditionals(
    depsInConditionals: Array<ReactiveScopeDependencyTree>
  ): void {
    this.#dependencies.promoteDepsFromExhaustiveConditionals(
      depsInConditionals
    );
    this.#depsInCurrentConditional.promoteDepsFromExhaustiveConditionals(
      depsInConditionals
    );
  }

  /**
   * Records where a value was declared, and optionally, the scope where the value originated from.
   * This is later used to determine if a dependency should be added to a scope; if the current
   * scope we are visiting is the same scope where the value originates, it can't be a dependency
   * on itself.
   */
  declare(identifier: Identifier, decl: Decl): void {
    if (!this.#declarations.has(identifier.id)) {
      this.#declarations.set(identifier.id, decl);
    }
    this.#reassignments.set(identifier, decl);
  }

  declareTemporary(lvalue: Place, value: Place): void {
    this.#temporaries.set(lvalue.identifier, value);
  }

  #getProperty(
    object: Place,
    property: string,
    isConditional: boolean
  ): ReactiveScopePropertyDependency {
    const resolvedObject = this.#temporaries.get(object.identifier) ?? object;
    const resolvedDependency = this.#properties.get(resolvedObject.identifier);
    let objectDependency: ReactiveScopePropertyDependency;
    // (1) Create the base property dependency as either a LoadLocal (from a temporary)
    // or a deep copy of an existing property dependency.
    if (resolvedDependency === undefined) {
      objectDependency = {
        identifier: resolvedObject.identifier,
        path: [],
        optionalPath: [],
      };
    } else {
      objectDependency = {
        identifier: resolvedDependency.identifier,
        path: [...resolvedDependency.path],
        optionalPath: [...resolvedDependency.optionalPath],
      };
    }

    // (2) Determine whether property is an optional access
    if (objectDependency.optionalPath.length > 0) {
      // If the base property dependency represents a optional member expression,
      // property is on the optionalPath (regardless of whether this PropertyLoad
      // itself was conditional)
      // e.g. for `a.b?.c.d`, `d` should be added to optionalPath
      objectDependency.optionalPath.push(property);
    } else if (isConditional) {
      objectDependency.optionalPath.push(property);
    } else {
      objectDependency.path.push(property);
    }

    return objectDependency;
  }

  declareProperty(
    lvalue: Place,
    object: Place,
    property: string,
    isConditional: boolean
  ): void {
    const nextDependency = this.#getProperty(object, property, isConditional);
    this.#properties.set(lvalue.identifier, nextDependency);
  }

  // Checks if identifier is a valid dependency in the current scope
  #checkValidDependencyId(identifier: Identifier): boolean {
    // If this operand is used in a scope, has a dynamic value, and was defined
    // before this scope, then its a dependency of the scope.
    const currentDeclaration =
      this.#reassignments.get(identifier) ??
      this.#declarations.get(identifier.id);
    const currentScope = this.currentScope;
    return (
      currentScope != null &&
      currentDeclaration !== undefined &&
      currentDeclaration.id < currentScope.range.start &&
      (currentDeclaration.scope == null ||
        currentDeclaration.scope !== currentScope)
    );
  }

  #isScopeActive(scope: ReactiveScope): boolean {
    return this.#scopes.indexOf(scope) !== -1;
  }

  get currentScope(): ReactiveScope | null {
    return this.#scopes.at(-1) ?? null;
  }

  visitOperand(place: Place): void {
    const resolved = this.#temporaries.get(place.identifier) ?? place;
    // if this operand is a temporary created for a property load, try to resolve it to
    // the expanded Place. Fall back to using the operand as-is.

    let dependency: ReactiveScopePropertyDependency = {
      identifier: resolved.identifier,
      path: [],
      optionalPath: [],
    };
    if (resolved.identifier.name === null) {
      const propertyDependency = this.#properties.get(resolved.identifier);
      if (propertyDependency !== undefined) {
        dependency = { ...propertyDependency };
      }
    }
    this.visitDependency(dependency);
  }

  visitProperty(object: Place, property: string, isConditional: boolean): void {
    const nextDependency = this.#getProperty(object, property, isConditional);
    this.visitDependency(nextDependency);
  }

  visitDependency(maybeDependency: ReactiveScopePropertyDependency): void {
    // Any value used after its originally defining scope has concluded must be added as an
    // output of its defining scope. Regardless of whether its a const or not,
    // some later code needs access to the value. If the current
    // scope we are visiting is the same scope where the value originates, it can't be a dependency
    // on itself.

    // if originalDeclaration is undefined here, then this is a free var
    //  (all other decls e.g. `let x;` should be initialized in BuildHIR)
    const originalDeclaration = this.#declarations.get(
      maybeDependency.identifier.id
    );
    if (
      originalDeclaration !== undefined &&
      originalDeclaration.scope !== null &&
      !this.#isScopeActive(originalDeclaration.scope)
    ) {
      originalDeclaration.scope.declarations.set(
        maybeDependency.identifier.id,
        maybeDependency.identifier
      );
    }

    if (this.#checkValidDependencyId(maybeDependency.identifier)) {
      this.#depsInCurrentConditional.add(maybeDependency, true);
      // Add info about this dependency to the existing tree
      // We do not try to join/reduce dependencies here due to missing info
      this.#dependencies.add(maybeDependency, this.#inConditionalWithinScope);
    }
  }

  /**
   * Record a variable that is declared in some other scope and that is being reassigned in the
   * current one as a {@link ReactiveScope.reassignments}
   */
  visitReassignment(place: Place): void {
    const declaration = this.#declarations.get(place.identifier.id);
    if (
      this.currentScope != null &&
      place.identifier.scope != null &&
      declaration !== undefined &&
      declaration.scope !== place.identifier.scope &&
      !Array.from(this.currentScope.reassignments).some(
        (ident) => ident.id === place.identifier.id
      )
    ) {
      this.currentScope.reassignments.add(place.identifier);
    }
  }
}

function visit(context: Context, block: ReactiveBlock): void {
  for (const item of block) {
    switch (item.kind) {
      case "scope": {
        const scopeDependencies = context.enter(item.scope, () => {
          visit(context, item.instructions);
        });
        item.scope.dependencies = scopeDependencies;
        break;
      }
      case "instruction": {
        visitInstruction(context, item.instruction);
        break;
      }
      case "terminal": {
        const terminal = item.terminal;
        switch (terminal.kind) {
          case "break":
          case "continue": {
            break;
          }
          case "return": {
            if (terminal.value !== null) {
              context.visitOperand(terminal.value);
            }
            break;
          }
          case "throw": {
            context.visitOperand(terminal.value);
            break;
          }
          case "for": {
            visitReactiveValue(context, terminal.id, terminal.init);
            visitReactiveValue(context, terminal.id, terminal.test);
            context.enterConditional(() => {
              if (terminal.update !== null) {
                visitReactiveValue(context, terminal.id, terminal.update);
              }
              visit(context, terminal.loop);
            });
            break;
          }
          case "for-of": {
            visitReactiveValue(context, terminal.id, terminal.init);
            context.enterConditional(() => {
              visit(context, terminal.loop);
            });
            break;
          }
          case "do-while": {
            visit(context, terminal.loop);
            context.enterConditional(() => {
              visitReactiveValue(context, terminal.id, terminal.test);
            });
            break;
          }
          case "while": {
            visitReactiveValue(context, terminal.id, terminal.test);
            context.enterConditional(() => {
              visit(context, terminal.loop);
            });
            break;
          }
          case "if": {
            context.visitOperand(terminal.test);
            const { consequent, alternate } = terminal;
            const depsInIf = context.enterConditional(() => {
              visit(context, consequent);
            });
            if (alternate !== null) {
              const depsInElse = context.enterConditional(() => {
                visit(context, alternate);
              });
              context.promoteDepsFromExhaustiveConditionals([
                depsInIf,
                depsInElse,
              ]);
            }
            break;
          }
          case "switch": {
            context.visitOperand(terminal.test);
            const depsInCases = [];
            let foundDefault = false;
            // This can underestimate unconditional accesses due to the current
            // CFG representation for fallthrough. This is safe. It only
            // reduces granularity of dependencies.
            for (const { test, block } of terminal.cases) {
              if (test == null) {
                foundDefault = true;
              }
              if (block !== undefined) {
                depsInCases.push(
                  context.enterConditional(() => {
                    visit(context, block);
                  })
                );
              }
            }
            if (foundDefault) {
              context.promoteDepsFromExhaustiveConditionals(depsInCases);
            }
            break;
          }
          default: {
            assertExhaustive(
              terminal,
              `Unexpected terminal kind '${(terminal as any).kind}'`
            );
          }
        }
        break;
      }
      default: {
        assertExhaustive(item, `Unexpected item`);
      }
    }
  }
}

function visitReactiveValue(
  context: Context,
  id: InstructionId,
  value: ReactiveValue
): void {
  switch (value.kind) {
    case "OptionalCall": {
      context.enterConditional(() => {
        visitReactiveValue(context, id, value.call);
      });
      break;
    }
    case "LogicalExpression": {
      visitReactiveValue(context, id, value.left);
      context.enterConditional(() => {
        visitReactiveValue(context, id, value.right);
      });
      break;
    }
    case "ConditionalExpression": {
      visitReactiveValue(context, id, value.test);

      const consequentDeps = context.enterConditional(() => {
        visitReactiveValue(context, id, value.consequent);
      });
      const alternateDeps = context.enterConditional(() => {
        visitReactiveValue(context, id, value.alternate);
      });
      context.promoteDepsFromExhaustiveConditionals([
        consequentDeps,
        alternateDeps,
      ]);
      break;
    }
    case "SequenceExpression": {
      for (const instr of value.instructions) {
        visitInstruction(context, instr);
      }
      visitInstructionValue(context, id, value.value, null);
      break;
    }
    default: {
      for (const operand of eachInstructionValueOperand(value)) {
        context.visitOperand(operand);
      }
    }
  }
}

function visitInstructionValue(
  context: Context,
  id: InstructionId,
  value: ReactiveValue,
  lvalue: Place | null
): void {
  if (value.kind === "LoadLocal" && lvalue !== null) {
    if (
      value.place.identifier.name !== null &&
      lvalue.identifier.name === null
    ) {
      context.declareTemporary(lvalue, value.place);
    } else {
      context.visitOperand(value.place);
    }
  } else if (value.kind === "PropertyLoad") {
    if (lvalue !== null) {
      context.declareProperty(
        lvalue,
        value.object,
        value.property,
        value.optional
      );
    } else {
      context.visitProperty(value.object, value.property, value.optional);
    }
  } else if (value.kind === "StoreLocal") {
    context.visitOperand(value.value);
    if (value.lvalue.kind === InstructionKind.Reassign) {
      context.visitReassignment(value.lvalue.place);
    }
    context.declare(value.lvalue.place.identifier, {
      id,
      scope: context.currentScope,
    });
  } else if (value.kind === "Destructure") {
    context.visitOperand(value.value);
    for (const place of eachPatternOperand(value.lvalue.pattern)) {
      if (value.lvalue.kind === InstructionKind.Reassign) {
        context.visitReassignment(place);
      }
      context.declare(place.identifier, {
        id,
        scope: context.currentScope,
      });
    }
  } else {
    visitReactiveValue(context, id, value);
  }
}

function visitInstruction(context: Context, instr: ReactiveInstruction): void {
  const { lvalue } = instr;
  visitInstructionValue(context, instr.id, instr.value, lvalue);
  if (lvalue == null) {
    return;
  }
  context.declare(lvalue.identifier, {
    id: instr.id,
    scope: context.currentScope,
  });
}
