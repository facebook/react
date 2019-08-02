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
let TestUtils;
let Scheduler;
let HoverResponder;
let useHoverResponder;

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
  });
}

describe('Hover event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableFlareAPI = true;
    ReactFeatureFlags.enableUserBlockingEvents = true;
    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
    Scheduler = require('scheduler');
    HoverResponder = require('react-events/hover').HoverResponder;
    useHoverResponder = require('react-events/hover').useHoverResponder;
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
      const Component = () => {
        const listener = useHoverResponder({
          disabled: true,
          onHoverStart: onHoverStart,
          onHoverEnd: onHoverEnd,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      ref.current.dispatchEvent(createEvent('pointerout'));
      expect(onHoverStart).not.toBeCalled();
      expect(onHoverEnd).not.toBeCalled();
    });
  });

  describe('onHoverStart', () => {
    let onHoverStart, ref;

    beforeEach(() => {
      onHoverStart = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useHoverResponder({
          onHoverStart: onHoverStart,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "pointerover" event', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });

    it('is not called if "pointerover" pointerType is touch', () => {
      const event = createEvent('pointerover', {pointerType: 'touch'});
      ref.current.dispatchEvent(event);
      expect(onHoverStart).not.toBeCalled();
    });

    it('is called if valid "pointerover" follows touch', () => {
      ref.current.dispatchEvent(
        createEvent('pointerover', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(
        createEvent('pointerout', {pointerType: 'touch'}),
      );
      ref.current.dispatchEvent(
        createEvent('pointerover', {pointerType: 'mouse'}),
      );
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });

    it('ignores browser emulated "mouseover" event', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      ref.current.dispatchEvent(
        createEvent('mouseover', {
          button: 0,
        }),
      );
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    it('is called after "mouseover" event', () => {
      ref.current.dispatchEvent(
        createEvent('mouseover', {
          button: 0,
        }),
      );
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });

    it('is not called after "touchstart"', () => {
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
      ref.current.dispatchEvent(
        createEvent('mouseover', {
          button: 0,
        }),
      );
      expect(onHoverStart).not.toBeCalled();
    });
  });

  describe('onHoverChange', () => {
    let onHoverChange, ref;

    beforeEach(() => {
      onHoverChange = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useHoverResponder({
          onHoverChange,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "pointerover" and "pointerout" events', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      expect(onHoverChange).toHaveBeenCalledTimes(1);
      expect(onHoverChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('pointerout'));
      expect(onHoverChange).toHaveBeenCalledTimes(2);
      expect(onHoverChange).toHaveBeenCalledWith(false);
    });

    // No PointerEvent fallbacks
    it('is called after "mouseover" and "mouseout" events', () => {
      ref.current.dispatchEvent(createEvent('mouseover'));
      expect(onHoverChange).toHaveBeenCalledTimes(1);
      expect(onHoverChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createEvent('mouseout'));
      expect(onHoverChange).toHaveBeenCalledTimes(2);
      expect(onHoverChange).toHaveBeenCalledWith(false);
    });

    it('should be user-blocking but not discrete', async () => {
      const {act} = TestUtils;
      const {useState} = React;

      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const root = ReactDOM.unstable_createRoot(newContainer);

      const target = React.createRef(null);
      function Foo() {
        const [isHover, setHover] = useState(false);
        const listener = useHoverResponder({
          onHoverChange: setHover,
        });
        return (
          <div ref={target} listeners={listener}>
            {isHover ? 'hovered' : 'not hovered'}
          </div>
        );
      }

      await act(async () => {
        root.render(<Foo />);
      });
      expect(newContainer.textContent).toEqual('not hovered');

      await act(async () => {
        target.current.dispatchEvent(createEvent('mouseover'));

        // 3s should be enough to expire the updates
        Scheduler.unstable_advanceTime(3000);
        expect(newContainer.textContent).toEqual('hovered');
      });
    });
  });

  describe('onHoverEnd', () => {
    let onHoverEnd, ref;

    beforeEach(() => {
      onHoverEnd = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useHoverResponder({
          onHoverEnd,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "pointerout" event', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      ref.current.dispatchEvent(createEvent('pointerout'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    it('is not called if "pointerover" pointerType is touch', () => {
      const event = createEvent('pointerover');
      event.pointerType = 'touch';
      ref.current.dispatchEvent(event);
      ref.current.dispatchEvent(createEvent('pointerout'));
      expect(onHoverEnd).not.toBeCalled();
    });

    it('ignores browser emulated "mouseout" event', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      ref.current.dispatchEvent(createEvent('pointerout'));
      ref.current.dispatchEvent(createEvent('mouseout'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    it('is called after "pointercancel" event', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      ref.current.dispatchEvent(createEvent('pointercancel'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    it('is not called again after "pointercancel" event if it follows "pointerout"', () => {
      ref.current.dispatchEvent(createEvent('pointerover'));
      ref.current.dispatchEvent(createEvent('pointerout'));
      ref.current.dispatchEvent(createEvent('pointercancel'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    // No PointerEvent fallbacks
    it('is called after "mouseout" event', () => {
      ref.current.dispatchEvent(createEvent('mouseover'));
      ref.current.dispatchEvent(createEvent('mouseout'));
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });
    it('is not called after "touchend"', () => {
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
      ref.current.dispatchEvent(createEvent('mouseout'));
      expect(onHoverEnd).not.toBeCalled();
    });
  });

  describe('onHoverMove', () => {
    it('is called after "pointermove"', () => {
      const onHoverMove = jest.fn();
      const ref = React.createRef();
      const Component = () => {
        const listener = useHoverResponder({
          onHoverMove,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      ref.current.getBoundingClientRect = () => ({
        top: 50,
        left: 50,
        bottom: 500,
        right: 500,
      });
      ref.current.dispatchEvent(createEvent('pointerover'));
      ref.current.dispatchEvent(
        createEvent('pointermove', {pointerType: 'mouse'}),
      );
      ref.current.dispatchEvent(createEvent('touchmove'));
      ref.current.dispatchEvent(createEvent('mousemove'));
      expect(onHoverMove).toHaveBeenCalledTimes(1);
      expect(onHoverMove).toHaveBeenCalledWith(
        expect.objectContaining({type: 'hovermove'}),
      );
    });
  });

  describe('nested Hover components', () => {
    it('not propagate by default', () => {
      const events = [];
      const innerRef = React.createRef();
      const outerRef = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const Inner = () => {
        const listener = useHoverResponder({
          onHoverStart: createEventHandler('inner: onHoverStart'),
          onHoverEnd: createEventHandler('inner: onHoverEnd'),
          onHoverChange: createEventHandler('inner: onHoverChange'),
        });
        return <div ref={innerRef} listeners={listener} />;
      };

      const Outer = () => {
        const listener = useHoverResponder({
          onHoverStart: createEventHandler('outer: onHoverStart'),
          onHoverEnd: createEventHandler('outer: onHoverEnd'),
          onHoverChange: createEventHandler('outer: onHoverChange'),
        });
        return (
          <div ref={outerRef} listeners={listener}>
            <Inner />
          </div>
        );
      };
      ReactDOM.render(<Outer />, container);

      outerRef.current.dispatchEvent(createEvent('pointerover'));
      outerRef.current.dispatchEvent(
        createEvent('pointerout', {relatedTarget: innerRef.current}),
      );
      innerRef.current.dispatchEvent(createEvent('pointerover'));
      innerRef.current.dispatchEvent(
        createEvent('pointerout', {relatedTarget: outerRef.current}),
      );
      outerRef.current.dispatchEvent(
        createEvent('pointerover', {relatedTarget: innerRef.current}),
      );
      outerRef.current.dispatchEvent(createEvent('pointerout'));
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
    expect(HoverResponder.displayName).toBe('Hover');
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
      const listener = useHoverResponder({
        onHoverStart: logEvent,
        onHoverEnd: logEvent,
        onHoverMove: logEvent,
      });
      return <div ref={ref} listeners={listener} />;
    };
    ReactDOM.render(<Component />, container);

    ref.current.getBoundingClientRect = () => ({
      top: 10,
      left: 10,
      bottom: 20,
      right: 20,
    });

    ref.current.dispatchEvent(
      createEvent('pointerover', {
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
      createEvent('pointerout', {
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
