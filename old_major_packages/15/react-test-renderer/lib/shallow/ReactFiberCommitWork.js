/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var ReactTypeOfWork = require('./ReactTypeOfWork');
var ClassComponent = ReactTypeOfWork.ClassComponent,
    HostContainer = ReactTypeOfWork.HostContainer,
    HostComponent = ReactTypeOfWork.HostComponent;

var _require = require('./ReactFiberUpdateQueue'),
    callCallbacks = _require.callCallbacks;

module.exports = function (config) {
  var updateContainer = config.updateContainer;
  var commitUpdate = config.commitUpdate;

  function commitWork(current, finishedWork) {
    switch (finishedWork.tag) {
      case ClassComponent:
        {
          // Clear updates from current fiber. This must go before the callbacks
          // are reset, in case an update is triggered from inside a callback. Is
          // this safe? Relies on the assumption that work is only committed if
          // the update queue is empty.
          if (finishedWork.alternate) {
            finishedWork.alternate.updateQueue = null;
          }
          if (finishedWork.callbackList) {
            var callbackList = finishedWork.callbackList;

            finishedWork.callbackList = null;
            callCallbacks(callbackList, finishedWork.stateNode);
          }
          // TODO: Fire componentDidMount/componentDidUpdate, update refs
          return;
        }
      case HostContainer:
        {
          // TODO: Attach children to root container.
          var children = finishedWork.output;
          var root = finishedWork.stateNode;
          var containerInfo = root.containerInfo;
          updateContainer(containerInfo, children);
          return;
        }
      case HostComponent:
        {
          if (finishedWork.stateNode == null || !current) {
            throw new Error('This should only be done during updates.');
          }
          // Commit the work prepared earlier.
          var child = finishedWork.child;
          var _children = child && !child.sibling ? child.output : child;
          var newProps = finishedWork.memoizedProps;
          var oldProps = current.memoizedProps;
          var instance = finishedWork.stateNode;
          commitUpdate(instance, oldProps, newProps, _children);
          return;
        }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  return {
    commitWork: commitWork
  };
};