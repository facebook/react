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
import {buttonsType, hasPointerEvent, platform} from './domEnvironment';

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
    if (hasPointerEvent()) {
      dispatch(
        domEvents.pointerdown({buttons: buttonsType.primary, pointerType}),
      );
    }
    dispatch(domEvents.touchstart());
    dispatch(
      domEvents.contextmenu({buttons: buttonsType.none, preventDefault}),
    );
  } else if (pointerType === 'mouse') {
    if (modified === true) {
      const buttons = buttonsType.primary;
      const ctrlKey = true;
      if (hasPointerEvent()) {
        dispatch(domEvents.pointerdown({buttons, ctrlKey, pointerType}));
      }
      dispatch(domEvents.mousedown({buttons, ctrlKey}));
      if (platform.get() === 'mac') {
        dispatch(domEvents.contextmenu({buttons, ctrlKey, preventDefault}));
      }
    } else {
      const buttons = buttonsType.secondary;
      if (hasPointerEvent()) {
        dispatch(domEvents.pointerdown({buttons, pointerType}));
      }
      dispatch(domEvents.mousedown({buttons}));
      dispatch(domEvents.contextmenu({buttons, preventDefault}));
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
  const payload = {buttons: buttonsType.primary, ...defaultPayload};

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
    dispatch(
      domEvents.pointermove({
        pressure: pointerType === 'touch' ? 1 : 0.5,
        ...payload,
      }),
    );
  } else {
    if (pointerType === 'mouse') {
      dispatch(domEvents.mousemove(payload));
    } else {
      dispatch(domEvents.touchmove(payload));
    }
  }
}

export function pointerup(target, defaultPayload = {}) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerType = getPointerType(defaultPayload);
  // eslint-disable-next-line no-unused-vars
  const {buttons, ...payload} = defaultPayload;

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
    // NOTE: the value of 'buttons' for 'mousedown' must not be 0
    dispatch(domEvents.mousedown(payload));
    if (document.activeElement !== target) {
      dispatch(domEvents.focus());
    }
    dispatch(domEvents.mouseup(payload));
    dispatch(domEvents.click(payload));
  }
}
