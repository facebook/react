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

const createPointerEvent = (type, data) => {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(type, true, true);
  if (data != null) {
    Object.entries(data).forEach(([key, value]) => {
      event[key] = value;
    });
  }
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
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onHoverStart, onHoverEnd, ref;

    beforeEach(() => {
      onHoverStart = jest.fn();
      onHoverEnd = jest.fn();
      ref = React.createRef();
      const element = (
        <Hover
          disabled={true}
          onHoverStart={onHoverStart}
          onHoverEnd={onHoverEnd}>
          <div ref={ref} />
        </Hover>
      );
      ReactDOM.render(element, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createPointerEvent('pointerover'));
      ref.current.dispatchEvent(createPointerEvent('pointerout'));
      expect(onHoverStart).not.toBeCalled();
      expect(onHoverEnd).not.toBeCalled();
    });
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
      const event = createPointerEvent('pointerover', {pointerType: 'touch'});
      ref.current.dispatchEvent(event);
      expect(onHoverStart).not.toBeCalled();
    });

    it('is called if valid "pointerover" follows touch', () => {
      ref.current.dispatchEvent(
        createPointerEvent('pointerover', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(
        createPointerEvent('pointerout', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(
        createPointerEvent('pointerover', {pointerType: 'mouse'}),
      );
      expect(onHoverStart).toHaveBeenCalledTimes(1);
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

  describe('nested Hover components', () => {
    it('do not propagate events by default', () => {
      const events = [];
      const innerRef = React.createRef();
      const outerRef = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Hover
          onHoverStart={createEventHandler('outer: onHoverStart')}
          onHoverEnd={createEventHandler('outer: onHoverEnd')}
          onHoverChange={createEventHandler('outer: onHoverChange')}>
          <div ref={outerRef}>
            <Hover
              onHoverStart={createEventHandler('inner: onHoverStart')}
              onHoverEnd={createEventHandler('inner: onHoverEnd')}
              onHoverChange={createEventHandler('inner: onHoverChange')}>
              <div ref={innerRef} />
            </Hover>
          </div>
        </Hover>
      );

      ReactDOM.render(element, container);

      outerRef.current.dispatchEvent(createPointerEvent('pointerover'));
      outerRef.current.dispatchEvent(
        createPointerEvent('pointerout', {relatedTarget: innerRef.current}),
      );
      innerRef.current.dispatchEvent(createPointerEvent('pointerover'));
      innerRef.current.dispatchEvent(
        createPointerEvent('pointerout', {relatedTarget: outerRef.current}),
      );
      outerRef.current.dispatchEvent(
        createPointerEvent('pointerover', {relatedTarget: innerRef.current}),
      );
      outerRef.current.dispatchEvent(createPointerEvent('pointerout'));
      expect(events).toEqual([
        'outer: onHoverStart',
        'outer: onHoverChange',
        'outer: onHoverEnd',
        'outer: onHoverChange',
        'inner: onHoverStart',
        'inner: onHoverChange',
        'inner: onHoverEnd',
        'inner: onHoverChange',
        'outer: onHoverStart',
        'outer: onHoverChange',
        'outer: onHoverEnd',
        'outer: onHoverChange',
      ]);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(Hover.displayName).toBe('Hover');
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
      <Hover
        onHoverStart={logEvent}
        onHoverEnd={logEvent}
        onHoverMove={logEvent}>
        <button ref={ref} />
      </Hover>
    );
    ReactDOM.render(element, container);

    ref.current.getBoundingClientRect = () => ({
      top: 10,
      left: 10,
      bottom: 20,
      right: 20,
    });

    ref.current.dispatchEvent(
      createPointerEvent('pointerover', {
        pointerType: 'mouse',
        pageX: 15,
        pageY: 16,
        screenX: 20,
        screenY: 21,
        clientX: 30,
        clientY: 31,
      }),
    );
    ref.current.dispatchEvent(
      createPointerEvent('pointermove', {
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
      createPointerEvent('pointerout', {
        pointerType: 'mouse',
        pageX: 17,
        pageY: 18,
        screenX: 22,
        screenY: 23,
        clientX: 32,
        clientY: 33,
      }),
    );
    expect(eventLog).toEqual([
      {
        pageX: 15,
        pageY: 16,
        screenX: 20,
        screenY: 21,
        clientX: 30,
        clientY: 31,
        target: ref.current,
        timeStamp: timeStamps[0],
        type: 'hoverstart',
      },
      {
        pageX: 16,
        pageY: 17,
        screenX: 21,
        screenY: 22,
        clientX: 31,
        clientY: 32,
        target: ref.current,
        timeStamp: timeStamps[1],
        type: 'hovermove',
      },
      {
        pageX: 17,
        pageY: 18,
        screenX: 22,
        screenY: 23,
        clientX: 32,
        clientY: 33,
        target: ref.current,
        timeStamp: timeStamps[2],
        type: 'hoverend',
      },
    ]);
  });
});
