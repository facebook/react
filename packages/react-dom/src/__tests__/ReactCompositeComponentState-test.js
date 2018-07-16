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
let ReactDOM;

let TestComponent;

describe('ReactCompositeComponent-state', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

    TestComponent = class extends React.Component {
      constructor(props) {
        super(props);
        this.peekAtState('getInitialState', undefined, props);
        this.state = {color: 'red'};
      }

      peekAtState = (from, state = this.state, props = this.props) => {
        props.stateListener(from, state && state.color);
      };

      peekAtCallback = from => {
        return () => this.peekAtState(from);
      };

      setFavoriteColor(nextColor) {
        this.setState(
          {color: nextColor},
          this.peekAtCallback('setFavoriteColor'),
        );
      }

      render() {
        this.peekAtState('render');
        return <div>{this.state.color}</div>;
      }

      UNSAFE_componentWillMount() {
        this.peekAtState('componentWillMount-start');
        this.setState(function(state) {
          this.peekAtState('before-setState-sunrise', state);
        });
        this.setState(
          {color: 'sunrise'},
          this.peekAtCallback('setState-sunrise'),
        );
        this.setState(function(state) {
          this.peekAtState('after-setState-sunrise', state);
        });
        this.peekAtState('componentWillMount-after-sunrise');
        this.setState(
          {color: 'orange'},
          this.peekAtCallback('setState-orange'),
        );
        this.setState(function(state) {
          this.peekAtState('after-setState-orange', state);
        });
        this.peekAtState('componentWillMount-end');
      }

      componentDidMount() {
        this.peekAtState('componentDidMount-start');
        this.setState(
          {color: 'yellow'},
          this.peekAtCallback('setState-yellow'),
        );
        this.peekAtState('componentDidMount-end');
      }

      UNSAFE_componentWillReceiveProps(newProps) {
        this.peekAtState('componentWillReceiveProps-start');
        if (newProps.nextColor) {
          this.setState(function(state) {
            this.peekAtState('before-setState-receiveProps', state);
            return {color: newProps.nextColor};
          });
          // No longer a public API, but we can test that it works internally by
          // reaching into the updater.
          this.updater.enqueueReplaceState(this, {color: undefined});
          this.setState(function(state) {
            this.peekAtState('before-setState-again-receiveProps', state);
            return {color: newProps.nextColor};
          }, this.peekAtCallback('setState-receiveProps'));
          this.setState(function(state) {
            this.peekAtState('after-setState-receiveProps', state);
          });
        }
        this.peekAtState('componentWillReceiveProps-end');
      }

      shouldComponentUpdate(nextProps, nextState) {
        this.peekAtState('shouldComponentUpdate-currentState');
        this.peekAtState('shouldComponentUpdate-nextState', nextState);
        return true;
      }

      UNSAFE_componentWillUpdate(nextProps, nextState) {
        this.peekAtState('componentWillUpdate-currentState');
        this.peekAtState('componentWillUpdate-nextState', nextState);
      }

      componentDidUpdate(prevProps, prevState) {
        this.peekAtState('componentDidUpdate-currentState');
        this.peekAtState('componentDidUpdate-prevState', prevState);
      }

      componentWillUnmount() {
        this.peekAtState('componentWillUnmount');
      }
    };
  });

  it('should support setting state', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const stateListener = jest.fn();
    const instance = ReactDOM.render(
      <TestComponent stateListener={stateListener} />,
      container,
      function peekAtInitialCallback() {
        this.peekAtState('initial-callback');
      },
    );
    ReactDOM.render(
      <TestComponent stateListener={stateListener} nextColor="green" />,
      container,
      instance.peekAtCallback('setProps'),
    );
    instance.setFavoriteColor('blue');
    instance.forceUpdate(instance.peekAtCallback('forceUpdate'));

    ReactDOM.unmountComponentAtNode(container);

    let expected = [
      // there is no state when getInitialState() is called
      ['getInitialState', null],
      ['componentWillMount-start', 'red'],
      // setState()'s only enqueue pending states.
      ['componentWillMount-after-sunrise', 'red'],
      ['componentWillMount-end', 'red'],
      // pending state queue is processed
      ['before-setState-sunrise', 'red'],
      ['after-setState-sunrise', 'sunrise'],
      ['after-setState-orange', 'orange'],
      // pending state has been applied
      ['render', 'orange'],
      ['componentDidMount-start', 'orange'],
      // setState-sunrise and setState-orange should be called here,
      // after the bug in #1740
      // componentDidMount() called setState({color:'yellow'}), which is async.
      // The update doesn't happen until the next flush.
      ['componentDidMount-end', 'orange'],
      ['setState-sunrise', 'orange'],
      ['setState-orange', 'orange'],
      ['initial-callback', 'orange'],
      ['shouldComponentUpdate-currentState', 'orange'],
      ['shouldComponentUpdate-nextState', 'yellow'],
      ['componentWillUpdate-currentState', 'orange'],
      ['componentWillUpdate-nextState', 'yellow'],
      ['render', 'yellow'],
      ['componentDidUpdate-currentState', 'yellow'],
      ['componentDidUpdate-prevState', 'orange'],
      ['setState-yellow', 'yellow'],
      ['componentWillReceiveProps-start', 'yellow'],
      // setState({color:'green'}) only enqueues a pending state.
      ['componentWillReceiveProps-end', 'yellow'],
      // pending state queue is processed
      // We keep updates in the queue to support
      // replaceState(prevState => newState).
      ['before-setState-receiveProps', 'yellow'],
      ['before-setState-again-receiveProps', undefined],
      ['after-setState-receiveProps', 'green'],
      ['shouldComponentUpdate-currentState', 'yellow'],
      ['shouldComponentUpdate-nextState', 'green'],
      ['componentWillUpdate-currentState', 'yellow'],
      ['componentWillUpdate-nextState', 'green'],
      ['render', 'green'],
      ['componentDidUpdate-currentState', 'green'],
      ['componentDidUpdate-prevState', 'yellow'],
      ['setState-receiveProps', 'green'],
      ['setProps', 'green'],
      // setFavoriteColor('blue')
      ['shouldComponentUpdate-currentState', 'green'],
      ['shouldComponentUpdate-nextState', 'blue'],
      ['componentWillUpdate-currentState', 'green'],
      ['componentWillUpdate-nextState', 'blue'],
      ['render', 'blue'],
      ['componentDidUpdate-currentState', 'blue'],
      ['componentDidUpdate-prevState', 'green'],
      ['setFavoriteColor', 'blue'],
      // forceUpdate()
      ['componentWillUpdate-currentState', 'blue'],
      ['componentWillUpdate-nextState', 'blue'],
      ['render', 'blue'],
      ['componentDidUpdate-currentState', 'blue'],
      ['componentDidUpdate-prevState', 'blue'],
      ['forceUpdate', 'blue'],
      // unmountComponent()
      // state is available within `componentWillUnmount()`
      ['componentWillUnmount', 'blue'],
    ];

    expect(stateListener.mock.calls.join('\n')).toEqual(expected.join('\n'));
  });

  it('should call componentDidUpdate of children first', () => {
    const container = document.createElement('div');

    let ops = [];

    let child = null;
    let parent = null;

    class Child extends React.Component {
      state = {bar: false};
      componentDidMount() {
        child = this;
      }
      componentDidUpdate() {
        ops.push('child did update');
      }
      render() {
        return <div />;
      }
    }

    let shouldUpdate = true;

    class Intermediate extends React.Component {
      shouldComponentUpdate() {
        return shouldUpdate;
      }
      render() {
        return <Child />;
      }
    }

    class Parent extends React.Component {
      state = {foo: false};
      componentDidMount() {
        parent = this;
      }
      componentDidUpdate() {
        ops.push('parent did update');
      }
      render() {
        return <Intermediate />;
      }
    }

    ReactDOM.render(<Parent />, container);

    ReactDOM.unstable_batchedUpdates(() => {
      parent.setState({foo: true});
      child.setState({bar: true});
    });
    // When we render changes top-down in a batch, children's componentDidUpdate
    // happens before the parent.
    expect(ops).toEqual(['child did update', 'parent did update']);

    shouldUpdate = false;

    ops = [];

    ReactDOM.unstable_batchedUpdates(() => {
      parent.setState({foo: false});
      child.setState({bar: false});
    });
    // We expect the same thing to happen if we bail out in the middle.
    expect(ops).toEqual(['child did update', 'parent did update']);
  });

  it('should batch unmounts', () => {
    let outer;

    class Inner extends React.Component {
      render() {
        return <div />;
      }

      componentWillUnmount() {
        // This should get silently ignored (maybe with a warning), but it
        // shouldn't break React.
        outer.setState({showInner: false});
      }
    }

    class Outer extends React.Component {
      state = {showInner: true};

      render() {
        return <div>{this.state.showInner && <Inner />}</div>;
      }
    }

    const container = document.createElement('div');
    outer = ReactDOM.render(<Outer />, container);
    expect(() => {
      ReactDOM.unmountComponentAtNode(container);
    }).not.toThrow();
  });

  it('should update state when called from child cWRP', function() {
    const log = [];
    class Parent extends React.Component {
      state = {value: 'one'};
      render() {
        log.push('parent render ' + this.state.value);
        return <Child parent={this} value={this.state.value} />;
      }
    }
    let updated = false;
    class Child extends React.Component {
      UNSAFE_componentWillReceiveProps() {
        if (updated) {
          return;
        }
        log.push('child componentWillReceiveProps ' + this.props.value);
        this.props.parent.setState({value: 'two'});
        log.push('child componentWillReceiveProps done ' + this.props.value);
        updated = true;
      }
      render() {
        log.push('child render ' + this.props.value);
        return <div>{this.props.value}</div>;
      }
    }
    const container = document.createElement('div');
    ReactDOM.render(<Parent />, container);
    ReactDOM.render(<Parent />, container);
    expect(log).toEqual([
      'parent render one',
      'child render one',
      'parent render one',
      'child componentWillReceiveProps one',
      'child componentWillReceiveProps done one',
      'child render one',
      'parent render two',
      'child render two',
    ]);
  });

  it('should merge state when sCU returns false', function() {
    const log = [];
    class Test extends React.Component {
      state = {a: 0};
      render() {
        return null;
      }
      shouldComponentUpdate(nextProps, nextState) {
        log.push(
          'scu from ' +
            Object.keys(this.state) +
            ' to ' +
            Object.keys(nextState),
        );
        return false;
      }
    }

    const container = document.createElement('div');
    const test = ReactDOM.render(<Test />, container);
    test.setState({b: 0});
    expect(log.length).toBe(1);
    test.setState({c: 0});
    expect(log.length).toBe(2);
    expect(log).toEqual(['scu from a to a,b', 'scu from a,b to a,b,c']);
  });

  it('should treat assigning to this.state inside cWRP as a replaceState, with a warning', () => {
    let ops = [];
    class Test extends React.Component {
      state = {step: 1, extra: true};
      UNSAFE_componentWillReceiveProps() {
        this.setState({step: 2}, () => {
          // Tests that earlier setState callbacks are not dropped
          ops.push(
            `callback -- step: ${this.state.step}, extra: ${!!this.state
              .extra}`,
          );
        });
        // Treat like replaceState
        this.state = {step: 3};
      }
      render() {
        ops.push(
          `render -- step: ${this.state.step}, extra: ${!!this.state.extra}`,
        );
        return null;
      }
    }

    // Mount
    const container = document.createElement('div');
    ReactDOM.render(<Test />, container);
    // Update
    expect(() => ReactDOM.render(<Test />, container)).toWarnDev(
      'Warning: Test.componentWillReceiveProps(): Assigning directly to ' +
        "this.state is deprecated (except inside a component's constructor). " +
        'Use setState instead.',
      {withoutStack: true},
    );

    expect(ops).toEqual([
      'render -- step: 1, extra: true',
      'render -- step: 3, extra: false',
      'callback -- step: 3, extra: false',
    ]);

    // Check deduplication; (no additional warnings are expected)
    ReactDOM.render(<Test />, container);
  });

  it('should treat assigning to this.state inside cWM as a replaceState, with a warning', () => {
    let ops = [];
    class Test extends React.Component {
      state = {step: 1, extra: true};
      UNSAFE_componentWillMount() {
        this.setState({step: 2}, () => {
          // Tests that earlier setState callbacks are not dropped
          ops.push(
            `callback -- step: ${this.state.step}, extra: ${!!this.state
              .extra}`,
          );
        });
        // Treat like replaceState
        this.state = {step: 3};
      }
      render() {
        ops.push(
          `render -- step: ${this.state.step}, extra: ${!!this.state.extra}`,
        );
        return null;
      }
    }

    // Mount
    const container = document.createElement('div');
    expect(() => ReactDOM.render(<Test />, container)).toWarnDev(
      'Warning: Test.componentWillMount(): Assigning directly to ' +
        "this.state is deprecated (except inside a component's constructor). " +
        'Use setState instead.',
      {withoutStack: true},
    );

    expect(ops).toEqual([
      'render -- step: 3, extra: false',
      'callback -- step: 3, extra: false',
    ]);
  });

  it('should support stateful module pattern components', () => {
    function Child() {
      return {
        state: {
          count: 123,
        },
        render() {
          return <div>{`count:${this.state.count}`}</div>;
        },
      };
    }

    const el = document.createElement('div');
    ReactDOM.render(<Child />, el);

    expect(el.textContent).toBe('count:123');
  });

  it('should support getDerivedStateFromProps for module pattern components', () => {
    function Child() {
      return {
        state: {
          count: 1,
        },
        render() {
          return <div>{`count:${this.state.count}`}</div>;
        },
      };
    }
    Child.getDerivedStateFromProps = (props, prevState) => {
      return {
        count: prevState.count + props.incrementBy,
      };
    };

    const el = document.createElement('div');
    ReactDOM.render(<Child incrementBy={0} />, el);
    expect(el.textContent).toBe('count:1');

    ReactDOM.render(<Child incrementBy={2} />, el);
    expect(el.textContent).toBe('count:3');

    ReactDOM.render(<Child incrementBy={1} />, el);
    expect(el.textContent).toBe('count:4');
  });
});
