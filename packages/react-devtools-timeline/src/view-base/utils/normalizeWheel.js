/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Adapted from: https://github.com/facebookarchive/fixed-data-table/blob/main/src/vendor_upstream/dom/normalizeWheel.js

export type NormalizedWheelDelta = {|
  deltaX: number,
  deltaY: number,
|};

// Reasonable defaults
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;

/**
 * Mouse wheel (and 2-finger trackpad) support on the web sucks.  It is
 * complicated, thus this doc is long and (hopefully) detailed enough to answer
 * your questions.
 *
 * If you need to react to the mouse wheel in a predictable way, this code is
 * like your bestest friend. * hugs *
 *
 * In your event callback, use this code to get sane interpretation of the
 * deltas.  This code will return an object with properties:
 *
 *   - deltaX  -- normalized distance (to pixels) - x plane
 *   - deltaY  -- " - y plane
 *
 * Wheel values are provided by the browser assuming you are using the wheel to
 * scroll a web page by a number of lines or pixels (or pages).  Values can vary
 * significantly on different platforms and browsers, forgetting that you can
 * scroll at different speeds.  Some devices (like trackpads) emit more events
 * at smaller increments with fine granularity, and some emit massive jumps with
 * linear speed or acceleration.
 *
 * This code does its best to normalize the deltas for you:
 *
 *   - delta* is normalizing the desired scroll delta in pixel units.
 *
 *   - positive value indicates scrolling DOWN/RIGHT, negative UP/LEFT.  This
 *     should translate to positive value zooming IN, negative zooming OUT.
 *     This matches the 'wheel' event.
 *
 * Implementation info:
 *
 * The basics of the standard 'wheel' event is that it includes a unit,
 * deltaMode (pixels, lines, pages), and deltaX, deltaY and deltaZ.
 * See: http://www.w3.org/TR/DOM-Level-3-Events/#events-wheelevents
 *
 * Examples of 'wheel' event if you scroll slowly (down) by one step with an
 * average mouse:
 *
 *   OS X + Chrome  (mouse)     -    4   pixel delta  (wheelDelta -120)
 *   OS X + Safari  (mouse)     -  N/A   pixel delta  (wheelDelta  -12)
 *   OS X + Firefox (mouse)     -    0.1 line  delta  (wheelDelta  N/A)
 *   Win8 + Chrome  (mouse)     -  100   pixel delta  (wheelDelta -120)
 *   Win8 + Firefox (mouse)     -    3   line  delta  (wheelDelta -120)
 *
 * On the trackpad:
 *
 *   OS X + Chrome  (trackpad)  -    2   pixel delta  (wheelDelta   -6)
 *   OS X + Firefox (trackpad)  -    1   pixel delta  (wheelDelta  N/A)
 */
export function normalizeWheel(event: WheelEvent): NormalizedWheelDelta {
  let deltaX = event.deltaX;
  let deltaY = event.deltaY;

  if (
    // $FlowFixMe DOM_DELTA_LINE missing from WheelEvent
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
  ) {
    // delta in LINE units
    deltaX *= LINE_HEIGHT;
    deltaY *= LINE_HEIGHT;
  } else if (
    // $FlowFixMe DOM_DELTA_PAGE missing from WheelEvent
    event.deltaMode === WheelEvent.DOM_DELTA_PAGE
  ) {
    // delta in PAGE units
    deltaX *= PAGE_HEIGHT;
    deltaY *= PAGE_HEIGHT;
  }

  return {deltaX, deltaY};
}
