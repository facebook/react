/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticEvent from 'events/SyntheticEvent';

/**
 * @interface UIEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
const UIEventInterface = {
  view: null,
  detail: null,
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticUIEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent,
  nativeEventTarget,
) {
  return SyntheticEvent.call(
    this,
    dispatchConfig,
    dispatchMarker,
    nativeEvent,
    nativeEventTarget,
  );
}

SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);

export default SyntheticUIEvent;
