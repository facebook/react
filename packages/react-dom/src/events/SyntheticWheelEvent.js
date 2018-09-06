/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticMouseEvent from './SyntheticMouseEvent';

/**
 * @interface WheelEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
const SyntheticWheelEvent = SyntheticMouseEvent.extend({
  deltaX(event) {
    return 'deltaX' in event
      ? event.deltaX
      : // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
        'wheelDeltaX' in event
        ? -event.wheelDeltaX
        : 0;
  },
  deltaY(event) {
    return 'deltaY' in event
      ? event.deltaY
      : // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
        'wheelDeltaY' in event
        ? -event.wheelDeltaY
        : // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
          'wheelDelta' in event
          ? -event.wheelDelta
          : 0;
  },
  deltaZ: null,

  // Browsers without "deltaMode" is reporting in raw wheel delta where one
  // notch on the scroll is always +/- 120, roughly equivalent to pixels.
  // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
  // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
  deltaMode: null,
});

export default SyntheticWheelEvent;
