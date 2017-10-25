/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNoop;
var ReactCoroutine;

describe('ReactCoroutine', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    // TODO: can we express this test with only public API?
    // TODO: direct imports like some-package/src/* are bad. Fix me.
    ReactCoroutine = require('react-reconciler/src/ReactCoroutine');
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('should render a coroutine', () => {
    var ops = [];

    function Continuation({isSame}) {
      ops.push(['Continuation', isSame]);
      return <span prop={isSame ? 'foo==bar' : 'foo!=bar'} />;
    }

    // An alternative API could mark Continuation as something that needs
    // yielding. E.g. Continuation.yieldType = 123;
    function Child({bar}) {
      ops.push(['Child', bar]);
      return ReactCoroutine.createYield({
        props: {
          bar: bar,
        },
        continuation: Continuation,
      });
    }

    function Indirection() {
      ops.push('Indirection');
      return [<Child key="a" bar={true} />, <Child key="b" bar={false} />];
    }

    function HandleYields(props, yields) {
      ops.push('HandleYields');
      return yields.map((y, i) => (
        <y.continuation key={i} isSame={props.foo === y.props.bar} />
      ));
    }

    // An alternative API could mark Parent as something that needs
    // yielding. E.g. Parent.handler = HandleYields;
    function Parent(props) {
      ops.push('Parent');
      return ReactCoroutine.createCoroutine(
        props.children,
        HandleYields,
        props,
      );
    }

    function App() {
      return <div><Parent foo={true}><Indirection /></Parent></div>;
    }

    ReactNoop.render(<App />);
    ReactNoop.flush();

    expect(ops).toEqual([
      'Parent',
      'Indirection',
      ['Child', true],
      // Yield
      ['Child', false],
      // Yield
      'HandleYields',
      // Continue yields
      ['Continuation', true],
      ['Continuation', false],
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      div(span('foo==bar'), span('foo!=bar')),
    ]);
  });

  it('should update a coroutine', () => {
    function Continuation({isSame}) {
      return <span prop={isSame ? 'foo==bar' : 'foo!=bar'} />;
    }

    function Child({bar}) {
      return ReactCoroutine.createYield({
        props: {
          bar: bar,
        },
        continuation: Continuation,
      });
    }

    function Indirection() {
      return [<Child key="a" bar={true} />, <Child key="b" bar={false} />];
    }

    function HandleYields(props, yields) {
      return yields.map((y, i) => (
        <y.continuation key={i} isSame={props.foo === y.props.bar} />
      ));
    }

    function Parent(props) {
      return ReactCoroutine.createCoroutine(
        props.children,
        HandleYields,
        props,
      );
    }

    function App(props) {
      return <div><Parent foo={props.foo}><Indirection /></Parent></div>;
    }

    ReactNoop.render(<App foo={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(span('foo==bar'), span('foo!=bar')),
    ]);

    ReactNoop.render(<App foo={false} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(span('foo!=bar'), span('foo==bar')),
    ]);
  });

  it('should unmount a composite in a coroutine', () => {
    var ops = [];

    class Continuation extends React.Component {
      render() {
        ops.push('Continuation');
        return <div />;
      }
      componentWillUnmount() {
        ops.push('Unmount Continuation');
      }
    }

    class Child extends React.Component {
      render() {
        ops.push('Child');
        return ReactCoroutine.createYield(Continuation);
      }
      componentWillUnmount() {
        ops.push('Unmount Child');
      }
    }

    function HandleYields(props, yields) {
      ops.push('HandleYields');
      return yields.map((ContinuationComponent, i) => (
        <ContinuationComponent key={i} />
      ));
    }

    class Parent extends React.Component {
      render() {
        ops.push('Parent');
        return ReactCoroutine.createCoroutine(
          this.props.children,
          HandleYields,
          this.props,
        );
      }
      componentWillUnmount() {
        ops.push('Unmount Parent');
      }
    }

    ReactNoop.render(<Parent><Child /></Parent>);
    ReactNoop.flush();

    expect(ops).toEqual(['Parent', 'Child', 'HandleYields', 'Continuation']);

    ops = [];

    ReactNoop.render(<div />);
    ReactNoop.flush();

    expect(ops).toEqual([
      'Unmount Parent',
      'Unmount Child',
      'Unmount Continuation',
    ]);
  });

  it('should handle deep updates in coroutine', () => {
    let instances = {};

    class Counter extends React.Component {
      state = {value: 5};
      render() {
        instances[this.props.id] = this;
        return ReactCoroutine.createYield(this.state.value);
      }
    }

    function App(props) {
      return ReactCoroutine.createCoroutine(
        [
          <Counter key="a" id="a" />,
          <Counter key="b" id="b" />,
          <Counter key="c" id="c" />,
        ],
        (p, yields) => yields.map((y, i) => <span key={i} prop={y * 100} />),
        {},
      );
    }

    ReactNoop.render(<App />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(500), span(500), span(500)]);

    instances.a.setState({value: 1});
    instances.b.setState({value: 2});
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(100), span(200), span(500)]);
  });
});
