/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let ReactFeatureFlags = require('shared/ReactFeatureFlags');

let React = require('react');
let ReactNoop;
let gen;

describe('ReactNewContext', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    gen = require('random-seed');
  });

  // function div(...children) {
  //   children = children.map(c => (typeof c === 'string' ? {text: c} : c));
  //   return {type: 'div', children, prop: undefined};
  // }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('simple mount and update', () => {
    const Context = React.createContext(1);

    function Consumer(props) {
      return (
        <Context.Consumer>
          {value => <span prop={'Result: ' + value} />}
        </Context.Consumer>
      );
    }

    const Indirection = React.Fragment;

    function App(props) {
      return (
        <Context.Provider value={props.value}>
          <Indirection>
            <Indirection>
              <Consumer />
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
        <Context.Consumer>
          {value => {
            ReactNoop.yield('Consumer render prop');
            return <span prop={'Result: ' + value} />;
          }}
        </Context.Consumer>
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
        <Context.Consumer>
          {value => {
            ReactNoop.yield('Consumer render prop');
            return <span prop={'Result: ' + value} />;
          }}
        </Context.Consumer>
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

    function Consumer(props) {
      return (
        <Context.Consumer>
          {value => <span prop={'Result: ' + value} />}
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
            <Provider>
              <Indirection>
                <Provider>
                  <Indirection>
                    <Consumer />
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

    const Verify = ({actual, expected}) => {
      expect(expected).toBe(actual);
      return null;
    };

    ReactNoop.render(
      <React.Fragment>
        <BarContext.Provider value={{value: 'bar-updated'}}>
          <BarContext.Consumer>
            {({value}) => <Verify actual={value} expected="bar-updated" />}
          </BarContext.Consumer>

          <FooContext.Provider value={{value: 'foo-updated'}}>
            <FooContext.Consumer>
              {({value}) => <Verify actual={value} expected="foo-updated" />}
            </FooContext.Consumer>
          </FooContext.Provider>
        </BarContext.Provider>

        <FooContext.Consumer>
          {({value}) => <Verify actual={value} expected="foo-initial" />}
        </FooContext.Consumer>
        <BarContext.Consumer>
          {({value}) => <Verify actual={value} expected="bar-initial" />}
        </BarContext.Consumer>
      </React.Fragment>,
    );
    ReactNoop.flush();
  });

  it('multiple consumers in different branches', () => {
    const Context = React.createContext(1);

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

    function Consumer(props) {
      return (
        <Context.Consumer>
          {value => <span prop={'Result: ' + value} />}
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
                <Consumer />
              </Provider>
            </Indirection>
            <Indirection>
              <Consumer />
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
        <Context.Consumer>
          {value => {
            ReactNoop.yield('Consumer render prop');
            return <span prop={'Result: ' + value} />;
          }}
        </Context.Consumer>
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

    function Consumer(props) {
      return (
        <Context.Consumer>
          {value => <span prop={'Result: ' + value} />}
        </Context.Consumer>
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

    function Provider(props) {
      return (
        <Context.Provider value={{foo: props.foo, bar: props.bar}}>
          {props.children}
        </Context.Provider>
      );
    }

    function Foo() {
      return (
        <Context.Consumer unstable_observedBits={0b01}>
          {value => {
            ReactNoop.yield('Foo');
            return <span prop={'Foo: ' + value.foo} />;
          }}
        </Context.Consumer>
      );
    }

    function Bar() {
      return (
        <Context.Consumer unstable_observedBits={0b10}>
          {value => {
            ReactNoop.yield('Bar');
            return <span prop={'Bar: ' + value.bar} />;
          }}
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
    expect(ReactNoop.getChildren()).toEqual([span('Foo: 1'), span('Bar: 1')]);

    // Update only foo
    ReactNoop.render(<App foo={2} bar={1} />);
    expect(ReactNoop.flush()).toEqual(['Foo']);
    expect(ReactNoop.getChildren()).toEqual([span('Foo: 2'), span('Bar: 1')]);

    // Update only bar
    ReactNoop.render(<App foo={2} bar={2} />);
    expect(ReactNoop.flush()).toEqual(['Bar']);
    expect(ReactNoop.getChildren()).toEqual([span('Foo: 2'), span('Bar: 2')]);

    // Update both
    ReactNoop.render(<App foo={3} bar={3} />);
    expect(ReactNoop.flush()).toEqual(['Foo', 'Bar']);
    expect(ReactNoop.getChildren()).toEqual([span('Foo: 3'), span('Bar: 3')]);
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

    function Provider(props) {
      return (
        <Context.Provider value={{foo: props.foo, bar: props.bar}}>
          {props.children}
        </Context.Provider>
      );
    }

    function Foo(props) {
      return (
        <Context.Consumer unstable_observedBits={0b01}>
          {value => {
            ReactNoop.yield('Foo');
            return (
              <React.Fragment>
                <span prop={'Foo: ' + value.foo} />
                {props.children && props.children()}
              </React.Fragment>
            );
          }}
        </Context.Consumer>
      );
    }

    function Bar(props) {
      return (
        <Context.Consumer unstable_observedBits={0b10}>
          {value => {
            ReactNoop.yield('Bar');
            return (
              <React.Fragment>
                <span prop={'Bar: ' + value.bar} />
                {props.children && props.children()}
              </React.Fragment>
            );
          }}
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

  it('warns if calculateChangedBits returns larger than a 31-bit integer', () => {
    spyOnDev(console, 'error');

    const Context = React.createContext(
      0,
      (a, b) => Math.pow(2, 32) - 1, // Return 32 bit int
    );

    ReactNoop.render(<Context.Provider value={1} />);
    ReactNoop.flush();

    // Update
    ReactNoop.render(<Context.Provider value={2} />);
    ReactNoop.flush();

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'calculateChangedBits: Expected the return value to be a 31-bit ' +
          'integer. Instead received: 4294967295',
      );
    }
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

  it('warns if consumer child is not a function', () => {
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

  it("does not re-render if there's an update in a child", () => {
    const Context = React.createContext(0);

    let child;
    class Child extends React.Component {
      state = {step: 0};
      render() {
        ReactNoop.yield('Child');
        return (
          <span
            prop={`Context: ${this.props.context}, Step: ${this.state.step}`}
          />
        );
      }
    }

    function App(props) {
      return (
        <Context.Provider value={props.value}>
          <Context.Consumer>
            {value => {
              ReactNoop.yield('Consumer render prop');
              return <Child ref={inst => (child = inst)} context={value} />;
            }}
          </Context.Consumer>
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
    expect(ReactNoop.flush()).toEqual(['LegacyProvider', 'App', 'Child']);
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

  it('consumer bails out if value is unchanged and something above bailed out', () => {
    const Context = React.createContext(0);

    function renderChildValue(value) {
      ReactNoop.yield('Consumer');
      return <span prop={value} />;
    }

    function ChildWithInlineRenderCallback() {
      ReactNoop.yield('ChildWithInlineRenderCallback');
      // Note: we are intentionally passing an inline arrow. Don't refactor.
      return (
        <Context.Consumer>{value => renderChildValue(value)}</Context.Consumer>
      );
    }

    function ChildWithCachedRenderCallback() {
      ReactNoop.yield('ChildWithCachedRenderCallback');
      return <Context.Consumer>{renderChildValue}</Context.Consumer>;
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
            <Context.Consumer>{this.renderConsumer}</Context.Consumer>
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

    class App extends React.Component {
      renderItem(id) {
        return (
          <span key={id}>
            <Context.Consumer>{() => <span>inner</span>}</Context.Consumer>
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
          <Context.Provider value={{}}>{this.renderList()}</Context.Provider>
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
        return <Consumer />;
      }
    }

    function Consumer() {
      return (
        <Context.Consumer>
          {value => {
            ReactNoop.yield('Consumer');
            return <span prop={value} />;
          }}
        </Context.Consumer>
      );
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
});
