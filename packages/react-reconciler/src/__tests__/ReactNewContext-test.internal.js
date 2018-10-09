/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let ReactFeatureFlags = require('shared/ReactFeatureFlags');

let React = require('react');
let useContext;
let ReactNoop;
let gen;

describe('ReactNewContext', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableHooks = true;
    React = require('react');
    useContext = React.useContext;
    ReactNoop = require('react-noop-renderer');
    gen = require('random-seed');
  });

  function Text(props) {
    ReactNoop.yield(props.text);
    return <span prop={props.text} />;
  }

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function readContext(Context, observedBits) {
    const dispatcher =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner
        .currentDispatcher;
    return dispatcher.readContext(Context, observedBits);
  }

  // We have several ways of reading from context. sharedContextTests runs
  // a suite of tests for a given context consumer implementation.
  sharedContextTests('Context.Consumer', Context => Context.Consumer);
  sharedContextTests(
    'useContext inside function component',
    Context =>
      function Consumer(props) {
        const observedBits = props.unstable_observedBits;
        const contextValue = useContext(Context, observedBits);
        const render = props.children;
        return render(contextValue);
      },
  );
  sharedContextTests(
    'readContext(Context) inside class component',
    Context =>
      class Consumer extends React.Component {
        render() {
          const observedBits = this.props.unstable_observedBits;
          const contextValue = readContext(Context, observedBits);
          const render = this.props.children;
          return render(contextValue);
        }
      },
  );

  function sharedContextTests(label, getConsumer) {
    describe(`reading context with ${label}`, () => {
      it('simple mount and update', () => {
        const Context = React.createContext(1);
        const Consumer = getConsumer(Context);

        const Indirection = React.Fragment;

        function App(props) {
          return (
            <Context.Provider value={props.value}>
              <Indirection>
                <Indirection>
                  <Consumer>
                    {value => <span prop={'Result: ' + value} />}
                  </Consumer>
                </Indirection>
              </Indirection>
            </Context.Provider>
          );
        }

        ReactNoop.render(<App value={2} />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([span('Result: 2')]);

        // Update
        ReactNoop.render(<App value={3} />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([span('Result: 3')]);
      });

      it('propagates through shouldComponentUpdate false', () => {
        const Context = React.createContext(1);
        const ContextConsumer = getConsumer(Context);

        function Provider(props) {
          ReactNoop.yield('Provider');
          return (
            <Context.Provider value={props.value}>
              {props.children}
            </Context.Provider>
          );
        }

        function Consumer(props) {
          ReactNoop.yield('Consumer');
          return (
            <ContextConsumer>
              {value => {
                ReactNoop.yield('Consumer render prop');
                return <span prop={'Result: ' + value} />;
              }}
            </ContextConsumer>
          );
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            ReactNoop.yield('Indirection');
            return this.props.children;
          }
        }

        function App(props) {
          ReactNoop.yield('App');
          return (
            <Provider value={props.value}>
              <Indirection>
                <Indirection>
                  <Consumer />
                </Indirection>
              </Indirection>
            </Provider>
          );
        }

        ReactNoop.render(<App value={2} />);
        expect(ReactNoop.flush()).toEqual([
          'App',
          'Provider',
          'Indirection',
          'Indirection',
          'Consumer',
          'Consumer render prop',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Result: 2')]);

        // Update
        ReactNoop.render(<App value={3} />);
        expect(ReactNoop.flush()).toEqual([
          'App',
          'Provider',
          'Consumer render prop',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Result: 3')]);
      });

      it('consumers bail out if context value is the same', () => {
        const Context = React.createContext(1);
        const ContextConsumer = getConsumer(Context);

        function Provider(props) {
          ReactNoop.yield('Provider');
          return (
            <Context.Provider value={props.value}>
              {props.children}
            </Context.Provider>
          );
        }

        function Consumer(props) {
          ReactNoop.yield('Consumer');
          return (
            <ContextConsumer>
              {value => {
                ReactNoop.yield('Consumer render prop');
                return <span prop={'Result: ' + value} />;
              }}
            </ContextConsumer>
          );
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            ReactNoop.yield('Indirection');
            return this.props.children;
          }
        }

        function App(props) {
          ReactNoop.yield('App');
          return (
            <Provider value={props.value}>
              <Indirection>
                <Indirection>
                  <Consumer />
                </Indirection>
              </Indirection>
            </Provider>
          );
        }

        ReactNoop.render(<App value={2} />);
        expect(ReactNoop.flush()).toEqual([
          'App',
          'Provider',
          'Indirection',
          'Indirection',
          'Consumer',
          'Consumer render prop',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Result: 2')]);

        // Update with the same context value
        ReactNoop.render(<App value={2} />);
        expect(ReactNoop.flush()).toEqual([
          'App',
          'Provider',
          // Don't call render prop again
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Result: 2')]);
      });

      it('nested providers', () => {
        const Context = React.createContext(1);
        const Consumer = getConsumer(Context);

        function Provider(props) {
          return (
            <Consumer>
              {contextValue => (
                // Multiply previous context value by 2, unless prop overrides
                <Context.Provider value={props.value || contextValue * 2}>
                  {props.children}
                </Context.Provider>
              )}
            </Consumer>
          );
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            return this.props.children;
          }
        }

        function App(props) {
          return (
            <Provider value={props.value}>
              <Indirection>
                <Provider>
                  <Indirection>
                    <Provider>
                      <Indirection>
                        <Consumer>
                          {value => <span prop={'Result: ' + value} />}
                        </Consumer>
                      </Indirection>
                    </Provider>
                  </Indirection>
                </Provider>
              </Indirection>
            </Provider>
          );
        }

        ReactNoop.render(<App value={2} />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([span('Result: 8')]);

        // Update
        ReactNoop.render(<App value={3} />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([span('Result: 12')]);
      });

      it('should provide the correct (default) values to consumers outside of a provider', () => {
        const FooContext = React.createContext({value: 'foo-initial'});
        const BarContext = React.createContext({value: 'bar-initial'});
        const FooConsumer = getConsumer(FooContext);
        const BarConsumer = getConsumer(BarContext);

        const Verify = ({actual, expected}) => {
          expect(expected).toBe(actual);
          return null;
        };

        ReactNoop.render(
          <React.Fragment>
            <BarContext.Provider value={{value: 'bar-updated'}}>
              <BarConsumer>
                {({value}) => <Verify actual={value} expected="bar-updated" />}
              </BarConsumer>

              <FooContext.Provider value={{value: 'foo-updated'}}>
                <FooConsumer>
                  {({value}) => (
                    <Verify actual={value} expected="foo-updated" />
                  )}
                </FooConsumer>
              </FooContext.Provider>
            </BarContext.Provider>

            <FooConsumer>
              {({value}) => <Verify actual={value} expected="foo-initial" />}
            </FooConsumer>
            <BarConsumer>
              {({value}) => <Verify actual={value} expected="bar-initial" />}
            </BarConsumer>
          </React.Fragment>,
        );
        ReactNoop.flush();
      });

      it('multiple consumers in different branches', () => {
        const Context = React.createContext(1);
        const Consumer = getConsumer(Context);

        function Provider(props) {
          return (
            <Context.Consumer>
              {contextValue => (
                // Multiply previous context value by 2, unless prop overrides
                <Context.Provider value={props.value || contextValue * 2}>
                  {props.children}
                </Context.Provider>
              )}
            </Context.Consumer>
          );
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            return this.props.children;
          }
        }

        function App(props) {
          return (
            <Provider value={props.value}>
              <Indirection>
                <Indirection>
                  <Provider>
                    <Consumer>
                      {value => <span prop={'Result: ' + value} />}
                    </Consumer>
                  </Provider>
                </Indirection>
                <Indirection>
                  <Consumer>
                    {value => <span prop={'Result: ' + value} />}
                  </Consumer>
                </Indirection>
              </Indirection>
            </Provider>
          );
        }

        ReactNoop.render(<App value={2} />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([
          span('Result: 4'),
          span('Result: 2'),
        ]);

        // Update
        ReactNoop.render(<App value={3} />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([
          span('Result: 6'),
          span('Result: 3'),
        ]);

        // Another update
        ReactNoop.render(<App value={4} />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([
          span('Result: 8'),
          span('Result: 4'),
        ]);
      });

      it('compares context values with Object.is semantics', () => {
        const Context = React.createContext(1);
        const ContextConsumer = getConsumer(Context);

        function Provider(props) {
          ReactNoop.yield('Provider');
          return (
            <Context.Provider value={props.value}>
              {props.children}
            </Context.Provider>
          );
        }

        function Consumer(props) {
          ReactNoop.yield('Consumer');
          return (
            <ContextConsumer>
              {value => {
                ReactNoop.yield('Consumer render prop');
                return <span prop={'Result: ' + value} />;
              }}
            </ContextConsumer>
          );
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            ReactNoop.yield('Indirection');
            return this.props.children;
          }
        }

        function App(props) {
          ReactNoop.yield('App');
          return (
            <Provider value={props.value}>
              <Indirection>
                <Indirection>
                  <Consumer />
                </Indirection>
              </Indirection>
            </Provider>
          );
        }

        ReactNoop.render(<App value={NaN} />);
        expect(ReactNoop.flush()).toEqual([
          'App',
          'Provider',
          'Indirection',
          'Indirection',
          'Consumer',
          'Consumer render prop',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Result: NaN')]);

        // Update
        ReactNoop.render(<App value={NaN} />);
        expect(ReactNoop.flush()).toEqual([
          'App',
          'Provider',
          // Consumer should not re-render again
          // 'Consumer render prop',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Result: NaN')]);
      });

      it('context unwinds when interrupted', () => {
        const Context = React.createContext('Default');
        const ContextConsumer = getConsumer(Context);

        function Consumer(props) {
          return (
            <ContextConsumer>
              {value => <span prop={'Result: ' + value} />}
            </ContextConsumer>
          );
        }

        function BadRender() {
          throw new Error('Bad render');
        }

        class ErrorBoundary extends React.Component {
          state = {error: null};
          componentDidCatch(error) {
            this.setState({error});
          }
          render() {
            if (this.state.error) {
              return null;
            }
            return this.props.children;
          }
        }

        function App(props) {
          return (
            <React.Fragment>
              <Context.Provider value="Does not unwind">
                <ErrorBoundary>
                  <Context.Provider value="Unwinds after BadRender throws">
                    <BadRender />
                  </Context.Provider>
                </ErrorBoundary>
                <Consumer />
              </Context.Provider>
            </React.Fragment>
          );
        }

        ReactNoop.render(<App value="A" />);
        ReactNoop.flush();
        expect(ReactNoop.getChildren()).toEqual([
          // The second provider should use the default value.
          span('Result: Does not unwind'),
        ]);
      });

      it('can skip consumers with bitmask', () => {
        const Context = React.createContext({foo: 0, bar: 0}, (a, b) => {
          let result = 0;
          if (a.foo !== b.foo) {
            result |= 0b01;
          }
          if (a.bar !== b.bar) {
            result |= 0b10;
          }
          return result;
        });
        const Consumer = getConsumer(Context);

        function Provider(props) {
          return (
            <Context.Provider value={{foo: props.foo, bar: props.bar}}>
              {props.children}
            </Context.Provider>
          );
        }

        function Foo() {
          return (
            <Consumer unstable_observedBits={0b01}>
              {value => {
                ReactNoop.yield('Foo');
                return <span prop={'Foo: ' + value.foo} />;
              }}
            </Consumer>
          );
        }

        function Bar() {
          return (
            <Consumer unstable_observedBits={0b10}>
              {value => {
                ReactNoop.yield('Bar');
                return <span prop={'Bar: ' + value.bar} />;
              }}
            </Consumer>
          );
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            return this.props.children;
          }
        }

        function App(props) {
          return (
            <Provider foo={props.foo} bar={props.bar}>
              <Indirection>
                <Indirection>
                  <Foo />
                </Indirection>
                <Indirection>
                  <Bar />
                </Indirection>
              </Indirection>
            </Provider>
          );
        }

        ReactNoop.render(<App foo={1} bar={1} />);
        expect(ReactNoop.flush()).toEqual(['Foo', 'Bar']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 1'),
          span('Bar: 1'),
        ]);

        // Update only foo
        ReactNoop.render(<App foo={2} bar={1} />);
        expect(ReactNoop.flush()).toEqual(['Foo']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 2'),
          span('Bar: 1'),
        ]);

        // Update only bar
        ReactNoop.render(<App foo={2} bar={2} />);
        expect(ReactNoop.flush()).toEqual(['Bar']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 2'),
          span('Bar: 2'),
        ]);

        // Update both
        ReactNoop.render(<App foo={3} bar={3} />);
        expect(ReactNoop.flush()).toEqual(['Foo', 'Bar']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 3'),
          span('Bar: 3'),
        ]);
      });

      it('can skip parents with bitmask bailout while updating their children', () => {
        const Context = React.createContext({foo: 0, bar: 0}, (a, b) => {
          let result = 0;
          if (a.foo !== b.foo) {
            result |= 0b01;
          }
          if (a.bar !== b.bar) {
            result |= 0b10;
          }
          return result;
        });
        const Consumer = getConsumer(Context);

        function Provider(props) {
          return (
            <Context.Provider value={{foo: props.foo, bar: props.bar}}>
              {props.children}
            </Context.Provider>
          );
        }

        function Foo(props) {
          return (
            <Consumer unstable_observedBits={0b01}>
              {value => {
                ReactNoop.yield('Foo');
                return (
                  <React.Fragment>
                    <span prop={'Foo: ' + value.foo} />
                    {props.children && props.children()}
                  </React.Fragment>
                );
              }}
            </Consumer>
          );
        }

        function Bar(props) {
          return (
            <Consumer unstable_observedBits={0b10}>
              {value => {
                ReactNoop.yield('Bar');
                return (
                  <React.Fragment>
                    <span prop={'Bar: ' + value.bar} />
                    {props.children && props.children()}
                  </React.Fragment>
                );
              }}
            </Consumer>
          );
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            return this.props.children;
          }
        }

        function App(props) {
          return (
            <Provider foo={props.foo} bar={props.bar}>
              <Indirection>
                <Foo>
                  {/* Use a render prop so we don't test constant elements. */}
                  {() => (
                    <Indirection>
                      <Bar>
                        {() => (
                          <Indirection>
                            <Foo />
                          </Indirection>
                        )}
                      </Bar>
                    </Indirection>
                  )}
                </Foo>
              </Indirection>
            </Provider>
          );
        }

        ReactNoop.render(<App foo={1} bar={1} />);
        expect(ReactNoop.flush()).toEqual(['Foo', 'Bar', 'Foo']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 1'),
          span('Bar: 1'),
          span('Foo: 1'),
        ]);

        // Update only foo
        ReactNoop.render(<App foo={2} bar={1} />);
        expect(ReactNoop.flush()).toEqual(['Foo', 'Foo']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 2'),
          span('Bar: 1'),
          span('Foo: 2'),
        ]);

        // Update only bar
        ReactNoop.render(<App foo={2} bar={2} />);
        expect(ReactNoop.flush()).toEqual(['Bar']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 2'),
          span('Bar: 2'),
          span('Foo: 2'),
        ]);

        // Update both
        ReactNoop.render(<App foo={3} bar={3} />);
        expect(ReactNoop.flush()).toEqual(['Foo', 'Bar', 'Foo']);
        expect(ReactNoop.getChildren()).toEqual([
          span('Foo: 3'),
          span('Bar: 3'),
          span('Foo: 3'),
        ]);
      });

      it("does not re-render if there's an update in a child", () => {
        const Context = React.createContext(0);
        const Consumer = getConsumer(Context);

        let child;
        class Child extends React.Component {
          state = {step: 0};
          render() {
            ReactNoop.yield('Child');
            return (
              <span
                prop={`Context: ${this.props.context}, Step: ${
                  this.state.step
                }`}
              />
            );
          }
        }

        function App(props) {
          return (
            <Context.Provider value={props.value}>
              <Consumer>
                {value => {
                  ReactNoop.yield('Consumer render prop');
                  return <Child ref={inst => (child = inst)} context={value} />;
                }}
              </Consumer>
            </Context.Provider>
          );
        }

        // Initial mount
        ReactNoop.render(<App value={1} />);
        expect(ReactNoop.flush()).toEqual(['Consumer render prop', 'Child']);
        expect(ReactNoop.getChildren()).toEqual([span('Context: 1, Step: 0')]);

        child.setState({step: 1});
        expect(ReactNoop.flush()).toEqual(['Child']);
        expect(ReactNoop.getChildren()).toEqual([span('Context: 1, Step: 1')]);
      });

      it('consumer bails out if value is unchanged and something above bailed out', () => {
        const Context = React.createContext(0);
        const Consumer = getConsumer(Context);

        function renderChildValue(value) {
          ReactNoop.yield('Consumer');
          return <span prop={value} />;
        }

        function ChildWithInlineRenderCallback() {
          ReactNoop.yield('ChildWithInlineRenderCallback');
          // Note: we are intentionally passing an inline arrow. Don't refactor.
          return <Consumer>{value => renderChildValue(value)}</Consumer>;
        }

        function ChildWithCachedRenderCallback() {
          ReactNoop.yield('ChildWithCachedRenderCallback');
          return <Consumer>{renderChildValue}</Consumer>;
        }

        class PureIndirection extends React.PureComponent {
          render() {
            ReactNoop.yield('PureIndirection');
            return (
              <React.Fragment>
                <ChildWithInlineRenderCallback />
                <ChildWithCachedRenderCallback />
              </React.Fragment>
            );
          }
        }

        class App extends React.Component {
          render() {
            ReactNoop.yield('App');
            return (
              <Context.Provider value={this.props.value}>
                <PureIndirection />
              </Context.Provider>
            );
          }
        }

        // Initial mount
        ReactNoop.render(<App value={1} />);
        expect(ReactNoop.flush()).toEqual([
          'App',
          'PureIndirection',
          'ChildWithInlineRenderCallback',
          'Consumer',
          'ChildWithCachedRenderCallback',
          'Consumer',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span(1), span(1)]);

        // Update (bailout)
        ReactNoop.render(<App value={1} />);
        expect(ReactNoop.flush()).toEqual(['App']);
        expect(ReactNoop.getChildren()).toEqual([span(1), span(1)]);

        // Update (no bailout)
        ReactNoop.render(<App value={2} />);
        expect(ReactNoop.flush()).toEqual(['App', 'Consumer', 'Consumer']);
        expect(ReactNoop.getChildren()).toEqual([span(2), span(2)]);
      });

      // Context consumer bails out on propagating "deep" updates when `value` hasn't changed.
      // However, it doesn't bail out from rendering if the component above it re-rendered anyway.
      // If we bailed out on referential equality, it would be confusing that you
      // can call this.setState(), but an autobound render callback "blocked" the update.
      // https://github.com/facebook/react/pull/12470#issuecomment-376917711
      it('consumer does not bail out if there were no bailouts above it', () => {
        const Context = React.createContext(0);
        const Consumer = getConsumer(Context);

        class App extends React.Component {
          state = {
            text: 'hello',
          };

          renderConsumer = context => {
            ReactNoop.yield('App#renderConsumer');
            return <span prop={this.state.text} />;
          };

          render() {
            ReactNoop.yield('App');
            return (
              <Context.Provider value={this.props.value}>
                <Consumer>{this.renderConsumer}</Consumer>
              </Context.Provider>
            );
          }
        }

        // Initial mount
        let inst;
        ReactNoop.render(<App value={1} ref={ref => (inst = ref)} />);
        expect(ReactNoop.flush()).toEqual(['App', 'App#renderConsumer']);
        expect(ReactNoop.getChildren()).toEqual([span('hello')]);

        // Update
        inst.setState({text: 'goodbye'});
        expect(ReactNoop.flush()).toEqual(['App', 'App#renderConsumer']);
        expect(ReactNoop.getChildren()).toEqual([span('goodbye')]);
      });

      // This is a regression case for https://github.com/facebook/react/issues/12389.
      it('does not run into an infinite loop', () => {
        const Context = React.createContext(null);
        const Consumer = getConsumer(Context);

        class App extends React.Component {
          renderItem(id) {
            return (
              <span key={id}>
                <Consumer>{() => <span>inner</span>}</Consumer>
                <span>outer</span>
              </span>
            );
          }
          renderList() {
            const list = [1, 2].map(id => this.renderItem(id));
            if (this.props.reverse) {
              list.reverse();
            }
            return list;
          }
          render() {
            return (
              <Context.Provider value={{}}>
                {this.renderList()}
              </Context.Provider>
            );
          }
        }

        ReactNoop.render(<App reverse={false} />);
        ReactNoop.flush();
        ReactNoop.render(<App reverse={true} />);
        ReactNoop.flush();
        ReactNoop.render(<App reverse={false} />);
        ReactNoop.flush();
      });

      // This is a regression case for https://github.com/facebook/react/issues/12686
      it('does not skip some siblings', () => {
        const Context = React.createContext(0);
        const ContextConsumer = getConsumer(Context);

        class App extends React.Component {
          state = {
            step: 0,
          };

          render() {
            ReactNoop.yield('App');
            return (
              <Context.Provider value={this.state.step}>
                <StaticContent />
                {this.state.step > 0 && <Indirection />}
              </Context.Provider>
            );
          }
        }

        class StaticContent extends React.PureComponent {
          render() {
            return (
              <React.Fragment>
                <React.Fragment>
                  <span prop="static 1" />
                  <span prop="static 2" />
                </React.Fragment>
              </React.Fragment>
            );
          }
        }

        class Indirection extends React.PureComponent {
          render() {
            return (
              <ContextConsumer>
                {value => {
                  ReactNoop.yield('Consumer');
                  return <span prop={value} />;
                }}
              </ContextConsumer>
            );
          }
        }

        // Initial mount
        let inst;
        ReactNoop.render(<App ref={ref => (inst = ref)} />);
        expect(ReactNoop.flush()).toEqual(['App']);
        expect(ReactNoop.getChildren()).toEqual([
          span('static 1'),
          span('static 2'),
        ]);
        // Update the first time
        inst.setState({step: 1});
        expect(ReactNoop.flush()).toEqual(['App', 'Consumer']);
        expect(ReactNoop.getChildren()).toEqual([
          span('static 1'),
          span('static 2'),
          span(1),
        ]);
        // Update the second time
        inst.setState({step: 2});
        expect(ReactNoop.flush()).toEqual(['App', 'Consumer']);
        expect(ReactNoop.getChildren()).toEqual([
          span('static 1'),
          span('static 2'),
          span(2),
        ]);
      });
    });
  }

  describe('Context.Provider', () => {
    it('warns if calculateChangedBits returns larger than a 31-bit integer', () => {
      const Context = React.createContext(
        0,
        (a, b) => Math.pow(2, 32) - 1, // Return 32 bit int
      );

      function App(props) {
        return <Context.Provider value={props.value} />;
      }

      ReactNoop.render(<App value={1} />);
      ReactNoop.flush();

      // Update
      ReactNoop.render(<App value={2} />);
      expect(ReactNoop.flush).toWarnDev(
        'calculateChangedBits: Expected the return value to be a 31-bit ' +
          'integer. Instead received: 4294967295',
      );
    });

    it('warns if multiple renderers concurrently render the same context', () => {
      spyOnDev(console, 'error');
      const Context = React.createContext(0);

      function Foo(props) {
        ReactNoop.yield('Foo');
        return null;
      }

      function App(props) {
        return (
          <Context.Provider value={props.value}>
            <Foo />
            <Foo />
          </Context.Provider>
        );
      }

      ReactNoop.render(<App value={1} />);
      // Render past the Provider, but don't commit yet
      ReactNoop.flushThrough(['Foo']);

      // Get a new copy of ReactNoop
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      React = require('react');
      ReactNoop = require('react-noop-renderer');

      // Render the provider again using a different renderer
      ReactNoop.render(<App value={1} />);
      ReactNoop.flush();

      if (__DEV__) {
        expect(console.error.calls.argsFor(0)[0]).toContain(
          'Detected multiple renderers concurrently rendering the same ' +
            'context provider. This is currently unsupported',
        );
      }
    });

    it('provider bails out if children and value are unchanged (like sCU)', () => {
      const Context = React.createContext(0);

      function Child() {
        ReactNoop.yield('Child');
        return <span prop="Child" />;
      }

      const children = <Child />;

      function App(props) {
        ReactNoop.yield('App');
        return (
          <Context.Provider value={props.value}>{children}</Context.Provider>
        );
      }

      // Initial mount
      ReactNoop.render(<App value={1} />);
      expect(ReactNoop.flush()).toEqual(['App', 'Child']);
      expect(ReactNoop.getChildren()).toEqual([span('Child')]);

      // Update
      ReactNoop.render(<App value={1} />);
      expect(ReactNoop.flush()).toEqual([
        'App',
        // Child does not re-render
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Child')]);
    });

    it('provider does not bail out if legacy context changed above', () => {
      const Context = React.createContext(0);

      function Child() {
        ReactNoop.yield('Child');
        return <span prop="Child" />;
      }

      const children = <Child />;

      class LegacyProvider extends React.Component {
        static childContextTypes = {
          legacyValue: () => {},
        };
        state = {legacyValue: 1};
        getChildContext() {
          return {legacyValue: this.state.legacyValue};
        }
        render() {
          ReactNoop.yield('LegacyProvider');
          return this.props.children;
        }
      }

      class App extends React.Component {
        state = {value: 1};
        render() {
          ReactNoop.yield('App');
          return (
            <Context.Provider value={this.state.value}>
              {this.props.children}
            </Context.Provider>
          );
        }
      }

      const legacyProviderRef = React.createRef();
      const appRef = React.createRef();

      // Initial mount
      ReactNoop.render(
        <LegacyProvider ref={legacyProviderRef}>
          <App ref={appRef} value={1}>
            {children}
          </App>
        </LegacyProvider>,
      );
      expect(() => {
        expect(ReactNoop.flush()).toEqual(['LegacyProvider', 'App', 'Child']);
      }).toWarnDev(
        'Legacy context API has been detected within a strict-mode tree: \n\n' +
          'Please update the following components: LegacyProvider',
        {withoutStack: true},
      );
      expect(ReactNoop.getChildren()).toEqual([span('Child')]);

      // Update App with same value (should bail out)
      appRef.current.setState({value: 1});
      expect(ReactNoop.flush()).toEqual(['App']);
      expect(ReactNoop.getChildren()).toEqual([span('Child')]);

      // Update LegacyProvider (should not bail out)
      legacyProviderRef.current.setState({value: 1});
      expect(ReactNoop.flush()).toEqual(['LegacyProvider', 'App', 'Child']);
      expect(ReactNoop.getChildren()).toEqual([span('Child')]);

      // Update App with same value (should bail out)
      appRef.current.setState({value: 1});
      expect(ReactNoop.flush()).toEqual(['App']);
      expect(ReactNoop.getChildren()).toEqual([span('Child')]);
    });
  });

  describe('Context.Consumer', () => {
    it('warns if child is not a function', () => {
      spyOnDev(console, 'error');
      const Context = React.createContext(0);
      ReactNoop.render(<Context.Consumer />);
      expect(ReactNoop.flush).toThrow('render is not a function');
      if (__DEV__) {
        expect(console.error.calls.argsFor(0)[0]).toContain(
          'A context consumer was rendered with multiple children, or a child ' +
            "that isn't a function",
        );
      }
    });

    it('can read other contexts inside consumer render prop', () => {
      const FooContext = React.createContext(0);
      const BarContext = React.createContext(0);

      function FooAndBar() {
        return (
          <FooContext.Consumer>
            {foo => {
              const bar = readContext(BarContext);
              return <Text text={`Foo: ${foo}, Bar: ${bar}`} />;
            }}
          </FooContext.Consumer>
        );
      }

      class Indirection extends React.Component {
        shouldComponentUpdate() {
          return false;
        }
        render() {
          return this.props.children;
        }
      }

      function App(props) {
        return (
          <FooContext.Provider value={props.foo}>
            <BarContext.Provider value={props.bar}>
              <Indirection>
                <FooAndBar />
              </Indirection>
            </BarContext.Provider>
          </FooContext.Provider>
        );
      }

      ReactNoop.render(<App foo={1} bar={1} />);
      expect(ReactNoop.flush()).toEqual(['Foo: 1, Bar: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Foo: 1, Bar: 1')]);

      // Update foo
      ReactNoop.render(<App foo={2} bar={1} />);
      expect(ReactNoop.flush()).toEqual(['Foo: 2, Bar: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Foo: 2, Bar: 1')]);

      // Update bar
      ReactNoop.render(<App foo={2} bar={2} />);
      expect(ReactNoop.flush()).toEqual(['Foo: 2, Bar: 2']);
      expect(ReactNoop.getChildren()).toEqual([span('Foo: 2, Bar: 2')]);
    });
  });

  describe('useContext', () => {
    it('can use the same context multiple times in the same function', () => {
      const Context = React.createContext({foo: 0, bar: 0, baz: 0}, (a, b) => {
        let result = 0;
        if (a.foo !== b.foo) {
          result |= 0b001;
        }
        if (a.bar !== b.bar) {
          result |= 0b010;
        }
        if (a.baz !== b.baz) {
          result |= 0b100;
        }
        return result;
      });

      function Provider(props) {
        return (
          <Context.Provider
            value={{foo: props.foo, bar: props.bar, baz: props.baz}}>
            {props.children}
          </Context.Provider>
        );
      }

      function FooAndBar() {
        const {foo} = useContext(Context, 0b001);
        const {bar} = useContext(Context, 0b010);
        return <Text text={`Foo: ${foo}, Bar: ${bar}`} />;
      }

      function Baz() {
        const {baz} = useContext(Context, 0b100);
        return <Text text={'Baz: ' + baz} />;
      }

      class Indirection extends React.Component {
        shouldComponentUpdate() {
          return false;
        }
        render() {
          return this.props.children;
        }
      }

      function App(props) {
        return (
          <Provider foo={props.foo} bar={props.bar} baz={props.baz}>
            <Indirection>
              <Indirection>
                <FooAndBar />
              </Indirection>
              <Indirection>
                <Baz />
              </Indirection>
            </Indirection>
          </Provider>
        );
      }

      ReactNoop.render(<App foo={1} bar={1} baz={1} />);
      expect(ReactNoop.flush()).toEqual(['Foo: 1, Bar: 1', 'Baz: 1']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Foo: 1, Bar: 1'),
        span('Baz: 1'),
      ]);

      // Update only foo
      ReactNoop.render(<App foo={2} bar={1} baz={1} />);
      expect(ReactNoop.flush()).toEqual(['Foo: 2, Bar: 1']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Foo: 2, Bar: 1'),
        span('Baz: 1'),
      ]);

      // Update only bar
      ReactNoop.render(<App foo={2} bar={2} baz={1} />);
      expect(ReactNoop.flush()).toEqual(['Foo: 2, Bar: 2']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Foo: 2, Bar: 2'),
        span('Baz: 1'),
      ]);

      // Update only baz
      ReactNoop.render(<App foo={2} bar={2} baz={2} />);
      expect(ReactNoop.flush()).toEqual(['Baz: 2']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Foo: 2, Bar: 2'),
        span('Baz: 2'),
      ]);
    });

    it('throws when used in a class component', () => {
      const Context = React.createContext(0);
      class Foo extends React.Component {
        render() {
          return useContext(Context);
        }
      }
      ReactNoop.render(<Foo />);
      expect(ReactNoop.flush).toThrow(
        'Hooks can only be called inside the body of a function component.',
      );
    });
  });

  it('unwinds after errors in complete phase', () => {
    const Context = React.createContext(0);

    // This is a regression test for stack misalignment
    // caused by unwinding the context from wrong point.
    ReactNoop.render(
      <errorInCompletePhase>
        <Context.Provider />
      </errorInCompletePhase>,
    );
    expect(ReactNoop.flush).toThrow('Error in host config.');

    ReactNoop.render(
      <Context.Provider value={10}>
        <Context.Consumer>{value => <span prop={value} />}</Context.Consumer>
      </Context.Provider>,
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(10)]);
  });

  describe('fuzz test', () => {
    const Fragment = React.Fragment;
    const contextKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    const FLUSH_ALL = 'FLUSH_ALL';
    function flushAll() {
      return {
        type: FLUSH_ALL,
        toString() {
          return `flushAll()`;
        },
      };
    }

    const FLUSH = 'FLUSH';
    function flush(unitsOfWork) {
      return {
        type: FLUSH,
        unitsOfWork,
        toString() {
          return `flush(${unitsOfWork})`;
        },
      };
    }

    const UPDATE = 'UPDATE';
    function update(key, value) {
      return {
        type: UPDATE,
        key,
        value,
        toString() {
          return `update('${key}', ${value})`;
        },
      };
    }

    function randomInteger(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function randomAction() {
      switch (randomInteger(0, 3)) {
        case 0:
          return flushAll();
        case 1:
          return flush(randomInteger(0, 500));
        case 2:
          const key = contextKeys[randomInteger(0, contextKeys.length)];
          const value = randomInteger(1, 10);
          return update(key, value);
        default:
          throw new Error('Switch statement should be exhaustive');
      }
    }

    function randomActions(n) {
      let actions = [];
      for (let i = 0; i < n; i++) {
        actions.push(randomAction());
      }
      return actions;
    }

    function ContextSimulator(maxDepth) {
      const contexts = new Map(
        contextKeys.map(key => {
          const Context = React.createContext(0);
          Context.displayName = 'Context' + key;
          return [key, Context];
        }),
      );

      class ConsumerTree extends React.Component {
        shouldComponentUpdate() {
          return false;
        }
        render() {
          if (this.props.depth >= this.props.maxDepth) {
            return null;
          }
          const consumers = [0, 1, 2].map(i => {
            const randomKey =
              contextKeys[
                this.props.rand.intBetween(0, contextKeys.length - 1)
              ];
            const Context = contexts.get(randomKey);
            return (
              <Context.Consumer key={i}>
                {value => (
                  <Fragment>
                    <span prop={`${randomKey}:${value}`} />
                    <ConsumerTree
                      rand={this.props.rand}
                      depth={this.props.depth + 1}
                      maxDepth={this.props.maxDepth}
                    />
                  </Fragment>
                )}
              </Context.Consumer>
            );
          });
          return consumers;
        }
      }

      function Root(props) {
        return contextKeys.reduceRight((children, key) => {
          const Context = contexts.get(key);
          const value = props.values[key];
          return <Context.Provider value={value}>{children}</Context.Provider>;
        }, <ConsumerTree rand={props.rand} depth={0} maxDepth={props.maxDepth} />);
      }

      const initialValues = contextKeys.reduce(
        (result, key, i) => ({...result, [key]: i + 1}),
        {},
      );

      function assertConsistentTree(expectedValues = {}) {
        const children = ReactNoop.getChildren();
        children.forEach(child => {
          const text = child.prop;
          const key = text[0];
          const value = parseInt(text[2], 10);
          const expectedValue = expectedValues[key];
          if (expectedValue === undefined) {
            // If an expected value was not explicitly passed to this function,
            // use the first occurrence.
            expectedValues[key] = value;
          } else if (value !== expectedValue) {
            throw new Error(
              `Inconsistent value! Expected: ${key}:${expectedValue}. Actual: ${text}`,
            );
          }
        });
      }

      function simulate(seed, actions) {
        const rand = gen.create(seed);
        let finalExpectedValues = initialValues;
        function updateRoot() {
          ReactNoop.render(
            <Root
              maxDepth={maxDepth}
              rand={rand}
              values={finalExpectedValues}
            />,
          );
        }
        updateRoot();

        actions.forEach(action => {
          switch (action.type) {
            case FLUSH_ALL:
              ReactNoop.flush();
              break;
            case FLUSH:
              ReactNoop.flushUnitsOfWork(action.unitsOfWork);
              break;
            case UPDATE:
              finalExpectedValues = {
                ...finalExpectedValues,
                [action.key]: action.value,
              };
              updateRoot();
              break;
            default:
              throw new Error('Switch statement should be exhaustive');
          }
          assertConsistentTree();
        });

        ReactNoop.flush();
        assertConsistentTree(finalExpectedValues);
      }

      return {simulate};
    }

    it('hard-coded tests', () => {
      const {simulate} = ContextSimulator(5);
      simulate('randomSeed', [flush(3), update('A', 4)]);
    });

    it('generated tests', () => {
      const {simulate} = ContextSimulator(5);

      const LIMIT = 100;
      for (let i = 0; i < LIMIT; i++) {
        const seed = Math.random()
          .toString(36)
          .substr(2, 5);
        const actions = randomActions(5);
        try {
          simulate(seed, actions);
        } catch (error) {
          console.error(`
Context fuzz tester error! Copy and paste the following line into the test suite:
  simulate('${seed}', ${actions.join(', ')});
`);
          throw error;
        }
      }
    });
  });

  it('should warn with an error message when using context as a consumer in DEV', () => {
    const BarContext = React.createContext({value: 'bar-initial'});
    const BarConsumer = BarContext;

    function Component() {
      return (
        <React.Fragment>
          <BarContext.Provider value={{value: 'bar-updated'}}>
            <BarConsumer>
              {({value}) => <div actual={value} expected="bar-updated" />}
            </BarConsumer>
          </BarContext.Provider>
        </React.Fragment>
      );
    }

    expect(() => {
      ReactNoop.render(<Component />);
      ReactNoop.flush();
    }).toWarnDev(
      'Rendering <Context> directly is not supported and will be removed in ' +
        'a future major release. Did you mean to render <Context.Consumer> instead?',
    );
  });

  // False positive regression test.
  it('should not warn when using Consumer from React < 16.6 with newer renderer', () => {
    const BarContext = React.createContext({value: 'bar-initial'});
    // React 16.5 and earlier didn't have a separate object.
    BarContext.Consumer = BarContext;

    function Component() {
      return (
        <React.Fragment>
          <BarContext.Provider value={{value: 'bar-updated'}}>
            <BarContext.Consumer>
              {({value}) => <div actual={value} expected="bar-updated" />}
            </BarContext.Consumer>
          </BarContext.Provider>
        </React.Fragment>
      );
    }

    ReactNoop.render(<Component />);
    ReactNoop.flush();
  });

  it('should warn with an error message when using nested context consumers in DEV', () => {
    const BarContext = React.createContext({value: 'bar-initial'});
    const BarConsumer = BarContext;

    function Component() {
      return (
        <React.Fragment>
          <BarContext.Provider value={{value: 'bar-updated'}}>
            <BarConsumer.Consumer.Consumer>
              {({value}) => <div actual={value} expected="bar-updated" />}
            </BarConsumer.Consumer.Consumer>
          </BarContext.Provider>
        </React.Fragment>
      );
    }

    expect(() => {
      ReactNoop.render(<Component />);
      ReactNoop.flush();
    }).toWarnDev(
      'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
        'a future major release. Did you mean to render <Context.Consumer> instead?',
    );
  });

  it('should warn with an error message when using Context.Consumer.Provider DEV', () => {
    const BarContext = React.createContext({value: 'bar-initial'});

    function Component() {
      return (
        <React.Fragment>
          <BarContext.Consumer.Provider value={{value: 'bar-updated'}}>
            <BarContext.Consumer>
              {({value}) => <div actual={value} expected="bar-updated" />}
            </BarContext.Consumer>
          </BarContext.Consumer.Provider>
        </React.Fragment>
      );
    }

    expect(() => {
      ReactNoop.render(<Component />);
      ReactNoop.flush();
    }).toWarnDev(
      'Rendering <Context.Consumer.Provider> is not supported and will be removed in ' +
        'a future major release. Did you mean to render <Context.Provider> instead?',
    );
  });
});
