/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let PropTypes;
let React;
let ReactFeatureFlags;
let ReactNoop;
let Suspense;
let Scheduler;

describe('memo', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    PropTypes = require('prop-types');
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ({Suspense} = React);
  });

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toWarnDev([
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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toWarnDev([
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
        expect(Scheduler).toFlushAndYield(['Loading...']);
        await Promise.resolve();
        expect(Scheduler).toFlushAndYield([0]);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter count={0} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield([]);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter count={1} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield([1]);
        expect(ReactNoop.getChildren()).toEqual([span(1)]);
      });

      it("does not bail out if there's a context change", async () => {
        const CountContext = React.createContext(0);

        function readContext(Context) {
          const dispatcher =
            React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
              .ReactCurrentDispatcher.current;
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
        expect(Scheduler).toFlushAndYield(['Loading...']);
        await Promise.resolve();
        expect(Scheduler).toFlushAndYield(['Count: 0']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

        // Should bail out because props have not changed
        ReactNoop.render(<Parent ref={parent} />);
        expect(Scheduler).toFlushAndYield([]);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

        // Should update because there was a context change
        parent.current.setState({count: 1});
        expect(Scheduler).toFlushAndYield(['Count: 1']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });

      it('accepts custom comparison function', async () => {
        function Counter({count}) {
          return <Text text={count} />;
        }
        Counter = memo(Counter, (oldProps, newProps) => {
          Scheduler.unstable_yieldValue(
            `Old count: ${oldProps.count}, New count: ${newProps.count}`,
          );
          return oldProps.count === newProps.count;
        });

        ReactNoop.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Counter count={0} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield(['Loading...']);
        await Promise.resolve();
        expect(Scheduler).toFlushAndYield([0]);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter count={0} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield(['Old count: 0, New count: 0']);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter count={1} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield(['Old count: 0, New count: 1', 1]);
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
        expect(Scheduler).toFlushAndYield(['Loading...']);
        await Promise.resolve();
        expect(Scheduler).toFlushAndYield(['0!']);
        expect(ReactNoop.getChildren()).toEqual([span('0!')]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter count={0} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield([]);
        expect(ReactNoop.getChildren()).toEqual([span('0!')]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter count={1} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield(['1!']);
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
        expect(Scheduler).toFlushAndYield(['Loading...']);
        await Promise.resolve();
        expect(Scheduler).toFlushAndYield([15]);
        expect(ReactNoop.getChildren()).toEqual([span(15)]);

        // Should bail out because props have not changed
        ReactNoop.render(
          <Suspense>
            <Counter e={5} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield([]);
        expect(ReactNoop.getChildren()).toEqual([span(15)]);

        // Should update because count prop changed
        ReactNoop.render(
          <Suspense>
            <Counter e={10} />
          </Suspense>,
        );
        expect(Scheduler).toFlushAndYield([20]);
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

      it('validates propTypes declared on the inner component', () => {
        function FnInner(props) {
          return props.inner;
        }
        FnInner.propTypes = {inner: PropTypes.number.isRequired};
        const Fn = React.memo(FnInner);

        // Mount
        expect(() => {
          ReactNoop.render(<Fn inner="2" />);
          expect(Scheduler).toFlushWithoutYielding();
        }).toWarnDev(
          'Invalid prop `inner` of type `string` supplied to `FnInner`, expected `number`.',
        );

        // Update
        expect(() => {
          ReactNoop.render(<Fn inner={false} />);
          expect(Scheduler).toFlushWithoutYielding();
        }).toWarnDev(
          'Invalid prop `inner` of type `boolean` supplied to `FnInner`, expected `number`.',
        );
      });

      it('validates propTypes declared on the outer component', () => {
        function FnInner(props) {
          return props.outer;
        }
        const Fn = React.memo(FnInner);
        Fn.propTypes = {outer: PropTypes.number.isRequired};

        // Mount
        expect(() => {
          ReactNoop.render(<Fn outer="3" />);
          expect(Scheduler).toFlushWithoutYielding();
        }).toWarnDev(
          // Outer props are checked in createElement
          'Invalid prop `outer` of type `string` supplied to `FnInner`, expected `number`.',
        );

        // Update
        expect(() => {
          ReactNoop.render(<Fn outer={false} />);
          expect(Scheduler).toFlushWithoutYielding();
        }).toWarnDev(
          // Outer props are checked in createElement
          'Invalid prop `outer` of type `boolean` supplied to `FnInner`, expected `number`.',
        );
      });

      it('validates nested propTypes declarations', () => {
        function Inner(props) {
          return props.inner + props.middle + props.outer;
        }
        Inner.propTypes = {inner: PropTypes.number.isRequired};
        Inner.defaultProps = {inner: 0};
        const Middle = React.memo(Inner);
        Middle.propTypes = {middle: PropTypes.number.isRequired};
        Middle.defaultProps = {middle: 0};
        const Outer = React.memo(Middle);
        Outer.propTypes = {outer: PropTypes.number.isRequired};
        Outer.defaultProps = {outer: 0};

        // No warning expected because defaultProps satisfy both.
        ReactNoop.render(<Outer />);
        expect(Scheduler).toFlushWithoutYielding();

        // Mount
        expect(() => {
          ReactNoop.render(<Outer inner="2" middle="3" outer="4" />);
          expect(Scheduler).toFlushWithoutYielding();
        }).toWarnDev([
          'Invalid prop `outer` of type `string` supplied to `Inner`, expected `number`.',
          'Invalid prop `middle` of type `string` supplied to `Inner`, expected `number`.',
          'Invalid prop `inner` of type `string` supplied to `Inner`, expected `number`.',
        ]);

        // Update
        expect(() => {
          ReactNoop.render(
            <Outer inner={false} middle={false} outer={false} />,
          );
          expect(Scheduler).toFlushWithoutYielding();
        }).toWarnDev([
          'Invalid prop `outer` of type `boolean` supplied to `Inner`, expected `number`.',
          'Invalid prop `middle` of type `boolean` supplied to `Inner`, expected `number`.',
          'Invalid prop `inner` of type `boolean` supplied to `Inner`, expected `number`.',
        ]);
      });
    });
  }
});
