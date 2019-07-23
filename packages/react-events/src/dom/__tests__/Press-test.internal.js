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
let PressResponder;
let usePressListener;
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

function createTouchEvent(type, id, data) {
  return createEvent(type, {
    changedTouches: [
      {
        ...data,
        identifier: id,
      },
    ],
    targetTouches: [
      {
        ...data,
        identifier: id,
      },
    ],
  });
}

const createKeyboardEvent = (type, data) => {
  return createEvent(type, data);
};

function init() {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  PressResponder = require('react-events/press').PressResponder;
  usePressListener = require('react-events/press').usePressListener;
  Scheduler = require('scheduler');
}

describe('Event responder: Press', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    init();
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
      const Component = () => {
        usePressListener({
          onPressStart,
          onPress,
          onPressEnd,
        });
        return (
          <div ref={ref} responders={<PressResponder disabled={true} />} />
        );
      };
      ReactDOM.render(<Component />, container);
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
      const Component = () => {
        usePressListener({
          onPressStart,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "pointerdown" event', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressstart'}),
      );
    });

    it('is called after auxillary-button "pointerdown" event', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {button: 1, pointerType: 'mouse'}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({
          button: 'auxillary',
          pointerType: 'mouse',
          type: 'pressstart',
        }),
      );
    });

    it('is not called after "pointermove" following auxillary-button press', () => {
      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          button: 1,
          pointerType: 'mouse',
          clientX: 50,
          clientY: 50,
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointerup', {
          button: 1,
          pointerType: 'mouse',
          clientX: 50,
          clientY: 50,
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          button: 1,
          pointerType: 'mouse',
          clientX: 110,
          clientY: 110,
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          button: 1,
          pointerType: 'mouse',
          clientX: 50,
          clientY: 50,
        }),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('ignores browser emulated events', () => {
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('touchstart'));
      ref.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('ignores any events not caused by primary/auxillary-click or touch/pen contact', () => {
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
      const preventDefault = jest.fn();
      ref.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' ', preventDefault}),
      );
      expect(preventDefault).toBeCalled();
      ref.current.dispatchEvent(createKeyboardEvent('keypress', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: ' '}));
      ref.current.dispatchEvent(createKeyboardEvent('keypress', {key: ' '}));
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'keyboard',
          type: 'pressstart',
        }),
      );
    });

    it('is not called after "keydown" for other keys', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'a'}));
      expect(onPressStart).not.toBeCalled();
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" event', () => {
      ref.current.dispatchEvent(
        createEvent('mousedown', {
          button: 0,
        }),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressstart'}),
      );
    });

    it('is called after "touchstart" event', () => {
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressstart'}),
      );
    });

    describe('delayPressStart', () => {
      it('can be configured', () => {
        const Component = () => {
          usePressListener({
            onPressStart,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressStart={2000} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(1999);
        expect(onPressStart).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onPressStart).toHaveBeenCalledTimes(1);
      });

      it('is cut short if the press is released during a delay', () => {
        const Component = () => {
          usePressListener({
            onPressStart,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressStart={2000} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

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
            clientX: 55,
            clientY: 55,
          }),
        );
        expect(onPressStart).toHaveBeenCalledTimes(1);
        jest.runAllTimers();
        expect(onPressStart).toHaveBeenCalledTimes(1);
      });

      it('onPressStart is called synchronously if delay is 0ms', () => {
        const Component = () => {
          usePressListener({
            onPressStart,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressStart={0} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        expect(onPressStart).toHaveBeenCalledTimes(1);
      });

      it('onPressStart should not be called if pointerCancel is fired before delayPressStart is finished', () => {
        const Component = () => {
          usePressListener({
            onPressStart,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressStart={500} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(499);
        expect(onPressStart).toHaveBeenCalledTimes(0);
        ref.current.dispatchEvent(createEvent('pointercancel'));
        jest.runAllTimers();
        expect(onPressStart).toHaveBeenCalledTimes(0);
      });
    });

    describe('delayPressEnd', () => {
      it('onPressStart called each time a press is initiated', () => {
        // This test makes sure that onPressStart is called each time a press
        // starts, even if a delayPressEnd is delaying the deactivation of the
        // previous press.
        const Component = () => {
          usePressListener({
            onPressStart,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressEnd={2000} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

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
      const Component = () => {
        usePressListener({
          onPressEnd,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "pointerup" event', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchend', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(createEvent('pointerup', {pointerType: 'pen'}));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressend'}),
      );
    });

    it('is called after auxillary-button "pointerup" event', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {button: 1, pointerType: 'mouse'}),
      );
      ref.current.dispatchEvent(
        createEvent('pointerup', {button: 1, pointerType: 'mouse'}),
      );
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          button: 'auxillary',
          pointerType: 'mouse',
          type: 'pressend',
        }),
      );
    });

    it('ignores browser emulated events', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointerup', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchend', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(createEvent('mousedown'));
      ref.current.dispatchEvent(createEvent('mouseup'));
      ref.current.dispatchEvent(createEvent('click'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });

    it('is called after "keyup" event for Enter', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      // click occurs before keyup
      ref.current.dispatchEvent(createKeyboardEvent('click'));
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
      ref.current.dispatchEvent(
        createEvent('mousedown', {
          button: 0,
        }),
      );
      ref.current.dispatchEvent(
        createEvent('mouseup', {
          button: 0,
        }),
      );
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressend'}),
      );
    });
    it('is called after "touchend" event', () => {
      document.elementFromPoint = () => ref.current;
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchend', 0, {
          target: ref.current,
        }),
      );
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });

    describe('delayPressEnd', () => {
      it('can be configured', () => {
        const Component = () => {
          usePressListener({
            onPressEnd,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressEnd={2000} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(createEvent('pointerup'));
        jest.advanceTimersByTime(1999);
        expect(onPressEnd).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onPressEnd).toHaveBeenCalledTimes(1);
      });

      it('is reset if "pointerdown" is dispatched during a delay', () => {
        const Component = () => {
          usePressListener({
            onPressEnd,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressEnd={500} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

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
      const Component = () => {
        usePressListener({
          onPressEnd,
        });
        return (
          <div ref={ref} responders={<PressResponder delayPressEnd={0} />} />
        );
      };
      ReactDOM.render(<Component />, container);

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
      const Component = () => {
        usePressListener({
          onPressChange,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);
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
      const Component = () => {
        usePressListener({
          onPressChange,
        });
        return (
          <div
            ref={ref}
            responders={<PressResponder delayPressStart={500} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      jest.advanceTimersByTime(499);
      expect(onPressChange).not.toBeCalled();
      jest.advanceTimersByTime(1);
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
    });

    it('is called after delayPressStart is cut short', () => {
      const Component = () => {
        usePressListener({
          onPressChange,
        });
        return (
          <div
            ref={ref}
            responders={<PressResponder delayPressStart={500} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);

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
          clientX: 55,
          clientY: 55,
        }),
      );
      jest.advanceTimersByTime(10);
      expect(onPressChange).toHaveBeenCalledWith(true);
      expect(onPressChange).toHaveBeenCalledWith(false);
      expect(onPressChange).toHaveBeenCalledTimes(2);
    });

    it('is called after delayed onPressEnd', () => {
      const Component = () => {
        usePressListener({
          onPressChange,
        });
        return (
          <div ref={ref} responders={<PressResponder delayPressEnd={500} />} />
        );
      };
      ReactDOM.render(<Component />, container);

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
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(
        createTouchEvent('touchend', 0, {
          target: ref.current,
        }),
      );
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onPress', () => {
    let onPress, ref;

    beforeEach(() => {
      onPress = jest.fn();
      ref = React.createRef();
      const Component = () => {
        usePressListener({
          onPress,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);
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
        createTouchEvent('touchstart', 0, {
          target: ref.current,
          clientX: 0,
          clientY: 0,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchend', 0, {
          target: ref.current,
          clientX: 0,
          clientY: 0,
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointerup', {
          pointerType: 'pen',
          clientX: 0,
          clientY: 0,
        }),
      );
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'press'}),
      );
    });

    it('is not called after auxillary-button press', () => {
      const Component = () => {
        usePressListener({
          onPress,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('pointerdown', {button: 1}));
      ref.current.dispatchEvent(
        createEvent('pointerup', {button: 1, clientX: 10, clientY: 10}),
      );
      expect(onPress).not.toHaveBeenCalled();
    });

    it('is called after valid "keyup" event', () => {
      ref.current.dispatchEvent(createKeyboardEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createKeyboardEvent('keyup', {key: 'Enter'}));
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'press'}),
      );
    });

    it('is not called after invalid "keyup" event', () => {
      const inputRef = React.createRef();
      const Component = () => {
        usePressListener({
          onPress,
        });
        return <input ref={inputRef} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);
      inputRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      inputRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      inputRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' '}),
      );
      inputRef.current.dispatchEvent(createKeyboardEvent('keyup', {key: ' '}));
      expect(onPress).not.toBeCalled();
    });

    it('is always called immediately after press is released', () => {
      const Component = () => {
        usePressListener({
          onPress,
        });
        return (
          <div ref={ref} responders={<PressResponder delayPressEnd={500} />} />
        );
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {clientX: 10, clientY: 10}),
      );
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('is called with modifier keys', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {metaKey: true, pointerType: 'mouse'}),
      );
      ref.current.dispatchEvent(
        createEvent('pointerup', {metaKey: true, pointerType: 'mouse'}),
      );
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({
          pointerType: 'mouse',
          type: 'press',
          metaKey: true,
        }),
      );
    });

    it('is called if target rect is not right but the target is (for mouse events)', () => {
      const buttonRef = React.createRef();
      const divRef = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return (
          <div ref={divRef} responders={<PressResponder />}>
            <button ref={buttonRef} />
          </div>
        );
      };
      ReactDOM.render(<Component />, container);

      divRef.current.getBoundingClientRect = () => ({
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
      });
      buttonRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'mouse'}),
      );
      buttonRef.current.dispatchEvent(
        createEvent('pointerup', {pointerType: 'mouse'}),
      );
      expect(onPress).toBeCalled();
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
      const Component = () => {
        usePressListener({
          onLongPress,
        });
        return (
          <div
            ref={ref}
            responders={<PressResponder enableLongPress={true} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called if "pointerdown" lasts default delay', () => {
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
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
        createEvent('pointerdown', {clientX: 10, clientY: 10}),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {clientX: 50, clientY: 50}),
      );
      jest.runAllTimers();
      expect(onLongPress).not.toBeCalled();
    });

    describe('delayLongPress', () => {
      it('can be configured', () => {
        const Component = () => {
          usePressListener({
            onLongPress,
          });
          return (
            <div
              ref={ref}
              responders={
                <PressResponder delayLongPress={2000} enableLongPress={true} />
              }
            />
          );
        };
        ReactDOM.render(<Component />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(1999);
        expect(onLongPress).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });

      it('uses 10ms minimum delay length', () => {
        const Component = () => {
          usePressListener({
            onLongPress,
          });
          return (
            <div
              ref={ref}
              responders={
                <PressResponder delayLongPress={0} enableLongPress={true} />
              }
            />
          );
        };
        ReactDOM.render(<Component />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(9);
        expect(onLongPress).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });

      it('compounds with "delayPressStart"', () => {
        const delayPressStart = 100;
        const Component = () => {
          usePressListener({
            onLongPress,
          });
          return (
            <div
              ref={ref}
              responders={
                <PressResponder
                  delayPressStart={delayPressStart}
                  enableLongPress={true}
                />
              }
            />
          );
        };
        ReactDOM.render(<Component />, container);

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
      const Component = () => {
        usePressListener({
          onLongPressChange,
        });
        return (
          <div
            ref={ref}
            responders={<PressResponder enableLongPress={true} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);

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
      const Component = () => {
        usePressListener({
          onLongPressChange,
        });
        return (
          <div
            ref={ref}
            responders={
              <PressResponder delayPressEnd={500} enableLongPress={true} />
            }
          />
        );
      };
      ReactDOM.render(<Component />, container);

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

  describe('longPressShouldCancelPress', () => {
    it('if true it cancels "onPress"', () => {
      const onPress = jest.fn();
      const onPressChange = jest.fn();
      const ref = React.createRef();
      const Component = () => {
        usePressListener({
          onLongPress: () => {},
          onPressChange,
          onPress,
        });
        return (
          <div
            ref={ref}
            responders={
              <PressResponder
                longPressShouldCancelPress={() => true}
                enableLongPress={true}
              />
            }
          />
        );
      };
      ReactDOM.render(<Component />, container);

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
      const Component = () => {
        usePressListener({
          onPressMove,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });
      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'mouse'}),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 10,
          clientY: 10,
        }),
      );
      expect(onPressMove).toHaveBeenCalledTimes(1);
      expect(onPressMove).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressmove'}),
      );
    });

    it('is not called if "pointermove" occurs during keyboard press', () => {
      const onPressMove = jest.fn();
      const ref = React.createRef();
      const Component = () => {
        usePressListener({
          onPressMove,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

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
          clientX: 10,
          clientY: 10,
        }),
      );
      expect(onPressMove).not.toBeCalled();
    });

    it('ignores browser emulated events', () => {
      const onPressMove = jest.fn();
      const ref = React.createRef();
      const Component = () => {
        usePressListener({
          onPressMove,
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

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
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          pointerType: 'touch',
          clientX: 10,
          clientY: 10,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchmove', 0, {
          target: ref.current,
          clientX: 10,
          clientY: 10,
        }),
      );
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
      right: 150,
      bottom: 150,
    };
    const pressRectOffset = 20;
    const getBoundingClientRectMock = () => rectMock;
    const coordinatesInside = {
      clientX: rectMock.left - pressRectOffset,
      clientY: rectMock.top - pressRectOffset,
    };
    const coordinatesOutside = {
      clientX: rectMock.left - pressRectOffset - 1,
      clientY: rectMock.top - pressRectOffset - 1,
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

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

      it('no delay and "onPress*" events are correctly called with target change', () => {
        let events = [];
        const outerRef = React.createRef();
        const innerRef = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return (
            <div ref={outerRef}>
              <div ref={innerRef} responders={<PressResponder />} />
            </div>
          );
        };
        ReactDOM.render(<Component />, container);

        innerRef.current.getBoundingClientRect = getBoundingClientRectMock;
        innerRef.current.dispatchEvent(createEvent('pointerdown'));
        outerRef.current.dispatchEvent(
          createEvent('pointermove', coordinatesOutside),
        );
        innerRef.current.dispatchEvent(
          createEvent('pointermove', coordinatesInside),
        );
        innerRef.current.dispatchEvent(
          createEvent('pointerup', coordinatesInside),
        );
        jest.runAllTimers();

        expect(events).toEqual([
          'onPressStart',
          'onPressChange',
          'onPressEnd',
          'onPressChange',
          'onPressStart',
          'onPressChange',
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressStart={500} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return (
            <div
              ref={ref}
              responders={
                <PressResponder pressRetentionOffset={pressRetentionOffset} />
              }
            />
          );
        };
        ReactDOM.render(<Component />, container);

        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointermove', {
            clientX: rectMock.left - pressRetentionOffset.left,
            clientY: rectMock.top - pressRetentionOffset.top,
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

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
          clientX: rectMock.left,
          clientY: rectMock.top,
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

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
          clientX: rectMock.left - 50,
          clientY: rectMock.top - 50,
        };
        // move to an area within the post-activation region
        ref.current.dispatchEvent(createEvent('pointermove', coordinates));
        ref.current.dispatchEvent(createEvent('pointerup', coordinates));
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

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

        const Component = () => {
          usePressListener({
            onLongPress: createEventHandler('onLongPress'),
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return (
            <div
              ref={ref}
              responders={
                <PressResponder
                  delayPressStart={500}
                  delayPressEnd={500}
                  enableLongPress={true}
                />
              }
            />
          );
        };
        ReactDOM.render(<Component />, container);

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

      const Component = () => {
        usePressListener({
          onPress: createEventHandler('onPress'),
          onPressChange: createEventHandler('onPressChange'),
          onPressMove: createEventHandler('onPressMove'),
          onPressStart: createEventHandler('onPressStart'),
          onPressEnd: createEventHandler('onPressEnd'),
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

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

      const Component = () => {
        usePressListener({
          onPress: createEventHandler('onPress'),
          onPressChange: createEventHandler('onPressChange'),
          onPressMove: createEventHandler('onPressMove'),
          onPressStart: createEventHandler('onPressStart'),
          onPressEnd: createEventHandler('onPressEnd'),
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

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

      const Component = () => {
        usePressListener({
          onPress: createEventHandler('onPress'),
          onPressChange: createEventHandler('onPressChange'),
          onPressMove: createEventHandler('onPressMove'),
          onPressStart: createEventHandler('onPressStart'),
          onPressEnd: createEventHandler('onPressEnd'),
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.getBoundingClientRect = getBoundingClientRectMock;
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchmove', 0, {
          ...coordinatesInside,
          target: ref.current,
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesOutside,
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchmove', 0, {
          ...coordinatesOutside,
          target: ref.current,
        }),
      );
      container.dispatchEvent(
        createEvent('pointermove', {
          ...coordinatesInside,
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchmove', 0, {
          ...coordinatesInside,
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchend', 0, {
          ...coordinatesInside,
          target: ref.current,
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
      right: 150,
      bottom: 150,
    };
    const pressRectOffset = 20;
    const getBoundingClientRectMock = () => rectMock;
    const coordinatesInside = {
      clientX: rectMock.left - pressRectOffset,
      clientY: rectMock.top - pressRectOffset,
    };
    const coordinatesOutside = {
      clientX: rectMock.left - pressRectOffset - 1,
      clientY: rectMock.top - pressRectOffset - 1,
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

        document.elementFromPoint = () => ref.current;
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(
          createTouchEvent('touchstart', 0, {
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinatesInside,
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchend', 0, {
            ...coordinatesInside,
            target: ref.current,
          }),
        );
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder delayPressStart={500} />}
            />
          );
        };
        ReactDOM.render(<Component />, container);

        document.elementFromPoint = () => ref.current;
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(
          createTouchEvent('touchstart', 0, {
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinatesInside,
            target: ref.current,
          }),
        );
        jest.advanceTimersByTime(499);
        expect(events).toEqual(['onPressMove']);
        events = [];

        jest.advanceTimersByTime(1);
        expect(events).toEqual(['onPressStart', 'onPressChange']);
        events = [];

        ref.current.dispatchEvent(
          createTouchEvent('touchend', 0, {
            ...coordinatesInside,
            target: ref.current,
          }),
        );
        expect(events).toEqual(['onPressEnd', 'onPressChange', 'onPress']);
      });

      it('press retention offset can be configured', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };
        const pressRetentionOffset = {top: 40, bottom: 40, left: 40, right: 40};

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return (
            <div
              ref={ref}
              responders={
                <PressResponder pressRetentionOffset={pressRetentionOffset} />
              }
            />
          );
        };
        ReactDOM.render(<Component />, container);

        document.elementFromPoint = () => ref.current;
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(
          createTouchEvent('touchstart', 0, {
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            clientX: rectMock.left - pressRetentionOffset.left,
            clientY: rectMock.top - pressRetentionOffset.top,
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchend', 0, {
            ...coordinatesInside,
            target: ref.current,
          }),
        );
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

        document.elementFromPoint = () => ref.current;
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(
          createTouchEvent('touchstart', 0, {
            target: ref.current,
          }),
        );
        // emulate smaller dimensions change on activation
        ref.current.getBoundingClientRect = () => ({
          width: 80,
          height: 80,
          top: 60,
          left: 60,
          right: 140,
          bottom: 140,
        });
        const coordinates = {
          clientX: rectMock.left,
          clientY: rectMock.top,
        };
        // move to an area within the pre-activation region
        ref.current.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinates,
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchend', 0, {
            ...coordinates,
            target: ref.current,
          }),
        );
        expect(events).toEqual(['onPressStart', 'onPressEnd', 'onPress']);
      });

      it('responder region accounts for increase in element dimensions', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

        document.elementFromPoint = () => ref.current;
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(
          createTouchEvent('touchstart', 0, {
            target: ref.current,
          }),
        );
        // emulate larger dimensions change on activation
        ref.current.getBoundingClientRect = () => ({
          width: 200,
          height: 200,
          top: 0,
          left: 0,
          right: 200,
          bottom: 200,
        });
        const coordinates = {
          clientX: rectMock.left - 50,
          clientY: rectMock.top - 50,
        };
        // move to an area within the post-activation region
        ref.current.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinates,
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchend', 0, {
            ...coordinates,
            target: ref.current,
          }),
        );
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

        const Component = () => {
          usePressListener({
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };
        ReactDOM.render(<Component />, container);

        document.elementFromPoint = () => ref.current;
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(
          createTouchEvent('touchstart', 0, {
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinatesInside,
            target: ref.current,
          }),
        );
        document.elementFromPoint = () => container;
        container.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinatesOutside,
            target: container,
          }),
        );
        container.dispatchEvent(
          createTouchEvent('touchend', 0, {
            ...coordinatesOutside,
            target: container,
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

      it('"onPress*" events are not called after delay expires', () => {
        let events = [];
        const ref = React.createRef();
        const createEventHandler = msg => () => {
          events.push(msg);
        };

        const Component = () => {
          usePressListener({
            onLongPress: createEventHandler('onLongPress'),
            onPress: createEventHandler('onPress'),
            onPressChange: createEventHandler('onPressChange'),
            onPressMove: createEventHandler('onPressMove'),
            onPressStart: createEventHandler('onPressStart'),
            onPressEnd: createEventHandler('onPressEnd'),
          });
          return (
            <div
              ref={ref}
              responders={
                <PressResponder
                  delayPressStart={500}
                  delayPressEnd={500}
                  enableLongPress={true}
                />
              }
            />
          );
        };
        ReactDOM.render(<Component />, container);

        document.elementFromPoint = () => ref.current;
        ref.current.getBoundingClientRect = getBoundingClientRectMock;
        ref.current.dispatchEvent(
          createTouchEvent('touchstart', 0, {
            target: ref.current,
          }),
        );
        ref.current.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinatesInside,
            target: ref.current,
          }),
        );
        document.elementFromPoint = () => container;
        container.dispatchEvent(
          createTouchEvent('touchmove', 0, {
            ...coordinatesOutside,
            target: container,
          }),
        );
        jest.runAllTimers();
        expect(events).toEqual(['onPressMove']);
        events = [];
        container.dispatchEvent(
          createTouchEvent('touchend', 0, {
            ...coordinatesOutside,
            target: container,
          }),
        );
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

      const Component = () => {
        usePressListener({
          onPress: createEventHandler('onPress'),
          onPressChange: createEventHandler('onPressChange'),
          onPressMove: createEventHandler('onPressMove'),
          onPressStart: createEventHandler('onPressStart'),
          onPressEnd: createEventHandler('onPressEnd'),
        });
        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      document.elementFromPoint = () => ref.current;
      ref.current.getBoundingClientRect = getBoundingClientRectMock;
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchmove', 0, {
          ...coordinatesInside,
          target: ref.current,
        }),
      );
      document.elementFromPoint = () => container;
      container.dispatchEvent(
        createTouchEvent('touchmove', 0, {
          ...coordinatesOutside,
          target: container,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchmove', 0, {
          ...coordinatesInside,
          target: ref.current,
        }),
      );
      document.elementFromPoint = () => ref.current;
      ref.current.dispatchEvent(
        createTouchEvent('touchend', 0, {
          ...coordinatesInside,
          target: ref.current,
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

      const Component = () => {
        usePressListener({
          onLongPress: createEventHandler('onLongPress'),
          onLongPressChange: createEventHandler('onLongPressChange'),
          onPress: createEventHandler('onPress'),
          onPressChange: createEventHandler('onPressChange'),
          onPressMove: createEventHandler('onPressMove'),
          onPressStart: createEventHandler('onPressStart'),
          onPressEnd: createEventHandler('onPressEnd'),
        });
        return (
          <div
            ref={ref}
            responders={
              <PressResponder
                delayPressStart={250}
                delayPressEnd={250}
                enableLongPress={true}
              />
            }
          />
        );
      };
      ReactDOM.render(<Component />, container);

      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });

      // 1
      events = [];
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {clientX: 10, clientY: 10}),
      );
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {clientX: 10, clientY: 10}),
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
        createEvent('pointerup', {clientX: 10, clientY: 10}),
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

      const Inner = () => {
        usePressListener({
          onPress: createEventHandler('inner: onPress'),
          onPressChange: createEventHandler('inner: onPressChange'),
          onPressMove: createEventHandler('inner: onPressMove'),
          onPressStart: createEventHandler('inner: onPressStart'),
          onPressEnd: createEventHandler('inner: onPressEnd'),
        });
        return (
          <div
            ref={ref}
            responders={<PressResponder stopPropagation={false} />}
            onPointerDown={createEventHandler('pointerdown')}
            onPointerUp={createEventHandler('pointerup')}
            onKeyDown={createEventHandler('keydown')}
            onKeyUp={createEventHandler('keyup')}
          />
        );
      };

      const Outer = () => {
        usePressListener({
          onPress: createEventHandler('outer: onPress'),
          onPressChange: createEventHandler('outer: onPressChange'),
          onPressMove: createEventHandler('outer: onPressMove'),
          onPressStart: createEventHandler('outer: onPressStart'),
          onPressEnd: createEventHandler('outer: onPressEnd'),
        });
        return (
          <div responders={<PressResponder />}>
            <Inner />
          </div>
        );
      };
      ReactDOM.render(<Outer />, container);

      ref.current.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      });

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {clientX: 10, clientY: 10}),
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

        const Inner = () => {
          usePressListener({
            onPress: fn,
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };

        const Outer = () => {
          usePressListener({
            onPress: fn,
          });
          return (
            <div responders={<PressResponder />}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

        ref.current.getBoundingClientRect = () => ({
          top: 0,
          left: 0,
          bottom: 100,
          right: 100,
        });

        ref.current.dispatchEvent(createEvent('pointerdown'));
        ref.current.dispatchEvent(
          createEvent('pointerup', {clientX: 10, clientY: 10}),
        );
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('for onLongPress', () => {
        const ref = React.createRef();
        const fn = jest.fn();

        const Inner = () => {
          usePressListener({
            onLongPress: fn,
          });
          return (
            <div
              ref={ref}
              responders={<PressResponder enableLongPress={true} />}
            />
          );
        };

        const Outer = () => {
          usePressListener({
            onLongPress: fn,
          });
          return (
            <div responders={<PressResponder enableLongPress={true} />}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DELAY);
        ref.current.dispatchEvent(createEvent('pointerup'));
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('for onPressStart/onPressEnd', () => {
        const ref = React.createRef();
        const fn = jest.fn();
        const fn2 = jest.fn();

        const Inner = () => {
          usePressListener({
            onPressStart: fn,
            onPressEnd: fn2,
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };

        const Outer = () => {
          usePressListener({
            onPressStart: fn,
            onPressEnd: fn2,
          });
          return (
            <div responders={<PressResponder />}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

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

        const Inner = () => {
          usePressListener({
            onPressChange: fn,
          });
          return <div ref={ref} responders={<PressResponder />} />;
        };

        const Outer = () => {
          usePressListener({
            onPressChange: fn,
          });
          return (
            <div responders={<PressResponder />}>
              <Inner />
            </div>
          );
        };
        ReactDOM.render(<Outer />, container);

        ref.current.dispatchEvent(createEvent('pointerdown'));
        expect(fn).toHaveBeenCalledTimes(1);
        ref.current.dispatchEvent(createEvent('pointerup'));
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('link components', () => {
    it('prevents native behaviour for pointer events by default', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return <a href="#" ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {
          clientX: 0,
          clientY: 0,
        }),
      );
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      expect(preventDefault).toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    it('prevents native behaviour for keyboard events by default', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return <a href="#" ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      ref.current.dispatchEvent(createEvent('keyup', {key: 'Enter'}));
      expect(preventDefault).toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    it('deeply prevents native behaviour by default', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const buttonRef = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return (
          <a href="#">
            <button ref={buttonRef} responders={<PressResponder />} />
          </a>
        );
      };
      ReactDOM.render(<Component />, container);

      buttonRef.current.dispatchEvent(createEvent('pointerdown'));
      buttonRef.current.dispatchEvent(
        createEvent('pointerup', {
          clientX: 0,
          clientY: 0,
        }),
      );
      buttonRef.current.dispatchEvent(createEvent('click', {preventDefault}));
      expect(preventDefault).toBeCalled();
    });

    it('prevents native behaviour by default with nested elements', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return (
          <a href="#" responders={<PressResponder />}>
            <div ref={ref} />
          </a>
        );
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {
          clientX: 0,
          clientY: 0,
        }),
      );
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      expect(preventDefault).toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });

    it('uses native behaviour for interactions with modifier keys', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return <a href="#" ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ['metaKey', 'ctrlKey', 'shiftKey'].forEach(modifierKey => {
        ref.current.dispatchEvent(
          createEvent('pointerdown', {[modifierKey]: true}),
        );
        ref.current.dispatchEvent(
          createEvent('pointerup', {
            [modifierKey]: true,
            clientX: 0,
            clientY: 0,
          }),
        );
        ref.current.dispatchEvent(
          createEvent('click', {[modifierKey]: true, preventDefault}),
        );
        expect(preventDefault).not.toBeCalled();
        expect(onPress).toHaveBeenCalledWith(
          expect.objectContaining({defaultPrevented: false}),
        );
      });
    });

    it('uses native behaviour for pointer events if preventDefault is false', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return (
          <a
            href="#"
            ref={ref}
            responders={<PressResponder preventDefault={false} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(
        createEvent('pointerup', {
          clientX: 0,
          clientY: 0,
        }),
      );
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      expect(preventDefault).not.toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: false}),
      );
    });

    it('uses native behaviour for keyboard events if preventDefault is false', () => {
      const onPress = jest.fn();
      const preventDefault = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({
          onPress,
        });
        return (
          <a
            href="#"
            ref={ref}
            responders={<PressResponder preventDefault={false} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(createEvent('keydown', {key: 'Enter'}));
      ref.current.dispatchEvent(createEvent('click', {preventDefault}));
      ref.current.dispatchEvent(createEvent('keyup', {key: 'Enter'}));
      expect(preventDefault).not.toBeCalled();
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: false}),
      );
    });
  });

  describe('responder cancellation', () => {
    it('ends on "pointercancel", "touchcancel", "scroll", and "dragstart"', () => {
      const onLongPress = jest.fn();
      const onPressEnd = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({
          onLongPress,
          onPressEnd,
        });
        return (
          <a
            href="#"
            ref={ref}
            responders={<PressResponder enableLongPress={true} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);

      // Should cancel for non-mouse events
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'touch',
        }),
      );
      ref.current.dispatchEvent(createEvent('scroll'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      jest.runAllTimers();
      expect(onLongPress).not.toBeCalled();

      onPressEnd.mockReset();

      // Should not cancel for mouse events
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'mouse',
        }),
      );
      ref.current.dispatchEvent(createEvent('scroll'));
      expect(onPressEnd).toHaveBeenCalledTimes(0);
      jest.runAllTimers();

      onLongPress.mockReset();

      // When pointer events are supported
      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'mouse',
        }),
      );
      ref.current.dispatchEvent(
        createEvent('pointercancel', {
          pointerType: 'mouse',
        }),
      );
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      jest.runAllTimers();
      expect(onLongPress).not.toBeCalled();

      onLongPress.mockReset();
      onPressEnd.mockReset();

      // Touch fallback
      ref.current.dispatchEvent(
        createTouchEvent('touchstart', 0, {
          target: ref.current,
        }),
      );
      ref.current.dispatchEvent(
        createTouchEvent('touchcancel', 0, {
          target: ref.current,
        }),
      );
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

  it('does end on "scroll" to document', () => {
    const onPressEnd = jest.fn();
    const ref = React.createRef();

    const Component = () => {
      usePressListener({
        onPressEnd,
      });
      return <a href="#" ref={ref} responders={<PressResponder />} />;
    };
    ReactDOM.render(<Component />, container);

    ref.current.dispatchEvent(createEvent('pointerdown'));
    document.dispatchEvent(createEvent('scroll'));
    expect(onPressEnd).toHaveBeenCalledTimes(1);
  });

  it('does end on "scroll" to a parent container', () => {
    const onPressEnd = jest.fn();
    const ref = React.createRef();
    const containerRef = React.createRef();

    const Component = () => {
      usePressListener({
        onPressEnd,
      });
      return (
        <div ref={containerRef}>
          <a ref={ref} responders={<PressResponder />} />
        </div>
      );
    };
    ReactDOM.render(<Component />, container);

    ref.current.dispatchEvent(createEvent('pointerdown'));
    containerRef.current.dispatchEvent(createEvent('scroll'));
    expect(onPressEnd).toHaveBeenCalledTimes(1);
  });

  it('does not end on "scroll" to an element outside', () => {
    const onPressEnd = jest.fn();
    const ref = React.createRef();
    const outsideRef = React.createRef();

    const Component = () => {
      usePressListener({
        onPressEnd,
      });
      return (
        <div>
          <a ref={ref} responders={<PressResponder />} />
          <span ref={outsideRef} />
        </div>
      );
    };
    ReactDOM.render(<Component />, container);

    ref.current.dispatchEvent(createEvent('pointerdown'));
    outsideRef.current.dispatchEvent(createEvent('scroll'));
    expect(onPressEnd).not.toBeCalled();
  });

  it('expect displayName to show up for event component', () => {
    expect(PressResponder.displayName).toBe('Press');
  });

  it('should not trigger an invariant in addRootEventTypes()', () => {
    const ref = React.createRef();

    const Component = () => {
      return <button ref={ref} responders={<PressResponder />} />;
    };
    ReactDOM.render(<Component />, container);

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

    const Component = () => {
      usePressListener({
        onPressStart: logEvent,
        onPressEnd: logEvent,
        onPressMove: logEvent,
        onLongPress: logEvent,
        onPress: logEvent,
      });
      return (
        <button
          ref={ref}
          responders={<PressResponder enableLongPress={true} />}
        />
      );
    };
    ReactDOM.render(<Component />, container);

    ref.current.getBoundingClientRect = () => ({
      top: 10,
      left: 10,
      bottom: 110,
      right: 110,
    });

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
    const event = createEvent(name, {
      clientX: 0,
      clientY: 0,
    });
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

      usePressListener({
        onPress: handlePress,
      });

      return (
        <div>
          <button
            ref={ref}
            responders={<PressResponder />}
            onClick={() => {
              updateCounter(count => count + 1);
            }}>
            Press me
          </button>
        </div>
      );
    }

    const newContainer = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(newContainer);
    document.body.appendChild(newContainer);
    root.render(<MyComponent />);
    Scheduler.unstable_flushAll();

    dispatchEventWithTimeStamp(ref.current, 'pointerdown', 100);
    dispatchEventWithTimeStamp(ref.current, 'pointerup', 100);
    dispatchEventWithTimeStamp(ref.current, 'click', 100);

    if (__DEV__) {
      expect(renderCounts).toBe(2);
    } else {
      expect(renderCounts).toBe(1);
    }
    Scheduler.unstable_flushAll();
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

    Scheduler.unstable_flushAll();
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

      usePressListener({
        onPress: handlePress,
      });

      return (
        <div>
          <button
            ref={ref}
            responders={<PressResponder />}
            onClick={() => {
              // This should flush synchronously
              ReactDOM.unstable_flushDiscreteUpdates();
              updateCounter(count => count + 1);
            }}>
            Press me
          </button>
        </div>
      );
    }

    const newContainer = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(newContainer);
    document.body.appendChild(newContainer);
    root.render(<MyComponent />);
    Scheduler.unstable_flushAll();

    dispatchEventWithTimeStamp(ref.current, 'pointerdown', 100);
    dispatchEventWithTimeStamp(ref.current, 'pointerup', 100);
    dispatchEventWithTimeStamp(ref.current, 'click', 100);

    if (__DEV__) {
      expect(renderCounts).toBe(4);
    } else {
      expect(renderCounts).toBe(2);
    }
    Scheduler.unstable_flushAll();
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

    Scheduler.unstable_flushAll();
    document.body.removeChild(newContainer);
  });

  it(
    'should only flush before outermost discrete event handler when mixing ' +
      'event systems',
    async () => {
      const {useState} = React;

      const button = React.createRef();

      const ops = [];

      function MyComponent() {
        const [pressesCount, updatePressesCount] = useState(0);
        const [clicksCount, updateClicksCount] = useState(0);

        function handlePress() {
          // This dispatches a synchronous, discrete event in the legacy event
          // system. However, because it's nested inside the new event system,
          // its updates should not flush until the end of the outer handler.
          button.current.click();
          // Text context should not have changed
          ops.push(newContainer.textContent);
          updatePressesCount(pressesCount + 1);
        }

        usePressListener({
          onPress: handlePress,
        });

        return (
          <div>
            <button
              responders={<PressResponder />}
              ref={button}
              onClick={() => updateClicksCount(clicksCount + 1)}>
              Presses: {pressesCount}, Clicks: {clicksCount}
            </button>
          </div>
        );
      }

      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const root = ReactDOM.unstable_createRoot(newContainer);

      root.render(<MyComponent />);
      Scheduler.unstable_flushAll();
      expect(newContainer.textContent).toEqual('Presses: 0, Clicks: 0');

      dispatchEventWithTimeStamp(button.current, 'pointerdown', 100);
      dispatchEventWithTimeStamp(button.current, 'pointerup', 100);
      dispatchEventWithTimeStamp(button.current, 'click', 100);
      Scheduler.unstable_flushAll();
      expect(newContainer.textContent).toEqual('Presses: 1, Clicks: 1');

      expect(ops).toEqual(['Presses: 0, Clicks: 0']);
    },
  );

  describe('onContextMenu', () => {
    it('is called after a right mouse click', () => {
      const onContextMenu = jest.fn();
      const ref = React.createRef();
      const Component = () => {
        usePressListener({onContextMenu});

        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'mouse', button: 2}),
      );
      ref.current.dispatchEvent(createEvent('contextmenu'));
      expect(onContextMenu).toHaveBeenCalledTimes(1);
      expect(onContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'contextmenu'}),
      );
    });

    it('is called after a left mouse click + ctrl key on Mac', () => {
      jest.resetModules();
      const platformGetter = jest.spyOn(global.navigator, 'platform', 'get');
      platformGetter.mockReturnValue('MacIntel');
      init();

      const onContextMenu = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({onContextMenu});

        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'mouse',
          button: 0,
          ctrlKey: true,
        }),
      );
      ref.current.dispatchEvent(createEvent('contextmenu'));
      expect(onContextMenu).toHaveBeenCalledTimes(1);
      expect(onContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'contextmenu'}),
      );
      platformGetter.mockClear();
    });

    it('is not called after a left mouse click + ctrl key on Windows', () => {
      jest.resetModules();
      const platformGetter = jest.spyOn(global.navigator, 'platform', 'get');
      platformGetter.mockReturnValue('Win32');
      init();

      const onContextMenu = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({onContextMenu});

        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(
        createEvent('pointerdown', {
          pointerType: 'mouse',
          button: 0,
          ctrlKey: true,
        }),
      );
      ref.current.dispatchEvent(createEvent('contextmenu'));
      expect(onContextMenu).toHaveBeenCalledTimes(0);
      platformGetter.mockClear();
    });

    it('is not called after a right mouse click occurs during an active press', () => {
      const onContextMenu = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({onContextMenu});

        return <div ref={ref} responders={<PressResponder />} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'mouse', button: 0}),
      );
      ref.current.dispatchEvent(createEvent('contextmenu'));
      expect(onContextMenu).toHaveBeenCalledTimes(0);
    });

    it('is still called if "preventContextMenu" is true', () => {
      const onContextMenu = jest.fn();
      const ref = React.createRef();

      const Component = () => {
        usePressListener({onContextMenu});

        return (
          <div
            ref={ref}
            responders={<PressResponder preventContextMenu={true} />}
          />
        );
      };
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'mouse', button: 2}),
      );
      ref.current.dispatchEvent(createEvent('contextmenu'));
      expect(onContextMenu).toHaveBeenCalledTimes(1);
      expect(onContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({defaultPrevented: true}),
      );
    });
  });

  it('should work correctly with stopPropagation set to true', () => {
    const ref = React.createRef();
    const pointerDownEvent = jest.fn();

    const Component = () => {
      return (
        <div ref={ref} responders={<PressResponder stopPropagation={true} />} />
      );
    };

    container.addEventListener('pointerdown', pointerDownEvent);
    ReactDOM.render(<Component />, container);

    ref.current.dispatchEvent(
      createEvent('pointerdown', {pointerType: 'mouse', button: 0}),
    );
    container.removeEventListener('pointerdown', pointerDownEvent);
    expect(pointerDownEvent).toHaveBeenCalledTimes(0);
  });

  it('has the correct press target when used with event hook', () => {
    const ref = React.createRef();
    const onPress = jest.fn();
    const Component = () => {
      usePressListener({onPress});

      return (
        <div>
          <a href="#" ref={ref} responders={<PressResponder />} />
        </div>
      );
    };
    ReactDOM.render(<Component />, container);

    ref.current.dispatchEvent(
      createEvent('pointerdown', {pointerType: 'mouse', button: 0}),
    );
    ref.current.dispatchEvent(
      createEvent('pointerup', {pointerType: 'mouse', button: 0}),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(
      expect.objectContaining({target: ref.current}),
    );
  });
});
