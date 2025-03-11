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

const CLONE_UPDATE = 0; // Mutations in this subtree or potentially affected by layout.
const CLONE_ENTER = 1; // Inside a reappearing offscreen before the next ViewTransition or HostComponent.
const CLONE_UNHIDE = 2; // Inside a reappearing offscreen before the next HostComponent.
const CLONE_APPEARING_PAIR = 3; // Like UNHIDE but we're already inside the first Host Component only finding pairs.
const CLONE_UNCHANGED = 4; // Nothing in this tree was changed but we're still walking to clone it.
const INSERT_ENTER = 5; // Inside a newly mounted tree before the next ViewTransition or HostComponent.
const INSERT_APPEND = 6; // Inside a newly mounted tree before the next HostComponent.
const INSERT_APPEARING_PAIR = 7; // Inside a newly mounted tree only finding pairs.
let cloneState: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 = 0;

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

function recursivelyInsertNew(
  parentFiber: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
): void {
  if (
    cloneState === INSERT_APPEARING_PAIR &&
    (parentFiber.subtreeFlags & ViewTransitionNamedStatic) === NoFlags
  ) {
    // We're just searching for pairs but we have reached the end.
    return;
  }
  let child = parentFiber.child;
  while (child !== null) {
    recursivelyInsertNewFiber(child, hostParentClone, parentViewTransition);
    child = child.sibling;
  }
}

function recursivelyInsertNewFiber(
  finishedWork: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
): void {
  switch (finishedWork.tag) {
    case HostHoistable: {
      if (supportsResources) {
        // TODO: Hoistables should get optimistically inserted and then removed.
        recursivelyInsertNew(
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
        recursivelyInsertNew(
          finishedWork,
          hostParentClone,
          parentViewTransition,
        );
        if (__DEV__) {
          // We cannot apply mutations to Host Singletons since by definition
          // they cannot be cloned. Therefore we warn in DEV if this commit
          // had any effect.
          if (finishedWork.flags & Update) {
            console.error(
              'useSwipeTransition() caused something to render a new <%s>. ' +
                'This is not possible in the current implementation. ' +
                "Make sure that the swipe doesn't mount any new <%s> elements.",
              finishedWork.type,
              finishedWork.type,
            );
          }
        }
        break;
      }
      // Fall through
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      // For insertions we don't need to clone. It's already new state node.
      if (cloneState !== INSERT_APPEARING_PAIR) {
        appendChild(hostParentClone, instance);
        if (parentViewTransition !== null) {
          if (parentViewTransition.clones === null) {
            parentViewTransition.clones = [instance];
          } else {
            parentViewTransition.clones.push(instance);
          }
        }
        const prevCloneState = cloneState;
        cloneState = INSERT_APPEARING_PAIR;
        recursivelyInsertNew(finishedWork, instance, null);
        cloneState = prevCloneState;
      } else {
        recursivelyInsertNew(finishedWork, instance, null);
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
      // For insertions we don't need to clone. It's already new state node.
      if (cloneState !== INSERT_APPEARING_PAIR) {
        appendChild(hostParentClone, textInstance);
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
        // Only insert nodes if this tree is going to be visible. No need to
        // insert invisible content.
        // Since there was no mutation to this node, it couldn't have changed
        // visibility so we don't need to update cloneState here.
        recursivelyInsertNew(
          finishedWork,
          hostParentClone,
          parentViewTransition,
        );
      }
      break;
    }
    case ViewTransitionComponent:
      const prevMutationContext = pushMutationContext();
      const viewTransitionState: ViewTransitionState = finishedWork.stateNode;
      // TODO: If this was already cloned by a previous pass we can reuse those clones.
      viewTransitionState.clones = null;
      const prevCloneState = cloneState;
      if (cloneState === INSERT_ENTER) {
        // This was an Enter of a ViewTransition. We now move onto inserting the inner
        // HostComponents and finding inner pairs.
        cloneState = INSERT_APPEND;
        // TODO: Mark the name and find a pair.
      }
      recursivelyInsertNew(finishedWork, hostParentClone, viewTransitionState);
      cloneState = prevCloneState;
      popMutationContext(prevMutationContext);
      break;
    default: {
      recursivelyInsertNew(finishedWork, hostParentClone, parentViewTransition);
      break;
    }
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
        let keepTraversing: boolean;
        switch (cloneState) {
          case CLONE_UPDATE:
          case CLONE_UNCHANGED:
            // We've found any "layout" View Transitions at this point so we can bail.
            keepTraversing = false;
            break;
          case CLONE_ENTER:
          case CLONE_UNHIDE:
          case CLONE_APPEARING_PAIR:
            // If this was an unhide, we need to keep going if there are any named
            // pairs in this subtree, since they might need to be marked.
            keepTraversing =
              (child.subtreeFlags & ViewTransitionNamedStatic) !== NoFlags;
            break;
        }
        let clone: Instance;
        if (keepTraversing) {
          // We might need a handle on these clones, so we need to do a shallow clone
          // and keep going.
          clone = cloneMutableInstance(instance, false);
          recursivelyInsertClonesFromExistingTree(child, clone, null);
        } else {
          // If we have no mutations in this subtree, and we don't need a handle on the
          // clones, then we can do a deep clone instead and bailout.
          clone = cloneMutableInstance(instance, true);
          // TODO: We may need to transfer some DOM state such as scroll position
          // for the deep clones.
          // TODO: If there's a manual view-transition-name inside the clone we
          // should ideally remove it from the original and then restore it in mutation
          // phase. Otherwise it leads to duplicate names.
        }
        appendChild(hostParentClone, clone);
        if (parentViewTransition !== null) {
          if (parentViewTransition.clones === null) {
            parentViewTransition.clones = [clone];
          } else {
            parentViewTransition.clones.push(clone);
          }
        }
        if (cloneState === CLONE_ENTER || cloneState === CLONE_UNHIDE) {
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
        if (cloneState === CLONE_ENTER || cloneState === CLONE_UNHIDE) {
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
          // visibility so we don't need to update cloneState here.
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
        const prevCloneState = cloneState;
        if (cloneState === CLONE_ENTER) {
          // This was an Enter of a ViewTransition. We now move onto unhiding the inner
          // HostComponents and finding inner pairs.
          cloneState = CLONE_UNHIDE;
          // TODO: Mark the name and find a pair.
        } else if (cloneState === CLONE_UPDATE) {
          // If the tree had no mutations and we've found the top most ViewTransition
          // then this is the one we might apply the "layout" state too if it has changed
          // position. After we've found its HostComponents we can bail out.
          cloneState = CLONE_UNCHANGED;
        }
        recursivelyInsertClonesFromExistingTree(
          child,
          hostParentClone,
          viewTransitionState,
        );
        cloneState = prevCloneState;
        // TODO: Only the first level should track if this was s
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
  if (current === null) {
    // This is a newly mounted subtree. Insert any HostComponents and trigger
    // Enter transitions.
    const prevCloneState = cloneState;
    cloneState = INSERT_ENTER;
    recursivelyInsertNewFiber(
      finishedWork,
      hostParentClone,
      parentViewTransition,
    );
    cloneState = prevCloneState;
    return;
  }

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
        break;
      }
      // Fall through
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
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

      if (cloneState === CLONE_ENTER || cloneState === CLONE_UNHIDE) {
        const prevCloneState = cloneState;
        cloneState = CLONE_APPEARING_PAIR;
        recursivelyInsertClones(finishedWork, clone, null);
        appendChild(hostParentClone, clone);
        cloneState = prevCloneState;
        unhideInstance(clone, finishedWork.memoizedProps);
      } else {
        recursivelyInsertClones(finishedWork, clone, null);
        appendChild(hostParentClone, clone);
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
      const clone = cloneMutableTextInstance(textInstance);
      if (flags & Update) {
        const newText: string = finishedWork.memoizedProps;
        const oldText: string = current.memoizedProps;
        commitTextUpdate(clone, newText, oldText);
      }
      appendChild(hostParentClone, clone);
      if (cloneState === CLONE_ENTER || cloneState === CLONE_UNHIDE) {
        unhideTextInstance(clone, finishedWork.memoizedProps);
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
        const prevCloneState = cloneState;
        if (
          prevCloneState === CLONE_UPDATE &&
          (flags & Visibility) !== NoFlags
        ) {
          // This is the root of an appear. We need to trigger Enter transitions.
          cloneState = CLONE_ENTER;
        }
        recursivelyInsertClones(
          finishedWork,
          hostParentClone,
          parentViewTransition,
        );
        cloneState = prevCloneState;
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
      const prevCloneState = cloneState;
      if (cloneState === CLONE_ENTER) {
        // This was an Enter of a ViewTransition. We now move onto unhiding the inner
        // HostComponents and finding inner pairs.
        cloneState = CLONE_UNHIDE;
        // TODO: Mark the name and find a pair.
      }
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
      cloneState = prevCloneState;
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
  cloneState = CLONE_UPDATE;
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
