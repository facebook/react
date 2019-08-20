/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import * as domEvents from './domEvents';
import {hasPointerEvent, platform} from './domEnvironment';

function emptyFunction() {}

function getPointerType(payload) {
  let pointerType = 'mouse';
  if (payload != null && payload.pointerType != null) {
    pointerType = payload.pointerType;
  }
  return pointerType;
}

export function contextmenu(
  target,
  {preventDefault = emptyFunction} = {},
  {pointerType = 'mouse', modified} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  if (pointerType === 'touch') {
    const button = 0;
    if (hasPointerEvent()) {
      dispatch(domEvents.pointerdown({button, pointerType}));
    }
    dispatch(domEvents.touchstart());
    dispatch(domEvents.contextmenu({button, preventDefault}));
  } else if (pointerType === 'mouse') {
    if (modified === true) {
      const button = 0;
      const ctrlKey = true;
      if (hasPointerEvent()) {
        dispatch(domEvents.pointerdown({button, ctrlKey, pointerType}));
      }
      dispatch(domEvents.mousedown({button, ctrlKey}));
      if (platform.get() === 'mac') {
        dispatch(domEvents.contextmenu({button, ctrlKey, preventDefault}));
      }
    } else {
      const button = 2;
      if (hasPointerEvent()) {
        dispatch(domEvents.pointerdown({button, pointerType}));
      }
      dispatch(domEvents.mousedown({button}));
      dispatch(domEvents.contextmenu({button, preventDefault}));
    }
  }
}

export function pointercancel(target, payload) {
  const dispatchEvent = arg => target.dispatchEvent(arg);
  const pointerType = getPointerType(payload);
  if (hasPointerEvent()) {
    dispatchEvent(domEvents.pointercancel(payload));
  } else {
    if (pointerType === 'mouse') {
      dispatchEvent(domEvents.dragstart(payload));
    } else {
      dispatchEvent(domEvents.touchcancel(payload));
    }
  }
}

export function pointerdown(target, defaultPayload) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerType = getPointerType(defaultPayload);
  const payload = {button: 0, buttons: 2, ...defaultPayload};

  if (pointerType === 'mouse') {
    if (hasPointerEvent()) {
      dispatch(domEvents.pointerover(payload));
      dispatch(domEvents.pointerenter(payload));
    }
    dispatch(domEvents.mouseover(payload));
    dispatch(domEvents.mouseenter(payload));
    if (hasPointerEvent()) {
      dispatch(domEvents.pointerdown(payload));
    }
    dispatch(domEvents.mousedown(payload));
    if (document.activeElement !== target) {
      dispatch(domEvents.focus());
    }
  } else {
    if (hasPointerEvent()) {
      dispatch(domEvents.pointerover(payload));
      dispatch(domEvents.pointerenter(payload));
      dispatch(domEvents.pointerdown(payload));
    }
    dispatch(domEvents.touchstart(payload));
    if (hasPointerEvent()) {
      dispatch(domEvents.gotpointercapture(payload));
    }
  }
}

export function pointerenter(target, payload) {
  const dispatch = arg => target.dispatchEvent(arg);
  if (hasPointerEvent()) {
    dispatch(domEvents.pointerover(payload));
    dispatch(domEvents.pointerenter(payload));
  }
  dispatch(domEvents.mouseover(payload));
  dispatch(domEvents.mouseenter(payload));
}

export function pointerexit(target, payload) {
  const dispatch = arg => target.dispatchEvent(arg);
  if (hasPointerEvent()) {
    dispatch(domEvents.pointerout(payload));
    dispatch(domEvents.pointerleave(payload));
  }
  dispatch(domEvents.mouseout(payload));
  dispatch(domEvents.mouseleave(payload));
}

export function pointerhover(target, payload) {
  const dispatch = arg => target.dispatchEvent(arg);
  if (hasPointerEvent()) {
    dispatch(domEvents.pointermove(payload));
  }
  dispatch(domEvents.mousemove(payload));
}

export function pointermove(target, payload) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerType = getPointerType(payload);
  if (hasPointerEvent()) {
    dispatch(domEvents.pointermove(payload));
  }
  if (pointerType === 'mouse') {
    dispatch(domEvents.mousemove(payload));
  } else {
    dispatch(domEvents.touchmove(payload));
  }
}

export function pointerup(target, defaultPayload) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerType = getPointerType(defaultPayload);
  const payload = {button: 0, buttons: 2, ...defaultPayload};

  if (pointerType === 'mouse') {
    if (hasPointerEvent()) {
      dispatch(domEvents.pointerup(payload));
    }
    dispatch(domEvents.mouseup(payload));
    dispatch(domEvents.click(payload));
  } else {
    if (hasPointerEvent()) {
      dispatch(domEvents.pointerup(payload));
      dispatch(domEvents.lostpointercapture(payload));
      dispatch(domEvents.pointerout(payload));
      dispatch(domEvents.pointerleave(payload));
    }
    dispatch(domEvents.touchend(payload));
    dispatch(domEvents.mouseover(payload));
    dispatch(domEvents.mousemove(payload));
    dispatch(domEvents.mousedown(payload));
    if (document.activeElement !== target) {
      dispatch(domEvents.focus());
    }
    dispatch(domEvents.mouseup(payload));
    dispatch(domEvents.click(payload));
  }
}
