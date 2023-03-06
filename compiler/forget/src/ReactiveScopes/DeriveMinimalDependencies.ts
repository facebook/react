import invariant from "invariant";
import { Identifier, IdentifierId, ReactiveScopeDependency } from "../HIR";
import { assertExhaustive } from "../Utils/utils";

export type ReactiveScopeDependencyInfo = ReactiveScopeDependency & {
  cond: boolean;
};

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
export class ReactiveScopeDependencyTree {
  #roots: Map<Identifier, DependencyNode> = new Map();

  add(dep: ReactiveScopeDependencyInfo) {
    let root = this.#roots.get(dep.identifier);
    const path = dep.path ?? [];
    if (root == null) {
      // roots can always be accessed unconditionally in JS
      root = {
        properties: new Map(),
        accessType: PropertyAccessType.UnconditionalAccess,
      };
      this.#roots.set(dep.identifier, root);
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

  deriveMinimalDependencies(): Set<ReactiveScopeDependency> {
    const results = new Set<ReactiveScopeDependency>();
    for (const [rootId, rootNode] of this.#roots.entries()) {
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
