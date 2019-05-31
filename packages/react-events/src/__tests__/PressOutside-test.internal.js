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
let PressOutside;

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

function init() {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableEventAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  PressOutside = require('react-events/press-outside');
}

describe('Event responder: PressOutside', () => {
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
      const element = (
        <div>
          <div ref={ref}>I am outside</div>
          <PressOutside
            disabled={true}
            onPressStart={onPressStart}
            onPress={onPress}
            onPressEnd={onPressEnd}>
            <div>I am inside</div>
          </PressOutside>
        </div>
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
    let onPressStart, outsideRef, insideRef;

    beforeEach(() => {
      onPressStart = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <PressOutside onPressStart={onPressStart}>
            <div ref={insideRef}>I am inside</div>
          </PressOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerdown" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressstart'}),
      );
    });

    it('is not called after "pointerdown" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('ignores browser emulated events (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown'));
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('ignores browser emulated events (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('pointerdown'));
      insideRef.current.dispatchEvent(createEvent('touchstart'));
      insideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('ignores any events not caused by left-click or touch/pen contact', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown', {button: 1}));
      outsideRef.current.dispatchEvent(createEvent('pointerdown', {button: 5}));
      outsideRef.current.dispatchEvent(createEvent('mousedown', {button: 2}));
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('is called once after "keydown" events for Enter (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    it('is not called after "keydown" events for Enter on document body', () => {
      document.body.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('is called once after "keydown" events for Enter (inside)', () => {
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('is called once after "keydown" events for Spacebar', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' '}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keypress', {key: ' '}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' '}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keypress', {key: ' '}),
      );
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    it('is not called after "keydown" for other keys', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'a'}),
      );
      expect(onPressStart).not.toBeCalled();
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" event (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressstart'}),
      );
    });

    it('is called after "mousedown" event (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });

    it('is called after "touchstart" event (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      expect(onPressStart).toHaveBeenCalledTimes(1);
      expect(onPressStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressstart'}),
      );
    });

    it('is called after "touchstart" event (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('touchstart'));
      expect(onPressStart).toHaveBeenCalledTimes(0);
    });
  });

  describe('onPressEnd', () => {
    let onPressEnd, outsideRef, insideRef;

    beforeEach(() => {
      onPressEnd = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <PressOutside onPressEnd={onPressEnd}>
            <div ref={insideRef}>I am inside</div>
          </PressOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerup" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressend'}),
      );
    });

    it('is called after "pointerup" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressEnd).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (outside -> inside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressend'}),
      );
    });

    it('is called after "pointerup" event (inside -> outside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressEnd).toHaveBeenCalledTimes(0);
    });

    it('ignores browser emulated events (outside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'touch'}),
      );
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      outsideRef.current.dispatchEvent(createEvent('touchend'));
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      outsideRef.current.dispatchEvent(createEvent('mouseup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });

    it('ignores browser emulated events (inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'touch'}),
      );
      insideRef.current.dispatchEvent(createEvent('touchstart'));
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      insideRef.current.dispatchEvent(createEvent('touchend'));
      insideRef.current.dispatchEvent(createEvent('mousedown'));
      insideRef.current.dispatchEvent(createEvent('mouseup'));
      expect(onPressEnd).toHaveBeenCalledTimes(0);
    });

    it('is called after "keyup" event for Enter (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    it('is called after "keyup" event for Enter (inside)', () => {
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onPressEnd).toHaveBeenCalledTimes(0);
    });

    it('is called after "keyup" event for Spacebar (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' '}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: ' '}),
      );
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    it('is called after "keyup" event for Spacebar (inside)', () => {
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' '}),
      );
      insideRef.current.dispatchEvent(createKeyboardEvent('keyup', {key: ' '}));
      expect(onPressEnd).toHaveBeenCalledTimes(0);
    });

    it('is not called after "keyup" event for other keys', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'a'}),
      );
      expect(onPressEnd).not.toBeCalled();
    });

    it('is called with keyboard modifiers', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
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
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      outsideRef.current.dispatchEvent(createEvent('mouseup'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressend'}),
      );
    });

    it('is called after "touchend" event', () => {
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      outsideRef.current.dispatchEvent(createEvent('touchend'));
      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onPressEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });
  });

  describe('onPressChange', () => {
    let onPressChange, outsideRef, insideRef;

    beforeEach(() => {
      onPressChange = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <PressOutside onPressChange={onPressChange}>
            <div ref={insideRef}>I am inside</div>
          </PressOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerdown" and "pointerup" events (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    it('is called after "pointerdown" and "pointerup" events (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(0);
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressChange).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerdown" and "pointerup" events (outside -> inside)', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    it('is called after "pointerdown" and "pointerup" events (inside -> outside)', () => {
      insideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onPressChange).toHaveBeenCalledTimes(0);
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onPressChange).toHaveBeenCalledTimes(0);
    });

    it('is called after valid "keydown" and "keyup" events', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" and "mouseup" events', () => {
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(createEvent('mouseup'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });

    it('is called after "touchstart" and "touchend" events', () => {
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      expect(onPressChange).toHaveBeenCalledTimes(1);
      expect(onPressChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(createEvent('touchend'));
      expect(onPressChange).toHaveBeenCalledTimes(2);
      expect(onPressChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onPress', () => {
    let onPress, outsideRef, insideRef;

    beforeEach(() => {
      onPress = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <PressOutside onPress={onPress}>
            <div ref={insideRef}>I am inside</div>
          </PressOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerup" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'press'}),
      );
    });

    it('is called after "pointerup" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onPress).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (inside -> outside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onPress).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (outside -> inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onPress).toHaveBeenCalledTimes(0);
    });

    it('is called after valid "keyup" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'press'}),
      );
    });

    it('is called after valid "keyup" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onPress).toHaveBeenCalledTimes(0);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(PressOutside.displayName).toBe('PressOutside');
  });
});
