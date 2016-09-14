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
import type { FiberRoot } from 'ReactFiberRoot';
import type { HostConfig } from 'ReactFiberReconciler';

var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  ClassComponent,
  HostContainer,
  HostComponent,
  HostText,
} = ReactTypeOfWork;
var { callCallbacks } = require('ReactFiberUpdateQueue');

module.exports = function<T, P, I, TI, C>(config : HostConfig<T, P, I, TI, C>) {

  const updateContainer = config.updateContainer;
  const commitUpdate = config.commitUpdate;
  const commitTextUpdate = config.commitTextUpdate;

  function commitWork(current : ?Fiber, finishedWork : Fiber) : void {
    switch (finishedWork.tag) {
      case ClassComponent: {
        // Clear updates from current fiber. This must go before the callbacks
        // are reset, in case an update is triggered from inside a callback. Is
        // this safe? Relies on the assumption that work is only committed if
        // the update queue is empty.
        if (finishedWork.alternate) {
          finishedWork.alternate.updateQueue = null;
        }
        if (finishedWork.callbackList) {
          const { callbackList } = finishedWork;
          finishedWork.callbackList = null;
          callCallbacks(callbackList, finishedWork.stateNode);
        }
        // TODO: Fire componentDidMount/componentDidUpdate, update refs
        return;
      }
      case HostContainer: {
        // TODO: Attach children to root container.
        const children = finishedWork.output;
        const root : FiberRoot = finishedWork.stateNode;
        const containerInfo : C = root.containerInfo;
        updateContainer(containerInfo, children);
        return;
      }
      case HostComponent: {
        if (finishedWork.stateNode == null || !current) {
          throw new Error('This should only be done during updates.');
        }
        // Commit the work prepared earlier.
        const child = finishedWork.child;
        const children = (child && !child.sibling) ? (child.output : ?Fiber | I) : child;
        const newProps = finishedWork.memoizedProps;
        const oldProps = current.memoizedProps;
        const instance : I = finishedWork.stateNode;
        commitUpdate(instance, oldProps, newProps, children);
        return;
      }
      case HostText: {
        if (finishedWork.stateNode == null || !current) {
          throw new Error('This should only be done during updates.');
        }
        // TODO: This never gets called yet because I don't have update support
        // for text nodes. This only gets updated through a host component or
        // container updating with this as one of its child nodes.
        const textInstance : TI = finishedWork.stateNode;
        const oldText : string = finishedWork.memoizedProps;
        const newText : string = current.memoizedProps;
        commitTextUpdate(textInstance, oldText, newText);
      }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  return {
    commitWork,
  };

};
