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

// FIXME: What should the public API be for setting an event's priority? Right
// now it's an enum but is that what we want? Hard coding this for now.
const DiscreteEvent = 0;

function createEventResponder({
  onEvent,
  onRootEvent,
  targetEventTypes,
  onMount,
  onUnmount,
  getInitialState,
  targetPortalPropagation,
}) {
  return React.DEPRECATED_createResponder('TestEventResponder', {
    targetEventTypes,
    onEvent,
    onRootEvent,
    onMount,
    onUnmount,
    getInitialState,
    targetPortalPropagation,
  });
}

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

function dispatchEvent(element, type) {
  const event = document.createEvent('Event');
  event.initEvent(type, true, true);
  element.dispatchEvent(event);
}

function dispatchClickEvent(element) {
  dispatchEvent(element, 'click');
}

// This is a new feature in Fiber so I put it in its own test file. It could
// probably move to one of the other test files once it is official.
describe('DOMEventResponderSystem', () => {
  let container;

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;
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
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    const TestResponder = createEventResponder({});

    function Test() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});

      return <div DEPRECATED_flareListeners={listener}>Hello world</div>;
    }
    const renderer = ReactTestRenderer.create(<Test />);
    expect(renderer).toMatchRenderedOutput(<div>Hello world</div>);
  });

  it('can render correctly with the ReactDOMServer', () => {
    const TestResponder = createEventResponder({});

    function Test() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});

      return <div DEPRECATED_flareListeners={listener}>Hello world</div>;
    }
    const output = ReactDOMServer.renderToString(<Test />);
    expect(output).toBe(`<div data-reactroot="">Hello world</div>`);
  });

  it('can render correctly with the ReactDOMServer hydration', () => {
    const onEvent = jest.fn();
    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent,
    });
    const ref = React.createRef();

    function Test() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});

      return (
        <div>
          <span DEPRECATED_flareListeners={listener} ref={ref}>
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
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it('the event responders should fire on click event', () => {
    let eventResponderFiredCount = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventResponderFiredCount++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          phase: 'bubble',
        });
      },
    });

    function Test() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});

      return (
        <button ref={buttonRef} DEPRECATED_flareListeners={listener}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);
    expect(container.innerHTML).toBe('<button>Click me!</button>');

    // Clicking the button should trigger the event responder onEvent() twice
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(1);
    expect(eventLog.length).toBe(1);
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: true,
        phase: 'bubble',
      },
    ]);

    // Unmounting the container and clicking should not increment anything
    ReactDOM.render(null, container);
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(1);

    // Re-rendering the container and clicking should increase the counters again
    ReactDOM.render(<Test />, container);
    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(2);
  });

  it('the event responders should fire on click event (passive events forced)', () => {
    // JSDOM does not support passive events, so this manually overrides the value to be true
    const checkPassiveEvents = require('react-dom/src/events/checkPassiveEvents');
    checkPassiveEvents.passiveBrowserEventsSupported = true;

    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push({
          name: event.type,
          passive: event.passive,
          phase: 'bubble',
        });
      },
    });

    function Test() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});

      return (
        <button ref={buttonRef} DEPRECATED_flareListeners={listener}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventLog.length).toBe(1);
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: true,
        phase: 'bubble',
      },
    ]);
  });

  it('nested event responders should not fire multiple times', () => {
    let eventResponderFiredCount = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventResponderFiredCount++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          phase: 'bubble',
        });
      },
    });

    function Test() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      const listener2 = React.DEPRECATED_useResponder(TestResponder, {});

      return (
        <button
          ref={buttonRef}
          DEPRECATED_flareListeners={[listener, listener2]}>
          Click me!
        </button>
      );
    }

    expect(() => {
      ReactDOM.render(<Test />, container);
    }).toErrorDev(
      'Duplicate event responder "TestEventResponder" found in event listeners. ' +
        'Event listeners passed to elements cannot use the same event responder more than once.',
    );

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(1);
    expect(eventLog.length).toBe(1);
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: true,
        phase: 'bubble',
      },
    ]);

    eventLog = [];

    function Test2() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});

      return (
        <div DEPRECATED_flareListeners={listener}>
          <button ref={buttonRef} DEPRECATED_flareListeners={listener}>
            Click me!
          </button>
        </div>
      );
    }

    ReactDOM.render(<Test2 />, container);

    // Clicking the button should trigger the event responder onEvent()
    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(2);
    expect(eventLog.length).toBe(1);

    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: true,
        phase: 'bubble',
      },
    ]);
  });

  it('nested event responders should fire in the correct order', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponderA = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`A [bubble]`);
      },
    });

    const TestResponderB = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`B [bubble]`);
      },
    });

    function Test() {
      const listener = React.DEPRECATED_useResponder(TestResponderA, {});
      const listener2 = React.DEPRECATED_useResponder(TestResponderB, {});

      return (
        <button
          ref={buttonRef}
          DEPRECATED_flareListeners={[listener, listener2]}>
          Click me!
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['A [bubble]', 'B [bubble]']);

    eventLog = [];

    function Test2() {
      const listener = React.DEPRECATED_useResponder(TestResponderA, {});
      const listener2 = React.DEPRECATED_useResponder(TestResponderB, {});

      return (
        <div DEPRECATED_flareListeners={listener}>
          <button ref={buttonRef} DEPRECATED_flareListeners={listener2}>
            Click me!
          </button>
        </div>
      );
    }

    ReactDOM.render(<Test2 />, container);

    // Clicking the button should trigger the event responder onEvent()
    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['B [bubble]', 'A [bubble]']);
  });

  it('nested event responders should fire in the correct order #2', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`${props.name} [bubble]`);
      },
    });

    const Test = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        name: 'A',
      });
      const listener2 = React.DEPRECATED_useResponder(TestResponder, {
        name: 'B',
      });
      return (
        <div DEPRECATED_flareListeners={listener}>
          <button ref={buttonRef} DEPRECATED_flareListeners={listener2}>
            Click me!
          </button>
        </div>
      );
    };

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['B [bubble]']);
  });

  it('custom event dispatching for click -> magicClick works', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        const syntheticEvent = {
          target: event.target,
          type: 'magicclick',
          phase: 'bubble',
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(
          syntheticEvent,
          props.onMagicClick,
          DiscreteEvent,
        );
      },
    });

    function handleMagicEvent(e) {
      eventLog.push('magic event fired', e.type, e.phase);
    }

    const Test = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        onMagicClick: handleMagicEvent,
      });

      return (
        <button ref={buttonRef} DEPRECATED_flareListeners={listener}>
          Click me!
        </button>
      );
    };

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['magic event fired', 'magicclick', 'bubble']);
  });

  it('the event responder onMount() function should fire', () => {
    let onMountFired = 0;

    const TestResponder = createEventResponder({
      targetEventTypes: [],
      onMount: () => {
        onMountFired++;
      },
    });

    const TestResponder2 = createEventResponder({
      targetEventTypes: [],
      onMount: () => {
        onMountFired++;
      },
    });

    function Test({toggle}) {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      const listener2 = React.DEPRECATED_useResponder(TestResponder2, {});
      if (toggle) {
        return <button DEPRECATED_flareListeners={[listener2, listener]} />;
      }
      return <button DEPRECATED_flareListeners={[listener, listener2]} />;
    }

    ReactDOM.render(<Test />, container);
    expect(onMountFired).toEqual(2);

    ReactDOM.render(<Test toggle={true} />, container);
    expect(onMountFired).toEqual(2);
  });

  it('the event responder onUnmount() function should fire', () => {
    let onUnmountFired = 0;

    const TestResponder = createEventResponder({
      targetEventTypes: [],
      onUnmount: () => {
        onUnmountFired++;
      },
    });

    function Test({test}) {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      if (test === 0) {
        return <button DEPRECATED_flareListeners={[listener]} />;
      } else if (test === 1) {
        return <button DEPRECATED_flareListeners={null} />;
      } else if (test === 2) {
        return <button DEPRECATED_flareListeners={[]} />;
      } else if (test === 3) {
        return <button />;
      } else if (test === 4) {
        return <button DEPRECATED_flareListeners={listener} />;
      }
    }

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(null, container);
    expect(onUnmountFired).toEqual(1);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={1} />, container);
    expect(onUnmountFired).toEqual(2);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={2} />, container);
    expect(onUnmountFired).toEqual(3);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={3} />, container);
    expect(onUnmountFired).toEqual(4);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={4} />, container);
    expect(onUnmountFired).toEqual(4);
  });

  it('the event responder onUnmount() function should fire using scopes', () => {
    let onUnmountFired = 0;

    const TestScope = React.unstable_createScope();
    const TestResponder = createEventResponder({
      targetEventTypes: [],
      onUnmount: () => {
        onUnmountFired++;
      },
    });

    function Test({test}) {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      if (test === 0) {
        return <TestScope DEPRECATED_flareListeners={[listener]} />;
      } else if (test === 1) {
        return <TestScope DEPRECATED_flareListeners={null} />;
      } else if (test === 2) {
        return <TestScope DEPRECATED_flareListeners={[]} />;
      } else if (test === 3) {
        return <TestScope />;
      } else if (test === 4) {
        return <TestScope DEPRECATED_flareListeners={listener} />;
      }
    }

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(null, container);
    expect(onUnmountFired).toEqual(1);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={1} />, container);
    expect(onUnmountFired).toEqual(2);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={2} />, container);
    expect(onUnmountFired).toEqual(3);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={3} />, container);
    expect(onUnmountFired).toEqual(4);

    ReactDOM.render(<Test test={0} />, container);
    ReactDOM.render(<Test test={4} />, container);
    expect(onUnmountFired).toEqual(4);
  });

  it('the event responder onUnmount() function should fire with state', () => {
    let counter = 0;

    const TestResponder = createEventResponder({
      targetEventTypes: [],
      getInitialState: () => ({
        incrementAmount: 5,
      }),
      onUnmount: (context, props, state) => {
        counter += state.incrementAmount;
      },
    });

    const Test = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      return <button DEPRECATED_flareListeners={listener} />;
    };

    ReactDOM.render(<Test />, container);
    ReactDOM.render(null, container);
    expect(counter).toEqual(5);
  });

  it('the event responder target listeners should correctly fire for only their events', () => {
    let clickEventComponent1Fired = 0;
    let clickEventComponent2Fired = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponderA = createEventResponder({
      targetEventTypes: ['click_active'],
      onEvent: event => {
        clickEventComponent1Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
        });
      },
    });

    const TestResponderB = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: event => {
        clickEventComponent2Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
        });
      },
    });

    const Test = () => {
      const listener = React.DEPRECATED_useResponder(TestResponderA, {});
      const listener2 = React.DEPRECATED_useResponder(TestResponderB, {});

      return (
        <div DEPRECATED_flareListeners={listener}>
          <button ref={buttonRef} DEPRECATED_flareListeners={listener2}>
            Click me!
          </button>
        </div>
      );
    };

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(clickEventComponent1Fired).toBe(1);
    expect(clickEventComponent2Fired).toBe(1);
    expect(eventLog.length).toBe(2);
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: false,
      },
      {
        name: 'click',
        passive: false,
      },
    ]);
  });

  it('the event responder system should warn on accessing invalid properties', () => {
    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        const syntheticEvent = {
          target: event.target,
          type: 'click',
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(syntheticEvent, props.onClick, DiscreteEvent);
      },
    });

    let handler;
    let buttonRef = React.createRef();
    const Test = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        onClick: handler,
      });

      return (
        <button DEPRECATED_flareListeners={listener} ref={buttonRef}>
          Click me!
        </button>
      );
    };
    expect(() => {
      handler = event => {
        event.isDefaultPrevented();
      };
      ReactDOM.render(<Test />, container);
      dispatchClickEvent(buttonRef.current);
    }).toErrorDev(
      'Warning: isDefaultPrevented() is not available on event objects created from event responder modules ' +
        '(React Flare).' +
        ' Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.isDefaultPrevented() }`',
      {withoutStack: true},
    );
    expect(() => {
      handler = event => {
        event.isPropagationStopped();
      };
      ReactDOM.render(<Test />, container);
      dispatchClickEvent(buttonRef.current);
    }).toErrorDev(
      'Warning: isPropagationStopped() is not available on event objects created from event responder modules ' +
        '(React Flare).' +
        ' Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.isPropagationStopped() }`',
      {withoutStack: true},
    );
    expect(() => {
      handler = event => {
        return event.nativeEvent;
      };
      ReactDOM.render(<Test />, container);
      dispatchClickEvent(buttonRef.current);
    }).toErrorDev(
      'Warning: nativeEvent is not available on event objects created from event responder modules ' +
        '(React Flare).' +
        ' Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.nativeEvent }`',
      {withoutStack: true},
    );
    expect(container.innerHTML).toBe('<button>Click me!</button>');
  });

  it('should work with event responder hooks', () => {
    const buttonRef = React.createRef();
    const eventLogs = [];
    const TestResponder = createEventResponder({
      targetEventTypes: ['foo'],
      onEvent: (event, context, props) => {
        const fooEvent = {
          target: event.target,
          type: 'foo',
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(fooEvent, props.onFoo, DiscreteEvent);
      },
    });

    const Test = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        onFoo: e => eventLogs.push('hook'),
      });

      return <button ref={buttonRef} DEPRECATED_flareListeners={listener} />;
    };

    ReactDOM.render(<Test />, container);
    buttonRef.current.dispatchEvent(createEvent('foo'));
    expect(eventLogs).toEqual(['hook']);

    // Clear events
    eventLogs.length = 0;

    const Test2 = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        onFoo: e => eventLogs.push('hook'),
      });

      return <button ref={buttonRef} DEPRECATED_flareListeners={listener} />;
    };

    ReactDOM.render(<Test2 />, container);
    buttonRef.current.dispatchEvent(createEvent('foobar'));
  });

  it.experimental('should work with concurrent mode updates', async () => {
    const log = [];
    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent(event, context, props) {
        log.push(props);
      },
    });
    const ref = React.createRef();

    function Test({counter}) {
      const listener = React.DEPRECATED_useResponder(TestResponder, {counter});
      Scheduler.unstable_yieldValue('Test');
      return (
        <button DEPRECATED_flareListeners={listener} ref={ref}>
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

  it('should correctly pass through event properties', () => {
    const timeStamps = [];
    const ref = React.createRef();
    const eventLog = [];
    const logEvent = event => {
      const propertiesWeCareAbout = {
        counter: event.counter,
        target: event.target,
        timeStamp: event.timeStamp,
        type: event.type,
      };
      timeStamps.push(event.timeStamp);
      eventLog.push(propertiesWeCareAbout);
    };
    let counter = 0;

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent(event, context, props) {
        const obj = {
          counter,
          timeStamp: context.getTimeStamp(),
          target: context.getResponderNode(),
          type: 'click-test',
        };
        context.dispatchEvent(obj, props.onClick, DiscreteEvent);
      },
    });

    const Component = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        onClick: logEvent,
      });
      return <button ref={ref} DEPRECATED_flareListeners={listener} />;
    };
    ReactDOM.render(<Component />, container);
    dispatchClickEvent(ref.current);
    counter++;
    dispatchClickEvent(ref.current);
    counter++;
    dispatchClickEvent(ref.current);
    expect(typeof timeStamps[0] === 'number').toBe(true);
    expect(eventLog).toEqual([
      {
        counter: 0,
        target: ref.current,
        timeStamp: timeStamps[0],
        type: 'click-test',
      },
      {
        counter: 1,
        target: ref.current,
        timeStamp: timeStamps[1],
        type: 'click-test',
      },
      {
        counter: 2,
        target: ref.current,
        timeStamp: timeStamps[2],
        type: 'click-test',
      },
    ]);
  });

  it('should not propagate target events through portals by default', () => {
    const buttonRef = React.createRef();
    const onEvent = jest.fn();
    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent,
    });
    const domNode = document.createElement('div');
    document.body.appendChild(domNode);
    const Component = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      return (
        <div DEPRECATED_flareListeners={listener}>
          {ReactDOM.createPortal(<button ref={buttonRef} />, domNode)}
        </div>
      );
    };
    ReactDOM.render(<Component />, container);
    dispatchClickEvent(buttonRef.current);
    document.body.removeChild(domNode);
    expect(onEvent).not.toBeCalled();
  });

  it('should propagate target events through portals when enabled', () => {
    const buttonRef = React.createRef();
    const onEvent = jest.fn();
    const TestResponder = createEventResponder({
      targetPortalPropagation: true,
      targetEventTypes: ['click'],
      onEvent,
    });
    const domNode = document.createElement('div');
    document.body.appendChild(domNode);
    const Component = () => {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      return (
        <div DEPRECATED_flareListeners={listener}>
          {ReactDOM.createPortal(<button ref={buttonRef} />, domNode)}
        </div>
      );
    };
    ReactDOM.render(<Component />, container);
    dispatchClickEvent(buttonRef.current);
    document.body.removeChild(domNode);
    expect(onEvent).toBeCalled();
  });
});
