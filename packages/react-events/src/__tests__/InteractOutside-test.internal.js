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
let InteractOutside;

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
  InteractOutside = require('react-events/interact-outside');
}

describe('Event responder: InteractOutside', () => {
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
    let onInteractionStart, onInteraction, onInteractionEnd, ref;

    beforeEach(() => {
      onInteractionStart = jest.fn();
      onInteraction = jest.fn();
      onInteractionEnd = jest.fn();
      ref = React.createRef();
      const element = (
        <div>
          <div ref={ref}>I am outside</div>
          <InteractOutside
            disabled={true}
            onInteractionStart={onInteractionStart}
            onInteraction={onInteraction}
            onInteractionEnd={onInteractionEnd}>
            <div>I am inside</div>
          </InteractOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createEvent('pointerdown'));
      ref.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionStart).not.toBeCalled();
      expect(onInteraction).not.toBeCalled();
      expect(onInteractionEnd).not.toBeCalled();
    });
  });

  describe('onInteractionStart', () => {
    let onInteractionStart, outsideRef, insideRef;

    beforeEach(() => {
      onInteractionStart = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <InteractOutside onInteractionStart={onInteractionStart}>
            <div ref={insideRef}>I am inside</div>
          </InteractOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerdown" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      expect(onInteractionStart).toHaveBeenCalledTimes(1);
      expect(onInteractionStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressstart'}),
      );
    });

    it('is not called after "pointerdown" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      expect(onInteractionStart).toHaveBeenCalledTimes(0);
    });

    it('ignores browser emulated events (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown'));
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onInteractionStart).toHaveBeenCalledTimes(1);
    });

    it('ignores browser emulated events (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('pointerdown'));
      insideRef.current.dispatchEvent(createEvent('touchstart'));
      insideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onInteractionStart).toHaveBeenCalledTimes(0);
    });

    it('ignores any events not caused by left-click or touch/pen contact', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown', {button: 1}));
      outsideRef.current.dispatchEvent(createEvent('pointerdown', {button: 5}));
      outsideRef.current.dispatchEvent(createEvent('mousedown', {button: 2}));
      expect(onInteractionStart).toHaveBeenCalledTimes(0);
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
      expect(onInteractionStart).toHaveBeenCalledTimes(1);
      expect(onInteractionStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    it('is not called after "keydown" events for Enter on document body', () => {
      document.body.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      expect(onInteractionStart).toHaveBeenCalledTimes(0);
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
      expect(onInteractionStart).toHaveBeenCalledTimes(0);
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
      expect(onInteractionStart).toHaveBeenCalledTimes(1);
      expect(onInteractionStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressstart'}),
      );
    });

    it('is not called after "keydown" for other keys', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'a'}),
      );
      expect(onInteractionStart).not.toBeCalled();
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" event (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onInteractionStart).toHaveBeenCalledTimes(1);
      expect(onInteractionStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressstart'}),
      );
    });

    it('is called after "mousedown" event (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onInteractionStart).toHaveBeenCalledTimes(0);
    });

    it('is called after "touchstart" event (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      expect(onInteractionStart).toHaveBeenCalledTimes(1);
      expect(onInteractionStart).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressstart'}),
      );
    });

    it('is called after "touchstart" event (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('touchstart'));
      expect(onInteractionStart).toHaveBeenCalledTimes(0);
    });
  });

  describe('onInteractionEnd', () => {
    let onInteractionEnd, outsideRef, insideRef;

    beforeEach(() => {
      onInteractionEnd = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <InteractOutside onInteractionEnd={onInteractionEnd}>
            <div ref={insideRef}>I am inside</div>
          </InteractOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerup" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionEnd).toHaveBeenCalledTimes(1);
      expect(onInteractionEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressend'}),
      );
    });

    it('is called after "pointerup" event (inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionEnd).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (outside -> inside)', () => {
      outsideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionEnd).toHaveBeenCalledTimes(1);
      expect(onInteractionEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'pen', type: 'pressend'}),
      );
    });

    it('is called after "pointerup" event (inside -> outside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionEnd).toHaveBeenCalledTimes(0);
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
      expect(onInteractionEnd).toHaveBeenCalledTimes(1);
      expect(onInteractionEnd).toHaveBeenCalledWith(
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
      expect(onInteractionEnd).toHaveBeenCalledTimes(0);
    });

    it('is called after "keyup" event for Enter (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onInteractionEnd).toHaveBeenCalledTimes(1);
      expect(onInteractionEnd).toHaveBeenCalledWith(
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
      expect(onInteractionEnd).toHaveBeenCalledTimes(0);
    });

    it('is called after "keyup" event for Spacebar (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' '}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: ' '}),
      );
      expect(onInteractionEnd).toHaveBeenCalledTimes(1);
      expect(onInteractionEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'keyboard', type: 'pressend'}),
      );
    });

    it('is called after "keyup" event for Spacebar (inside)', () => {
      insideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: ' '}),
      );
      insideRef.current.dispatchEvent(createKeyboardEvent('keyup', {key: ' '}));
      expect(onInteractionEnd).toHaveBeenCalledTimes(0);
    });

    it('is not called after "keyup" event for other keys', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'a'}),
      );
      expect(onInteractionEnd).not.toBeCalled();
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
      expect(onInteractionEnd).toHaveBeenCalledWith(
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
      expect(onInteractionEnd).toHaveBeenCalledTimes(1);
      expect(onInteractionEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'mouse', type: 'pressend'}),
      );
    });

    it('is called after "touchend" event', () => {
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      outsideRef.current.dispatchEvent(createEvent('touchend'));
      expect(onInteractionEnd).toHaveBeenCalledTimes(1);
      expect(onInteractionEnd).toHaveBeenCalledWith(
        expect.objectContaining({pointerType: 'touch', type: 'pressend'}),
      );
    });
  });

  describe('onInteractionChange', () => {
    let onInteractionChange, outsideRef, insideRef;

    beforeEach(() => {
      onInteractionChange = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <InteractOutside onInteractionChange={onInteractionChange}>
            <div ref={insideRef}>I am inside</div>
          </InteractOutside>
        </div>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerdown" and "pointerup" events (outside)', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onInteractionChange).toHaveBeenCalledTimes(1);
      expect(onInteractionChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionChange).toHaveBeenCalledTimes(2);
      expect(onInteractionChange).toHaveBeenCalledWith(false);
    });

    it('is called after "pointerdown" and "pointerup" events (inside)', () => {
      insideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onInteractionChange).toHaveBeenCalledTimes(0);
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionChange).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerdown" and "pointerup" events (outside -> inside)', () => {
      outsideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onInteractionChange).toHaveBeenCalledTimes(1);
      expect(onInteractionChange).toHaveBeenCalledWith(true);
      insideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionChange).toHaveBeenCalledTimes(2);
      expect(onInteractionChange).toHaveBeenCalledWith(false);
    });

    it('is called after "pointerdown" and "pointerup" events (inside -> outside)', () => {
      insideRef.current.dispatchEvent(createEvent('pointerdown'));
      expect(onInteractionChange).toHaveBeenCalledTimes(0);
      outsideRef.current.dispatchEvent(createEvent('pointerup'));
      expect(onInteractionChange).toHaveBeenCalledTimes(0);
    });

    it('is called after valid "keydown" and "keyup" events', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      expect(onInteractionChange).toHaveBeenCalledTimes(1);
      expect(onInteractionChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onInteractionChange).toHaveBeenCalledTimes(2);
      expect(onInteractionChange).toHaveBeenCalledWith(false);
    });

    // No PointerEvent fallbacks
    it('is called after "mousedown" and "mouseup" events', () => {
      outsideRef.current.dispatchEvent(createEvent('mousedown'));
      expect(onInteractionChange).toHaveBeenCalledTimes(1);
      expect(onInteractionChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(createEvent('mouseup'));
      expect(onInteractionChange).toHaveBeenCalledTimes(2);
      expect(onInteractionChange).toHaveBeenCalledWith(false);
    });

    it('is called after "touchstart" and "touchend" events', () => {
      outsideRef.current.dispatchEvent(createEvent('touchstart'));
      expect(onInteractionChange).toHaveBeenCalledTimes(1);
      expect(onInteractionChange).toHaveBeenCalledWith(true);
      outsideRef.current.dispatchEvent(createEvent('touchend'));
      expect(onInteractionChange).toHaveBeenCalledTimes(2);
      expect(onInteractionChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onInteraction', () => {
    let onInteraction, outsideRef, insideRef;

    beforeEach(() => {
      onInteraction = jest.fn();
      outsideRef = React.createRef();
      insideRef = React.createRef();
      const element = (
        <div>
          <div ref={outsideRef}>I am outside</div>
          <InteractOutside onInteraction={onInteraction}>
            <div ref={insideRef}>I am inside</div>
          </InteractOutside>
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
      expect(onInteraction).toHaveBeenCalledTimes(1);
      expect(onInteraction).toHaveBeenCalledWith(
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
      expect(onInteraction).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (inside -> outside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      outsideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onInteraction).toHaveBeenCalledTimes(0);
    });

    it('is called after "pointerup" event (outside -> inside)', () => {
      insideRef.current.dispatchEvent(
        createEvent('pointerdown', {pointerType: 'pen'}),
      );
      insideRef.current.dispatchEvent(
        createEvent('pointerup', {pageX: 10, pageY: 10}),
      );
      expect(onInteraction).toHaveBeenCalledTimes(0);
    });

    it('is called after valid "keyup" event (outside)', () => {
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keydown', {key: 'Enter'}),
      );
      outsideRef.current.dispatchEvent(
        createKeyboardEvent('keyup', {key: 'Enter'}),
      );
      expect(onInteraction).toHaveBeenCalledTimes(1);
      expect(onInteraction).toHaveBeenCalledWith(
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
      expect(onInteraction).toHaveBeenCalledTimes(0);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(InteractOutside.displayName).toBe('InteractOutside');
  });
});
