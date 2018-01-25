/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostConfig} from 'react-reconciler';
import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {HostContext} from './ReactFiberHostContext';
import type {HydrationContext} from './ReactFiberHydrationContext';
import type {FiberRoot} from './ReactFiberRoot';

import {
  enableMutatingReconciler,
  enablePersistentReconciler,
  enableNoopReconciler,
} from 'shared/ReactFeatureFlags';
import {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CallComponent,
  CallHandlerPhase,
  ReturnComponent,
  ContextProvider,
  ContextConsumer,
  Fragment,
  Mode,
} from 'shared/ReactTypeOfWork';
import {Placement, Ref, Update} from 'shared/ReactTypeOfSideEffect';
import invariant from 'fbjs/lib/invariant';

import {reconcileChildFibers} from './ReactChildFiber';
import {
  popContextProvider as popLegacyContextProvider,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext';
import {popProvider} from './ReactFiberNewContext';

export default function<T, P, I, TI, HI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL>,
  hostContext: HostContext<C, CX>,
  hydrationContext: HydrationContext<C, CX>,
) {
  const {
    createInstance,
    createTextInstance,
    appendInitialChild,
    finalizeInitialChildren,
    prepareUpdate,
    mutation,
    persistence,
  } = config;

  const {
    getRootHostContainer,
    popHostContext,
    getHostContext,
    popHostContainer,
  } = hostContext;

  const {
    prepareToHydrateHostInstance,
    prepareToHydrateHostTextInstance,
    popHydrationState,
  } = hydrationContext;

  function markUpdate(workInProgress: Fiber) {
    // Tag the fiber with an update effect. This turns a Placement into
    // an UpdateAndPlacement.
    workInProgress.effectTag |= Update;
  }

  function markRef(workInProgress: Fiber) {
    workInProgress.effectTag |= Ref;
  }

  function appendAllReturns(returns: Array<mixed>, workInProgress: Fiber) {
    let node = workInProgress.stateNode;
    if (node) {
      node.return = workInProgress;
    }
    while (node !== null) {
      if (
        node.tag === HostComponent ||
        node.tag === HostText ||
        node.tag === HostPortal
      ) {
        invariant(false, 'A call cannot have host component children.');
      } else if (node.tag === ReturnComponent) {
        returns.push(node.pendingProps.value);
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function moveCallToHandlerPhase(
    current: Fiber | null,
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ) {
    const props = workInProgress.memoizedProps;
    invariant(
      props,
      'Should be resolved by now. This error is likely caused by a bug in ' +
        'React. Please file an issue.',
    );

    // First step of the call has completed. Now we need to do the second.
    // TODO: It would be nice to have a multi stage call represented by a
    // single component, or at least tail call optimize nested ones. Currently
    // that requires additional fields that we don't want to add to the fiber.
    // So this requires nested handlers.
    // Note: This doesn't mutate the alternate node. I don't think it needs to
    // since this stage is reset for every pass.
    workInProgress.tag = CallHandlerPhase;

    // Build up the returns.
    // TODO: Compare this to a generator or opaque helpers like Children.
    const returns: Array<mixed> = [];
    appendAllReturns(returns, workInProgress);
    const fn = props.handler;
    const childProps = props.props;
    const nextChildren = fn(childProps, returns);

    const currentFirstChild = current !== null ? current.child : null;
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      currentFirstChild,
      nextChildren,
      renderExpirationTime,
    );
    return workInProgress.child;
  }

  function appendAllChildren(parent: I, workInProgress: Fiber) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    let node = workInProgress.child;
    while (node !== null) {
      if (node.tag === HostComponent || node.tag === HostText) {
        appendInitialChild(parent, node.stateNode);
      } else if (node.tag === HostPortal) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === workInProgress) {
        return;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  let updateHostContainer;
  let updateHostComponent;
  let updateHostText;
  if (mutation) {
    if (enableMutatingReconciler) {
      // Mutation mode
      updateHostContainer = function(workInProgress: Fiber) {
        // Noop
      };
      updateHostComponent = function(
        current: Fiber,
        workInProgress: Fiber,
        updatePayload: null | PL,
        type: T,
        oldProps: P,
        newProps: P,
        rootContainerInstance: C,
        currentHostContext: CX,
      ) {
        // TODO: Type this specific to this type of component.
        workInProgress.updateQueue = (updatePayload: any);
        // If the update payload indicates that there is a change or if there
        // is a new ref we mark this as an update. All the work is done in commitWork.
        if (updatePayload) {
          markUpdate(workInProgress);
        }
      };
      updateHostText = function(
        current: Fiber,
        workInProgress: Fiber,
        oldText: string,
        newText: string,
      ) {
        // If the text differs, mark it as an update. All the work in done in commitWork.
        if (oldText !== newText) {
          markUpdate(workInProgress);
        }
      };
    } else {
      invariant(false, 'Mutating reconciler is disabled.');
    }
  } else if (persistence) {
    if (enablePersistentReconciler) {
      // Persistent host tree mode
      const {
        cloneInstance,
        createContainerChildSet,
        appendChildToContainerChildSet,
        finalizeContainerChildren,
      } = persistence;

      // An unfortunate fork of appendAllChildren because we have two different parent types.
      const appendAllChildrenToContainer = function(
        containerChildSet: CC,
        workInProgress: Fiber,
      ) {
        // We only have the top Fiber that was created but we need recurse down its
        // children to find all the terminal nodes.
        let node = workInProgress.child;
        while (node !== null) {
          if (node.tag === HostComponent || node.tag === HostText) {
            appendChildToContainerChildSet(containerChildSet, node.stateNode);
          } else if (node.tag === HostPortal) {
            // If we have a portal child, then we don't want to traverse
            // down its children. Instead, we'll get insertions from each child in
            // the portal directly.
          } else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
          }
          if (node === workInProgress) {
            return;
          }
          while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress) {
              return;
            }
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      };
      updateHostContainer = function(workInProgress: Fiber) {
        const portalOrRoot: {containerInfo: C, pendingChildren: CC} =
          workInProgress.stateNode;
        const childrenUnchanged = workInProgress.firstEffect === null;
        if (childrenUnchanged) {
          // No changes, just reuse the existing instance.
        } else {
          const container = portalOrRoot.containerInfo;
          let newChildSet = createContainerChildSet(container);
          if (finalizeContainerChildren(container, newChildSet)) {
            markUpdate(workInProgress);
          }
          portalOrRoot.pendingChildren = newChildSet;
          // If children might have changed, we have to add them all to the set.
          appendAllChildrenToContainer(newChildSet, workInProgress);
          // Schedule an update on the container to swap out the container.
          markUpdate(workInProgress);
        }
      };
      updateHostComponent = function(
        current: Fiber,
        workInProgress: Fiber,
        updatePayload: null | PL,
        type: T,
        oldProps: P,
        newProps: P,
        rootContainerInstance: C,
        currentHostContext: CX,
      ) {
        // If there are no effects associated with this node, then none of our children had any updates.
        // This guarantees that we can reuse all of them.
        const childrenUnchanged = workInProgress.firstEffect === null;
        const currentInstance = current.stateNode;
        if (childrenUnchanged && updatePayload === null) {
          // No changes, just reuse the existing instance.
          // Note that this might release a previous clone.
          workInProgress.stateNode = currentInstance;
        } else {
          let recyclableInstance = workInProgress.stateNode;
          let newInstance = cloneInstance(
            currentInstance,
            updatePayload,
            type,
            oldProps,
            newProps,
            workInProgress,
            childrenUnchanged,
            recyclableInstance,
          );
          if (
            finalizeInitialChildren(
              newInstance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext,
            )
          ) {
            markUpdate(workInProgress);
          }
          workInProgress.stateNode = newInstance;
          if (childrenUnchanged) {
            // If there are no other effects in this tree, we need to flag this node as having one.
            // Even though we're not going to use it for anything.
            // Otherwise parents won't know that there are new children to propagate upwards.
            markUpdate(workInProgress);
          } else {
            // If children might have changed, we have to add them all to the set.
            appendAllChildren(newInstance, workInProgress);
          }
        }
      };
      updateHostText = function(
        current: Fiber,
        workInProgress: Fiber,
        oldText: string,
        newText: string,
      ) {
        if (oldText !== newText) {
          // If the text content differs, we'll create a new text instance for it.
          const rootContainerInstance = getRootHostContainer();
          const currentHostContext = getHostContext();
          workInProgress.stateNode = createTextInstance(
            newText,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );
          // We'll have to mark it as having an effect, even though we won't use the effect for anything.
          // This lets the parents know that at least one of their children has changed.
          markUpdate(workInProgress);
        }
      };
    } else {
      invariant(false, 'Persistent reconciler is disabled.');
    }
  } else {
    if (enableNoopReconciler) {
      // No host operations
      updateHostContainer = function(workInProgress: Fiber) {
        // Noop
      };
      updateHostComponent = function(
        current: Fiber,
        workInProgress: Fiber,
        updatePayload: null | PL,
        type: T,
        oldProps: P,
        newProps: P,
        rootContainerInstance: C,
        currentHostContext: CX,
      ) {
        // Noop
      };
      updateHostText = function(
        current: Fiber,
        workInProgress: Fiber,
        oldText: string,
        newText: string,
      ) {
        // Noop
      };
    } else {
      invariant(false, 'Noop reconciler is disabled.');
    }
  }

  function completeWork(
    current: Fiber | null,
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ): Fiber | null {
    const newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
      case FunctionalComponent:
        return null;
      case ClassComponent: {
        // We are leaving this subtree, so pop context if any.
        popLegacyContextProvider(workInProgress);
        return null;
      }
      case HostRoot: {
        popHostContainer(workInProgress);
        popTopLevelLegacyContextObject(workInProgress);
        const fiberRoot = (workInProgress.stateNode: FiberRoot);
        if (fiberRoot.pendingContext) {
          fiberRoot.context = fiberRoot.pendingContext;
          fiberRoot.pendingContext = null;
        }

        if (current === null || current.child === null) {
          // If we hydrated, pop so that we can delete any remaining children
          // that weren't hydrated.
          popHydrationState(workInProgress);
          // This resets the hacky state to fix isMounted before committing.
          // TODO: Delete this when we delete isMounted and findDOMNode.
          workInProgress.effectTag &= ~Placement;
        }
        updateHostContainer(workInProgress);
        return null;
      }
      case HostComponent: {
        popHostContext(workInProgress);
        const rootContainerInstance = getRootHostContainer();
        const type = workInProgress.type;
        if (current !== null && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          const oldProps = current.memoizedProps;
          // If we get updated because one of our children updated, we don't
          // have newProps so we'll have to reuse them.
          // TODO: Split the update API as separate for the props vs. children.
          // Even better would be if children weren't special cased at all tho.
          const instance: I = workInProgress.stateNode;
          const currentHostContext = getHostContext();
          const updatePayload = prepareUpdate(
            instance,
            type,
            oldProps,
            newProps,
            rootContainerInstance,
            currentHostContext,
          );

          updateHostComponent(
            current,
            workInProgress,
            updatePayload,
            type,
            oldProps,
            newProps,
            rootContainerInstance,
            currentHostContext,
          );

          if (current.ref !== workInProgress.ref) {
            markRef(workInProgress);
          }
        } else {
          if (!newProps) {
            invariant(
              workInProgress.stateNode !== null,
              'We must have new props for new mounts. This error is likely ' +
                'caused by a bug in React. Please file an issue.',
            );
            // This can happen when we abort work.
            return null;
          }

          const currentHostContext = getHostContext();
          // TODO: Move createInstance to beginWork and keep it on a context
          // "stack" as the parent. Then append children as we go in beginWork
          // or completeWork depending on we want to add then top->down or
          // bottom->up. Top->down is faster in IE11.
          let wasHydrated = popHydrationState(workInProgress);
          if (wasHydrated) {
            // TODO: Move this and createInstance step into the beginPhase
            // to consolidate.
            if (
              prepareToHydrateHostInstance(
                workInProgress,
                rootContainerInstance,
                currentHostContext,
              )
            ) {
              // If changes to the hydrated node needs to be applied at the
              // commit-phase we mark this as such.
              markUpdate(workInProgress);
            }
          } else {
            let instance = createInstance(
              type,
              newProps,
              rootContainerInstance,
              currentHostContext,
              workInProgress,
            );

            appendAllChildren(instance, workInProgress);

            // Certain renderers require commit-time effects for initial mount.
            // (eg DOM renderer supports auto-focus for certain elements).
            // Make sure such renderers get scheduled for later work.
            if (
              finalizeInitialChildren(
                instance,
                type,
                newProps,
                rootContainerInstance,
                currentHostContext,
              )
            ) {
              markUpdate(workInProgress);
            }
            workInProgress.stateNode = instance;
          }

          if (workInProgress.ref !== null) {
            // If there is a ref on a host node we need to schedule a callback
            markRef(workInProgress);
          }
        }
        return null;
      }
      case HostText: {
        let newText = newProps;
        if (current && workInProgress.stateNode != null) {
          const oldText = current.memoizedProps;
          // If we have an alternate, that means this is an update and we need
          // to schedule a side-effect to do the updates.
          updateHostText(current, workInProgress, oldText, newText);
        } else {
          if (typeof newText !== 'string') {
            invariant(
              workInProgress.stateNode !== null,
              'We must have new props for new mounts. This error is likely ' +
                'caused by a bug in React. Please file an issue.',
            );
            // This can happen when we abort work.
            return null;
          }
          const rootContainerInstance = getRootHostContainer();
          const currentHostContext = getHostContext();
          let wasHydrated = popHydrationState(workInProgress);
          if (wasHydrated) {
            if (prepareToHydrateHostTextInstance(workInProgress)) {
              markUpdate(workInProgress);
            }
          } else {
            workInProgress.stateNode = createTextInstance(
              newText,
              rootContainerInstance,
              currentHostContext,
              workInProgress,
            );
          }
        }
        return null;
      }
      case CallComponent:
        return moveCallToHandlerPhase(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case CallHandlerPhase:
        // Reset the tag to now be a first phase call.
        workInProgress.tag = CallComponent;
        return null;
      case ReturnComponent:
        // Does nothing.
        return null;
      case Fragment:
        return null;
      case Mode:
        return null;
      case HostPortal:
        popHostContainer(workInProgress);
        updateHostContainer(workInProgress);
        return null;
      case ContextProvider:
        // Pop provider fiber
        popProvider(workInProgress);
        return null;
      case ContextConsumer:
        return null;
      // Error cases
      case IndeterminateComponent:
        invariant(
          false,
          'An indeterminate component should have become determinate before ' +
            'completing. This error is likely caused by a bug in React. Please ' +
            'file an issue.',
        );
      // eslint-disable-next-line no-fallthrough
      default:
        invariant(
          false,
          'Unknown unit of work tag. This error is likely caused by a bug in ' +
            'React. Please file an issue.',
        );
    }
  }

  return {
    completeWork,
  };
}
