/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React = require('react');
let ReactNoop;
let gen;

describe('ReactNewContext', () => {
  beforeEach(() => {
    jest.resetModules();
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

  it('compares context values with Object.is semantics', () => {
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

  describe('fuzz test', () => {
    const contextKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const contexts = new Map(
      contextKeys.map(key => {
        const Context = React.createContext(0);
        Context.displayName = 'Context' + key;
        return [key, Context];
      }),
    );
    const Fragment = React.Fragment;

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
            contextKeys[this.props.rand.intBetween(0, contextKeys.length - 1)];
          const Context = contexts.get(randomKey);
          return Context.consume(
            value => (
              <Fragment>
                <span prop={`${randomKey}:${value}`} />
                <ConsumerTree
                  rand={this.props.rand}
                  depth={this.props.depth + 1}
                  maxDepth={this.props.maxDepth}
                />
              </Fragment>
            ),
            i,
          );
        });
        return consumers;
      }
    }

    function Root(props) {
      return contextKeys.reduceRight((children, key) => {
        const Context = contexts.get(key);
        const value = props.values[key];
        return Context.provide(value, children);
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
            `Inconsistent value! Expected: ${key}:${expectedValue}. Actual: ${
              text
            }`,
          );
        }
      });
    }

    function ContextSimulator(maxDepth) {
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
