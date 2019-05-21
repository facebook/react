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
let Scheduler;

const DEFAULT_LONG_PRESS_DELAY = 500;

const createEvent = (type, data) => {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(type, true, true);
  if (data != null) {
    Object.entries(data).forEach(([key, value]) => {
      event[key] = value;
    });
  }
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
    Scheduler = require('scheduler');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onPressStart, onPress, onPressEnd, ref;

    beforeEach(() => {
      onPressStart = jest.fn();
      onPress = jest.fn();
      onPressEnd = jest.fn();
      ref = React.createRef();
      const element = (
        <Press
          disabled={true}
          onPressStart={onPressStart}
          onPress={onPress}
          onPressEnd={onPressEnd}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressStart).not.toBeCalled();
      expect(onPress).not.toBeCalled();
      expect(onPressEnd).not.toBeCalled();
    });
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
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressstart'}),
      );
    });

    it('ignores browser emulated events', () => {
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('ignores any events not caused by left-click or touch/pen contact', () => {
      ref.current.dispatchEvent(createEvent('pointerdown', {button: 1}));
      ref.current.dispatchEvent(createEvent('pointerdown', {button: 5}));
      ref.current.dispatchEvent(createEvent('mousedown', {button: 2}));
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('is called once after "keydown" events for Enter', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    it('is called once after "keydown" events for Spacebar', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keypress', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keypress', {key: ' '}));
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    it('is not called after "keydown" for other keys', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'a'}));
      expect(onPressStart).not.toBeCalled();
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" event', () => {
      ref.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressstart'}),
      );
    });
    it('is called after "touchstart" event', () => {
      ref.current.dispatchEvent(createEvent('touchstart'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressstart'}),
      );
    });

    describe('delayPressStart', () => {
      it('can be configured', () => {
        const element = (
          <Press delayPressStart={2000} onPressStart={onPressStart}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(1999);
        expect(onPressStart).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onPressStart).toHaveBeenCalledTimes(1);
      });

      it('is cut short if the press is released during a delay', () => {
        const element = (
          <Press delayPressStart={2000} onPressStart={onPressStart}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = () => ({
          top: 50,
          left: 50,
          bottom: 500,
          right: 500,
        });

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(499);
        expect(onPressStart).toHaveBeenCalledTimes(0);
        ref.current.dispatchEvent(
          createEvent('pointerup', {
            pageX: 55,
            pageY: 55,
          }),
        );
        expect(onPressStart).toHaveBeenCalledTimes(1);
        jest.runAllTimers();
        expect(onPressStart).toHaveBeenCalledTimes(1);
      });

      it('onPressStart is called synchronously if delay is 0ms', () => {
        const element = (
          <Press delayPressStart={0} onPressStart={onPressStart}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        expect(onPressStart).toHaveBeenCalledTimes(1);
      });
    });

    describe('delayPressEnd', () => {
      it('onPressStart called each time a press is initiated', () => {
        // This test makes sure that onPressStart is called each time a press
        // starts, even if a delayPressEnd is delaying the deactivation of the
        // previous press.
        const element = (
          <Press delayPressEnd={2000} onPressStart={onPressStart}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(createEvent('pointerup'));
        ref.current.dispatchEvent(createEvent('pointerdown'));
        expect(onPressStart).toHaveBeenCalledTimes(2);
      });
    });
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
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      ref.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressend'}),
      );
    });

    it('ignores browser emulated events', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      ref.current.dispatchEvent(createEvent('touchend'));
      ref.current.dispatchEvent(createEvent('mousedown'));
      ref.current.dispatchEvent(createEvent('mouseup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });

    it('is called after "keyup" event for Enter', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    it('is called after "keyup" event for Spacebar', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: ' '}));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    it('is not called after "keyup" event for other keys', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'a'}));
      expect(onPressEnd).not.toBeCalled();
    });

    it('is called with keyboard modifiers', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(
        createKeyboardEvent('keyup', {
          key: 'Enter',
          metaKey: true,
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
        }),
      );
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
          type: 'pressend',
          metaKey: true,
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
        }),
      );
    });

    // No PointerEvent fallbacks
    it('is called after "mouseup" event', () => {
      ref.current.dispatchEvent(createEvent('mousedown'));
      ref.current.dispatchEvent(createEvent('mouseup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressend'}),
      );
    });
    it('is called after "touchend" event', () => {
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('touchend'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });

    describe('delayPressEnd', () => {
      it('can be configured', () => {
        const element = (
          <Press delayPressEnd={2000} onPressEnd={onPressEnd}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(createEvent('pointerup'));
        jest.advanceTimersByTime(1999);
        expect(onPressEnd).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onPressEnd).toHaveBeenCalledTimes(1);
      });

      it('is reset if "pointerdown" is dispatched during a delay', () => {
        const element = (
          <Press delayPressEnd={500} onPressEnd={onPressEnd}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(createEvent('pointerup'));
        jest.advanceTimersByTime(499);
        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(1);
        expect(onPressEnd).not.toBeCalled();
        ref.current.dispatchEvent(createEvent('pointerup'));
        jest.runAllTimers();
        expect(onPressEnd).toHaveBeenCalledTimes(1);
      });
    });

    it('onPressEnd is called synchronously if delay is 0ms', () => {
      const element = (
        <Press delayPressEnd={0} onPressEnd={onPressEnd}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
    });
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
      ref.current.dispatchEvent(createEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('pointerup'));
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

    it('is called after delayed onPressStart', () => {
      const element = (
        <Press delayPressStart={500} onPressChange={onPressChange}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      jest.advanceTimersByTime(499);
      expect(onPressChange).not.toBeCalled();
      jest.advanceTimersByTime(1);
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
    });

    it('is called after delayPressStart is cut short', () => {
      const element = (
        <Press delayPressStart={500} onPressChange={onPressChange}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = () => ({
        top: 50,
        left: 50,
        bottom: 500,
        right: 500,
      });

      ref.current.dispatchEvent(createEvent('pointerdown'));
      jest.advanceTimersByTime(100);
      ref.current.dispatchEvent(
        createEvent('pointerup', {
          pageX: 55,
          pageY: 55,
        }),
      );
      jest.advanceTimersByTime(10);
      expect(onPressChange).toHaveBeenCalledWith(true);
      expect(onPressChange).toHaveBeenCalledWith(false);
      expect(onPressChange).toHaveBeenCalledTimes(2);
    });

    it('is called after delayed onPressEnd', () => {
      const element = (
        <Press delayPressEnd={500} onPressChange={onPressChange}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('pointerup'));
      jest.advanceTimersByTime(499);
      expect(onPressChange).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1);
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" and "mouseup" events', () => {
      ref.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('mouseup'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });
    it('is called after "touchstart" and "touchend" events', () => {
      ref.current.dispatchEvent(createEvent('touchstart'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('touchend'));
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
      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
    });

    it('is called after "pointerup" event', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      ref.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'press'}),
      );
    });

    it('is called after valid "keyup" event', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'press'}),
      );
    });

    it('is always called immediately after press is released', () => {
      const element = (
        <Press delayPressEnd={500} onPress={onPress}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    // TODO: jsdom missing APIs
    // it('is called after "touchend" event', () => {
    // ref.current.dispatchEvent(createEvent('touchstart'));
    // ref.current.dispatchEvent(createEvent('touchend'));
    // expect(onPress).toHaveBeenCalledTimes(1);
    // });
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
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      expect(onLongPress).not.toBeCalled();
      jest.advanceTimersByTime(1);
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'longpress'}),
      );
    });

    it('is not called if "pointerup" is dispatched before delay', () => {
      ref.current.dispatchEvent(createEvent('pointerdown'));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      ref.current.dispatchEvent(createEvent('pointerup'));
      jest.advanceTimersByTime(1);
      expect(onLongPress).not.toBeCalled();
    });

    it('is called if valid "keydown" lasts default delay', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      expect(onLongPress).not.toBeCalled();
      jest.advanceTimersByTime(1);
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'longpress'}),
      );
    });

    it('is not called if valid "keyup" is dispatched before delay', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY - 1);
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      jest.advanceTimersByTime(1);
      expect(onLongPress).not.toBeCalled();
    });

    it('is not called when a large enough move occurs before delay', () => {
      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pageX: 10, pageY: 10}),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {pageX: 50, pageY: 50}),
      );
      jest.runAllTimers();
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

        ref.current.dispatchEvent(createEvent('pointerdown'));
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

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(9);
        expect(onLongPress).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });

      it('compounds with "delayPressStart"', () => {
        const delayPressStart = 100;
        const element = (
          <Press delayPressStart={delayPressStart} onLongPress={onLongPress}>
            <div ref={ref} />
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(
          delayPressStart + DEFAULT_LONG_PRESS_DELAY - 1,
        );
        expect(onLongPress).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });
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

      ref.current.dispatchEvent(createEvent('pointerdown'));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
      expect(onLongPressChange).toHaveBeenCalledTimes(1);
      expect(onLongPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('pointerup'));
      expect(onLongPressChange).toHaveBeenCalledTimes(2);
      expect(onLongPressChange).toHaveBeenCalledWith(false);
    });

    it('is called after delayed onPressEnd', () => {
      const onLongPressChange = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press delayPressEnd={500} onLongPressChange={onLongPressChange}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
      expect(onLongPressChange).toHaveBeenCalledTimes(1);
      expect(onLongPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('pointerup'));
      jest.advanceTimersByTime(499);
      expect(onLongPressChange).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1);
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
      ref.current.dispatchEvent(createEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
      ref.current.dispatchEvent(createEvent('pointerup'));
      expect(onPress).not.toBeCalled();
      expect(onPressChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('onPressMove', () => {
    it('is called after "pointermove"', () => {
      const onPressMove = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onPressMove={onPressMove}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          pointerType: 'touch',
          pageX: 10,
          pageY: 10,
        }),
      );
      expect(onPressMove).toHaveBeenCalledTimes(1);
      expect(onPressMove).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressmove'}),
      );
    });

    it('is not called if "pointermove" occurs during keyboard press', () => {
      const onPressMove = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onPressMove={onPressMove}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          pointerType: 'mouse',
          pageX: 10,
          pageY: 10,
        }),
      );
      expect(onPressMove).not.toBeCalled();
    });

    it('ignores browser emulated events', () => {
      const onPressMove = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onPressMove={onPressMove}>
          <div ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          pointerType: 'touch',
          pageX: 10,
          pageY: 10,
        }),
      );
      ref.current.dispatchEvent(createEvent('touchmove'));
      ref.current.dispatchEvent(createEvent('mousemove'));
      expect(onPressMove).toHaveBeenCalledTimes(1);
    });
  });

  describe('press with movement (pointer events)', () => {
    const rectMock = {
      width: 100,
      height: 100,
      top: 50,
      left: 50,
      right: 500,
      bottom: 500,
    };
    const pressRectOffset = 20;
    const getBoundingClientRectMock = () => rectMock;
    const coordinatesInside = {
      pageX: rectMock.left - pressRectOffset,
      pageY: rectMock.top - pressRectOffset,
    };
    const coordinatesOutside = {
      pageX: rectMock.left - pressRectOffset - 1,
      pageY: rectMock.top - pressRectOffset - 1,
    };

    describe('within bounds of hit rect', () => {
      /** ┌──────────────────┐
       *  │  ┌────────────┐  │
       *  │  │ VisualRect │  │
       *  │  └────────────┘  │
       *  │     HitRect    X │ <= Move to X and release
       *  └──────────────────┘
       */
      it('no delay and "onPress*" events are called immediately', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointermove', coordinatesInside),
        );
        ref.current.dispatchEvent(createEvent('pointerup', coordinatesInside));
        jest.runAllTimers();

        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      it('delay and "onPressMove" is called before "onPress*" events', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            delayPressStart={500}
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointermove', coordinatesInside),
        );
        jest.advanceTimersByTime(499);
        expect(events).toEqual(['onPressMove']);
        events = [];

        jest.advanceTimersByTime(1);
        expect(events).toEqual(['onPressStart', 'onPressChange']);
        events = [];

        ref.current.dispatchEvent(createEvent('pointerup', coordinatesInside));
        expect(events).toEqual(['onPressEnd', 'onPressChange', 'onPress']);
      });

      it('press retention offset can be configured', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };
        const pressRetentionOffset = {top: 40, bottom: 40, left: 40, right: 40};

        const element = (
          <Press
            pressRetentionOffset={pressRetentionOffset}
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointermove', {
            pageX: rectMock.left - pressRetentionOffset.left,
            pageY: rectMock.top - pressRetentionOffset.top,
          }),
        );
        ref.current.dispatchEvent(createEvent('pointerup', coordinatesInside));
        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      it('responder region accounts for decrease in element dimensions', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        // emulate smaller dimensions change on activation
        ref.current.getBoundingClientRect = () => ({
          width: 80,
          height: 80,
          top: 60,
          left: 60,
          right: 490,
          bottom: 490,
        });
        const coordinates = {
          pageX: rectMock.left,
          pageY: rectMock.top,
        };
        // move to an area within the pre-activation region
        ref.current.dispatchEvent(createEvent('pointermove', coordinates));
        ref.current.dispatchEvent(createEvent('pointerup', coordinates));
        expect(events).toEqual(['onPressStart', 'onPressEnd', 'onPress']);
      });

      it('responder region accounts for increase in element dimensions', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        // emulate larger dimensions change on activation
        ref.current.getBoundingClientRect = () => ({
          width: 200,
          height: 200,
          top: 0,
          left: 0,
          right: 550,
          bottom: 550,
        });
        const coordinates = {
          pageX: rectMock.left - 50,
          pageY: rectMock.top - 50,
        };
        // move to an area within the post-activation region
        ref.current.dispatchEvent(createEvent('pointermove', coordinates));
        ref.current.dispatchEvent(createEvent('pointerup', coordinates));
        expect(events).toEqual(['onPressStart', 'onPressEnd', 'onPress']);
      });
    });

    describe('the page offset changes', () => {
      it('"onPress" is called on release', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        // Emulate the element being offset
        document.body.scrollTop = 1000;
        const updatedCoordinatesInside = {
          pageX: coordinatesInside.pageX,
          pageY: coordinatesInside.pageY + 1000,
        };
        ref.current.dispatchEvent(
          createEvent('pointerdown', updatedCoordinatesInside),
        );
        container.dispatchEvent(
          createEvent('pointermove', updatedCoordinatesInside),
        );
        container.dispatchEvent(
          createEvent('pointerup', updatedCoordinatesInside),
        );
        jest.runAllTimers();
        document.body.scrollTop = 0;

        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });
    });

    describe('beyond bounds of hit rect', () => {
      /** ┌──────────────────┐
       *  │  ┌────────────┐  │
       *  │  │ VisualRect │  │
       *  │  └────────────┘  │
       *  │     HitRect      │
       *  └──────────────────┘
       *                   X   <= Move to X and release
       */

      it('"onPress" is not called on release', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointermove', coordinatesInside),
        );
        container.dispatchEvent(createEvent('pointermove', coordinatesOutside));
        container.dispatchEvent(createEvent('pointerup', coordinatesOutside));
        jest.runAllTimers();

        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
        ]);
      });

      it('"onPress*" events are not called after delay expires', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            delayPressStart={500}
            delayPressEnd={500}
            onLongPress={createEventHandler('onLongPress')}
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointermove', coordinatesInside),
        );
        container.dispatchEvent(createEvent('pointermove', coordinatesOutside));
        jest.runAllTimers();
        expect(events).toEqual(['onPressMove']);
        events = [];
        container.dispatchEvent(createEvent('pointerup', coordinatesOutside));
        jest.runAllTimers();
        expect(events).toEqual([]);
      });
    });

    it('"onPress" is not called on release with mouse', () => {
      let events = [];
      const ref = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Press
          onPress={createEventHandler('onPress')}
          onPressChange={createEventHandler('onPressChange')}
          onPressMove={createEventHandler('onPressMove')}
          onPressStart={createEventHandler('onPressStart')}
          onPressEnd={createEventHandler('onPressEnd')}>
          <div ref={ref} />
        </Press>
      );

      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = getBoundingClientRectMock;
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'mouse',
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesInside,
          pointerType: 'mouse',
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesOutside,
          pointerType: 'mouse',
        }),
      );
      container.dispatchEvent(
        createEvent('pointerup', {
          ...coordinatesOutside,
          pointerType: 'mouse',
        }),
      );
      jest.runAllTimers();

      expect(events).toEqual([
        'onPressStart',
        'onPressChange',
        'onPressMove',
        'onPressEnd',
        'onPressChange',
      ]);
    });

    it('"onPress" is called on re-entry to hit rect for mouse', () => {
      let events = [];
      const ref = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Press
          onPress={createEventHandler('onPress')}
          onPressChange={createEventHandler('onPressChange')}
          onPressMove={createEventHandler('onPressMove')}
          onPressStart={createEventHandler('onPressStart')}
          onPressEnd={createEventHandler('onPressEnd')}>
          <div ref={ref} />
        </Press>
      );

      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = getBoundingClientRectMock;
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'mouse',
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesInside,
          pointerType: 'mouse',
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesOutside,
          pointerType: 'mouse',
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesInside,
          pointerType: 'mouse',
        }),
      );
      container.dispatchEvent(
        createEvent('pointerup', {
          ...coordinatesInside,
          pointerType: 'mouse',
        }),
      );
      jest.runAllTimers();

      expect(events).toEqual([
        'onPressStart',
        'onPressChange',
        'onPressMove',
        'onPressEnd',
        'onPressChange',
        'onPressStart',
        'onPressChange',
        'onPressEnd',
        'onPressChange',
        'onPress',
      ]);
    });

    it('"onPress" is called on re-entry to hit rect for touch', () => {
      let events = [];
      const ref = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Press
          onPress={createEventHandler('onPress')}
          onPressChange={createEventHandler('onPressChange')}
          onPressMove={createEventHandler('onPressMove')}
          onPressStart={createEventHandler('onPressStart')}
          onPressEnd={createEventHandler('onPressEnd')}>
          <div ref={ref} />
        </Press>
      );

      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = getBoundingClientRectMock;
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesOutside,
          pointerType: 'touch',
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      container.dispatchEvent(
        createEvent('pointerup', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      jest.runAllTimers();

      expect(events).toEqual([
        'onPressStart',
        'onPressChange',
        'onPressMove',
        'onPressEnd',
        'onPressChange',
        'onPressStart',
        'onPressChange',
        'onPressEnd',
        'onPressChange',
        'onPress',
      ]);
    });
  });

  describe('press with movement (touch events fallback)', () => {
    const rectMock = {
      width: 100,
      height: 100,
      top: 50,
      left: 50,
      right: 500,
      bottom: 500,
    };
    const pressRectOffset = 20;
    const getBoundingClientRectMock = () => rectMock;
    const coordinatesInside = {
      changedTouches: [
        {
          pageX: rectMock.left - pressRectOffset,
          pageY: rectMock.top - pressRectOffset,
        },
      ],
    };
    const coordinatesOutside = {
      changedTouches: [
        {
          pageX: rectMock.left - pressRectOffset - 1,
          pageY: rectMock.top - pressRectOffset - 1,
        },
      ],
    };

    describe('within bounds of hit rect', () => {
      /** ┌──────────────────┐
       *  │  ┌────────────┐  │
       *  │  │ VisualRect │  │
       *  │  └────────────┘  │
       *  │     HitRect    X │ <= Move to X and release
       *  └──────────────────┘
       */
      it('no delay and "onPress*" events are called immediately', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('touchstart'));
        ref.current.dispatchEvent(createEvent('touchmove', coordinatesInside));
        ref.current.dispatchEvent(createEvent('touchend', coordinatesInside));
        jest.runAllTimers();

        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      it('delay and "onPressMove" is called before "onPress*" events', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            delayPressStart={500}
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('touchstart'));
        ref.current.dispatchEvent(createEvent('touchmove', coordinatesInside));
        jest.advanceTimersByTime(499);
        expect(events).toEqual(['onPressMove']);
        events = [];

        jest.advanceTimersByTime(1);
        expect(events).toEqual(['onPressStart', 'onPressChange']);
        events = [];

        ref.current.dispatchEvent(createEvent('touchend', coordinatesInside));
        expect(events).toEqual(['onPressEnd', 'onPressChange', 'onPress']);
      });

      it('press retention offset can be configured', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };
        const pressRetentionOffset = {top: 40, bottom: 40, left: 40, right: 40};

        const element = (
          <Press
            pressRetentionOffset={pressRetentionOffset}
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('touchstart'));
        ref.current.dispatchEvent(
          createEvent('touchmove', {
            pageX: rectMock.left - pressRetentionOffset.left,
            pageY: rectMock.top - pressRetentionOffset.top,
          }),
        );
        ref.current.dispatchEvent(createEvent('touchend', coordinatesInside));
        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
          'onPress',
        ]);
      });

      it('responder region accounts for decrease in element dimensions', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('touchstart'));
        // emulate smaller dimensions change on activation
        ref.current.getBoundingClientRect = () => ({
          width: 80,
          height: 80,
          top: 60,
          left: 60,
          right: 490,
          bottom: 490,
        });
        const coordinates = {
          pageX: rectMock.left,
          pageY: rectMock.top,
        };
        // move to an area within the pre-activation region
        ref.current.dispatchEvent(createEvent('touchmove', coordinates));
        ref.current.dispatchEvent(createEvent('touchend', coordinates));
        expect(events).toEqual(['onPressStart', 'onPressEnd', 'onPress']);
      });

      it('responder region accounts for increase in element dimensions', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('touchstart'));
        // emulate larger dimensions change on activation
        ref.current.getBoundingClientRect = () => ({
          width: 200,
          height: 200,
          top: 0,
          left: 0,
          right: 550,
          bottom: 550,
        });
        const coordinates = {
          pageX: rectMock.left - 50,
          pageY: rectMock.top - 50,
        };
        // move to an area within the post-activation region
        ref.current.dispatchEvent(createEvent('touchmove', coordinates));
        ref.current.dispatchEvent(createEvent('touchend', coordinates));
        expect(events).toEqual(['onPressStart', 'onPressEnd', 'onPress']);
      });
    });

    describe('beyond bounds of hit rect', () => {
      /** ┌──────────────────┐
       *  │  ┌────────────┐  │
       *  │  │ VisualRect │  │
       *  │  └────────────┘  │
       *  │     HitRect      │
       *  └──────────────────┘
       *                   X   <= Move to X and release
       */

      it('"onPress" is not called on release', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('touchstart'));
        ref.current.dispatchEvent(createEvent('touchmove', coordinatesInside));
        container.dispatchEvent(createEvent('touchmove', coordinatesOutside));
        container.dispatchEvent(createEvent('touchend', coordinatesOutside));
        jest.runAllTimers();

        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressMove',
          'onPressEnd',
          'onPressChange',
        ]);
      });

      it('"onPress*" events are not called after delay expires', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const element = (
          <Press
            delayPressStart={500}
            delayPressEnd={500}
            onLongPress={createEventHandler('onLongPress')}
            onPress={createEventHandler('onPress')}
            onPressChange={createEventHandler('onPressChange')}
            onPressMove={createEventHandler('onPressMove')}
            onPressStart={createEventHandler('onPressStart')}
            onPressEnd={createEventHandler('onPressEnd')}>
            <div ref={ref} />
          </Press>
        );

        ReactDOM.render(element, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('touchstart'));
        ref.current.dispatchEvent(createEvent('touchmove', coordinatesInside));
        container.dispatchEvent(createEvent('touchmove', coordinatesOutside));
        jest.runAllTimers();
        expect(events).toEqual(['onPressMove']);
        events = [];
        container.dispatchEvent(createEvent('touchend', coordinatesOutside));
        jest.runAllTimers();
        expect(events).toEqual([]);
      });
    });

    it('"onPress" is called on re-entry to hit rect for touch', () => {
      let events = [];
      const ref = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Press
          onPress={createEventHandler('onPress')}
          onPressChange={createEventHandler('onPressChange')}
          onPressMove={createEventHandler('onPressMove')}
          onPressStart={createEventHandler('onPressStart')}
          onPressEnd={createEventHandler('onPressEnd')}>
          <div ref={ref} />
        </Press>
      );

      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = getBoundingClientRectMock;
      ref.current.dispatchEvent(
        createEvent('touchstart', {
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(
        createEvent('touchmove', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      container.dispatchEvent(
        createEvent('touchmove', {
          ...coordinatesOutside,
          pointerType: 'touch',
        }),
      );
      container.dispatchEvent(
        createEvent('touchmove', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      container.dispatchEvent(
        createEvent('touchend', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      jest.runAllTimers();

      expect(events).toEqual([
        'onPressStart',
        'onPressChange',
        'onPressMove',
        'onPressEnd',
        'onPressChange',
        'onPressStart',
        'onPressChange',
        'onPressEnd',
        'onPressChange',
        'onPress',
      ]);
    });
  });

  describe('delayed and multiple events', () => {
    it('dispatches in the correct order', () => {
      let events;
      const ref = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Press
          delayPressStart={250}
          delayPressEnd={250}
          onLongPress={createEventHandler('onLongPress')}
          onLongPressChange={createEventHandler('onLongPressChange')}
          onPress={createEventHandler('onPress')}
          onPressChange={createEventHandler('onPressChange')}
          onPressStart={createEventHandler('onPressStart')}
          onPressEnd={createEventHandler('onPressEnd')}>
          <div ref={ref} />
        </Press>
      );

      ReactDOM.render(element, container);
      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      });

      // 1
      events = [];
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      jest.runAllTimers();

      expect(events).toEqual([
        'onPressStart',
        'onPressChange',
        'onPress',
        'onPressStart',
        'onPress',
        'onPressEnd',
        'onPressChange',
      ]);

      // 2
      events = [];
      ref.current.dispatchEvent(createEvent('pointerdown'));
      jest.advanceTimersByTime(250);
      jest.advanceTimersByTime(500);
      ref.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      jest.runAllTimers();

      expect(events).toEqual([
        'onPressStart',
        'onPressChange',
        'onLongPress',
        'onLongPressChange',
        'onPress',
        'onPressEnd',
        'onPressChange',
        'onLongPressChange',
      ]);
    });
  });

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
            onPressEnd={createEventHandler('inner: onPressEnd')}
            stopPropagation={false}>
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
      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      });

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(events).toEqual([
        'inner: onPressStart',
        'inner: onPressChange',
        'pointerdown',
        'inner: onPressEnd',
        'inner: onPressChange',
        'inner: onPress',
        'pointerup',
      ]);
    });

    describe('correctly get propagation stopped and do not bubble', () => {
      it('for onPress', () => {
        const ref = React.createRef();
        const fn = jest.fn();
        const element = (
          <Press onPress={fn}>
            <Press onPress={fn}>
              <div ref={ref} />
            </Press>
          </Press>
        );
        ReactDOM.render(element, container);
        ref.current.getBoundingClientRect = () => ({
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        });

        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointerup', {pageX: 10, pageY: 10}),
        );
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('for onLongPress', () => {
        const ref = React.createRef();
        const fn = jest.fn();
        const element = (
          <Press onLongPress={fn}>
            <Press onLongPress={fn}>
              <div ref={ref} />
            </Press>
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
        ref.current.dispatchEvent(createEvent('pointerup'));
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('for onPressStart/onPressEnd', () => {
        const ref = React.createRef();
        const fn = jest.fn();
        const fn2 = jest.fn();
        const element = (
          <Press onPressStart={fn} onPressEnd={fn2}>
            <Press onPressStart={fn} onPressEnd={fn2}>
              <div ref={ref} />
            </Press>
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(0);
        ref.current.dispatchEvent(createEvent('pointerup'));
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
      });

      it('for onPressChange', () => {
        const ref = React.createRef();
        const fn = jest.fn();
        const element = (
          <Press onPressChange={fn}>
            <Press onPressChange={fn}>
              <div ref={ref} />
            </Press>
          </Press>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        expect(fn).toHaveBeenCalledTimes(1);
        ref.current.dispatchEvent(createEvent('pointerup'));
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('link components', () => {
    it('prevents native behaviour by default', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onPress={onPress}>
          <a href="#" ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      expect(preventDefault).toBeCalled();
    });

    it('prevents native behaviour by default with nested elements', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onPress={onPress}>
          <a href="#">
            <div ref={ref} />
          </a>
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      expect(preventDefault).toBeCalled();
    });

    it('uses native behaviour for interactions with modifier keys', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onPress={onPress}>
          <a href="#" ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ['metaKey', 'ctrlKey', 'shiftKey'].forEach(modifierKey => {
        ref.current.dispatchEvent(
          createEvent('pointerdown', {[modifierKey]: true}),
        );
        ref.current.dispatchEvent(
          createEvent('pointerup', {[modifierKey]: true}),
        );
        ref.current.dispatchEvent(
          createEvent('click', {[modifierKey]: true, preventDefault}),
        );
        expect(preventDefault).not.toBeCalled();
      });
    });

    it('uses native behaviour if preventDefault is false', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onPress={onPress} preventDefault={false}>
          <a href="#" ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      expect(preventDefault).not.toBeCalled();
    });
  });

  describe('responder cancellation', () => {
    it('ends on "pointercancel", "touchcancel", "scroll", and "dragstart"', () => {
      const onLongPress = jest.fn();
      const onPressEnd = jest.fn();
      const ref = React.createRef();
      const element = (
        <Press onLongPress={onLongPress} onPressEnd={onPressEnd}>
          <a href="#" ref={ref} />
        </Press>
      );
      ReactDOM.render(element, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('scroll'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      jest.runAllTimers();
      expect(onLongPress).not.toBeCalled();

      onLongPress.mockReset();
      onPressEnd.mockReset();

      // When pointer events are supported
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointercancel'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      jest.runAllTimers();
      expect(onLongPress).not.toBeCalled();

      onLongPress.mockReset();
      onPressEnd.mockReset();

      // Touch fallback
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('touchcancel'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      jest.runAllTimers();
      expect(onLongPress).not.toBeCalled();

      onLongPress.mockReset();
      onPressEnd.mockReset();

      // Mouse fallback
      ref.current.dispatchEvent(createEvent('mousedown'));
      ref.current.dispatchEvent(createEvent('dragstart'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      jest.runAllTimers();
      expect(onLongPress).not.toBeCalled();
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(Press.displayName).toBe('Press');
  });

  it('should not trigger an invariant in addRootEventTypes()', () => {
    const ref = React.createRef();
    const element = (
      <Press>
        <button ref={ref} />
      </Press>
    );
    ReactDOM.render(element, container);

    ref.current.dispatchEvent(createEvent('pointerdown'));
    jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
    ref.current.dispatchEvent(createEvent('pointermove'));
    ref.current.dispatchEvent(createEvent('pointerup'));
    ref.current.dispatchEvent(createEvent('pointerdown'));
  });

  it('should correctly pass through event properties', () => {
    const timeStamps = [];
    const ref = React.createRef();
    const eventLog = [];
    const logEvent = event => {
      const propertiesWeCareAbout = {
        pageX: event.pageX,
        pageY: event.pageY,
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerType: event.pointerType,
        target: event.target,
        timeStamp: event.timeStamp,
        type: event.type,
      };
      timeStamps.push(event.timeStamp);
      eventLog.push(propertiesWeCareAbout);
    };
    const element = (
      <Press
        onPressStart={logEvent}
        onPressEnd={logEvent}
        onPressMove={logEvent}
        onLongPress={logEvent}
        onPress={logEvent}>
        <button ref={ref} />
      </Press>
    );
    ReactDOM.render(element, container);

    ref.current.dispatchEvent(
      createEvent('pointerdown', {
        pointerType: 'mouse',
        pageX: 15,
        pageY: 16,
        screenX: 20,
        screenY: 21,
        clientX: 30,
        clientY: 31,
      }),
    );
    jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
    ref.current.dispatchEvent(
      createEvent('pointermove', {
        pointerType: 'mouse',
        pageX: 16,
        pageY: 17,
        screenX: 21,
        screenY: 22,
        clientX: 31,
        clientY: 32,
      }),
    );
    ref.current.dispatchEvent(
      createEvent('pointerup', {
        pointerType: 'mouse',
        pageX: 17,
        pageY: 18,
        screenX: 22,
        screenY: 23,
        clientX: 32,
        clientY: 33,
      }),
    );
    ref.current.dispatchEvent(
      createEvent('pointerdown', {
        pointerType: 'mouse',
        pageX: 18,
        pageY: 19,
        screenX: 23,
        screenY: 24,
        clientX: 33,
        clientY: 34,
      }),
    );
    expect(typeof timeStamps[0] === 'number').toBe(true);
    expect(eventLog).toEqual([
      {
        pointerType: 'mouse',
        pageX: 15,
        pageY: 16,
        screenX: 20,
        screenY: 21,
        clientX: 30,
        clientY: 31,
        target: ref.current,
        timeStamp: timeStamps[0],
        type: 'pressstart',
      },
      {
        pointerType: 'mouse',
        pageX: 15,
        pageY: 16,
        screenX: 20,
        screenY: 21,
        clientX: 30,
        clientY: 31,
        target: ref.current,
        timeStamp: timeStamps[0] + DEFAULT_LONG_PRESS_DELAY,
        type: 'longpress',
      },
      {
        pointerType: 'mouse',
        pageX: 16,
        pageY: 17,
        screenX: 21,
        screenY: 22,
        clientX: 31,
        clientY: 32,
        target: ref.current,
        timeStamp: timeStamps[2],
        type: 'pressmove',
      },
      {
        pointerType: 'mouse',
        pageX: 17,
        pageY: 18,
        screenX: 22,
        screenY: 23,
        clientX: 32,
        clientY: 33,
        target: ref.current,
        timeStamp: timeStamps[3],
        type: 'pressend',
      },
      {
        pointerType: 'mouse',
        pageX: 17,
        pageY: 18,
        screenX: 22,
        screenY: 23,
        clientX: 32,
        clientY: 33,
        target: ref.current,
        timeStamp: timeStamps[3],
        type: 'press',
      },
      {
        pointerType: 'mouse',
        pageX: 18,
        pageY: 19,
        screenX: 23,
        screenY: 24,
        clientX: 33,
        clientY: 34,
        target: ref.current,
        timeStamp: timeStamps[5],
        type: 'pressstart',
      },
    ]);
  });

  function dispatchEventWithTimeStamp(elem, name, timeStamp) {
    const event = createEvent(name);
    Object.defineProperty(event, 'timeStamp', {
      value: timeStamp,
    });
    elem.dispatchEvent(event);
  }

  it('should properly only flush sync once when the event systems are mixed', () => {
    const ref = React.createRef();
    let renderCounts = 0;

    function MyComponent() {
      const [, updateCounter] = React.useState(0);
      renderCounts++;

      function handlePress() {
        updateCounter(count => count + 1);
      }

      return (
        <div>
          <Press onPress={handlePress}>
            <button
              ref={ref}
              onClick={() => {
                updateCounter(count => count + 1);
              }}>
              Press me
            </button>
          </Press>
        </div>
      );
    }

    const newContainer = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(newContainer);
    document.body.appendChild(newContainer);
    root.render(<MyComponent />);
    Scheduler.flushAll();

    dispatchEventWithTimeStamp(ref.current, 'pointerdown', 100);
    dispatchEventWithTimeStamp(ref.current, 'pointerup', 100);
    dispatchEventWithTimeStamp(ref.current, 'click', 100);

    if (__DEV__) {
      expect(renderCounts).toBe(2);
    } else {
      expect(renderCounts).toBe(1);
    }
    Scheduler.flushAll();
    if (__DEV__) {
      expect(renderCounts).toBe(4);
    } else {
      expect(renderCounts).toBe(2);
    }

    dispatchEventWithTimeStamp(ref.current, 'pointerdown', 100);
    dispatchEventWithTimeStamp(ref.current, 'pointerup', 100);
    // Ensure the timeStamp logic works
    dispatchEventWithTimeStamp(ref.current, 'click', 101);

    if (__DEV__) {
      expect(renderCounts).toBe(6);
    } else {
      expect(renderCounts).toBe(3);
    }

    Scheduler.flushAll();
    document.body.removeChild(newContainer);
  });

  it('should properly flush sync when the event systems are mixed with unstable_flushDiscreteUpdates', () => {
    const ref = React.createRef();
    let renderCounts = 0;

    function MyComponent() {
      const [, updateCounter] = React.useState(0);
      renderCounts++;

      function handlePress() {
        updateCounter(count => count + 1);
      }

      return (
        <div>
          <Press onPress={handlePress}>
            <button
              ref={ref}
              onClick={() => {
                // This should flush synchronously
                ReactDOM.unstable_flushDiscreteUpdates();
                updateCounter(count => count + 1);
              }}>
              Press me
            </button>
          </Press>
        </div>
      );
    }

    const newContainer = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(newContainer);
    document.body.appendChild(newContainer);
    root.render(<MyComponent />);
    Scheduler.flushAll();

    dispatchEventWithTimeStamp(ref.current, 'pointerdown', 100);
    dispatchEventWithTimeStamp(ref.current, 'pointerup', 100);
    dispatchEventWithTimeStamp(ref.current, 'click', 100);

    if (__DEV__) {
      expect(renderCounts).toBe(4);
    } else {
      expect(renderCounts).toBe(2);
    }
    Scheduler.flushAll();
    if (__DEV__) {
      expect(renderCounts).toBe(6);
    } else {
      expect(renderCounts).toBe(3);
    }

    dispatchEventWithTimeStamp(ref.current, 'pointerdown', 100);
    dispatchEventWithTimeStamp(ref.current, 'pointerup', 100);
    // Ensure the timeStamp logic works
    dispatchEventWithTimeStamp(ref.current, 'click', 101);

    if (__DEV__) {
      expect(renderCounts).toBe(8);
    } else {
      expect(renderCounts).toBe(4);
    }

    Scheduler.flushAll();
    document.body.removeChild(newContainer);
  });
});
