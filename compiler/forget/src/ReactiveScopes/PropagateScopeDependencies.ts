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
import { assertExhaustive } from "../Utils/utils";

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
  dep1: ReactiveScopeDependencyInfo,
  dep2: ReactiveScopeDependencyInfo
): boolean {
  if (dep1.identifier.id !== dep2.identifier.id || dep1.cond !== dep2.cond) {
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
    dep2Path.length !== dep1Path.length
  ) {
    return false;
  }

  return dep1Path.every((dep1Property, idx) => {
    return dep1Property === dep2Path[idx];
  });
}

type ReactiveScopeDependencyInfo = ReactiveScopeDependency & { cond: boolean };

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
 *   ```javascript
 *   // props.a is a dependency here and must be tracked
 *   deps: {props.a, props.a.b} ---> minimalDeps: {props.a}
 *   // props.a is just an access here and does not need to be tracked
 *   deps: {props.a.b} ---> minimalDeps: {props.a.b}
 *   ```
 */
enum PropertyAccessType {
  ConditionalAccess = "ConditionalAccess",
  UnconditionalAccess = "UnconditionalAccess",
  ConditionalDependency = "ConditionalDependency",
  UnconditionalDependency = "UnconditionalDependency",
}

function isUnconditional(access: PropertyAccessType) {
  return (
    access === PropertyAccessType.UnconditionalAccess ||
    access === PropertyAccessType.UnconditionalDependency
  );
}
function isDependency(access: PropertyAccessType) {
  return (
    access === PropertyAccessType.ConditionalDependency ||
    access === PropertyAccessType.UnconditionalDependency
  );
}

function merge(
  access1: PropertyAccessType,
  access2: PropertyAccessType
): PropertyAccessType {
  const resultIsUnconditional =
    isUnconditional(access1) || isUnconditional(access2);
  const resultIsDependency = isDependency(access1) || isDependency(access2);

  // Straightforward merge.
  // This can be represented as bitwise OR, but is written out for readability
  //
  // Observe that `UnconditionalAccess | ConditionalDependency` produces an
  // unconditionally accessed conditional dependency. We currently use these
  // as we use unconditional dependencies. (i.e. to codegen change variables)
  if (resultIsUnconditional) {
    if (resultIsDependency) {
      return PropertyAccessType.UnconditionalDependency;
    } else {
      return PropertyAccessType.UnconditionalAccess;
    }
  } else {
    if (resultIsDependency) {
      return PropertyAccessType.ConditionalDependency;
    } else {
      return PropertyAccessType.ConditionalAccess;
    }
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

const promoteCondResult = [
  {
    relativePath: [],
    accessType: PropertyAccessType.ConditionalDependency,
  },
];

/**
 * Recursively calculates minimal dependencies in a subtree.
 * @param dep DependencyNode representing a dependency subtree.
 * @returns a minimal list of dependencies in this subtree.
 */
function deriveMinimalDependenciesInSubtree(
  dep: DependencyNode
): Array<ReduceResultNode> {
  const results: Array<ReduceResultNode> = [];
  for (const [childName, childNode] of dep.properties) {
    const childResult = deriveMinimalDependenciesInSubtree(childNode).map(
      ({ relativePath, accessType }) => {
        return {
          relativePath: [childName, ...relativePath],
          accessType,
        };
      }
    );
    results.push(...childResult);
  }

  switch (dep.accessType) {
    case PropertyAccessType.UnconditionalDependency: {
      return promoteUncondResult;
    }
    case PropertyAccessType.UnconditionalAccess: {
      if (
        results.every(
          ({ accessType }) =>
            accessType === PropertyAccessType.UnconditionalDependency
        )
      ) {
        // all children are unconditional dependencies, return them to preserve granularity
        return results;
      } else {
        // at least one child is accessed conditionally, so this node needs to be promoted to
        // unconditional dependency
        return promoteUncondResult;
      }
    }
    case PropertyAccessType.ConditionalAccess:
    case PropertyAccessType.ConditionalDependency: {
      if (
        results.every(
          ({ accessType }) =>
            accessType === PropertyAccessType.ConditionalDependency
        )
      ) {
        // No children are accessed unconditionally, so we cannot promote this node to
        // unconditional access.
        // Truncate results of child nodes here, since we shouldn't access them anyways
        return promoteCondResult;
      } else {
        // at least one child is accessed unconditionally, so this node can be promoted to
        // unconditional dependency
        return promoteUncondResult;
      }
    }
    default: {
      assertExhaustive(
        dep.accessType,
        "[PropgateScopeDependencies] Unhandled access type!"
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
  initialDeps: Set<ReactiveScopeDependencyInfo>
): Set<ReactiveScopeDependency> {
  const depRoots = new Map<Identifier, DependencyNode>();

  for (const dep of initialDeps) {
    let root = depRoots.get(dep.identifier);
    const path = dep.path ?? [];
    if (root == null) {
      // roots can always be accessed unconditionally in JS
      root = {
        properties: new Map(),
        accessType: PropertyAccessType.UnconditionalAccess,
      };
      depRoots.set(dep.identifier, root);
    }
    let currNode: DependencyNode = root;

    const accessType = dep.cond
      ? PropertyAccessType.ConditionalAccess
      : PropertyAccessType.UnconditionalAccess;
    const depType = dep.cond
      ? PropertyAccessType.ConditionalDependency
      : PropertyAccessType.UnconditionalDependency;

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
  for (const [root, rootNode] of depRoots.entries()) {
    const deps = deriveMinimalDependenciesInSubtree(rootNode);
    invariant(
      deps.every(
        (dep) => dep.accessType === PropertyAccessType.UnconditionalDependency
      ),
      "[PropagateScopeDependencies] All dependencies must be reduced to unconditional dependencies."
    );

    for (const dep of deps) {
      results.add({
        identifier: root,
        path: dep.relativePath,
      });
    }
  }

  return results;
}

class Context {
  #declarations: DeclMap = new Map();
  #reassignments: Map<Identifier, Decl> = new Map();
  #dependencies: Set<ReactiveScopeDependencyInfo> = new Set();
  #properties: Map<Identifier, ReactiveScopeDependencyInfo> = new Map();
  #temporaries: Map<Identifier, Place> = new Map();
  #inConditionalWithinScope: boolean = false;
  #scopes: Scopes = [];

  enter(scope: ReactiveScope, fn: () => void): Set<ReactiveScopeDependency> {
    // Save context of previous scope
    const prevInConditional = this.#inConditionalWithinScope;
    const previousDependencies = this.#dependencies;

    // Set context for new scope
    // A nested scope should add all deps it directly uses as its own
    // unconditional deps, regardless of whether the nested scope is itself
    // within a conditional
    const scopedDependencies = new Set<ReactiveScopeDependencyInfo>();
    this.#inConditionalWithinScope = false;
    this.#dependencies = scopedDependencies;
    this.#scopes.push(scope);

    fn();

    // Restore context of previous scope
    this.#scopes.pop();
    this.#dependencies = previousDependencies;
    this.#inConditionalWithinScope = prevInConditional;

    const minScopeDependencies = deriveMinimalDependencies(scopedDependencies);
    // propagate dependencies upward using the same rules as normal dependency
    // collection. child scopes may have dependencies on values created within
    // the outer scope, which necessarily cannot be dependencies of the outer
    // scope
    for (const dep of minScopeDependencies) {
      this.visitDependency({ ...dep, cond: this.#inConditionalWithinScope });
    }
    return minScopeDependencies;
  }

  enterConditional(fn: () => void): void {
    const prevInConditional = this.#inConditionalWithinScope;
    this.#inConditionalWithinScope = true;
    fn();
    this.#inConditionalWithinScope = prevInConditional;
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
    let nextDependency: ReactiveScopeDependencyInfo;
    if (objectDependency === undefined) {
      nextDependency = {
        identifier: resolvedObject.identifier,
        path: [property],
        cond: this.#inConditionalWithinScope,
      };
    } else {
      nextDependency = {
        identifier: objectDependency.identifier,
        path: [...(objectDependency.path ?? []), property],
        cond: this.#inConditionalWithinScope,
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
    this.visitDependency({
      identifier: resolved.identifier,
      path: null,
      cond: this.#inConditionalWithinScope,
    });
  }

  visitProperty(object: Place, property: string): void {
    const resolvedObject = this.#temporaries.get(object.identifier) ?? object;
    const objectDependency = this.#properties.get(resolvedObject.identifier);
    let nextDependency: ReactiveScopeDependencyInfo;
    if (objectDependency === undefined) {
      nextDependency = {
        identifier: resolvedObject.identifier,
        path: [property],
        cond: this.#inConditionalWithinScope,
      };
    } else {
      nextDependency = {
        identifier: objectDependency.identifier,
        path: [...(objectDependency.path ?? []), property],
        cond: this.#inConditionalWithinScope,
      };
    }
    this.visitDependency(nextDependency);
  }

  visitDependency(dependency: ReactiveScopeDependencyInfo): void {
    let maybeDependency: ReactiveScopeDependencyInfo;
    if (dependency.path !== null) {
      // Operands may have memberPaths when propagating depenencies of an inner scope upward
      // In this case we use the dependency as-is
      maybeDependency = dependency;
    } else {
      // Otherwise if this operand is a temporary created for a property load, resolve it to
      // the expanded Place. Fall back to using the operand as-is.
      let propDep = this.#properties.get(dependency.identifier);
      if (dependency.identifier.name === null && propDep !== undefined) {
        maybeDependency = { ...propDep, cond: dependency.cond };
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
        currentDeclaration.scope !== currentScope)
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
            context.enterConditional(() => {
              visitReactiveValue(context, terminal.update);
              visit(context, terminal.loop);
            });
            break;
          }
          case "while": {
            visitReactiveValue(context, terminal.test);
            context.enterConditional(() => {
              visit(context, terminal.loop);
            });
            break;
          }
          case "if": {
            context.visitOperand(terminal.test);
            /**
             * TODO: Track dependencies always accessed within consequent and ones
             * always accessed within alternate. If a dependency is always accessed in
             * both, we can promote it to an unconditional dependency.
             *
             * e.g. props.a.b is unconditionally accessed here.
             *  if (foo(...)) {
             *    access(props.a.b);
             *  } else {
             *    access(props.a.b);
             *  }
             *
             * To deal with nested if-branches, enterConditional should return a list
             * of dependencies unconditionally accessed within the callback.
             */
            context.enterConditional(() => {
              visit(context, terminal.consequent);
              if (terminal.alternate !== null) {
                visit(context, terminal.alternate);
              }
            });
            break;
          }
          case "switch": {
            context.visitOperand(terminal.test);
            context.enterConditional(() => {
              for (const case_ of terminal.cases) {
                if (case_.block !== undefined) {
                  visit(context, case_.block);
                }
              }
            });
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

      context.enterConditional(() => {
        visitReactiveValue(context, value.right);
      });
      break;
    }
    case "ConditionalExpression": {
      visitReactiveValue(context, value.test);

      context.enterConditional(() => {
        visitReactiveValue(context, value.consequent);
        visitReactiveValue(context, value.alternate);
      });
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
  if (value.kind === "LoadLocal" && lvalue !== null) {
    if (
      value.place.identifier.name !== null &&
      lvalue.place.identifier.name === null
    ) {
      context.declareTemporary(lvalue.place, value.place);
    } else {
      context.visitOperand(value.place);
    }
  } else if (value.kind === "PropertyLoad") {
    if (lvalue !== null) {
      context.declareProperty(lvalue.place, value.object, value.property);
    } else {
      context.visitProperty(value.object, value.property);
    }
  } else {
    visitReactiveValue(context, value);
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
