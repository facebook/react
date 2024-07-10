/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import { GeneratedSource, Identifier, ReactiveScopeDependency } from "../HIR";
import { printIdentifier } from "../HIR/PrintHIR";
import { ReactiveScopePropertyDependency } from "../ReactiveScopes/DeriveMinimalDependencies";

const ENABLE_DEBUG_INVARIANTS = true;

/*
 * Finalizes a set of ReactiveScopeDependencies to produce a set of minimal unconditional
 * dependencies, preserving granular accesses when possible.
 *
 * Correctness properties:
 *   - All dependencies to a ReactiveBlock must be tracked.
 *     We can always truncate a dependency's path to a subpath, due to Forget assuming
 *     deep immutability. If the value produced by a subpath has not changed, then
 *     dependency must have not changed.
 *     i.e. props.a === $[..] implies props.a.b === $[..]
 *
 *     Note the inverse is not true, but this only means a false positive (we run the
 *     reactive block more than needed).
 *     i.e. props.a !== $[..] does not imply props.a.b !== $[..]
 *
 *   - The dependencies of a finalized ReactiveBlock must be all safe to access
 *     unconditionally (i.e. preserve program semantics with respect to nullthrows).
 *     If a dependency is only accessed within a conditional, we must track the nearest
 *     unconditionally accessed subpath instead.
 * @param initialDeps
 * @returns
 */
export class ReactiveScopeDependencyTreeHIR {
  #roots: Map<Identifier, DependencyNode> = new Map();

  #getOrCreateRoot(identifier: Identifier, isNonNull: boolean): DependencyNode {
    // roots can always be accessed unconditionally in JS
    let rootNode = this.#roots.get(identifier);

    if (rootNode === undefined) {
      rootNode = {
        properties: new Map(),
        accessType: isNonNull
          ? PropertyAccessType.NonNullAccess
          : PropertyAccessType.MaybeNullAccess,
      };
      this.#roots.set(identifier, rootNode);
    }
    return rootNode;
  }

  addDependency(dep: ReactiveScopePropertyDependency): void {
    const { path, optionalPath } = dep;
    let currNode = this.#getOrCreateRoot(dep.identifier, false);

    const accessType = PropertyAccessType.MaybeNullAccess;

    currNode.accessType = merge(currNode.accessType, accessType);

    for (const property of path) {
      // all properties read 'on the way' to a dependency are marked as 'access'
      let currChild = getOrMakeProperty(currNode, property);
      currChild.accessType = merge(currChild.accessType, accessType);
      currNode = currChild;
    }

    if (optionalPath.length === 0) {
      /*
       * If this property does not have a conditional path (i.e. a.b.c), the
       * final property node should be marked as an conditional/unconditional
       * `dependency` as based on control flow.
       */
      currNode.accessType = merge(
        currNode.accessType,
        PropertyAccessType.MaybeNullDependency
      );
    } else {
      /*
       * Technically, we only depend on whether unconditional path `dep.path`
       * is nullish (not its actual value). As long as we preserve the nullthrows
       * behavior of `dep.path`, we can keep it as an access (and not promote
       * to a dependency).
       * See test `reduce-reactive-cond-memberexpr-join` for example.
       */

      /*
       * If this property has an optional path (i.e. a?.b.c), all optional
       * nodes should be marked accordingly.
       */
      for (const property of optionalPath) {
        let currChild = getOrMakeProperty(currNode, property);
        currChild.accessType = merge(
          currChild.accessType,
          PropertyAccessType.MaybeNullAccess
        );
        currNode = currChild;
      }

      // The final node should be marked as a conditional dependency.
      currNode.accessType = merge(
        currNode.accessType,
        PropertyAccessType.MaybeNullDependency
      );
    }
  }

  markNodesNonNull(dep: ReactiveScopePropertyDependency): void {
    const accessType = PropertyAccessType.NonNullAccess;
    let currNode = this.#roots.get(dep.identifier);

    let cursor = 0;
    while (currNode != null && cursor < dep.path.length) {
      currNode.accessType = merge(currNode.accessType, accessType);
      currNode = currNode.properties.get(dep.path[cursor++]);
    }
    if (currNode != null) {
      currNode.accessType = merge(currNode.accessType, accessType);
    }
  }
  /**
   * Derive a set of minimal dependencies that are safe to
   * access unconditionally (with respect to nullthrows behavior)
   */
  deriveMinimalDependencies(): Set<ReactiveScopeDependency> {
    const results = new Set<ReactiveScopeDependency>();
    for (const [rootId, rootNode] of this.#roots.entries()) {
      if (ENABLE_DEBUG_INVARIANTS) {
        assertWellFormedTree(rootNode);
      }
      const deps = deriveMinimalDependenciesInSubtree(rootNode, []);

      for (const dep of deps) {
        results.add({
          identifier: rootId,
          path: dep.path,
        });
      }
    }

    return results;
  }

  /*
   * Prints dependency tree to string for debugging.
   * @param includeAccesses
   * @returns string representation of DependencyTree
   */
  printDeps(includeAccesses: boolean): string {
    let res: Array<Array<string>> = [];

    for (const [rootId, rootNode] of this.#roots.entries()) {
      const rootResults = printSubtree(rootNode, includeAccesses).map(
        (result) => `${printIdentifier(rootId)}.${result}`
      );
      res.push(rootResults);
    }
    return res.flat().join("\n");
  }
}

enum PropertyAccessType {
  MaybeNullAccess = "MaybeNullAccess",
  NonNullAccess = "NonNullAccess",
  MaybeNullDependency = "MaybeNullDependency",
  NonNullDependency = "NonNullDependency",
}

const MIN_ACCESS_TYPE = PropertyAccessType.MaybeNullAccess;
function isNonNull(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.NonNullAccess ||
    access === PropertyAccessType.NonNullDependency
  );
}
function isDependency(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.MaybeNullDependency ||
    access === PropertyAccessType.NonNullDependency
  );
}

function merge(
  access1: PropertyAccessType,
  access2: PropertyAccessType
): PropertyAccessType {
  const resultIsNonNull = isNonNull(access1) || isNonNull(access2);
  const resultIsDependency = isDependency(access1) || isDependency(access2);

  /*
   * Straightforward merge.
   * This can be represented as bitwise OR, but is written out for readability
   *
   * Observe that `NonNullAccess | MaybeNullDependency` produces an
   * unconditionally accessed conditional dependency. We currently use these
   * as we use unconditional dependencies. (i.e. to codegen change variables)
   */
  if (resultIsNonNull) {
    if (resultIsDependency) {
      return PropertyAccessType.NonNullDependency;
    } else {
      return PropertyAccessType.NonNullAccess;
    }
  } else {
    if (resultIsDependency) {
      return PropertyAccessType.MaybeNullDependency;
    } else {
      return PropertyAccessType.MaybeNullAccess;
    }
  }
}

type DependencyNode = {
  properties: Map<string, DependencyNode>;
  accessType: PropertyAccessType;
};

type ReduceResultNode = {
  path: Array<string>;
};
function assertWellFormedTree(node: DependencyNode): void {
  let nonNullInChildren = false;
  for (const childNode of node.properties.values()) {
    assertWellFormedTree(childNode);
    nonNullInChildren ||= isNonNull(childNode.accessType);
  }
  if (nonNullInChildren) {
    CompilerError.invariant(isNonNull(node.accessType), {
      reason:
        "[DeriveMinimialDependencies] Not well formed tree, unexpected nonnull node",
      description: node.accessType,
      loc: GeneratedSource,
    });
  }
}
function deriveMinimalDependenciesInSubtree(
  node: DependencyNode,
  path: Array<string>
): Array<ReduceResultNode> {
  if (isDependency(node.accessType)) {
    /**
     * If this node is a dependency, we truncate the subtree
     * and return this node. e.g. deps=[`obj.a`, `obj.a.b`]
     * reduces to deps=[`obj.a`]
     */
    return [{ path }];
  } else {
    if (isNonNull(node.accessType)) {
      /*
       * Only recurse into subtree dependencies if this node
       * is known to be non-null.
       */
      const result: Array<ReduceResultNode> = [];
      for (const [childName, childNode] of node.properties) {
        result.push(
          ...deriveMinimalDependenciesInSubtree(childNode, [...path, childName])
        );
      }
      return result;
    } else {
      /*
       * This only occurs when this subtree contains a dependency,
       * but this node is potentially nullish. As we currently
       * don't record optional property paths as scope dependencies,
       * we truncate and record this node as a dependency.
       */
      return [{ path }];
    }
  }
}

/*
 * Demote all unconditional accesses + dependencies in subtree to the
 * conditional equivalent, mutating subtree in place.
 * @param subtree unconditional node representing a subtree of dependencies
 */
function _demoteSubtreeToConditional(subtree: DependencyNode): void {
  const stack: Array<DependencyNode> = [subtree];

  let node;
  while ((node = stack.pop()) !== undefined) {
    const { accessType, properties } = node;
    if (!isNonNull(accessType)) {
      // A conditionally accessed node should not have unconditional children
      continue;
    }
    node.accessType = isDependency(accessType)
      ? PropertyAccessType.MaybeNullDependency
      : PropertyAccessType.MaybeNullAccess;

    for (const childNode of properties.values()) {
      if (isNonNull(accessType)) {
        /*
         * No conditional node can have an unconditional node as a child, so
         * we only process childNode if it is unconditional
         */
        stack.push(childNode);
      }
    }
  }
}

function printSubtree(
  node: DependencyNode,
  includeAccesses: boolean
): Array<string> {
  const results: Array<string> = [];
  for (const [propertyName, propertyNode] of node.properties) {
    if (includeAccesses || isDependency(propertyNode.accessType)) {
      results.push(`${propertyName} (${propertyNode.accessType})`);
    }
    const propertyResults = printSubtree(propertyNode, includeAccesses);
    results.push(
      ...propertyResults.map((result) => `${propertyName}.${result}`)
    );
  }
  return results;
}

function getOrMakeProperty(
  node: DependencyNode,
  property: string
): DependencyNode {
  let child = node.properties.get(property);
  if (child == null) {
    child = {
      properties: new Map(),
      accessType: MIN_ACCESS_TYPE,
    };
    node.properties.set(property, child);
  }
  return child;
}

function mapNonNull<T extends NonNullable<V>, V, U>(
  arr: Array<U>,
  fn: (arg0: U) => T | undefined | null
): Array<T> | null {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const element = fn(arr[i]);
    if (element) {
      result.push(element);
    } else {
      return null;
    }
  }
  return result;
}
