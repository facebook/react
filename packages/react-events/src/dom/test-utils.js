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

function dragstart(data) {
  return createEvent('dragstart', data);
}

function focus(data) {
  return createEvent('focus', data);
}

function gotpointercapture(data) {
  return createEvent('gotpointercapture', data);
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

function dispatchPointerHoverEnter(ref, {relatedTarget, x, y} = {}) {
  const dispatch = arg => ref.current.dispatchEvent(arg);
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

function dispatchPointerHoverMove(ref, {from, to} = {}) {
  const dispatch = arg => ref.current.dispatchEvent(arg);
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

function dispatchPointerHoverExit(ref, {relatedTarget, x, y} = {}) {
  const dispatch = arg => ref.current.dispatchEvent(arg);
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

function dispatchPointerCancel(ref, options) {
  const dispatchEvent = arg => ref.current.dispatchEvent(arg);
  dispatchEvent(pointercancel({pointerType: 'mouse'}));
  dispatchEvent(dragstart({pointerType: 'mouse'}));
}

function dispatchPointerPressDown(ref, {button = 0, pointerType = 'mouse'}) {
  const dispatch = arg => ref.current.dispatchEvent(arg);
  const pointerId = 1;
  if (hasPointerEvent()) {
    dispatch(pointerover({pointerId, pointerType, button}));
    dispatch(pointerenter({pointerId, pointerType, button}));
    dispatch(pointerdown({pointerId, pointerType, button}));
  }
  dispatch(touchstart(null, pointerId));
  if (hasPointerEvent()) {
    dispatch(gotpointercapture({pointerId, pointerType, button}));
  }
}

function dispatchPointerPressRelease(ref, {button = 0, pointerType = 'mouse'}) {
  const dispatch = arg => ref.current.dispatchEvent(arg);
  const pointerId = 1;
  if (hasPointerEvent()) {
    dispatch(pointerup({pointerId, pointerType, button}));
    dispatch(lostpointercapture({pointerId, pointerType, button}));
    dispatch(pointerout({pointerId, pointerType, button}));
    dispatch(pointerleave({pointerId, pointerType, button}));
  }
  dispatch(touchend(null, pointerId));
  dispatch(mouseover({button}));
  dispatch(mousemove({button}));
  dispatch(mousedown({button}));
  dispatch(focus({button}));
  dispatch(mouseup({button}));
  dispatch(click({button}));
}

function dispatchTouchTap(ref) {
  dispatchPointerPressDown(ref, {pointerType: 'touch'});
  dispatchPointerPressRelease(ref, {pointerType: 'touch'});
}

module.exports = {
  createEvent,
  dispatchPointerCancel,
  dispatchPointerHoverEnter,
  dispatchPointerHoverExit,
  dispatchPointerHoverMove,
  dispatchPointerPressDown,
  dispatchPointerPressRelease,
  dispatchTouchTap,
  platform,
  hasPointerEvent,
  setPointerEvent,
};
