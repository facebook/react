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
  onOwnershipChange,
  getInitialState,
}) {
  return React.unstable_createResponder('TestEventResponder', {
    targetEventTypes,
    rootEventTypes,
    onEvent,
    onRootEvent,
    onMount,
    onUnmount,
    onOwnershipChange,
    getInitialState,
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
    ReactTestRenderer = require('react-test-renderer');
    const TestResponder = createEventResponder({});
    const renderer = ReactTestRenderer.create(
      <div responders={<TestResponder />}>Hello world</div>,
    );
    expect(renderer).toMatchRenderedOutput(<div>Hello world</div>);
  });

  it('can render correctly with the ReactDOMServer', () => {
    const TestResponder = createEventResponder({});
    const output = ReactDOMServer.renderToString(
      <div responders={<TestResponder />}>Hello world</div>,
    );
    expect(output).toBe(`<div data-reactroot="">Hello world</div>`);
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

    const Test = () => (
      <button ref={buttonRef} responders={<TestResponder />}>
        Click me!
      </button>
    );

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

    const Test = () => (
      <button ref={buttonRef} responders={<TestResponder />}>
        Click me!
      </button>
    );

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

    let Test = () => (
      <button
        ref={buttonRef}
        responders={[<TestResponder />, <TestResponder />]}>
        Click me!
      </button>
    );

    ReactDOM.render(<Test />, container);

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

    Test = () => (
      <div responders={<TestResponder />}>
        <button ref={buttonRef} responders={<TestResponder />}>
          Click me!
        </button>
      </div>
    );

    ReactDOM.render(<Test />, container);

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

    let Test = () => (
      <button
        ref={buttonRef}
        responders={[<TestResponderA />, <TestResponderB />]}>
        Click me!
      </button>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['A [bubble]', 'B [bubble]']);

    eventLog = [];

    Test = () => (
      <div responders={<TestResponderA />}>
        <button ref={buttonRef} responders={<TestResponderB />}>
          Click me!
        </button>
      </div>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['B [bubble]', 'A [bubble]']);
  });

  it('nested event responders should fire in the correct order', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`${props.name} [bubble]`);
      },
    });

    const Test = () => (
      <div responders={<TestResponder name="A" />}>
        <button ref={buttonRef} responders={<TestResponder name="B" />}>
          Click me!
        </button>
      </div>
    );

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
        context.dispatchEvent('onMagicClick', syntheticEvent, DiscreteEvent);
      },
    });

    function handleMagicEvent(e) {
      eventLog.push('magic event fired', e.type, e.phase);
    }

    const Test = () => {
      React.unstable_useListener(TestResponder, {
        onMagicClick: handleMagicEvent,
      });

      return (
        <button ref={buttonRef} responders={<TestResponder />}>
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
      context.dispatchEvent('onPress', pressEvent, DiscreteEvent);

      context.setTimeout(() => {
        const longPressEvent = {
          target: event.target,
          type: 'longpress',
          phase,
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent('onLongPress', longPressEvent, DiscreteEvent);

        const longPressChangeEvent = {
          target: event.target,
          type: 'longpresschange',
          phase,
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(
          'onLongPressChange',
          longPressChangeEvent,
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
      React.unstable_useListener(TestResponder, {
        onPress: e => log('press ' + e.phase),
        onLongPress: e => log('longpress ' + e.phase),
        onLongPressChange: e => log('longpresschange ' + e.phase),
      });

      return (
        <button ref={buttonRef} responders={<TestResponder />}>
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

    ReactDOM.render(
      <button responders={[<TestResponder />, <TestResponder2 />]} />,
      container,
    );
    expect(onMountFired).toEqual(2);

    ReactDOM.render(
      <button responders={[<TestResponder2 />, <TestResponder />]} />,
      container,
    );
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

    ReactDOM.render(<button responders={[<TestResponder />]} />, container);
    ReactDOM.render(null, container);
    expect(onUnmountFired).toEqual(1);

    ReactDOM.render(<button responders={[<TestResponder />]} />, container);
    ReactDOM.render(<button responders={null} />, container);
    expect(onUnmountFired).toEqual(2);

    ReactDOM.render(<button responders={[<TestResponder />]} />, container);
    ReactDOM.render(<button responders={[]} />, container);
    expect(onUnmountFired).toEqual(3);

    ReactDOM.render(<button responders={[<TestResponder />]} />, container);
    ReactDOM.render(<button />, container);
    expect(onUnmountFired).toEqual(4);

    ReactDOM.render(<button responders={[<TestResponder />]} />, container);
    ReactDOM.render(<button responders={<TestResponder />} />, container);
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

    const Test = () => <button responders={<TestResponder />} />;

    ReactDOM.render(<Test />, container);
    ReactDOM.render(null, container);
    expect(counter).toEqual(5);
  });

  it('the event responder onOwnershipChange() function should fire', () => {
    let onOwnershipChangeFired = 0;
    let ownershipGained = false;
    const buttonRef = React.createRef();

    const TestResponder = createEventResponder({
      targetEventTypes: ['click'],
      onEvent: (event, context, props, state) => {
        ownershipGained = context.requestGlobalOwnership();
      },
      onOwnershipChange: () => {
        onOwnershipChangeFired++;
      },
    });

    const Test = () => (
      <button ref={buttonRef} responders={<TestResponder />} />
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    jest.runAllTimers();

    expect(ownershipGained).toEqual(true);
    expect(onOwnershipChangeFired).toEqual(1);
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

    const Test = () => (
      <button responders={<TestResponder />}>Click me!</button>
    );

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

    const Test = () => (
      <div responders={<TestResponderA />}>
        <button ref={buttonRef} responders={<TestResponderB />}>
          Click me!
        </button>
      </div>
    );

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

    const Test = () => (
      <div responders={<TestResponderA />}>
        <button responders={<TestResponderB />}>Click me!</button>
      </div>
    );

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
      rootEventTypes: ['click'],
      onRootEvent: (event, context, props) => {
        const syntheticEvent = {
          target: event.target,
          type: 'click',
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent('onClick', syntheticEvent, DiscreteEvent);
      },
    });

    let handler;
    const Test = () => {
      React.unstable_useListener(TestResponder, {
        onClick: handler,
      });

      return <button responders={<TestResponder />}>Click me!</button>;
    };
    expect(() => {
      handler = event => {
        event.preventDefault();
      };
      ReactDOM.render(<Test />, container);
      dispatchClickEvent(document.body);
    }).toWarnDev(
      'Warning: preventDefault() is not available on event objects created from event responder modules ' +
        '(React Flare).' +
        ' Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.preventDefault() }`',
      {withoutStack: true},
    );
    expect(() => {
      handler = event => {
        event.stopPropagation();
      };
      ReactDOM.render(<Test />, container);
      dispatchClickEvent(document.body);
    }).toWarnDev(
      'Warning: stopPropagation() is not available on event objects created from event responder modules ' +
        '(React Flare).' +
        ' Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.stopPropagation() }`',
      {withoutStack: true},
    );
    expect(() => {
      handler = event => {
        event.isDefaultPrevented();
      };
      ReactDOM.render(<Test />, container);
      dispatchClickEvent(document.body);
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
      dispatchClickEvent(document.body);
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
      dispatchClickEvent(document.body);
    }).toWarnDev(
      'Warning: nativeEvent is not available on event objects created from event responder modules ' +
        '(React Flare).' +
        ' Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.nativeEvent }`',
      {withoutStack: true},
    );
    expect(container.innerHTML).toBe('<button>Click me!</button>');
  });

  it('should work with event listener hooks', () => {
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
        context.dispatchEvent('onFoo', fooEvent, DiscreteEvent);
      },
    });

    const Test = () => {
      React.unstable_useListener(TestResponder, {
        onFoo: e => eventLogs.push('hook'),
      });

      return <button ref={buttonRef} responders={<TestResponder />} />;
    };

    ReactDOM.render(<Test />, container);
    buttonRef.current.dispatchEvent(createEvent('foo'));
    expect(eventLogs).toEqual(['hook']);

    // Clear events
    eventLogs.length = 0;

    const Test2 = () => {
      React.unstable_useListener(TestResponder, {
        onFoo: e => eventLogs.push('hook'),
      });

      return <button ref={buttonRef} responders={<TestResponder />} />;
    };

    ReactDOM.render(<Test2 />, container);
    buttonRef.current.dispatchEvent(createEvent('foobar'));
  });
});
