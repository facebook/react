// @flow

import {
  __DEBUG__,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_RESET_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from 'src/constants';
import { utfDecodeString } from 'src/utils';
import { ElementTypeRoot } from 'src/devtools/types';
import Store from 'src/devtools/store';

import type { ElementType } from 'src/devtools/types';
import type {
  CommitTree,
  Node,
  ProfilingSummary as ProfilingSummaryFrontend,
} from 'src/devtools/views/Profiler/types';

const debug = (methodName, ...args) => {
  if (__DEBUG__) {
    console.log(
      `%cCommitTreeBuilder %c${methodName}`,
      'color: pink; font-weight: bold;',
      'font-weight: bold;',
      ...args
    );
  }
};

const rootToCommitTreeMap: Map<number, Array<CommitTree>> = new Map();

export function getCommitTree({
  commitIndex,
  profilingSummary,
  rendererID,
  rootID,
  store,
}: {|
  commitIndex: number,
  profilingSummary: ProfilingSummaryFrontend,
  rendererID: number,
  rootID: number,
  store: Store,
|}): CommitTree {
  if (store.profilingSnapshot.has(rootID)) {
    if (!rootToCommitTreeMap.has(rootID)) {
      rootToCommitTreeMap.set(rootID, []);
    }

    const commitTrees = ((rootToCommitTreeMap.get(
      rootID
    ): any): Array<CommitTree>);

    if (commitIndex < commitTrees.length) {
      return commitTrees[commitIndex];
    }

    // Commits are generated sequentially and cached.
    // If this is the very first commit, start with the cached snapshot and apply the first mutation.
    // Otherwise load (or generate) the previous commit and append a mutation to it.
    if (commitIndex === 0) {
      const nodes = new Map();

      // Construct the initial tree.
      recursivelyIniitliazeTree(
        rootID,
        0,
        nodes,
        profilingSummary.initialTreeBaseDurations,
        store
      );

      // Mutate the tree
      const commitOperations = store.profilingOperations.get(rootID);
      if (commitOperations != null && commitIndex < commitOperations.length) {
        const commitTree = updateTree(
          { nodes, rootID },
          commitOperations[commitIndex]
        );

        if (__DEBUG__) {
          __printTree(commitTree);
        }

        commitTrees.push(commitTree);
        return commitTree;
      }
    } else {
      const previousCommitTree = getCommitTree({
        commitIndex: commitIndex - 1,
        profilingSummary,
        rendererID,
        rootID,
        store,
      });
      const commitOperations = store.profilingOperations.get(rootID);
      if (commitOperations != null && commitIndex < commitOperations.length) {
        const commitTree = updateTree(
          previousCommitTree,
          commitOperations[commitIndex]
        );

        if (__DEBUG__) {
          __printTree(commitTree);
        }

        commitTrees.push(commitTree);
        return commitTree;
      }
    }
  }

  // TODO (profiling) Should I throw here? Is this ever expected?
  return {
    nodes: new Map(),
    rootID,
  };
}

function recursivelyIniitliazeTree(
  id: number,
  parentID: number,
  nodes: Map<number, Node>,
  initialTreeBaseDurations: Map<number, number>,
  store: Store
): void {
  const node = ((store.profilingSnapshot.get(id): any): Node);

  nodes.set(id, {
    id,
    children: node.children,
    displayName: node.displayName,
    key: node.key,
    parentID,
    treeBaseDuration: ((initialTreeBaseDurations.get(id): any): number),
  });

  node.children.forEach(childID =>
    recursivelyIniitliazeTree(
      childID,
      id,
      nodes,
      initialTreeBaseDurations,
      store
    )
  );
}

function updateTree(
  commitTree: CommitTree,
  operations: Uint32Array
): CommitTree {
  // Clone the original tree so edits don't affect it.
  const nodes = new Map(commitTree.nodes);

  // Clone nodes before mutating them so edits don't affect them.
  const getClonedNode = (id: number): Node => {
    const clonedNode = ((Object.assign({}, nodes.get(id)): any): Node);
    nodes.set(id, clonedNode);
    return clonedNode;
  };

  let i = 2;
  while (i < operations.length) {
    let id: number = ((null: any): number);
    let node: Node = ((null: any): Node);
    let parentID: number = ((null: any): number);
    let parentNode: Node = ((null: any): Node);
    let type: ElementType = ((null: any): ElementType);

    const operation = operations[i];

    switch (operation) {
      case TREE_OPERATION_ADD:
        id = ((operations[i + 1]: any): number);
        type = ((operations[i + 2]: any): ElementType);

        i = i + 3;

        if (type === ElementTypeRoot) {
          // No-op
        } else {
          parentID = ((operations[i]: any): number);
          i++;

          i++; // ownerID

          const displayNameLength = operations[i];
          i++;
          const displayName =
            displayNameLength === 0
              ? null
              : utfDecodeString(
                  (operations.slice(i, i + displayNameLength): any)
                );
          i += displayNameLength;

          const keyLength = operations[i];
          i++;
          const key =
            keyLength === 0
              ? null
              : utfDecodeString((operations.slice(i, i + keyLength): any));
          i += +keyLength;

          if (nodes.has(id)) {
            // The renderer's tree walking approach sometimes mounts the same Fiber twice with Suspense and Lazy.
            // For now, we avoid adding it to the tree twice by checking if it's already been mounted.
            // Maybe in the future we'll revisit this.
          } else {
            parentNode = getClonedNode(parentID);
            parentNode.children = parentNode.children.concat(id);

            debug(
              'Add',
              `fiber ${id} (${displayName || 'null'}) as child of ${parentID}`
            );

            const node: Node = {
              children: [],
              displayName,
              id,
              key,
              parentID,
              treeBaseDuration: 0, // This will be updated by a subsequent operation
            };

            nodes.set(id, node);
          }
        }
        break;
      case TREE_OPERATION_REMOVE:
        id = ((operations[i + 1]: any): number);

        i = i + 2;

        node = getClonedNode(id);
        parentID = node.parentID;

        nodes.delete(id);

        parentNode = getClonedNode(parentID);
        if (parentNode == null) {
          // No-op
        } else {
          debug('Remove', `fiber ${id} from parent ${parentID}`);

          parentNode.children = parentNode.children.filter(
            childID => childID !== id
          );
        }
        break;
      case TREE_OPERATION_RESET_CHILDREN:
        id = ((operations[i + 1]: any): number);
        const numChildren = ((operations[i + 2]: any): number);
        const children = ((operations.slice(
          i + 3,
          i + 3 + numChildren
        ): any): Array<number>);

        i = i + 3 + numChildren;

        debug('Re-order', `fiber ${id} children ${children.join(',')}`);

        node = getClonedNode(id);
        node.children = Array.from(children);

        break;
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
        id = operations[i + 1];

        node = getClonedNode(id);
        node.treeBaseDuration = operations[i + 2] / 1000; // Convert microseconds back to milliseconds;

        debug(
          'Update',
          `fiber ${id} treeBaseDuration to ${node.treeBaseDuration}`
        );

        i = i + 3;
        break;
      default:
        throw Error(`Unsupported Bridge operation ${operation}`);
    }
  }

  return {
    nodes,
    rootID: commitTree.rootID,
  };
}

export function invalidateCommitTrees(): void {
  rootToCommitTreeMap.clear();
}

// DEBUG
const __printTree = (commitTree: CommitTree) => {
  if (__DEBUG__) {
    const { nodes, rootID } = commitTree;
    console.group('__printTree()');
    const queue = [rootID, 0];
    while (queue.length > 0) {
      const id = queue.shift();
      const depth = queue.shift();

      const node = ((nodes.get(id): any): Node);

      console.log(
        `${'•'.repeat(depth)}${node.id}:${node.displayName || ''} ${
          node.key ? `key:"${node.key}"` : ''
        } (${node.treeBaseDuration})`
      );

      node.children.forEach(childID => {
        queue.push(childID, depth + 1);
      });
    }
    console.groupEnd();
  }
};
