/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {updateValueIfChanged} from '../../host-components/controlled/ReactFireValueTracking';
import {enqueueStateRestore} from '../../host-components/controlled/ReactFireControlledState';
import {isTextInputElement} from '../../ReactFireUtils';
import {traverseTwoPhase} from '../ReactFireEventTraversal';
import type {ProxyContext} from '../ReactFireEvents';
import {
  getPooledSyntheticEvent,
  SyntheticEvent,
} from '../synthetic/ReactFireSyntheticEvent';
import {
  BLUR,
  CHANGE,
  CLICK,
  FOCUS,
  INPUT,
  KEY_DOWN,
  KEY_UP,
} from '../ReactFireEventTypes';

/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem: Node) {
  const nodeName = elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName === 'select' ||
    (nodeName === 'input' && ((elem: any): HTMLInputElement).type === 'file')
  );
}

/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem: Node) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  const nodeName = elem.nodeName;
  return (
    nodeName &&
    nodeName.toLowerCase() === 'input' &&
    (((elem: any): HTMLInputElement).type === 'checkbox' ||
      ((elem: any): HTMLInputElement).type === 'radio')
  );
}

function polyfilledEventListener(
  eventName: string,
  nativeEvent: Event,
  eventTarget: Node,
  proxyContext: ProxyContext,
): void {
  let shouldFireUserEvent = false;

  if (
    !updateValueIfChanged(((eventTarget: any): HTMLInputElement)) &&
    (nativeEvent: any).simulated === undefined
  ) {
    return;
  }

  if (shouldUseChangeEvent(eventTarget)) {
    shouldFireUserEvent = eventName === CHANGE;
  } else if (isTextInputElement(((eventTarget: any): HTMLInputElement))) {
    shouldFireUserEvent = eventName === INPUT || eventName === CHANGE;
  } else if (shouldUseClickEvent(eventTarget)) {
    shouldFireUserEvent = eventName === CLICK;
  }
  if (!shouldFireUserEvent) {
    return;
  }
  enqueueStateRestore(eventTarget);
  const syntheticEvent = getPooledSyntheticEvent(
    SyntheticEvent,
    nativeEvent,
    proxyContext,
  );
  syntheticEvent.type = 'change';
  proxyContext.eventName = 'onChange';
  traverseTwoPhase(syntheticEvent, proxyContext);
}

const dependencies = [INPUT, CHANGE, BLUR, FOCUS, CLICK, KEY_DOWN, KEY_UP];

export const onChangeHeuristics = [dependencies, polyfilledEventListener];
