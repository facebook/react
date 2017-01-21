/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNoop;
var ReactCoroutine;
var ReactFeatureFlags;

describe('ReactCoroutine', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('React');
    ReactNoop = require('ReactNoop');
    ReactCoroutine = require('ReactCoroutine');
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = false;
  });

  function div(...children) {
    children = children.map(c => typeof c === 'string' ? { text: c } : c);
    return { type: 'div', children, prop: undefined };
  }

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('should render a coroutine', () => {
    var ops = [];

    function Continuation({ isSame }) {
      ops.push(['Continuation', isSame]);
      return <span prop={isSame ? 'foo==bar' : 'foo!=bar'} />;
    }

    // An alternative API could mark Continuation as something that needs
    // yielding. E.g. Continuation.yieldType = 123;
    function Child({ bar }) {
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
      return [<Child bar={true} />, <Child bar={false} />];
    }

    function HandleYields(props, yields) {
      ops.push('HandleYields');
      return yields.map(y =>
        <y.continuation isSame={props.foo === y.props.bar} />
      );
    }

    // An alternative API could mark Parent as something that needs
    // yielding. E.g. Parent.handler = HandleYields;
    function Parent(props) {
      ops.push('Parent');
      return ReactCoroutine.createCoroutine(
        props.children,
        HandleYields,
        props
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
      div(
        span('foo==bar'),
        span('foo!=bar'),
      ),
    ]);
  });

  it('should update a coroutine', () => {
    function Continuation({ isSame }) {
      return <span prop={isSame ? 'foo==bar' : 'foo!=bar'} />;
    }

    function Child({ bar }) {
      return ReactCoroutine.createYield({
        props: {
          bar: bar,
        },
        continuation: Continuation,
      });
    }

    function Indirection() {
      return [<Child bar={true} />, <Child bar={false} />];
    }

    function HandleYields(props, yields) {
      return yields.map(y =>
        <y.continuation isSame={props.foo === y.props.bar} />
      );
    }

    function Parent(props) {
      return ReactCoroutine.createCoroutine(
        props.children,
        HandleYields,
        props
      );
    }

    function App(props) {
      return <div><Parent foo={props.foo}><Indirection /></Parent></div>;
    }

    ReactNoop.render(<App foo={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span('foo==bar'),
        span('foo!=bar'),
      ),
    ]);

    ReactNoop.render(<App foo={false} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span('foo!=bar'),
        span('foo==bar'),
      ),
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
      return yields.map(ContinuationComponent => <ContinuationComponent />);
    }

    class Parent extends React.Component {
      render() {
        ops.push('Parent');
        return ReactCoroutine.createCoroutine(
          this.props.children,
          HandleYields,
          this.props
        );
      }
      componentWillUnmount() {
        ops.push('Unmount Parent');
      }
    }

    ReactNoop.render(<Parent><Child /></Parent>);
    ReactNoop.flush();

    expect(ops).toEqual([
      'Parent',
      'Child',
      'HandleYields',
      'Continuation',
    ]);

    ops = [];

    ReactNoop.render(<div />);
    ReactNoop.flush();

    expect(ops).toEqual([
      'Unmount Parent',
      'Unmount Child',
      'Unmount Continuation',
    ]);

  });
});
