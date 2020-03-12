/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';

import getListener from 'legacy-events/getListener';

import {traverseEnterLeave} from 'shared/ReactTreeTraversal';
import accumulateInto from './accumulateInto';
import forEachAccumulated from './forEachAccumulated';

/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing even a
 * single one.
 */

/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(
  inst: Fiber,
  ignoredDirection: ?boolean,
  event: ReactSyntheticEvent,
): void {
  if (inst && event && event.dispatchConfig.registrationName) {
    const registrationName = event.dispatchConfig.registrationName;
    const listener = getListener(inst, registrationName);
    if (listener) {
      event._dispatchListeners = accumulateInto(
        event._dispatchListeners,
        listener,
      );
      event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
    }
  }
}

/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event: ReactSyntheticEvent) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event._targetInst, null, event);
  }
}

export function accumulateEnterLeaveDispatches(
  leave: ReactSyntheticEvent,
  enter: ReactSyntheticEvent,
  from: Fiber,
  to: Fiber,
) {
  traverseEnterLeave(from, to, accumulateDispatches, leave, enter);
}

export function accumulateDirectDispatches(
  events: ?(Array<ReactSyntheticEvent> | ReactSyntheticEvent),
) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}
