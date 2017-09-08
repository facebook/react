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

describe('ReactIncrementalRoot', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('prerenders roots', () => {
    const root = ReactNoop.create();
    const work = root.prerender(<span prop="A" />);
    expect(root.getChildren()).toEqual([]);
    work.commit();
    expect(root.getChildren()).toEqual([span('A')]);
  });

  it('resolves `then` callback synchronously if tree is already completed', () => {
    const root = ReactNoop.create();
    const work = root.prerender(<span prop="A" />);
    ReactNoop.flush();
    let wasCalled = false;
    work.then(() => {
      wasCalled = true;
    });
    expect(wasCalled).toBe(true);
  });

  it('does not restart a completed tree if there were no additional updates', () => {
    let ops = [];
    function Foo(props) {
      ops.push('Foo');
      return <span prop={props.children} />;
    }
    const root = ReactNoop.create();
    const work = root.prerender(<Foo>Hi</Foo>);

    ReactNoop.flush();
    expect(ops).toEqual(['Foo']);
    expect(root.getChildren([]));

    work.then(() => {
      ops.push('Root completed');
      work.commit();
      ops.push('Root committed');
    });

    expect(ops).toEqual([
      'Foo',
      'Root completed',
      // Should not re-render Foo
      'Root committed',
    ]);
    expect(root.getChildren([span('Hi')]));
  });

  it('works on a blocked tree if the expiration time is less than or equal to the blocked update', () => {
    let ops = [];
    function Foo(props) {
      ops.push('Foo: ' + props.children);
      return <span prop={props.children} />;
    }
    const root = ReactNoop.create();
    root.prerender(<Foo>A</Foo>);
    ReactNoop.flush();

    expect(ops).toEqual(['Foo: A']);
    expect(root.getChildren()).toEqual([]);

    // workA and workB have the same expiration time
    root.prerender(<Foo>B</Foo>);
    ReactNoop.flush();

    // Should have re-rendered the root, even though it's blocked
    // from committing.
    expect(ops).toEqual(['Foo: A', 'Foo: B']);
    expect(root.getChildren()).toEqual([]);
  });

  it(
    'does not work on on a blocked tree if the expiration time is greater than the blocked update',
  );
});
