/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactControlledComponent
 */

'use strict';

import {
  getInstanceFromNode,
  getFiberCurrentPropsFromNode,
} from 'EventPluginUtils';
import invariant from 'fbjs/lib/invariant';

// Use to restore controlled state after a change event has fired.

var restoreControlledState = null;
var restoreTarget = null;
var restoreQueue = null;

function restoreStateOfTarget(target) {
  // We perform this translation at the end of the event loop so that we
  // always receive the correct fiber here
  var internalInstance = getInstanceFromNode(target);
  if (!internalInstance) {
    // Unmounted
    return;
  }
  invariant(
    restoreControlledState === 'function',
    'Fiber needs to be injected to handle a fiber target for controlled ' +
      'events. This error is likely caused by a bug in React. Please file an issue.',
  );
  const props = getFiberCurrentPropsFromNode(internalInstance.stateNode);
  restoreControlledState(
    internalInstance.stateNode,
    internalInstance.type,
    props,
  );
}

export const injection = {
  injectRestoreStateImplementation(restoreImpl) {
    // The fiber implementation doesn't use dynamic dispatch so we need to
    // inject the implementation.
    restoreControlledState = restoreImpl;
  },
};

export function enqueueStateRestore(target) {
  if (restoreTarget) {
    if (restoreQueue) {
      restoreQueue.push(target);
    } else {
      restoreQueue = [target];
    }
  } else {
    restoreTarget = target;
  }
}

export function restoreStateIfNeeded() {
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
}
