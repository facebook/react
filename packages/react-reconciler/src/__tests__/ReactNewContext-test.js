/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactNoop;

describe('ReactNewContext', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
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

    function Provider(props) {
      return Context.provide(props.value, props.children);
    }

    function Consumer(props) {
      return Context.consume(value => {
        return <span prop={'Result: ' + value} />;
      });
    }

    const Indirection = React.Fragment;

    function App(props) {
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
      return Context.provide(props.value, props.children);
    }

    function Consumer(props) {
      ReactNoop.yield('Consumer');
      return Context.consume(value => {
        ReactNoop.yield('Consumer render prop');
        return <span prop={'Result: ' + value} />;
      });
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
      return Context.provide(props.value, props.children);
    }

    function Consumer(props) {
      ReactNoop.yield('Consumer');
      return Context.consume(value => {
        ReactNoop.yield('Consumer render prop');
        return <span prop={'Result: ' + value} />;
      });
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
      return Context.consume(contextValue =>
        // Multiply previous context value by 2, unless prop overrides
        Context.provide(props.value || contextValue * 2, props.children),
      );
    }

    function Consumer(props) {
      return Context.consume(value => {
        return <span prop={'Result: ' + value} />;
      });
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

  it('multiple consumers in different branches', () => {
    const Context = React.createContext(1);

    function Provider(props) {
      return Context.consume(contextValue =>
        // Multiply previous context value by 2, unless prop overrides
        Context.provide(props.value || contextValue * 2, props.children),
      );
    }

    function Consumer(props) {
      return Context.consume(value => {
        return <span prop={'Result: ' + value} />;
      });
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
});
