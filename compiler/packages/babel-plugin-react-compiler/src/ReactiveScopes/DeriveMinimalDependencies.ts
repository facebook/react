/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {DependencyPath, Identifier, ReactiveScopeDependency} from '../HIR';
import {printIdentifier} from '../HIR/PrintHIR';
import {assertExhaustive} from '../Utils/utils';

/*
 * We need to understand optional member expressions only when determining
 * dependencies of a ReactiveScope (i.e. in {@link PropagateScopeDependencies}),
 * hence why this type lives here (not in HIR.ts)
 */
export type ReactiveScopePropertyDependency = ReactiveScopeDependency;

/*
 * Enum representing the access type of single property on a parent object.
 * We distinguish on two independent axes:
 * Conditional / Unconditional:
 *    - whether this property is accessed unconditionally (within the ReactiveBlock)
 * Access / Dependency:
 *    - Access: this property is read on the path of a dependency. We do not
 *      need to track change variables for accessed properties. Tracking accesses
 *      helps Forget do more granular dependency tracking.
 *    - Dependency: this property is read as a dependency and we must track changes
 *      to it for correctness.
 *
 *    ```javascript
 *    // props.a is a dependency here and must be tracked
 *    deps: {props.a, props.a.b} ---> minimalDeps: {props.a}
 *    // props.a is just an access here and does not need to be tracked
 *    deps: {props.a.b} ---> minimalDeps: {props.a.b}
 *    ```
 */
enum PropertyAccessType {
  ConditionalAccess = 'ConditionalAccess',
  OptionalAccess = 'OptionalAccess',
  UnconditionalAccess = 'UnconditionalAccess',
  ConditionalDependency = 'ConditionalDependency',
  OptionalDependency = 'OptionalDependency',
  UnconditionalDependency = 'UnconditionalDependency',
}

const MIN_ACCESS_TYPE = PropertyAccessType.ConditionalAccess;

function isUnconditional(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.UnconditionalAccess ||
    access === PropertyAccessType.UnconditionalDependency
  );
}

function isDependency(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.ConditionalDependency ||
    access === PropertyAccessType.OptionalDependency ||
    access === PropertyAccessType.UnconditionalDependency
  );
}

function isOptional(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.OptionalAccess ||
    access === PropertyAccessType.OptionalDependency
  );
}

function merge(
  access1: PropertyAccessType,
  access2: PropertyAccessType,
): PropertyAccessType {
  const resultIsUnconditional =
    isUnconditional(access1) || isUnconditional(access2);
  const resultIsDependency = isDependency(access1) || isDependency(access2);
  const resultIsOptional = isOptional(access1) || isOptional(access2);
  /*
   * Straightforward merge.
   * This can be represented as bitwise OR, but is written out for readability
   *
   * Observe that `UnconditionalAccess | ConditionalDependency` produces an
   * unconditionally accessed conditional dependency. We currently use these
   * as we use unconditional dependencies. (i.e. to codegen change variables)
   */
  if (resultIsUnconditional) {
    if (resultIsDependency) {
      return PropertyAccessType.UnconditionalDependency;
    } else {
      return PropertyAccessType.UnconditionalAccess;
    }
  } else if (resultIsOptional) {
    if (resultIsDependency) {
      return PropertyAccessType.OptionalDependency;
    } else {
      return PropertyAccessType.OptionalAccess;
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
  relativePath: DependencyPath;
  accessType: PropertyAccessType;
};

function promoteResult(
  accessType: PropertyAccessType,
  path: {property: string; optional: boolean} | null,
): Array<ReduceResultNode> {
  if (path === null) {
    return [];
  }
  return [
    {
      relativePath: [path],
      accessType,
    },
  ];
}

function prependPath(
  results: Array<ReduceResultNode>,
  path: {property: string; optional: boolean} | null,
): Array<ReduceResultNode> {
  if (path === null) {
    return results;
  }
  return results.map(result => ({
    ...result,
    relativePath: [path, ...result.relativePath],
  }));
}

/*
 * Recursively calculates minimal dependencies in a subtree.
 * @param dep DependencyNode representing a dependency subtree.
 * @returns a minimal list of dependencies in this subtree.
 */
function deriveMinimalDependenciesInSubtree(
  dep: DependencyNode,
  property: string | null,
): Array<ReduceResultNode> {
  const results: Array<ReduceResultNode> = [];
  for (const [childName, childNode] of dep.properties) {
    const childResult = deriveMinimalDependenciesInSubtree(
      childNode,
      childName,
    );
    results.push(...childResult);
  }
  switch (dep.accessType) {
    case PropertyAccessType.UnconditionalDependency: {
      return promoteResult(
        PropertyAccessType.UnconditionalDependency,
        property !== null ? {property, optional: false} : null,
      );
    }
    case PropertyAccessType.UnconditionalAccess: {
      if (
        results.every(
          ({accessType}) =>
            accessType === PropertyAccessType.UnconditionalDependency ||
            accessType === PropertyAccessType.OptionalDependency,
        )
      ) {
        // all children are unconditional dependencies, return them to preserve granularity
        return prependPath(
          results,
          property !== null ? {property, optional: false} : null,
        );
      } else {
        // at least one child is accessed conditionally, so this node needs to be promoted to
        // unconditional dependency
        return promoteResult(
          PropertyAccessType.UnconditionalDependency,
          property !== null ? {property, optional: false} : null,
        );
      }
    }
    case PropertyAccessType.OptionalDependency: {
      return promoteResult(
        PropertyAccessType.OptionalDependency,
        property !== null ? {property, optional: true} : null,
      );
    }
    case PropertyAccessType.OptionalAccess: {
      if (
        results.every(
          ({accessType}) =>
            accessType === PropertyAccessType.UnconditionalDependency ||
            accessType === PropertyAccessType.OptionalDependency,
        )
      ) {
        // all children are unconditional dependencies, return them to preserve granularity
        return prependPath(
          results,
          property !== null ? {property, optional: true} : null,
        );
      } else {
        // at least one child is accessed conditionally, so this node needs to be promoted to
        // optional dependency
        return promoteResult(
          PropertyAccessType.OptionalDependency,
          property !== null ? {property, optional: true} : null,
        );
      }
    }
    case PropertyAccessType.ConditionalAccess:
    case PropertyAccessType.ConditionalDependency: {
      if (
        results.every(
          ({accessType}) =>
            accessType === PropertyAccessType.ConditionalDependency,
        )
      ) {
        // No children are accessed unconditionally, so we cannot promote this node to
        // unconditional access.
        return promoteResult(
          PropertyAccessType.ConditionalDependency,
          property !== null ? {property, optional: false} : null,
        );
      } else {
        // At least one child is accessed unconditionally, so this node needs to be promoted to
        // unconditional dependency
        return promoteResult(
          PropertyAccessType.UnconditionalDependency,
          property !== null ? {property, optional: false} : null,
        );
      }
    }
  }
}

function getOrMakeProperty(
  node: DependencyNode,
  property: string,
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
  fn: (arg0: U) => T | undefined | null,
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

export class ReactiveScopeDependencyTree {
  #roots: Map<Identifier, DependencyNode> = new Map();

  #getOrCreateRoot(identifier: Identifier): DependencyNode {
    // roots can always be accessed unconditionally in JS
    let rootNode = this.#roots.get(identifier);
    if (rootNode === undefined) {
      rootNode = {
        properties: new Map(),
        accessType: PropertyAccessType.UnconditionalAccess,
      };
      this.#roots.set(identifier, rootNode);
    }
    return rootNode;
  }

  add(dep: ReactiveScopePropertyDependency, inConditional: boolean): void {
    const {path} = dep;
    let currNode = this.#getOrCreateRoot(dep.identifier);
    for (const item of path) {
      // all properties read 'on the way' to a dependency are marked as 'access'
      let currChild = getOrMakeProperty(currNode, item.property);
      const accessType = inConditional
        ? PropertyAccessType.ConditionalAccess
        : item.optional
          ? PropertyAccessType.OptionalAccess
          : PropertyAccessType.UnconditionalAccess;
      currChild.accessType = merge(currChild.accessType, accessType);
      currNode = currChild;
    }
    // The final property node should be marked as an conditional/unconditional
    // `dependency` as based on control flow.
    const depType = inConditional
      ? PropertyAccessType.ConditionalDependency
      : isOptional(currNode.accessType)
        ? PropertyAccessType.OptionalDependency
        : PropertyAccessType.UnconditionalDependency;
    currNode.accessType = merge(currNode.accessType, depType);
  }

  deriveMinimalDependencies(): Set<ReactiveScopeDependency> {
    const results = new Set<ReactiveScopeDependency>();
    for (const [rootId, rootNode] of this.#roots.entries()) {
      const deps = deriveMinimalDependenciesInSubtree(rootNode, null);
      CompilerError.invariant(
        deps.every(
          dep =>
            dep.accessType === PropertyAccessType.UnconditionalDependency ||
            dep.accessType == PropertyAccessType.OptionalDependency,
        ),
        {
          reason:
            '[PropagateScopeDependencies] All dependencies must be reduced to unconditional dependencies.',
          description: null,
          loc: null,
          suggestions: null,
        },
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

  /*
   * Prints dependency tree to string for debugging.
   * @param includeAccesses
   * @returns string representation of DependencyTree
   */
  printDeps(includeAccesses: boolean): string {
    const buf: Array<string> = [];
    for (const [identifier, node] of this.#roots) {
      buf.push(`${printIdentifier(identifier)}:`);
      this.#debugImpl(buf, node, 1);
    }
    return buf.join('\n');
  }

  debug(): string {
    return this.printDeps(true);
  }

  #debugImpl(
    buf: Array<string>,
    node: DependencyNode,
    depth: number = 0,
  ): void {
    for (const [property, childNode] of node.properties) {
      buf.push(`${'  '.repeat(depth)}.${property} (${childNode.accessType}):`);
      this.#debugImpl(buf, childNode, depth + 1);
    }
  }
}