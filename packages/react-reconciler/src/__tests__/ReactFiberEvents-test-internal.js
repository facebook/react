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
let ReactTestUtils;
let EventTarget;
let ReactSymbols;

const noOpResponder = {
  targetEventTypes: [],
  handleEvent() {},
};

function createReactEventComponent() {
  return {
    $$typeof: ReactSymbols.REACT_EVENT_COMPONENT_TYPE,
    displayName: 'TestEventComponent',
    props: null,
    responder: noOpResponder,
  };
}

function createReactEventTarget() {
  return {
    $$typeof: ReactSymbols.REACT_EVENT_TARGET_TYPE,
    displayName: 'TestEventTarget',
    type: Symbol.for('react.event_target.test'),
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

function initReactDOM() {
  init();
  ReactDOM = require('react-dom');
  ReactTestUtils = require('react-dom/test-utils');
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
          <div>
            Hello world<EventTarget />
          </div>
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
      }).toWarnDev('Warning: Event targets should not have children.');
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
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should not warn if an event target is not a direct child of an event component', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <EventTarget />
            <span>Child 1</span>
          </div>
        </EventComponent>
      );

      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(
        <div>
          <span>Child 1</span>
        </div>,
      );
    });

    it('should warn if an event target has an event component as a child', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>
            <EventComponent>
              <span>Child 1</span>
            </EventComponent>
          </EventTarget>
        </EventComponent>
      );

      expect(() => {
        ReactNoop.render(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should handle event components correctly with error boundaries', () => {
      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <EventComponent>
          <span>
            <ErrorComponent />
          </span>
        </EventComponent>
      );

      class Wrapper extends React.Component {
        state = {
          error: null,
        };

        componentDidCatch(error) {
          this.setState({
            error,
          });
        }

        render() {
          if (this.state.error) {
            return 'Worked!';
          }
          return <Test />;
        }
      }

      ReactNoop.render(<Wrapper />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput('Worked!');
    });

    it('should handle re-renders where there is a bail-out in a parent', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <EventComponent>
          <div>
            <Child />
          </div>
        </EventComponent>
      );

      ReactNoop.render(<Parent />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(
        <div>
          <div>
            <span>Child - 0</span>
          </div>
        </div>,
      );

      ReactNoop.act(() => {
        _updateCounter(counter => counter + 1);
      });
      expect(Scheduler).toFlushWithoutYielding();

      expect(ReactNoop).toMatchRenderedOutput(
        <div>
          <div>
            <span>Child - 1</span>
          </div>
        </div>,
      );
    });

    it('should handle re-renders where there is a bail-out in a parent and an error occurs', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        if (counter === 1) {
          return 'Text!';
        }

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <EventComponent>
          <Child />
        </EventComponent>
      );

      ReactNoop.render(<Parent />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(
        <div>
          <span>Child - 0</span>
        </div>,
      );

      expect(() => {
        ReactNoop.act(() => {
          _updateCounter(counter => counter + 1);
        });
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
          'Wrap the child text "Text!" in an element.',
      );
    });

    it('should handle re-renders where there is a bail-out in a parent and an error occurs #2', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        if (counter === 1) {
          return <EventTarget>123</EventTarget>;
        }

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <div>
          <EventComponent>
            <Child />
          </EventComponent>
        </div>
      );

      ReactNoop.render(<Parent />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(
        <div>
          <div>
            <span>Child - 0</span>
          </div>
        </div>,
      );

      expect(() => {
        ReactNoop.act(() => {
          _updateCounter(counter => counter + 1);
        });
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should error with a component stack contains the names of the event components and event targets', () => {
      let componentStackMessage;

      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <EventComponent>
          <span>
            <ErrorComponent />
          </span>
        </EventComponent>
      );

      class Wrapper extends React.Component {
        state = {
          error: null,
        };

        componentDidCatch(error, errMessage) {
          componentStackMessage = errMessage.componentStack;
          this.setState({
            error,
          });
        }

        render() {
          if (this.state.error) {
            return null;
          }
          return <Test />;
        }
      }

      ReactNoop.render(<Wrapper />);
      expect(Scheduler).toFlushWithoutYielding();

      expect(componentStackMessage.includes('ErrorComponent')).toBe(true);
      expect(componentStackMessage.includes('span')).toBe(true);
      expect(componentStackMessage.includes('TestEventComponent')).toBe(true);
      expect(componentStackMessage.includes('Test')).toBe(true);
      expect(componentStackMessage.includes('Wrapper')).toBe(true);
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
          <div>
            Hello world<EventTarget />
          </div>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<div>Hello world</div>);

      const Test2 = () => (
        <EventComponent>
          <EventTarget />
          <span>I am now a span</span>
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
      }).toWarnDev('Warning: Event targets should not have children.');
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
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should not warn if an event target is not a direct child of an event component', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <EventTarget />
            <span>Child 1</span>
          </div>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(
        <div>
          <span>Child 1</span>
        </div>,
      );
    });

    it('should warn if an event target has an event component as a child', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>
            <EventComponent>
              <span>Child 1</span>
            </EventComponent>
          </EventTarget>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should handle event components correctly with error boundaries', () => {
      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <EventComponent>
          <span>
            <ErrorComponent />
          </span>
        </EventComponent>
      );

      class Wrapper extends React.Component {
        state = {
          error: null,
        };

        componentDidCatch(error) {
          this.setState({
            error,
          });
        }

        render() {
          if (this.state.error) {
            return 'Worked!';
          }
          return <Test />;
        }
      }

      const root = ReactTestRenderer.create(null);
      root.update(<Wrapper />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput('Worked!');
    });

    it('should handle re-renders where there is a bail-out in a parent', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <EventComponent>
          <div>
            <Child />
          </div>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Parent />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(
        <div>
          <div>
            <span>Child - 0</span>
          </div>
        </div>,
      );

      ReactTestRenderer.act(() => {
        _updateCounter(counter => counter + 1);
      });

      expect(root).toMatchRenderedOutput(
        <div>
          <div>
            <span>Child - 1</span>
          </div>
        </div>,
      );
    });

    it('should handle re-renders where there is a bail-out in a parent and an error occurs', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        if (counter === 1) {
          return 'Text!';
        }

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <EventComponent>
          <Child />
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Parent />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(
        <div>
          <span>Child - 0</span>
        </div>,
      );

      expect(() => {
        ReactTestRenderer.act(() => {
          _updateCounter(counter => counter + 1);
        });
      }).toWarnDev(
        'Warning: validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
          'Wrap the child text "Text!" in an element.',
      );
    });

    it('should handle re-renders where there is a bail-out in a parent and an error occurs #2', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        if (counter === 1) {
          return <EventTarget>123</EventTarget>;
        }

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <div>
          <EventComponent>
            <Child />
          </EventComponent>
        </div>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Parent />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(
        <div>
          <div>
            <span>Child - 0</span>
          </div>
        </div>,
      );

      expect(() => {
        ReactTestRenderer.act(() => {
          _updateCounter(counter => counter + 1);
        });
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should error with a component stack contains the names of the event components and event targets', () => {
      let componentStackMessage;

      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <EventComponent>
          <span>
            <ErrorComponent />
          </span>
        </EventComponent>
      );

      class Wrapper extends React.Component {
        state = {
          error: null,
        };

        componentDidCatch(error, errMessage) {
          componentStackMessage = errMessage.componentStack;
          this.setState({
            error,
          });
        }

        render() {
          if (this.state.error) {
            return null;
          }
          return <Test />;
        }
      }

      const root = ReactTestRenderer.create(null);
      root.update(<Wrapper />);
      expect(Scheduler).toFlushWithoutYielding();

      expect(componentStackMessage.includes('ErrorComponent')).toBe(true);
      expect(componentStackMessage.includes('span')).toBe(true);
      expect(componentStackMessage.includes('TestEventComponent')).toBe(true);
      expect(componentStackMessage.includes('Test')).toBe(true);
      expect(componentStackMessage.includes('Wrapper')).toBe(true);
    });
  });

  describe('ReactDOM', () => {
    beforeEach(() => {
      initReactDOM();
      EventComponent = createReactEventComponent();
      EventTarget = createReactEventTarget();
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
          <div>
            Hello world<EventTarget />
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world</div>');

      const Test2 = () => (
        <EventComponent>
          <EventTarget />
          <span>I am now a span</span>
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
      }).toWarnDev('Warning: Event targets should not have children.');
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
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should not warn if an event target is not a direct child of an event component', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <EventTarget />
            <span>Child 1</span>
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div><span>Child 1</span></div>');
    });

    it('should warn if an event target has an event component as a child', () => {
      const Test = () => (
        <EventComponent>
          <EventTarget>
            <EventComponent>
              <span>Child 1</span>
            </EventComponent>
          </EventTarget>
        </EventComponent>
      );

      expect(() => {
        const container = document.createElement('div');
        ReactDOM.render(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should handle event components correctly with error boundaries', () => {
      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <EventComponent>
          <span>
            <ErrorComponent />
          </span>
        </EventComponent>
      );

      class Wrapper extends React.Component {
        state = {
          error: null,
        };

        componentDidCatch(error) {
          this.setState({
            error,
          });
        }

        render() {
          if (this.state.error) {
            return 'Worked!';
          }
          return <Test />;
        }
      }

      const container = document.createElement('div');
      ReactDOM.render(<Wrapper />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('Worked!');
    });

    it('should handle re-renders where there is a bail-out in a parent', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <EventComponent>
          <div>
            <Child />
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Parent />, container);
      expect(container.innerHTML).toBe(
        '<div><div><span>Child - 0</span></div></div>',
      );

      ReactTestUtils.act(() => {
        _updateCounter(counter => counter + 1);
      });

      expect(container.innerHTML).toBe(
        '<div><div><span>Child - 1</span></div></div>',
      );
    });

    it('should handle re-renders where there is a bail-out in a parent and an error occurs', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        if (counter === 1) {
          return 'Text!';
        }

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <EventComponent>
          <Child />
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Parent />, container);
      expect(container.innerHTML).toBe('<div><span>Child - 0</span></div>');

      expect(() => {
        ReactTestUtils.act(() => {
          _updateCounter(counter => counter + 1);
        });
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
          'Wrap the child text "Text!" in an element.',
      );
    });

    it('should handle re-renders where there is a bail-out in a parent and an error occurs #2', () => {
      let _updateCounter;

      function Child() {
        const [counter, updateCounter] = React.useState(0);

        _updateCounter = updateCounter;

        if (counter === 1) {
          return <EventTarget>123</EventTarget>;
        }

        return (
          <div>
            <span>Child - {counter}</span>
          </div>
        );
      }

      const Parent = () => (
        <div>
          <EventComponent>
            <Child />
          </EventComponent>
        </div>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Parent />, container);
      expect(container.innerHTML).toBe(
        '<div><div><span>Child - 0</span></div></div>',
      );

      expect(() => {
        ReactTestUtils.act(() => {
          _updateCounter(counter => counter + 1);
        });
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev('Warning: Event targets should not have children.');
    });

    it('should error with a component stack contains the names of the event components and event targets', () => {
      let componentStackMessage;

      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <EventComponent>
          <span>
            <ErrorComponent />
          </span>
        </EventComponent>
      );

      class Wrapper extends React.Component {
        state = {
          error: null,
        };

        componentDidCatch(error, errMessage) {
          componentStackMessage = errMessage.componentStack;
          this.setState({
            error,
          });
        }

        render() {
          if (this.state.error) {
            return null;
          }
          return <Test />;
        }
      }

      const container = document.createElement('div');
      ReactDOM.render(<Wrapper />, container);

      expect(componentStackMessage.includes('ErrorComponent')).toBe(true);
      expect(componentStackMessage.includes('span')).toBe(true);
      expect(componentStackMessage.includes('TestEventComponent')).toBe(true);
      expect(componentStackMessage.includes('Test')).toBe(true);
      expect(componentStackMessage.includes('Wrapper')).toBe(true);
    });
  });

  describe('ReactDOMServer', () => {
    beforeEach(() => {
      initReactDOMServer();
      EventComponent = createReactEventComponent();
      EventTarget = createReactEventTarget();
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
          <div>
            Hello world<EventTarget />
          </div>
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
