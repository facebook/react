/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {
  buttonType,
  buttonsType,
  defaultPointerSize,
  defaultBrowserChromeSize,
} from './constants';

/**
 * Native event object mocks for higher-level events.
 *
 * 1. Each event type defines the exact object that it accepts. This ensures
 * that no arbitrary properties can be assigned to events, and the properties
 * that don't exist on specific event types (e.g., 'pointerType') are not added
 * to the respective native event.
 *
 * 2. Properties that cannot be relied on due to inconsistent browser support (e.g., 'x' and 'y') are not
 * added to the native event. Others that shouldn't be arbitrarily customized (e.g., 'screenX')
 * are automatically inferred from associated values.
 *
 * 3. PointerEvent and TouchEvent fields are normalized (e.g., 'rotationAngle' -> 'twist')
 */

function emptyFunction() {}

function createEvent(type, data = {}) {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(type, true, true);
  if (data != null) {
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (key === 'timeStamp' && !value) {
        return;
      }
      Object.defineProperty(event, key, {value});
    });
  }
  return event;
}

function createGetModifierState(keyArg, data) {
  if (keyArg === 'Alt') {
    return data.altKey || false;
  }
  if (keyArg === 'Control') {
    return data.ctrlKey || false;
  }
  if (keyArg === 'Meta') {
    return data.metaKey || false;
  }
  if (keyArg === 'Shift') {
    return data.shiftKey || false;
  }
}

function createPointerEvent(
  type,
  {
    altKey = false,
    button = buttonType.none,
    buttons = buttonsType.none,
    ctrlKey = false,
    detail = 1,
    height,
    metaKey = false,
    movementX = 0,
    movementY = 0,
    offsetX = 0,
    offsetY = 0,
    pageX,
    pageY,
    pointerId,
    pressure = 0,
    preventDefault = emptyFunction,
    pointerType = 'mouse',
    screenX,
    screenY,
    shiftKey = false,
    tangentialPressure = 0,
    tiltX = 0,
    tiltY = 0,
    timeStamp,
    twist = 0,
    width,
    x = 0,
    y = 0,
  } = {},
) {
  const modifierState = {altKey, ctrlKey, metaKey, shiftKey};
  const isMouse = pointerType === 'mouse';

  return createEvent(type, {
    altKey,
    button,
    buttons,
    clientX: x,
    clientY: y,
    ctrlKey,
    detail,
    getModifierState(keyArg) {
      return createGetModifierState(keyArg, modifierState);
    },
    height: isMouse ? 1 : height != null ? height : defaultPointerSize,
    metaKey,
    movementX,
    movementY,
    offsetX,
    offsetY,
    pageX: pageX || x,
    pageY: pageY || y,
    pointerId,
    pointerType,
    pressure,
    preventDefault,
    releasePointerCapture: emptyFunction,
    screenX: screenX === 0 ? screenX : x,
    screenY: screenY === 0 ? screenY : y + defaultBrowserChromeSize,
    setPointerCapture: emptyFunction,
    shiftKey,
    tangentialPressure,
    tiltX,
    tiltY,
    timeStamp,
    twist,
    width: isMouse ? 1 : width != null ? width : defaultPointerSize,
  });
}

function createKeyboardEvent(
  type,
  {
    altKey = false,
    ctrlKey = false,
    isComposing = false,
    key = '',
    metaKey = false,
    preventDefault = emptyFunction,
    shiftKey = false,
  } = {},
) {
  const modifierState = {altKey, ctrlKey, metaKey, shiftKey};

  return createEvent(type, {
    altKey,
    ctrlKey,
    getModifierState(keyArg) {
      return createGetModifierState(keyArg, modifierState);
    },
    isComposing,
    key,
    metaKey,
    preventDefault,
    shiftKey,
  });
}

function createMouseEvent(
  type,
  {
    altKey = false,
    button = buttonType.none,
    buttons = buttonsType.none,
    ctrlKey = false,
    detail = 1,
    metaKey = false,
    movementX = 0,
    movementY = 0,
    offsetX = 0,
    offsetY = 0,
    pageX,
    pageY,
    preventDefault = emptyFunction,
    screenX,
    screenY,
    shiftKey = false,
    timeStamp,
    x = 0,
    y = 0,
  } = {},
) {
  const modifierState = {altKey, ctrlKey, metaKey, shiftKey};

  return createEvent(type, {
    altKey,
    button,
    buttons,
    clientX: x,
    clientY: y,
    ctrlKey,
    detail,
    getModifierState(keyArg) {
      return createGetModifierState(keyArg, modifierState);
    },
    metaKey,
    movementX,
    movementY,
    offsetX,
    offsetY,
    pageX: pageX || x,
    pageY: pageY || y,
    preventDefault,
    screenX: screenX === 0 ? screenX : x,
    screenY: screenY === 0 ? screenY : y + defaultBrowserChromeSize,
    shiftKey,
    timeStamp,
  });
}

function createTouchEvent(type, payload) {
  return createEvent(type, {
    ...payload,
    detail: 0,
    sourceCapabilities: {
      firesTouchEvents: true,
    },
  });
}

/**
 * Mock event objects
 */

export function blur({relatedTarget} = {}) {
  return new FocusEvent('blur', {relatedTarget});
}

export function focusOut({relatedTarget} = {}) {
  return new FocusEvent('focusout', {relatedTarget, bubbles: true});
}

export function click(payload) {
  return createMouseEvent('click', {
    button: buttonType.primary,
    ...payload,
  });
}

export function contextmenu(payload) {
  return createMouseEvent('contextmenu', {
    ...payload,
    detail: 0,
  });
}

export function dragstart(payload) {
  return createMouseEvent('dragstart', {
    ...payload,
    detail: 0,
  });
}

export function focus({relatedTarget} = {}) {
  return new FocusEvent('focus', {relatedTarget});
}

export function focusIn({relatedTarget} = {}) {
  return new FocusEvent('focusin', {relatedTarget, bubbles: true});
}

export function scroll() {
  return createEvent('scroll');
}

export function virtualclick(payload) {
  return createMouseEvent('click', {
    button: 0,
    ...payload,
    buttons: 0,
    detail: 0,
    height: 1,
    pageX: 0,
    pageY: 0,
    pressure: 0,
    screenX: 0,
    screenY: 0,
    width: 1,
    x: 0,
    y: 0,
  });
}

/**
 * Key events
 */

export function keydown(payload) {
  return createKeyboardEvent('keydown', payload);
}

export function keyup(payload) {
  return createKeyboardEvent('keyup', payload);
}

/**
 * Pointer events
 */

export function gotpointercapture(payload) {
  return createPointerEvent('gotpointercapture', payload);
}

export function lostpointercapture(payload) {
  return createPointerEvent('lostpointercapture', payload);
}

export function pointercancel(payload) {
  return createPointerEvent('pointercancel', {
    ...payload,
    buttons: 0,
    detail: 0,
    height: 1,
    pageX: 0,
    pageY: 0,
    pressure: 0,
    screenX: 0,
    screenY: 0,
    width: 1,
    x: 0,
    y: 0,
  });
}

export function pointerdown(payload) {
  const isTouch = payload != null && payload.pointerType === 'touch';
  return createPointerEvent('pointerdown', {
    button: buttonType.primary,
    buttons: buttonsType.primary,
    pressure: isTouch ? 1 : 0.5,
    ...payload,
  });
}

export function pointerenter(payload) {
  return createPointerEvent('pointerenter', payload);
}

export function pointerleave(payload) {
  return createPointerEvent('pointerleave', payload);
}

export function pointermove(payload) {
  return createPointerEvent('pointermove', {
    ...payload,
    button: buttonType.none,
  });
}

export function pointerout(payload) {
  return createPointerEvent('pointerout', payload);
}

export function pointerover(payload) {
  return createPointerEvent('pointerover', payload);
}

export function pointerup(payload) {
  return createPointerEvent('pointerup', {
    button: buttonType.primary,
    ...payload,
    buttons: buttonsType.none,
    pressure: 0,
  });
}

/**
 * Mouse events
 */

export function mousedown(payload) {
  // The value of 'button' and 'buttons' for 'mousedown' must not be none.
  const button =
    payload == null || payload.button === buttonType.none
      ? buttonType.primary
      : payload.button;
  const buttons =
    payload == null || payload.buttons === buttonsType.none
      ? buttonsType.primary
      : payload.buttons;
  return createMouseEvent('mousedown', {
    ...payload,
    button,
    buttons,
  });
}

export function mouseenter(payload) {
  return createMouseEvent('mouseenter', payload);
}

export function mouseleave(payload) {
  return createMouseEvent('mouseleave', payload);
}

export function mousemove(payload) {
  return createMouseEvent('mousemove', payload);
}

export function mouseout(payload) {
  return createMouseEvent('mouseout', payload);
}

export function mouseover(payload) {
  return createMouseEvent('mouseover', payload);
}

export function mouseup(payload) {
  return createMouseEvent('mouseup', {
    button: buttonType.primary,
    ...payload,
    buttons: buttonsType.none,
  });
}

/**
 * Touch events
 */

export function touchcancel(payload) {
  return createTouchEvent('touchcancel', payload);
}

export function touchend(payload) {
  return createTouchEvent('touchend', payload);
}

export function touchmove(payload) {
  return createTouchEvent('touchmove', payload);
}

export function touchstart(payload) {
  return createTouchEvent('touchstart', payload);
}
