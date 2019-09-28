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
  rootEventTypes,
  targetEventTypes,
  onMount,
  onUnmount,
  getInitialState,
  targetPortalPropagation,
}) {
  return React.unstable_createResponder('TestEventResponder', {
    targetEventTypes,
    rootEventTypes,
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

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableFlareAPI = true;
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
    ReactFeatureFlags.enableFlareAPI = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    const TestResponder = createEventResponder({});

    function Test() {
      const listener = React.unstable_useResponder(TestResponder, {});

      return <div listeners={listener}>Hello world</div>;
    }
    const renderer = ReactTestRenderer.create(<Test />);
    expect(renderer).toMatchRenderedOutput(<div>Hello world</div>);
  });

  it('can render correctly with the ReactDOMServer', () => {
    const TestResponder = createEventResponder({});

    function Test() {
      const listener = React.unstable_useResponder(TestResponder, {});

      return <div listeners={listener}>Hello world</div>;
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
      const listener = React.unstable_useResponder(TestResponder, {});

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
          passiveSupported: event.passiveSupported,
          phase: 'bubble',
        });
      },
    });

    function Test() {
      const listener = React.unstable_useResponder(TestResponder, {});

      return (
        <button ref={buttonRef} listeners={listener}>
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
    // JSDOM does not support passive events, so this will be false
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
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
          passiveSupported: event.passiveSupported,
          phase: 'bubble',
        });
      },
    });

    function Test() {
      const listener = React.unstable_useResponder(TestResponder, {});

      return (
        <button ref={buttonRef} listeners={listener}>
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
        passiveSupported: true,
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
          passiveSupported: event.passiveSupported,
          phase: 'bubble',
        });
      },
    });

    function Test() {
      const listener = React.unstable_useResponder(TestResponder, {});
      const listener2 = React.unstable_useResponder(TestResponder, {});

      return (
        <button ref={buttonRef} listeners={[listener, listener2]}>
          Click me!
        </button>
      );
    }

    expect(() => {
      ReactDOM.render(<Test />, container);
    }).toWarnDev(
      'Duplicate event responder "TestEventResponder" found in event listeners. ' +
        'Event listeners passed to elements cannot use the same event responder more than once.',
    );

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(1);
    expect(eventLog.length).toBe(1);
    // JSDOM does not support passive events, so this will be false
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
        phase: 'bubble',
      },
    ]);

    eventLog = [];

    function Test2() {
      const listener = React.unstable_useResponder(TestResponder, {});

      return (
        <div listeners={listener}>
          <button ref={buttonRef} listeners={listener}>
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
        passive: false,
        passiveSupported: false,
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
      const listener = React.unstable_useResponder(TestResponderA, {});
      const listener2 = React.unstable_useResponder(TestResponderB, {});

      return (
        <button ref={buttonRef} listeners={[listener, listener2]}>
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
      const listener = React.unstable_useResponder(TestResponderA, {});
      const listener2 = React.unstable_useResponder(TestResponderB, {});

      return (
        <div listeners={listener}>
          <button ref={buttonRef} listeners={listener2}>
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
      const listener = React.unstable_useResponder(TestResponder, {name: 'A'});
      const listener2 = React.unstable_useResponder(TestResponder, {name: 'B'});
      return (
        <div listeners={listener}>
          <button ref={buttonRef} listeners={listener2}>
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
      const listener = React.unstable_useResponder(TestResponder, {
        onMagicClick: handleMagicEvent,
      });

      return (
        <button ref={buttonRef} listeners={listener}>
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

  it('async event dispatching works', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    function handleEvent(event, context, props, phase) {
      const pressEvent = {
        target: event.target,
        type: 'press',
        phase,
        timeStamp: context.getTimeStamp(),
      };
      context.dispatchEvent(pressEvent, props.onPress, DiscreteEvent);

      context.setTimeout(() => {
        const longPressEvent = {
          target: event.target,
          type: 'longpress',
          phase,
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(longPressEvent, props.onLongPress, DiscreteEvent);

        const longPressChangeEvent = {
          target: event.target,
          type: 'longpresschange',
          phase,
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(
          longPressChangeEvent,
          props.onLongPressChange,
          DiscreteEvent,
        );
      }, 500);
    }

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        handleEvent(event, context, props, 'bubble');
      },
    });

    function log(msg) {
      eventLog.push(msg);
    }

    const Test = () => {
      const listener = React.unstable_useResponder(TestResponder, {
        onPress: e => log('press ' + e.phase),
        onLongPress: e => log('longpress ' + e.phase),
        onLongPressChange: e => log('longpresschange ' + e.phase),
      });

      return (
        <button ref={buttonRef} listeners={listener}>
          Click me!
        </button>
      );
    };

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    jest.runAllTimers();

    expect(eventLog).toEqual([
      'press bubble',
      'longpress bubble',
      'longpresschange bubble',
    ]);
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
      const listener = React.unstable_useResponder(TestResponder, {});
      const listener2 = React.unstable_useResponder(TestResponder2, {});
      if (toggle) {
        return <button listeners={[listener2, listener]} />;
      }
      return <button listeners={[listener, listener2]} />;
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
      const listener = React.unstable_useResponder(TestResponder, {});
      if (test === 0) {
        return <button listeners={[listener]} />;
      } else if (test === 1) {
        return <button listeners={null} />;
      } else if (test === 2) {
        return <button listeners={[]} />;
      } else if (test === 3) {
        return <button />;
      } else if (test === 4) {
        return <button listeners={listener} />;
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
      const listener = React.unstable_useResponder(TestResponder, {});
      return <button listeners={listener} />;
    };

    ReactDOM.render(<Test />, container);
    ReactDOM.render(null, container);
    expect(counter).toEqual(5);
  });

  it('the event responder root listeners should fire on a root click event', () => {
    let eventResponderFiredCount = 0;
    let eventLog = [];

    const TestResponder = createEventResponder({
      rootEventTypes: ['click'],
      onRootEvent: event => {
        eventResponderFiredCount++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
          phase: 'root',
        });
      },
    });

    const Test = () => {
      const listener = React.unstable_useResponder(TestResponder, {});
      return <button listeners={listener}>Click me!</button>;
    };

    ReactDOM.render(<Test />, container);
    expect(container.innerHTML).toBe('<button>Click me!</button>');

    // Clicking the button should trigger the event responder onEvent() twice
    dispatchClickEvent(document.body);
    expect(eventResponderFiredCount).toBe(1);
    expect(eventLog.length).toBe(1);
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
        phase: 'root',
      },
    ]);
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
          passiveSupported: event.passiveSupported,
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
          passiveSupported: event.passiveSupported,
        });
      },
    });

    const Test = () => {
      const listener = React.unstable_useResponder(TestResponderA, {});
      const listener2 = React.unstable_useResponder(TestResponderB, {});

      return (
        <div listeners={listener}>
          <button ref={buttonRef} listeners={listener2}>
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
        passiveSupported: false,
      },
      {
        name: 'click',
        passive: false,
        passiveSupported: true,
      },
    ]);
  });

  it('the event responder root listeners should correctly fire for only their events', () => {
    let clickEventComponent1Fired = 0;
    let clickEventComponent2Fired = 0;
    let eventLog = [];

    const TestResponderA = createEventResponder({
      rootEventTypes: ['click_active'],
      onRootEvent: event => {
        clickEventComponent1Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    });

    const TestResponderB = createEventResponder({
      rootEventTypes: ['click'],
      onRootEvent: event => {
        clickEventComponent2Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    });

    const Test = () => {
      const listener = React.unstable_useResponder(TestResponderA, {});
      const listener2 = React.unstable_useResponder(TestResponderB, {});

      return (
        <div listeners={listener}>
          <button listeners={listener2}>Click me!</button>
        </div>
      );
    };

    ReactDOM.render(<Test />, container);

    dispatchClickEvent(document.body);

    expect(clickEventComponent1Fired).toBe(1);
    expect(clickEventComponent2Fired).toBe(1);
    expect(eventLog.length).toBe(2);
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
      },
      {
        name: 'click',
        passive: false,
        passiveSupported: true,
      },
    ]);

    ReactDOM.render(<Test />, container);
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
      const listener = React.unstable_useResponder(TestResponder, {
        onClick: handler,
      });

      return (
        <button listeners={listener} ref={buttonRef}>
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
    }).toWarnDev(
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
    }).toWarnDev(
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
    }).toWarnDev(
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
      const listener = React.unstable_useResponder(TestResponder, {
        onFoo: e => eventLogs.push('hook'),
      });

      return <button ref={buttonRef} listeners={listener} />;
    };

    ReactDOM.render(<Test />, container);
    buttonRef.current.dispatchEvent(createEvent('foo'));
    expect(eventLogs).toEqual(['hook']);

    // Clear events
    eventLogs.length = 0;

    const Test2 = () => {
      const listener = React.unstable_useResponder(TestResponder, {
        onFoo: e => eventLogs.push('hook'),
      });

      return <button ref={buttonRef} listeners={listener} />;
    };

    ReactDOM.render(<Test2 />, container);
    buttonRef.current.dispatchEvent(createEvent('foobar'));
  });

  it('should work with concurrent mode updates', async () => {
    const log = [];
    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent(event, context, props) {
        log.push(props);
      },
    });
    const ref = React.createRef();

    function Test({counter}) {
      const listener = React.unstable_useResponder(TestResponder, {counter});

      return (
        <button listeners={listener} ref={ref}>
          Press me
        </button>
      );
    }

    let root = ReactDOM.unstable_createRoot(container);
    let batch = root.createBatch();
    batch.render(<Test counter={0} />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();
    batch.commit();

    // Click the button
    dispatchClickEvent(ref.current);
    expect(log).toEqual([{counter: 0}]);

    // Clear log
    log.length = 0;

    // Increase counter
    batch = root.createBatch();
    batch.render(<Test counter={1} />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Click the button again
    dispatchClickEvent(ref.current);
    expect(log).toEqual([{counter: 0}]);

    // Clear log
    log.length = 0;

    // Commit
    batch.commit();
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
      const listener = React.unstable_useResponder(TestResponder, {
        onClick: logEvent,
      });
      return <button ref={ref} listeners={listener} />;
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
      const listener = React.unstable_useResponder(TestResponder, {});
      return (
        <div listeners={listener}>
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
      const listener = React.unstable_useResponder(TestResponder, {});
      return (
        <div listeners={listener}>
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
