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

function createReactEventComponent(targetEventTypes, handleEvent) {
  const testEventResponder = {
    targetEventTypes,
    handleEvent,
  };

  return {
    $$typeof: Symbol.for('react.event_component'),
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

  it('the event responder handleEvent() function should fire on click event', () => {
    let eventResponderFiredCount = 0;
    const buttonRef = React.createRef();

    const ClickEventComponent = createReactEventComponent(['click'], () => {
      eventResponderFiredCount++;
    });

    const Test = () => (
      <ClickEventComponent>
        <button ref={buttonRef}>Click me!</button>
      </ClickEventComponent>
    );

    ReactDOM.render(<Test />, container);
    expect(container.innerHTML).toBe('<button>Click me!</button>');

    // Clicking the button should trigger the event responder handleEvent()
    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(eventResponderFiredCount).toBe(1);

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
});
