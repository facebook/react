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
let ReactFeatureFlags;
let ReactSymbols;
let EventComponent;
let ReactTestRenderer;
let EventTarget;

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

function init() {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableEventAPI = true;
  React = require('react');
  Scheduler = require('scheduler');
  ReactSymbols = require('shared/ReactSymbols');
}

function initNoopRenderer() {
  init();
  ReactNoop = require('react-noop-renderer');
}

function initTestRenderer() {
  init();
  ReactTestRenderer = require('react-test-renderer');
}

// This is a new feature in Fiber so I put it in its own test file. It could
// probably move to one of the other test files once it is official.
describe('ReactTopLevelText', () => {
  describe('NoopRenderer', () => {
    beforeEach(() => {
      initNoopRenderer();
      EventComponent = createReactEventComponent();
      EventTarget = createReactEventTarget();
    });

    it('should render a simple event component with a single child', () => {
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

  describe('TestRenderer', () => {
    beforeEach(() => {
      initTestRenderer();
      EventComponent = createReactEventComponent();
      EventTarget = createReactEventTarget();
    });

    it('should render a simple event component with a single child', () => {
      const Test = () => (
        <EventComponent>
          <div>Hello world</div>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<div>Hello world</div>);
    });

    it('should warn when an event component has a direct text child', () => {
      const Test = () => <EventComponent>Hello world</EventComponent>;

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
      );
    });

    it('should warn when an event component has a direct text child #2', () => {
      const ChildWrapper = () => 'Hello world';
      const Test = () => (
        <EventComponent>
          <ChildWrapper />
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
      );
    });

    it('should render a simple event component with a single event target', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>
            <div>Hello world</div>
          </EventTarget>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<div>Hello world</div>);

      const Test2 = () => (
        <EventComponent>
          <EventTarget>
            <span>I am now a span</span>
          </EventTarget>
        </EventComponent>
      );

      root.update(<Test2 />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<span>I am now a span</span>);
    });

    it('should warn when an event target has a direct text child', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>Hello world</EventTarget>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
      );
    });

    it('should warn when an event target has a direct text child #2', () => {
      const ChildWrapper = () => 'Hello world';
      const Test = () => (
        <EventComponent>
          <EventTarget>
            <ChildWrapper />
          </EventTarget>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
      );
    });

    it('should warn when an event target has more than one child', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>
            <span>Child 1</span>
            <span>Child 2</span>
          </EventTarget>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event targets mut have only a single DOM element as a child. ' +
          'Instead, found 2 children.',
      );
      // Should allow this and not error
      const Test2 = () => (
        <EventComponent>
          <EventTarget>
            <span>Child 1</span>
          </EventTarget>
        </EventComponent>
      );
      root.update(<Test2 />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<span>Child 1</span>);
    });

    it('should warn if an event target is not a direct child of an event component', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <EventTarget>
              <span>Child 1</span>
            </EventTarget>
          </div>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event targets must be direct children of event components.',
      );
    });
  });
});
