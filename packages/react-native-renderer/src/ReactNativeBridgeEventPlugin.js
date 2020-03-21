/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';
import {accumulateDirectDispatches} from 'legacy-events/EventPropagators';
import type {TopLevelType} from 'legacy-events/TopLevelEventTypes';
import SyntheticEvent from 'legacy-events/SyntheticEvent';
import invariant from 'shared/invariant';

// Module provided by RN:
import {ReactNativeViewConfigRegistry} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import accumulateInto from 'legacy-events/accumulateInto';
import getListener from 'legacy-events/getListener';
import {traverseTwoPhase} from 'react-reconciler/src/ReactTreeTraversal';
import forEachAccumulated from 'legacy-events/forEachAccumulated';

const {
  customBubblingEventTypes,
  customDirectEventTypes,
} = ReactNativeViewConfigRegistry;

// Start of inline: the below functions were inlined from
// EventPropagator.js, as they deviated from ReactDOM's newer
// implementations.
function listenerAtPhase(inst, event, propagationPhase: PropagationPhases) {
  const registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(inst, registrationName);
}

function accumulateDirectionalDispatches(inst, phase, event) {
  if (__DEV__) {
    if (!inst) {
      console.error('Dispatching inst must not be null');
    }
  }
  const listener = listenerAtPhase(inst, event, phase);
  if (listener) {
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listener,
    );
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}
// End of inline
type PropagationPhases = 'bubbled' | 'captured';

const ReactNativeBridgeEventPlugin = {
  eventTypes: {},

  extractEvents: function(
    topLevelType: TopLevelType,
    targetInst: null | Object,
    nativeEvent: AnyNativeEvent,
    nativeEventTarget: null | Object,
    eventSystemFlags: EventSystemFlags,
  ): ?Object {
    if (targetInst == null) {
      // Probably a node belonging to another renderer's tree.
      return null;
    }
    const bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
    const directDispatchConfig = customDirectEventTypes[topLevelType];
    invariant(
      bubbleDispatchConfig || directDispatchConfig,
      'Unsupported top level event type "%s" dispatched',
      topLevelType,
    );
    const event = SyntheticEvent.getPooled(
      bubbleDispatchConfig || directDispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    if (bubbleDispatchConfig) {
      accumulateTwoPhaseDispatches(event);
    } else if (directDispatchConfig) {
      accumulateDirectDispatches(event);
    } else {
      return null;
    }
    return event;
  },
};

export default ReactNativeBridgeEventPlugin;
