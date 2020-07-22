/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint valid-typeof: 0 */

import getEventCharCode from './getEventCharCode';

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
}

/**
 * Synthetic events are dispatched by event plugins, typically in response to a
 * top-level event delegation handler.
 *
 * These systems should generally use pooling to reduce the frequency of garbage
 * collection. The system should check `isPersistent` to determine whether the
 * event should be released into the pool after being dispatched. Users that
 * need a persisted event should invoke `persist`.
 *
 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
 * normalizing browser quirks. Subclasses do not necessarily have to implement a
 * DOM interface; custom application-specific events can also subclass this.
 */
export function SyntheticEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  this._reactName = reactName;
  this._targetInst = targetInst;
  this.nativeEvent = nativeEvent;
  /**
   * @interface Event
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */
  this.type = nativeEvent.type;
  this.target = nativeEventTarget;
  // currentTarget is set when dispatching; no use in copying it here.
  this.currentTarget = null;
  this.eventPhase = nativeEvent.eventPhase;
  this.bubbles = nativeEvent.bubbles;
  this.cancelable = nativeEvent.cancelable;
  this.timeStamp = nativeEvent.timeStamp || Date.now();
  this.defaultPrevented = nativeEvent.defaultPrevented;
  this.isTrusted = nativeEvent.isTrusted;
  const defaultPrevented =
    nativeEvent.defaultPrevented != null
      ? nativeEvent.defaultPrevented
      : nativeEvent.returnValue === false;
  if (defaultPrevented) {
    this.isDefaultPrevented = functionThatReturnsTrue;
  } else {
    this.isDefaultPrevented = functionThatReturnsFalse;
  }
  this.isPropagationStopped = functionThatReturnsFalse;
}

Object.assign(SyntheticEvent.prototype, {
  preventDefault: function() {
    this.defaultPrevented = true;
    const event = this.nativeEvent;
    if (!event) {
      return;
    }

    if (event.preventDefault) {
      event.preventDefault();
    } else if (typeof event.returnValue !== 'unknown') {
      event.returnValue = false;
    }
    this.isDefaultPrevented = functionThatReturnsTrue;
  },

  stopPropagation: function() {
    const event = this.nativeEvent;
    if (!event) {
      return;
    }

    if (event.stopPropagation) {
      event.stopPropagation();
    } else if (typeof event.cancelBubble !== 'unknown') {
      // The ChangeEventPlugin registers a "propertychange" event for
      // IE. This event does not support bubbling or cancelling, and
      // any references to cancelBubble throw "Member not found".  A
      // typeof check of "unknown" circumvents this issue (and is also
      // IE specific).
      event.cancelBubble = true;
    }

    this.isPropagationStopped = functionThatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    // Modern event system doesn't use pooling.
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: functionThatReturnsTrue,
});

export function SyntheticUIEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  SyntheticEvent.apply(this, arguments);
  this.view = nativeEvent.view;
  this.detail = nativeEvent.detail;
}
SyntheticUIEvent.prototype = SyntheticEvent.prototype;

let previousScreenX = 0;
let previousScreenY = 0;
// Use flags to signal movementX/Y has already been set
let isMovementXSet = false;
let isMovementYSet = false;

export function SyntheticMouseEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface MouseEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */
  SyntheticUIEvent.apply(this, arguments);
  this.screenX = nativeEvent.screenX;
  this.screenY = nativeEvent.screenY;
  this.clientX = nativeEvent.clientX;
  this.clientY = nativeEvent.clientY;
  this.pageX = nativeEvent.pageX;
  this.pageY = nativeEvent.pageY;
  this.ctrlKey = nativeEvent.ctrlKey;
  this.shiftKey = nativeEvent.shiftKey;
  this.altKey = nativeEvent.altKey;
  this.metaKey = nativeEvent.metaKey;
  this.getModifierState = getEventModifierState(nativeEvent);
  this.button = nativeEvent.button;
  this.buttons = nativeEvent.buttons;
  this.relatedTarget =
    nativeEvent.relatedTarget ||
    (nativeEvent.fromElement === nativeEvent.srcElement
      ? nativeEvent.toElement
      : nativeEvent.fromElement);
  if ('movementX' in nativeEvent) {
    this.movementX = nativeEvent.movementX;
  } else {
    const screenX = previousScreenX;
    previousScreenX = nativeEvent.screenX;
    if (!isMovementXSet) {
      isMovementXSet = true;
      this.movementX = 0;
    } else {
      this.movementX =
        nativeEvent.type === 'mousemove' ? nativeEvent.screenX - screenX : 0;
    }
  }
  if ('movementY' in nativeEvent) {
    this.movementY = nativeEvent.movementY;
  } else {
    const screenY = previousScreenY;
    previousScreenY = nativeEvent.screenY;
    if (!isMovementYSet) {
      isMovementYSet = true;
      this.movementY = 0;
    } else {
      this.movementY =
        nativeEvent.type === 'mousemove' ? nativeEvent.screenY - screenY : 0;
    }
  }
}
SyntheticMouseEvent.prototype = SyntheticEvent.prototype;

export function SyntheticDragEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface DragEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */
  SyntheticMouseEvent.apply(this, arguments);
  this.dataTransfer = nativeEvent.dataTransfer;
}
SyntheticDragEvent.prototype = SyntheticEvent.prototype;

export function SyntheticFocusEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface FocusEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */
  SyntheticUIEvent.apply(this, arguments);
  this.relatedTarget = nativeEvent.relatedTarget;
}
SyntheticFocusEvent.prototype = SyntheticEvent.prototype;

export function SyntheticAnimationEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface Event
   * @see http://www.w3.org/TR/css3-animations/#AnimationEvent-interface
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
   */
  SyntheticEvent.apply(this, arguments);
  this.animationName = nativeEvent.animationName;
  this.elapsedTime = nativeEvent.elapsedTime;
  this.pseudoElement = nativeEvent.pseudoElement;
}
SyntheticAnimationEvent.prototype = SyntheticEvent.prototype;

export function SyntheticClipboardEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface Event
   * @see http://www.w3.org/TR/clipboard-apis/
   */
  SyntheticEvent.apply(this, arguments);
  this.clipboardData =
    'clipboardData' in nativeEvent
      ? nativeEvent.clipboardData
      : window.clipboardData;
}
SyntheticClipboardEvent.prototype = SyntheticEvent.prototype;

export function SyntheticCompositionEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface Event
   * @see http://www.w3.org/TR/DOM-Level-3-Events/#events-compositionevents
   */
  SyntheticEvent.apply(this, arguments);
  this.data = nativeEvent.data;
}
SyntheticCompositionEvent.prototype = SyntheticEvent.prototype;

export function SyntheticInputEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface Event
   * @see http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105
   *      /#events-inputevents
   */
  SyntheticEvent.apply(this, arguments);
  this.data = nativeEvent.data;
}
SyntheticInputEvent.prototype = SyntheticEvent.prototype;

/**
 * Normalization of deprecated HTML5 `key` values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
const normalizeKey = {
  Esc: 'Escape',
  Spacebar: ' ',
  Left: 'ArrowLeft',
  Up: 'ArrowUp',
  Right: 'ArrowRight',
  Down: 'ArrowDown',
  Del: 'Delete',
  Win: 'OS',
  Menu: 'ContextMenu',
  Apps: 'ContextMenu',
  Scroll: 'ScrollLock',
  MozPrintableKey: 'Unidentified',
};

/**
 * Translation from legacy `keyCode` to HTML5 `key`
 * Only special keys supported, all others depend on keyboard layout or browser
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
const translateToKey = {
  '8': 'Backspace',
  '9': 'Tab',
  '12': 'Clear',
  '13': 'Enter',
  '16': 'Shift',
  '17': 'Control',
  '18': 'Alt',
  '19': 'Pause',
  '20': 'CapsLock',
  '27': 'Escape',
  '32': ' ',
  '33': 'PageUp',
  '34': 'PageDown',
  '35': 'End',
  '36': 'Home',
  '37': 'ArrowLeft',
  '38': 'ArrowUp',
  '39': 'ArrowRight',
  '40': 'ArrowDown',
  '45': 'Insert',
  '46': 'Delete',
  '112': 'F1',
  '113': 'F2',
  '114': 'F3',
  '115': 'F4',
  '116': 'F5',
  '117': 'F6',
  '118': 'F7',
  '119': 'F8',
  '120': 'F9',
  '121': 'F10',
  '122': 'F11',
  '123': 'F12',
  '144': 'NumLock',
  '145': 'ScrollLock',
  '224': 'Meta',
};

/**
 * @param {object} nativeEvent Native browser event.
 * @return {string} Normalized `key` property.
 */
function getEventKey(nativeEvent) {
  if (nativeEvent.key) {
    // Normalize inconsistent values reported by browsers due to
    // implementations of a working draft specification.

    // FireFox implements `key` but returns `MozPrintableKey` for all
    // printable characters (normalized to `Unidentified`), ignore it.
    const key = normalizeKey[nativeEvent.key] || nativeEvent.key;
    if (key !== 'Unidentified') {
      return key;
    }
  }

  // Browser does not implement `key`, polyfill as much of it as we can.
  if (nativeEvent.type === 'keypress') {
    const charCode = getEventCharCode(nativeEvent);

    // The enter-key is technically both printable and non-printable and can
    // thus be captured by `keypress`, no other non-printable key should.
    return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
  }
  if (nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup') {
    // While user keyboard layout determines the actual meaning of each
    // `keyCode` value, almost all function keys have a universal value.
    return translateToKey[nativeEvent.keyCode] || 'Unidentified';
  }
  return '';
}

/**
 * Translation from modifier key to the associated property in the event.
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#keys-Modifiers
 */
const modifierKeyToProp = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Meta: 'metaKey',
  Shift: 'shiftKey',
};

// Older browsers (Safari <= 10, iOS Safari <= 10.2) do not support
// getModifierState. If getModifierState is not supported, we map it to a set of
// modifier keys exposed by the event. In this case, Lock-keys are not supported.
function modifierStateGetter(keyArg) {
  const syntheticEvent = this;
  const nativeEvent = syntheticEvent.nativeEvent;
  if (nativeEvent.getModifierState) {
    return nativeEvent.getModifierState(keyArg);
  }
  const keyProp = modifierKeyToProp[keyArg];
  return keyProp ? !!nativeEvent[keyProp] : false;
}

function getEventModifierState(nativeEvent) {
  return modifierStateGetter;
}

export function SyntheticKeyboardEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface KeyboardEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */
  SyntheticUIEvent.apply(this, arguments);
  this.key = getEventKey(nativeEvent);
  this.code = nativeEvent.code;
  this.location = nativeEvent.location;
  this.ctrlKey = nativeEvent.ctrlKey;
  this.shiftKey = nativeEvent.shiftKey;
  this.altKey = nativeEvent.altKey;
  this.metaKey = nativeEvent.metaKey;
  this.repeat = nativeEvent.repeat;
  this.locale = nativeEvent.locale;
  this.getModifierState = getEventModifierState(nativeEvent);
  // Legacy Interface
  // `charCode` is the result of a KeyPress event and represents the value of
  // the actual printable character.
  // KeyPress is deprecated, but its replacement is not yet final and not
  // implemented in any major browser. Only KeyPress has charCode.
  this.charCode =
    nativeEvent.type === 'keypress' ? getEventCharCode(nativeEvent) : 0;
  // `keyCode` is the result of a KeyDown/Up event and represents the value of
  // physical keyboard key.
  // The actual meaning of the value depends on the users' keyboard layout
  // which cannot be detected. Assuming that it is a US keyboard layout
  // provides a surprisingly accurate mapping for US and European users.
  // Due to this, it is left to the user to implement at this time.
  this.keyCode =
    nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup'
      ? nativeEvent.keyCode
      : 0;
  // `which` is an alias for either `keyCode` or `charCode` depending on the
  // type of the event.
  this.which =
    nativeEvent.type === 'keypress'
      ? getEventCharCode(nativeEvent)
      : nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup'
      ? nativeEvent.keyCode
      : 0;
}
SyntheticKeyboardEvent.prototype = SyntheticEvent.prototype;

export function SyntheticPointerEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface PointerEvent
   * @see http://www.w3.org/TR/pointerevents/
   */
  SyntheticMouseEvent.apply(this, arguments);
  this.pointerId = nativeEvent.pointerId;
  this.width = nativeEvent.width;
  this.height = nativeEvent.height;
  this.pressure = nativeEvent.pressure;
  this.tangentialPressure = nativeEvent.tangentialPressure;
  this.tiltX = nativeEvent.tiltX;
  this.tiltY = nativeEvent.tiltY;
  this.twist = nativeEvent.twist;
  this.pointerType = nativeEvent.pointerType;
  this.isPrimary = nativeEvent.isPrimary;
}
SyntheticPointerEvent.prototype = SyntheticEvent.prototype;

export function SyntheticTouchEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface TouchEvent
   * @see http://www.w3.org/TR/touch-events/
   */
  SyntheticUIEvent.apply(this, arguments);
  this.touches = nativeEvent.touches;
  this.targetTouches = nativeEvent.targetTouches;
  this.changedTouches = nativeEvent.changedTouches;
  this.altKey = nativeEvent.altKey;
  this.metaKey = nativeEvent.metaKey;
  this.ctrlKey = nativeEvent.ctrlKey;
  this.shiftKey = nativeEvent.shiftKey;
  this.getModifierState = getEventModifierState(nativeEvent);
}
SyntheticTouchEvent.prototype = SyntheticEvent.prototype;

export function SyntheticTransitionEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface Event
   * @see http://www.w3.org/TR/2009/WD-css3-transitions-20090320/#transition-events-
   * @see https://developer.mozilla.org/en-US/docs/Web/API/TransitionEvent
   */
  SyntheticEvent.apply(this, arguments);
  this.propertyName = nativeEvent.propertyName;
  this.elapsedTime = nativeEvent.elapsedTime;
  this.pseudoElement = nativeEvent.pseudoElement;
}
SyntheticTransitionEvent.prototype = SyntheticEvent.prototype;

export function SyntheticWheelEvent(
  reactName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
) {
  /**
   * @interface WheelEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */
  SyntheticMouseEvent.apply(this, arguments);
  this.deltaX =
    'deltaX' in nativeEvent
      ? nativeEvent.deltaX
      : // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
      'wheelDeltaX' in nativeEvent
      ? -nativeEvent.wheelDeltaX
      : 0;
  this.deltaY =
    'deltaY' in nativeEvent
      ? nativeEvent.deltaY
      : // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
      'wheelDeltaY' in nativeEvent
      ? -nativeEvent.wheelDeltaY
      : // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
      'wheelDelta' in nativeEvent
      ? -nativeEvent.wheelDelta
      : 0;
  this.deltaZ = nativeEvent.deltaZ;
  // Browsers without "deltaMode" is reporting in raw wheel delta where one
  // notch on the scroll is always +/- 120, roughly equivalent to pixels.
  // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
  // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
  this.deltaMode = nativeEvent.deltaMode;
}
SyntheticWheelEvent.prototype = SyntheticEvent.prototype;
