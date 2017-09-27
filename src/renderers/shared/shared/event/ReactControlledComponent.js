/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactControlledComponent
 */

'use strict';

var EventPluginUtils = require('EventPluginUtils');

var invariant = require('fbjs/lib/invariant');

// Use to restore controlled state after a change event has fired.

var fiberHostComponent = null;

var ReactControlledComponentInjection = {
  injectFiberControlledHostComponent: function(hostComponentImpl) {
    // The fiber implementation doesn't use dynamic dispatch so we need to
    // inject the implementation.
    fiberHostComponent = hostComponentImpl;
  },
};

var restoreTarget = null;
var restoreQueue = null;

function restoreStateOfTarget(target) {
  // We perform this translation at the end of the event loop so that we
  // always receive the correct fiber here
  var internalInstance = EventPluginUtils.getInstanceFromNode(target);
  if (!internalInstance) {
    // Unmounted
    return;
  }
  if (typeof internalInstance.tag === 'number') {
    invariant(
      fiberHostComponent &&
        typeof fiberHostComponent.restoreControlledState === 'function',
      'Fiber needs to be injected to handle a fiber target for controlled ' +
        'events. This error is likely caused by a bug in React. Please file an issue.',
    );
    const props = EventPluginUtils.getFiberCurrentPropsFromNode(
      internalInstance.stateNode,
    );
    fiberHostComponent.restoreControlledState(
      internalInstance.stateNode,
      internalInstance.type,
      props,
    );
    return;
  }
  invariant(
    typeof internalInstance.restoreControlledState === 'function',
    'The internal instance must be a React host component. ' +
      'This error is likely caused by a bug in React. Please file an issue.',
  );
  // If it is not a Fiber, we can just use dynamic dispatch.
  internalInstance.restoreControlledState();
}

var ReactControlledComponent = {
  injection: ReactControlledComponentInjection,

  enqueueStateRestore(target) {
    if (restoreTarget) {
      if (restoreQueue) {
        restoreQueue.push(target);
      } else {
        restoreQueue = [target];
      }
    } else {
      restoreTarget = target;
    }
  },

  restoreStateIfNeeded() {
    if (!restoreTarget) {
      return;
    }
    var target = restoreTarget;
    var queuedTargets = restoreQueue;
    restoreTarget = null;
    restoreQueue = null;

    restoreStateOfTarget(target);
    if (queuedTargets) {
      for (var i = 0; i < queuedTargets.length; i++) {
        restoreStateOfTarget(queuedTargets[i]);
      }
    }
  },
};

module.exports = ReactControlledComponent;
