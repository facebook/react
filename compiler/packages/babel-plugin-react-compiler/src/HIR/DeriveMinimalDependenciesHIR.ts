/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {
  DependencyPath,
  GeneratedSource,
  Identifier,
  ReactiveScopeDependency,
} from '../HIR';
import {printIdentifier} from '../HIR/PrintHIR';
import {ReactiveScopePropertyDependency} from '../ReactiveScopes/DeriveMinimalDependencies';
import {assertExhaustive} from '../Utils/utils';

/**
 * Simpler fork of DeriveMinimalDependencies, see PropagateScopeDependenciesHIR
 * for detailed explanation.
 */
export class ReactiveScopeDependencyTreeHIR {
  #hoistables: Map<Identifier, HoistableNode> = new Map();
  #roots: Map<Identifier, DependencyNode> = new Map();

  constructor(hoistableObjects: Iterable<ReactiveScopeDependency>) {
    for (const {path, identifier} of hoistableObjects) {
      // Add unconditional / optional access
      let currNode = ReactiveScopeDependencyTreeHIR.#getOrCreateRoot(
        identifier,
        this.#hoistables,
        path.length > 0 && path[0].optional ? 'Optional' : 'NonNull',
      );

      for (let i = 0; i < path.length; i++) {
        // all properties read 'on the way' to a dependency are marked as 'access'
        const prevAccessType = currNode.properties.get(
          path[i].property,
        )?.accessType;
        const accessType =
          i + 1 < path.length && path[i + 1].optional ? 'Optional' : 'NonNull';
        CompilerError.invariant(
          prevAccessType == null || prevAccessType === accessType,
          {
            reason: 'Conflicting access types2!',
            loc: GeneratedSource,
          },
        );
        let nextNode = currNode.properties.get(path[i].property);
        if (nextNode == null) {
          nextNode = {
            properties: new Map(),
            accessType,
          };
          currNode.properties.set(path[i].property, nextNode);
        }
        currNode = nextNode;
      }
    }
  }

  static #getOrCreateRoot<T extends string>(
    identifier: Identifier,
    roots: Map<Identifier, TreeNode<T>>,
    defaultAccessType: T,
  ): TreeNode<T> {
    // roots can always be accessed unconditionally in JS
    let rootNode = roots.get(identifier);

    if (rootNode === undefined) {
      rootNode = {
        properties: new Map(),
        accessType: defaultAccessType,
      };
      roots.set(identifier, rootNode);
    }
    return rootNode;
  }

  /**
   * Add to a different tree
   */
  addDependency(dep: ReactiveScopePropertyDependency): void {
    const {identifier, path} = dep;
    let depCursor = ReactiveScopeDependencyTreeHIR.#getOrCreateRoot(
      identifier,
      this.#roots,
      PropertyAccessType.UnconditionalAccess,
    );
    // null if depCursor is not known to be an object we can hoist property reads from
    // otherwise, it represents the same node in the hoistable / cfg-informed tree
    let hoistableCursor: HoistableNode | undefined =
      this.#hoistables.get(identifier);

    // mark the correct node as a dependency
    for (const item of path) {
      let nextHoistableCursor: HoistableNode | undefined;
      let nextDepCursor: DependencyNode;
      // all properties read 'on the way' to a dependency are marked as 'access'
      if (item.optional) {
        // no need to check the access type since we can match both optional or non-optionals
        // in the hoistable
        // e.g. a?.b<rest> is hoistable if a.b<rest> is hoistable
        if (hoistableCursor != null) {
          // && hoistableCursor.properties.get(item.property)?.accessType)
          nextHoistableCursor = hoistableCursor?.properties.get(item.property);
        }

        // say the dep is `a?.b`
        // if the hoistable tree only contains `a`, we can keep either `a?.b` or 'a.b' as a dependency
        //   (note that we currently do the latter for perf, although we can do the former)
        let accessType;
        if (
          hoistableCursor != null &&
          hoistableCursor.accessType === 'NonNull'
        ) {
          accessType = PropertyAccessType.UnconditionalAccess;
        } else {
          accessType = PropertyAccessType.OptionalAccess;
        }
        nextDepCursor = makeOrMergeProperty(
          depCursor,
          item.property,
          accessType,
        );
      } else {
        if (
          hoistableCursor != null &&
          hoistableCursor.accessType === 'NonNull'
        ) {
          // not optional and unconditional PropertyLoad is hoistable
          nextHoistableCursor = hoistableCursor.properties.get(item.property);
          nextDepCursor = makeOrMergeProperty(
            depCursor,
            item.property,
            PropertyAccessType.UnconditionalAccess,
          );
        } else {
          break;
        }
      }
      depCursor = nextDepCursor;
      hoistableCursor = nextHoistableCursor;
    }
    depCursor.accessType = merge(
      depCursor.accessType,
      PropertyAccessType.OptionalDependency,
    );
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
    let res = [];

    for (const [rootId, rootNode] of this.#roots.entries()) {
      const rootResults = printSubtree(rootNode, includeAccesses).map(
        result => `${printIdentifier(rootId)}.${result}`,
      );
      res.push(rootResults);
    }
    return res.flat().join('\n');
  }

  static debug<T extends string>(roots: Map<Identifier, TreeNode<T>>): string {
    const buf: Array<string> = [`tree() [`];
    for (const [rootId, rootNode] of roots) {
      buf.push(`${printIdentifier(rootId)} (${rootNode.accessType}):`);
      this.#debugImpl(buf, rootNode, 1);
    }
    buf.push(']');
    return buf.length > 2 ? buf.join('\n') : buf.join('');
  }

  static #debugImpl<T extends string>(
    buf: Array<string>,
    node: TreeNode<T>,
    depth: number = 0,
  ): void {
    for (const [property, childNode] of node.properties) {
      buf.push(`${'  '.repeat(depth)}.${property} (${childNode.accessType}):`);
      this.#debugImpl(buf, childNode, depth + 1);
    }
  }
}

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
  OptionalAccess = 'OptionalAccess',
  UnconditionalAccess = 'UnconditionalAccess',
  OptionalDependency = 'OptionalDependency',
  UnconditionalDependency = 'UnconditionalDependency',
}

function isUnconditional(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.UnconditionalAccess ||
    access === PropertyAccessType.UnconditionalDependency
  );
}
function isDependency(access: PropertyAccessType): boolean {
  return (
    access === PropertyAccessType.OptionalDependency ||
    access === PropertyAccessType.UnconditionalDependency
  );
}

function merge(
  access1: PropertyAccessType,
  access2: PropertyAccessType,
): PropertyAccessType {
  const resultIsUnconditional =
    isUnconditional(access1) || isUnconditional(access2);
  const resultIsDependency = isDependency(access1) || isDependency(access2);

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
  } else {
    // result is optional
    if (resultIsDependency) {
      return PropertyAccessType.OptionalDependency;
    } else {
      return PropertyAccessType.OptionalAccess;
    }
  }
}

type TreeNode<T extends string> = {
  properties: Map<string, TreeNode<T>>;
  accessType: T;
};
type HoistableNode = TreeNode<'Optional' | 'NonNull'>;
type DependencyNode = TreeNode<PropertyAccessType>;

type ReduceResultNode = {
  relativePath: DependencyPath;
  accessType: PropertyAccessType;
};

function promoteResult(
  accessType: PropertyAccessType,
  path: {property: string; optional: boolean} | null,
): Array<ReduceResultNode> {
  const result: ReduceResultNode = {
    relativePath: [],
    accessType,
  };
  if (path !== null) {
    result.relativePath.push(path);
  }
  return [result];
}

function prependPath(
  results: Array<ReduceResultNode>,
  path: {property: string; optional: boolean} | null,
): Array<ReduceResultNode> {
  if (path === null) {
    return results;
  }
  return results.map(result => {
    return {
      accessType: result.accessType,
      relativePath: [path, ...result.relativePath],
    };
  });
}

/**
 * TODO: simplify
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
        CompilerError.invariant(false, {
          reason: 'Unexpected conditional child',
          loc: GeneratedSource,
        });
        // /*
        //  * at least one child is accessed conditionally, so this node needs to be promoted to
        //  * unconditional dependency
        //  */
        // return promoteResult(
        //   PropertyAccessType.UnconditionalDependency,
        //   property !== null ? {property, optional: false} : null,
        // );
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
        /*
         * at least one child is accessed conditionally, so this node needs to be promoted to
         * unconditional dependency
         */
        return promoteResult(
          PropertyAccessType.OptionalDependency,
          property !== null ? {property, optional: true} : null,
        );
      }
    }
    default: {
      assertExhaustive(
        dep.accessType,
        '[PropgateScopeDependencies] Unhandled access type!',
      );
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
