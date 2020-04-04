/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget, setPointerEvent} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let HoverResponder;
let useHover;

function initializeModules(hasPointerEvents) {
  jest.resetModules();
  setPointerEvent(hasPointerEvents);
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableDeprecatedFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  HoverResponder = require('react-interactions/events/hover').HoverResponder;
  useHover = require('react-interactions/events/hover').useHover;
}

const forcePointerEvents = true;
const table = [[forcePointerEvents], [!forcePointerEvents]];

describe.each(table)('Hover responder', hasPointerEvents => {
  let container;

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  beforeEach(() => {
    initializeModules(hasPointerEvents);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onHoverChange, onHoverStart, onHoverMove, onHoverEnd, ref;

    beforeEach(() => {
      onHoverChange = jest.fn();
      onHoverStart = jest.fn();
      onHoverMove = jest.fn();
      onHoverEnd = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useHover({
          disabled: true,
          onHoverChange,
          onHoverStart,
          onHoverMove,
          onHoverEnd,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('does not call callbacks', () => {
      const target = createEventTarget(ref.current);
      target.pointerenter();
      target.pointerexit();
      expect(onHoverChange).not.toBeCalled();
      expect(onHoverStart).not.toBeCalled();
      expect(onHoverMove).not.toBeCalled();
      expect(onHoverEnd).not.toBeCalled();
    });
  });

  describe('onHoverStart', () => {
    let onHoverStart, ref;

    beforeEach(() => {
      onHoverStart = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useHover({
          onHoverStart: onHoverStart,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called for mouse pointers', () => {
      const target = createEventTarget(ref.current);
      target.pointerenter();
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });

    it('is not called for touch pointers', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.pointerup({pointerType: 'touch'});
      expect(onHoverStart).not.toBeCalled();
    });

    it('is called if a mouse pointer is used after a touch pointer', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.pointerup({pointerType: 'touch'});
      target.pointerenter();
      expect(onHoverStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('onHoverChange', () => {
    let onHoverChange, ref;

    beforeEach(() => {
      onHoverChange = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useHover({
          onHoverChange,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called for mouse pointers', () => {
      const target = createEventTarget(ref.current);
      target.pointerenter();
      expect(onHoverChange).toHaveBeenCalledTimes(1);
      expect(onHoverChange).toHaveBeenCalledWith(true);
      target.pointerexit();
      expect(onHoverChange).toHaveBeenCalledTimes(2);
      expect(onHoverChange).toHaveBeenCalledWith(false);
    });

    it('is not called for touch pointers', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.pointerup({pointerType: 'touch'});
      expect(onHoverChange).not.toBeCalled();
    });
  });

  describe('onHoverEnd', () => {
    let onHoverEnd, ref;

    beforeEach(() => {
      onHoverEnd = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useHover({
          onHoverEnd,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called for mouse pointers', () => {
      const target = createEventTarget(ref.current);
      target.pointerenter();
      target.pointerexit();
      expect(onHoverEnd).toHaveBeenCalledTimes(1);
    });

    if (hasPointerEvents) {
      it('is called once for cancelled mouse pointers', () => {
        const target = createEventTarget(ref.current);
        target.pointerenter();
        target.pointercancel();
        expect(onHoverEnd).toHaveBeenCalledTimes(1);

        // only called once if cancel follows exit
        onHoverEnd.mockReset();
        target.pointerenter();
        target.pointerexit();
        target.pointercancel();
        expect(onHoverEnd).toHaveBeenCalledTimes(1);
      });
    }

    it('is not called for touch pointers', () => {
      const target = createEventTarget(ref.current);
      target.pointerdown({pointerType: 'touch'});
      target.pointerup({pointerType: 'touch'});
      expect(onHoverEnd).not.toBeCalled();
    });

    it('should correctly work with React Portals', () => {
      const portalNode = document.createElement('div');
      const divRef = React.createRef();
      const spanRef = React.createRef();

      function Test() {
        const listener = useHover({
          onHoverEnd,
        });
        return (
          <div ref={divRef} DEPRECATED_flareListeners={listener}>
            {ReactDOM.createPortal(<span ref={spanRef} />, portalNode)}
          </div>
        );
      }
      ReactDOM.render(<Test />, container);
      const div = createEventTarget(divRef.current);
      div.pointerenter();
      const span = createEventTarget(spanRef.current);
      span.pointerexit();
      expect(onHoverEnd).not.toBeCalled();
      const body = createEventTarget(document.body);
      body.pointerexit();
      expect(onHoverEnd).toBeCalled();
    });
  });

  describe('onHoverMove', () => {
    it('is called after the active pointer moves"', () => {
      const onHoverMove = jest.fn();
      const ref = React.createRef();
      const Component = () => {
        const listener = useHover({
          onHoverMove,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const target = createEventTarget(ref.current);
      target.pointerenter();
      target.pointerhover({x: 0, y: 0});
      target.pointerhover({x: 1, y: 1});
      expect(onHoverMove).toHaveBeenCalledTimes(2);
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
        const listener = useHover({
          onHoverStart: createEventHandler('inner: onHoverStart'),
          onHoverEnd: createEventHandler('inner: onHoverEnd'),
          onHoverChange: createEventHandler('inner: onHoverChange'),
        });
        return <div ref={innerRef} DEPRECATED_flareListeners={listener} />;
      };

      const Outer = () => {
        const listener = useHover({
          onHoverStart: createEventHandler('outer: onHoverStart'),
          onHoverEnd: createEventHandler('outer: onHoverEnd'),
          onHoverChange: createEventHandler('outer: onHoverChange'),
        });
        return (
          <div ref={outerRef} DEPRECATED_flareListeners={listener}>
            <Inner />
          </div>
        );
      };
      ReactDOM.render(<Outer />, container);

      const innerNode = innerRef.current;
      const outerNode = outerRef.current;
      const innerTarget = createEventTarget(innerNode);
      const outerTarget = createEventTarget(outerNode);

      outerTarget.pointerenter({relatedTarget: container});
      outerTarget.pointerexit({relatedTarget: innerNode});
      innerTarget.pointerenter({relatedTarget: outerNode});
      innerTarget.pointerexit({relatedTarget: outerNode});
      outerTarget.pointerenter({relatedTarget: innerNode});
      outerTarget.pointerexit({relatedTarget: container});

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
        x: event.x,
        y: event.y,
        pageX: event.pageX,
        pageY: event.pageY,
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
      const listener = useHover({
        onHoverStart: logEvent,
        onHoverEnd: logEvent,
        onHoverMove: logEvent,
      });
      return <div ref={ref} DEPRECATED_flareListeners={listener} />;
    };
    ReactDOM.render(<Component />, container);

    const node = ref.current;
    const target = createEventTarget(node);

    target.pointerenter({x: 10, y: 10});
    target.pointerhover({x: 10, y: 10});
    target.pointerhover({x: 20, y: 20});
    target.pointerexit({x: 20, y: 20});

    expect(eventLog).toEqual([
      {
        x: 10,
        y: 10,
        pageX: 10,
        pageY: 10,
        clientX: 10,
        clientY: 10,
        target: node,
        timeStamp: timeStamps[0],
        type: 'hoverstart',
        pointerType: 'mouse',
      },
      {
        x: 10,
        y: 10,
        pageX: 10,
        pageY: 10,
        clientX: 10,
        clientY: 10,
        target: node,
        timeStamp: timeStamps[1],
        type: 'hovermove',
        pointerType: 'mouse',
      },
      {
        x: 20,
        y: 20,
        pageX: 20,
        pageY: 20,
        clientX: 20,
        clientY: 20,
        target: node,
        timeStamp: timeStamps[2],
        type: 'hovermove',
        pointerType: 'mouse',
      },
      {
        x: 20,
        y: 20,
        pageX: 20,
        pageY: 20,
        clientX: 20,
        clientY: 20,
        target: node,
        timeStamp: timeStamps[3],
        type: 'hoverend',
        pointerType: 'mouse',
      },
    ]);
  });
});
