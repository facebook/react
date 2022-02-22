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
let ReactNoop;
let Suspense;
let Scheduler;
let act;

describe('memo', () => {
  beforeEach(() => {
    jest.resetModules();

    PropTypes = require('prop-types');
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev([
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
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev([
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
            return <Text text={this.props.count + String(this.props.suffix)} />;
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
        expect(() =>
          memo(),
        ).toErrorDev(
          'memo: The first argument must be a component. Instead ' +
            'received: undefined',
          {withoutStack: true},
        );
      });

      it('warns if the first argument is null', () => {
        expect(() =>
          memo(null),
        ).toErrorDev(
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
        }).toErrorDev(
          'Invalid prop `inner` of type `string` supplied to `FnInner`, expected `number`.',
        );

        // Update
        expect(() => {
          ReactNoop.render(<Fn inner={false} />);
          expect(Scheduler).toFlushWithoutYielding();
        }).toErrorDev(
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
        }).toErrorDev(
          // Outer props are checked in createElement
          'Invalid prop `outer` of type `string` supplied to `FnInner`, expected `number`.',
        );

        // Update
        expect(() => {
          ReactNoop.render(<Fn outer={false} />);
          expect(Scheduler).toFlushWithoutYielding();
        }).toErrorDev(
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
        ReactNoop.render(
          <div>
            <Outer />
          </div>,
        );
        expect(Scheduler).toFlushWithoutYielding();

        // Mount
        expect(() => {
          ReactNoop.render(
            <div>
              <Outer inner="2" middle="3" outer="4" />
            </div>,
          );
          expect(Scheduler).toFlushWithoutYielding();
        }).toErrorDev([
          'Invalid prop `outer` of type `string` supplied to `Inner`, expected `number`.',
          'Invalid prop `middle` of type `string` supplied to `Inner`, expected `number`.',
          'Invalid prop `inner` of type `string` supplied to `Inner`, expected `number`.',
        ]);

        // Update
        expect(() => {
          ReactNoop.render(
            <div>
              <Outer inner={false} middle={false} outer={false} />
            </div>,
          );
          expect(Scheduler).toFlushWithoutYielding();
        }).toErrorDev([
          'Invalid prop `outer` of type `boolean` supplied to `Inner`, expected `number`.',
          'Invalid prop `middle` of type `boolean` supplied to `Inner`, expected `number`.',
          'Invalid prop `inner` of type `boolean` supplied to `Inner`, expected `number`.',
        ]);
      });

      it('does not drop lower priority state updates when bailing out at higher pri (simple)', async () => {
        const {useState} = React;

        let setCounter;
        const Counter = memo(() => {
          const [counter, _setCounter] = useState(0);
          setCounter = _setCounter;
          return counter;
        });

        function App() {
          return (
            <Suspense fallback="Loading...">
              <Counter />
            </Suspense>
          );
        }

        const root = ReactNoop.createRoot();
        await act(async () => {
          root.render(<App />);
        });
        expect(root).toMatchRenderedOutput('0');

        await act(async () => {
          setCounter(1);
          ReactNoop.discreteUpdates(() => {
            root.render(<App />);
          });
        });
        expect(root).toMatchRenderedOutput('1');
      });

      it('does not drop lower priority state updates when bailing out at higher pri (complex)', async () => {
        const {useState} = React;

        let setCounter;
        const Counter = memo(
          () => {
            const [counter, _setCounter] = useState(0);
            setCounter = _setCounter;
            return counter;
          },
          (a, b) => a.complexProp.val === b.complexProp.val,
        );

        function App() {
          return (
            <Suspense fallback="Loading...">
              <Counter complexProp={{val: 1}} />
            </Suspense>
          );
        }

        const root = ReactNoop.createRoot();
        await act(async () => {
          root.render(<App />);
        });
        expect(root).toMatchRenderedOutput('0');

        await act(async () => {
          setCounter(1);
          ReactNoop.discreteUpdates(() => {
            root.render(<App />);
          });
        });
        expect(root).toMatchRenderedOutput('1');
      });
    });

    it('should fall back to showing something meaningful if no displayName or name are present', () => {
      const MemoComponent = React.memo(props => <div {...props} />);
      MemoComponent.propTypes = {
        required: PropTypes.string.isRequired,
      };

      expect(() =>
        ReactNoop.render(<MemoComponent optional="foo" />),
      ).toErrorDev(
        'Warning: Failed prop type: The prop `required` is marked as required in ' +
          '`Memo`, but its value is `undefined`.',
        // There's no component stack in this warning because the inner function is anonymous.
        // If we wanted to support this (for the Error frames / source location)
        // we could do this by updating ReactComponentStackFrame.
        {withoutStack: true},
      );
    });

    it('should honor a displayName if set on the inner component in warnings', () => {
      function Component(props) {
        return <div {...props} />;
      }
      Component.displayName = 'Inner';
      const MemoComponent = React.memo(Component);
      MemoComponent.propTypes = {
        required: PropTypes.string.isRequired,
      };

      expect(() =>
        ReactNoop.render(<MemoComponent optional="foo" />),
      ).toErrorDev(
        'Warning: Failed prop type: The prop `required` is marked as required in ' +
          '`Inner`, but its value is `undefined`.\n' +
          '    in Inner (at **)',
      );
    });

    it('should honor a displayName if set on the memo wrapper in warnings', () => {
      const MemoComponent = React.memo(function Component(props) {
        return <div {...props} />;
      });
      MemoComponent.displayName = 'Outer';
      MemoComponent.propTypes = {
        required: PropTypes.string.isRequired,
      };

      expect(() =>
        ReactNoop.render(<MemoComponent optional="foo" />),
      ).toErrorDev(
        'Warning: Failed prop type: The prop `required` is marked as required in ' +
          '`Outer`, but its value is `undefined`.\n' +
          '    in Component (at **)',
      );
    });

    it('should pass displayName to an anonymous inner component so it shows up in component stacks', () => {
      const MemoComponent = React.memo(props => {
        return <div {...props} />;
      });
      MemoComponent.displayName = 'Memo';
      MemoComponent.propTypes = {
        required: PropTypes.string.isRequired,
      };

      expect(() =>
        ReactNoop.render(<MemoComponent optional="foo" />),
      ).toErrorDev(
        'Warning: Failed prop type: The prop `required` is marked as required in ' +
          '`Memo`, but its value is `undefined`.\n' +
          '    in Memo (at **)',
      );
    });

    it('should honor a outer displayName when wrapped component and memo component set displayName at the same time.', () => {
      function Component(props) {
        return <div {...props} />;
      }
      Component.displayName = 'Inner';

      const MemoComponent = React.memo(Component);
      MemoComponent.displayName = 'Outer';
      MemoComponent.propTypes = {
        required: PropTypes.string.isRequired,
      };

      expect(() =>
        ReactNoop.render(<MemoComponent optional="foo" />),
      ).toErrorDev(
        'Warning: Failed prop type: The prop `required` is marked as required in ' +
          '`Outer`, but its value is `undefined`.\n' +
          '    in Inner (at **)',
      );
    });
  }
});
