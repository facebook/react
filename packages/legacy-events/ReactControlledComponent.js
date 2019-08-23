/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'shared/invariant';

import {
  getInstanceFromNode,
  getFiberCurrentPropsFromNode,
} from './EventPluginUtils';

// Use to restore controlled state after a change event has fired.

let restoreImpl = null;
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
    typeof restoreImpl === 'function',
    'setRestoreImplementation() needs to be called to handle a target for controlled ' +
      'events. This error is likely caused by a bug in React. Please file an issue.',
  );
  const props = getFiberCurrentPropsFromNode(internalInstance.stateNode);
  restoreImpl(internalInstance.stateNode, internalInstance.type, props);
}

export function setRestoreImplementation(
  impl: (domElement: Element, tag: string, props: Object) => void,
): void {
  restoreImpl = impl;
}

export function enqueueStateRestore(target: EventTarget): void {
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
