/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Instance,
  TextInstance,
  SuspenseInstance,
  Container,
  ChildSet,
} from './ReactFiberConfig';
import type {Fiber, FiberRoot} from './ReactInternalTypes';

import {
  HostRoot,
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostPortal,
  DehydratedFragment,
} from './ReactWorkTags';
import {ContentReset, Placement} from './ReactFiberFlags';
import {
  supportsMutation,
  supportsResources,
  supportsSingletons,
  commitMount,
  commitUpdate,
  resetTextContent,
  commitTextUpdate,
  appendChild,
  appendChildToContainer,
  insertBefore,
  insertInContainerBefore,
  replaceContainerChildren,
  hideInstance,
  hideTextInstance,
  unhideInstance,
  unhideTextInstance,
  commitHydratedContainer,
  commitHydratedSuspenseInstance,
  removeChildFromContainer,
  removeChild,
  clearSingleton,
  acquireSingletonInstance,
} from './ReactFiberConfig';
import {captureCommitPhaseError} from './ReactFiberWorkLoop';

import {runWithFiberInDEV} from './ReactCurrentFiber';

export function commitHostMount(finishedWork: Fiber) {
  const type = finishedWork.type;
  const props = finishedWork.memoizedProps;
  const instance: Instance = finishedWork.stateNode;
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        commitMount,
        instance,
        type,
        props,
        finishedWork,
      );
    } else {
      commitMount(instance, type, props, finishedWork);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostUpdate(
  finishedWork: Fiber,
  newProps: any,
  oldProps: any,
) {
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        commitUpdate,
        finishedWork.stateNode,
        finishedWork.type,
        oldProps,
        newProps,
        finishedWork,
      );
    } else {
      commitUpdate(
        finishedWork.stateNode,
        finishedWork.type,
        oldProps,
        newProps,
        finishedWork,
      );
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostTextUpdate(
  finishedWork: Fiber,
  newText: string,
  oldText: string,
) {
  const textInstance: TextInstance = finishedWork.stateNode;
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        commitTextUpdate,
        textInstance,
        oldText,
        newText,
      );
    } else {
      commitTextUpdate(textInstance, oldText, newText);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostResetTextContent(finishedWork: Fiber) {
  const instance: Instance = finishedWork.stateNode;
  try {
    if (__DEV__) {
      runWithFiberInDEV(finishedWork, resetTextContent, instance);
    } else {
      resetTextContent(instance);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitShowHideHostInstance(node: Fiber, isHidden: boolean) {
  try {
    const instance = node.stateNode;
    if (isHidden) {
      if (__DEV__) {
        runWithFiberInDEV(node, hideInstance, instance);
      } else {
        hideInstance(instance);
      }
    } else {
      if (__DEV__) {
        runWithFiberInDEV(
          node,
          unhideInstance,
          node.stateNode,
          node.memoizedProps,
        );
      } else {
        unhideInstance(node.stateNode, node.memoizedProps);
      }
    }
  } catch (error) {
    captureCommitPhaseError(node, node.return, error);
  }
}

export function commitShowHideHostTextInstance(node: Fiber, isHidden: boolean) {
  try {
    const instance = node.stateNode;
    if (isHidden) {
      if (__DEV__) {
        runWithFiberInDEV(node, hideTextInstance, instance);
      } else {
        hideTextInstance(instance);
      }
    } else {
      if (__DEV__) {
        runWithFiberInDEV(
          node,
          unhideTextInstance,
          instance,
          node.memoizedProps,
        );
      } else {
        unhideTextInstance(instance, node.memoizedProps);
      }
    }
  } catch (error) {
    captureCommitPhaseError(node, node.return, error);
  }
}

function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }

  throw new Error(
    'Expected to find a host parent. This error is likely caused by a bug ' +
      'in React. Please file an issue.',
  );
}

function isHostParent(fiber: Fiber): boolean {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    (supportsResources ? fiber.tag === HostHoistable : false) ||
    (supportsSingletons ? fiber.tag === HostSingleton : false) ||
    fiber.tag === HostPortal
  );
}

function getHostSibling(fiber: Fiber): ?Instance {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node: Fiber = fiber;
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      // $FlowFixMe[incompatible-type] found when upgrading Flow
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      (!supportsSingletons ? true : node.tag !== HostSingleton) &&
      node.tag !== DehydratedFragment
    ) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.flags & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      if (node.child === null || node.tag === HostPortal) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // Check if this host node is stable or about to be placed.
    if (!(node.flags & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}

function insertOrAppendPlacementNodeIntoContainer(
  node: Fiber,
  before: ?Instance,
  parent: Container,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      insertInContainerBefore(parent, stateNode, before);
    } else {
      appendChildToContainer(parent, stateNode);
    }
  } else if (
    tag === HostPortal ||
    (supportsSingletons ? tag === HostSingleton : false)
  ) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
    // If the insertion is a HostSingleton then it will be placed independently
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNodeIntoContainer(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before: ?Instance,
  parent: Instance,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else if (
    tag === HostPortal ||
    (supportsSingletons ? tag === HostSingleton : false)
  ) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
    // If the insertion is a HostSingleton then it will be placed independently
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function commitPlacement(finishedWork: Fiber): void {
  if (!supportsMutation) {
    return;
  }

  if (supportsSingletons) {
    if (finishedWork.tag === HostSingleton) {
      // Singletons are already in the Host and don't need to be placed
      // Since they operate somewhat like Portals though their children will
      // have Placement and will get placed inside them
      return;
    }
  }
  // Recursively insert all host nodes into the parent.
  const parentFiber = getHostParentFiber(finishedWork);

  switch (parentFiber.tag) {
    case HostSingleton: {
      if (supportsSingletons) {
        const parent: Instance = parentFiber.stateNode;
        const before = getHostSibling(finishedWork);
        // We only have the top Fiber that was inserted but we need to recurse down its
        // children to find all the terminal nodes.
        insertOrAppendPlacementNode(finishedWork, before, parent);
        break;
      }
      // Fall through
    }
    case HostComponent: {
      const parent: Instance = parentFiber.stateNode;
      if (parentFiber.flags & ContentReset) {
        // Reset the text content of the parent before doing any insertions
        resetTextContent(parent);
        // Clear ContentReset from the effect tag
        parentFiber.flags &= ~ContentReset;
      }

      const before = getHostSibling(finishedWork);
      // We only have the top Fiber that was inserted but we need to recurse down its
      // children to find all the terminal nodes.
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostRoot:
    case HostPortal: {
      const parent: Container = parentFiber.stateNode.containerInfo;
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
      break;
    }
    default:
      throw new Error(
        'Invalid host parent fiber. This error is likely caused by a bug ' +
          'in React. Please file an issue.',
      );
  }
}

export function commitHostPlacement(finishedWork: Fiber) {
  try {
    if (__DEV__) {
      runWithFiberInDEV(finishedWork, commitPlacement, finishedWork);
    } else {
      commitPlacement(finishedWork);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostRemoveChildFromContainer(
  deletedFiber: Fiber,
  nearestMountedAncestor: Fiber,
  parentContainer: Container,
  hostInstance: Instance | TextInstance,
) {
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        deletedFiber,
        removeChildFromContainer,
        parentContainer,
        hostInstance,
      );
    } else {
      removeChildFromContainer(parentContainer, hostInstance);
    }
  } catch (error) {
    captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
  }
}

export function commitHostRemoveChild(
  deletedFiber: Fiber,
  nearestMountedAncestor: Fiber,
  parentInstance: Instance,
  hostInstance: Instance | TextInstance,
) {
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        deletedFiber,
        removeChild,
        parentInstance,
        hostInstance,
      );
    } else {
      removeChild(parentInstance, hostInstance);
    }
  } catch (error) {
    captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
  }
}

export function commitHostRootContainerChildren(
  root: FiberRoot,
  finishedWork: Fiber,
) {
  const containerInfo = root.containerInfo;
  const pendingChildren = root.pendingChildren;
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        replaceContainerChildren,
        containerInfo,
        pendingChildren,
      );
    } else {
      replaceContainerChildren(containerInfo, pendingChildren);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostPortalContainerChildren(
  portal: {
    containerInfo: Container,
    pendingChildren: ChildSet,
    ...
  },
  finishedWork: Fiber,
  pendingChildren: ChildSet,
) {
  const containerInfo = portal.containerInfo;
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        replaceContainerChildren,
        containerInfo,
        pendingChildren,
      );
    } else {
      replaceContainerChildren(containerInfo, pendingChildren);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostHydratedContainer(
  root: FiberRoot,
  finishedWork: Fiber,
) {
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        commitHydratedContainer,
        root.containerInfo,
      );
    } else {
      commitHydratedContainer(root.containerInfo);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostHydratedSuspense(
  suspenseInstance: SuspenseInstance,
  finishedWork: Fiber,
) {
  try {
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        commitHydratedSuspenseInstance,
        suspenseInstance,
      );
    } else {
      commitHydratedSuspenseInstance(suspenseInstance);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHostSingleton(finishedWork: Fiber) {
  const singleton = finishedWork.stateNode;
  const props = finishedWork.memoizedProps;

  try {
    // This was a new mount, we need to clear and set initial properties
    clearSingleton(singleton);
    if (__DEV__) {
      runWithFiberInDEV(
        finishedWork,
        acquireSingletonInstance,
        finishedWork.type,
        props,
        singleton,
        finishedWork,
      );
    } else {
      acquireSingletonInstance(
        finishedWork.type,
        props,
        singleton,
        finishedWork,
      );
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
