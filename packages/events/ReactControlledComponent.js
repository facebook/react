/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'fbjs/lib/invariant';

import {
  getInstanceFromNode,
  getFiberCurrentPropsFromNode,
} from './EventPluginUtils';

// Use to restore controlled state after a change event has fired.

let fiberHostComponent = null;

const ReactControlledComponentInjection = {
  injectFiberControlledHostComponent: function(hostComponentImpl) {
    // The fiber implementation doesn't use dynamic dispatch so we need to
    // inject the implementation.
    fiberHostComponent = hostComponentImpl;
  },
};

let restoreTarget = null;
let restoreQueue = null;

function restoreStateOfTarget(target) {
  // We perform this translation at the end of the event loop so that we
  // always receive the correct fiber here
  const internalInstance = getInstanceFromNode(target);
  if (!internalInstance) {
    // Unmounted
    return;
  }
  invariant(
    fiberHostComponent &&
      typeof fiberHostComponent.restoreControlledState === 'function',
    'Fiber needs to be injected to handle a fiber target for controlled ' +
      'events. This error is likely caused by a bug in React. Please file an issue.',
  );
  const props = getFiberCurrentPropsFromNode(internalInstance.stateNode);
  fiberHostComponent.restoreControlledState(
    internalInstance.stateNode,
    internalInstance.type,
    props,
  );
}

export const injection = ReactControlledComponentInjection;

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

export function needsStateRestore(): boolean {
  return restoreTarget !== null || restoreQueue !== null;
}

export function restoreStateIfNeeded() {
  if (!restoreTarget) {
    return;
  }
  const target = restoreTarget;
  const queuedTargets = restoreQueue;
  restoreTarget = null;
  restoreQueue = null;

  restoreStateOfTarget(target);
  if (queuedTargets) {
    for (let i = 0; i < queuedTargets.length; i++) {
      restoreStateOfTarget(queuedTargets[i]);
    }
  }
}
