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

    describe('delayHoverStart', () => {
      it('can be configured', () => {
        const element = (
          <Hover delayHoverStart={2000} onHoverStart={onHoverStart}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        jest.advanceTimersByTime(1999);
        expect(onHoverStart).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onHoverStart).toHaveBeenCalledTimes(1);
      });

      it('is reset if "pointerout" is dispatched during a delay', () => {
        const element = (
          <Hover delayHoverStart={500} onHoverStart={onHoverStart}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        jest.advanceTimersByTime(499);
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        jest.advanceTimersByTime(1);
        expect(onHoverStart).not.toBeCalled();
        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        jest.runAllTimers();
        expect(onHoverStart).toHaveBeenCalledTimes(1);
      });

      it('onHoverStart is called synchronously if delay is 0ms', () => {
        const element = (
          <Hover delayHoverStart={0} onHoverStart={onHoverStart}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        expect(onHoverStart).toHaveBeenCalledTimes(1);
      });

      it('onHoverStart is only called once per active hover', () => {
        const element = (
          <Hover
            delayHoverStart={500}
            delayHoverEnd={100}
            onHoverStart={onHoverStart}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        jest.advanceTimersByTime(500);
        expect(onHoverStart).toHaveBeenCalledTimes(1);
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        jest.advanceTimersByTime(10);
        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        jest.runAllTimers();
        expect(onHoverStart).toHaveBeenCalledTimes(1);
      });
    });
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

    describe('delayHoverEnd', () => {
      it('can be configured', () => {
        const element = (
          <Hover delayHoverEnd={2000} onHoverEnd={onHoverEnd}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        jest.advanceTimersByTime(1999);
        expect(onHoverEnd).not.toBeCalled();
        jest.advanceTimersByTime(1);
        expect(onHoverEnd).toHaveBeenCalledTimes(1);
      });

      it('delayHoverEnd is called synchronously if delay is 0ms', () => {
        const element = (
          <Hover delayHoverEnd={0} onHoverEnd={onHoverEnd}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        expect(onHoverEnd).toHaveBeenCalledTimes(1);
      });

      it('onHoverEnd is only called once per active hover', () => {
        const element = (
          <Hover delayHoverEnd={500} onHoverEnd={onHoverEnd}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        jest.advanceTimersByTime(499);
        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        jest.advanceTimersByTime(100);
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        jest.runAllTimers();
        expect(onHoverEnd).toHaveBeenCalledTimes(1);
      });

      it('onHoverEnd is not called if "pointerover" is dispatched during a delay', () => {
        const element = (
          <Hover delayHoverEnd={500} onHoverEnd={onHoverEnd}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        jest.advanceTimersByTime(499);
        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        jest.advanceTimersByTime(1);
        expect(onHoverEnd).not.toBeCalled();
      });

      it('onHoverEnd is not called if there was no active hover', () => {
        const element = (
          <Hover
            delayHoverStart={500}
            delayHoverEnd={100}
            onHoverEnd={onHoverEnd}>
            <div ref={ref} />
          </Hover>
        );
        ReactDOM.render(element, container);

        ref.current.dispatchEvent(createPointerEvent('pointerover'));
        ref.current.dispatchEvent(createPointerEvent('pointerout'));
        jest.runAllTimers();
        expect(onHoverEnd).not.toBeCalled();
      });
    });
  });

  describe('onHoverMove', () => {
    it('is called after "pointermove"', () => {
      const onHoverMove = jest.fn();
      const ref = React.createRef();
      const element = (
        <Hover onHoverMove={onHoverMove}>
          <div ref={ref} />
        </Hover>
      );
      ReactDOM.render(element, container);

      ref.current.getBoundingClientRect = () => ({
        top: 50,
        left: 50,
        bottom: 500,
        right: 500,
      });
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      ref.current.dispatchEvent(
        createPointerEvent('pointermove', {pointerType: 'mouse'}),
      );
      ref.current.dispatchEvent(createPointerEvent('touchmove'));
      ref.current.dispatchEvent(createPointerEvent('mousemove'));
      expect(onHoverMove).toHaveBeenCalledTimes(1);
      expect(onHoverMove).toHaveBeenCalledWith(
        expect.objectContaining({type: 'hovermove'}),
      );
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(Hover.displayName).toBe('Hover');
  });
});
