/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Suspense;

describe('memo', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ({Suspense} = React);
  });

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function Text(props) {
    ReactNoop.yield(props.text);
    return <span prop={props.text} />;
  }

  async function fakeImport(result) {
    return {default: result};
  }

  it('warns when giving a ref (simple)', async () => {
    // This test lives outside sharedTests because the wrappers don't forward
    // refs properly, and they end up affecting the current owner which is used
    // by the warning (making the messages not line up).
    function App() {
      return null;
    }
    App = React.memo(App);
    function Outer() {
      return <App ref={() => {}} />;
    }
    ReactNoop.render(<Outer />);
    expect(ReactNoop.flush).toWarnDev([
      'Warning: Function components cannot be given refs. Attempts to access ' +
        'this ref will fail.',
    ]);
  });

  it('warns when giving a ref (complex)', async () => {
    // defaultProps means this won't use SimpleMemoComponent (as of this writing)
    // SimpleMemoComponent is unobservable tho, so we can't check :)
    function App() {
      return null;
    }
    App.defaultProps = {};
    App = React.memo(App);
    function Outer() {
      return <App ref={() => {}} />;
    }
    ReactNoop.render(<Outer />);
    expect(ReactNoop.flush).toWarnDev([
      'Warning: Function components cannot be given refs. Attempts to access ' +
        'this ref will fail.',
    ]);
  });

  // Tests should run against both the lazy and non-lazy versions of `memo`.
  // To make the tests work for both versions, we wrap the non-lazy version in
  // a lazy function component.
  sharedTests('normal', (...args) => {
    const Memo = React.memo(...args);
    function Indirection(props) {
      return <Memo {...props} />;
    }
    return React.lazy(() => fakeImport(Indirection));
  });
  sharedTests('lazy', (...args) => {
    const Memo = React.memo(...args);
    return React.lazy(() => fakeImport(Memo));
  });

  function sharedTests(label, memo) {
    describe(`${label}`, () => {
      it('bails out on props equality', async () => {
        function Counter({count}) {
          return <Text text={count} />;
        }
        Counter = memo(Counter);

        ReactNoop.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Counter count={0} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual(['Loading...']);
        await Promise.resolve();
        expect(ReactNoop.flush()).toEqual([0]);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter count={0} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual([]);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter count={1} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual([1]);
        expect(ReactNoop.getChildren()).toEqual([span(1)]);
      });

      it("does not bail out if there's a context change", async () => {
        const CountContext = React.createContext(0);

        function readContext(Context) {
          const dispatcher =
            React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
              .ReactCurrentOwner.currentDispatcher;
          return dispatcher.readContext(Context);
        }

        function Counter(props) {
          const count = readContext(CountContext);
          return <Text text={`${props.label}: ${count}`} />;
        }
        Counter = memo(Counter);

        class Parent extends React.Component {
          state = {count: 0};
          render() {
            return (
              <Suspense fallback={<Text text="Loading..." />}>
                <CountContext.Provider value={this.state.count}>
                  <Counter label="Count" />
                </CountContext.Provider>
              </Suspense>
            );
          }
        }

        const parent = React.createRef(null);
        ReactNoop.render(<Parent ref={parent} />);
        expect(ReactNoop.flush()).toEqual(['Loading...']);
        await Promise.resolve();
        expect(ReactNoop.flush()).toEqual(['Count: 0']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

        // Should bail out because props have not changed
        ReactNoop.render(<Parent ref={parent} />);
        expect(ReactNoop.flush()).toEqual([]);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

        // Should update because there was a context change
        parent.current.setState({count: 1});
        expect(ReactNoop.flush()).toEqual(['Count: 1']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });

      it('accepts custom comparison function', async () => {
        function Counter({count}) {
          return <Text text={count} />;
        }
        Counter = memo(Counter, (oldProps, newProps) => {
          ReactNoop.yield(
            `Old count: ${oldProps.count}, New count: ${newProps.count}`,
          );
          return oldProps.count === newProps.count;
        });

        ReactNoop.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Counter count={0} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual(['Loading...']);
        await Promise.resolve();
        expect(ReactNoop.flush()).toEqual([0]);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter count={0} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual(['Old count: 0, New count: 0']);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter count={1} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual(['Old count: 0, New count: 1', 1]);
        expect(ReactNoop.getChildren()).toEqual([span(1)]);
      });

      it('supports non-pure class components', async () => {
        class CounterInner extends React.Component {
          static defaultProps = {suffix: '!'};
          render() {
            return <Text text={this.props.count + '' + this.props.suffix} />;
          }
        }
        const Counter = memo(CounterInner);

        ReactNoop.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Counter count={0} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual(['Loading...']);
        await Promise.resolve();
        expect(ReactNoop.flush()).toEqual(['0!']);
        expect(ReactNoop.getChildren()).toEqual([span('0!')]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter count={0} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual([]);
        expect(ReactNoop.getChildren()).toEqual([span('0!')]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter count={1} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual(['1!']);
        expect(ReactNoop.getChildren()).toEqual([span('1!')]);
      });

      it('supports defaultProps defined on the memo() return value', async () => {
        function Counter({a, b, c, d, e}) {
          return <Text text={a + b + c + d + e} />;
        }
        Counter.defaultProps = {
          a: 1,
        };
        // Note! We intentionally use React.memo() rather than the injected memo().
        // This tests a synchronous chain of React.memo() without lazy() in the middle.
        Counter = React.memo(Counter);
        Counter.defaultProps = {
          b: 2,
        };
        Counter = React.memo(Counter);
        Counter = React.memo(Counter); // Layer without defaultProps
        Counter.defaultProps = {
          c: 3,
        };
        Counter = React.memo(Counter);
        Counter.defaultProps = {
          d: 4,
        };
        // The final layer uses memo() from test fixture (which might be lazy).
        Counter = memo(Counter);
        ReactNoop.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Counter e={5} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual(['Loading...']);
        await Promise.resolve();
        expect(ReactNoop.flush()).toEqual([15]);
        expect(ReactNoop.getChildren()).toEqual([span(15)]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter e={5} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual([]);
        expect(ReactNoop.getChildren()).toEqual([span(15)]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter e={10} />
          </Suspense>,
        );
        expect(ReactNoop.flush()).toEqual([20]);
        expect(ReactNoop.getChildren()).toEqual([span(20)]);
      });

      it('warns if the first argument is undefined', () => {
        expect(() => memo()).toWarnDev(
          'memo: The first argument must be a component. Instead ' +
            'received: undefined',
          {withoutStack: true},
        );
      });

      it('warns if the first argument is null', () => {
        expect(() => memo(null)).toWarnDev(
          'memo: The first argument must be a component. Instead ' +
            'received: null',
          {withoutStack: true},
        );
      });
    });
  }
});
