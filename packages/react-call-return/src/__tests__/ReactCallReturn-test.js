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
let ReactCallReturn;

describe('ReactCallReturn', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactCallReturn = require('react-call-return');
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('should render a call', () => {
    const ops = [];

    function Continuation({isSame}) {
      ops.push(['Continuation', isSame]);
      return <span prop={isSame ? 'foo==bar' : 'foo!=bar'} />;
    }

    // An alternative API could mark Continuation as something that needs
    // returning. E.g. Continuation.returnType = 123;
    function Child({bar}) {
      ops.push(['Child', bar]);
      return ReactCallReturn.unstable_createReturn({
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

    function HandleReturns(props, returns) {
      ops.push('HandleReturns');
      return returns.map((y, i) => (
        <y.continuation key={i} isSame={props.foo === y.props.bar} />
      ));
    }

    // An alternative API could mark Parent as something that needs
    // returning. E.g. Parent.handler = HandleReturns;
    function Parent(props) {
      ops.push('Parent');
      return ReactCallReturn.unstable_createCall(
        props.children,
        HandleReturns,
        props,
      );
    }

    function App() {
      return (
        <div>
          <Parent foo={true}>
            <Indirection />
          </Parent>
        </div>
      );
    }

    ReactNoop.render(<App />);
    ReactNoop.flush();

    expect(ops).toEqual([
      'Parent',
      'Indirection',
      ['Child', true],
      // Return
      ['Child', false],
      // Return
      'HandleReturns',
      // Call continuations
      ['Continuation', true],
      ['Continuation', false],
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      div(span('foo==bar'), span('foo!=bar')),
    ]);
  });

  it('should update a call', () => {
    function Continuation({isSame}) {
      return <span prop={isSame ? 'foo==bar' : 'foo!=bar'} />;
    }

    function Child({bar}) {
      return ReactCallReturn.unstable_createReturn({
        props: {
          bar: bar,
        },
        continuation: Continuation,
      });
    }

    function Indirection() {
      return [<Child key="a" bar={true} />, <Child key="b" bar={false} />];
    }

    function HandleReturns(props, returns) {
      return returns.map((y, i) => (
        <y.continuation key={i} isSame={props.foo === y.props.bar} />
      ));
    }

    function Parent(props) {
      return ReactCallReturn.unstable_createCall(
        props.children,
        HandleReturns,
        props,
      );
    }

    function App(props) {
      return (
        <div>
          <Parent foo={props.foo}>
            <Indirection />
          </Parent>
        </div>
      );
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

  it('should unmount a composite in a call', () => {
    let ops = [];

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
        return ReactCallReturn.unstable_createReturn(Continuation);
      }
      componentWillUnmount() {
        ops.push('Unmount Child');
      }
    }

    function HandleReturns(props, returns) {
      ops.push('HandleReturns');
      return returns.map((ContinuationComponent, i) => (
        <ContinuationComponent key={i} />
      ));
    }

    class Parent extends React.Component {
      render() {
        ops.push('Parent');
        return ReactCallReturn.unstable_createCall(
          this.props.children,
          HandleReturns,
          this.props,
        );
      }
      componentWillUnmount() {
        ops.push('Unmount Parent');
      }
    }

    ReactNoop.render(
      <Parent>
        <Child />
      </Parent>,
    );
    ReactNoop.flush();

    expect(ops).toEqual(['Parent', 'Child', 'HandleReturns', 'Continuation']);

    ops = [];

    ReactNoop.render(<div />);
    ReactNoop.flush();

    expect(ops).toEqual([
      'Unmount Parent',
      'Unmount Child',
      'Unmount Continuation',
    ]);
  });

  it('should handle deep updates in call', () => {
    let instances = {};

    class Counter extends React.Component {
      state = {value: 5};
      render() {
        instances[this.props.id] = this;
        return ReactCallReturn.unstable_createReturn(this.state.value);
      }
    }

    function App(props) {
      return ReactCallReturn.unstable_createCall(
        [
          <Counter key="a" id="a" />,
          <Counter key="b" id="b" />,
          <Counter key="c" id="c" />,
        ],
        (p, returns) => returns.map((y, i) => <span key={i} prop={y * 100} />),
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

  it('should unmount and remount children', () => {
    let ops = [];

    class Call extends React.Component {
      render() {
        return ReactCallReturn.unstable_createCall(
          this.props.children,
          (p, returns) => returns,
          {},
        );
      }
    }

    class Return extends React.Component {
      render() {
        ops.push(`Return ${this.props.value}`);
        return ReactCallReturn.unstable_createReturn(this.props.children);
      }

      UNSAFE_componentWillMount() {
        ops.push(`Mount Return ${this.props.value}`);
      }

      componentWillUnmount() {
        ops.push(`Unmount Return ${this.props.value}`);
      }
    }

    ReactNoop.render(
      <Call>
        <Return value={1} />
        <Return value={2} />
      </Call>,
    );
    expect(ReactNoop.flush).toWarnDev(
      'componentWillMount: Please update the following components ' +
        'to use componentDidMount instead: Return',
    );

    expect(ops).toEqual([
      'Mount Return 1',
      'Return 1',
      'Mount Return 2',
      'Return 2',
    ]);

    ops = [];

    ReactNoop.render(<Call />);
    ReactNoop.flush();

    expect(ops).toEqual(['Unmount Return 1', 'Unmount Return 2']);

    ops = [];

    ReactNoop.render(
      <Call>
        <Return value={3} />
      </Call>,
    );
    ReactNoop.flush();

    expect(ops).toEqual(['Mount Return 3', 'Return 3']);
  });
});
