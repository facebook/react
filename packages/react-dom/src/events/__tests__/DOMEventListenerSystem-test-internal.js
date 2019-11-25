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
let ReactDOMServer;
let ReactTestRenderer;
let Scheduler;

function dispatchEvent(element, type) {
  const event = document.createEvent('Event');
  event.initEvent(type, true, true);
  element.dispatchEvent(event);
}

function dispatchClickEvent(element) {
  dispatchEvent(element, 'click');
}

describe('DOMEventListenerSystem', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableListenerAPI = true;
    ReactFeatureFlags.enableScopeAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('can mount and render correctly with the ReactTestRenderer', () => {
    jest.resetModules();
    const clickEvent = jest.fn();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableListenerAPI = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');

    function Test() {
      const listener = ReactDOM.unstable_createListener('click', clickEvent);

      return <div listeners={listener}>Hello world</div>;
    }
    const renderer = ReactTestRenderer.create(<Test />);
    expect(renderer).toMatchRenderedOutput(<div>Hello world</div>);
  });

  it('can render correctly with the ReactDOMServer', () => {
    const clickEvent = jest.fn();

    function Test() {
      const listener = ReactDOM.unstable_createListener('click', clickEvent);

      return <div listeners={listener}>Hello world</div>;
    }
    const output = ReactDOMServer.renderToString(<Test />);
    expect(output).toBe(`<div data-reactroot="">Hello world</div>`);
  });

  it('can render correctly with the ReactDOMServer hydration', () => {
    const clickEvent = jest.fn();
    const ref = React.createRef();

    function Test() {
      const listener = ReactDOM.unstable_createListener('click', clickEvent);

      return (
        <div>
          <span listeners={listener} ref={ref}>
            Hello world
          </span>
        </div>
      );
    }
    const output = ReactDOMServer.renderToString(<Test />);
    expect(output).toBe(
      `<div data-reactroot=""><span>Hello world</span></div>`,
    );
    container.innerHTML = output;
    ReactDOM.hydrate(<Test />, container);
    dispatchClickEvent(ref.current);
    expect(clickEvent).toHaveBeenCalledTimes(1);
  });

  it('should correctly work for a basic "click" listener', () => {
    const log = [];
    const clickEvent = jest.fn(event => {
      log.push({
        eventPhase: event.eventPhase,
        type: event.type,
        currentTarget: event.currentTarget,
        target: event.target,
      });
    });
    const divRef = React.createRef();
    const buttonRef = React.createRef();

    function Test() {
      const listener = ReactDOM.unstable_createListener('click', clickEvent);

      return (
        <button listeners={listener} ref={buttonRef}>
          <div ref={divRef}>Click me!</div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);
    expect(container.innerHTML).toBe('<button><div>Click me!</div></button>');

    // Clicking the button should trigger the event callback
    let divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(log[0]).toEqual({
      eventPhase: 3,
      type: 'click',
      currentTarget: buttonRef.current,
      target: divRef.current,
    });

    // Unmounting the container and clicking should not work
    ReactDOM.render(null, container);
    dispatchClickEvent(divElement);
    expect(clickEvent).toBeCalledTimes(1);

    // Re-rendering the container and clicking should work
    ReactDOM.render(<Test />, container);
    divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(clickEvent).toBeCalledTimes(2);

    // Clicking the button should also work
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(log[2]).toEqual({
      eventPhase: 3,
      type: 'click',
      currentTarget: buttonRef.current,
      target: buttonRef.current,
    });
  });

  it('should correctly handle many nested target listeners', () => {
    const buttonRef = React.createRef();
    const targetListerner1 = jest.fn();
    const targetListerner2 = jest.fn();
    const targetListerner3 = jest.fn();
    const targetListerner4 = jest.fn();

    function Test() {
      const listerner1 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
        {capture: true},
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
        {capture: true},
      );
      const listerner3 = ReactDOM.unstable_createListener(
        'click',
        targetListerner3,
      );
      const listerner4 = ReactDOM.unstable_createListener(
        'click',
        targetListerner4,
      );

      return (
        <button
          listeners={[
            [listerner1],
            undefined,
            [listerner2, null, [[listerner3]], listerner4],
          ]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
    expect(targetListerner3).toHaveBeenCalledTimes(1);
    expect(targetListerner4).toHaveBeenCalledTimes(1);

    function Test2() {
      const listerner1 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
      );
      const listerner3 = ReactDOM.unstable_createListener(
        'click',
        targetListerner3,
      );
      const listerner4 = ReactDOM.unstable_createListener(
        'click',
        targetListerner4,
      );

      return (
        <button
          listeners={[
            [listerner1],
            undefined,
            [listerner2, null, [[listerner3]], listerner4],
          ]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test2 />, container);

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(2);
    expect(targetListerner2).toHaveBeenCalledTimes(2);
    expect(targetListerner3).toHaveBeenCalledTimes(2);
    expect(targetListerner4).toHaveBeenCalledTimes(2);
  });

  it('should correctly work for a basic "click" root listener', () => {
    const log = [];
    const clickEvent = jest.fn(event => {
      log.push({
        eventPhase: event.eventPhase,
        type: event.type,
        currentTarget: event.currentTarget,
        target: event.target,
      });
    });

    function Test() {
      const listener = ReactDOM.unstable_createRootListener(
        'click',
        clickEvent,
      );

      return <button listeners={listener}>Click anything!</button>;
    }
    ReactDOM.render(<Test />, container);
    expect(container.innerHTML).toBe('<button>Click anything!</button>');

    // Clicking outside the button should trigger the event callback
    dispatchClickEvent(document.body);
    expect(log[0]).toEqual({
      eventPhase: 3,
      type: 'click',
      currentTarget: document,
      target: document.body,
    });

    // Unmounting the container and clicking should not work
    ReactDOM.render(null, container);
    dispatchClickEvent(document.body);
    expect(clickEvent).toBeCalledTimes(1);

    // Re-rendering and clicking the body should work again
    ReactDOM.render(<Test />, container);
    dispatchClickEvent(document.body);
    expect(clickEvent).toBeCalledTimes(2);
  });

  it('should correctly handle event propagation in the correct order', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    const log = [];

    function Test() {
      const captureRoot = ReactDOM.unstable_createRootListener(
        'click',
        e => {
          log.push({
            root: true,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        },
        {capture: true},
      );
      const captureBubble = ReactDOM.unstable_createRootListener('click', e => {
        log.push({
          root: true,
          eventPhase: e.eventPhase,
          currentTarget: e.currentTarget,
          target: e.target,
        });
      });
      const bubbleButton = ReactDOM.unstable_createListener('click', e => {
        log.push({
          root: false,
          eventPhase: e.eventPhase,
          currentTarget: e.currentTarget,
          target: e.target,
        });
      });
      const captureButton = ReactDOM.unstable_createListener(
        'click',
        e => {
          log.push({
            root: false,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        },
        {capture: true},
      );
      const bubbleDiv = ReactDOM.unstable_createListener('click', e => {
        log.push({
          root: false,
          eventPhase: e.eventPhase,
          currentTarget: e.currentTarget,
          target: e.target,
        });
      });
      const captureDiv = ReactDOM.unstable_createListener(
        'click',
        e => {
          log.push({
            root: false,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        },
        {capture: true},
      );

      return (
        <button
          listeners={[captureRoot, captureBubble, bubbleButton, captureButton]}
          ref={buttonRef}>
          <div
            listeners={[captureRoot, captureBubble, bubbleDiv, captureDiv]}
            ref={divRef}>
            Click me!
          </div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let divElement = divRef.current;
    dispatchClickEvent(divElement);

    expect(log).toEqual([
      {
        root: true,
        eventPhase: 1,
        currentTarget: document,
        target: divRef.current,
      },
      {
        root: true,
        eventPhase: 1,
        currentTarget: document,
        target: divRef.current,
      },
      {
        root: false,
        eventPhase: 1,
        currentTarget: buttonRef.current,
        target: divRef.current,
      },
      {
        root: false,
        eventPhase: 1,
        currentTarget: divRef.current,
        target: divRef.current,
      },
      {
        root: false,
        eventPhase: 3,
        currentTarget: divRef.current,
        target: divRef.current,
      },
      {
        root: false,
        eventPhase: 3,
        currentTarget: buttonRef.current,
        target: divRef.current,
      },
      {
        root: true,
        eventPhase: 3,
        currentTarget: document,
        target: divRef.current,
      },
      {
        root: true,
        eventPhase: 3,
        currentTarget: document,
        target: divRef.current,
      },
    ]);
  });

  it('should correctly handle stopImmediatePropagation for mixed listeners', () => {
    const buttonRef = React.createRef();
    const targetListerner1 = jest.fn(e => e.stopImmediatePropagation());
    const targetListerner2 = jest.fn(e => e.stopImmediatePropagation());
    const rootListerner1 = jest.fn();

    function Test() {
      const listerner1 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
        {capture: true},
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
      );
      const listerner3 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner1,
      );

      return (
        <button
          listeners={[listerner1, listerner2, listerner3]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
    expect(rootListerner1).toHaveBeenCalledTimes(0);
  });

  it('should correctly handle stopPropagation for based target events', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    let clickEvent = jest.fn();

    function Test() {
      const bubbleButton = ReactDOM.unstable_createListener(
        'click',
        clickEvent,
      );
      const bubbleDiv = ReactDOM.unstable_createListener('click', e => {
        e.stopPropagation();
      });

      return (
        <button listeners={bubbleButton} ref={buttonRef}>
          <div listeners={bubbleDiv} ref={divRef}>
            Click me!
          </div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(clickEvent).toHaveBeenCalledTimes(0);
  });

  it('should correctly handle stopPropagation for mixed capture/bubbling target listeners', () => {
    const buttonRef = React.createRef();
    const targetListerner1 = jest.fn(e => e.stopPropagation());
    const targetListerner2 = jest.fn(e => e.stopPropagation());
    const targetListerner3 = jest.fn(e => e.stopPropagation());
    const targetListerner4 = jest.fn(e => e.stopPropagation());

    function Test() {
      const listerner1 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
        {capture: true},
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
        {capture: true},
      );
      const listerner3 = ReactDOM.unstable_createListener(
        'click',
        targetListerner3,
      );
      const listerner4 = ReactDOM.unstable_createListener(
        'click',
        targetListerner4,
      );

      return (
        <button
          listeners={[listerner1, listerner2, listerner3, listerner4]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
    expect(targetListerner3).toHaveBeenCalledTimes(1);
    expect(targetListerner4).toHaveBeenCalledTimes(1);
  });

  it('should correctly handle stopPropagation for target listeners', () => {
    const buttonRef = React.createRef();
    const targetListerner1 = jest.fn(e => e.stopPropagation());
    const targetListerner2 = jest.fn(e => e.stopPropagation());
    const targetListerner3 = jest.fn(e => e.stopPropagation());
    const targetListerner4 = jest.fn(e => e.stopPropagation());

    function Test() {
      const listerner1 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
      );
      const listerner3 = ReactDOM.unstable_createListener(
        'click',
        targetListerner3,
      );
      const listerner4 = ReactDOM.unstable_createListener(
        'click',
        targetListerner4,
      );

      return (
        <button
          listeners={[listerner1, listerner2, listerner3, listerner4]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
    expect(targetListerner3).toHaveBeenCalledTimes(1);
    expect(targetListerner4).toHaveBeenCalledTimes(1);
  });

  it('should correctly handle stopPropagation for mixed listeners', () => {
    const buttonRef = React.createRef();
    const rootListerner1 = jest.fn(e => e.stopPropagation());
    const rootListerner2 = jest.fn();
    const targetListerner1 = jest.fn();
    const targetListerner2 = jest.fn(e => e.stopPropagation());

    function Test() {
      const listerner1 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner1,
        {capture: true},
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
        {capture: true},
      );
      const listerner3 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner2,
      );
      const listerner4 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
      );

      return (
        <button
          listeners={[listerner1, listerner2, listerner3, listerner4]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(rootListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner1).toHaveBeenCalledTimes(0);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
    expect(rootListerner2).toHaveBeenCalledTimes(0);
  });

  it('should correctly handle stopPropagation for root listeners', () => {
    const buttonRef = React.createRef();
    const rootListerner1 = jest.fn(e => e.stopPropagation());
    const rootListerner2 = jest.fn();
    const rootListerner3 = jest.fn(e => e.stopPropagation());
    const rootListerner4 = jest.fn();

    function Test() {
      const listerner1 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner1,
        {capture: true},
      );
      const listerner2 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner2,
        {capture: true},
      );
      const listerner3 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner3,
      );
      const listerner4 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner4,
      );

      return (
        <button
          listeners={[listerner1, listerner2, listerner3, listerner4]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(rootListerner1).toHaveBeenCalledTimes(1);
    expect(rootListerner2).toHaveBeenCalledTimes(1);
    expect(rootListerner3).toHaveBeenCalledTimes(1);
    expect(rootListerner4).toHaveBeenCalledTimes(1);
  });

  it('should correctly handle updating listeners to empty', () => {
    const buttonRef = React.createRef();
    const targetListerner1 = jest.fn();
    const targetListerner2 = jest.fn();

    function Test({toggle}) {
      const listerner1 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
      );

      return (
        <button
          listeners={toggle ? [listerner1, listerner2] : []}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test toggle={true} />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(1);

    ReactDOM.render(<Test toggle={false} />, container);

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
  });

  it('should correctly handle updating target listeners size', () => {
    const buttonRef = React.createRef();
    const targetListerner1 = jest.fn();
    const targetListerner2 = jest.fn();

    function Test({toggle}) {
      const listerner1 = ReactDOM.unstable_createListener(
        'click',
        targetListerner1,
      );
      const listerner2 = ReactDOM.unstable_createListener(
        'click',
        targetListerner2,
      );

      return (
        <button
          listeners={toggle ? [listerner1] : [listerner1, listerner2]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test toggle={true} />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(0);

    ReactDOM.render(<Test toggle={false} />, container);

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(2);
    expect(targetListerner2).toHaveBeenCalledTimes(1);

    ReactDOM.render(<Test toggle={true} />, container);

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(3);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
  });

  it('should correctly handle updating root listeners size', () => {
    const buttonRef = React.createRef();
    const rootListerner1 = jest.fn();
    const rootListerner2 = jest.fn();

    function Test({toggle}) {
      const listerner1 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner1,
      );
      const listerner2 = ReactDOM.unstable_createRootListener(
        'click',
        rootListerner2,
      );

      return (
        <button
          listeners={toggle ? [listerner1] : [listerner1, listerner2]}
          ref={buttonRef}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test toggle={true} />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(rootListerner1).toHaveBeenCalledTimes(1);
    expect(rootListerner2).toHaveBeenCalledTimes(0);

    ReactDOM.render(<Test toggle={false} />, container);

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(rootListerner1).toHaveBeenCalledTimes(2);
    expect(rootListerner2).toHaveBeenCalledTimes(1);

    ReactDOM.render(<Test toggle={true} />, container);

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(rootListerner1).toHaveBeenCalledTimes(3);
    expect(rootListerner2).toHaveBeenCalledTimes(1);
  });

  it.experimental('should work with concurrent mode updates', async () => {
    const log = [];
    const ref = React.createRef();

    function Test({counter}) {
      const listener = ReactDOM.unstable_createListener('click', () => {
        log.push({counter});
      });

      Scheduler.unstable_yieldValue('Test');
      return (
        <button listeners={listener} ref={ref}>
          Press me
        </button>
      );
    }

    let root = ReactDOM.createRoot(container);
    root.render(<Test counter={0} />);
    expect(Scheduler).toFlushAndYield(['Test']);

    // Click the button
    dispatchClickEvent(ref.current);
    expect(log).toEqual([{counter: 0}]);

    // Clear log
    log.length = 0;

    // Increase counter
    root.render(<Test counter={1} />);
    // Yield before committing
    expect(Scheduler).toFlushAndYieldThrough(['Test']);

    // Click the button again
    dispatchClickEvent(ref.current);
    expect(log).toEqual([{counter: 0}]);

    // Clear log
    log.length = 0;

    // Commit
    expect(Scheduler).toFlushAndYield([]);
    dispatchClickEvent(ref.current);
    expect(log).toEqual([{counter: 1}]);
  });
});
