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

describe('ReactCoroutine', () => {
  beforeEach(() => {
    React = require('React');
    ReactNoop = require('ReactNoop');
    ReactCoroutine = require('ReactCoroutine');
  });

  xit('should render a coroutine', () => {
    var ops = [];

    function Continuation({isSame}) {
      ops.push(['Continuation', isSame]);
      return <span>{isSame ? 'foo==bar' : 'foo!=bar'}</span>;
    }

    // An alternative API could mark Continuation as something that needs
    // yielding. E.g. Continuation.yieldType = 123;
    function Child({bar}) {
      ops.push(['Child', bar]);
      return ReactCoroutine.createYield(
        {
          bar: bar,
        },
        Continuation,
        null,
      );
    }

    function Indirection() {
      ops.push('Indirection');
      return [<Child bar={true} />, <Child bar={false} />];
    }

    function HandleYields(props, yields) {
      ops.push('HandleYields');
      return yields.map(y =>
        <y.continuation isSame={props.foo === y.props.bar} />,
      );
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
  });
});
