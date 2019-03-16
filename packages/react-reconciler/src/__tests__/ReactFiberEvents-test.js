/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;
let Scheduler;
let ReactFeatureFlags = require('shared/ReactFeatureFlags');
let ReactSymbols = require('shared/ReactSymbols');

const noOpResponder = {
  targetEventTypes: [],
  handleEvent() {},
};

function createReactEventComponent() {
  return {
    $$typeof: ReactSymbols.REACT_EVENT_COMPONENT_TYPE,
    props: null,
    responder: noOpResponder,
  };
}

function createReactEventTarget() {
  return {
    $$typeof: ReactSymbols.REACT_EVENT_TARGET_TYPE,
    type: ReactSymbols.REACT_EVENT_TARGET_TOUCH_HIT,
  };
}

// This is a new feature in Fiber so I put it in its own test file. It could
// probably move to one of the other test files once it is official.
describe('ReactTopLevelText', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
  });

  it('should render a simple event component with a single child', () => {
    const EventComponent = createReactEventComponent();

    const Test = () => (
      <EventComponent>
        <div>Hello world</div>
      </EventComponent>
    );

    ReactNoop.render(<Test />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<div>Hello world</div>);
  });

  it('should warn when an event component has a direct text child', () => {
    const EventComponent = createReactEventComponent();

    const Test = () => <EventComponent>Hello world</EventComponent>;

    expect(() => {
      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toWarnDev(
      'Warning: validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
        'Wrap the child text "Hello world" in an element.',
    );
  });

  it('should warn when an event component has a direct text child #2', () => {
    const EventComponent = createReactEventComponent();

    const ChildWrapper = () => 'Hello world';
    const Test = () => (
      <EventComponent>
        <ChildWrapper />
      </EventComponent>
    );

    expect(() => {
      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toWarnDev(
      'Warning: validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
        'Wrap the child text "Hello world" in an element.',
    );
  });

  it('should render a simple event component with a single event target', () => {
    const EventComponent = createReactEventComponent();
    const EventTarget = createReactEventTarget();

    const Test = () => (
      <EventComponent>
        <EventTarget>
          <div>Hello world</div>
        </EventTarget>
      </EventComponent>
    );

    ReactNoop.render(<Test />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<div>Hello world</div>);
  });

  it('should warn when an event target has a direct text child', () => {
    const EventComponent = createReactEventComponent();
    const EventTarget = createReactEventTarget();

    const Test = () => (
      <EventComponent>
        <EventTarget>Hello world</EventTarget>
      </EventComponent>
    );

    expect(() => {
      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toWarnDev(
      'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
        'Wrap the child text "Hello world" in an element.',
    );
  });

  it('should warn when an event target has a direct text child #2', () => {
    const EventComponent = createReactEventComponent();
    const EventTarget = createReactEventTarget();

    const ChildWrapper = () => 'Hello world';
    const Test = () => (
      <EventComponent>
        <EventTarget>
          <ChildWrapper />
        </EventTarget>
      </EventComponent>
    );

    expect(() => {
      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toWarnDev(
      'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
        'Wrap the child text "Hello world" in an element.',
    );
  });

  it('should warn when an event target has more than one child', () => {
    const EventComponent = createReactEventComponent();
    const EventTarget = createReactEventTarget();

    const Test = () => (
      <EventComponent>
        <EventTarget>
          <span>Child 1</span>
          <span>Child 2</span>
        </EventTarget>
      </EventComponent>
    );

    expect(() => {
      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toWarnDev(
      'Warning: validateDOMNesting: React event targets mut have only a single DOM element as a child. ' +
        'Instead, found 2 children.',
    );
  });

  it('should warn if an event target is not a direct child of an event component', () => {
    const EventComponent = createReactEventComponent();
    const EventTarget = createReactEventTarget();

    const Test = () => (
      <EventComponent>
        <div>
          <EventTarget>
            <span>Child 1</span>
          </EventTarget>
        </div>
      </EventComponent>
    );

    expect(() => {
      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
    }).toWarnDev(
      'Warning: validateDOMNesting: React event targets must be direct children of event components.',
    );
  });
});
