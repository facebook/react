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
let Hover;

const createPointerEvent = type => {
  const event = document.createEvent('Event');
  event.initEvent(type, true, true);
  return event;
};

describe('Hover event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Hover = require('react-events/hover');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('onHoverStart', () => {
    let onHoverStart, ref;

    beforeEach(() => {
      onHoverStart = jest.fn();
      ref = React.createRef();
      const element = (
        <Hover onHoverStart={onHoverStart}>
          <div ref={ref} />
        </Hover>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerover" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });

    it('is not called if "pointerover" pointerType is touch', () => {
      const event = createPointerEvent('pointerover');
      event.pointerType = 'touch';
      ref.current.dispatchEvent(event);
      expect(onHoverStart).not.toBeCalled();
    });

    it('ignores browser emulated "mouseover" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      ref.current.dispatchEvent(createPointerEvent('mouseover'));
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    it('is called after "mouseover" event', () => {
      ref.current.dispatchEvent(createPointerEvent('mouseover'));
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });
    it('is not called after "touchstart"', () => {
      ref.current.dispatchEvent(createPointerEvent('touchstart'));
      ref.current.dispatchEvent(createPointerEvent('touchend'));
      ref.current.dispatchEvent(createPointerEvent('mouseover'));
      expect(onHoverStart).not.toBeCalled();
    });

    // TODO: complete delayHoverStart tests
    // describe('delayHoverStart', () => {});
  });

  describe('onHoverChange', () => {
    let onHoverChange, ref;

    beforeEach(() => {
      onHoverChange = jest.fn();
      ref = React.createRef();
      const element = (
        <Hover onHoverChange={onHoverChange}>
          <div ref={ref} />
        </Hover>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerover" and "pointerout" events', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      expect(onHoverChange).toHaveBeenCalledTimes(1);
      expect(onHoverChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createPointerEvent('pointerout'));
      expect(onHoverChange).toHaveBeenCalledTimes(2);
      expect(onHoverChange).toHaveBeenCalledWith(false);
    });

    // No PointerEvent fallbacks
    it('is called after "mouseover" and "mouseout" events', () => {
      ref.current.dispatchEvent(createPointerEvent('mouseover'));
      expect(onHoverChange).toHaveBeenCalledTimes(1);
      expect(onHoverChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createPointerEvent('mouseout'));
      expect(onHoverChange).toHaveBeenCalledTimes(2);
      expect(onHoverChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onHoverEnd', () => {
    let onHoverEnd, ref;

    beforeEach(() => {
      onHoverEnd = jest.fn();
      ref = React.createRef();
      const element = (
        <Hover onHoverEnd={onHoverEnd}>
          <div ref={ref} />
        </Hover>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "pointerout" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      ref.current.dispatchEvent(createPointerEvent('pointerout'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    it('is not called if "pointerover" pointerType is touch', () => {
      const event = createPointerEvent('pointerover');
      event.pointerType = 'touch';
      ref.current.dispatchEvent(event);
      ref.current.dispatchEvent(createPointerEvent('pointerout'));
      expect(onHoverEnd).not.toBeCalled();
    });

    it('ignores browser emulated "mouseout" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      ref.current.dispatchEvent(createPointerEvent('pointerout'));
      ref.current.dispatchEvent(createPointerEvent('mouseout'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    it('is called after "pointercancel" event', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      ref.current.dispatchEvent(createPointerEvent('pointercancel'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    it('is not called again after "pointercancel" event if it follows "pointerout"', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      ref.current.dispatchEvent(createPointerEvent('pointerout'));
      ref.current.dispatchEvent(createPointerEvent('pointercancel'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    it('is called after "mouseout" event', () => {
      ref.current.dispatchEvent(createPointerEvent('mouseover'));
      ref.current.dispatchEvent(createPointerEvent('mouseout'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });
    it('is not called after "touchend"', () => {
      ref.current.dispatchEvent(createPointerEvent('touchstart'));
      ref.current.dispatchEvent(createPointerEvent('touchend'));
      ref.current.dispatchEvent(createPointerEvent('mouseout'));
      expect(onHoverEnd).not.toBeCalled();
    });

    // TODO: complete delayHoverStart tests
    // describe('delayHoverEnd', () => {});
  });

  it('expect displayName to show up for event component', () => {
    expect(Hover.displayName).toBe('Hover');
  });
});
