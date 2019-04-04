/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactDOM;
let Swipe;

const createMouseEvent = (type, x = 0, y = 0) => {
  const event = document.createEvent('MouseEvents');
  event.initMouseEvent(type, true, true, window, 1, x, y, 0, 0);
  return event;
};

const createTouchEvent = (type, x = 0, y = 0, identifiers = [1]) => {
  let touches = [];
  for (let i = 0; i < identifiers.length; i++) {
    touches.push({
      identifier: identifiers[i],
      target: document,
      clientX: 0,
      clientY: 0,
      screenX: x,
      screenY: y,
    });
  }

  const event = new TouchEvent(type, {
    cancelable: true,
    bubbles: true,
    composed: true,
    touches,
    targetTouches: touches,
    changedTouches: touches,
  });
  return event;
};

describe('Swipe event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Swipe = require('react-events/swipe');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('onSwipeStart', () => {
    let onSwipeStart, ref;

    beforeEach(() => {
      onSwipeStart = jest.fn();
      ref = React.createRef();
      const element = (
        <Swipe onSwipeStart={onSwipeStart}>
          <div ref={ref} />
        </Swipe>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerdown" event', () => {
      ref.current.dispatchEvent(createMouseEvent('pointerdown'));
      expect(onSwipeStart).toHaveBeenCalledTimes(1);
    });

    it('ignores emulated "mousedown" event', () => {
      ref.current.dispatchEvent(createMouseEvent('pointerdown'));
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      expect(onSwipeStart).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" event', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      expect(onSwipeStart).toHaveBeenCalledTimes(1);
    });

    it('is called after "touchstart" event', () => {
      ref.current.dispatchEvent(createTouchEvent('touchstart'));
      expect(onSwipeStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSwipeEnd', () => {
    let onSwipeEnd, ref;

    beforeEach(() => {
      onSwipeEnd = jest.fn();
      ref = React.createRef();
      const element = (
        <Swipe onSwipeEnd={onSwipeEnd}>
          <div ref={ref} />
        </Swipe>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerup" event', () => {
      ref.current.dispatchEvent(createMouseEvent('pointerdown'));
      ref.current.dispatchEvent(createMouseEvent('pointermove', 50, 50));
      ref.current.dispatchEvent(createMouseEvent('pointerup'));
      expect(onSwipeEnd).toHaveBeenCalledTimes(1);
    });

    it('ignores emulated "mouseup" event', () => {
      ref.current.dispatchEvent(createTouchEvent('touchstart'));
      ref.current.dispatchEvent(createTouchEvent('touchend'));
      ref.current.dispatchEvent(createMouseEvent('pointermove', 50, 50));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(onSwipeEnd).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    it('is called after "mouseup" event', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 50, 50));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(onSwipeEnd).toHaveBeenCalledTimes(1);
    });

    it('is called after "touchend" event', () => {
      ref.current.dispatchEvent(createTouchEvent('touchstart'));
      ref.current.dispatchEvent(createTouchEvent('touchmove', 50, 50));
      ref.current.dispatchEvent(createTouchEvent('touchend'));
      expect(onSwipeEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSwipe', () => {
    let onSwipe, ref;

    beforeEach(() => {
      onSwipe = jest.fn();
      ref = React.createRef();
      const element = (
        <Swipe onSwipe={onSwipe}>
          <div ref={ref} />
        </Swipe>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointermove" event', () => {
      ref.current.dispatchEvent(createMouseEvent('pointerdown'));
      ref.current.dispatchEvent(createMouseEvent('pointermove', 50, 50));
      expect(onSwipe).toHaveBeenCalledTimes(1);
    });

    it('is called after "mousemove" event', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 50, 50));
      expect(onSwipe).toHaveBeenCalledTimes(1);
    });

    it('ignores emulated "mousemove" event', () => {
      ref.current.dispatchEvent(createTouchEvent('touchstart'));
      ref.current.dispatchEvent(createTouchEvent('touchend'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 50, 50));
      ref.current.dispatchEvent(createMouseEvent('pointerup'));
      expect(onSwipe).toHaveBeenCalledTimes(1);
    });
  });

  describe('Directions', () => {
    let ref, directions;

    beforeEach(() => {
      directions = [];
      function onSwipe(e) {
        directions.push(e.direction);
      }

      ref = React.createRef();
      const element = (
        <Swipe onSwipe={onSwipe}>
          <div ref={ref} />
        </Swipe>
      );
      ReactDOM.render(element, container);
    });

    it('should be right', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 50, 0));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(directions).toEqual(['right']);
    });
    it('should be left', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', -50, 0));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(directions).toEqual(['left']);
    });
    it('should be up', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 0, 50));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(directions).toEqual(['up']);
    });
    it('should be down', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 0, -50));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(directions).toEqual(['down']);
    });

    it('directions in events in the correct order vertical', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', -50, 0));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 50, 0));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 60, 0));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(directions).toEqual(['left', 'right', 'right']);
    });
    it('directions in events in the correct order horizontal', () => {
      ref.current.dispatchEvent(createMouseEvent('mousedown'));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 0, -50));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 0, 50));
      ref.current.dispatchEvent(createMouseEvent('mousemove', 0, 60));
      ref.current.dispatchEvent(createMouseEvent('mouseup'));
      expect(directions).toEqual(['down', 'up', 'up']);
    });
  });

  describe('nested responders', () => {
    //TODO: test for many touch identifier
    it('dispatch events in the correct order', () => {
      let events = [];
      const ref = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Swipe
          onSwipe={createEventHandler('outer: onSwipe')}
          onSwipeEnd={createEventHandler('outer: onSwipeEnd')}
          onSwipeStart={createEventHandler('outer: onSwipeStart')}>
          <Swipe
            onSwipe={createEventHandler('inner: onSwipe')}
            onSwipeEnd={createEventHandler('inner: onSwipeEnd')}
            onSwipeStart={createEventHandler('inner: onSwipeStart')}>
            <div ref={ref} />
          </Swipe>
        </Swipe>
      );

      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createMouseEvent('pointerdown'));
      ref.current.dispatchEvent(createMouseEvent('pointermove', 50, 50));
      ref.current.dispatchEvent(createMouseEvent('pointerup'));
      expect(events).toEqual([
        'inner: onSwipeStart',
        'outer: onSwipeStart',
        'inner: onSwipe',
        'outer: onSwipe',
        'inner: onSwipeEnd',
        'outer: onSwipeEnd',
      ]);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(Swipe.displayName).toBe('Swipe');
  });
});
