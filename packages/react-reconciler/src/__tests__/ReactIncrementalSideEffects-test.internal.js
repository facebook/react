/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;

describe('ReactIncrementalSideEffects', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? text(c) : c));
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function text(t) {
    return {text: t};
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
    expect(ReactNoop.getChildren()).toEqual([div(span())]);

    ReactNoop.render(<Foo text="World" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div(span(), span())]);
  });

  it('can update child nodes of a fragment', function() {
    function Bar(props) {
      return <span>{props.text}</span>;
    }

    function Foo(props) {
      return (
        <div>
          <Bar text={props.text} />
          {props.text === 'World'
            ? [<Bar key="a" text={props.text} />, <div key="b" />]
            : props.text === 'Hi'
              ? [<div key="b" />, <Bar key="a" text={props.text} />]
              : null}
          <span prop="test" />
        </div>
      );
    }

    ReactNoop.render(<Foo text="Hello" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div(span(), span('test'))]);

    ReactNoop.render(<Foo text="World" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(span(), span(), div(), span('test')),
    ]);

    ReactNoop.render(<Foo text="Hi" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(span(), div(), span(), span('test')),
    ]);
  });

  it('can update child nodes rendering into text nodes', function() {
    function Bar(props) {
      return props.text;
    }

    function Foo(props) {
      return (
        <div>
          <Bar text={props.text} />
          {props.text === 'World'
            ? [<Bar key="a" text={props.text} />, '!']
            : null}
        </div>
      );
    }

    ReactNoop.render(<Foo text="Hello" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div('Hello')]);

    ReactNoop.render(<Foo text="World" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div('World', 'World', '!')]);
  });

  it('can deletes children either components, host or text', function() {
    function Bar(props) {
      return <span prop={props.children} />;
    }

    function Foo(props) {
      return (
        <div>
          {props.show
            ? [<div key="a" />, <Bar key="b">Hello</Bar>, 'World']
            : []}
        </div>
      );
    }

    ReactNoop.render(<Foo show={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(div(), span('Hello'), 'World'),
    ]);

    ReactNoop.render(<Foo show={false} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('can delete a child that changes type - implicit keys', function() {
    let unmounted = false;

    class ClassComponent extends React.Component {
      componentWillUnmount() {
        unmounted = true;
      }
      render() {
        return <span prop="Class" />;
      }
    }

    function FunctionalComponent(props) {
      return <span prop="Function" />;
    }

    function Foo(props) {
      return (
        <div>
          {props.useClass ? (
            <ClassComponent />
          ) : props.useFunction ? (
            <FunctionalComponent />
          ) : props.useText ? (
            'Text'
          ) : null}
          Trail
        </div>
      );
    }

    ReactNoop.render(<Foo useClass={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div(span('Class'), 'Trail')]);

    expect(unmounted).toBe(false);

    ReactNoop.render(<Foo useFunction={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div(span('Function'), 'Trail')]);

    expect(unmounted).toBe(true);

    ReactNoop.render(<Foo useText={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div('Text', 'Trail')]);

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div('Trail')]);
  });

  it('can delete a child that changes type - explicit keys', function() {
    let unmounted = false;

    class ClassComponent extends React.Component {
      componentWillUnmount() {
        unmounted = true;
      }
      render() {
        return <span prop="Class" />;
      }
    }

    function FunctionalComponent(props) {
      return <span prop="Function" />;
    }

    function Foo(props) {
      return (
        <div>
          {props.useClass ? (
            <ClassComponent key="a" />
          ) : props.useFunction ? (
            <FunctionalComponent key="a" />
          ) : null}
          Trail
        </div>
      );
    }

    ReactNoop.render(<Foo useClass={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div(span('Class'), 'Trail')]);

    expect(unmounted).toBe(false);

    ReactNoop.render(<Foo useFunction={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div(span('Function'), 'Trail')]);

    expect(unmounted).toBe(true);

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div('Trail')]);
  });

  it('can delete a child when it unmounts inside a portal', () => {
    function Bar(props) {
      return <span prop={props.children} />;
    }

    const portalContainer = ReactNoop.getOrCreateRootContainer(
      'portalContainer',
    );
    function Foo(props) {
      return ReactNoop.createPortal(
        props.show ? [<div key="a" />, <Bar key="b">Hello</Bar>, 'World'] : [],
        portalContainer,
        null,
      );
    }

    ReactNoop.render(
      <div>
        <Foo show={true} />
      </div>,
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div()]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([
      div(),
      span('Hello'),
      text('World'),
    ]);

    ReactNoop.render(
      <div>
        <Foo show={false} />
      </div>,
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div()]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([]);

    ReactNoop.render(
      <div>
        <Foo show={true} />
      </div>,
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div()]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([
      div(),
      span('Hello'),
      text('World'),
    ]);

    ReactNoop.render(null);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([]);

    ReactNoop.render(<Foo show={false} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([]);

    ReactNoop.render(<Foo show={true} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([
      div(),
      span('Hello'),
      text('World'),
    ]);

    ReactNoop.render(null);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([]);
  });

  it('can delete a child when it unmounts with a portal', () => {
    function Bar(props) {
      return <span prop={props.children} />;
    }

    const portalContainer = ReactNoop.getOrCreateRootContainer(
      'portalContainer',
    );
    function Foo(props) {
      return ReactNoop.createPortal(
        [<div key="a" />, <Bar key="b">Hello</Bar>, 'World'],
        portalContainer,
        null,
      );
    }

    ReactNoop.render(
      <div>
        <Foo />
      </div>,
    );
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([div()]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([
      div(),
      span('Hello'),
      text('World'),
    ]);

    ReactNoop.render(null);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([]);

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([
      div(),
      span('Hello'),
      text('World'),
    ]);

    ReactNoop.render(null);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([]);
    expect(ReactNoop.getChildren('portalContainer')).toEqual([]);
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
    expect(ReactNoop.getChildren()).toEqual([
      div(div(span('Hello'), span('Hello')), span('Yo')),
    ]);

    ReactNoop.render(<Foo text="World" />);
    ReactNoop.flushDeferredPri(35);
    expect(ReactNoop.getChildren()).toEqual([
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

    expect(ReactNoop.getChildren()).toEqual([div(div(span('foo')))]);

    ReactNoop.render(<Foo text="bar" />);
    ReactNoop.flushDeferredPri(20);

    expect(ReactNoop.getChildren()).toEqual([div(div(span('foo')))]);

    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([div(div(span('bar')))]);
  });

  it('can reuse side-effects after being preempted', () => {
    function Bar(props) {
      return <span prop={props.children} />;
    }

    const middleContent = (
      <div>
        <Bar>Hello</Bar>
        <Bar>World</Bar>
      </div>
    );

    function Foo(props) {
      return (
        <div hidden={true}>
          {props.step === 0 ? (
            <div>
              <Bar>Hi</Bar>
              <Bar>{props.text}</Bar>
            </div>
          ) : (
            middleContent
          )}
        </div>
      );
    }

    // Init
    ReactNoop.render(<Foo text="foo" step={0} />);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // Make a quick update which will schedule low priority work to
    // update the middle content.
    ReactNoop.render(<Foo text="bar" step={1} />);
    ReactNoop.flushDeferredPri(30);

    // The tree remains unchanged.
    expect(ReactNoop.getChildren()).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // The first Bar has already completed its update but we'll interrupt it to
    // render some higher priority work. The middle content will bailout so
    // it remains untouched which means that it should reuse it next time.
    ReactNoop.render(<Foo text="foo" step={1} />);
    ReactNoop.flush();

    // Since we did nothing to the middle subtree during the interruption,
    // we should be able to reuse the reconciliation work that we already did
    // without restarting. The side-effects should still be replayed.

    expect(ReactNoop.getChildren()).toEqual([
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

    expect(ReactNoop.getChildren()).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // Make a quick update which will schedule low priority work to
    // update the middle content.
    ReactNoop.render(<Foo text="bar" step={1} />);
    ReactNoop.flushDeferredPri(35);

    // The tree remains unchanged.
    expect(ReactNoop.getChildren()).toEqual([
      div(div(span('Hi'), span('foo'))),
    ]);

    // The first Bar has already completed its update but we'll interrupt it to
    // render some higher priority work. The middle content will bailout so
    // it remains untouched which means that it should reuse it next time.
    ReactNoop.render(<Foo text="foo" step={1} />);
    ReactNoop.flush(30);

    // Since we did nothing to the middle subtree during the interruption,
    // we should be able to reuse the reconciliation work that we already did
    // without restarting. The side-effects should still be replayed.

    expect(ReactNoop.getChildren()).toEqual([
      div(div(span('Hello'), span('World'))),
    ]);
  });

  it('can update a completed tree before it has a chance to commit', () => {
    function Foo(props) {
      return <span prop={props.step} />;
    }
    ReactNoop.render(<Foo step={1} />);
    // This should be just enough to complete the tree without committing it
    ReactNoop.flushDeferredPri(20);
    expect(ReactNoop.getChildren()).toEqual([]);
    // To confirm, perform one more unit of work. The tree should now be flushed.
    // (ReactNoop decrements the time remaining by 5 *before* returning it from
    // the deadline, so to perform n units of work, you need to give it 5n + 5.
    // TODO: This is confusing. Decrement it after.)
    ReactNoop.flushDeferredPri(10);
    expect(ReactNoop.getChildren()).toEqual([span(1)]);

    ReactNoop.render(<Foo step={2} />);
    // This should be just enough to complete the tree without committing it
    ReactNoop.flushDeferredPri(20);
    expect(ReactNoop.getChildren()).toEqual([span(1)]);
    // This time, before we commit the tree, we update the root component with
    // new props
    ReactNoop.render(<Foo step={3} />);
    // Now let's commit. We already had a commit that was pending, which will
    // render 2.
    ReactNoop.flushDeferredPri(10);
    expect(ReactNoop.getChildren()).toEqual([span(2)]);
    // If we flush the rest of the work, we should get another commit that
    // renders 3. If it renders 2 again, that means an update was dropped.
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(3)]);
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
    expect(ReactNoop.getChildren()).toEqual([div(span(1))]);
  });

  xit('can defer side-effects and resume them later on', () => {
    class Bar extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.idx !== nextProps.idx;
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
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(0),
        div(/*the spans are down-prioritized and not rendered yet*/),
      ),
    ]);
    ReactNoop.render(<Foo tick={1} idx={0} />);
    ReactNoop.flushDeferredPri(35 + 25);
    expect(ReactNoop.getChildren()).toEqual([
      div(span(1), div(/*still not rendered yet*/)),
    ]);
    ReactNoop.flushDeferredPri(30 + 25);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(1),
        div(
          // Now we had enough time to finish the spans.
          span(0),
          span(1),
        ),
      ),
    ]);
    const innerSpanA = ReactNoop.getChildren()[0].children[1].children[1];
    ReactNoop.render(<Foo tick={2} idx={1} />);
    ReactNoop.flushDeferredPri(30 + 25);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(2),
        div(
          // Still same old numbers.
          span(0),
          span(1),
        ),
      ),
    ]);
    ReactNoop.render(<Foo tick={3} idx={1} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(3),
        div(
          // New numbers.
          span(1),
          span(2),
        ),
      ),
    ]);

    const innerSpanB = ReactNoop.getChildren()[0].children[1].children[1];
    // This should have been an update to an existing instance, not recreation.
    // We verify that by ensuring that the child instance was the same as
    // before.
    expect(innerSpanA).toBe(innerSpanB);
  });

  xit('can defer side-effects and reuse them later - complex', function() {
    let ops = [];

    class Bar extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.idx !== nextProps.idx;
      }
      render() {
        ops.push('Bar');
        return <span prop={this.props.idx} />;
      }
    }
    class Baz extends React.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.idx !== nextProps.idx;
      }
      render() {
        ops.push('Baz');
        return [
          <Bar key="a" idx={this.props.idx} />,
          <Bar key="b" idx={this.props.idx} />,
        ];
      }
    }
    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          <span prop={props.tick} />
          <div hidden={true}>
            <Baz idx={props.idx} />
            <Baz idx={props.idx} />
            <Baz idx={props.idx} />
          </div>
        </div>
      );
    }
    ReactNoop.render(<Foo tick={0} idx={0} />);
    ReactNoop.flushDeferredPri(65 + 5);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(0),
        div(/*the spans are down-prioritized and not rendered yet*/),
      ),
    ]);

    expect(ops).toEqual(['Foo', 'Baz', 'Bar']);
    ops = [];

    ReactNoop.render(<Foo tick={1} idx={0} />);
    ReactNoop.flushDeferredPri(70);
    expect(ReactNoop.getChildren()).toEqual([
      div(span(1), div(/*still not rendered yet*/)),
    ]);

    expect(ops).toEqual(['Foo']);
    ops = [];

    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(1),
        div(
          // Now we had enough time to finish the spans.
          span(0),
          span(0),
          span(0),
          span(0),
          span(0),
          span(0),
        ),
      ),
    ]);

    expect(ops).toEqual(['Bar', 'Baz', 'Bar', 'Bar', 'Baz', 'Bar', 'Bar']);
    ops = [];

    // Now we're going to update the index but we'll only let it finish half
    // way through.
    ReactNoop.render(<Foo tick={2} idx={1} />);
    ReactNoop.flushDeferredPri(95);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(2),
        div(
          // Still same old numbers.
          span(0),
          span(0),
          span(0),
          span(0),
          span(0),
          span(0),
        ),
      ),
    ]);

    // We let it finish half way through. That means we'll have one fully
    // completed Baz, one half-way completed Baz and one fully incomplete Baz.
    expect(ops).toEqual(['Foo', 'Baz', 'Bar', 'Bar', 'Baz', 'Bar']);
    ops = [];

    // We'll update again, without letting the new index update yet. Only half
    // way through.
    ReactNoop.render(<Foo tick={3} idx={1} />);
    ReactNoop.flushDeferredPri(50);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(3),
        div(
          // Old numbers.
          span(0),
          span(0),
          span(0),
          span(0),
          span(0),
          span(0),
        ),
      ),
    ]);

    expect(ops).toEqual(['Foo']);
    ops = [];

    // We should now be able to reuse some of the work we've already done
    // and replay those side-effects.
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(3),
        div(
          // New numbers.
          span(1),
          span(1),
          span(1),
          span(1),
          span(1),
          span(1),
        ),
      ),
    ]);

    expect(ops).toEqual(['Bar', 'Baz', 'Bar', 'Bar']);
  });

  it('deprioritizes setStates that happens within a deprioritized tree', () => {
    let ops = [];

    const barInstances = [];

    class Bar extends React.Component {
      constructor() {
        super();
        this.state = {active: false};
        barInstances.push(this);
      }
      activate() {
        this.setState({active: true});
      }
      render() {
        ops.push('Bar');
        return <span prop={this.state.active ? 'X' : this.props.idx} />;
      }
    }
    function Foo(props) {
      ops.push('Foo');
      return (
        <div>
          <span prop={props.tick} />
          <div hidden={true}>
            <Bar idx={props.idx} />
            <Bar idx={props.idx} />
            <Bar idx={props.idx} />
          </div>
        </div>
      );
    }
    ReactNoop.render(<Foo tick={0} idx={0} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(span(0), div(span(0), span(0), span(0))),
    ]);

    expect(ops).toEqual(['Foo', 'Bar', 'Bar', 'Bar']);

    ops = [];

    ReactNoop.render(<Foo tick={1} idx={1} />);
    ReactNoop.flushDeferredPri(70 + 5);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        // Updated.
        span(1),
        div(
          // Still not updated.
          span(0),
          span(0),
          span(0),
        ),
      ),
    ]);

    expect(ops).toEqual(['Foo', 'Bar', 'Bar']);
    ops = [];

    barInstances[0].activate();

    // This should not be enough time to render the content of all the hidden
    // items. Including the set state since that is deprioritized.
    // TODO: The cycles it takes to do this could be lowered with further
    // optimizations.
    ReactNoop.flushDeferredPri(35);
    expect(ReactNoop.getChildren()).toEqual([
      div(
        // Updated.
        span(1),
        div(
          // Still not updated.
          span(0),
          span(0),
          span(0),
        ),
      ),
    ]);

    expect(ops).toEqual(['Bar']);
    ops = [];

    // However, once we render fully, we will have enough time to finish it all
    // at once.
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([
      div(
        span(1),
        div(
          // Now we had enough time to finish the spans.
          span('X'),
          span(1),
          span(1),
        ),
      ),
    ]);

    expect(ops).toEqual(['Bar', 'Bar', 'Bar']);
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
    expect(ReactNoop.getChildren()).toEqual([span('foo')]);
    let called = false;
    instance.setState({text: 'bar'}, () => {
      expect(ReactNoop.getChildren()).toEqual([span('bar')]);
      called = true;
    });
    ReactNoop.flush();
    expect(called).toBe(true);
  });

  it('calls setState callback even if component bails out', () => {
    let instance;
    class Foo extends React.Component {
      constructor() {
        super();
        instance = this;
        this.state = {text: 'foo'};
      }
      shouldComponentUpdate(nextProps, nextState) {
        return this.state.text !== nextState.text;
      }
      render() {
        return <span prop={this.state.text} />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('foo')]);
    let called = false;
    instance.setState({}, () => {
      called = true;
    });
    ReactNoop.flush();
    expect(called).toBe(true);
  });

  // TODO: Test that callbacks are not lost if an update is preempted.

  it('calls componentWillUnmount after a deletion, even if nested', () => {
    const ops = [];

    class Bar extends React.Component {
      componentWillUnmount() {
        ops.push(this.props.name);
      }
      render() {
        return <span />;
      }
    }

    class Wrapper extends React.Component {
      componentWillUnmount() {
        ops.push('Wrapper');
      }
      render() {
        return <Bar name={this.props.name} />;
      }
    }

    function Foo(props) {
      return (
        <div>
          {props.show
            ? [
                <Bar key="a" name="A" />,
                <Wrapper key="b" name="B" />,
                <div key="cd">
                  <Bar name="C" />
                  <Wrapper name="D" />,
                </div>,
                [<Bar key="e" name="E" />, <Bar key="f" name="F" />],
              ]
            : []}
          <div>{props.show ? <Bar key="g" name="G" /> : null}</div>
          <Bar name="this should not unmount" />
        </div>
      );
    }

    ReactNoop.render(<Foo show={true} />);
    ReactNoop.flush();
    expect(ops).toEqual([]);

    ReactNoop.render(<Foo show={false} />);
    ReactNoop.flush();
    expect(ops).toEqual([
      'A',
      'Wrapper',
      'B',
      'C',
      'Wrapper',
      'D',
      'E',
      'F',
      'G',
    ]);
  });

  it('calls componentDidMount/Update after insertion/update', () => {
    let ops = [];

    class Bar extends React.Component {
      componentDidMount() {
        ops.push('mount:' + this.props.name);
      }
      componentDidUpdate() {
        ops.push('update:' + this.props.name);
      }
      render() {
        return <span />;
      }
    }

    class Wrapper extends React.Component {
      componentDidMount() {
        ops.push('mount:wrapper-' + this.props.name);
      }
      componentDidUpdate() {
        ops.push('update:wrapper-' + this.props.name);
      }
      render() {
        return <Bar name={this.props.name} />;
      }
    }

    function Foo(props) {
      return (
        <div>
          <Bar key="a" name="A" />
          <Wrapper key="b" name="B" />
          <div key="cd">
            <Bar name="C" />
            <Wrapper name="D" />
          </div>
          {[<Bar key="e" name="E" />, <Bar key="f" name="F" />]}
          <div>
            <Bar key="g" name="G" />
          </div>
        </div>
      );
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual([
      'mount:A',
      'mount:B',
      'mount:wrapper-B',
      'mount:C',
      'mount:D',
      'mount:wrapper-D',
      'mount:E',
      'mount:F',
      'mount:G',
    ]);

    ops = [];

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual([
      'update:A',
      'update:B',
      'update:wrapper-B',
      'update:C',
      'update:D',
      'update:wrapper-D',
      'update:E',
      'update:F',
      'update:G',
    ]);
  });

  it('invokes ref callbacks after insertion/update/unmount', () => {
    let classInstance = null;

    let ops = [];

    class ClassComponent extends React.Component {
      render() {
        classInstance = this;
        return <span />;
      }
    }

    function FunctionalComponent(props) {
      return <span />;
    }

    function Foo(props) {
      return props.show ? (
        <div>
          <ClassComponent ref={n => ops.push(n)} />
          <FunctionalComponent ref={n => ops.push(n)} />
          <div ref={n => ops.push(n)} />
        </div>
      ) : null;
    }

    ReactNoop.render(<Foo show={true} />);
    expect(ReactNoop.flush).toWarnDev(
      'Warning: Stateless function components cannot be given refs. ' +
        'Attempts to access this ref will fail.\n\nCheck the render method ' +
        'of `Foo`.\n' +
        '    in FunctionalComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in Foo (at **)',
    );
    expect(ops).toEqual([
      classInstance,
      // no call for functional components
      div(),
    ]);

    ops = [];

    // Refs that switch function instances get reinvoked
    ReactNoop.render(<Foo show={true} />);
    ReactNoop.flush();
    expect(ops).toEqual([
      // detach all refs that switched handlers first.
      null,
      null,
      // reattach as a separate phase
      classInstance,
      div(),
    ]);

    ops = [];

    ReactNoop.render(<Foo show={false} />);
    ReactNoop.flush();
    expect(ops).toEqual([
      // unmount
      null,
      null,
    ]);
  });

  // TODO: Test that mounts, updates, refs, unmounts and deletions happen in the
  // expected way for aborted and resumed render life-cycles.

  it('supports string refs', () => {
    let fooInstance = null;

    class Bar extends React.Component {
      componentDidMount() {
        this.test = 'test';
      }
      render() {
        return <div />;
      }
    }

    class Foo extends React.Component {
      render() {
        fooInstance = this;
        return <Bar ref="bar" />;
      }
    }

    ReactNoop.render(<Foo />);
    expect(ReactNoop.flush).toWarnDev(
      'Warning: A string ref, "bar", has been found within a strict mode tree.',
    );

    expect(fooInstance.refs.bar.test).toEqual('test');
  });
});
