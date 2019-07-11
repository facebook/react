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
let EventResponder;
let ReactTestRenderer;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

const noOpResponder = {
  displayName: 'TestEventResponder',
  targetEventTypes: [],
  handleEvent() {},
};

function createReactEventResponder() {
  return React.unstable_createResponder(noOpResponder);
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
      EventResponder = createReactEventResponder();
    });

    it('should render a simple event responder', () => {
      const Test = () => (
        <div>
          <EventResponder />Hello world
        </div>
      );

      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(<div>Hello world</div>);
    });

    it('should handle event components correctly with error boundaries', () => {
      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <span>
          <ErrorComponent />
          <EventResponder />
        </span>
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
        <div>
          <Child />
          <EventResponder />
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
  });

  describe('TestRenderer', () => {
    beforeEach(() => {
      initTestRenderer();
      EventResponder = createReactEventResponder();
    });

    it('should render a simple event responder with a single child', () => {
      const Test = () => (
        <div>
          <EventResponder />Hello world
        </div>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<div>Hello world</div>);
    });

    it('should handle event responders correctly with error boundaries', () => {
      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <span>
          <ErrorComponent />
          <EventResponder />
        </span>
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
        <div>
          <Child />
          <EventResponder />
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

    it('should handle unwinding event responder fibers in concurrent mode', () => {
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
          <div>
            <Async />
            <Text text="Sibling" />
            <EventResponder />
          </div>
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
      EventResponder = createReactEventResponder();
    });

    it('should render a simple event responder with a single child', () => {
      const Test = () => (
        <div>
          <EventResponder />Hello world
        </div>
      );
      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world</div>');
    });

    it('should handle event components correctly with error boundaries', () => {
      function ErrorComponent() {
        throw new Error('Failed!');
      }

      const Test = () => (
        <span>
          <ErrorComponent />
          <EventResponder />
        </span>
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
        <div>
          <Child />
          <EventResponder />
        </div>
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
  });

  describe('ReactDOMServer', () => {
    beforeEach(() => {
      initReactDOMServer();
      EventResponder = createReactEventResponder();
    });

    it('should render a simple event responder with a single child', () => {
      const Test = () => (
        <div>
          <EventResponder />Hello world
        </div>
      );
      const output = ReactDOMServer.renderToString(<Test />);
      expect(output).toBe('<div data-reactroot="">Hello world</div>');
    });
  });
});
