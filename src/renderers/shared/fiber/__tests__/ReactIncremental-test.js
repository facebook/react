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

    // TODO: Test bail out of host components. This is currently unobservable.

    // Since this is an update, it should bail out and reuse the work from
    // Header and Content.
    expect(ops).toEqual(['Foo', 'Content']);

  });

  it('can cancel partially rendered work and restart', function() {

    var ops = [];

    function Bar(props) {
      ops.push('Bar');
      return <div>{props.children}</div>;
    }

    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          <Bar>{props.text}</Bar>
          <Bar>{props.text}</Bar>
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" />);
    ReactNoop.flush();

    ops = [];

    ReactNoop.render(<Foo text="bar" />);
    // Flush part of the work
    ReactNoop.flushLowPri(20);

    expect(ops).toEqual(['Foo', 'Bar']);

    ops = [];

    // This will abort the previous work and restart
    ReactNoop.render(<Foo text="baz" />);

    // Flush part of the new work
    ReactNoop.flushLowPri(20);

    expect(ops).toEqual(['Foo', 'Bar']);

    // Flush the rest of the work which now includes the low priority
    ReactNoop.flush(20);

    expect(ops).toEqual(['Foo', 'Bar', 'Bar']);

  });

  it('can deprioritize unfinished work and resume it later', function() {

    var ops = [];

    function Bar(props) {
      ops.push('Bar');
      return <div>{props.children}</div>;
    }

    function Middle(props) {
      ops.push('Middle');
      return <span>{props.children}</span>;
    }

    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          <Bar>{props.text}</Bar>
          <section hidden={true}>
            <Middle>{props.text}</Middle>
          </section>
          <Bar>{props.text}</Bar>
          <footer hidden={true}>
            <Middle>Footer</Middle>
          </footer>
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" />);
    ReactNoop.flush();

    expect(ops).toEqual(['Foo', 'Bar', 'Bar', 'Middle', 'Middle']);

    ops = [];

    // Render part of the work. This should be enough to flush everything except
    // the middle which has lower priority.
    ReactNoop.render(<Foo text="bar" />);
    ReactNoop.flushLowPri(40);

    expect(ops).toEqual(['Foo', 'Bar', 'Bar']);

    ops = [];

    // Flush only the remaining work
    ReactNoop.flush();

    expect(ops).toEqual(['Middle', 'Middle']);

  });

  it('can resume work in a subtree even when a parent bails out', function() {

    var ops = [];

    function Bar(props) {
      ops.push('Bar');
      return <div>{props.children}</div>;
    }

    function Tester() {
      // This component is just here to ensure that the bail out is
      // in fact in effect in the expected place for this test.
      ops.push('Tester');
      return <div />;
    }

    function Middle(props) {
      ops.push('Middle');
      return <span>{props.children}</span>;
    }

    var middleContent = (
      <aaa>
        <Tester />
        <bbb hidden={true}>
          <ccc>
            <Middle>Hi</Middle>
          </ccc>
        </bbb>
      </aaa>
    );

    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          <Bar>{props.text}</Bar>
          {middleContent}
          <Bar>{props.text}</Bar>
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" />);
    ReactNoop.flushLowPri(52);

    expect(ops).toEqual(['Foo', 'Bar', 'Tester', 'Bar']);

    ops = [];

    // We're now rendering an update that will bail out on updating middle.
    ReactNoop.render(<Foo text="bar" />);
    ReactNoop.flushLowPri(45);

    expect(ops).toEqual(['Foo', 'Bar', 'Bar']);

    ops = [];

    // Flush the rest to make sure that the bailout didn't block this work.
    ReactNoop.flush();
    expect(ops).toEqual(['Middle']);
  });

  it('can resume work in a bailed subtree within one pass', function() {

    var ops = [];

    function Bar(props) {
      ops.push('Bar');
      return <div>{props.children}</div>;
    }

    function Tester() {
      // This component is just here to ensure that the bail out is
      // in fact in effect in the expected place for this test.
      ops.push('Tester');
      return <div />;
    }

    function Middle(props) {
      ops.push('Middle');
      return <span>{props.children}</span>;
    }

    var middleContent = (
      <aaa>
        <Tester />
        <bbb hidden={true}>
          <ccc>
            <Middle>Hi</Middle>
          </ccc>
        </bbb>
      </aaa>
    );

    function Foo(props) {
      ops.push('Foo');
      return (
        <div hidden={props.text === 'bar'}>
          <Bar>{props.text}</Bar>
          {middleContent}
          <Bar>{props.text}</Bar>
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" />);
    ReactNoop.flushLowPri(52);

    expect(ops).toEqual(['Foo', 'Bar', 'Tester', 'Bar']);

    ops = [];

    // Make a quick update which will create a low pri tree on top of the
    // already low pri tree.
    ReactNoop.render(<Foo text="bar" />);
    ReactNoop.flushLowPri(15);

    expect(ops).toEqual(['Foo']);

    ops = [];

    // At this point, middle will bail out but it has not yet fully rendered.
    // Since that is the same priority as its parent tree. This should render
    // as a single batch. Therefore, it is correct that Middle should be in the
    // middle. If it occurs after the two "Bar" components then it was flushed
    // after them which is not correct.
    ReactNoop.flush();
    expect(ops).toEqual(['Bar', 'Middle', 'Bar']);

  });

});
