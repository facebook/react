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

const noOpResponder = {
  displayName: 'TestEventComponent',
  targetEventTypes: [],
  handleEvent() {},
};

function createReactEventComponent() {
  return React.unstable_createEvent(noOpResponder);
}

function init() {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  Scheduler = require('scheduler');
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

    it('should handle unwinding event component fibers in concurrent mode', () => {
      let resolveThenable;

      const thenable = {
        then(resolve) {
          resolveThenable = resolve;
        },
      };

      function Async() {
        Scheduler.unstable_yieldValue('Suspend!');
        throw thenable;
      }

      function Text(props) {
        Scheduler.unstable_yieldValue(props.text);
        return props.text;
      }

      ReactTestRenderer.create(
        <React.Suspense fallback={<Text text="Loading..." />}>
          <EventComponent>
            <div>
              <Async />
              <Text text="Sibling" />
            </div>
          </EventComponent>
        </React.Suspense>,
        {
          unstable_isConcurrent: true,
        },
      );

      expect(Scheduler).toFlushAndYieldThrough(['Suspend!']);
      resolveThenable();
    });
  });

  describe('ReactDOM', () => {
    beforeEach(() => {
      initReactDOM();
      EventComponent = createReactEventComponent();
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
  });
});
