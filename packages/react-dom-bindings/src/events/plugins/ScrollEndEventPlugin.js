/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {AnyNativeEvent} from '../PluginModuleType';
import type {DOMEventName} from '../DOMEventNames';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {ReactSyntheticEvent} from '../ReactSyntheticEventType';

import {registerTwoPhaseEvent} from '../EventRegistry';
import {SyntheticUIEvent} from '../SyntheticEvent';

import {IS_CAPTURE_PHASE} from '../EventSystemFlags';

import {accumulateSinglePhaseListeners} from '../DOMPluginEventSystem';

function registerEvents() {
  registerTwoPhaseEvent('onScrollEnd', [
    'scroll',
    'scrollend',
    'touchstart',
    'touchend',
  ]);
}

/**
 * This plugin creates an `onScrollEnd` event polyfill when the native one
 * is not available.
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: null | EventTarget,
) {
  if (domEventName !== 'scrollend') {
    return;
  }

  const reactName = 'onScrollEnd';

  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  // In React onScrollEnd doesn't bubble.
  const accumulateTargetOnly = !inCapturePhase;

  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    inCapturePhase,
    accumulateTargetOnly,
    nativeEvent,
  );

  if (listeners.length > 0) {
    // Intentionally create event lazily.
    const event: ReactSyntheticEvent = new SyntheticUIEvent(
      reactName,
      domEventName,
      null,
      nativeEvent,
      nativeEventTarget,
    );
    dispatchQueue.push({event, listeners});
  }
}

export {registerEvents, extractEvents};
