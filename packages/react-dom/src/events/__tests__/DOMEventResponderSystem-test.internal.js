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

function createReactEventComponent(
  targetEventTypes,
  createInitialState,
  onEvent,
  onUnmount,
  onOwnershipChange,
) {
  const testEventResponder = {
    targetEventTypes,
    createInitialState,
    onEvent,
    onUnmount,
    onOwnershipChange,
  };

  return {
    $$typeof: Symbol.for('react.event_component'),
    displayName: 'TestEventComponent',
    props: null,
    responder: testEventResponder,
  };
}

function dispatchClickEvent(element) {
  const clickEvent = document.createEvent('Event');
  clickEvent.initEvent('click', true, true);
  element.dispatchEvent(clickEvent);
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

  it('the event responder onEvent() function should fire on click event', () => {
    let eventResponderFiredCount = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent(
      ['click'],
      undefined,
      (event, context, props) => {
        eventResponderFiredCount++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    );

    const Test = () => (
      <ClickEventComponent>
        <button ref={buttonRef}>Click me!</button>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);
    expect(container.innerHTML).toBe('<button>Click me!</button>');

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(1);
    expect(eventLog.length).toBe(1);
    // JSDOM does not support passive events, so this will be false
    expect(eventLog[0]).toEqual({
      name: 'click',
      passive: false,
      passiveSupported: false,
    });

    // Unmounting the container and clicking should not increment anything
    ReactDOM.render(null, container);
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(1);

    // Re-rendering the container and clicking should increase the counter again
    ReactDOM.render(<Test />, container);
    buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(2);
  });

  it('the event responder onEvent() function should fire on click event (passive events forced)', () => {
    // JSDOM does not support passive events, so this manually overrides the value to be true
    const checkPassiveEvents = require('react-dom/src/events/checkPassiveEvents');
    checkPassiveEvents.passiveBrowserEventsSupported = true;

    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent(
      ['click'],
      undefined,
      (event, context, props) => {
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    );

    const Test = () => (
      <ClickEventComponent>
        <button ref={buttonRef}>Click me!</button>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventLog.length).toBe(1);
    expect(eventLog[0]).toEqual({
      name: 'click',
      passive: true,
      passiveSupported: true,
    });
  });

  it('nested event responders and their onEvent() function should fire multiple times', () => {
    let eventResponderFiredCount = 0;
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent(
      ['click'],
      undefined,
      (event, context, props) => {
        eventResponderFiredCount++;
        eventLog.push({
          name: event.type,
          passive: event.passive,
          passiveSupported: event.passiveSupported,
        });
      },
    );

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
    expect(eventResponderFiredCount).toBe(2);
    expect(eventLog.length).toBe(2);
    // JSDOM does not support passive events, so this will be false
    expect(eventLog[0]).toEqual({
      name: 'click',
      passive: false,
      passiveSupported: false,
    });
    expect(eventLog[1]).toEqual({
      name: 'click',
      passive: false,
      passiveSupported: false,
    });
  });

  it('nested event responders and their onEvent() should fire in the correct order', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponentA = createReactEventComponent(
      ['click'],
      undefined,
      (context, props) => {
        eventLog.push('A');
      },
    );

    const ClickEventComponentB = createReactEventComponent(
      ['click'],
      undefined,
      (context, props) => {
        eventLog.push('B');
      },
    );

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

    expect(eventLog).toEqual(['B', 'A']);
  });

  it('custom event dispatching for click -> magicClick works', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent(
      ['click'],
      undefined,
      (event, context, props) => {
        if (props.onMagicClick) {
          const syntheticEvent = {
            listener: props.onMagicClick,
            target: event.target,
            type: 'magicclick',
          };
          context.dispatchEvent(syntheticEvent, {discrete: true});
        }
      },
    );

    function handleMagicEvent(e) {
      eventLog.push('magic event fired', e.type);
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

    expect(eventLog).toEqual(['magic event fired', 'magicclick']);
  });

  it('async event dispatching works', () => {
    let eventLog = [];
    const buttonRef = React.createRef();

    const LongPressEventComponent = createReactEventComponent(
      ['click'],
      undefined,
      (event, context, props) => {
        const pressEvent = {
          listener: props.onPress,
          target: event.target,
          type: 'press',
        };
        context.dispatchEvent(pressEvent, {discrete: true});

        context.setTimeout(() => {
          if (props.onLongPress) {
            const longPressEvent = {
              listener: props.onLongPress,
              target: event.target,
              type: 'longpress',
            };
            context.dispatchEvent(longPressEvent, {discrete: true});
          }

          if (props.onLongPressChange) {
            const longPressChangeEvent = {
              listener: props.onLongPressChange,
              target: event.target,
              type: 'longpresschange',
            };
            context.dispatchEvent(longPressChangeEvent, {discrete: true});
          }
        }, 500);
      },
    );

    function log(msg) {
      eventLog.push(msg);
    }

    const Test = () => (
      <LongPressEventComponent
        onPress={() => log('press')}
        onLongPress={() => log('longpress')}
        onLongPressChange={() => log('longpresschange')}>
        <button ref={buttonRef}>Click me!</button>
      </LongPressEventComponent>
    );

    ReactDOM.render(<Test />, container);

    // Clicking the button should trigger the event responder onEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    jest.runAllTimers();

    expect(eventLog).toEqual(['press', 'longpress', 'longpresschange']);
  });

  it('the event responder onUnmount() function should fire', () => {
    let onUnmountFired = 0;

    const EventComponent = createReactEventComponent(
      [],
      undefined,
      (event, context, props, state) => {},
      () => {
        onUnmountFired++;
      },
    );

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

    const EventComponent = createReactEventComponent(
      [],
      () => ({
        incrementAmount: 5,
      }),
      (event, context, props, state) => {},
      (context, props, state) => {
        counter += state.incrementAmount;
      },
    );

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

    const EventComponent = createReactEventComponent(
      ['click'],
      undefined,
      (event, context, props, state) => {
        ownershipGained = context.requestOwnership();
      },
      undefined,
      () => {
        onOwnershipChangeFired++;
      },
    );

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
});
