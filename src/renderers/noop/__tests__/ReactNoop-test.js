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

describe('ReactComponent', function() {
  beforeEach(function() {
    React = require('React');
    ReactNoop = require('ReactNoop');
    ReactCoroutine = require('ReactCoroutine');
    spyOn(console, 'log');
  });

  it('should render a simple component', function() {

    function Bar() {
      return <div>Hello World</div>;
    }

    function Foo() {
      return <Bar isBar={true} />;
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

  });

  it('should render a simple component, in steps if needed', function() {

    function Bar() {
      return <span><div>Hello World</div></span>;
    }

    function Foo() {
      return [
        <Bar isBar={true} />,
        <Bar isBar={true} />,
      ];
    }

    ReactNoop.render(<Foo />);
    // console.log('Nothing done');
    ReactNoop.flushLowPri(7);
    // console.log('Yield');
    ReactNoop.flushLowPri(50);
    // console.log('Done');
  });

  it('should render a coroutine', function() {

    function Continuation({ isSame }) {
      return <span>{isSame ? 'foo==bar' : 'foo!=bar'}</span>;
    }

    // An alternative API could mark Continuation as something that needs
    // yielding. E.g. Continuation.yieldType = 123;
    function Child({ bar }) {
      return ReactCoroutine.createYield({
        bar: bar,
      }, Continuation, null);
    }

    function Indirection() {
      return [<Child bar={true} />, <Child bar={false} />];
    }

    function HandleYields(props, yields) {
      return yields.map(y =>
        <y.continuation isSame={props.foo === y.props.bar} />
      );
    }

    // An alternative API could mark Parent as something that needs
    // yielding. E.g. Parent.handler = HandleYields;
    function Parent(props) {
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

  });

});
