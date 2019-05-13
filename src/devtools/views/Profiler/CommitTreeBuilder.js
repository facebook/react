// @flow

import {
  __DEBUG__,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from 'src/constants';
import { utfDecodeString } from 'src/utils';
import { ElementTypeRoot } from 'src/types';
import Store from 'src/devtools/store';

import type { ElementType } from 'src/types';
import type {
  CommitTreeFrontend,
  CommitTreeNodeFrontend,
  ProfilingSnapshotNode,
  ProfilingSummaryFrontend,
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

const rootToCommitTreeMap: Map<number, Array<CommitTreeFrontend>> = new Map();

export function getCommitTree({
  commitIndex,
  profilingSummary,
  store,
}: {|
  commitIndex: number,
  profilingSummary: ProfilingSummaryFrontend,
  store: Store,
|}): CommitTreeFrontend {
  const { rootID } = profilingSummary;

  if (!rootToCommitTreeMap.has(rootID)) {
    rootToCommitTreeMap.set(rootID, []);
  }

  const commitTrees = ((rootToCommitTreeMap.get(
    rootID
  ): any): Array<CommitTreeFrontend>);

  if (commitIndex < commitTrees.length) {
    return commitTrees[commitIndex];
  }

  const { importedProfilingData } = store;
  const profilingOperations =
    importedProfilingData != null
      ? importedProfilingData.profilingOperations
      : store.profilingOperations;

  // Commits are generated sequentially and cached.
  // If this is the very first commit, start with the cached snapshot and apply the first mutation.
  // Otherwise load (or generate) the previous commit and append a mutation to it.
  if (commitIndex === 0) {
    const nodes = new Map();

    const { importedProfilingData } = store;
    const profilingSnapshots =
      importedProfilingData != null
        ? importedProfilingData.profilingSnapshots.get(rootID)
        : store.profilingSnapshots.get(rootID);

    if (profilingSnapshots == null) {
      throw Error(`Could not find profiling snapshot for root "${rootID}"`);
    }

    // Construct the initial tree.
    recursivelyInitializeTree(
      rootID,
      0,
      nodes,
      profilingSummary.initialTreeBaseDurations,
      profilingSnapshots
    );

    // Mutate the tree
    const commitOperations = profilingOperations.get(rootID);
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
      store,
    });
    const commitOperations = profilingOperations.get(rootID);
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

  throw Error(
    `getCommitTree(): Unable to reconstruct tree for root "${rootID}" and commit ${commitIndex}`
  );
}

function recursivelyInitializeTree(
  id: number,
  parentID: number,
  nodes: Map<number, CommitTreeNodeFrontend>,
  initialTreeBaseDurations: Map<number, number>,
  profilingSnapshots: Map<number, ProfilingSnapshotNode>
): void {
  const node = profilingSnapshots.get(id);
  if (node != null) {
    nodes.set(id, {
      id,
      children: node.children,
      displayName: node.displayName,
      key: node.key,
      parentID,
      treeBaseDuration: ((initialTreeBaseDurations.get(id): any): number),
      type: node.type,
    });

    node.children.forEach(childID =>
      recursivelyInitializeTree(
        childID,
        id,
        nodes,
        initialTreeBaseDurations,
        profilingSnapshots
      )
    );
  }
}

function updateTree(
  commitTree: CommitTreeFrontend,
  operations: Uint32Array
): CommitTreeFrontend {
  // Clone the original tree so edits don't affect it.
  const nodes = new Map(commitTree.nodes);

  // Clone nodes before mutating them so edits don't affect them.
  const getClonedNode = (id: number): CommitTreeNodeFrontend => {
    const clonedNode = ((Object.assign(
      {},
      nodes.get(id)
    ): any): CommitTreeNodeFrontend);
    nodes.set(id, clonedNode);
    return clonedNode;
  };

  let i = 2;

  // Reassemble the string table.
  const stringTable = [
    null, // ID = 0 corresponds to the null string.
  ];
  const stringTableSize = operations[i++];
  const stringTableEnd = i + stringTableSize;
  while (i < stringTableEnd) {
    const nextLength = operations[i++];
    const nextString = utfDecodeString(
      (operations.slice(i, i + nextLength): any)
    );
    stringTable.push(nextString);
    i += nextLength;
  }

  while (i < operations.length) {
    const operation = operations[i];

    switch (operation) {
      case TREE_OPERATION_ADD:
        const id = ((operations[i + 1]: any): number);
        const type = ((operations[i + 2]: any): ElementType);

        i = i + 3;

        if (nodes.has(id)) {
          throw new Error(
            'Commit tree already contains fiber ' +
              id +
              '. This is a bug in React DevTools.'
          );
        }

        if (type === ElementTypeRoot) {
          i++; // supportsProfiling flag
          i++; // hasOwnerMetadata flag

          if (__DEBUG__) {
            debug('Add', `new root fiber ${id}`);
          }

          const node: CommitTreeNodeFrontend = {
            children: [],
            displayName: null,
            id,
            key: null,
            parentID: 0,
            treeBaseDuration: 0, // This will be updated by a subsequent operation
            type,
          };

          nodes.set(id, node);
        } else {
          const parentID = ((operations[i]: any): number);
          i++;

          i++; // ownerID

          const displayNameStringID = operations[i];
          const displayName = stringTable[displayNameStringID];
          i++;

          const keyStringID = operations[i];
          const key = stringTable[keyStringID];
          i++;

          if (__DEBUG__) {
            debug(
              'Add',
              `fiber ${id} (${displayName || 'null'}) as child of ${parentID}`
            );
          }

          const parentNode = getClonedNode(parentID);
          parentNode.children = parentNode.children.concat(id);

          const node: CommitTreeNodeFrontend = {
            children: [],
            displayName,
            id,
            key,
            parentID,
            treeBaseDuration: 0, // This will be updated by a subsequent operation
            type,
          };

          nodes.set(id, node);
        }

        break;
      case TREE_OPERATION_REMOVE: {
        const removeLength = ((operations[i + 1]: any): number);
        i = i + 2;

        for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
          const id = ((operations[i]: any): number);
          i = i + 1;

          if (!nodes.has(id)) {
            throw new Error(
              'Commit tree does not contain fiber ' +
                id +
                '. This is a bug in React DevTools.'
            );
          }

          const node = getClonedNode(id);
          const parentID = node.parentID;

          nodes.delete(id);

          const parentNode = getClonedNode(parentID);
          if (parentNode == null) {
            // No-op
          } else {
            if (__DEBUG__) {
              debug('Remove', `fiber ${id} from parent ${parentID}`);
            }

            parentNode.children = parentNode.children.filter(
              childID => childID !== id
            );
          }
        }
        break;
      }
      case TREE_OPERATION_REORDER_CHILDREN: {
        const id = ((operations[i + 1]: any): number);
        const numChildren = ((operations[i + 2]: any): number);
        const children = ((operations.slice(
          i + 3,
          i + 3 + numChildren
        ): any): Array<number>);

        i = i + 3 + numChildren;

        if (__DEBUG__) {
          debug('Re-order', `fiber ${id} children ${children.join(',')}`);
        }

        const node = getClonedNode(id);
        node.children = Array.from(children);

        break;
      }
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION: {
        const id = operations[i + 1];

        const node = getClonedNode(id);
        node.treeBaseDuration = operations[i + 2] / 1000; // Convert microseconds back to milliseconds;

        if (__DEBUG__) {
          debug(
            'Update',
            `fiber ${id} treeBaseDuration to ${node.treeBaseDuration}`
          );
        }

        i = i + 3;
        break;
      }
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
const __printTree = (commitTree: CommitTreeFrontend) => {
  if (__DEBUG__) {
    const { nodes, rootID } = commitTree;
    console.group('__printTree()');
    const queue = [rootID, 0];
    while (queue.length > 0) {
      const id = queue.shift();
      const depth = queue.shift();

      const node = nodes.get(id);
      if (node == null) {
        throw Error(`Could not find node with id "${id}" in commit tree`);
      }

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
