/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  __DEBUG__,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
} from 'react-devtools-shared/src/constants';
import {utfDecodeString} from 'react-devtools-shared/src/utils';
import {ElementTypeRoot} from 'react-devtools-shared/src/types';
import ProfilerStore from 'react-devtools-shared/src/devtools/ProfilerStore';

import type {ElementType} from 'react-devtools-shared/src/types';
import type {
  CommitTree,
  CommitTreeNode,
  ProfilingDataForRootFrontend,
} from 'react-devtools-shared/src/devtools/views/Profiler/types';

const debug = (methodName, ...args) => {
  if (__DEBUG__) {
    console.log(
      `%cCommitTreeBuilder %c${methodName}`,
      'color: pink; font-weight: bold;',
      'font-weight: bold;',
      ...args,
    );
  }
};

const rootToCommitTreeMap: Map<number, Array<CommitTree>> = new Map();

export function getCommitTree({
  commitIndex,
  profilerStore,
  rootID,
}: {|
  commitIndex: number,
  profilerStore: ProfilerStore,
  rootID: number,
|}): CommitTree {
  if (!rootToCommitTreeMap.has(rootID)) {
    rootToCommitTreeMap.set(rootID, []);
  }

  const commitTrees = ((rootToCommitTreeMap.get(
    rootID,
  ): any): Array<CommitTree>);
  if (commitIndex < commitTrees.length) {
    return commitTrees[commitIndex];
  }

  const {profilingData} = profilerStore;
  if (profilingData === null) {
    throw Error(`No profiling data available`);
  }

  const dataForRoot = profilingData.dataForRoots.get(rootID);
  if (dataForRoot == null) {
    throw Error(`Could not find profiling data for root "${rootID}"`);
  }

  const {operations} = dataForRoot;
  if (operations.length <= commitIndex) {
    throw Error(
      `getCommitTree(): Invalid commit "${commitIndex}" for root "${rootID}". There are only "${operations.length}" commits.`,
    );
  }

  let commitTree: CommitTree = ((null: any): CommitTree);
  for (let index = commitTrees.length; index <= commitIndex; index++) {
    // Commits are generated sequentially and cached.
    // If this is the very first commit, start with the cached snapshot and apply the first mutation.
    // Otherwise load (or generate) the previous commit and append a mutation to it.
    if (index === 0) {
      const nodes = new Map();

      // Construct the initial tree.
      recursivelyInitializeTree(rootID, 0, nodes, dataForRoot);

      // Mutate the tree
      if (operations != null && index < operations.length) {
        commitTree = updateTree({nodes, rootID}, operations[index]);

        if (__DEBUG__) {
          __printTree(commitTree);
        }

        commitTrees.push(commitTree);
      }
    } else {
      const previousCommitTree = commitTrees[index - 1];
      commitTree = updateTree(previousCommitTree, operations[index]);

      if (__DEBUG__) {
        __printTree(commitTree);
      }

      commitTrees.push(commitTree);
    }
  }

  return commitTree;
}

function recursivelyInitializeTree(
  id: number,
  parentID: number,
  nodes: Map<number, CommitTreeNode>,
  dataForRoot: ProfilingDataForRootFrontend,
): void {
  const node = dataForRoot.snapshots.get(id);
  if (node != null) {
    nodes.set(id, {
      id,
      children: node.children,
      displayName: node.displayName,
      hocDisplayNames: node.hocDisplayNames,
      key: node.key,
      parentID,
      treeBaseDuration: ((dataForRoot.initialTreeBaseDurations.get(
        id,
      ): any): number),
      type: node.type,
    });

    node.children.forEach(childID =>
      recursivelyInitializeTree(childID, id, nodes, dataForRoot),
    );
  }
}

function updateTree(
  commitTree: CommitTree,
  operations: Array<number>,
): CommitTree {
  // Clone the original tree so edits don't affect it.
  const nodes = new Map(commitTree.nodes);

  // Clone nodes before mutating them so edits don't affect them.
  const getClonedNode = (id: number): CommitTreeNode => {
    const clonedNode = ((Object.assign(
      {},
      nodes.get(id),
    ): any): CommitTreeNode);
    nodes.set(id, clonedNode);
    return clonedNode;
  };

  let i = 2;
  let id: number = ((null: any): number);

  // Reassemble the string table.
  const stringTable = [
    null, // ID = 0 corresponds to the null string.
  ];
  const stringTableSize = operations[i++];
  const stringTableEnd = i + stringTableSize;
  while (i < stringTableEnd) {
    const nextLength = operations[i++];
    const nextString = utfDecodeString(
      (operations.slice(i, i + nextLength): any),
    );
    stringTable.push(nextString);
    i += nextLength;
  }

  while (i < operations.length) {
    const operation = operations[i];

    switch (operation) {
      case TREE_OPERATION_ADD: {
        id = ((operations[i + 1]: any): number);
        const type = ((operations[i + 2]: any): ElementType);

        i += 3;

        if (nodes.has(id)) {
          throw new Error(
            `Commit tree already contains fiber "${id}". This is a bug in React DevTools.`,
          );
        }

        if (type === ElementTypeRoot) {
          i++; // isStrictModeCompliant
          i++; // Profiling flag
          i++; // supportsStrictMode flag
          i++; // hasOwnerMetadata flag

          if (__DEBUG__) {
            debug('Add', `new root fiber ${id}`);
          }

          const node: CommitTreeNode = {
            children: [],
            displayName: null,
            hocDisplayNames: null,
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
              `fiber ${id} (${displayName || 'null'}) as child of ${parentID}`,
            );
          }

          const parentNode = getClonedNode(parentID);
          parentNode.children = parentNode.children.concat(id);

          const node: CommitTreeNode = {
            children: [],
            displayName,
            hocDisplayNames: null,
            id,
            key,
            parentID,
            treeBaseDuration: 0, // This will be updated by a subsequent operation
            type,
          };

          nodes.set(id, node);
        }

        break;
      }
      case TREE_OPERATION_REMOVE: {
        const removeLength = ((operations[i + 1]: any): number);
        i += 2;

        for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
          id = ((operations[i]: any): number);
          i++;

          if (!nodes.has(id)) {
            throw new Error(
              `Commit tree does not contain fiber "${id}". This is a bug in React DevTools.`,
            );
          }

          const node = getClonedNode(id);
          const parentID = node.parentID;

          nodes.delete(id);

          if (!nodes.has(parentID)) {
            // No-op
          } else {
            const parentNode = getClonedNode(parentID);

            if (__DEBUG__) {
              debug('Remove', `fiber ${id} from parent ${parentID}`);
            }

            parentNode.children = parentNode.children.filter(
              childID => childID !== id,
            );
          }
        }
        break;
      }
      case TREE_OPERATION_REMOVE_ROOT: {
        throw Error('Operation REMOVE_ROOT is not supported while profiling.');
      }
      case TREE_OPERATION_REORDER_CHILDREN: {
        id = ((operations[i + 1]: any): number);
        const numChildren = ((operations[i + 2]: any): number);
        const children = ((operations.slice(
          i + 3,
          i + 3 + numChildren,
        ): any): Array<number>);

        i = i + 3 + numChildren;

        if (__DEBUG__) {
          debug('Re-order', `fiber ${id} children ${children.join(',')}`);
        }

        const node = getClonedNode(id);
        node.children = Array.from(children);

        break;
      }
      case TREE_OPERATION_SET_SUBTREE_MODE: {
        id = operations[i + 1];
        const mode = operations[i + 1];

        i += 3;

        if (__DEBUG__) {
          debug('Subtree mode', `Subtree with root ${id} set to mode ${mode}`);
        }
        break;
      }
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION: {
        id = operations[i + 1];

        const node = getClonedNode(id);
        node.treeBaseDuration = operations[i + 2] / 1000; // Convert microseconds back to milliseconds;

        if (__DEBUG__) {
          debug(
            'Update',
            `fiber ${id} treeBaseDuration to ${node.treeBaseDuration}`,
          );
        }

        i += 3;
        break;
      }
      case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS: {
        id = operations[i + 1];
        const numErrors = operations[i + 2];
        const numWarnings = operations[i + 3];

        i += 4;

        if (__DEBUG__) {
          debug(
            'Warnings and Errors update',
            `fiber ${id} has ${numErrors} errors and ${numWarnings} warnings`,
          );
        }
        break;
      }

      default:
        throw Error(`Unsupported Bridge operation "${operation}"`);
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
    const {nodes, rootID} = commitTree;
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
        } (${node.treeBaseDuration})`,
      );

      node.children.forEach(childID => {
        queue.push(childID, depth + 1);
      });
    }
    console.groupEnd();
  }
};
