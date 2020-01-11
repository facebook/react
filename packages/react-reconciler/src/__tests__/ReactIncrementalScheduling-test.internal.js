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
let Scheduler;

describe('ReactIncrementalScheduling', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  it('schedules and flushes deferred work', () => {
    ReactNoop.render(<span prop="1" />);
    expect(ReactNoop.getChildren()).toEqual([]);

    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<span prop="1" />);
  });

  it('searches for work on other roots once the current root completes', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');

    expect(Scheduler).toFlushWithoutYielding();

    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
  });

  it('schedules top-level updates in order of priority', () => {
    // Initial render.
    ReactNoop.render(<span prop={1} />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<span prop={1} />);

    ReactNoop.batchedUpdates(() => {
      ReactNoop.render(<span prop={5} />);
      ReactNoop.flushSync(() => {
        ReactNoop.render(<span prop={2} />);
        ReactNoop.render(<span prop={3} />);
        ReactNoop.render(<span prop={4} />);
      });
    });
    // The sync updates flush first.
    expect(ReactNoop).toMatchRenderedOutput(<span prop={4} />);

    // The terminal value should be the last update that was scheduled,
    // regardless of priority. In this case, that's the last sync update.
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<span prop={4} />);
  });

  it('schedules top-level updates with same priority in order of insertion', () => {
    // Initial render.
    ReactNoop.render(<span prop={1} />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<span prop={1} />);

    ReactNoop.render(<span prop={2} />);
    ReactNoop.render(<span prop={3} />);
    ReactNoop.render(<span prop={4} />);
    ReactNoop.render(<span prop={5} />);

    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<span prop={5} />);
  });

  it('works on deferred roots in the order they were scheduled', () => {
    const {useEffect} = React;
    function Text({text}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue(text);
      }, [text]);
      return text;
    }

    ReactNoop.act(() => {
      ReactNoop.renderToRootWithID(<Text text="a:1" />, 'a');
      ReactNoop.renderToRootWithID(<Text text="b:1" />, 'b');
      ReactNoop.renderToRootWithID(<Text text="c:1" />, 'c');
    });
    expect(Scheduler).toHaveYielded(['a:1', 'b:1', 'c:1']);

    expect(ReactNoop.getChildrenAsJSX('a')).toEqual('a:1');
    expect(ReactNoop.getChildrenAsJSX('b')).toEqual('b:1');
    expect(ReactNoop.getChildrenAsJSX('c')).toEqual('c:1');

    // Schedule deferred work in the reverse order
    ReactNoop.act(() => {
      ReactNoop.renderToRootWithID(<Text text="c:2" />, 'c');
      ReactNoop.renderToRootWithID(<Text text="b:2" />, 'b');
      // Ensure it starts in the order it was scheduled
      expect(Scheduler).toFlushAndYieldThrough(['c:2']);

      expect(ReactNoop.getChildrenAsJSX('a')).toEqual('a:1');
      expect(ReactNoop.getChildrenAsJSX('b')).toEqual('b:1');
      expect(ReactNoop.getChildrenAsJSX('c')).toEqual('c:2');
      // Schedule last bit of work, it will get processed the last

      ReactNoop.renderToRootWithID(<Text text="a:2" />, 'a');

      // Keep performing work in the order it was scheduled
      expect(Scheduler).toFlushAndYieldThrough(['b:2']);
      expect(ReactNoop.getChildrenAsJSX('a')).toEqual('a:1');
      expect(ReactNoop.getChildrenAsJSX('b')).toEqual('b:2');
      expect(ReactNoop.getChildrenAsJSX('c')).toEqual('c:2');

      expect(Scheduler).toFlushAndYieldThrough(['a:2']);
      expect(ReactNoop.getChildrenAsJSX('a')).toEqual('a:2');
      expect(ReactNoop.getChildrenAsJSX('b')).toEqual('b:2');
      expect(ReactNoop.getChildrenAsJSX('c')).toEqual('c:2');
    });
  });

  it('schedules sync updates when inside componentDidMount/Update', () => {
    let instance;

    class Foo extends React.Component {
      state = {tick: 0};

      componentDidMount() {
        Scheduler.unstable_yieldValue(
          'componentDidMount (before setState): ' + this.state.tick,
        );
        this.setState({tick: 1});
        // We're in a batch. Update hasn't flushed yet.
        Scheduler.unstable_yieldValue(
          'componentDidMount (after setState): ' + this.state.tick,
        );
      }

      componentDidUpdate() {
        Scheduler.unstable_yieldValue('componentDidUpdate: ' + this.state.tick);
        if (this.state.tick === 2) {
          Scheduler.unstable_yieldValue(
            'componentDidUpdate (before setState): ' + this.state.tick,
          );
          this.setState({tick: 3});
          Scheduler.unstable_yieldValue(
            'componentDidUpdate (after setState): ' + this.state.tick,
          );
          // We're in a batch. Update hasn't flushed yet.
        }
      }

      render() {
        Scheduler.unstable_yieldValue('render: ' + this.state.tick);
        instance = this;
        return <span prop={this.state.tick} />;
      }
    }

    ReactNoop.render(<Foo />);
    // Render without committing
    expect(Scheduler).toFlushAndYieldThrough(['render: 0']);

    // Do one more unit of work to commit
    expect(ReactNoop.flushNextYield()).toEqual([
      'componentDidMount (before setState): 0',
      'componentDidMount (after setState): 0',
      // If the setState inside componentDidMount were deferred, there would be
      // no more ops. Because it has Task priority, we get these ops, too:
      'render: 1',
      'componentDidUpdate: 1',
    ]);

    instance.setState({tick: 2});
    expect(Scheduler).toFlushAndYieldThrough(['render: 2']);
    expect(ReactNoop.flushNextYield()).toEqual([
      'componentDidUpdate: 2',
      'componentDidUpdate (before setState): 2',
      'componentDidUpdate (after setState): 2',
      // If the setState inside componentDidUpdate were deferred, there would be
      // no more ops. Because it has Task priority, we get these ops, too:
      'render: 3',
      'componentDidUpdate: 3',
    ]);
  });

  it('can opt-in to async scheduling inside componentDidMount/Update', () => {
    let instance;
    class Foo extends React.Component {
      state = {tick: 0};

      componentDidMount() {
        ReactNoop.deferredUpdates(() => {
          Scheduler.unstable_yieldValue(
            'componentDidMount (before setState): ' + this.state.tick,
          );
          this.setState({tick: 1});
          Scheduler.unstable_yieldValue(
            'componentDidMount (after setState): ' + this.state.tick,
          );
        });
      }

      componentDidUpdate() {
        ReactNoop.deferredUpdates(() => {
          Scheduler.unstable_yieldValue(
            'componentDidUpdate: ' + this.state.tick,
          );
          if (this.state.tick === 2) {
            Scheduler.unstable_yieldValue(
              'componentDidUpdate (before setState): ' + this.state.tick,
            );
            this.setState({tick: 3});
            Scheduler.unstable_yieldValue(
              'componentDidUpdate (after setState): ' + this.state.tick,
            );
          }
        });
      }

      render() {
        Scheduler.unstable_yieldValue('render: ' + this.state.tick);
        instance = this;
        return <span prop={this.state.tick} />;
      }
    }

    ReactNoop.flushSync(() => {
      ReactNoop.render(<Foo />);
    });
    // The cDM update should not have flushed yet because it has async priority.
    expect(Scheduler).toHaveYielded([
      'render: 0',
      'componentDidMount (before setState): 0',
      'componentDidMount (after setState): 0',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(<span prop={0} />);

    // Now flush the cDM update.
    expect(Scheduler).toFlushAndYield(['render: 1', 'componentDidUpdate: 1']);
    expect(ReactNoop).toMatchRenderedOutput(<span prop={1} />);

    // Increment the tick to 2. This will trigger an update inside cDU. Flush
    // the first update without flushing the second one.
    instance.setState({tick: 2});
    expect(Scheduler).toFlushAndYieldThrough([
      'render: 2',
      'componentDidUpdate: 2',
      'componentDidUpdate (before setState): 2',
      'componentDidUpdate (after setState): 2',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(<span prop={2} />);

    // Now flush the cDU update.
    expect(Scheduler).toFlushAndYield(['render: 3', 'componentDidUpdate: 3']);
    expect(ReactNoop).toMatchRenderedOutput(<span prop={3} />);
  });

  it('performs Task work even after time runs out', () => {
    class Foo extends React.Component {
      state = {step: 1};
      componentDidMount() {
        this.setState({step: 2}, () => {
          this.setState({step: 3}, () => {
            this.setState({step: 4}, () => {
              this.setState({step: 5});
            });
          });
        });
      }
      render() {
        Scheduler.unstable_yieldValue('Foo');
        return <span prop={this.state.step} />;
      }
    }
    ReactNoop.render(<Foo />);
    // This should be just enough to complete all the work, but not enough to
    // commit it.
    expect(Scheduler).toFlushAndYieldThrough(['Foo']);
    expect(ReactNoop).toMatchRenderedOutput(null);

    // Do one more unit of work.
    ReactNoop.flushNextYield();
    // The updates should all be flushed with Task priority
    expect(ReactNoop).toMatchRenderedOutput(<span prop={5} />);
  });

  it('can opt-out of batching using unbatchedUpdates', () => {
    ReactNoop.flushSync(() => {
      ReactNoop.render(<span prop={0} />);
      expect(ReactNoop.getChildren()).toEqual([]);
      // Should not have flushed yet because we're still batching

      // unbatchedUpdates reverses the effect of batchedUpdates, so sync
      // updates are not batched
      ReactNoop.unbatchedUpdates(() => {
        ReactNoop.render(<span prop={1} />);
        expect(ReactNoop).toMatchRenderedOutput(<span prop={1} />);
        ReactNoop.render(<span prop={2} />);
        expect(ReactNoop).toMatchRenderedOutput(<span prop={2} />);
      });

      ReactNoop.render(<span prop={3} />);
      expect(ReactNoop).toMatchRenderedOutput(<span prop={2} />);
    });
    // Remaining update is now flushed
    expect(ReactNoop).toMatchRenderedOutput(<span prop={3} />);
  });

  it('nested updates are always deferred, even inside unbatchedUpdates', () => {
    let instance;
    let ops = [];
    class Foo extends React.Component {
      state = {step: 0};
      componentDidUpdate() {
        ops.push('componentDidUpdate: ' + this.state.step);
        if (this.state.step === 1) {
          ReactNoop.unbatchedUpdates(() => {
            // This is a nested state update, so it should not be
            // flushed synchronously, even though we wrapped it
            // in unbatchedUpdates.
            this.setState({step: 2});
          });
          expect(ReactNoop).toMatchRenderedOutput(<span prop={1} />);
        }
      }
      render() {
        ops.push('render: ' + this.state.step);
        instance = this;
        return <span prop={this.state.step} />;
      }
    }
    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop).toMatchRenderedOutput(<span prop={0} />);

    ReactNoop.flushSync(() => {
      instance.setState({step: 1});
    });
    expect(ReactNoop).toMatchRenderedOutput(<span prop={2} />);

    expect(ops).toEqual([
      'render: 0',
      'render: 1',
      'componentDidUpdate: 1',
      'render: 2',
      'componentDidUpdate: 2',
    ]);
  });
});
