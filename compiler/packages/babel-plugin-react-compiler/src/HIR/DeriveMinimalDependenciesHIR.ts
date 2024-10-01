/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {GeneratedSource, Identifier, ReactiveScopeDependency} from '../HIR';
import {printIdentifier} from '../HIR/PrintHIR';
import {ReactiveScopePropertyDependency} from '../ReactiveScopes/DeriveMinimalDependencies';

const ENABLE_DEBUG_INVARIANTS = true;

/**
 * Simpler fork of DeriveMinimalDependencies, see PropagateScopeDependenciesHIR
 * for detailed explanation.
 */
export class ReactiveScopeDependencyTreeHIR {
  #roots: Map<Identifier, DependencyNode> = new Map();

  #getOrCreateRoot(
    identifier: Identifier,
    accessType: PropertyAccessType,
  ): DependencyNode {
    // roots can always be accessed unconditionally in JS
    let rootNode = this.#roots.get(identifier);

    if (rootNode === undefined) {
      rootNode = {
        properties: new Map(),
        accessType,
      };
      this.#roots.set(identifier, rootNode);
    }
    return rootNode;
  }

  addDependency(dep: ReactiveScopePropertyDependency): void {
    const {path} = dep;
    let currNode = this.#getOrCreateRoot(dep.identifier, MIN_ACCESS_TYPE);

    const accessType = PropertyAccessType.Access;

    currNode.accessType = merge(currNode.accessType, accessType);

    for (const property of path) {
      // all properties read 'on the way' to a dependency are marked as 'access'
      let currChild = makeOrMergeProperty(
        currNode,
        property.property,
        accessType,
      );
      currNode = currChild;
    }

    /*
     * If this property does not have a conditional path (i.e. a.b.c), the
     * final property node should be marked as an conditional/unconditional
     * `dependency` as based on control flow.
     */
    currNode.accessType = merge(
      currNode.accessType,
      PropertyAccessType.Dependency,
    );
  }

  markNodesNonNull(dep: ReactiveScopePropertyDependency): void {
    const accessType = PropertyAccessType.NonNullAccess;
    let currNode = this.#roots.get(dep.identifier);

    let cursor = 0;
    while (currNode != null && cursor < dep.path.length) {
      currNode.accessType = merge(currNode.accessType, accessType);
      currNode = currNode.properties.get(dep.path[cursor++].property);
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
          path: dep.path.map(s => ({property: s, optional: false})),
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
        result => `${printIdentifier(rootId)}.${result}`,
      );
      res.push(rootResults);
    }
    return res.flat().join('\n');
  }
}

enum PropertyAccessType {
  Access = 'Access',
  NonNullAccess = 'NonNullAccess',
  Dependency = 'Dependency',
  NonNullDependency = 'NonNullDependency',
}

const MIN_ACCESS_TYPE = PropertyAccessType.Access;
/**
 * "NonNull" means that PropertyReads from a node are side-effect free,
 * as the node is (1) immutable and (2) has unconditional propertyloads
 * somewhere in the cfg.
 */
function isNonNull(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.NonNullAccess ||
    access === PropertyAccessType.NonNullDependency
  );
}
function isDependency(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.Dependency ||
    access === PropertyAccessType.NonNullDependency
  );
}

function merge(
  access1: PropertyAccessType,
  access2: PropertyAccessType,
): PropertyAccessType {
  const resultisNonNull = isNonNull(access1) || isNonNull(access2);
  const resultIsDependency = isDependency(access1) || isDependency(access2);

  /*
   * Straightforward merge.
   * This can be represented as bitwise OR, but is written out for readability
   *
   * Observe that `NonNullAccess | Dependency` produces an
   * unconditionally accessed conditional dependency. We currently use these
   * as we use unconditional dependencies. (i.e. to codegen change variables)
   */
  if (resultisNonNull) {
    if (resultIsDependency) {
      return PropertyAccessType.NonNullDependency;
    } else {
      return PropertyAccessType.NonNullAccess;
    }
  } else {
    if (resultIsDependency) {
      return PropertyAccessType.Dependency;
    } else {
      return PropertyAccessType.Access;
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
        '[DeriveMinimialDependencies] Not well formed tree, unexpected non-null node',
      description: node.accessType,
      loc: GeneratedSource,
    });
  }
}

function deriveMinimalDependenciesInSubtree(
  node: DependencyNode,
  path: Array<string>,
): Array<ReduceResultNode> {
  if (isDependency(node.accessType)) {
    /**
     * If this node is a dependency, we truncate the subtree
     * and return this node. e.g. deps=[`obj.a`, `obj.a.b`]
     * reduces to deps=[`obj.a`]
     */
    return [{path}];
  } else {
    if (isNonNull(node.accessType)) {
      /*
       * Only recurse into subtree dependencies if this node
       * is known to be non-null.
       */
      const result: Array<ReduceResultNode> = [];
      for (const [childName, childNode] of node.properties) {
        result.push(
          ...deriveMinimalDependenciesInSubtree(childNode, [
            ...path,
            childName,
          ]),
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
      return [{path}];
    }
  }
}

function printSubtree(
  node: DependencyNode,
  includeAccesses: boolean,
): Array<string> {
  const results: Array<string> = [];
  for (const [propertyName, propertyNode] of node.properties) {
    if (includeAccesses || isDependency(propertyNode.accessType)) {
      results.push(`${propertyName} (${propertyNode.accessType})`);
    }
    const propertyResults = printSubtree(propertyNode, includeAccesses);
    results.push(...propertyResults.map(result => `${propertyName}.${result}`));
  }
  return results;
}

function makeOrMergeProperty(
  node: DependencyNode,
  property: string,
  accessType: PropertyAccessType,
): DependencyNode {
  let child = node.properties.get(property);
  if (child == null) {
    child = {
      properties: new Map(),
      accessType,
    };
    node.properties.set(property, child);
  } else {
    child.accessType = merge(child.accessType, accessType);
  }
  return child;
}
