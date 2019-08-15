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

function hasPointerEvent() {
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

function createEvent(type, data = {}) {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(type, true, true);
  event.clientX = data.x || 0;
  event.clientY = data.y || 0;
  event.x = data.x || 0;
  event.y = data.y || 0;
  if (data != null) {
    Object.keys(data).forEach(key => {
      const value = data[key];
      Object.defineProperty(event, key, {value});
    });
  }
  return event;
}

function createTouchEvent(type, data = {}, id) {
  return createEvent(type, {
    changedTouches: [
      {
        identifier: id,
        clientX: data.x || 0,
        clientY: data.y || 0,
        ...data,
      },
    ],
    targetTouches: [
      {
        identifier: id,
        clientX: 0 || data.x,
        clientY: 0 || data.y,
        ...data,
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
  return createEvent('keydown', data);
}

function keyup(data) {
  return createEvent('keyup', data);
}

function lostpointercapture(data) {
  return createEvent('lostpointercapture', data);
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

function scroll(data) {
  return createEvent('scroll', data);
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
  dispatch(mouseenter(event));
}

function dispatchPointerHoverMove(target, {x, y} = {}) {
  const dispatch = arg => target.dispatchEvent(arg);
  const button = -1;
  const pointerId = 1;
  const pointerType = 'mouse';
  function dispatchMove() {
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
  dispatchMove();
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

function dispatchPointerCancel(target, {pointerType = 'mouse', ...rest} = {}) {
  const dispatchEvent = arg => target.dispatchEvent(arg);
  if (hasPointerEvent()) {
    dispatchEvent(pointercancel({pointerType, ...rest}));
  } else {
    if (pointerType === 'mouse') {
      dispatchEvent(dragstart({...rest}));
    } else {
      dispatchEvent(touchcancel({...rest}));
    }
  }
}

function dispatchPointerDown(
  target,
  {button = 0, pointerType = 'mouse', ...rest} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerId = 1;
  const pointerEvent = {button, pointerId, pointerType, ...rest};
  const mouseEvent = {button, ...rest};
  const touch = {...rest};

  if (pointerType === 'mouse') {
    if (hasPointerEvent()) {
      dispatch(pointerover(pointerEvent));
      dispatch(pointerenter(pointerEvent));
    }
    dispatch(mouseover(mouseEvent));
    dispatch(mouseenter(mouseEvent));
    if (hasPointerEvent()) {
      dispatch(pointerdown(pointerEvent));
    }
    dispatch(mousedown(mouseEvent));
    if (document.activeElement !== target) {
      dispatch(focus());
    }
  } else {
    if (hasPointerEvent()) {
      dispatch(pointerover(pointerEvent));
      dispatch(pointerenter(pointerEvent));
      dispatch(pointerdown(pointerEvent));
    }
    dispatch(touchstart(touch, pointerId));
    if (hasPointerEvent()) {
      dispatch(gotpointercapture(pointerEvent));
    }
  }
}

function dispatchPointerUp(
  target,
  {button = 0, pointerType = 'mouse', ...rest} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerId = 1;
  const pointerEvent = {button, pointerId, pointerType, ...rest};
  const mouseEvent = {button, ...rest};
  const touch = {...rest};

  if (pointerType === 'mouse') {
    if (hasPointerEvent()) {
      dispatch(pointerup(pointerEvent));
    }
    dispatch(mouseup(mouseEvent));
    dispatch(click(mouseEvent));
  } else {
    if (hasPointerEvent()) {
      dispatch(pointerup(pointerEvent));
      dispatch(lostpointercapture(pointerEvent));
      dispatch(pointerout(pointerEvent));
      dispatch(pointerleave(pointerEvent));
    }
    dispatch(touchend(touch, pointerId));
    dispatch(mouseover(mouseEvent));
    dispatch(mousemove(mouseEvent));
    dispatch(mousedown(mouseEvent));
    if (document.activeElement !== target) {
      dispatch(focus());
    }
    dispatch(mouseup(mouseEvent));
    dispatch(click(mouseEvent));
  }
}

function dispatchPointerMove(
  target,
  {button = 0, pointerType = 'mouse', ...rest} = {},
) {
  const dispatch = arg => target.dispatchEvent(arg);
  const pointerId = 1;
  const pointerEvent = {
    button,
    pointerId,
    pointerType,
    ...rest,
  };
  const mouseEvent = {
    button,
    ...rest,
  };
  const touch = {
    ...rest,
  };

  if (hasPointerEvent()) {
    dispatch(pointermove(pointerEvent));
  }
  if (pointerType === 'mouse') {
    dispatch(mousemove(mouseEvent));
  }
  if (pointerType === 'touch') {
    dispatch(touchmove(touch, pointerId));
  }
}

function dispatchTouchTap(target) {
  dispatchPointerDown(target, {pointerType: 'touch'});
  dispatchPointerUp(target, {pointerType: 'touch'});
}

function dispatchMouseTap(target) {
  dispatchPointerDown(target, {pointerType: 'mouse'});
  dispatchPointerUp(target, {pointerType: 'mouse'});
}

module.exports = {
  blur,
  click,
  focus,
  createEvent,
  dispatchLongPressContextMenu,
  dispatchRightClickContextMenu,
  dispatchModifiedClickContextMenu,
  dispatchPointerCancel,
  dispatchPointerHoverEnter,
  dispatchPointerHoverExit,
  dispatchPointerHoverMove,
  dispatchPointerMove,
  dispatchPointerDown,
  dispatchPointerUp,
  dispatchTouchTap,
  dispatchMouseTap,
  keydown,
  keyup,
  scroll,
  pointerdown,
  pointerup,
  platform,
  hasPointerEvent,
  setPointerEvent,
};
