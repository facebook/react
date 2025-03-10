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

import type {
  ViewTransitionState,
  ViewTransitionProps,
} from './ReactFiberViewTransitionComponent';

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
  unhideInstance,
  unhideTextInstance,
} from './ReactFiberConfig';
import {
  popMutationContext,
  pushMutationContext,
  viewTransitionMutationContext,
} from './ReactFiberMutationTracking';
import {
  MutationMask,
  Update,
  ContentReset,
  NoFlags,
  Visibility,
  ViewTransitionNamedStatic,
  ViewTransitionStatic,
} from './ReactFiberFlags';
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

let unhideHostChildren = false;

function trackDeletedPairViewTransitions(deletion: Fiber): void {
  if ((deletion.subtreeFlags & ViewTransitionNamedStatic) === NoFlags) {
    // This has no named view transitions in its subtree.
    return;
  }
  let child = deletion.child;
  while (child !== null) {
    if (child.tag === OffscreenComponent && child.memoizedState === null) {
      // This tree was already hidden so we skip it.
    } else {
      if (
        child.tag === ViewTransitionComponent &&
        (child.flags & ViewTransitionNamedStatic) !== NoFlags
      ) {
        const props: ViewTransitionProps = child.memoizedProps;
        const name = props.name;
        if (name != null && name !== 'auto') {
          // TODO: Find a pair
        }
      }
      trackDeletedPairViewTransitions(child);
    }
    child = child.sibling;
  }
}

function trackExitViewTransitions(deletion: Fiber): void {
  if (deletion.tag === ViewTransitionComponent) {
    const props: ViewTransitionProps = deletion.memoizedProps;
    const name = props.name;
    if (name != null && name !== 'auto') {
      // TODO: Find a pair
    }
    // Look for more pairs deeper in the tree.
    trackDeletedPairViewTransitions(deletion);
  } else if ((deletion.subtreeFlags & ViewTransitionStatic) !== NoFlags) {
    let child = deletion.child;
    while (child !== null) {
      trackExitViewTransitions(child);
      child = child.sibling;
    }
  } else {
    trackDeletedPairViewTransitions(deletion);
  }
}

function recursivelyInsertClonesFromExistingTree(
  parentFiber: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
): void {
  let child = parentFiber.child;
  while (child !== null) {
    switch (child.tag) {
      case HostComponent: {
        const instance: Instance = child.stateNode;
        // If we have no mutations in this subtree, we just need to make a deep clone.
        const clone: Instance = cloneMutableInstance(instance, true);
        appendChild(hostParentClone, clone);
        if (parentViewTransition !== null) {
          if (parentViewTransition.clones === null) {
            parentViewTransition.clones = [clone];
          } else {
            parentViewTransition.clones.push(clone);
          }
        }
        // TODO: We may need to transfer some DOM state such as scroll position
        // for the deep clones.
        // TODO: If there's a manual view-transition-name inside the clone we
        // should ideally remove it from the original and then restore it in mutation
        // phase. Otherwise it leads to duplicate names.
        if (unhideHostChildren) {
          unhideInstance(clone, child.memoizedProps);
        }
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
        if (unhideHostChildren) {
          unhideTextInstance(clone, child.memoizedProps);
        }
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
          // Since there was no mutation to this node, it couldn't have changed
          // visibility so we don't need to update unhideHostChildren here.
          recursivelyInsertClonesFromExistingTree(
            child,
            hostParentClone,
            parentViewTransition,
          );
        }
        break;
      }
      case ViewTransitionComponent:
        const prevMutationContext = pushMutationContext();
        const viewTransitionState: ViewTransitionState = child.stateNode;
        // TODO: If this was already cloned by a previous pass we can reuse those clones.
        viewTransitionState.clones = null;
        recursivelyInsertClonesFromExistingTree(
          child,
          hostParentClone,
          viewTransitionState,
        );
        // TODO: Do we need to track whether this should have a name applied?
        // child.flags |= Update;
        popMutationContext(prevMutationContext);
        break;
      default: {
        recursivelyInsertClonesFromExistingTree(
          child,
          hostParentClone,
          parentViewTransition,
        );
        break;
      }
    }
    child = child.sibling;
  }
}

function recursivelyInsertClones(
  parentFiber: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
) {
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      trackExitViewTransitions(childToDelete);
    }
  }

  if (
    parentFiber.alternate === null ||
    (parentFiber.subtreeFlags & MutationMask) !== NoFlags
  ) {
    // If we have mutations or if this is a newly inserted tree, clone as we go.
    let child = parentFiber.child;
    while (child !== null) {
      insertDestinationClonesOfFiber(
        child,
        hostParentClone,
        parentViewTransition,
      );
      child = child.sibling;
    }
  } else {
    // Once we reach a subtree with no more mutations we can bail out.
    // However, we must still insert deep clones of the HostComponents.
    recursivelyInsertClonesFromExistingTree(
      parentFiber,
      hostParentClone,
      parentViewTransition,
    );
  }
}

function insertDestinationClonesOfFiber(
  finishedWork: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
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
        recursivelyInsertClones(
          finishedWork,
          hostParentClone,
          parentViewTransition,
        );
        break;
      }
      // Fall through
    }
    case HostSingleton: {
      if (supportsSingletons) {
        recursivelyInsertClones(
          finishedWork,
          hostParentClone,
          parentViewTransition,
        );
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
      let clone: Instance;
      if (current === null) {
        // For insertions we don't need to clone. It's already new state node.
        // TODO: Do we need to visit it for ViewTransitions though?
        appendChild(hostParentClone, instance);
        clone = instance;
      } else {
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

        if (unhideHostChildren) {
          unhideHostChildren = false;
          recursivelyInsertClones(finishedWork, clone, null);
          appendChild(hostParentClone, clone);
          unhideHostChildren = true;
          unhideInstance(clone, finishedWork.memoizedProps);
        } else {
          recursivelyInsertClones(finishedWork, clone, null);
          appendChild(hostParentClone, clone);
        }
      }
      if (parentViewTransition !== null) {
        if (parentViewTransition.clones === null) {
          parentViewTransition.clones = [clone];
        } else {
          parentViewTransition.clones.push(clone);
        }
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
        if (unhideHostChildren) {
          unhideTextInstance(clone, finishedWork.memoizedProps);
        }
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
        const prevUnhide = unhideHostChildren;
        unhideHostChildren = prevUnhide || (flags & Visibility) !== NoFlags;
        recursivelyInsertClones(
          finishedWork,
          hostParentClone,
          parentViewTransition,
        );
        unhideHostChildren = prevUnhide;
      } else if (current !== null && current.memoizedState === null) {
        // Was previously mounted as visible but is now hidden.
        trackExitViewTransitions(current);
      }
      break;
    }
    case ViewTransitionComponent:
      const prevMutationContext = pushMutationContext();
      const viewTransitionState: ViewTransitionState = finishedWork.stateNode;
      // TODO: If this was already cloned by a previous pass we can reuse those clones.
      viewTransitionState.clones = null;
      recursivelyInsertClones(
        finishedWork,
        hostParentClone,
        viewTransitionState,
      );
      if (viewTransitionMutationContext) {
        // Track that this boundary had a mutation and therefore needs to animate
        // whether it resized or not.
        finishedWork.flags |= Update;
      }
      popMutationContext(prevMutationContext);
      break;
    default: {
      recursivelyInsertClones(
        finishedWork,
        hostParentClone,
        parentViewTransition,
      );
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
  unhideHostChildren = false;
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
    recursivelyInsertClones(finishedWork, rootClone, null);
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
