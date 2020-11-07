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
let ReactNoop;
let Scheduler;

describe('ReactIncrementalReflection', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function div(...children) {
    children = children.map(c =>
      typeof c === 'string' ? {text: c, hidden: false} : c,
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
        Scheduler.unstable_yieldValue(
          'componentWillMount: ' + this._isMounted(),
        );
      }
      componentDidMount() {
        Scheduler.unstable_yieldValue(
          'componentDidMount: ' + this._isMounted(),
        );
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
    expect(Scheduler).toFlushAndYieldThrough(['componentWillMount: false']);

    expect(instances[0]._isMounted()).toBe(false);

    // Render the rest and commit the updates.
    expect(() =>
      expect(Scheduler).toFlushAndYield(['componentDidMount: true']),
    ).toErrorDev(
      'Using UNSAFE_componentWillMount in strict mode is not recommended',
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
        Scheduler.unstable_yieldValue(
          'componentWillUnmount: ' + this._isMounted(),
        );
      }
      render() {
        Scheduler.unstable_yieldValue('Component');
        return <span />;
      }
    }

    function Other() {
      Scheduler.unstable_yieldValue('Other');
      return <span />;
    }

    function Foo(props) {
      return props.mount ? <Component /> : <Other />;
    }

    ReactNoop.render(<Foo mount={true} />);
    expect(() =>
      expect(Scheduler).toFlushAndYield(['Component']),
    ).toErrorDev(
      'Using UNSAFE_componentWillMount in strict mode is not recommended',
      {withoutStack: true},
    );

    expect(instances[0]._isMounted()).toBe(true);

    ReactNoop.render(<Foo mount={false} />);
    // Render part way through but don't yet commit the updates so it is not
    // fully unmounted yet.
    expect(Scheduler).toFlushAndYieldThrough(['Other']);

    expect(instances[0]._isMounted()).toBe(true);

    // Finish flushing the unmount.
    expect(Scheduler).toFlushAndYield(['componentWillUnmount: true']);

    expect(instances[0]._isMounted()).toBe(false);
  });

  it('finds no node before insertion and correct node before deletion', () => {
    let classInstance = null;

    function findInstance(inst) {
      // We ignore warnings fired by findInstance because we are testing
      // that the actual behavior still works as expected even though it
      // is deprecated.
      const oldConsoleError = console.error;
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
        Scheduler.unstable_yieldValue([
          'componentWillMount',
          findInstance(this),
        ]);
      }
      componentDidMount() {
        Scheduler.unstable_yieldValue([
          'componentDidMount',
          findInstance(this),
        ]);
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.unstable_yieldValue([
          'componentWillUpdate',
          findInstance(this),
        ]);
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue([
          'componentDidUpdate',
          findInstance(this),
        ]);
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue([
          'componentWillUnmount',
          findInstance(this),
        ]);
      }
      render() {
        Scheduler.unstable_yieldValue('render');
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
      Scheduler.unstable_yieldValue('render sibling');
      return <span />;
    }

    function Foo(props) {
      return [<Component key="a" step={props.step} />, <Sibling key="b" />];
    }

    ReactNoop.render(<Foo step={0} />);
    // Flush past Component but don't complete rendering everything yet.
    expect(Scheduler).toFlushAndYieldThrough([
      ['componentWillMount', null],
      'render',
      'render sibling',
    ]);

    expect(classInstance).toBeDefined();
    // The instance has been complete but is still not committed so it should
    // not find any host nodes in it.
    expect(findInstance(classInstance)).toBe(null);

    expect(() =>
      expect(Scheduler).toFlushAndYield([['componentDidMount', span()]]),
    ).toErrorDev(
      [
        'Using UNSAFE_componentWillMount in strict mode is not recommended',
        'Using UNSAFE_componentWillUpdate in strict mode is not recommended',
      ],
      {withoutStack: true},
    );

    const hostSpan = classInstance.span;
    expect(hostSpan).toBeDefined();

    expect(findInstance(classInstance)).toBe(hostSpan);

    // Flush next step which will cause an update but not yet render a new host
    // node.
    ReactNoop.render(<Foo step={1} />);
    expect(Scheduler).toFlushAndYield([
      ['componentWillUpdate', hostSpan],
      'render',
      'render sibling',
      ['componentDidUpdate', hostSpan],
    ]);

    expect(ReactNoop.findInstance(classInstance)).toBe(hostSpan);

    // The next step will render a new host node but won't get committed yet.
    // We expect this to mutate the original Fiber.
    ReactNoop.render(<Foo step={2} />);
    expect(Scheduler).toFlushAndYieldThrough([
      ['componentWillUpdate', hostSpan],
      'render',
      'render sibling',
    ]);

    // This should still be the host span.
    expect(ReactNoop.findInstance(classInstance)).toBe(hostSpan);

    // When we finally flush the tree it will get committed.
    expect(Scheduler).toFlushAndYield([['componentDidUpdate', div()]]);

    const hostDiv = classInstance.div;
    expect(hostDiv).toBeDefined();
    expect(hostSpan).not.toBe(hostDiv);

    // We should now find the new host node.
    expect(ReactNoop.findInstance(classInstance)).toBe(hostDiv);

    // Render to null but don't commit it yet.
    ReactNoop.render(<Foo step={3} />);
    expect(Scheduler).toFlushAndYieldThrough([
      ['componentWillUpdate', hostDiv],
      'render',
      'render sibling',
    ]);

    // This should still be the host div since the deletion is not committed.
    expect(ReactNoop.findInstance(classInstance)).toBe(hostDiv);

    expect(Scheduler).toFlushAndYield([['componentDidUpdate', null]]);

    // This should still be the host div since the deletion is not committed.
    expect(ReactNoop.findInstance(classInstance)).toBe(null);

    // Render a div again
    ReactNoop.render(<Foo step={4} />);
    expect(Scheduler).toFlushAndYield([
      ['componentWillUpdate', null],
      'render',
      'render sibling',
      ['componentDidUpdate', div()],
    ]);

    // Unmount the component.
    ReactNoop.render([]);
    expect(Scheduler).toFlushAndYield([['componentWillUnmount', hostDiv]]);
  });
});
