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
let ReactFeatureFlags;
let ReactNoop;

describe('ReactIncrementalReflection', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function div(...children) {
    children = children.map(
      c => (typeof c === 'string' ? {text: c, hidden: false} : c),
    );
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  it('handles isMounted even when the initial render is deferred', () => {
    const instances = [];

    class Component extends React.Component {
      _isMounted() {
        // No longer a public API, but we can test that it works internally by
        // reaching into the updater.
        return this.updater.isMounted(this);
      }
      UNSAFE_componentWillMount() {
        instances.push(this);
        ReactNoop.yield('componentWillMount: ' + this._isMounted());
      }
      componentDidMount() {
        ReactNoop.yield('componentDidMount: ' + this._isMounted());
      }
      render() {
        return <span />;
      }
    }

    function Foo() {
      return <Component />;
    }

    ReactNoop.render(<Foo />);

    // Render part way through but don't yet commit the updates.
    expect(ReactNoop).toFlushAndYieldThrough(['componentWillMount: false']);

    expect(instances[0]._isMounted()).toBe(false);

    // Render the rest and commit the updates.
    expect(() =>
      expect(ReactNoop).toFlushAndYield(['componentDidMount: true']),
    ).toWarnDev(
      'componentWillMount: Please update the following components ' +
        'to use componentDidMount instead: Component',
      {withoutStack: true},
    );

    expect(instances[0]._isMounted()).toBe(true);
  });

  it('handles isMounted when an unmount is deferred', () => {
    const instances = [];

    class Component extends React.Component {
      _isMounted() {
        return this.updater.isMounted(this);
      }
      UNSAFE_componentWillMount() {
        instances.push(this);
      }
      componentWillUnmount() {
        ReactNoop.yield('componentWillUnmount: ' + this._isMounted());
      }
      render() {
        ReactNoop.yield('Component');
        return <span />;
      }
    }

    function Other() {
      ReactNoop.yield('Other');
      return <span />;
    }

    function Foo(props) {
      return props.mount ? <Component /> : <Other />;
    }

    ReactNoop.render(<Foo mount={true} />);
    expect(() => expect(ReactNoop).toFlushAndYield(['Component'])).toWarnDev(
      'componentWillMount: Please update the following components ' +
        'to use componentDidMount instead: Component',
      {withoutStack: true},
    );

    expect(instances[0]._isMounted()).toBe(true);

    ReactNoop.render(<Foo mount={false} />);
    // Render part way through but don't yet commit the updates so it is not
    // fully unmounted yet.
    expect(ReactNoop).toFlushAndYieldThrough(['Other']);

    expect(instances[0]._isMounted()).toBe(true);

    // Finish flushing the unmount.
    expect(ReactNoop).toFlushAndYield(['componentWillUnmount: true']);

    expect(instances[0]._isMounted()).toBe(false);
  });

  it('finds no node before insertion and correct node before deletion', () => {
    let classInstance = null;

    function findInstance(inst) {
      // We ignore warnings fired by findInstance because we are testing
      // that the actual behavior still works as expected even though it
      // is deprecated.
      let oldConsoleError = console.error;
      console.error = jest.fn();
      try {
        return ReactNoop.findInstance(inst);
      } finally {
        console.error = oldConsoleError;
      }
    }

    class Component extends React.Component {
      UNSAFE_componentWillMount() {
        classInstance = this;
        ReactNoop.yield(['componentWillMount', findInstance(this)]);
      }
      componentDidMount() {
        ReactNoop.yield(['componentDidMount', findInstance(this)]);
      }
      UNSAFE_componentWillUpdate() {
        ReactNoop.yield(['componentWillUpdate', findInstance(this)]);
      }
      componentDidUpdate() {
        ReactNoop.yield(['componentDidUpdate', findInstance(this)]);
      }
      componentWillUnmount() {
        ReactNoop.yield(['componentWillUnmount', findInstance(this)]);
      }
      render() {
        ReactNoop.yield('render');
        return this.props.step < 2 ? (
          <span ref={ref => (this.span = ref)} />
        ) : this.props.step === 2 ? (
          <div ref={ref => (this.div = ref)} />
        ) : this.props.step === 3 ? null : this.props.step === 4 ? (
          <div ref={ref => (this.span = ref)} />
        ) : null;
      }
    }

    function Sibling() {
      // Sibling is used to assert that we've rendered past the first component.
      ReactNoop.yield('render sibling');
      return <span />;
    }

    function Foo(props) {
      return [<Component key="a" step={props.step} />, <Sibling key="b" />];
    }

    ReactNoop.render(<Foo step={0} />);
    // Flush past Component but don't complete rendering everything yet.
    expect(ReactNoop).toFlushAndYieldThrough([
      ['componentWillMount', null],
      'render',
      'render sibling',
    ]);

    expect(classInstance).toBeDefined();
    // The instance has been complete but is still not committed so it should
    // not find any host nodes in it.
    expect(findInstance(classInstance)).toBe(null);

    expect(() =>
      expect(ReactNoop).toFlushAndYield([['componentDidMount', span()]]),
    ).toWarnDev(
      'componentWillMount: Please update the following components ' +
        'to use componentDidMount instead: Component' +
        '\n\ncomponentWillUpdate: Please update the following components ' +
        'to use componentDidUpdate instead: Component',
      {withoutStack: true},
    );

    const hostSpan = classInstance.span;
    expect(hostSpan).toBeDefined();

    expect(findInstance(classInstance)).toBe(hostSpan);

    // Flush next step which will cause an update but not yet render a new host
    // node.
    ReactNoop.render(<Foo step={1} />);
    expect(ReactNoop).toFlushAndYield([
      ['componentWillUpdate', hostSpan],
      'render',
      'render sibling',
      ['componentDidUpdate', hostSpan],
    ]);

    expect(ReactNoop.findInstance(classInstance)).toBe(hostSpan);

    // The next step will render a new host node but won't get committed yet.
    // We expect this to mutate the original Fiber.
    ReactNoop.render(<Foo step={2} />);
    expect(ReactNoop).toFlushAndYieldThrough([
      ['componentWillUpdate', hostSpan],
      'render',
      'render sibling',
    ]);

    // This should still be the host span.
    expect(ReactNoop.findInstance(classInstance)).toBe(hostSpan);

    // When we finally flush the tree it will get committed.
    expect(ReactNoop).toFlushAndYield([['componentDidUpdate', div()]]);

    const hostDiv = classInstance.div;
    expect(hostDiv).toBeDefined();
    expect(hostSpan).not.toBe(hostDiv);

    // We should now find the new host node.
    expect(ReactNoop.findInstance(classInstance)).toBe(hostDiv);

    // Render to null but don't commit it yet.
    ReactNoop.render(<Foo step={3} />);
    expect(ReactNoop).toFlushAndYieldThrough([
      ['componentWillUpdate', hostDiv],
      'render',
      'render sibling',
    ]);

    // This should still be the host div since the deletion is not committed.
    expect(ReactNoop.findInstance(classInstance)).toBe(hostDiv);

    expect(ReactNoop).toFlushAndYield([['componentDidUpdate', null]]);

    // This should still be the host div since the deletion is not committed.
    expect(ReactNoop.findInstance(classInstance)).toBe(null);

    // Render a div again
    ReactNoop.render(<Foo step={4} />);
    expect(ReactNoop).toFlushAndYield([
      ['componentWillUpdate', null],
      'render',
      'render sibling',
      ['componentDidUpdate', div()],
    ]);

    // Unmount the component.
    ReactNoop.render([]);
    expect(ReactNoop).toFlushAndYield([['componentWillUnmount', hostDiv]]);
  });
});
