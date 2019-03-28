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
let ReactNoop;
let Scheduler;
let ReactFeatureFlags;
let EventComponent;
let ReactTestRenderer;
let ReactDOM;
let ReactDOMServer;
let EventTarget;
let ReactEvents;

const noOpResponder = {
  targetEventTypes: [],
  handleEvent() {},
};

function createReactEventComponent() {
  return {
    $$typeof: Symbol.for('react.event_component'),
    props: null,
    responder: noOpResponder,
  };
}

function init() {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableEventAPI = true;
  React = require('react');
  Scheduler = require('scheduler');
  ReactEvents = require('react-events');
}

function initNoopRenderer() {
  init();
  ReactNoop = require('react-noop-renderer');
}

function initTestRenderer() {
  init();
  ReactTestRenderer = require('react-test-renderer');
}

function initReactDOM() {
  init();
  ReactDOM = require('react-dom');
}

function initReactDOMServer() {
  init();
  ReactDOMServer = require('react-dom/server');
}

// This is a new feature in Fiber so I put it in its own test file. It could
// probably move to one of the other test files once it is official.
describe('ReactFiberEvents', () => {
  describe('NoopRenderer', () => {
    beforeEach(() => {
      initNoopRenderer();
      EventComponent = createReactEventComponent();
      EventTarget = ReactEvents.TouchHitTarget;
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
      }).toWarnDev([
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
        'Warning: <TouchHitTarget> must have a single DOM element as a child. Found no children.',
      ]);
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
      }).toWarnDev([
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
        'Warning: <TouchHitTarget> must have a single DOM element as a child. Found no children.',
      ]);
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
        'Warning: <TouchHitTarget> must only have a single DOM element as a child. Found many children.',
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
      EventTarget = ReactEvents.TouchHitTarget;
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
      }).toWarnDev([
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
        'Warning: <TouchHitTarget> must have a single DOM element as a child. Found no children.',
      ]);
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
      }).toWarnDev([
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
        'Warning: <TouchHitTarget> must have a single DOM element as a child. Found no children.',
      ]);
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
        'Warning: <TouchHitTarget> must only have a single DOM element as a child. Found many children.',
      );
      // This should not fire a warning, as this is now valid.
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

  describe('ReactDOM', () => {
    beforeEach(() => {
      initReactDOM();
      EventComponent = createReactEventComponent();
      EventTarget = ReactEvents.TouchHitTarget;
    });

    it('should render a simple event component with a single child', () => {
      const Test = () => (
        <EventComponent>
          <div>Hello world</div>
        </EventComponent>
      );
      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world</div>');
    });

    it('should warn when an event component has a direct text child', () => {
      const Test = () => <EventComponent>Hello world</EventComponent>;

      expect(() => {
        const container = document.createElement('div');
        ReactDOM.render(<Test />, container);
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
        const container = document.createElement('div');
        ReactDOM.render(<Test />, container);
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

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world</div>');

      const Test2 = () => (
        <EventComponent>
          <EventTarget>
            <span>I am now a span</span>
          </EventTarget>
        </EventComponent>
      );

      ReactDOM.render(<Test2 />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<span>I am now a span</span>');
    });

    it('should warn when an event target has a direct text child', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>Hello world</EventTarget>
        </EventComponent>
      );

      expect(() => {
        const container = document.createElement('div');
        ReactDOM.render(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev([
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
        'Warning: <TouchHitTarget> must have a single DOM element as a child. Found no children.',
      ]);
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
        const container = document.createElement('div');
        ReactDOM.render(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev([
        'Warning: validateDOMNesting: React event targets cannot have text DOM nodes as children. ' +
          'Wrap the child text "Hello world" in an element.',
        'Warning: <TouchHitTarget> must have a single DOM element as a child. Found no children.',
      ]);
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

      const container = document.createElement('div');
      expect(() => {
        ReactDOM.render(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: <TouchHitTarget> must only have a single DOM element as a child. Found many children.',
      );
      // This should not fire a warning, as this is now valid.
      const Test2 = () => (
        <EventComponent>
          <EventTarget>
            <span>Child 1</span>
          </EventTarget>
        </EventComponent>
      );
      ReactDOM.render(<Test2 />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<span>Child 1</span>');
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
        const container = document.createElement('div');
        ReactDOM.render(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event targets must be direct children of event components.',
      );
    });
  });

  describe('ReactDOMServer', () => {
    beforeEach(() => {
      initReactDOMServer();
      EventComponent = createReactEventComponent();
      EventTarget = ReactEvents.TouchHitTarget;
    });

    it('should render a simple event component with a single child', () => {
      const Test = () => (
        <EventComponent>
          <div>Hello world</div>
        </EventComponent>
      );
      const output = ReactDOMServer.renderToString(<Test />);
      expect(output).toBe('<div>Hello world</div>');
    });

    it('should render a simple event component with a single event target', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>
            <div>Hello world</div>
          </EventTarget>
        </EventComponent>
      );

      let output = ReactDOMServer.renderToString(<Test />);
      expect(output).toBe('<div>Hello world</div>');

      const Test2 = () => (
        <EventComponent>
          <EventTarget>
            <span>I am now a span</span>
          </EventTarget>
        </EventComponent>
      );

      output = ReactDOMServer.renderToString(<Test2 />);
      expect(output).toBe('<span>I am now a span</span>');
    });
  });
});
