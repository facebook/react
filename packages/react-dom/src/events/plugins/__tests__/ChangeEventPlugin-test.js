/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import type {AnyNativeEvent} from '../PluginModuleType';

import {
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
} from '../../client/ReactDOMComponentTree';
import {
  registerTwoPhaseEvent,
} from '../EventRegistry';
import {
  SyntheticEvent,
} from '../SyntheticEvent';
import {
  isTextInputElement,
} from '../isTextInputElement';
import {
  enqueueStateRestore,
} from '../ReactDOMControlledComponent';
import {
  batchedUpdates,
} from '../ReactDOMUpdateBatching';
import {
  getEventTarget,
} from '../getEventTarget';
import {
  accumulateTwoPhaseListeners,
} from '../DOMPluginEventSystem';

function createAndAccumulateChangeEvent(
  dispatchQueue,
  inst,
  nativeEvent,
  target,
) {
  const listeners = accumulateTwoPhaseListeners(inst, 'onChange');
  if (listeners.length > 0) {
    const event = new SyntheticEvent(
      'onChange',
      'change',
      null,
      nativeEvent,
      target,
    );
    dispatchQueue.push({event, listeners});
  }
}

function runEventInBatch(dispatchQueue) {
  batchedUpdates(runEventsInBatch, dispatchQueue);
}

function runEventsInBatch(dispatchQueue) {
  for (let i = 0; i < dispatchQueue.length; i++) {
    const {event, listeners} = dispatchQueue[i];
    for (let j = 0; j < listeners.length; j++) {
      const listener = listeners[j];
      listener(event);
    }
  }
}

function getInstIfValueChanged(targetInst) {
  const targetNode = getNodeFromInstance(targetInst);
  if (targetNode == null) {
    return null;
  }
  return targetInst;
}

function getTargetInstForChangeEvent(domEventName, targetInst) {
  if (domEventName === 'change') {
    return targetInst;
  }
}

function getTargetInstForInputEvent(domEventName, targetInst) {
  if (domEventName === 'input') {
    return targetInst;
  }
}

function getTargetInstForClickEvent(domEventName, targetInst) {
  if (domEventName === 'click') {
    return targetInst;
  }
}

function shouldUseChangeEvent(elem) {
  const nodeName = elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName === 'select' ||
    (nodeName === 'input' && elem.type === 'file')
  );
}

function shouldUseClickEvent(elem) {
  const nodeName = elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName === 'input' &&
    (elem.type === 'checkbox' || elem.type === 'radio')
  );
}

function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
) {
  const targetNode = getEventTarget(nativeEvent);
  if (targetNode == null) {
    return;
  }

  let getTargetInstFunc;

  if (shouldUseChangeEvent(targetNode)) {
    getTargetInstFunc = getTargetInstForChangeEvent;
  } else if (isTextInputElement(targetNode)) {
    getTargetInstFunc = getTargetInstForInputEvent;
  } else if (shouldUseClickEvent(targetNode)) {
    getTargetInstFunc = getTargetInstForClickEvent;
  }

  if (getTargetInstFunc) {
    const inst = getTargetInstFunc(domEventName, targetInst);

    if (inst && !nativeEvent.defaultPrevented) {
      enqueueStateRestore(targetNode);
      createAndAccumulateChangeEvent(
        dispatchQueue,
        inst,
        nativeEvent,
        targetNode,
      );
    }
  }
}

export {extractEvents};

registerTwoPhaseEvent('onChange', [
  'change',
  'click',
  'focusin',
  'focusout',
  'input',
  'keydown',
  'keyup',
  'selectionchange',
]);
