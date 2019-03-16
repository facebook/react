// @flow

import {
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
      const initialCommitTree = {
        nodes: new Map(),
        rootID,
      };

      // Construct the initial tree.
      const queue: Array<number> = [rootID];
      while (queue.length > 0) {
        const currentID = queue.pop();
        const currentNode = ((store.profilingSnapshot.get(
          currentID
        ): any): Node);

        initialCommitTree.nodes.set(currentID, {
          id: currentID,
          children: currentNode.children,
          displayName: currentNode.displayName,
          key: currentNode.key,
          parentID: 0,
          treeBaseDuration: ((profilingSummary.initialTreeBaseDurations.get(
            currentID
          ): any): number),
        });

        queue.push(...currentNode.children);
      }

      // Mutate the tree
      const commitOperations = store.profilingOperations.get(rootID);
      if (commitOperations != null && commitIndex < commitOperations.length) {
        const commitTree = updateTree(
          initialCommitTree,
          commitOperations[commitIndex]
        );
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

function updateTree(
  commitTree: CommitTree,
  operations: Uint32Array
): CommitTree {
  const nodes = new Map(commitTree.nodes);

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
            parentNode = ((nodes.get(parentID): any): Node);
            parentNode.children = parentNode.children.concat(id);

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

        node = ((nodes.get(id): any): Node);
        parentID = node.parentID;

        nodes.delete(id);

        parentNode = ((nodes.get(parentID): any): Node);
        if (parentNode == null) {
          // No-op
        } else {
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

        node = ((nodes.get(id): any): Node);
        node.children = Array.from(children);
        break;
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
        id = operations[i + 1];

        node = ((nodes.get(id): any): Node);
        node.treeBaseDuration = operations[i + 2];

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
