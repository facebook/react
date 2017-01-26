/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCommitWork
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { HostConfig } from 'ReactFiberReconciler';

var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CoroutineComponent,
} = ReactTypeOfWork;
var { commitCallbacks } = require('ReactFiberUpdateQueue');
var { onCommitUnmount } = require('ReactFiberDevToolsHook');

var {
  Placement,
  Update,
  Callback,
  ContentReset,
} = require('ReactTypeOfSideEffect');

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config : HostConfig<T, P, I, TI, PI, C, CX, PL>,
  captureError : (failedFiber : Fiber, error: Error) => ?Fiber
) {

  const {
    commitMount,
    commitUpdate,
    resetTextContent,
    commitTextUpdate,
    appendChild,
    insertBefore,
    removeChild,
    getPublicInstance,
  } = config;

  // Capture errors so they don't interrupt unmounting.
  function safelyCallComponentWillUnmount(current, instance) {
    try {
      instance.componentWillUnmount();
    } catch (error) {
      captureError(current, error);
    }
  }

  // Capture errors so they don't interrupt unmounting.
  function safelyDetachRef(current : Fiber) {
    try {
      const ref = current.ref;
      if (ref) {
        ref(null);
      }
    } catch (error) {
      captureError(current, error);
    }
  }

  // Only called during update. It's ok to throw.
  function detachRefIfNeeded(current : ?Fiber, finishedWork : Fiber) {
    if (current) {
      const currentRef = current.ref;
      if (currentRef && currentRef !== finishedWork.ref) {
        currentRef(null);
      }
    }
  }

  function getHostParent(fiber : Fiber) : I | C {
    let parent = fiber.return;
    while (parent) {
      switch (parent.tag) {
        case HostComponent:
          return parent.stateNode;
        case HostRoot:
          return parent.stateNode.containerInfo;
        case HostPortal:
          return parent.stateNode.containerInfo;
      }
      parent = parent.return;
    }
    throw new Error('Expected to find a host parent.');
  }

  function getHostParentFiber(fiber : Fiber) : Fiber {
    let parent = fiber.return;
    while (parent) {
      if (isHostParent(parent)) {
        return parent;
      }
      parent = parent.return;
    }
    throw new Error('Expected to find a host parent.');
  }

  function isHostParent(fiber : Fiber) : boolean {
    return (
      fiber.tag === HostComponent ||
      fiber.tag === HostRoot ||
      fiber.tag === HostPortal
    );
  }

  function getHostSibling(fiber : Fiber) : ?I {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    // TODO: Find a more efficient way to do this.
    let node : Fiber = fiber;
    siblings: while (true) {
      // If we didn't find anything, let's try the next sibling.
      while (!node.sibling) {
        if (!node.return || isHostParent(node.return)) {
          // If we pop out of the root or hit the parent the fiber we are the
          // last sibling.
          return null;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
      while (node.tag !== HostComponent && node.tag !== HostText) {
        // If it is not host node and, we might have a host node inside it.
        // Try to search down until we find one.
        if (node.effectTag & Placement) {
          // If we don't have a child, try the siblings instead.
          continue siblings;
        }
        // If we don't have a child, try the siblings instead.
        // We also skip portals because they are not part of this host tree.
        if (!node.child || node.tag === HostPortal) {
          continue siblings;
        } else {
          node.child.return = node;
          node = node.child;
        }
      }
      // Check if this host node is stable or about to be placed.
      if (!(node.effectTag & Placement)) {
        // Found it!
        return node.stateNode;
      }
    }
  }

  function commitPlacement(finishedWork : Fiber) : void {
    // Recursively insert all host nodes into the parent.
    const parentFiber = getHostParentFiber(finishedWork);
    let parent;
    switch (parentFiber.tag) {
      case HostComponent:
        parent = parentFiber.stateNode;
        break;
      case HostRoot:
        parent = parentFiber.stateNode.containerInfo;
        break;
      case HostPortal:
        parent = parentFiber.stateNode.containerInfo;
        break;
      default:
        throw new Error('Invalid host parent fiber.');
    }
    if (parentFiber.effectTag & ContentReset) {
      // Reset the text content of the parent before doing any insertions
      resetTextContent(parent);
      // Clear ContentReset from the effect tag
      parentFiber.effectTag &= ~ContentReset;
    }

    const before = getHostSibling(finishedWork);
    // We only have the top Fiber that was inserted but we need recurse down its
    // children to find all the terminal nodes.
    let node : Fiber = finishedWork;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        if (before) {
          insertBefore(parent, node.stateNode, before);
        } else {
          appendChild(parent, node.stateNode);
        }
      } else if (node.tag === HostPortal) {
        // If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === finishedWork) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === finishedWork) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function commitNestedUnmounts(root : Fiber): void {
    // While we're inside a removed host node we don't want to call
    // removeChild on the inner nodes because they're removed by the top
    // call anyway. We also want to call componentWillUnmount on all
    // composites before this host node is removed from the tree. Therefore
    // we do an inner loop while we're still inside the host node.
    let node : Fiber = root;
    while (true) {
      commitUnmount(node);
      // Visit children because they may contain more composite or host nodes.
      // Skip portals because commitUnmount() currently visits them recursively.
      if (node.child && node.tag !== HostPortal) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === root) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === root) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function unmountHostComponents(parent, current): void {
    // We only have the top Fiber that was inserted but we need recurse down its
    // children to find all the terminal nodes.
    let node : Fiber = current;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        commitNestedUnmounts(node);
        // After all the children have unmounted, it is now safe to remove the
        // node from the tree.
        removeChild(parent, node.stateNode);
        // Don't visit children because we already visited them.
      } else if (node.tag === HostPortal) {
        // When we go into a portal, it becomes the parent to remove from.
        // We will reassign it back when we pop the portal on the way up.
        parent = node.stateNode.containerInfo;
        // Visit children because portals might contain host components.
        if (node.child) {
          node.child.return = node;
          node = node.child;
          continue;
        }
      } else {
        commitUnmount(node);
        // Visit children because we may find more host components below.
        if (node.child) {
          node.child.return = node;
          node = node.child;
          continue;
        }
      }
      if (node === current) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === current) {
          return;
        }
        node = node.return;
        if (node.tag === HostPortal) {
          // When we go out of the portal, we need to restore the parent.
          // Since we don't keep a stack of them, we will search for it.
          parent = getHostParent(node);
        }
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function commitDeletion(current : Fiber) : void {
    // Recursively delete all host nodes from the parent.
    const parent = getHostParent(current);
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(parent, current);

    // Cut off the return pointers to disconnect it from the tree. Ideally, we
    // should clear the child pointer of the parent alternate to let this
    // get GC:ed but we don't know which for sure which parent is the current
    // one so we'll settle for GC:ing the subtree of this child. This child
    // itself will be GC:ed when the parent updates the next time.
    current.return = null;
    current.child = null;
    if (current.alternate) {
      current.alternate.child = null;
      current.alternate.return = null;
    }
  }

  // User-originating errors (lifecycles and refs) should not interrupt
  // deletion, so don't let them throw. Host-originating errors should
  // interrupt deletion, so it's okay
  function commitUnmount(current : Fiber) : void {
    if (typeof onCommitUnmount === 'function') {
      onCommitUnmount(current);
    }

    switch (current.tag) {
      case ClassComponent: {
        safelyDetachRef(current);
        const instance = current.stateNode;
        if (typeof instance.componentWillUnmount === 'function') {
          safelyCallComponentWillUnmount(current, instance);
        }
        return;
      }
      case HostComponent: {
        safelyDetachRef(current);
        return;
      }
      case CoroutineComponent: {
        commitNestedUnmounts(current.stateNode);
        return;
      }
      case HostPortal: {
        // TODO: this is recursive.
        // We are also not using this parent because
        // the portal will get pushed immediately.
        const parent = getHostParent(current);
        unmountHostComponents(parent, current);
        return;
      }
    }
  }

  function commitWork(current : ?Fiber, finishedWork : Fiber) : void {
    switch (finishedWork.tag) {
      case ClassComponent: {
        detachRefIfNeeded(current, finishedWork);
        return;
      }
      case HostComponent: {
        const instance : I = finishedWork.stateNode;
        if (instance != null && current) {
          // Commit the work prepared earlier.
          const newProps = finishedWork.memoizedProps;
          const oldProps = current.memoizedProps;
          const type = finishedWork.type;
          // TODO: Type the updateQueue to be specific to host components.
          const updatePayload : null | PL = (finishedWork.updateQueue : any);
          finishedWork.updateQueue = null;
          if (updatePayload) {
            commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
          }
        }
        detachRefIfNeeded(current, finishedWork);
        return;
      }
      case HostText: {
        if (finishedWork.stateNode == null || !current) {
          throw new Error('This should only be done during updates.');
        }
        const textInstance : TI = finishedWork.stateNode;
        const newText : string = finishedWork.memoizedProps;
        const oldText : string = current.memoizedProps;
        commitTextUpdate(textInstance, oldText, newText);
        return;
      }
      case HostRoot: {
        return;
      }
      case HostPortal: {
        return;
      }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  function commitLifeCycles(current : ?Fiber, finishedWork : Fiber) : void {
    switch (finishedWork.tag) {
      case ClassComponent: {
        const instance = finishedWork.stateNode;
        if (finishedWork.effectTag & Update) {
          if (!current) {
            if (typeof instance.componentDidMount === 'function') {
              instance.componentDidMount();
            }
          } else {
            if (typeof instance.componentDidUpdate === 'function') {
              const prevProps = current.memoizedProps;
              const prevState = current.memoizedState;
              instance.componentDidUpdate(prevProps, prevState);
            }
          }
        }
        if ((finishedWork.effectTag & Callback) && finishedWork.updateQueue) {
          commitCallbacks(finishedWork, finishedWork.updateQueue, instance);
        }
        return;
      }
      case HostRoot: {
        const updateQueue = finishedWork.updateQueue;
        if (updateQueue) {
          const instance = finishedWork.child && finishedWork.child.stateNode;
          commitCallbacks(finishedWork, updateQueue, instance);
        }
        return;
      }
      case HostComponent: {
        const instance : I = finishedWork.stateNode;

        // Renderers may schedule work to be done after host components are mounted
        // (eg DOM renderer may schedule auto-focus for inputs and form controls).
        // These effects should only be committed when components are first mounted,
        // aka when there is no current/alternate.
        if (
          !current &&
          finishedWork.effectTag & Update
        ) {
          const type = finishedWork.type;
          const props = finishedWork.memoizedProps;
          commitMount(instance, type, props, finishedWork);
        }

        return;
      }
      case HostText: {
        // We have no life-cycles associated with text.
        return;
      }
      case HostPortal: {
        // We have no life-cycles associated with portals.
        return;
      }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  function commitRef(finishedWork : Fiber) {
    if (finishedWork.tag !== ClassComponent && finishedWork.tag !== HostComponent) {
      return;
    }
    const ref = finishedWork.ref;
    if (ref) {
      const instance = getPublicInstance(finishedWork.stateNode);
      ref(instance);
    }
  }

  return {
    commitPlacement,
    commitDeletion,
    commitWork,
    commitLifeCycles,
    commitRef,
  };

};
