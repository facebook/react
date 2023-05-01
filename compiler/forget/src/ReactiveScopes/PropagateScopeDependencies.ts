/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeBlock,
  ReactiveScopeDependency,
  ReactiveTerminalStatement,
  ReactiveValue,
} from "../HIR/HIR";
import {
  eachInstructionValueOperand,
  eachPatternOperand,
} from "../HIR/visitors";
import { empty, Stack } from "../Utils/Stack";
import { assertExhaustive } from "../Utils/utils";
import {
  ReactiveScopeDependencyTree,
  ReactiveScopePropertyDependency,
} from "./DeriveMinimalDependencies";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

/**
 * Infers the dependencies of each scope to include variables whose values
 * are non-stable and created prior to the start of the scope. Also propagates
 * dependencies upwards, so that parent scope dependencies are the union of
 * their direct dependencies and those of their child scopes.
 */
export function propagateScopeDependencies(fn: ReactiveFunction): void {
  const escapingTemporaries: TemporariesUsedOutsideDefiningScope = {
    declarations: new Map(),
    usedOutsideDeclaringScope: new Set(),
  };
  visitReactiveFunction(fn, new FindPromotedTemporaries(), escapingTemporaries);

  const context = new Context(escapingTemporaries.usedOutsideDeclaringScope);
  if (fn.id !== null) {
    context.declare(fn.id, {
      id: makeInstructionId(0),
      scope: empty(),
    });
  }
  for (const param of fn.params) {
    context.declare(param.identifier, {
      id: makeInstructionId(0),
      scope: empty(),
    });
  }
  visitReactiveFunction(fn, new PropagationVisitor(), context);
}

type TemporariesUsedOutsideDefiningScope = {
  // tracks all relevant temporary declarations (currently LoadLocal and PropertyLoad)
  // and the scope where they are defined
  declarations: Map<IdentifierId, ReactiveScope>;
  // temporaries used outside of their defining scope
  usedOutsideDeclaringScope: Set<IdentifierId>;
};
class FindPromotedTemporaries extends ReactiveFunctionVisitor<TemporariesUsedOutsideDefiningScope> {
  scopes: Array<ReactiveScope> = [];

  override visitScope(
    scope: ReactiveScopeBlock,
    state: TemporariesUsedOutsideDefiningScope
  ): void {
    this.scopes.push(scope.scope);
    this.traverseScope(scope, state);
    this.scopes.pop();
  }

  override visitInstruction(
    instruction: ReactiveInstruction,
    state: TemporariesUsedOutsideDefiningScope
  ): void {
    const scope = this.scopes.at(-1);
    if (instruction.lvalue === null || scope === undefined) {
      return;
    }
    switch (instruction.value.kind) {
      case "LoadLocal":
      case "PropertyLoad": {
        state.declarations.set(instruction.lvalue.identifier.id, scope);
        break;
      }
      default: {
        break;
      }
    }
    this.traverseInstruction(instruction, state);
  }

  override visitPlace(
    _id: InstructionId,
    place: Place,
    state: TemporariesUsedOutsideDefiningScope
  ): void {
    const declaringScope = state.declarations.get(place.identifier.id);
    if (this.scopes.length === 0 || declaringScope === undefined) {
      return;
    }
    if (this.scopes.indexOf(declaringScope) === -1) {
      // Declaring scope is not active === used outside declaring scope
      state.usedOutsideDeclaringScope.add(place.identifier.id);
    }
  }
}

type DeclMap = Map<IdentifierId, Decl>;
type Decl = {
  id: InstructionId;
  scope: Stack<ReactiveScope>;
};

class Context {
  #temporariesUsedOutsideScope: Set<IdentifierId>;
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
  #scopes: Stack<ReactiveScope> = empty();

  constructor(temporariesUsedOutsideScope: Set<IdentifierId>) {
    this.#temporariesUsedOutsideScope = temporariesUsedOutsideScope;
  }

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
    this.#scopes = this.#scopes.push(scope);

    fn();

    // Restore context of previous scope
    this.#scopes = this.#scopes.pop();
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

  isUsedOutsideDeclaringScope(place: Place): boolean {
    return this.#temporariesUsedOutsideScope.has(place.identifier.id);
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

  declareTemporary(lvalue: Place, place: Place): void {
    this.#temporaries.set(lvalue.identifier, place);
  }

  resolveTemporary(place: Place): Place {
    return this.#temporaries.get(place.identifier) ?? place;
  }

  #getProperty(
    object: Place,
    property: string,
    isConditional: boolean
  ): ReactiveScopePropertyDependency {
    const resolvedObject = this.resolveTemporary(object);
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
    const currentScope = this.#scopes !== null ? this.#scopes.value : null;
    return (
      currentScope != null &&
      currentDeclaration !== undefined &&
      currentDeclaration.id < currentScope.range.start &&
      (currentDeclaration.scope == null ||
        currentDeclaration.scope.value !== currentScope)
    );
  }

  #isScopeActive(scope: ReactiveScope): boolean {
    if (this.#scopes === null) {
      return false;
    }
    return this.#scopes.contains(scope);
  }

  get currentScope(): Stack<ReactiveScope> {
    return this.#scopes;
  }

  visitOperand(place: Place): void {
    const resolved = this.resolveTemporary(place);
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
      originalDeclaration.scope.value !== null
    ) {
      originalDeclaration.scope.each((scope) => {
        if (!this.#isScopeActive(scope)) {
          scope.declarations.set(maybeDependency.identifier.id, {
            identifier: maybeDependency.identifier,
            scope: originalDeclaration.scope.value!, // checked above
          });
        }
      });
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
      this.currentScope.value != null &&
      place.identifier.scope != null &&
      declaration !== undefined &&
      declaration.scope.value !== place.identifier.scope &&
      !Array.from(this.currentScope.value.reassignments).some(
        (ident) => ident.id === place.identifier.id
      )
    ) {
      this.currentScope.value.reassignments.add(place.identifier);
    }
  }
}

class PropagationVisitor extends ReactiveFunctionVisitor<Context> {
  override visitScope(scope: ReactiveScopeBlock, context: Context): void {
    const scopeDependencies = context.enter(scope.scope, () => {
      this.visitBlock(scope.instructions, context);
    });
    scope.scope.dependencies = scopeDependencies;
  }

  override visitInstruction(
    instruction: ReactiveInstruction,
    context: Context
  ): void {
    const { id, value, lvalue } = instruction;
    this.visitInstructionValue(context, id, value, lvalue);
    if (lvalue == null) {
      return;
    }
    context.declare(lvalue.identifier, {
      id,
      scope: context.currentScope,
    });
  }

  visitReactiveValue(
    context: Context,
    id: InstructionId,
    value: ReactiveValue
  ): void {
    switch (value.kind) {
      case "OptionalCall": {
        context.enterConditional(() => {
          this.visitReactiveValue(context, id, value.call);
        });
        break;
      }
      case "LogicalExpression": {
        this.visitReactiveValue(context, id, value.left);
        context.enterConditional(() => {
          this.visitReactiveValue(context, id, value.right);
        });
        break;
      }
      case "ConditionalExpression": {
        this.visitReactiveValue(context, id, value.test);

        const consequentDeps = context.enterConditional(() => {
          this.visitReactiveValue(context, id, value.consequent);
        });
        const alternateDeps = context.enterConditional(() => {
          this.visitReactiveValue(context, id, value.alternate);
        });
        context.promoteDepsFromExhaustiveConditionals([
          consequentDeps,
          alternateDeps,
        ]);
        break;
      }
      case "SequenceExpression": {
        for (const instr of value.instructions) {
          this.visitInstruction(instr, context);
        }
        this.visitInstructionValue(context, id, value.value, null);
        break;
      }
      default: {
        for (const operand of eachInstructionValueOperand(value)) {
          context.visitOperand(operand);
        }
      }
    }
  }

  visitInstructionValue(
    context: Context,
    id: InstructionId,
    value: ReactiveValue,
    lvalue: Place | null
  ): void {
    if (value.kind === "LoadLocal" && lvalue !== null) {
      if (
        value.place.identifier.name !== null &&
        lvalue.identifier.name === null &&
        !context.isUsedOutsideDeclaringScope(lvalue)
      ) {
        context.declareTemporary(lvalue, value.place);
      } else {
        context.visitOperand(value.place);
      }
    } else if (value.kind === "PropertyLoad") {
      if (lvalue !== null && !context.isUsedOutsideDeclaringScope(lvalue)) {
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
      this.visitReactiveValue(context, id, value);
    }
  }

  override visitTerminal(
    stmt: ReactiveTerminalStatement,
    context: Context
  ): void {
    const terminal = stmt.terminal;
    switch (terminal.kind) {
      case "break":
      case "continue": {
        break;
      }
      case "return": {
        context.visitOperand(terminal.value);
        break;
      }
      case "throw": {
        context.visitOperand(terminal.value);
        break;
      }
      case "for": {
        this.visitReactiveValue(context, terminal.id, terminal.init);
        this.visitReactiveValue(context, terminal.id, terminal.test);
        context.enterConditional(() => {
          if (terminal.update !== null) {
            this.visitReactiveValue(context, terminal.id, terminal.update);
          }
          this.visitBlock(terminal.loop, context);
        });
        break;
      }
      case "for-of": {
        this.visitReactiveValue(context, terminal.id, terminal.init);
        context.enterConditional(() => {
          this.visitBlock(terminal.loop, context);
        });
        break;
      }
      case "do-while": {
        this.visitBlock(terminal.loop, context);
        context.enterConditional(() => {
          this.visitReactiveValue(context, terminal.id, terminal.test);
        });
        break;
      }
      case "while": {
        this.visitReactiveValue(context, terminal.id, terminal.test);
        context.enterConditional(() => {
          this.visitBlock(terminal.loop, context);
        });
        break;
      }
      case "if": {
        context.visitOperand(terminal.test);
        const { consequent, alternate } = terminal;
        const depsInIf = context.enterConditional(() => {
          this.visitBlock(consequent, context);
        });
        if (alternate !== null) {
          const depsInElse = context.enterConditional(() => {
            this.visitBlock(alternate, context);
          });
          context.promoteDepsFromExhaustiveConditionals([depsInIf, depsInElse]);
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
          if (test !== null) {
            context.visitOperand(test);
          } else {
            foundDefault = true;
          }
          if (block !== undefined) {
            depsInCases.push(
              context.enterConditional(() => {
                this.visitBlock(block, context);
              })
            );
          }
        }
        if (foundDefault) {
          context.promoteDepsFromExhaustiveConditionals(depsInCases);
        }
        break;
      }
      case "label": {
        this.visitBlock(terminal.block, context);
        break;
      }
      default: {
        assertExhaustive(
          terminal,
          `Unexpected terminal kind '${(terminal as any).kind}'`
        );
      }
    }
  }
}
