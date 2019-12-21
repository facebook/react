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

  it('can render correctly with the ReactDOMServer', () => {
    const clickEvent = jest.fn();

    function Test() {
      const divRef = React.useRef(null);
      const click = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click.setListener(divRef.current, clickEvent);
      });

      return <div ref={divRef}>Hello world</div>;
    }
    const output = ReactDOMServer.renderToString(<Test />);
    expect(output).toBe(`<div data-reactroot="">Hello world</div>`);
  });

  it('can render correctly with the ReactDOMServer hydration', () => {
    const clickEvent = jest.fn();
    const spanRef = React.createRef();

    function Test() {
      const click = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click.setListener(spanRef.current, clickEvent);
      });

      return (
        <div>
          <span ref={spanRef}>Hello world</span>
        </div>
      );
    }
    const output = ReactDOMServer.renderToString(<Test />);
    expect(output).toBe(
      `<div data-reactroot=""><span>Hello world</span></div>`,
    );
    container.innerHTML = output;
    ReactDOM.hydrate(<Test />, container);
    Scheduler.unstable_flushAll();
    dispatchClickEvent(spanRef.current);
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
      const click = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click.setListener(buttonRef.current, clickEvent);
      });

      return (
        <button ref={buttonRef}>
          <div ref={divRef}>Click me!</div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

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
    Scheduler.unstable_flushAll();

    dispatchClickEvent(divElement);
    expect(clickEvent).toBeCalledTimes(1);

    // Re-rendering the container and clicking should work
    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

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

    function Test2({clickEvent2}) {
      const click = ReactDOM.unstable_useEvent('click', clickEvent2);

      React.useEffect(() => {
        click.setListener(buttonRef.current, clickEvent2);
      });

      return (
        <button ref={buttonRef}>
          <div ref={divRef}>Click me!</div>
        </button>
      );
    }

    let clickEvent2 = jest.fn();
    ReactDOM.render(<Test2 clickEvent2={clickEvent2} />, container);
    Scheduler.unstable_flushAll();

    divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(clickEvent2).toBeCalledTimes(1);

    // Reset the function we pass in, so it's different
    clickEvent2 = jest.fn();
    ReactDOM.render(<Test2 clickEvent2={clickEvent2} />, container);
    Scheduler.unstable_flushAll();

    divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(clickEvent2).toBeCalledTimes(1);
  });

  it('should correctly work for a basic "click" listener on the outer target', () => {
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
      const click = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click.setListener(divRef.current, clickEvent);
      });

      return (
        <button ref={buttonRef}>
          <div ref={divRef}>Click me!</div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

    expect(container.innerHTML).toBe('<button><div>Click me!</div></button>');

    // Clicking the button should trigger the event callback
    let divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(log[0]).toEqual({
      eventPhase: 3,
      type: 'click',
      currentTarget: divRef.current,
      target: divRef.current,
    });

    // Unmounting the container and clicking should not work
    ReactDOM.render(null, container);
    dispatchClickEvent(divElement);
    expect(clickEvent).toBeCalledTimes(1);

    // Re-rendering the container and clicking should work
    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

    divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(clickEvent).toBeCalledTimes(2);

    // Clicking the button should not work
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(clickEvent).toBeCalledTimes(2);
  });

  it('should correctly handle many nested target listeners', () => {
    const buttonRef = React.createRef();
    const targetListerner1 = jest.fn();
    const targetListerner2 = jest.fn();
    const targetListerner3 = jest.fn();
    const targetListerner4 = jest.fn();

    function Test() {
      const click1 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click2 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click3 = ReactDOM.unstable_useEvent('click');
      const click4 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(buttonRef.current, targetListerner1);
        click2.setListener(buttonRef.current, targetListerner2);
        click3.setListener(buttonRef.current, targetListerner3);
        click4.setListener(buttonRef.current, targetListerner4);
      });

      return <button ref={buttonRef}>Click me!</button>;
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(targetListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
    expect(targetListerner3).toHaveBeenCalledTimes(1);
    expect(targetListerner4).toHaveBeenCalledTimes(1);

    function Test2() {
      const click1 = ReactDOM.unstable_useEvent('click');
      const click2 = ReactDOM.unstable_useEvent('click');
      const click3 = ReactDOM.unstable_useEvent('click');
      const click4 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(buttonRef.current, targetListerner1);
        click2.setListener(buttonRef.current, targetListerner2);
        click3.setListener(buttonRef.current, targetListerner3);
        click4.setListener(buttonRef.current, targetListerner4);
      });

      return <button ref={buttonRef}>Click me!</button>;
    }

    ReactDOM.render(<Test2 />, container);
    Scheduler.unstable_flushAll();

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(targetListerner1).toHaveBeenCalledTimes(2);
    expect(targetListerner2).toHaveBeenCalledTimes(2);
    expect(targetListerner3).toHaveBeenCalledTimes(2);
    expect(targetListerner4).toHaveBeenCalledTimes(2);
  });

  it('should correctly work for a basic "click" window listener', () => {
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
      const click = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click.setListener(window, clickEvent);
      });

      return <button>Click anything!</button>;
    }
    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

    expect(container.innerHTML).toBe('<button>Click anything!</button>');

    // Clicking outside the button should trigger the event callback
    dispatchClickEvent(document.body);
    expect(log[0]).toEqual({
      eventPhase: 3,
      type: 'click',
      currentTarget: window,
      target: document.body,
    });

    // Unmounting the container and clicking should not work
    ReactDOM.render(null, container);
    Scheduler.unstable_flushAll();

    dispatchClickEvent(document.body);
    expect(clickEvent).toBeCalledTimes(1);

    // Re-rendering and clicking the body should work again
    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

    dispatchClickEvent(document.body);
    expect(clickEvent).toBeCalledTimes(2);
  });

  it('should correctly handle event propagation in the correct order', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    const log = [];

    function Test() {
      // Window
      const click1 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click2 = ReactDOM.unstable_useEvent('click');
      // Div
      const click3 = ReactDOM.unstable_useEvent('click');
      const click4 = ReactDOM.unstable_useEvent('click', {capture: true});
      // Button
      const click5 = ReactDOM.unstable_useEvent('click');
      const click6 = ReactDOM.unstable_useEvent('click', {capture: true});

      React.useEffect(() => {
        click1.setListener(window, e => {
          log.push({
            bound: false,
            delegated: true,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        });
        click2.setListener(window, e => {
          log.push({
            bound: false,
            delegated: true,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        });
        click3.setListener(divRef.current, e => {
          log.push({
            bound: true,
            delegated: false,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        });
        click4.setListener(divRef.current, e => {
          log.push({
            bound: true,
            delegated: false,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        });
        click5.setListener(buttonRef.current, e => {
          log.push({
            bound: true,
            delegated: false,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        });
        click6.setListener(buttonRef.current, e => {
          log.push({
            bound: true,
            delegated: false,
            eventPhase: e.eventPhase,
            currentTarget: e.currentTarget,
            target: e.target,
          });
        });
      });

      return (
        <button ref={buttonRef}>
          <div ref={divRef}>Click me!</div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

    let divElement = divRef.current;
    dispatchClickEvent(divElement);

    expect(log).toEqual([
      {
        bound: false,
        delegated: true,
        eventPhase: 1,
        currentTarget: window,
        target: divRef.current,
      },
      {
        bound: true,
        delegated: false,
        eventPhase: 1,
        currentTarget: buttonRef.current,
        target: divRef.current,
      },
      {
        bound: true,
        delegated: false,
        eventPhase: 1,
        currentTarget: divRef.current,
        target: divRef.current,
      },
      {
        bound: true,
        delegated: false,
        eventPhase: 3,
        currentTarget: divRef.current,
        target: divRef.current,
      },
      {
        bound: true,
        delegated: false,
        eventPhase: 3,
        currentTarget: buttonRef.current,
        target: divRef.current,
      },
      {
        bound: false,
        delegated: true,
        eventPhase: 3,
        currentTarget: window,
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
      const click1 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click2 = ReactDOM.unstable_useEvent('click');
      const click3 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(buttonRef.current, targetListerner1);
        click2.setListener(buttonRef.current, targetListerner2);
        click3.setListener(window, targetListerner1);
      });

      return <button ref={buttonRef}>Click me!</button>;
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

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
      const click1 = ReactDOM.unstable_useEvent('click', {
        bind: buttonRef,
      });
      const click2 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(buttonRef.current, clickEvent);
        click2.setListener(divRef.current, e => {
          e.stopPropagation();
        });
      });

      return (
        <button ref={buttonRef}>
          <div ref={divRef}>Click me!</div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

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
      const click1 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click2 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click3 = ReactDOM.unstable_useEvent('click');
      const click4 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(buttonRef.current, targetListerner1);
        click2.setListener(buttonRef.current, targetListerner2);
        click3.setListener(buttonRef.current, targetListerner3);
        click4.setListener(buttonRef.current, targetListerner4);
      });

      return <button ref={buttonRef}>Click me!</button>;
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

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
      const click1 = ReactDOM.unstable_useEvent('click');
      const click2 = ReactDOM.unstable_useEvent('click');
      const click3 = ReactDOM.unstable_useEvent('click');
      const click4 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(buttonRef.current, targetListerner1);
        click2.setListener(buttonRef.current, targetListerner2);
        click3.setListener(buttonRef.current, targetListerner3);
        click4.setListener(buttonRef.current, targetListerner4);
      });

      return <button ref={buttonRef}>Click me!</button>;
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

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
      const click1 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click2 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click3 = ReactDOM.unstable_useEvent('click');
      const click4 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(window, rootListerner1);
        click2.setListener(buttonRef.current, targetListerner1);
        click3.setListener(window, rootListerner2);
        click4.setListener(buttonRef.current, targetListerner2);
      });

      return <button ref={buttonRef}>Click me!</button>;
    }

    ReactDOM.render(<Test />, container);
    Scheduler.unstable_flushAll();

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(rootListerner1).toHaveBeenCalledTimes(1);
    expect(targetListerner1).toHaveBeenCalledTimes(0);
    expect(targetListerner2).toHaveBeenCalledTimes(1);
    expect(rootListerner2).toHaveBeenCalledTimes(0);
  });

  it('should correctly handle stopPropagation for delegated listeners', () => {
    const buttonRef = React.createRef();
    const rootListerner1 = jest.fn(e => e.stopPropagation());
    const rootListerner2 = jest.fn();
    const rootListerner3 = jest.fn(e => e.stopPropagation());
    const rootListerner4 = jest.fn();

    function Test() {
      const click1 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click2 = ReactDOM.unstable_useEvent('click', {capture: true});
      const click3 = ReactDOM.unstable_useEvent('click');
      const click4 = ReactDOM.unstable_useEvent('click');

      React.useEffect(() => {
        click1.setListener(window, rootListerner1);
        click2.setListener(window, rootListerner2);
        click3.setListener(window, rootListerner3);
        click4.setListener(window, rootListerner4);
      });

      return <button ref={buttonRef}>Click me!</button>;
    }

    ReactDOM.render(<Test />, container);

    Scheduler.unstable_flushAll();

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(rootListerner1).toHaveBeenCalledTimes(1);
    expect(rootListerner2).toHaveBeenCalledTimes(1);
    expect(rootListerner3).toHaveBeenCalledTimes(1);
    expect(rootListerner4).toHaveBeenCalledTimes(1);
  });

  it.experimental('should work with concurrent mode updates', async () => {
    const log = [];
    const ref = React.createRef();

    function Test({counter}) {
      const click = ReactDOM.unstable_useEvent('click');

      React.useLayoutEffect(() => {
        click.setListener(ref.current, () => {
          log.push({counter});
        });
      });

      Scheduler.unstable_yieldValue('Test');
      return <button ref={ref}>Press me</button>;
    }

    let root = ReactDOM.createRoot(container);
    root.render(<Test counter={0} />);

    // Dev double-render
    if (__DEV__) {
      expect(Scheduler).toFlushAndYield(['Test', 'Test']);
    } else {
      expect(Scheduler).toFlushAndYield(['Test']);
    }

    // Click the button
    dispatchClickEvent(ref.current);
    expect(log).toEqual([{counter: 0}]);

    // Clear log
    log.length = 0;

    // Increase counter
    root.render(<Test counter={1} />);
    // Yield before committing
    // Dev double-render
    if (__DEV__) {
      expect(Scheduler).toFlushAndYieldThrough(['Test', 'Test']);
    } else {
      expect(Scheduler).toFlushAndYieldThrough(['Test']);
    }

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
