/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  Identifier,
  IdentifierId,
  InstructionId,
  InstructionKind,
  LValue,
  makeInstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeDependency,
  ReactiveValue,
} from "../HIR/HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { todoInvariant } from "../Utils/todo";
import { assertExhaustive } from "../Utils/utils";
import { eachReactiveValueOperand } from "./visitors";

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

// TODO(@mofeiZ): remove once we replace Context.#dependencies, #properties with tree
// representation
function areDependenciesEqual(
  dep1: ReactiveScopeDependency,
  dep2: ReactiveScopeDependency
): boolean {
  if (dep1.identifier.id !== dep2.identifier.id) {
    return false;
  }
  const dep1Path = dep1.path;
  const dep2Path = dep2.path;

  if (dep1Path === dep2Path) {
    // dep1Path and dep2Path might both be null (representing the empty path)
    return true;
  } else if (
    dep1Path === null ||
    dep2Path === null ||
    dep2Path.length != dep1Path.length
  ) {
    return false;
  }

  return dep1Path.every((dep1Property, idx) => {
    return dep1Property === dep2Path[idx];
  });
}

/**
 * Enum representing the access type of single property on a parent object.
 * We distinguish on two independent axes:
 * Conditional / Unconditional:
 *   - whether this property is accessed unconditionally (within the ReactiveBlock)
 * Access / Dependency:
 *   - Access: this property is read on the path of a dependency. We do not
 *     need to track change variables for accessed properties. Tracking accesses
 *     helps Forget do more granular dependency tracking.
 *   - Dependency: this property is read as a dependency and we must track changes
 *     to it for correctness.
 *
 */
enum PropertyAccessType {
  UnconditionalAccess = "UnconditionalAccess",
  UnconditionalDependency = "UnconditionalDependency",
}

function merge(
  access1: PropertyAccessType,
  access2: PropertyAccessType
): PropertyAccessType {
  if (
    access1 === PropertyAccessType.UnconditionalDependency ||
    access2 === PropertyAccessType.UnconditionalDependency
  ) {
    return PropertyAccessType.UnconditionalDependency;
  } else {
    return PropertyAccessType.UnconditionalAccess;
  }
}

type DependencyNode = {
  properties: Map<string, DependencyNode>;
  accessType: PropertyAccessType;
};

type ReduceResultNode = {
  relativePath: Array<string>;
  accessType: PropertyAccessType;
};

const promoteUncondResult = [
  {
    relativePath: [],
    accessType: PropertyAccessType.UnconditionalDependency,
  },
];

function deriveMinimalDependenciesInSubtree(
  dep: DependencyNode
): Array<ReduceResultNode> {
  const results: Array<ReduceResultNode> = [];
  for (const [childName, childNode] of dep.properties) {
    const reduceResult = deriveMinimalDependenciesInSubtree(childNode).map(
      ({ relativePath, accessType }) => {
        return {
          relativePath: [childName, ...relativePath],
          accessType,
        };
      }
    );
    results.push(...reduceResult);
  }

  switch (dep.accessType) {
    case PropertyAccessType.UnconditionalDependency: {
      return promoteUncondResult;
    }
    case PropertyAccessType.UnconditionalAccess: {
      // all children are unconditional dependencies, return them to preserve granularity
      return results;
    }
    default: {
      todoInvariant(
        false,
        "[PropgateScopeDependencies] Handle conditional dependencies."
      );
    }
  }
}

/**
 * Finalizes a set of ReactiveScopeDependencies to produce a set of minimal unconditional
 * dependencies, preserving granular accesses when possible.
 *
 * Correctness properties:
 *  - All dependencies to a ReactiveBlock must be tracked.
 *    We can always truncate a dependency's path to a subpath, due to Forget assuming
 *    deep immutability. If the value produced by a subpath has not changed, then
 *    dependency must have not changed.
 *    i.e. props.a === $[..] implies props.a.b === $[..]
 *
 *    Note the inverse is not true, but this only means a false positive (we run the
 *    reactive block more than needed).
 *    i.e. props.a !== $[..] does not imply props.a.b !== $[..]
 *
 *  - The dependencies of a finalized ReactiveBlock must be all safe to access
 *    unconditionally (i.e. preserve program semantics with respect to nullthrows).
 *    If a dependency is only accessed within a conditional, we must track the nearest
 *    unconditionally accessed subpath instead.
 * @param initialDeps
 * @returns
 */

// TODO(@mofeiZ): change once we replace Context.#dependencies, #properties with tree
// representation
function deriveMinimalDependencies(
  initialDeps: Set<ReactiveScopeDependency>
): Set<ReactiveScopeDependency> {
  const depRoots = new Map<IdentifierId, [Identifier, DependencyNode]>();

  for (const dep of initialDeps) {
    let root = depRoots.get(dep.identifier.id)?.[1];
    const path = dep.path ?? [];
    if (root == null) {
      // roots can always be accessed unconditionally in JS
      root = {
        properties: new Map(),
        accessType: PropertyAccessType.UnconditionalAccess,
      };
      depRoots.set(dep.identifier.id, [dep.identifier, root]);
    }
    let currNode: DependencyNode = root;
    // TODO(@mofeiZ) add conditional access/dependencies here
    const accessType = PropertyAccessType.UnconditionalAccess;
    const depType = PropertyAccessType.UnconditionalDependency;

    for (const property of path) {
      // all properties read 'on the way' to a dependency are marked as 'access'
      let currChild = currNode.properties.get(property);
      if (currChild == null) {
        currChild = {
          properties: new Map(),
          accessType,
        };
        currNode.properties.set(property, currChild);
      } else {
        currChild.accessType = merge(currChild.accessType, accessType);
      }
      currNode = currChild;
    }

    // final property read should be marked as `dependency`
    currNode.accessType = merge(currNode.accessType, depType);
  }

  const results = new Set<ReactiveScopeDependency>();
  for (const [_, [rootId, rootNode]] of depRoots) {
    const deps = deriveMinimalDependenciesInSubtree(rootNode);
    invariant(
      deps.every(
        (dep) => dep.accessType === PropertyAccessType.UnconditionalDependency
      ),
      "[PropagateScopeDependencies] All dependencies must be reduced to unconditional dependencies."
    );

    for (const dep of deps) {
      results.add({
        identifier: rootId,
        path: dep.relativePath,
      });
    }
  }

  return results;
}

class Context {
  #declarations: DeclMap = new Map();
  #reassignments: Map<Identifier, Decl> = new Map();
  #dependencies: Set<ReactiveScopeDependency> = new Set();
  #properties: Map<Identifier, ReactiveScopeDependency> = new Map();
  #temporaries: Map<Identifier, Place> = new Map();
  #scopes: Scopes = [];

  enter(scope: ReactiveScope, fn: () => void): Set<ReactiveScopeDependency> {
    const previousDependencies = this.#dependencies;
    const scopedDependencies = new Set<ReactiveScopeDependency>();
    this.#dependencies = scopedDependencies;
    this.#scopes.push(scope);
    fn();
    this.#scopes.pop();
    this.#dependencies = previousDependencies;
    return deriveMinimalDependencies(scopedDependencies);
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

  declareProperty(lvalue: Place, object: Place, property: string): void {
    const resolvedObject = this.#temporaries.get(object.identifier) ?? object;
    const objectDependency = this.#properties.get(resolvedObject.identifier);
    let nextDependency: ReactiveScopeDependency;
    if (objectDependency === undefined) {
      nextDependency = {
        identifier: resolvedObject.identifier,
        path: [property],
      };
    } else {
      nextDependency = {
        identifier: objectDependency.identifier,
        path: [...(objectDependency.path ?? []), property],
      };
    }
    this.#properties.set(lvalue.identifier, nextDependency);
  }

  #isScopeActive(scope: ReactiveScope): boolean {
    return this.#scopes.indexOf(scope) !== -1;
  }

  get currentScope(): ReactiveScope | null {
    return this.#scopes.at(-1) ?? null;
  }

  visitOperand(place: Place): void {
    const resolved = this.#temporaries.get(place.identifier) ?? place;
    this.visitDependency({ identifier: resolved.identifier, path: null });
  }

  visitProperty(object: Place, property: string): void {
    const resolvedObject = this.#temporaries.get(object.identifier) ?? object;
    const objectDependency = this.#properties.get(resolvedObject.identifier);
    let nextDependency: ReactiveScopeDependency;
    if (objectDependency === undefined) {
      nextDependency = {
        identifier: resolvedObject.identifier,
        path: [property],
      };
    } else {
      nextDependency = {
        identifier: objectDependency.identifier,
        path: [...(objectDependency.path ?? []), property],
      };
    }
    this.visitDependency(nextDependency);
  }

  visitDependency(dependency: ReactiveScopeDependency): void {
    let maybeDependency: ReactiveScopeDependency;
    if (dependency.path !== null) {
      // Operands may have memberPaths when propagating depenencies of an inner scope upward
      // In this case we use the dependency as-is
      maybeDependency = dependency;
    } else {
      // Otherwise if this operand is a temporary created for a property load, resolve it to
      // the expanded Place. Fall back to using the operand as-is.
      let propDep = this.#properties.get(dependency.identifier);
      if (dependency.identifier.name === null && propDep !== undefined) {
        maybeDependency = propDep;
      } else {
        maybeDependency = dependency;
      }
    }

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

    // If this operand is used in a scope, has a dynamic value, and was defined
    // before this scope, then its a dependency of the scope.
    const currentDeclaration =
      this.#reassignments.get(maybeDependency.identifier) ??
      this.#declarations.get(maybeDependency.identifier.id);
    const currentScope = this.currentScope;
    if (
      currentScope != null &&
      currentDeclaration !== undefined &&
      currentDeclaration.id < currentScope.range.start &&
      (currentDeclaration.scope == null ||
        !this.#isScopeActive(currentDeclaration.scope))
    ) {
      // Check if there is an existing dependency that describes this operand
      // We do not try to join/reduce dependencies here due to missing info
      for (const dep of this.#dependencies) {
        if (areDependenciesEqual(dep, maybeDependency)) {
          return;
        }
      }
      this.#dependencies.add(maybeDependency);
    }
  }

  /**
   * Record a variable that is declared in some other scope and that is being reassigned in the
   * current one as a {@link ReactiveScope.reassignments}
   */
  visitReassignment(lvalue: LValue): void {
    if (lvalue.kind !== InstructionKind.Reassign) {
      return;
    }
    const declaration = this.#declarations.get(lvalue.place.identifier.id);
    if (
      this.currentScope != null &&
      lvalue.place.identifier.scope != null &&
      declaration !== undefined &&
      declaration.scope !== lvalue.place.identifier.scope
    ) {
      this.currentScope.reassignments.add(lvalue.place.identifier);
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
        for (const dep of scopeDependencies) {
          // propagate dependencies upward using the same rules as
          // normal dependency collection. child scopes may have dependencies
          // on values created within the outer scope, which necessarily cannot
          // be dependencies of the outer scope
          context.visitDependency(dep);
        }
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
            visitReactiveValue(context, terminal.init);
            visitReactiveValue(context, terminal.test);
            visitReactiveValue(context, terminal.update);
            visit(context, terminal.loop);
            break;
          }
          case "while": {
            visitReactiveValue(context, terminal.test);
            visit(context, terminal.loop);
            break;
          }
          case "if": {
            context.visitOperand(terminal.test);
            visit(context, terminal.consequent);
            if (terminal.alternate !== null) {
              visit(context, terminal.alternate);
            }
            break;
          }
          case "switch": {
            context.visitOperand(terminal.test);
            for (const case_ of terminal.cases) {
              if (case_.block !== undefined) {
                visit(context, case_.block);
              }
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

function visitReactiveValue(context: Context, value: ReactiveValue): void {
  switch (value.kind) {
    case "LogicalExpression": {
      visitReactiveValue(context, value.left);
      visitReactiveValue(context, value.right);
      break;
    }
    case "ConditionalExpression": {
      visitReactiveValue(context, value.test);
      visitReactiveValue(context, value.consequent);
      visitReactiveValue(context, value.alternate);
      break;
    }
    case "SequenceExpression": {
      for (const instr of value.instructions) {
        visitInstruction(context, instr);
      }
      visitInstructionValue(context, value.value, null);
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
  value: ReactiveValue,
  lvalue: LValue | null
): void {
  if (value.kind === "Identifier" && lvalue !== null) {
    if (
      value.identifier.name !== null &&
      lvalue.place.identifier.name === null
    ) {
      context.declareTemporary(lvalue.place, value);
    } else {
      context.visitOperand(value);
    }
  } else if (value.kind === "PropertyLoad") {
    if (lvalue !== null) {
      context.declareProperty(lvalue.place, value.object, value.property);
    } else {
      context.visitProperty(value.object, value.property);
    }
  } else {
    for (const operand of eachReactiveValueOperand(value)) {
      context.visitOperand(operand);
    }
  }
}

function visitInstruction(context: Context, instr: ReactiveInstruction): void {
  const { lvalue } = instr;
  visitInstructionValue(context, instr.value, lvalue);
  if (lvalue == null) {
    return;
  }
  if (lvalue.kind === InstructionKind.Reassign) {
    context.visitReassignment(lvalue);
  }
  context.declare(lvalue.place.identifier, {
    id: instr.id,
    scope: context.currentScope,
  });
}
