/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticUIEvent from './SyntheticUIEvent';
import getEventModifierState from './getEventModifierState';

let previousScreenX = null;
let previousScreenY = null;

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
    return screenX ? event.screenX - screenX : 0;
  },
  movementY: function(event) {
    if ('movementY' in event) {
      return event.movementY;
    }

    const screenY = previousScreenY;
    previousScreenY = event.screenY;
    return screenY ? event.screenY - screenY : 0;
  },
});

export default SyntheticMouseEvent;
