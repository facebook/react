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

    class Tester extends React.Component {
      shouldComponentUpdate() {
        return false;
      }
      render() {
        // This component is just here to ensure that the bail out is
        // in fact in effect in the expected place for this test.
        ops.push('Tester');
        return <div />;
      }
    }

    function Middle(props) {
      ops.push('Middle');
      return <span>{props.children}</span>;
    }

    // Should content not just bail out on current, not workInProgress?

    class Content extends React.Component {
      shouldComponentUpdate() {
        return false;
      }
      render() {
        return [
          <Tester unused={this.props.unused} />,
          <bbb hidden={true}>
            <ccc>
              <Middle>Hi</Middle>
            </ccc>
          </bbb>,
        ];
      }
    }

    function Foo(props) {
      ops.push('Foo');
      return (
        <div hidden={props.text === 'bar'}>
          <Bar>{props.text}</Bar>
          <Content unused={props.text} />
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

  it('can reuse work done after being preempted', function() {

    var ops = [];

    function Bar(props) {
      ops.push('Bar');
      return <div>{props.children}</div>;
    }

    function Middle(props) {
      ops.push('Middle');
      return <span>{props.children}</span>;
    }

    var middleContent = (
      <div>
        <Middle>Hello</Middle>
        <Bar>-</Bar>
        <Middle>World</Middle>
      </div>
    );

    var step0 = (
      <div>
        <Middle>Hi</Middle>
        <Bar>{'Foo'}</Bar>
        <Middle>There</Middle>
      </div>
    );

    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          <Bar>{props.text2}</Bar>
          <div hidden={true}>
            {
              props.step === 0 ?
                step0
                : middleContent
            }
          </div>
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" text2="foo" step={0} />);
    ReactNoop.flushLowPri(55);

    // We only finish the higher priority work. So the low pri content
    // has not yet finished mounting.
    expect(ops).toEqual(['Foo', 'Bar', 'Middle', 'Bar']);

    ops = [];

    // Interupt the rendering with a quick update. This should not touch the
    // middle content.
    ReactNoop.render(<Foo text="foo" text2="bar" step={0} />);
    ReactNoop.flush();

    // We've now rendered the entire tree but we didn't have to redo the work
    // done by the first Middle and Bar already.
    expect(ops).toEqual(['Foo', 'Bar', 'Middle']);

    ops = [];

    // Make a quick update which will schedule low priority work to
    // update the middle content.
    ReactNoop.render(<Foo text="bar" text2="bar" step={1} />);
    ReactNoop.flushLowPri(30);

    expect(ops).toEqual(['Foo', 'Bar']);

    ops = [];

    // The middle content is now pending rendering...
    ReactNoop.flushLowPri(30);
    expect(ops).toEqual(['Middle', 'Bar']);

    ops = [];

    // but we'll interupt it to render some higher priority work.
    // The middle content will bailout so it remains untouched.
    ReactNoop.render(<Foo text="foo" text2="bar" step={1} />);
    ReactNoop.flushLowPri(30);

    expect(ops).toEqual(['Foo', 'Bar']);

    ops = [];

    // Since we did nothing to the middle subtree during the interuption,
    // we should be able to reuse the reconciliation work that we already did
    // without restarting.
    ReactNoop.flush();
    expect(ops).toEqual(['Middle']);

  });

  it('can reuse work if shouldComponentUpdate is false, after being preempted', function() {

    var ops = [];

    function Bar(props) {
      ops.push('Bar');
      return <div>{props.children}</div>;
    }

    class Middle extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.children !== nextProps.children;
      }
      render() {
        ops.push('Middle');
        return <span>{this.props.children}</span>;
      }
    }

    class Content extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.step !== nextProps.step;
      }
      render() {
        ops.push('Content');
        return (
          <div>
            <Middle>{this.props.step === 0 ? 'Hi' : 'Hello'}</Middle>
            <Bar>{this.props.step === 0 ? this.props.text : '-'}</Bar>
            <Middle>{this.props.step === 0 ? 'There' : 'World'}</Middle>
          </div>
        );
      }
    }

    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          <Bar>{props.text}</Bar>
          <div hidden={true}>
            <Content step={props.step} text={props.text} />
          </div>
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" step={0} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Foo', 'Bar', 'Content', 'Middle', 'Bar', 'Middle']);

    ops = [];

    // Make a quick update which will schedule low priority work to
    // update the middle content.
    ReactNoop.render(<Foo text="bar" step={1} />);
    ReactNoop.flushLowPri(30);

    expect(ops).toEqual(['Foo', 'Bar']);

    ops = [];

    // The middle content is now pending rendering...
    ReactNoop.flushLowPri(30);
    expect(ops).toEqual(['Content', 'Middle', 'Bar']); // One more Middle left.

    ops = [];

    // but we'll interupt it to render some higher priority work.
    // The middle content will bailout so it remains untouched.
    ReactNoop.render(<Foo text="foo" step={1} />);
    ReactNoop.flushLowPri(30);

    expect(ops).toEqual(['Foo', 'Bar']);

    ops = [];

    // Since we did nothing to the middle subtree during the interuption,
    // we should be able to reuse the reconciliation work that we already did
    // without restarting.
    ReactNoop.flush();
    // TODO: Content never fully completed its render so can't completely bail
    // out on the entire subtree. However, we could do a shallow bail out and
    // not rerender Content, but keep going down the incomplete tree.
    // Normally shouldComponentUpdate->false is not enough to determine that we
    // can safely reuse the old props, but I think in this case it would be ok,
    // since it is a resume of already started work.
    // Because of the above we can also not reuse the work of Bar because the
    // rerender of Content will generate a new element which will mean we don't
    // auto-bail out from Bar.
    expect(ops).toEqual(['Content', 'Bar', 'Middle']);

  });
});
