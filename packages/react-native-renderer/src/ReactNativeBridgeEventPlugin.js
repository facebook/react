/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from './legacy-events/PluginModuleType';
import type {TopLevelType} from './legacy-events/TopLevelEventTypes';
import SyntheticEvent from './legacy-events/SyntheticEvent';
import type {PropagationPhases} from './legacy-events/PropagationPhases';

// Module provided by RN:
import {
  CustomEvent,
  ReactNativeViewConfigRegistry,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import accumulateInto from './legacy-events/accumulateInto';
import getListeners from './ReactNativeGetListeners';
import forEachAccumulated from './legacy-events/forEachAccumulated';
import {HostComponent} from 'react-reconciler/src/ReactWorkTags';

const {
  customBubblingEventTypes,
  customDirectEventTypes,
} = ReactNativeViewConfigRegistry;

// Start of inline: the below functions were inlined from
// EventPropagator.js, as they deviated from ReactDOM's newer
// implementations.
function listenersAtPhase(
  inst,
  event,
  propagationPhase: PropagationPhases,
  isCustomEvent: boolean,
) {
  const registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListeners(inst, registrationName, propagationPhase, isCustomEvent);
}

function accumulateDirectionalDispatches(inst, phase, event) {
  if (__DEV__) {
    if (!inst) {
      console.error('Dispatching inst must not be null');
    }
  }
  const listeners = listenersAtPhase(
    inst,
    event,
    phase,
    event instanceof CustomEvent,
  );
  if (listeners && listeners.length > 0) {
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listeners,
    );
    const insts = listeners.map(() => {
      return inst;
    });
    event._dispatchInstances = accumulateInto(event._dispatchInstances, insts);
  }
}

function getParent(inst) {
  do {
    inst = inst.return;
    // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (inst && inst.tag !== HostComponent);
  if (inst) {
    return inst;
  }
  return null;
}

/**
 * Simulates the traversal of a two-phase, capture/bubble event dispatch.
 */
export function traverseTwoPhase(
  inst: Object,
  fn: Function,
  arg: Function,
  bubbles: boolean,
) {
  const path = [];
  while (inst) {
    path.push(inst);
    inst = getParent(inst);
  }
  let i;
  for (i = path.length; i-- > 0; ) {
    fn(path[i], 'captured', arg);
  }
  for (i = 0; i < path.length; i++) {
    fn(path[i], 'bubbled', arg);
    // It's possible this is false for custom events.
    if (!bubbles) {
      break;
    }
  }
}

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    // bubbles is only set on the dispatchConfig for custom events.
    // The `event` param here at this point is a SyntheticEvent, not an Event or CustomEvent.
    const bubbles =
      event.dispatchConfig.isCustomEvent === true
        ? !!event.dispatchConfig.bubbles
        : true;

    traverseTwoPhase(
      event._targetInst,
      accumulateDirectionalDispatches,
      event,
      bubbles,
    );
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(
  inst: Object,
  ignoredDirection: ?boolean,
  event: Object,
): void {
  if (inst && event && event.dispatchConfig.registrationName) {
    const registrationName = event.dispatchConfig.registrationName;
    // Since we "do not look for phased registration names", that
    // should be the same as "bubbled" here, for all intents and purposes...?
    const listeners = getListeners(
      inst,
      registrationName,
      'bubbled',
      !!event.dispatchConfig.isCustomEvent,
    );
    if (listeners) {
      event._dispatchListeners = accumulateInto(
        event._dispatchListeners,
        listeners,
      );
      // an inst for every listener
      const insts = listeners.map(() => {
        return inst;
      });
      event._dispatchInstances = accumulateInto(
        event._dispatchInstances,
        insts,
      );
    }
  }
}

/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event: Object) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event._targetInst, null, event);
  }
}

function accumulateDirectDispatches(events: ?(Array<Object> | Object)) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}

// End of inline

const ReactNativeBridgeEventPlugin = {
  eventTypes: {},

  extractEvents: function(
    topLevelType: TopLevelType,
    targetInst: null | Object,
    nativeEvent: AnyNativeEvent,
    nativeEventTarget: null | Object,
  ): ?Object {
    if (targetInst == null) {
      // Probably a node belonging to another renderer's tree.
      return null;
    }
    const bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
    const directDispatchConfig = customDirectEventTypes[topLevelType];
    let customEventConfig = null;
    console.log('what is CustomEvent?', CustomEvent);
    if (nativeEvent instanceof CustomEvent) {
      // $FlowFixMe
      if (topLevelType.indexOf('on') !== 0) {
        throw new Error('Custom event name must start with "on"');
      }
      nativeEvent.isTrusted = false;
      // For now, this custom event name should technically not be used -
      // CustomEvents emitted in the system do not result in calling prop handlers.
      customEventConfig = {
        registrationName: topLevelType,
        isCustomEvent: true,
        bubbles: nativeEvent.bubbles,
        phasedRegistrationNames: {
          bubbled: topLevelType,
          // $FlowFixMe
          captured: topLevelType + 'Capture',
        },
      };
    }

    if (!bubbleDispatchConfig && !directDispatchConfig && !customEventConfig) {
      throw new Error(
        // $FlowFixMe - Flow doesn't like this string coercion because DOMTopLevelEventType is opaque
        `Unsupported top level event type "${topLevelType}" dispatched`,
      );
    }

    const event = SyntheticEvent.getPooled(
      bubbleDispatchConfig || directDispatchConfig || customEventConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    if (bubbleDispatchConfig || customEventConfig) {
      // All CustomEvents go through two-phase dispatching, even if they
      // are non-bubbling events, which is why we put the `bubbles` param
      // in the config for CustomEvents only.
      // CustomEvents are not emitted to prop handler functions ever.
      // Native two-phase events will be emitted to prop handler functions
      // and to HostComponent event listeners.
      accumulateTwoPhaseDispatches(event);
    } else if (directDispatchConfig) {
      // Direct dispatched events do not go to HostComponent EventEmitters,
      // they *only* go to the prop function handlers.
      accumulateDirectDispatches(event);
    } else {
      return null;
    }
    return event;
  },
};

export default ReactNativeBridgeEventPlugin;
