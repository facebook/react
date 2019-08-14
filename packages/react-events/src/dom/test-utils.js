/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

/* eslint-disable no-unused-vars */

/**
 * Change environment support for PointerEvent.
 */

function hasPointerEvent(bool) {
  return global != null && global.PointerEvent != null;
}

function setPointerEvent(bool) {
  global.PointerEvent = bool ? function() {} : undefined;
}

/**
 * Change environment host platform.
 */

const platformGetter = jest.spyOn(global.navigator, 'platform', 'get');

const platform = {
  clear() {
    platformGetter.mockClear();
  },
  get() {
    return global.navigator.platform === 'MacIntel' ? 'mac' : 'windows';
  },
  set(name: 'mac' | 'windows') {
    switch (name) {
      case 'mac': {
        platformGetter.mockReturnValue('MacIntel');
        break;
      }
      case 'windows': {
        platformGetter.mockReturnValue('Win32');
        break;
      }
      default: {
        break;
      }
    }
  },
};

/**
 * Mock native events
 */

function createEvent(type, data) {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(type, true, true);
  if (data != null) {
    Object.entries(data).forEach(([key, value]) => {
      event[key] = value;
    });
  }
  return event;
}

function createTouchEvent(type, data, id) {
  return createEvent(type, {
    changedTouches: [
      {
        ...data,
        identifier: id,
      },
    ],
  });
}

const createKeyboardEvent = (type, data) => {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...data,
  });
};

function blur(data) {
  return createEvent('blur', data);
}

function click(data) {
  return createEvent('click', data);
}

function contextmenu(data) {
  return createEvent('contextmenu', data);
}

function dragstart(data) {
  return createEvent('dragstart', data);
}

function focus(data) {
  return createEvent('focus', data);
}

function gotpointercapture(data) {
  return createEvent('gotpointercapture', data);
}

function keydown(data) {
  return createKeyboardEvent('keydown', data);
}

function keyup(data) {
  return createKeyboardEvent('keyup', data);
}

function lostpointercapture(data) {
  return createEvent('lostpointercapture', data);
}

function pointercancel(data) {
  return createEvent('pointercancel', data);
}

function pointerdown(data) {
  return createEvent('pointerdown', data);
}

function pointerenter(data) {
  return createEvent('pointerenter', data);
}

function pointerleave(data) {
  return createEvent('pointerleave', data);
}

function pointermove(data) {
  return createEvent('pointermove', data);
}

function pointerout(data) {
  return createEvent('pointerout', data);
}

function pointerover(data) {
  return createEvent('pointerover', data);
}

function pointerup(data) {
  return createEvent('pointerup', data);
}

function mousedown(data) {
  return createEvent('mousedown', data);
}

function mouseenter(data) {
  return createEvent('mouseenter', data);
}

function mouseleave(data) {
  return createEvent('mouseleave', data);
}

function mousemove(data) {
  return createEvent('mousemove', data);
}

function mouseout(data) {
  return createEvent('mouseout', data);
}

function mouseover(data) {
  return createEvent('mouseover', data);
}

function mouseup(data) {
  return createEvent('mouseup', data);
}

function touchcancel(data, id) {
  return createTouchEvent('touchcancel', data, id);
}

function touchend(data, id) {
  return createTouchEvent('touchend', data, id);
}

function touchmove(data, id) {
  return createTouchEvent('touchmove', data, id);
}

function touchstart(data, id) {
  return createTouchEvent('touchstart', data, id);
}

/**
 * Dispatch high-level event sequences
 */

function emptyFunction() {}

function dispatchLongPressContextMenu(
  target,
  {preventDefault = emptyFunction} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const button = 0;
  if (hasPointerEvent()) {
    dispatch(pointerdown({button, pointerType: 'touch'}));
  }
  dispatch(touchstart());
  dispatch(contextmenu({button, preventDefault}));
}

function dispatchRightClickContextMenu(
  target,
  {preventDefault = emptyFunction} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const button = 2;
  if (hasPointerEvent()) {
    dispatch(pointerdown({button, pointerType: 'mouse'}));
  }
  dispatch(mousedown({button}));
  dispatch(contextmenu({button, preventDefault}));
}

function dispatchModifiedClickContextMenu(
  target,
  {preventDefault = emptyFunction} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const button = 0;
  const ctrlKey = true;
  if (hasPointerEvent()) {
    dispatch(pointerdown({button, ctrlKey, pointerType: 'mouse'}));
  }
  dispatch(mousedown({button, ctrlKey}));
  if (platform.get() === 'mac') {
    dispatch(contextmenu({button, ctrlKey, preventDefault}));
  }
}

function dispatchPointerHoverEnter(target, {relatedTarget, x, y} = {}) {
  const dispatch = arg => target.dispatchEvent(arg);
  const button = -1;
  const pointerType = 'mouse';
  const event = {
    button,
    relatedTarget,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
  };
  if (hasPointerEvent()) {
    dispatch(pointerover({pointerType, ...event}));
    dispatch(pointerenter({pointerType, ...event}));
  }
  dispatch(mouseover(event));
  dispatch(mouseover(event));
}

function dispatchPointerHoverMove(target, {from, to} = {}) {
  const dispatch = arg => target.dispatchEvent(arg);
  const button = -1;
  const pointerId = 1;
  const pointerType = 'mouse';
  function dispatchMove({x, y}) {
    const event = {
      button,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
    };
    if (hasPointerEvent()) {
      dispatch(pointermove({pointerId, pointerType, ...event}));
    }
    dispatch(mousemove(event));
  }
  dispatchMove({x: from.x, y: from.y});
  dispatchMove({x: to.x, y: to.y});
}

function dispatchPointerHoverExit(target, {relatedTarget, x, y} = {}) {
  const dispatch = arg => target.dispatchEvent(arg);
  const button = -1;
  const pointerType = 'mouse';
  const event = {
    button,
    relatedTarget,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
  };
  if (hasPointerEvent()) {
    dispatch(pointerout({pointerType, ...event}));
    dispatch(pointerleave({pointerType, ...event}));
  }
  dispatch(mouseout(event));
  dispatch(mouseleave(event));
}

function dispatchPointerCancel(target, options) {
  const dispatchEvent = arg => target.dispatchEvent(arg);
  dispatchEvent(pointercancel({pointerType: 'mouse'}));
  dispatchEvent(dragstart({pointerType: 'mouse'}));
}

function dispatchPointerPressDown(
  target,
  {button = 0, pointerType = 'mouse'} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerId = 1;
  if (pointerType !== 'mouse') {
    if (hasPointerEvent()) {
      dispatch(pointerover({button, pointerId, pointerType}));
      dispatch(pointerenter({button, pointerId, pointerType}));
      dispatch(pointerdown({button, pointerId, pointerType}));
    }
    dispatch(touchstart(null, pointerId));
    if (hasPointerEvent()) {
      dispatch(gotpointercapture({button, pointerId, pointerType}));
    }
  } else {
    if (hasPointerEvent()) {
      dispatch(pointerdown({button, pointerId, pointerType}));
    }
    dispatch(mousedown({button}));
    if (document.activeElement !== target) {
      dispatch(focus({button}));
    }
  }
}

function dispatchPointerPressRelease(
  target,
  {button = 0, pointerType = 'mouse'} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerId = 1;
  if (pointerType !== 'mouse') {
    if (hasPointerEvent()) {
      dispatch(pointerup({button, pointerId, pointerType}));
      dispatch(lostpointercapture({button, pointerId, pointerType}));
      dispatch(pointerout({button, pointerId, pointerType}));
      dispatch(pointerleave({button, pointerId, pointerType}));
    }
    dispatch(touchend(null, pointerId));
    dispatch(mouseover({button}));
    dispatch(mousemove({button}));
    dispatch(mousedown({button}));
    if (document.activeElement !== target) {
      dispatch(focus({button}));
    }
    dispatch(mouseup({button}));
    dispatch(click({button}));
  } else {
    if (hasPointerEvent()) {
      dispatch(pointerup({button, pointerId, pointerType}));
    }
    dispatch(mouseup({button}));
    dispatch(click({button}));
  }
}

function dispatchTouchTap(target) {
  dispatchPointerPressDown(target, {pointerType: 'touch'});
  dispatchPointerPressRelease(target, {pointerType: 'touch'});
}

module.exports = {
  blur,
  focus,
  createEvent,
  dispatchLongPressContextMenu,
  dispatchRightClickContextMenu,
  dispatchModifiedClickContextMenu,
  dispatchPointerCancel,
  dispatchPointerHoverEnter,
  dispatchPointerHoverExit,
  dispatchPointerHoverMove,
  dispatchPointerPressDown,
  dispatchPointerPressRelease,
  dispatchTouchTap,
  keydown,
  keyup,
  platform,
  hasPointerEvent,
  setPointerEvent,
};
