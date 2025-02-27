/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, FiberRoot} from './ReactInternalTypes';

import type {Instance, TextInstance} from './ReactFiberConfig';

import type {OffscreenState} from './ReactFiberActivityComponent';

import {
  cloneMutableInstance,
  cloneMutableTextInstance,
  cloneRootViewTransitionContainer,
  removeRootViewTransitionClone,
  cancelRootViewTransitionName,
  restoreRootViewTransitionName,
  appendChild,
  commitUpdate,
  commitTextUpdate,
  resetTextContent,
  supportsResources,
  supportsSingletons,
} from './ReactFiberConfig';
import {
  popMutationContext,
  pushMutationContext,
  viewTransitionMutationContext,
} from './ReactFiberMutationTracking';
import {MutationMask, Update, ContentReset, NoFlags} from './ReactFiberFlags';
import {
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostPortal,
  OffscreenComponent,
  ViewTransitionComponent,
} from './ReactWorkTags';

let didWarnForRootClone = false;

function detectMutationOrInsertClones(finishedWork: Fiber): boolean {
  return true;
}

function recursivelyInsertClonesFromExistingTree(
  parentFiber: Fiber,
  hostParentClone: Instance,
): void {
  let child = parentFiber.child;
  while (child !== null) {
    switch (child.tag) {
      case HostComponent: {
        const instance: Instance = child.stateNode;
        // If we have no mutations in this subtree, we just need to make a deep clone.
        const clone: Instance = cloneMutableInstance(instance, true);
        appendChild(hostParentClone, clone);
        // TODO: We may need to transfer some DOM state such as scroll position
        // for the deep clones.
        // TODO: If there's a manual view-transition-name inside the clone we
        // should ideally remove it from the original and then restore it in mutation
        // phase. Otherwise it leads to duplicate names.
        break;
      }
      case HostText: {
        const textInstance: TextInstance = child.stateNode;
        if (textInstance === null) {
          throw new Error(
            'This should have a text node initialized. This error is likely ' +
              'caused by a bug in React. Please file an issue.',
          );
        }
        const clone = cloneMutableTextInstance(textInstance);
        appendChild(hostParentClone, clone);
        break;
      }
      case HostPortal: {
        // TODO: Consider what should happen to Portals. For now we exclude them.
        break;
      }
      case OffscreenComponent: {
        const newState: OffscreenState | null = child.memoizedState;
        const isHidden = newState !== null;
        if (!isHidden) {
          // Only insert clones if this tree is going to be visible. No need to
          // clone invisible content.
          // TODO: If this is visible but detached it should still be cloned.
          recursivelyInsertClonesFromExistingTree(child, hostParentClone);
        }
        break;
      }
      case ViewTransitionComponent:
        const prevMutationContext = pushMutationContext();
        // TODO: If this was already cloned by a previous pass we can reuse those clones.
        recursivelyInsertClonesFromExistingTree(child, hostParentClone);
        // TODO: Do we need to track whether this should have a name applied?
        // child.flags |= Update;
        popMutationContext(prevMutationContext);
        break;
      default: {
        recursivelyInsertClonesFromExistingTree(child, hostParentClone);
        break;
      }
    }
    child = child.sibling;
  }
}

function recursivelyInsertClones(
  parentFiber: Fiber,
  hostParentClone: Instance,
) {
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      // const childToDelete = deletions[i];
      // TODO
    }
  }

  if (
    parentFiber.alternate === null ||
    (parentFiber.subtreeFlags & MutationMask) !== NoFlags
  ) {
    // If we have mutations or if this is a newly inserted tree, clone as we go.
    let child = parentFiber.child;
    while (child !== null) {
      insertDestinationClonesOfFiber(child, hostParentClone);
      child = child.sibling;
    }
  } else {
    // Once we reach a subtree with no more mutations we can bail out.
    // However, we must still insert deep clones of the HostComponents.
    recursivelyInsertClonesFromExistingTree(parentFiber, hostParentClone);
  }
}

function insertDestinationClonesOfFiber(
  finishedWork: Fiber,
  hostParentClone: Instance,
) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  // The effect flag should be checked *after* we refine the type of fiber,
  // because the fiber tag is more specific. An exception is any flag related
  // to reconciliation, because those can be set on all fiber types.
  switch (finishedWork.tag) {
    case HostHoistable: {
      if (supportsResources) {
        // TODO: Hoistables should get optimistically inserted and then removed.
        recursivelyInsertClones(finishedWork, hostParentClone);
        break;
      }
      // Fall through
    }
    case HostSingleton: {
      if (supportsSingletons) {
        recursivelyInsertClones(finishedWork, hostParentClone);
        if (__DEV__) {
          // We cannot apply mutations to Host Singletons since by definition
          // they cannot be cloned. Therefore we warn in DEV if this commit
          // had any effect.
          if (flags & Update) {
            if (current === null) {
              console.error(
                'useSwipeTransition() caused something to render a new <%s>. ' +
                  'This is not possible in the current implementation. ' +
                  "Make sure that the swipe doesn't mount any new <%s> elements.",
                finishedWork.type,
                finishedWork.type,
              );
            } else {
              const newProps = finishedWork.memoizedProps;
              const oldProps = current.memoizedProps;
              const instance = finishedWork.stateNode;
              const type = finishedWork.type;
              const prev = pushMutationContext();

              try {
                // Since we currently don't have a separate diffing algorithm for
                // individual properties, the Update flag can be a false positive.
                // We have to apply the new props first o detect any mutations and
                // then revert them.
                commitUpdate(instance, type, oldProps, newProps, finishedWork);
                if (viewTransitionMutationContext) {
                  console.error(
                    'useSwipeTransition() caused something to mutate <%s>. ' +
                      'This is not possible in the current implementation. ' +
                      "Make sure that the swipe doesn't update any state which " +
                      'causes <%s> to change.',
                    finishedWork.type,
                    finishedWork.type,
                  );
                }
                // Revert
                commitUpdate(instance, type, newProps, oldProps, finishedWork);
              } finally {
                popMutationContext(prev);
              }
            }
          }
        }
        break;
      }
      // Fall through
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (current === null) {
        // For insertions we don't need to clone. It's already new state node.
        // TODO: Do we need to visit it for ViewTransitions though?
        appendChild(hostParentClone, instance);
      } else {
        let clone: Instance;
        if (finishedWork.child === null) {
          // This node is terminal. We still do a deep clone in case this has user
          // inserted content, text content or dangerouslySetInnerHTML.
          clone = cloneMutableInstance(instance, true);
          if (finishedWork.flags & ContentReset) {
            resetTextContent(clone);
          }
        } else {
          // If we have children we'll clone them as we walk the tree so we just
          // do a shallow clone here.
          clone = cloneMutableInstance(instance, false);
        }

        if (flags & Update) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current.memoizedProps;
          const type = finishedWork.type;
          // Apply the delta to the clone.
          commitUpdate(clone, type, oldProps, newProps, finishedWork);
        }

        recursivelyInsertClones(finishedWork, clone);

        appendChild(hostParentClone, clone);
      }
      break;
    }
    case HostText: {
      const textInstance: TextInstance = finishedWork.stateNode;
      if (textInstance === null) {
        throw new Error(
          'This should have a text node initialized. This error is likely ' +
            'caused by a bug in React. Please file an issue.',
        );
      }
      if (current === null) {
        // For insertions we don't need to clone. It's already new state node.
        appendChild(hostParentClone, textInstance);
      } else {
        const clone = cloneMutableTextInstance(textInstance);
        if (flags & Update) {
          const newText: string = finishedWork.memoizedProps;
          const oldText: string = current.memoizedProps;
          commitTextUpdate(clone, newText, oldText);
        }
        appendChild(hostParentClone, clone);
      }
      break;
    }
    case HostPortal: {
      // TODO: Consider what should happen to Portals. For now we exclude them.
      break;
    }
    case OffscreenComponent: {
      const newState: OffscreenState | null = finishedWork.memoizedState;
      const isHidden = newState !== null;
      if (!isHidden) {
        // Only insert clones if this tree is going to be visible. No need to
        // clone invisible content.
        // TODO: If this is visible but detached it should still be cloned.
        recursivelyInsertClones(finishedWork, hostParentClone);
      }
      break;
    }
    case ViewTransitionComponent:
      const prevMutationContext = pushMutationContext();
      // TODO: If this was already cloned by a previous pass we can reuse those clones.
      recursivelyInsertClones(finishedWork, hostParentClone);
      if (viewTransitionMutationContext) {
        // Track that this boundary had a mutation and therefore needs to animate
        // whether it resized or not.
        finishedWork.flags |= Update;
      }
      popMutationContext(prevMutationContext);
      break;
    default: {
      recursivelyInsertClones(finishedWork, hostParentClone);
      break;
    }
  }
}

// Clone View Transition boundaries that have any mutations or might have had their
// layout affected by child insertions.
export function insertDestinationClones(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // We'll either not transition the root, or we'll transition the clone. Regardless
  // we cancel the root view transition name.
  const needsClone = detectMutationOrInsertClones(finishedWork);
  if (needsClone) {
    if (__DEV__) {
      if (!didWarnForRootClone) {
        didWarnForRootClone = true;
        console.warn(
          'useSwipeTransition() caused something to mutate or relayout the root. ' +
            'This currently requires a clone of the whole document. Make sure to ' +
            'add a <ViewTransition> directly around an absolutely positioned DOM node ' +
            'to minimize the impact of any changes caused by the Swipe Transition.',
        );
      }
    }
    // Clone the whole root
    const rootClone = cloneRootViewTransitionContainer(root.containerInfo);
    root.gestureClone = rootClone;
    recursivelyInsertClones(finishedWork, rootClone);
  } else {
    root.gestureClone = null;
    cancelRootViewTransitionName(root.containerInfo);
  }
}

// Revert insertions and apply view transition names to the "new" (current) state.
export function applyDepartureTransitions(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  const rootClone = root.gestureClone;
  if (rootClone !== null) {
    root.gestureClone = null;
    removeRootViewTransitionClone(root.containerInfo, rootClone);
  }
  // TODO
}

// Revert transition names and start/adjust animations on the started View Transition.
export function startGestureAnimations(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // TODO
  restoreRootViewTransitionName(root.containerInfo);
}
