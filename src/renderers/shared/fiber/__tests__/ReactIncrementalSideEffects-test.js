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

describe('ReactIncrementalSideEffects', () => {
  beforeEach(() => {
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function div(...children) {
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
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

    ReactNoop.render(<Foo text="Hello" />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([div(span())]);

    ReactNoop.render(<Foo text="World" />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([div(span(), span())]);
  });

  it('does not update child nodes if a flush is aborted', () => {
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
    ReactNoop.flushDeferredPri(35);
    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hello'), span('Hello')), span('Yo')),
    ]);
  });

  it('preserves a previously rendered node when deprioritized', () => {
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

    expect(ReactNoop.root.children).toEqual([div(div(span('foo')))]);

    ReactNoop.render(<Foo text="bar" />);
    ReactNoop.flushDeferredPri(20);

    expect(ReactNoop.root.children).toEqual([div(div(span('foo')))]);

    ReactNoop.flush();

    expect(ReactNoop.root.children).toEqual([div(div(span('bar')))]);
  });

  it('can reuse side-effects after being preempted', () => {
    function Bar(props) {
      return <span prop={props.children} />;
    }

    var middleContent = (
      <div>
        <Bar>Hello</Bar>
        <Bar>World</Bar>
      </div>
    );

    function Foo(props) {
      return (
        <div hidden={true}>
          {props.step === 0
            ? <div>
                <Bar>Hi</Bar>
                <Bar>{props.text}</Bar>
              </div>
            : middleContent}
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" step={0} />);
    ReactNoop.flush();

    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // Make a quick update which will schedule low priority work to
    // update the middle content.
    ReactNoop.render(<Foo text="bar" step={1} />);
    ReactNoop.flushDeferredPri(30);

    // The tree remains unchanged.
    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // The first Bar has already completed its update but we'll interupt it to
    // render some higher priority work. The middle content will bailout so
    // it remains untouched which means that it should reuse it next time.
    ReactNoop.render(<Foo text="foo" step={1} />);
    ReactNoop.flush();

    // Since we did nothing to the middle subtree during the interuption,
    // we should be able to reuse the reconciliation work that we already did
    // without restarting. The side-effects should still be replayed.

    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hello'), span('World'))),
    ]);
  });

  it('can reuse side-effects after being preempted, if shouldComponentUpdate is false', () => {
    class Bar extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.children !== nextProps.children;
      }
      render() {
        return <span prop={this.props.children} />;
      }
    }

    class Content extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.step !== nextProps.step;
      }
      render() {
        return (
          <div>
            <Bar>{this.props.step === 0 ? 'Hi' : 'Hello'}</Bar>
            <Bar>{this.props.step === 0 ? this.props.text : 'World'}</Bar>
          </div>
        );
      }
    }

    function Foo(props) {
      return (
        <div hidden={true}>
          <Content step={props.step} text={props.text} />
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" step={0} />);
    ReactNoop.flush();

    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // Make a quick update which will schedule low priority work to
    // update the middle content.
    ReactNoop.render(<Foo text="bar" step={1} />);
    ReactNoop.flushDeferredPri(35);

    // The tree remains unchanged.
    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // The first Bar has already completed its update but we'll interupt it to
    // render some higher priority work. The middle content will bailout so
    // it remains untouched which means that it should reuse it next time.
    ReactNoop.render(<Foo text="foo" step={1} />);
    ReactNoop.flush(30);

    // Since we did nothing to the middle subtree during the interuption,
    // we should be able to reuse the reconciliation work that we already did
    // without restarting. The side-effects should still be replayed.

    expect(ReactNoop.root.children).toEqual([
      div(div(span('Hello'), span('World'))),
    ]);
  });

  it('updates a child even though the old props is empty', () => {
    function Foo(props) {
      return (
        <div hidden={true}>
          <span prop={1} />
        </div>
      );
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([div(span(1))]);
  });

  it('can defer side-effects and resume them later on', function() {
    class Bar extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.idx !== nextProps;
      }
      render() {
        return <span prop={this.props.idx} />;
      }
    }
    function Foo(props) {
      return (
        <div>
          <span prop={props.tick} />
          <div hidden={true}>
            <Bar idx={props.idx} />
            <Bar idx={props.idx + 1} />
          </div>
        </div>
      );
    }
    ReactNoop.render(<Foo tick={0} idx={0} />);
    ReactNoop.flushDeferredPri(40 + 25);
    expect(ReactNoop.root.children).toEqual([
      div(
        span(0),
        div(/*the spans are down-prioritized and not rendered yet*/),
      ),
    ]);
    ReactNoop.render(<Foo tick={1} idx={0} />);
    ReactNoop.flushDeferredPri(35 + 25);
    expect(ReactNoop.root.children).toEqual([
      div(span(1), div(/*still not rendered yet*/)),
    ]);
    ReactNoop.flushDeferredPri(30 + 25);
    expect(ReactNoop.root.children).toEqual([
      div(
        span(1),
        div(
          // Now we had enough time to finish the spans.
          span(0),
          span(1),
        ),
      ),
    ]);
    var innerSpanA = ReactNoop.root.children[0].children[1].children[1];
    ReactNoop.render(<Foo tick={2} idx={1} />);
    ReactNoop.flushDeferredPri(30 + 25);
    expect(ReactNoop.root.children).toEqual([
      div(
        span(2),
        div(
          // Still same old numbers.
          span(0),
          span(1),
        ),
      ),
    ]);
    ReactNoop.flushDeferredPri(30);
    expect(ReactNoop.root.children).toEqual([
      div(
        span(2),
        div(
          // New numbers.
          span(1),
          span(2),
        ),
      ),
    ]);

    var innerSpanB = ReactNoop.root.children[0].children[1].children[1];
    // This should have been an update to an existing instance, not recreation.
    // We verify that by ensuring that the child instance was the same as
    // before.
    expect(innerSpanA).toBe(innerSpanB);
  });

  // TODO: Test that side-effects are not cut off when a work in progress node
  // moves to "current" without flushing due to having lower priority. Does this
  // even happen? Maybe a child doesn't get processed because it is lower prio?

  it('calls callback after update is flushed', () => {
    let instance;
    class Foo extends React.Component {
      constructor() {
        super();
        instance = this;
        this.state = {text: 'foo'};
      }
      render() {
        return <span prop={this.state.text} />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ReactNoop.root.children).toEqual([span('foo')]);
    let called = false;
    instance.setState({text: 'bar'}, () => {
      expect(ReactNoop.root.children).toEqual([span('bar')]);
      called = true;
    });
    ReactNoop.flush();
    expect(called).toBe(true);
  });

  // TODO: Test that callbacks are not lost if an update is preempted.
});
