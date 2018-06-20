/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticUIEvent from './SyntheticUIEvent';
import getEventModifierState from './getEventModifierState';

let previousScreenX = 0;
let previousScreenY = 0;
// Use flags to signal movementX/Y has already been set
let isMovementXSet = false;
let isMovementYSet = false;

/**
 * @interface MouseEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
const SyntheticMouseEvent = SyntheticUIEvent.extend({
  screenX: null,
  screenY: null,
  clientX: null,
  clientY: null,
  pageX: null,
  pageY: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  getModifierState: getEventModifierState,
  button: null,
  buttons: null,
  relatedTarget: function(event) {
    return (
      event.relatedTarget ||
      (event.fromElement === event.srcElement
        ? event.toElement
        : event.fromElement)
    );
  },
  movementX: function(event) {
    if ('movementX' in event) {
      return event.movementX;
    }

    const screenX = previousScreenX;
    previousScreenX = event.screenX;

    if (!isMovementXSet) {
      isMovementXSet = true;
      return 0;
    }

    return event.screenX - screenX;
  },
  movementY: function(event) {
    if ('movementY' in event) {
      return event.movementY;
    }

    const screenY = previousScreenY;
    previousScreenY = event.screenY;

    if (!isMovementYSet) {
      isMovementYSet = true;
      return 0;
    }

    return event.screenY - screenY;
  },
});

export default SyntheticMouseEvent;
