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
let Press;

const DEFAULT_LONG_PRESS_DELAY = 500;

const createPointerEvent = type => {
  const event = document.createEvent('Event');
  event.initEvent(type, true, true);
  return event;
};

const createKeyboardEvent = (type, data) => {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...data,
  });
};

describe('Event responder: Press', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Press = require('react-events/press');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('onPressStart', () => {
    let onPressStart, ref;

    beforeEach(() => {
      onPressStart = jest.fn();
      ref = React.createRef();
      const element = (
        <Press onPressStart={onPressStart}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerdown" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('ignores browser emulated "mousedown" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      ref.current.dispatchEvent(createPointerEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('is called once after "keydown" events for Enter', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('is called once after "keydown" events for Spacebar', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('is not called after "keydown" for other keys', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'a'}));
      expect(onPressStart).not.toBeCalled();
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" event', () => {
      ref.current.dispatchEvent(createPointerEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });
    it('is called after "touchstart" event', () => {
      ref.current.dispatchEvent(createPointerEvent('touchstart'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    // TODO: complete delayPressStart tests
    // describe('delayPressStart', () => {});
  });

  describe('onPressEnd', () => {
    let onPressEnd, ref;

    beforeEach(() => {
      onPressEnd = jest.fn();
      ref = React.createRef();
      const element = (
        <Press onPressEnd={onPressEnd}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerup" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      ref.current.dispatchEvent(createPointerEvent('pointerup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });

    it('ignores browser emulated "mouseup" event', () => {
      ref.current.dispatchEvent(createPointerEvent('touchstart'));
      ref.current.dispatchEvent(createPointerEvent('touchend'));
      ref.current.dispatchEvent(createPointerEvent('mouseup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });

    it('is called after "keyup" event for Enter', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });

    it('is called after "keyup" event for Spacebar', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: ' '}));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });

    it('is not called after "keyup" event for other keys', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'a'}));
      expect(onPressEnd).not.toBeCalled();
    });

    // No PointerEvent fallbacks
    it('is called after "mouseup" event', () => {
      ref.current.dispatchEvent(createPointerEvent('mousedown'));
      ref.current.dispatchEvent(createPointerEvent('mouseup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });
    it('is called after "touchend" event', () => {
      ref.current.dispatchEvent(createPointerEvent('touchstart'));
      ref.current.dispatchEvent(createPointerEvent('touchend'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });

    // TODO: complete delayPressStart tests
    // describe('delayPressStart', () => {});
  });

  describe('onPressChange', () => {
    let onPressChange, ref;

    beforeEach(() => {
      onPressChange = jest.fn();
      ref = React.createRef();
      const element = (
        <Press onPressChange={onPressChange}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerdown" and "pointerup" events', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createPointerEvent('pointerup'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    it('is called after valid "keydown" and "keyup" events', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" and "mouseup" events', () => {
      ref.current.dispatchEvent(createPointerEvent('mousedown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createPointerEvent('mouseup'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });
    it('is called after "touchstart" and "touchend" events', () => {
      ref.current.dispatchEvent(createPointerEvent('touchstart'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createPointerEvent('touchend'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onPress', () => {
    let onPress, ref;

    beforeEach(() => {
      onPress = jest.fn();
      ref = React.createRef();
      const element = (
        <Press onPress={onPress}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerup" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      ref.current.dispatchEvent(createPointerEvent('pointerup'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('is called after valid "keyup" event', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    // TODO: jsdom missing APIs
    //it('is called after "touchend" event', () => {
    //ref.current.dispatchEvent(createPointerEvent('touchstart'));
    //ref.current.dispatchEvent(createPointerEvent('touchend'));
    //expect(onPress).toHaveBeenCalledTimes(1);
    //});
  });

  describe('onLongPress', () => {
    let onLongPress, ref;

    beforeEach(() => {
      onLongPress = jest.fn();
      ref = React.createRef();
      const element = (
        <Press onLongPress={onLongPress}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);
    });

    it('is called if "pointerdown" lasts default delay', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      expect(onLongPress).not.toBeCalled();
      jest.advanceTimersByTime(1);
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('is not called if "pointerup" is dispatched before delay', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      ref.current.dispatchEvent(createPointerEvent('pointerup'));
      jest.advanceTimersByTime(1);
      expect(onLongPress).not.toBeCalled();
    });

    it('is called if valid "keydown" lasts default delay', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      expect(onLongPress).not.toBeCalled();
      jest.advanceTimersByTime(1);
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('is not called if valid "keyup" is dispatched before delay', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      jest.advanceTimersByTime(1);
      expect(onLongPress).not.toBeCalled();
    });

    describe('delayLongPress', () => {
      it('can be configured', () => {
        const element = (
          <Press delayLongPress={2000} onLongPress={onLongPress}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerdown'));
        jest.advanceTimersByTime(1999);
        expect(onLongPress).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });

      it('uses 10ms minimum delay length', () => {
        const element = (
          <Press delayLongPress={0} onLongPress={onLongPress}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerdown'));
        jest.advanceTimersByTime(9);
        expect(onLongPress).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });

      /*
      it('compounds with "delayPressStart"', () => {
        const delayPressStart = 100;
        const element = (
          <Press delayPressStart={delayPressStart} onLongPress={onLongPress}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerdown'));
        jest.advanceTimersByTime(delayPressStart + DEFAULT_LONG_PRESS_DELAY - 1);
        expect(onLongPress).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });
      */
    });
  });

  describe('onLongPressChange', () => {
    it('is called when long press state changes', () => {
      const onLongPressChange = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onLongPressChange={onLongPressChange}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
      expect(onLongPressChange).toHaveBeenCalledTimes(1);
      expect(onLongPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createPointerEvent('pointerup'));
      expect(onLongPressChange).toHaveBeenCalledTimes(2);
      expect(onLongPressChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onLongPressShouldCancelPress', () => {
    it('if true it cancels "onPress"', () => {
      const onPress = jest.fn();
      const onPressChange = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press
          onLongPress={() => {}}
          onLongPressShouldCancelPress={() => true}
          onPressChange={onPressChange}
          onPress={onPress}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      // NOTE: onPressChange behavior should not be affected
      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
      ref.current.dispatchEvent(createPointerEvent('pointerup'));
      expect(onPress).not.toBeCalled();
      expect(onPressChange).toHaveBeenCalledTimes(2);
    });
  });

  // TODO
  //describe('`onPress*` with movement', () => {
  //describe('within bounds of hit rect', () => {
  /** ┌──────────────────┐
   *  │  ┌────────────┐  │
   *  │  │ VisualRect │  │
   *  │  └────────────┘  │
   *  │     HitRect    X │ <= Move to X and release
   *  └──────────────────┘
   */

  //it('"onPress*" events are called when no delay', () => {});
  //it('"onPress*" events are called after a delay', () => {});
  //});

  //describe('beyond bounds of hit rect', () => {
  /** ┌──────────────────┐
   *  │  ┌────────────┐  │
   *  │  │ VisualRect │  │
   *  │  └────────────┘  │
   *  │     HitRect      │
   *  └──────────────────┘
   *                   X   <= Move to X and release
   */

  //it('"onPress" only is not called when no delay', () => {});
  //it('"onPress*" events are not called after a delay', () => {});
  //it('"onPress*" events are called when press is released before measure completes', () => {});
  //});
  //});

  describe('nested responders', () => {
    it('dispatch events in the correct order', () => {
      const events = [];
      const ref = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Press
          onPress={createEventHandler('outer: onPress')}
          onPressChange={createEventHandler('outer: onPressChange')}
          onPressStart={createEventHandler('outer: onPressStart')}
          onPressEnd={createEventHandler('outer: onPressEnd')}>
          <Press
            onPress={createEventHandler('inner: onPress')}
            onPressChange={createEventHandler('inner: onPressChange')}
            onPressStart={createEventHandler('inner: onPressStart')}
            onPressEnd={createEventHandler('inner: onPressEnd')}>
            <div
              ref={ref}
              onPointerDown={createEventHandler('pointerdown')}
              onPointerUp={createEventHandler('pointerup')}
              onKeyDown={createEventHandler('keydown')}
              onKeyUp={createEventHandler('keyup')}
            />
          </Press>
        </Press>
      );

      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createPointerEvent('pointerdown'));
      ref.current.dispatchEvent(createPointerEvent('pointerup'));
      expect(events).toEqual([
        'pointerdown',
        'inner: onPressStart',
        'inner: onPressChange',
        'outer: onPressStart',
        'outer: onPressChange',
        'pointerup',
        'inner: onPressEnd',
        'inner: onPressChange',
        'inner: onPress',
        'outer: onPressEnd',
        'outer: onPressChange',
        'outer: onPress',
      ]);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(Press.displayName).toBe('Press');
  });
});
