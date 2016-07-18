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

describe('ReactIncremental', function() {
  beforeEach(function() {
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function div(...children) {
    return { type: 'div', children, prop: undefined };
  }

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('can update child nodes of a host instance', function() {

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

    ReactNoop.render(<Foo text="Hello" />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([
      div(span()),
    ]);

    ReactNoop.render(<Foo text="World" />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([
      div(span(), span()),
    ]);

  });

  it('does not update child nodes if a flush is aborted', function() {

    function Bar(props) {
      return <span prop={props.text} />;
    }

    function Foo(props) {
      return (
        <div>
          <div>
            <Bar text={props.text} />
            {props.text === 'Hello' ? <Bar text={props.text} /> : null}
          </div>
          <Bar text="Yo" />
        </div>
      );
    }

    ReactNoop.render(<Foo text="Hello" />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hello'), span('Hello')), span('Yo')),
    ]);

    ReactNoop.render(<Foo text="World" />);
    ReactNoop.flushLowPri(35);
    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hello'), span('Hello')), span('Yo')),
    ]);

  });

  it('preserves a previously rendered node when deprioritized', function() {

    function Middle(props) {
      return <span prop={props.children} />;
    }

    function Foo(props) {
      return (
        <div>
          <div hidden={true}>
            <Middle>{props.text}</Middle>
          </div>
        </div>
      );
    }

    ReactNoop.render(<Foo text="foo" />);
    ReactNoop.flush();

    expect(ReactNoop.root.children).toEqual([
      div(div(span('foo'))),
    ]);

    ReactNoop.render(<Foo text="bar" />);
    ReactNoop.flushLowPri(20);

    expect(ReactNoop.root.children).toEqual([
      div(div(span('foo'))),
    ]);

    ReactNoop.flush();

    expect(ReactNoop.root.children).toEqual([
      div(div(span('bar'))),
    ]);

  });


  it('updates a child even though the old props is empty', function() {
    function Foo(props) {
      return (
        <div hidden={true}>
          <span prop={1} />
        </div>
      );
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([
      div(span(1)),
    ]);
  });

  // TODO: Test that side-effects are not cut off when a work in progress node
  // moves to "current" without flushing due to having lower priority. Does this
  // even happen? Maybe a child doesn't get processed because it is lower prio?

});
