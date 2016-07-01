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

    var barCalled = false;
    function Bar() {
      barCalled = true;
      return <span><div>Hello World</div></span>;
    }

    var fooCalled = false;
    function Foo() {
      fooCalled = true;
      return [
        <Bar isBar={true} />,
        <Bar isBar={true} />,
      ];
    }

    ReactNoop.render(<Foo />);
    expect(fooCalled).toBe(false);
    expect(barCalled).toBe(false);
    // Do one step of work.
    ReactNoop.flushLowPri(7);
    expect(fooCalled).toBe(true);
    expect(barCalled).toBe(false);
    // Do the rest of the work.
    ReactNoop.flushLowPri(50);
    expect(fooCalled).toBe(true);
    expect(barCalled).toBe(true);
  });

  it('updates a previous render', function() {

    var ops = [];

    function Header() {
      ops.push('Header');
      return <h1>Hi</h1>;
    }

    function Content(props) {
      ops.push('Content');
      return <div>{props.children}</div>;
    }

    function Footer() {
      ops.push('Footer');
      return <footer>Bye</footer>;
    }

    var header = <Header />;
    var footer = <Footer />;

    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          {header}
          <Content>{props.text}</Content>
          {footer}
        </div>
      );
    }

    ReactNoop.render(<Foo text="foo" />);
    ReactNoop.flush();

    expect(ops).toEqual(['Foo', 'Header', 'Content', 'Footer']);

    ops = [];

    ReactNoop.render(<Foo text="bar" />);
    ReactNoop.flush();

    // Since this is an update, it should bail out and reuse the work from
    // Header and Content.
    expect(ops).toEqual(['Foo', 'Content']);

  });

});
