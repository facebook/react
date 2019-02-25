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

describe('ReactIncrementalUpdates', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  it('applies updates in order of priority', () => {
    let state;
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        ReactNoop.yield('commit');
        ReactNoop.deferredUpdates(() => {
          // Has low priority
          this.setState({b: 'b'});
          this.setState({c: 'c'});
        });
        // Has Task priority
        this.setState({a: 'a'});
      }
      render() {
        state = this.state;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flushThrough(['commit']);
    expect(state).toEqual({a: 'a'});
    ReactNoop.flush();
    expect(state).toEqual({a: 'a', b: 'b', c: 'c'});
  });

  it('applies updates with equal priority in insertion order', () => {
    let state;
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        // All have Task priority
        this.setState({a: 'a'});
        this.setState({b: 'b'});
        this.setState({c: 'c'});
      }
      render() {
        state = this.state;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(state).toEqual({a: 'a', b: 'b', c: 'c'});
  });

  it('only drops updates with equal or lesser priority when replaceState is called', () => {
    let instance;
    let ops = [];
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        ops.push('componentDidMount');
      }
      componentDidUpdate() {
        ops.push('componentDidUpdate');
      }
      render() {
        ops.push('render');
        instance = this;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    ReactNoop.flushSync(() => {
      ReactNoop.deferredUpdates(() => {
        instance.setState({x: 'x'});
        instance.setState({y: 'y'});
      });
      instance.setState({a: 'a'});
      instance.setState({b: 'b'});
      ReactNoop.deferredUpdates(() => {
        instance.updater.enqueueReplaceState(instance, {c: 'c'});
        instance.setState({d: 'd'});
      });
    });

    // Even though a replaceState has been already scheduled, it hasn't been
    // flushed yet because it has async priority.
    expect(instance.state).toEqual({a: 'a', b: 'b'});
    expect(ops).toEqual([
      'render',
      'componentDidMount',
      'render',
      'componentDidUpdate',
    ]);

    ops = [];

    ReactNoop.flush();
    // Now the rest of the updates are flushed, including the replaceState.
    expect(instance.state).toEqual({c: 'c', d: 'd'});
    expect(ops).toEqual(['render', 'componentDidUpdate']);
  });

  it('can abort an update, schedule additional updates, and resume', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        instance = this;
        return (
          <span
            prop={Object.keys(this.state)
              .sort()
              .join('')}
          />
        );
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    function createUpdate(letter) {
      return () => {
        ReactNoop.yield(letter);
        return {
          [letter]: letter,
        };
      };
    }

    // Schedule some async updates
    instance.setState(createUpdate('a'));
    instance.setState(createUpdate('b'));
    instance.setState(createUpdate('c'));

    // Begin the updates but don't flush them yet
    ReactNoop.flushThrough(['a', 'b', 'c']);
    expect(ReactNoop.getChildren()).toEqual([span('')]);

    // Schedule some more updates at different priorities
    instance.setState(createUpdate('d'));
    ReactNoop.flushSync(() => {
      instance.setState(createUpdate('e'));
      instance.setState(createUpdate('f'));
    });
    instance.setState(createUpdate('g'));

    // The sync updates should have flushed, but not the async ones
    expect(ReactNoop.getChildren()).toEqual([span('ef')]);

    // Now flush the remaining work. Even though e and f were already processed,
    // they should be processed again, to ensure that the terminal state
    // is deterministic.
    ReactNoop.clearYields();
    expect(ReactNoop.flush()).toEqual([
      'a',
      'b',
      'c',

      // e, f, and g are in a separate batch from a, b, and c because they
      // were scheduled in the middle of a render
      'e',
      'f',
      'g',

      'd',
      'e',
      'f',
      'g',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('abcdefg')]);
  });

  it('can abort an update, schedule a replaceState, and resume', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        instance = this;
        return (
          <span
            prop={Object.keys(this.state)
              .sort()
              .join('')}
          />
        );
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    function createUpdate(letter) {
      return () => {
        ReactNoop.yield(letter);
        return {
          [letter]: letter,
        };
      };
    }

    // Schedule some async updates
    instance.setState(createUpdate('a'));
    instance.setState(createUpdate('b'));
    instance.setState(createUpdate('c'));

    // Begin the updates but don't flush them yet
    ReactNoop.flushThrough(['a', 'b', 'c']);
    expect(ReactNoop.getChildren()).toEqual([span('')]);

    // Schedule some more updates at different priorities{
    instance.setState(createUpdate('d'));
    ReactNoop.flushSync(() => {
      instance.setState(createUpdate('e'));
      // No longer a public API, but we can test that it works internally by
      // reaching into the updater.
      instance.updater.enqueueReplaceState(instance, createUpdate('f'));
    });
    instance.setState(createUpdate('g'));

    // The sync updates should have flushed, but not the async ones. Update d
    // was dropped and replaced by e.
    expect(ReactNoop.getChildren()).toEqual([span('f')]);

    // Now flush the remaining work. Even though e and f were already processed,
    // they should be processed again, to ensure that the terminal state
    // is deterministic.
    ReactNoop.clearYields();
    expect(ReactNoop.flush()).toEqual([
      'a',
      'b',
      'c',

      // e, f, and g are in a separate batch from a, b, and c because they
      // were scheduled in the middle of a render
      'e',
      'f',
      'g',

      'd',
      'e',
      'f',
      'g',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('fg')]);
  });

  it('passes accumulation of previous updates to replaceState updater function', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        instance = this;
        return <span />;
      }
    }
    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    instance.setState({a: 'a'});
    instance.setState({b: 'b'});
    // No longer a public API, but we can test that it works internally by
    // reaching into the updater.
    instance.updater.enqueueReplaceState(instance, previousState => ({
      previousState,
    }));
    ReactNoop.flush();
    expect(instance.state).toEqual({previousState: {a: 'a', b: 'b'}});
  });

  it('does not call callbacks that are scheduled by another callback until a later commit', () => {
    let ops = [];
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        ops.push('did mount');
        this.setState({a: 'a'}, () => {
          ops.push('callback a');
          this.setState({b: 'b'}, () => {
            ops.push('callback b');
          });
        });
      }
      render() {
        ops.push('render');
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual([
      'render',
      'did mount',
      'render',
      'callback a',
      'render',
      'callback b',
    ]);
  });

  it('gives setState during reconciliation the same priority as whatever level is currently reconciling', () => {
    let instance;
    let ops = [];

    class Foo extends React.Component {
      state = {};
      UNSAFE_componentWillReceiveProps() {
        ops.push('componentWillReceiveProps');
        this.setState({b: 'b'});
      }
      render() {
        ops.push('render');
        instance = this;
        return <div />;
      }
    }
    ReactNoop.render(<Foo />);
    expect(ReactNoop.flush).toWarnDev(
      'componentWillReceiveProps: Please update the following components ' +
        'to use static getDerivedStateFromProps instead: Foo',
      {withoutStack: true},
    );

    ops = [];

    ReactNoop.flushSync(() => {
      instance.setState({a: 'a'});

      ReactNoop.render(<Foo />); // Trigger componentWillReceiveProps
    });

    expect(instance.state).toEqual({a: 'a', b: 'b'});
    expect(ops).toEqual(['componentWillReceiveProps', 'render']);
  });

  it('enqueues setState inside an updater function as if the in-progress update is progressed (and warns)', () => {
    let instance;
    let ops = [];
    class Foo extends React.Component {
      state = {};
      render() {
        ops.push('render');
        instance = this;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    instance.setState(function a() {
      ops.push('setState updater');
      this.setState({b: 'b'});
      return {a: 'a'};
    });

    expect(ReactNoop.flush).toWarnDev(
      'An update (setState, replaceState, or forceUpdate) was scheduled ' +
        'from inside an update function. Update functions should be pure, ' +
        'with zero side-effects. Consider using componentDidUpdate or a ' +
        'callback.',
      {withoutStack: true},
    );
    expect(ops).toEqual([
      // Initial render
      'render',
      'setState updater',
      // Update b is enqueued with the same priority as update a, so it should
      // be flushed in the same commit.
      'render',
    ]);
    expect(instance.state).toEqual({a: 'a', b: 'b'});

    // Test deduplication (no additional warnings expected)
    instance.setState(function a() {
      this.setState({a: 'a'});
      return {b: 'b'};
    });
    ReactNoop.flush();
  });

  it('getDerivedStateFromProps should update base state of updateQueue (based on product bug)', () => {
    // Based on real-world bug.

    let foo;
    class Foo extends React.Component {
      state = {value: 'initial state'};
      static getDerivedStateFromProps() {
        return {value: 'derived state'};
      }
      render() {
        foo = this;
        return (
          <React.Fragment>
            <span prop={this.state.value} />
            <Bar />
          </React.Fragment>
        );
      }
    }

    let bar;
    class Bar extends React.Component {
      render() {
        bar = this;
        return null;
      }
    }

    ReactNoop.flushSync(() => {
      ReactNoop.render(<Foo />);
    });
    expect(ReactNoop.getChildren()).toEqual([span('derived state')]);

    ReactNoop.flushSync(() => {
      // Triggers getDerivedStateFromProps again
      ReactNoop.render(<Foo />);
      // The noop callback is needed to trigger the specific internal path that
      // led to this bug. Removing it causes it to "accidentally" work.
      foo.setState({value: 'update state'}, function noop() {});
    });
    expect(ReactNoop.getChildren()).toEqual([span('derived state')]);

    ReactNoop.flushSync(() => {
      bar.setState({});
    });
    expect(ReactNoop.getChildren()).toEqual([span('derived state')]);
  });

  it('flushes all expired updates in a single batch', () => {
    class Foo extends React.Component {
      componentDidUpdate() {
        ReactNoop.yield('Commit: ' + this.props.prop);
      }
      componentDidMount() {
        ReactNoop.yield('Commit: ' + this.props.prop);
      }
      render() {
        ReactNoop.yield('Render: ' + this.props.prop);
        return <span prop={this.props.prop} />;
      }
    }

    // First, as a sanity check, assert what happens when four low pri
    // updates in separate batches are all flushed in the same callback
    ReactNoop.render(<Foo prop="" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo prop="he" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo prop="hell" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo prop="hello" />);

    // There should be a separate render and commit for each update
    expect(ReactNoop.flush()).toEqual([
      'Render: ',
      'Commit: ',
      'Render: he',
      'Commit: he',
      'Render: hell',
      'Commit: hell',
      'Render: hello',
      'Commit: hello',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('hello')]);

    // Now do the same thing, except this time expire all the updates
    // before flushing them.
    ReactNoop.render(<Foo prop="" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo prop="go" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo prop="good" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo prop="goodbye" />);

    ReactNoop.advanceTime(10000);
    jest.advanceTimersByTime(10000);

    // All the updates should render and commit in a single batch.
    expect(ReactNoop.flush()).toEqual(['Render: goodbye', 'Commit: goodbye']);
    expect(ReactNoop.getChildren()).toEqual([span('goodbye')]);
  });

  it('flushes all expired updates in a single batch across multiple roots', () => {
    // Same as previous test, but with two roots.
    class Foo extends React.Component {
      componentDidUpdate() {
        ReactNoop.yield('Commit: ' + this.props.prop);
      }
      componentDidMount() {
        ReactNoop.yield('Commit: ' + this.props.prop);
      }
      render() {
        ReactNoop.yield('Render: ' + this.props.prop);
        return <span prop={this.props.prop} />;
      }
    }

    // First, as a sanity check, assert what happens when four low pri
    // updates in separate batches are all flushed in the same callback
    ReactNoop.renderToRootWithID(<Foo prop="" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="" />, 'b');

    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.renderToRootWithID(<Foo prop="he" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="he" />, 'b');

    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.renderToRootWithID(<Foo prop="hell" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="hell" />, 'b');

    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.renderToRootWithID(<Foo prop="hello" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="hello" />, 'b');

    // There should be a separate render and commit for each update
    expect(ReactNoop.flush()).toEqual([
      'Render: ',
      'Commit: ',
      'Render: ',
      'Commit: ',
      'Render: he',
      'Commit: he',
      'Render: he',
      'Commit: he',
      'Render: hell',
      'Commit: hell',
      'Render: hell',
      'Commit: hell',
      'Render: hello',
      'Commit: hello',
      'Render: hello',
      'Commit: hello',
    ]);
    expect(ReactNoop.getChildren('a')).toEqual([span('hello')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('hello')]);

    // Now do the same thing, except this time expire all the updates
    // before flushing them.
    ReactNoop.renderToRootWithID(<Foo prop="" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="" />, 'b');
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.renderToRootWithID(<Foo prop="go" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="go" />, 'b');
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.renderToRootWithID(<Foo prop="good" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="good" />, 'b');
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.renderToRootWithID(<Foo prop="goodbye" />, 'a');
    ReactNoop.renderToRootWithID(<Foo prop="goodbye" />, 'b');

    ReactNoop.advanceTime(10000);
    jest.advanceTimersByTime(10000);

    // All the updates should render and commit in a single batch.
    expect(ReactNoop.flush()).toEqual([
      'Render: goodbye',
      'Commit: goodbye',
      'Render: goodbye',
      'Commit: goodbye',
    ]);
    expect(ReactNoop.getChildren('a')).toEqual([span('goodbye')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('goodbye')]);
  });
});
