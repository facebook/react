/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, FiberRoot} from './ReactInternalTypes';

import type {Instance, TextInstance, Props} from './ReactFiberConfig';

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
  cancelViewTransitionName,
  applyViewTransitionName,
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
  trackHostMutation,
} from './ReactFiberMutationTracking';
import {
  MutationMask,
  Update,
  ContentReset,
  NoFlags,
  Visibility,
  ViewTransitionNamedStatic,
  ViewTransitionStatic,
  AffectedParentLayout,
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
import {
  restoreEnterOrExitViewTransitions,
  restoreNestedViewTransitions,
  restoreUpdateViewTransitionForGesture,
  appearingViewTransitions,
  commitEnterViewTransitions,
  measureNestedViewTransitions,
  measureUpdateViewTransition,
  viewTransitionCancelableChildren,
  pushViewTransitionCancelableScope,
  popViewTransitionCancelableScope,
} from './ReactFiberCommitViewTransitions';
import {
  getViewTransitionName,
  getViewTransitionClassName,
} from './ReactFiberViewTransitionComponent';

let didWarnForRootClone = false;

// Used during the apply phase to track whether a parent ViewTransition component
// might have been affected by any mutations / relayouts below.
let viewTransitionContextChanged: boolean = false;

function detectMutationOrInsertClones(finishedWork: Fiber): boolean {
  return true;
}

const CLONE_UPDATE = 0; // Mutations in this subtree or potentially affected by layout.
const CLONE_EXIT = 1; // Inside a reappearing offscreen before the next ViewTransition or HostComponent.
const CLONE_UNHIDE = 2; // Inside a reappearing offscreen before the next HostComponent.
const CLONE_APPEARING_PAIR = 3; // Like UNHIDE but we're already inside the first Host Component only finding pairs.
const CLONE_UNCHANGED = 4; // Nothing in this tree was changed but we're still walking to clone it.
const INSERT_EXIT = 5; // Inside a newly mounted tree before the next ViewTransition or HostComponent.
const INSERT_APPEND = 6; // Inside a newly mounted tree before the next HostComponent.
const INSERT_APPEARING_PAIR = 7; // Inside a newly mounted tree only finding pairs.
type VisitPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

function applyViewTransitionToClones(
  name: string,
  className: ?string,
  clones: Array<Instance>,
): void {
  // This gets called when we have found a pair, but after the clone in created. The clone is
  // created by the insertion side. If the insertion side if found before the deletion side
  // then this is called by the deletion. If the deletion is visited first then this is called
  // later by the insertion when the clone has been created.
  for (let i = 0; i < clones.length; i++) {
    applyViewTransitionName(
      clones[i],
      i === 0
        ? name
        : // If we have multiple Host Instances below, we add a suffix to the name to give
          // each one a unique name.
          name + '_' + i,
      className,
    );
  }
}

function trackDeletedPairViewTransitions(deletion: Fiber): void {
  if (
    appearingViewTransitions === null ||
    appearingViewTransitions.size === 0
  ) {
    // We've found all.
    return;
  }
  const pairs = appearingViewTransitions;
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
          const pair = pairs.get(name);
          if (pair !== undefined) {
            // Delete the entry so that we know when we've found all of them
            // and can stop searching (size reaches zero).
            pairs.delete(name);
            const className: ?string = getViewTransitionClassName(
              props.className,
              props.share,
            );
            if (className !== 'none') {
              // TODO: Since the deleted instance already has layout we could
              // check if it's in the viewport and if not skip the pairing.
              // It would currently cause layout thrash though so if we did that
              // we need to avoid inserting the root of the cloned trees until
              // the end.

              // The "old" instance is actually the one we're inserting.
              const oldInstance: ViewTransitionState = pair;
              // The "new" instance is the already mounted one we're deleting.
              const newInstance: ViewTransitionState = child.stateNode;
              oldInstance.paired = newInstance;
              newInstance.paired = oldInstance;
              const clones = oldInstance.clones;
              if (clones !== null) {
                // If we have clones that means that we've already visited this
                // ViewTransition boundary before and we can now apply the name
                // to those clones. Otherwise, we have to wait until we clone it.
                applyViewTransitionToClones(name, className, clones);
              }
            }
            if (pairs.size === 0) {
              break;
            }
          }
        }
      }
      trackDeletedPairViewTransitions(child);
    }
    child = child.sibling;
  }
}

function trackEnterViewTransitions(deletion: Fiber): void {
  if (deletion.tag === ViewTransitionComponent) {
    const props: ViewTransitionProps = deletion.memoizedProps;
    const name = getViewTransitionName(props, deletion.stateNode);
    const pair =
      appearingViewTransitions !== null
        ? appearingViewTransitions.get(name)
        : undefined;
    const className: ?string = getViewTransitionClassName(
      props.className,
      pair !== undefined ? props.share : props.enter,
    );
    if (className !== 'none') {
      if (pair !== undefined) {
        // TODO: Since the deleted instance already has layout we could
        // check if it's in the viewport and if not skip the pairing.
        // It would currently cause layout thrash though so if we did that
        // we need to avoid inserting the root of the cloned trees until
        // the end.

        // Delete the entry so that we know when we've found all of them
        // and can stop searching (size reaches zero).
        // $FlowFixMe[incompatible-use]: Refined by the pair.
        appearingViewTransitions.delete(name);
        // The "old" instance is actually the one we're inserting.
        const oldInstance: ViewTransitionState = pair;
        // The "new" instance is the already mounted one we're deleting.
        const newInstance: ViewTransitionState = deletion.stateNode;
        oldInstance.paired = newInstance;
        newInstance.paired = oldInstance;
        const clones = oldInstance.clones;
        if (clones !== null) {
          // If we have clones that means that we've already visited this
          // ViewTransition boundary before and we can now apply the name
          // to those clones. Otherwise, we have to wait until we clone it.
          applyViewTransitionToClones(name, className, clones);
        }
      }
    }
    // Look for more pairs deeper in the tree.
    trackDeletedPairViewTransitions(deletion);
  } else if ((deletion.subtreeFlags & ViewTransitionStatic) !== NoFlags) {
    let child = deletion.child;
    while (child !== null) {
      trackEnterViewTransitions(child);
      child = child.sibling;
    }
  } else {
    trackDeletedPairViewTransitions(deletion);
  }
}

function applyAppearingPairViewTransition(child: Fiber): void {
  // Normally these helpers do recursive calls but since insertion/offscreen is forked
  // we call this helper from those loops instead. This must be called only on
  // ViewTransitionComponent that has already had their clones filled.
  if ((child.flags & ViewTransitionNamedStatic) !== NoFlags) {
    const state: ViewTransitionState = child.stateNode;
    // If this is not yet paired, it doesn't mean that we won't pair it later when
    // we find the deletion side. If that's the case then we'll add the names to
    // the clones then.
    if (state.paired) {
      const props: ViewTransitionProps = child.memoizedProps;
      if (props.name == null || props.name === 'auto') {
        throw new Error(
          'Found a pair with an auto name. This is a bug in React.',
        );
      }
      const name = props.name;
      // Note that this class name that doesn't actually really matter because the
      // "new" side will be the one that wins in practice.
      const className: ?string = getViewTransitionClassName(
        props.className,
        props.share,
      );
      if (className !== 'none') {
        const clones = state.clones;
        // If there are no clones at this point, that should mean that there are no
        // HostComponent children in this ViewTransition.
        if (clones !== null) {
          applyViewTransitionToClones(name, className, clones);
        }
      }
    }
  }
}

function applyExitViewTransition(placement: Fiber): void {
  // Normally these helpers do recursive calls but since insertion/offscreen is forked
  // we call this helper from those loops instead. This must be called only on
  // ViewTransitionComponent that has already had their clones filled.
  const state: ViewTransitionState = placement.stateNode;
  const props: ViewTransitionProps = placement.memoizedProps;
  const name = getViewTransitionName(props, state);
  const className: ?string = getViewTransitionClassName(
    props.className,
    // Note that just because we don't have a pair yet doesn't mean we won't find one
    // later. However, that doesn't matter because if we do the class name that wins
    // is the one applied by the "new" side anyway.
    state.paired ? props.share : props.exit,
  );
  if (className !== 'none') {
    // TODO: Ideally we could determine if this exit is in the viewport and
    // exclude it otherwise but that would require waiting until we insert
    // and layout the clones first. Currently wait until the view transition
    // starts before reading the layout.
    const clones = state.clones;
    // If there are no clones at this point, that should mean that there are no
    // HostComponent children in this ViewTransition.
    if (clones !== null) {
      applyViewTransitionToClones(name, className, clones);
    }
  }
}

function applyNestedViewTransition(child: Fiber): void {
  const state: ViewTransitionState = child.stateNode;
  const props: ViewTransitionProps = child.memoizedProps;
  const name = getViewTransitionName(props, state);
  const className: ?string = getViewTransitionClassName(
    props.className,
    props.layout,
  );
  if (className !== 'none') {
    const clones = state.clones;
    // If there are no clones at this point, that should mean that there are no
    // HostComponent children in this ViewTransition.
    if (clones !== null) {
      applyViewTransitionToClones(name, className, clones);
    }
  }
}

function applyUpdateViewTransition(current: Fiber, finishedWork: Fiber): void {
  const state: ViewTransitionState = finishedWork.stateNode;
  // Updates can have conflicting names and classNames.
  // Since we're doing a reverse animation the "new" state is actually the current
  // and the "old" state is the finishedWork.
  const newProps: ViewTransitionProps = current.memoizedProps;
  const oldProps: ViewTransitionProps = finishedWork.memoizedProps;
  const oldName = getViewTransitionName(oldProps, state);
  // This className applies only if there are fewer child DOM nodes than
  // before or if this update should've been cancelled but we ended up with
  // a parent animating so we need to animate the child too. Otherwise
  // the "new" state wins. Since "new" normally wins, that's usually what
  // we would use. However, since this animation is going in reverse we actually
  // want the props from "current" since that's the class that would've won if
  // it was the normal direction. To preserve the same effect in either direction.
  let className: ?string = getViewTransitionClassName(
    newProps.className,
    newProps.update,
  );
  if (className === 'none') {
    className = getViewTransitionClassName(newProps.className, newProps.layout);
    if (className === 'none') {
      // If both update and layout are both "none" then we don't have to
      // apply a name. Since we won't animate this boundary.
      return;
    }
  }
  const clones = state.clones;
  // If there are no clones at this point, that should mean that there are no
  // HostComponent children in this ViewTransition.
  if (clones !== null) {
    applyViewTransitionToClones(oldName, className, clones);
  }
}

function recursivelyInsertNew(
  parentFiber: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
  visitPhase: VisitPhase,
): void {
  if (
    visitPhase === INSERT_APPEARING_PAIR &&
    parentViewTransition === null &&
    (parentFiber.subtreeFlags & ViewTransitionNamedStatic) === NoFlags
  ) {
    // We're just searching for pairs but we have reached the end.
    return;
  }
  let child = parentFiber.child;
  while (child !== null) {
    recursivelyInsertNewFiber(
      child,
      hostParentClone,
      parentViewTransition,
      visitPhase,
    );
    child = child.sibling;
  }
}

function recursivelyInsertNewFiber(
  finishedWork: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
  visitPhase: VisitPhase,
): void {
  switch (finishedWork.tag) {
    case HostHoistable: {
      if (supportsResources) {
        // TODO: Hoistables should get optimistically inserted and then removed.
        recursivelyInsertNew(
          finishedWork,
          hostParentClone,
          parentViewTransition,
          visitPhase,
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
          visitPhase,
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
      if (visitPhase !== INSERT_APPEARING_PAIR) {
        appendChild(hostParentClone, instance);
        trackHostMutation();
        recursivelyInsertNew(
          finishedWork,
          instance,
          null,
          INSERT_APPEARING_PAIR,
        );
      } else {
        recursivelyInsertNew(finishedWork, instance, null, visitPhase);
      }
      if (parentViewTransition !== null) {
        if (parentViewTransition.clones === null) {
          parentViewTransition.clones = [instance];
        } else {
          parentViewTransition.clones.push(instance);
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
      // For insertions we don't need to clone. It's already new state node.
      if (visitPhase !== INSERT_APPEARING_PAIR) {
        appendChild(hostParentClone, textInstance);
        trackHostMutation();
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
        // visibility so we don't need to update visitPhase here.
        recursivelyInsertNew(
          finishedWork,
          hostParentClone,
          parentViewTransition,
          visitPhase,
        );
      }
      break;
    }
    case ViewTransitionComponent:
      const prevMutationContext = pushMutationContext();
      const viewTransitionState: ViewTransitionState = finishedWork.stateNode;
      // TODO: If this was already cloned by a previous pass we can reuse those clones.
      viewTransitionState.clones = null;
      let nextPhase;
      if (visitPhase === INSERT_EXIT) {
        // This was an Enter of a ViewTransition. We now move onto inserting the inner
        // HostComponents and finding inner pairs.
        nextPhase = INSERT_APPEND;
      } else {
        nextPhase = visitPhase;
      }
      recursivelyInsertNew(
        finishedWork,
        hostParentClone,
        viewTransitionState,
        nextPhase,
      );
      // After we've inserted the new nodes into the "clones" set we can apply share
      // or exit transitions to them.
      if (visitPhase === INSERT_EXIT) {
        applyExitViewTransition(finishedWork);
      } else if (
        visitPhase === INSERT_APPEARING_PAIR ||
        visitPhase === INSERT_APPEND
      ) {
        applyAppearingPairViewTransition(finishedWork);
      }
      popMutationContext(prevMutationContext);
      break;
    default: {
      recursivelyInsertNew(
        finishedWork,
        hostParentClone,
        parentViewTransition,
        visitPhase,
      );
      break;
    }
  }
}

function recursivelyInsertClonesFromExistingTree(
  parentFiber: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
  visitPhase: VisitPhase,
): void {
  let child = parentFiber.child;
  while (child !== null) {
    switch (child.tag) {
      case HostComponent: {
        const instance: Instance = child.stateNode;
        let nextPhase: VisitPhase;
        switch (visitPhase) {
          case CLONE_EXIT:
          case CLONE_UNHIDE:
          case CLONE_APPEARING_PAIR:
            // If this was an unhide, we need to keep going if there are any named
            // pairs in this subtree, since they might need to be marked.
            nextPhase =
              (child.subtreeFlags & ViewTransitionNamedStatic) !== NoFlags
                ? CLONE_APPEARING_PAIR
                : CLONE_UNCHANGED;
            break;
          default:
            // We've found any "layout" View Transitions at this point so we can bail.
            nextPhase = CLONE_UNCHANGED;
        }
        let clone: Instance;
        if (nextPhase !== CLONE_UNCHANGED) {
          // We might need a handle on these clones, so we need to do a shallow clone
          // and keep going.
          clone = cloneMutableInstance(instance, false);
          recursivelyInsertClonesFromExistingTree(
            child,
            clone,
            null,
            nextPhase,
          );
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
        if (visitPhase === CLONE_EXIT || visitPhase === CLONE_UNHIDE) {
          unhideInstance(clone, child.memoizedProps);
          trackHostMutation();
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
        if (visitPhase === CLONE_EXIT || visitPhase === CLONE_UNHIDE) {
          unhideTextInstance(clone, child.memoizedProps);
          trackHostMutation();
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
          // visibility so we don't need to update visitPhase here.
          recursivelyInsertClonesFromExistingTree(
            child,
            hostParentClone,
            parentViewTransition,
            visitPhase,
          );
        }
        break;
      }
      case ViewTransitionComponent:
        const prevMutationContext = pushMutationContext();
        const viewTransitionState: ViewTransitionState = child.stateNode;
        // TODO: If this was already cloned by a previous pass we can reuse those clones.
        viewTransitionState.clones = null;
        let nextPhase;
        if (visitPhase === CLONE_EXIT) {
          // This was an Enter of a ViewTransition. We now move onto unhiding the inner
          // HostComponents and finding inner pairs.
          nextPhase = CLONE_UNHIDE;
          // TODO: Mark the name and find a pair.
        } else if (visitPhase === CLONE_UPDATE) {
          // If the tree had no mutations and we've found the top most ViewTransition
          // then this is the one we might apply the "layout" state too if it has changed
          // position. After we've found its HostComponents we can bail out.
          nextPhase = CLONE_UNCHANGED;
        } else {
          nextPhase = visitPhase;
        }
        recursivelyInsertClonesFromExistingTree(
          child,
          hostParentClone,
          viewTransitionState,
          nextPhase,
        );
        // After we've collected the cloned instances, we can apply exit or share transitions
        // to them.
        if (visitPhase === CLONE_EXIT) {
          applyExitViewTransition(child);
        } else if (
          visitPhase === CLONE_APPEARING_PAIR ||
          visitPhase === CLONE_UNHIDE
        ) {
          applyAppearingPairViewTransition(child);
        } else if (visitPhase === CLONE_UPDATE) {
          applyNestedViewTransition(child);
        }
        popMutationContext(prevMutationContext);
        break;
      default: {
        recursivelyInsertClonesFromExistingTree(
          child,
          hostParentClone,
          parentViewTransition,
          visitPhase,
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
  visitPhase: VisitPhase,
) {
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      trackEnterViewTransitions(childToDelete);
      // Normally we would only mark something as triggering a mutation if there was
      // actually a HostInstance below here. If this tree didn't contain a HostInstances
      // we shouldn't trigger a mutation even though a virtual component was deleted.
      trackHostMutation();
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
        visitPhase,
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
      visitPhase,
    );
  }
}

function insertDestinationClonesOfFiber(
  finishedWork: Fiber,
  hostParentClone: Instance,
  parentViewTransition: null | ViewTransitionState,
  visitPhase: VisitPhase,
) {
  const current = finishedWork.alternate;
  if (current === null) {
    // This is a newly mounted subtree. Insert any HostComponents and trigger
    // Enter transitions.
    recursivelyInsertNewFiber(
      finishedWork,
      hostParentClone,
      parentViewTransition,
      INSERT_EXIT,
    );
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
          visitPhase,
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
          visitPhase,
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
          trackHostMutation();
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

      if (visitPhase === CLONE_EXIT || visitPhase === CLONE_UNHIDE) {
        recursivelyInsertClones(
          finishedWork,
          clone,
          null,
          CLONE_APPEARING_PAIR,
        );
        appendChild(hostParentClone, clone);
        unhideInstance(clone, finishedWork.memoizedProps);
        trackHostMutation();
      } else {
        recursivelyInsertClones(finishedWork, clone, null, visitPhase);
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
        trackHostMutation();
      }
      appendChild(hostParentClone, clone);
      if (visitPhase === CLONE_EXIT || visitPhase === CLONE_UNHIDE) {
        unhideTextInstance(clone, finishedWork.memoizedProps);
        trackHostMutation();
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
        let nextPhase;
        if (visitPhase === CLONE_UPDATE && (flags & Visibility) !== NoFlags) {
          // This is the root of an appear. We need to trigger Enter transitions.
          nextPhase = CLONE_EXIT;
        } else {
          nextPhase = visitPhase;
        }
        recursivelyInsertClones(
          finishedWork,
          hostParentClone,
          parentViewTransition,
          nextPhase,
        );
      } else if (current !== null && current.memoizedState === null) {
        // Was previously mounted as visible but is now hidden.
        trackEnterViewTransitions(current);
        // Normally we would only mark something as triggering a mutation if there was
        // actually a HostInstance below here. If this tree didn't contain a HostInstances
        // we shouldn't trigger a mutation even though a virtual component was hidden.
        trackHostMutation();
      }
      break;
    }
    case ViewTransitionComponent:
      const prevMutationContext = pushMutationContext();
      const viewTransitionState: ViewTransitionState = finishedWork.stateNode;
      // TODO: If this was already cloned by a previous pass we can reuse those clones.
      viewTransitionState.clones = null;
      let nextPhase;
      if (visitPhase === CLONE_EXIT) {
        // This was an Enter of a ViewTransition. We now move onto unhiding the inner
        // HostComponents and finding inner pairs.
        nextPhase = CLONE_UNHIDE;
        // TODO: Mark the name and find a pair.
      } else {
        nextPhase = visitPhase;
      }
      recursivelyInsertClones(
        finishedWork,
        hostParentClone,
        viewTransitionState,
        nextPhase,
      );
      if (viewTransitionMutationContext) {
        // Track that this boundary had a mutation and therefore needs to animate
        // whether it resized or not.
        finishedWork.flags |= Update;
      }
      // After we've collected the cloned instances, we can apply exit or share transitions
      // to them.
      if (visitPhase === CLONE_EXIT) {
        applyExitViewTransition(finishedWork);
      } else if (
        visitPhase === CLONE_APPEARING_PAIR ||
        visitPhase === CLONE_UNHIDE
      ) {
        applyAppearingPairViewTransition(finishedWork);
      } else if (visitPhase === CLONE_UPDATE) {
        applyUpdateViewTransition(current, finishedWork);
      }
      popMutationContext(prevMutationContext);
      break;
    default: {
      recursivelyInsertClones(
        finishedWork,
        hostParentClone,
        parentViewTransition,
        visitPhase,
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
    recursivelyInsertClones(finishedWork, rootClone, null, CLONE_UPDATE);
  } else {
    root.gestureClone = null;
    cancelRootViewTransitionName(root.containerInfo);
  }
}

function measureExitViewTransitions(placement: Fiber): void {
  if (placement.tag === ViewTransitionComponent) {
    // const state: ViewTransitionState = placement.stateNode;
    const props: ViewTransitionProps = placement.memoizedProps;
    const name = props.name;
    if (name != null && name !== 'auto') {
      // TODO: Find a pair
    }
  } else if ((placement.subtreeFlags & ViewTransitionStatic) !== NoFlags) {
    // TODO: Check if this is a hidden Offscreen or a Portal.
    let child = placement.child;
    while (child !== null) {
      measureExitViewTransitions(child);
      child = child.sibling;
    }
  } else {
    // We don't need to find pairs here because we would've already found and
    // measured the pairs inside the deletion phase.
  }
}

function recursivelyApplyViewTransitions(parentFiber: Fiber) {
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitEnterViewTransitions(childToDelete, true);
    }
  }

  if (
    parentFiber.alternate === null ||
    (parentFiber.subtreeFlags & MutationMask) !== NoFlags
  ) {
    // If we have mutations or if this is a newly inserted tree, clone as we go.
    let child = parentFiber.child;
    while (child !== null) {
      applyViewTransitionsOnFiber(child);
      child = child.sibling;
    }
  } else {
    // Nothing has changed in this subtree, but the parent may have still affected
    // its size and position. We need to measure the old and new state to see if
    // we should animate its size and position.
    measureNestedViewTransitions(parentFiber, true);
  }
}

function applyViewTransitionsOnFiber(finishedWork: Fiber) {
  const current = finishedWork.alternate;
  if (current === null) {
    measureExitViewTransitions(finishedWork);
    return;
  }

  const flags = finishedWork.flags;
  // The effect flag should be checked *after* we refine the type of fiber,
  // because the fiber tag is more specific. An exception is any flag related
  // to reconciliation, because those can be set on all fiber types.
  switch (finishedWork.tag) {
    case HostPortal: {
      // TODO: Consider what should happen to Portals. For now we exclude them.
      break;
    }
    case OffscreenComponent: {
      if (flags & Visibility) {
        const newState: OffscreenState | null = finishedWork.memoizedState;
        const isHidden = newState !== null;
        if (!isHidden) {
          measureExitViewTransitions(finishedWork);
        } else if (current !== null && current.memoizedState === null) {
          // Was previously mounted as visible but is now hidden.
          commitEnterViewTransitions(current, true);
        }
      }
      break;
    }
    case ViewTransitionComponent: {
      const prevContextChanged = viewTransitionContextChanged;
      const prevCancelableChildren = pushViewTransitionCancelableScope();
      viewTransitionContextChanged = false;
      recursivelyApplyViewTransitions(finishedWork);

      if (viewTransitionContextChanged) {
        finishedWork.flags |= Update;
      }

      const inViewport = measureUpdateViewTransition(
        current,
        finishedWork,
        true,
      );

      if ((finishedWork.flags & Update) === NoFlags || !inViewport) {
        // If this boundary didn't update, then we may be able to cancel its children.
        // We bubble them up to the parent set to be determined later if we can cancel.
        // Similarly, if old and new state was outside the viewport, we can skip it
        // even if it did update.
        if (prevCancelableChildren === null) {
          // Bubbling up this whole set to the parent.
        } else {
          // Merge with parent set.
          // $FlowFixMe[method-unbinding]
          prevCancelableChildren.push.apply(
            prevCancelableChildren,
            viewTransitionCancelableChildren,
          );
          popViewTransitionCancelableScope(prevCancelableChildren);
        }
        // TODO: If this doesn't end up canceled, because a parent animates,
        // then we should probably issue an event since this instance is part of it.
      } else {
        // TODO: Schedule gesture events.
        // If this boundary did update, we cannot cancel its children so those are dropped.
        popViewTransitionCancelableScope(prevCancelableChildren);
      }

      if ((finishedWork.flags & AffectedParentLayout) !== NoFlags) {
        // This boundary changed size in a way that may have caused its parent to
        // relayout. We need to bubble this information up to the parent.
        viewTransitionContextChanged = true;
      } else {
        // Otherwise, we restore it to whatever the parent had found so far.
        viewTransitionContextChanged = prevContextChanged;
      }

      const viewTransitionState: ViewTransitionState = finishedWork.stateNode;
      viewTransitionState.clones = null; // Reset
      break;
    }
    default: {
      recursivelyApplyViewTransitions(finishedWork);
      break;
    }
  }
}

// Revert insertions and apply view transition names to the "new" (current) state.
export function applyDepartureTransitions(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  // First measure and apply view-transition-names to the "new" states.
  viewTransitionContextChanged = false;
  pushViewTransitionCancelableScope();

  recursivelyApplyViewTransitions(finishedWork);

  // Then remove the clones.
  const rootClone = root.gestureClone;
  if (rootClone !== null) {
    root.gestureClone = null;
    removeRootViewTransitionClone(root.containerInfo, rootClone);
  }

  if (!viewTransitionContextChanged) {
    // If we didn't leak any resizing out to the root, we don't have to transition
    // the root itself. This means that we can now safely cancel any cancellations
    // that bubbled all the way up.
    const cancelableChildren = viewTransitionCancelableChildren;
    if (cancelableChildren !== null) {
      for (let i = 0; i < cancelableChildren.length; i += 3) {
        cancelViewTransitionName(
          ((cancelableChildren[i]: any): Instance),
          ((cancelableChildren[i + 1]: any): string),
          ((cancelableChildren[i + 2]: any): Props),
        );
      }
    }
    // We also cancel the root itself. First we restore the name to the documentElement
    // and then we cancel it.
    restoreRootViewTransitionName(root.containerInfo);
    cancelRootViewTransitionName(root.containerInfo);
  }
  popViewTransitionCancelableScope(null);
}

function recursivelyRestoreViewTransitions(parentFiber: Fiber) {
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      restoreEnterOrExitViewTransitions(childToDelete);
    }
  }

  if (
    parentFiber.alternate === null ||
    (parentFiber.subtreeFlags & MutationMask) !== NoFlags
  ) {
    // If we have mutations or if this is a newly inserted tree, clone as we go.
    let child = parentFiber.child;
    while (child !== null) {
      restoreViewTransitionsOnFiber(child);
      child = child.sibling;
    }
  } else {
    // Nothing has changed in this subtree, but the parent may have still affected
    // its size and position. We need to measure the old and new state to see if
    // we should animate its size and position.
    restoreNestedViewTransitions(parentFiber);
  }
}

function restoreViewTransitionsOnFiber(finishedWork: Fiber) {
  const current = finishedWork.alternate;
  if (current === null) {
    restoreEnterOrExitViewTransitions(finishedWork);
    return;
  }

  const flags = finishedWork.flags;
  // The effect flag should be checked *after* we refine the type of fiber,
  // because the fiber tag is more specific. An exception is any flag related
  // to reconciliation, because those can be set on all fiber types.
  switch (finishedWork.tag) {
    case HostPortal: {
      // TODO: Consider what should happen to Portals. For now we exclude them.
      break;
    }
    case OffscreenComponent: {
      if (flags & Visibility) {
        const newState: OffscreenState | null = finishedWork.memoizedState;
        const isHidden = newState !== null;
        if (!isHidden) {
          restoreEnterOrExitViewTransitions(finishedWork);
        } else if (current !== null && current.memoizedState === null) {
          // Was previously mounted as visible but is now hidden.
          restoreEnterOrExitViewTransitions(current);
        }
      }
      break;
    }
    case ViewTransitionComponent:
      restoreUpdateViewTransitionForGesture(current, finishedWork);
      recursivelyRestoreViewTransitions(finishedWork);
      break;
    default: {
      recursivelyRestoreViewTransitions(finishedWork);
      break;
    }
  }
}

// Revert transition names and start/adjust animations on the started View Transition.
export function startGestureAnimations(
  root: FiberRoot,
  finishedWork: Fiber,
): void {
  restoreViewTransitionsOnFiber(finishedWork);
  restoreRootViewTransitionName(root.containerInfo);
}
