/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoopPersistent;
let Scheduler;

describe('ReactPersistent', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoopPersistent = require('react-noop-renderer/persistent');
    Scheduler = require('scheduler');
  });

  // Inlined from shared folder so we can run this test on a bundle.
  function createPortal(children, containerInfo, implementation, key) {
    return {
      $$typeof: Symbol.for('react.portal'),
      key: key == null ? null : '' + key,
      children,
      containerInfo,
      implementation,
    };
  }

  function render(element) {
    ReactNoopPersistent.render(element);
  }

  function div(...children) {
    children = children.map(
      c => (typeof c === 'string' ? {text: c, hidden: false} : c),
    );
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function getChildren() {
    return ReactNoopPersistent.getChildren();
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
    expect(Scheduler).toFlushWithoutYielding();
    const originalChildren = getChildren();
    expect(originalChildren).toEqual([div(span())]);

    render(<Foo text="World" />);
    expect(Scheduler).toFlushWithoutYielding();
    const newChildren = getChildren();
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
    expect(Scheduler).toFlushWithoutYielding();
    const originalChildren = getChildren();
    expect(originalChildren).toEqual([div(span('Hello'))]);

    render(<Foo text="World" />);
    expect(Scheduler).toFlushWithoutYielding();
    const newChildren = getChildren();
    expect(newChildren).toEqual([div(span('Hello'), span('World'))]);

    expect(originalChildren).toEqual([div(span('Hello'))]);

    // Reused node should have reference equality
    expect(newChildren[0].children[0]).toBe(originalChildren[0].children[0]);
  });

  it('can update child text nodes', () => {
    function Foo(props) {
      return (
        <div>
          {props.text}
          <span />
        </div>
      );
    }

    render(<Foo text="Hello" />);
    expect(Scheduler).toFlushWithoutYielding();
    const originalChildren = getChildren();
    expect(originalChildren).toEqual([div('Hello', span())]);

    render(<Foo text="World" />);
    expect(Scheduler).toFlushWithoutYielding();
    const newChildren = getChildren();
    expect(newChildren).toEqual([div('World', span())]);

    expect(originalChildren).toEqual([div('Hello', span())]);
  });

  it('supports portals', () => {
    function Parent(props) {
      return <div>{props.children}</div>;
    }

    function BailoutSpan() {
      return <span />;
    }

    class BailoutTest extends React.Component {
      shouldComponentUpdate() {
        return false;
      }
      render() {
        return <BailoutSpan />;
      }
    }

    function Child(props) {
      return (
        <div>
          <BailoutTest />
          {props.children}
        </div>
      );
    }
    const portalContainer = {rootID: 'persistent-portal-test', children: []};
    const emptyPortalChildSet = portalContainer.children;
    render(<Parent>{createPortal(<Child />, portalContainer, null)}</Parent>);
    expect(Scheduler).toFlushWithoutYielding();

    expect(emptyPortalChildSet).toEqual([]);

    const originalChildren = getChildren();
    expect(originalChildren).toEqual([div()]);
    const originalPortalChildren = portalContainer.children;
    expect(originalPortalChildren).toEqual([div(span())]);

    render(
      <Parent>
        {createPortal(<Child>Hello {'World'}</Child>, portalContainer, null)}
      </Parent>,
    );
    expect(Scheduler).toFlushWithoutYielding();

    const newChildren = getChildren();
    expect(newChildren).toEqual([div()]);
    const newPortalChildren = portalContainer.children;
    expect(newPortalChildren).toEqual([div(span(), 'Hello ', 'World')]);

    expect(originalChildren).toEqual([div()]);
    expect(originalPortalChildren).toEqual([div(span())]);

    // Reused portal children should have reference equality
    expect(newPortalChildren[0].children[0]).toBe(
      originalPortalChildren[0].children[0],
    );

    // Deleting the Portal, should clear its children
    render(<Parent />);
    expect(Scheduler).toFlushWithoutYielding();

    const clearedPortalChildren = portalContainer.children;
    expect(clearedPortalChildren).toEqual([]);

    // The original is unchanged.
    expect(newPortalChildren).toEqual([div(span(), 'Hello ', 'World')]);
  });
});
