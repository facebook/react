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

describe('ReactPersistent', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  const DEFAULT_ROOT_ID = 'persistent-test';

  function render(element) {
    ReactNoop.renderToPersistentRootWithID(element, DEFAULT_ROOT_ID);
  }

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function getChildren() {
    return ReactNoop.getChildren(DEFAULT_ROOT_ID);
  }

  it('can update child nodes of a host instance', () => {
    function Bar(props) {
      return <span>{props.text}</span>;
    }

    function Foo(props) {
      return (
        <div>
          <Bar text={props.text} />
          {props.text === 'World' ? <Bar text={props.text} /> : null}
        </div>
      );
    }

    render(<Foo text="Hello" />);
    ReactNoop.flush();
    var originalChildren = getChildren();
    expect(originalChildren).toEqual([div(span())]);

    render(<Foo text="World" />);
    ReactNoop.flush();
    var newChildren = getChildren();
    expect(newChildren).toEqual([div(span(), span())]);

    expect(originalChildren).toEqual([div(span())]);
  });

  it('can reuse child nodes between updates', () => {
    function Baz(props) {
      return <span prop={props.text} />;
    }
    class Bar extends React.Component {
      shouldComponentUpdate(newProps) {
        return false;
      }
      render() {
        return <Baz text={this.props.text} />;
      }
    }
    function Foo(props) {
      return (
        <div>
          <Bar text={props.text} />
          {props.text === 'World' ? <Bar text={props.text} /> : null}
        </div>
      );
    }

    render(<Foo text="Hello" />);
    ReactNoop.flush();
    var originalChildren = getChildren();
    expect(originalChildren).toEqual([div(span('Hello'))]);

    render(<Foo text="World" />);
    ReactNoop.flush();
    var newChildren = getChildren();
    expect(newChildren).toEqual([div(span('Hello'), span('World'))]);

    expect(originalChildren).toEqual([div(span('Hello'))]);

    // Reused node should have reference equality
    expect(newChildren[0].children[0]).toBe(originalChildren[0].children[0]);
  });
});
