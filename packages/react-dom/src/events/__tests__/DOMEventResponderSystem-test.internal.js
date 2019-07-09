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

    const Responder = {
      displayName: 'TestResponder',
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
    };

    const Test = () => {
      React.unstable_useResponder(Responder, buttonRef);
      return <button ref={buttonRef}>Click me!</button>;
    };

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

  it('the event responder event listeners should fire on click event (passive events forced)', () => {
    // JSDOM does not support passive events, so this manually overrides the value to be true
    const checkPassiveEvents = require('react-dom/src/events/checkPassiveEvents');
    checkPassiveEvents.passiveBrowserEventsSupported = true;

    let eventLog = [];
    const buttonRef = React.createRef();

    const Responder = {
      displayName: 'TestResponder',
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
          phase: 'bubble',
        });
      },
    };

    const Test = () => {
      React.unstable_useResponder(Responder, buttonRef);
      return <button ref={buttonRef}>Click me!</button>;
    };

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

  it('nested event responders and their event listeners should fire in the correct order', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ResponderA = {
      displayName: 'TestResponder',
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`A [bubble]`);
      },
    };

    const ResponderB = {
      displayName: 'TestResponder',
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`B [bubble]`);
      },
    };

    const ClickEventComponentA = ({children}) => {
      React.unstable_useResponder(ResponderA, buttonRef);
      return children;
    };

    const ClickEventComponentB = ({children}) => {
      React.unstable_useResponder(ResponderB, buttonRef);
      return <button ref={buttonRef}>Click me!</button>;
    };

    const Test = () => (
      <ClickEventComponentA>
        <ClickEventComponentB />
      </ClickEventComponentA>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['B [bubble]', 'A [bubble]']);
  });

  it('nested event responders should not bubble to other responders of same type', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ResponderA = {
      displayName: 'TestResponder',
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(`A [bubble]`);
      },
    };

    const ClickEventComponentA = ({children}) => {
      React.unstable_useResponder(ResponderA, buttonRef);
      return children;
    };

    const ClickEventComponentB = ({children}) => {
      React.unstable_useResponder(ResponderA, buttonRef);
      return <button ref={buttonRef}>Click me!</button>;
    };

    const Test = () => (
      <ClickEventComponentA>
        <ClickEventComponentB />
      </ClickEventComponentA>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['A [bubble]']);
  });

  it('nested event responders should fire in the correct order', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const Responder = {
      displayName: 'TestResponder',
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        eventLog.push(props.id);
      },
    };

    const Test = ({children, ids}) => {
      React.unstable_useResponder(Responder, buttonRef, {id: ids[0]});
      React.unstable_useResponder(Responder, buttonRef, {id: ids[1]});
      React.unstable_useResponder(Responder, buttonRef, {id: ids[2]});
      return <button ref={buttonRef}>Click me!</button>;
    };

    ReactDOM.render(<Test ids={['A', 'B', 'C']} />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['A', 'B', 'C']);

    eventLog = [];

    ReactDOM.render(<Test ids={['C', 'B', 'A']} />, container);

    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);

    expect(eventLog).toEqual(['C', 'B', 'A']);
  });

  it('custom event dispatching for click -> magicClick works', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const Responder = {
      displayName: 'TestResponder',
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
    };

    function handleMagicEvent(e) {
      eventLog.push('magic event fired', e.type, e.phase);
    }

    const Test = ({children}) => {
      React.unstable_useResponder(Responder, buttonRef, {
        onMagicClick: handleMagicEvent,
      });
      return <button ref={buttonRef}>Click me!</button>;
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

    const Responder = {
      displayName: 'TestResponder',
      targetEventTypes: ['click'],
      onEvent: (event, context, props) => {
        handleEvent(event, context, props, 'bubble');
      },
    };

    function log(msg) {
      eventLog.push(msg);
    }

    const Test = ({children}) => {
      const props = {
        onPress: e => log('press ' + e.phase),
        onLongPress: e => log('longpress ' + e.phase),
        onLongPressChange: e => log('longpresschange ' + e.phase),
      };
      React.unstable_useResponder(Responder, buttonRef, props);
      return <button ref={buttonRef}>Click me!</button>;
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

    const Responder = {
      displayName: 'TestResponder',
      onMount: () => {
        onMountFired++;
      },
    };

    const Test = ({children}) => {
      React.unstable_useResponder(Responder, {});
      return <button>Click me!</button>;
    };

    ReactDOM.render(<Test />, container);
    expect(onMountFired).toEqual(1);
  });

  it('the event responder onUnmount() function should fire', () => {
    let onUnmountFired = 0;

    const Responder = {
      displayName: 'TestResponder',
      onUnmount: () => {
        onUnmountFired++;
      },
    };

    const Test = ({children}) => {
      React.unstable_useResponder(Responder, {});
      return <button>Click me!</button>;
    };

    ReactDOM.render(<Test />, container);
    ReactDOM.render(null, container);
    expect(onUnmountFired).toEqual(1);
  });

  it('the event responder onUnmount() function should fire with state', () => {
    let counter = 0;

    const Responder = {
      displayName: 'TestResponder',
      getInitialState: () => ({
        incrementAmount: 5,
      }),
      onUnmount: (context, props, state) => {
        counter += state.incrementAmount;
      },
    };

    const Test = ({children}) => {
      React.unstable_useResponder(Responder, {});
      return <button>Click me!</button>;
    };

    ReactDOM.render(<Test />, container);
    ReactDOM.render(null, container);
    expect(counter).toEqual(5);
  });

  it('the event responder onOwnershipChange() function should fire', () => {
    let onOwnershipChangeFired = 0;
    let ownershipGained = false;
    const buttonRef = React.createRef();

    const Responder = {
      displayName: 'TestResponder',
      targetEventTypes: ['click'],
      onEvent: (event, context, props, state) => {
        ownershipGained = context.requestGlobalOwnership();
      },
      onOwnershipChange: () => {
        onOwnershipChangeFired++;
      },
    };

    const Test = ({children}) => {
      React.unstable_useResponder(Responder, buttonRef);
      return <button ref={buttonRef}>Click me!</button>;
    };

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

    const Responder = {
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
    };

    const Test = ({children}) => {
      const buttonRef = React.useRef(null);
      React.unstable_useResponder(Responder, buttonRef);
      return <button ref={buttonRef}>Click me!</button>;
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

    const Responder1 = {
      rootEventTypes: ['click_active'],
      onRootEvent: event => {
        clickEventComponent1Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    };

    const ClickEventComponent1 = ({children}) => {
      React.unstable_useResponder(Responder1, buttonRef);
      return children;
    };

    const Responder2 = {
      rootEventTypes: ['click'],
      onRootEvent: event => {
        clickEventComponent2Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    };

    const ClickEventComponent2 = ({children}) => {
      React.unstable_useResponder(Responder2, buttonRef);
      return children;
    };

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

    const Responder1 = {
      rootEventTypes: ['click_active'],
      onRootEvent: event => {
        clickEventComponent1Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    };

    const ClickEventComponent1 = ({children}) => {
      React.unstable_useResponder(Responder1, {});
      return children;
    };

    const Responder2 = {
      rootEventTypes: ['click'],
      onRootEvent: event => {
        clickEventComponent2Fired++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    };

    const ClickEventComponent2 = ({children}) => {
      React.unstable_useResponder(Responder2, {});
      return children;
    };

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
    const Responder1 = {
      rootEventTypes: ['click'],
      onRootEvent: (event, context, props) => {
        const syntheticEvent = {
          target: event.target,
          type: 'click',
          timeStamp: context.getTimeStamp(),
        };
        context.dispatchEvent(syntheticEvent, props.onClick, DiscreteEvent);
      },
    };

    const ClickEventComponent = ({children, onClick}) => {
      React.unstable_useResponder(Responder1, {}, {onClick});
      return children;
    };

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
    expect(container.innerHTML).toBe('<button>Click me!</button>');
  });
});
