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

// FIXME: What should the public API be for setting an event's priority? Right
// now it's an enum but is that what we want? Hard coding this for now.
const DiscreteEvent = 0;

function createReactEventComponent({
  targetEventTypes,
  rootEventTypes,
  createInitialState,
  onEvent,
  onEventCapture,
  onRootEvent,
  onMount,
  onUnmount,
  onOwnershipChange,
  stopLocalPropagation,
  allowMultipleHostChildren,
}) {
  const testEventResponder = {
    targetEventTypes,
    rootEventTypes,
    createInitialState,
    onEvent,
    onEventCapture,
    onRootEvent,
    onMount,
    onUnmount,
    onOwnershipChange,
    stopLocalPropagation: stopLocalPropagation || false,
    allowMultipleHostChildren: allowMultipleHostChildren || false,
  };

  return {
    $$typeof: Symbol.for('react.event_component'),
    displayName: 'TestEventComponent',
    props: null,
    responder: testEventResponder,
  };
}

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
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('the event responder event listeners should fire on click event', () => {
    let eventResponderFiredCount = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent({
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
      onEventCapture: (event, context, props) => {
        eventResponderFiredCount++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
          phase: 'capture',
        });
      },
    });

    const Test = () => (
      <ClickEventComponent>
        <button ref={buttonRef}>Click me!</button>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);
    expect(container.innerHTML).toBe('<button>Click me!</button>');

    // Clicking the button should trigger the event responder onEvent() twice
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(2);
    expect(eventLog.length).toBe(2);
    // JSDOM does not support passive events, so this will be false
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
        phase: 'capture',
      },
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
    expect(eventResponderFiredCount).toBe(2);

    // Re-rendering the container and clicking should increase the counters again
    ReactDOM.render(<Test />, container);
    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(4);
  });

  it('the event responder event listeners should fire on click event (passive events forced)', () => {
    // JSDOM does not support passive events, so this manually overrides the value to be true
    const checkPassiveEvents = require('react-dom/src/events/checkPassiveEvents');
    checkPassiveEvents.passiveBrowserEventsSupported = true;

    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
          phase: 'bubble',
        });
      },
      onEventCapture: (event, context, props) => {
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
          phase: 'capture',
        });
      },
    });

    const Test = () => (
      <ClickEventComponent>
        <button ref={buttonRef}>Click me!</button>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventLog.length).toBe(2);
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: true,
        passiveSupported: true,
        phase: 'capture',
      },
      {
        name: 'click',
        passive: true,
        passiveSupported: true,
        phase: 'bubble',
      },
    ]);
  });

  it('nested event responders and their event listeners should fire multiple times', () => {
    let eventResponderFiredCount = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent({
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
      onEventCapture: (event, context, props) => {
        eventResponderFiredCount++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
          phase: 'capture',
        });
      },
    });

    const Test = () => (
      <ClickEventComponent>
        <ClickEventComponent>
          <button ref={buttonRef}>Click me!</button>
        </ClickEventComponent>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(4);
    expect(eventLog.length).toBe(4);
    // JSDOM does not support passive events, so this will be false
    expect(eventLog).toEqual([
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
        phase: 'capture',
      },
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
        phase: 'capture',
      },
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
        phase: 'bubble',
      },
      {
        name: 'click',
        passive: false,
        passiveSupported: false,
        phase: 'bubble',
      },
    ]);
  });

  it('nested event responders and their event listeners should fire in the correct order', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponentA = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`A [bubble]`);
      },
      onEventCapture: (event, context, props) => {
        eventLog.push(`A [capture]`);
      },
    });

    const ClickEventComponentB = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`B [bubble]`);
      },
      onEventCapture: (event, context, props) => {
        eventLog.push(`B [capture]`);
      },
    });

    const Test = () => (
      <ClickEventComponentA>
        <ClickEventComponentB>
          <button ref={buttonRef}>Click me!</button>
        </ClickEventComponentB>
      </ClickEventComponentA>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual([
      'A [capture]',
      'B [capture]',
      'B [bubble]',
      'A [bubble]',
    ]);
  });

  it('nested event responders should fire in the correct order without stopLocalPropagation', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`${props.name} [bubble]`);
      },
      onEventCapture: (event, context, props) => {
        eventLog.push(`${props.name} [capture]`);
      },
      stopLocalPropagation: false,
    });

    const Test = () => (
      <ClickEventComponent name="A">
        <ClickEventComponent name="B">
          <button ref={buttonRef}>Click me!</button>
        </ClickEventComponent>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual([
      'A [capture]',
      'B [capture]',
      'B [bubble]',
      'A [bubble]',
    ]);
  });

  it('nested event responders should fire in the correct order with stopLocalPropagation', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`${props.name} [bubble]`);
      },
      onEventCapture: (event, context, props) => {
        eventLog.push(`${props.name} [capture]`);
      },
      stopLocalPropagation: true,
    });

    const Test = () => (
      <ClickEventComponent name="A">
        <ClickEventComponent name="B">
          <button ref={buttonRef}>Click me!</button>
        </ClickEventComponent>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['A [capture]', 'B [bubble]']);
  });

  it('custom event dispatching for click -> magicClick works', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        if (props.onMagicClick) {
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
        }
      },
      onEventCapture: (event, context, props) => {
        if (props.onMagicClick) {
          const syntheticEvent = {
            target: event.target,
            type: 'magicclick',
            phase: 'capture',
            timeStamp: context.getTimeStamp(),
          };
          context.dispatchEvent(
            syntheticEvent,
            props.onMagicClick,
            DiscreteEvent,
          );
        }
      },
    });

    function handleMagicEvent(e) {
      eventLog.push('magic event fired', e.type, e.phase);
    }

    const Test = () => (
      <ClickEventComponent onMagicClick={handleMagicEvent}>
        <button ref={buttonRef}>Click me!</button>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual([
      'magic event fired',
      'magicclick',
      'capture',
      'magic event fired',
      'magicclick',
      'bubble',
    ]);
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
        if (props.onLongPress) {
          const longPressEvent = {
            target: event.target,
            type: 'longpress',
            phase,
            timeStamp: context.getTimeStamp(),
          };
          context.dispatchEvent(
            longPressEvent,
            props.onLongPress,
            DiscreteEvent,
          );
        }

        if (props.onLongPressChange) {
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
        }
      }, 500);
    }

    const LongPressEventComponent = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        handleEvent(event, context, props, 'bubble');
      },
      onEventCapture: (event, context, props) => {
        handleEvent(event, context, props, 'capture');
      },
    });

    function log(msg) {
      eventLog.push(msg);
    }

    const Test = () => (
      <LongPressEventComponent
        onPress={e => log('press ' + e.phase)}
        onLongPress={e => log('longpress ' + e.phase)}
        onLongPressChange={e => log('longpresschange ' + e.phase)}>
        <button ref={buttonRef}>Click me!</button>
      </LongPressEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    jest.runAllTimers();

    expect(eventLog).toEqual([
      'press capture',
      'press bubble',
      'longpress capture',
      'longpresschange capture',
      'longpress bubble',
      'longpresschange bubble',
    ]);
  });

  it('the event responder onMount() function should fire', () => {
    let onMountFired = 0;

    const EventComponent = createReactEventComponent({
      targetEventTypes: [],
      onMount: () => {
        onMountFired++;
      },
    });

    const Test = () => (
      <EventComponent>
        <button />
      </EventComponent>
    );

    ReactDOM.render(<Test />, container);
    expect(onMountFired).toEqual(1);
  });

  it('the event responder onUnmount() function should fire', () => {
    let onUnmountFired = 0;

    const EventComponent = createReactEventComponent({
      targetEventTypes: [],
      onUnmount: () => {
        onUnmountFired++;
      },
    });

    const Test = () => (
      <EventComponent>
        <button />
      </EventComponent>
    );

    ReactDOM.render(<Test />, container);
    ReactDOM.render(null, container);
    expect(onUnmountFired).toEqual(1);
  });

  it('the event responder onUnmount() function should fire with state', () => {
    let counter = 0;

    const EventComponent = createReactEventComponent({
      targetEventTypes: [],
      createInitialState: () => ({
        incrementAmount: 5,
      }),
      onUnmount: (context, props, state) => {
        counter += state.incrementAmount;
      },
    });

    const Test = () => (
      <EventComponent>
        <button />
      </EventComponent>
    );

    ReactDOM.render(<Test />, container);
    ReactDOM.render(null, container);
    expect(counter).toEqual(5);
  });

  it('the event responder onOwnershipChange() function should fire', () => {
    let onOwnershipChangeFired = 0;
    let ownershipGained = false;
    const buttonRef = React.createRef();

    const EventComponent = createReactEventComponent({
      targetEventTypes: ['click'],
      onEvent: (event, context, props, state) => {
        ownershipGained = context.requestGlobalOwnership();
      },
      onOwnershipChange: () => {
        onOwnershipChangeFired++;
      },
    });

    const Test = () => (
      <EventComponent>
        <button ref={buttonRef} />
      </EventComponent>
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

    const ClickEventComponent = createReactEventComponent({
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
      <ClickEventComponent>
        <button>Click me!</button>
      </ClickEventComponent>
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

  it('isTargetWithinEventResponderScope works', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    const log = [];

    const EventComponent = createReactEventComponent({
      targetEventTypes: ['pointerout'],
      onEvent: (event, context) => {
        const isWithin = context.isTargetWithinEventResponderScope(
          event.nativeEvent.relatedTarget,
        );
        log.push(isWithin);
      },
      allowMultipleHostChildren: true,
    });

    const Test = () => (
      <EventComponent>
        <div ref={divRef} />
        <EventComponent>
          <button ref={buttonRef}>Click me!</button>
        </EventComponent>
      </EventComponent>
    );
    ReactDOM.render(<Test />, container);

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

    buttonRef.current.dispatchEvent(
      createEvent('pointerout', {relatedTarget: divRef.current}),
    );
    divRef.current.dispatchEvent(
      createEvent('pointerout', {relatedTarget: buttonRef.current}),
    );

    expect(log).toEqual([false, true, false]);
  });

  it('the event responder target listeners should correctly fire for only their events', () => {
    let clickEventComponent1Fired = 0;
    let clickEventComponent2Fired = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent1 = createReactEventComponent({
      targetEventTypes: [{name: 'click', passive: false, capture: false}],
      onEvent: event => {
        clickEventComponent1Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    });

    const ClickEventComponent2 = createReactEventComponent({
      targetEventTypes: [{name: 'click', passive: true, capture: false}],
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
      <ClickEventComponent1>
        <ClickEventComponent2>
          <button ref={buttonRef}>Click me!</button>
        </ClickEventComponent2>
      </ClickEventComponent1>
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

    const ClickEventComponent1 = createReactEventComponent({
      rootEventTypes: [{name: 'click', passive: false, capture: false}],
      onRootEvent: event => {
        clickEventComponent1Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    });

    const ClickEventComponent2 = createReactEventComponent({
      rootEventTypes: [{name: 'click', passive: true, capture: false}],
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
      <ClickEventComponent1>
        <ClickEventComponent2>
          <button>Click me!</button>
        </ClickEventComponent2>
      </ClickEventComponent1>
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
    const ClickEventComponent = createReactEventComponent({
      rootEventTypes: ['click'],
      onRootEvent: (event, context, props) => {
        const syntheticEvent = {
          target: event.target,
          type: 'click',
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(syntheticEvent, props.onClick, DiscreteEvent);
      },
    });

    let handler;
    const Test = () => (
      <ClickEventComponent onClick={handler}>
        <button>Click me!</button>
      </ClickEventComponent>
    );
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
    expect(() => {
      handler = event => {
        return event.defaultPrevented;
      };
      ReactDOM.render(<Test />, container);
      dispatchClickEvent(document.body);
    }).toWarnDev(
      'Warning: defaultPrevented is not available on event objects created from event responder modules ' +
        '(React Flare).' +
        ' Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.defaultPrevented }`',
      {withoutStack: true},
    );

    expect(container.innerHTML).toBe('<button>Click me!</button>');
  });

  it('should warn if multiple host components are detected without allowMultipleHostChildren', () => {
    const EventComponent = createReactEventComponent({
      targetEventTypes: [],
      onEvent: () => {},
      allowMultipleHostChildren: false,
    });

    const Test = () => (
      <EventComponent>
        <div />
        <div />
      </EventComponent>
    );

    expect(() => {
      ReactDOM.render(<Test />, container);
    }).toWarnDev(
      'Warning: A "<TestEventComponent>" event component cannot contain multiple host children.',
    );

    function Component() {
      return <div />;
    }

    const Test2 = () => (
      <EventComponent>
        <div />
        <Component />
      </EventComponent>
    );

    expect(() => {
      ReactDOM.render(<Test2 />, container);
    }).toWarnDev(
      'Warning: A "<TestEventComponent>" event component cannot contain multiple host children.',
    );
  });

  it('should handle suspended nodes correctly when detecting host components without allowMultipleHostChildren', () => {
    const EventComponent = createReactEventComponent({
      targetEventTypes: [],
      onEvent: () => {},
      allowMultipleHostChildren: false,
    });

    function SuspendedComponent() {
      throw Promise.resolve();
    }

    function Component() {
      return (
        <React.Fragment>
          <div />
          <SuspendedComponent />
        </React.Fragment>
      );
    }

    const Test = () => (
      <EventComponent>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Component />
        </React.Suspense>
      </EventComponent>
    );

    ReactDOM.render(<Test />, container);

    function Component2() {
      return (
        <React.Fragment>
          <SuspendedComponent />
        </React.Fragment>
      );
    }

    const Test2 = () => (
      <EventComponent>
        <React.Suspense
          fallback={
            <React.Fragment>
              <div />
              <div />
            </React.Fragment>
          }>
          <Component2 />
        </React.Suspense>
      </EventComponent>
    );

    expect(() => {
      ReactDOM.render(<Test2 />, container);
    }).toWarnDev(
      'Warning: A "<TestEventComponent>" event component cannot contain multiple host children.',
    );
  });

  it('should not warn if multiple host components are detected with allowMultipleHostChildren', () => {
    const EventComponent = createReactEventComponent({
      targetEventTypes: [],
      onEvent: () => {},
      allowMultipleHostChildren: true,
    });

    const Test = () => (
      <EventComponent>
        <div />
        <div />
      </EventComponent>
    );

    ReactDOM.render(<Test />, container);

    function Component() {
      return <div />;
    }

    const Test2 = () => (
      <EventComponent>
        <div />
        <Component />
      </EventComponent>
    );

    ReactDOM.render(<Test2 />, container);
  });
});
