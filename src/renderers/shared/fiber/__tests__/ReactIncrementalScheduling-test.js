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

describe('ReactIncrementalScheduling', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('schedules and flushes deferred work', () => {
    ReactNoop.render(<span prop="1" />);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren()).toEqual([span('1')]);
  });

  it('schedules and flushes animation work', () => {
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="1" />);
    });
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren()).toEqual([span('1')]);
  });

  it('searches for work on other roots once the current root completes', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');

    ReactNoop.flush();

    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
  });

  it('schedules an animation callback when there`\s leftover animation work', () => {
    class Foo extends React.Component {
      state = { step: 0 };
      componentDidMount() {
        ReactNoop.performAnimationWork(() => {
          this.setState({ step: 2 });
        });
        this.setState({ step: 1 });
      }
      render() {
        return <span prop={this.state.step} />;
      }
    }

    ReactNoop.render(<Foo />);
    // Flush just enough work to mount the component, but not enough to flush
    // the animation update.
    ReactNoop.flushDeferredPri(25);
    expect(ReactNoop.getChildren()).toEqual([span(1)]);

    // There's more animation work. A callback should have been scheduled.
    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren()).toEqual([span(2)]);
  });

  it('schedules top-level updates in order of priority', () => {
    // Initial render.
    ReactNoop.render(<span prop={1} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(1)]);

    ReactNoop.render(<span prop={5} />);
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop={2} />);
      ReactNoop.render(<span prop={3} />);
      ReactNoop.render(<span prop={4} />);
    });

    // The low pri update should be flushed last, even though it was scheduled
    // before the animation updates.
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(5)]);
  });

  it('schedules top-level updates with same priority in order of insertion', () => {
    // Initial render.
    ReactNoop.render(<span prop={1} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(1)]);

    ReactNoop.render(<span prop={2} />);
    ReactNoop.render(<span prop={3} />);
    ReactNoop.render(<span prop={4} />);
    ReactNoop.render(<span prop={5} />);

    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span(5)]);
  });

  it('works on deferred roots in the order they were scheduled', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    ReactNoop.flush();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);

    // Schedule deferred work in the reverse order
    ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    // Ensure it starts in the order it was scheduled
    ReactNoop.flushDeferredPri(15 + 5);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    // Schedule last bit of work, it will get processed the last
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    // Keep performing work in the order it was scheduled
    ReactNoop.flushDeferredPri(15 + 5);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    ReactNoop.flushDeferredPri(15 + 5);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  it('schedules sync updates when inside componentDidMount/Update', () => {
    var instance;
    var ops = [];

    class Foo extends React.Component {
      state = { tick: 0 };

      componentDidMount() {
        ops.push('componentDidMount (before setState): ' + this.state.tick);
        this.setState({ tick: 1 });
        // We're in a batch. Update hasn't flushed yet.
        ops.push('componentDidMount (after setState): ' + this.state.tick);
      }

      componentDidUpdate() {
        ops.push('componentDidUpdate: ' + this.state.tick);
        if (this.state.tick === 2) {
          ops.push('componentDidUpdate (before setState): ' + this.state.tick);
          this.setState({ tick: 3 });
          ops.push('componentDidUpdate (after setState): ' + this.state.tick);
          // We're in a batch. Update hasn't flushed yet.
        }
      }

      render() {
        ops.push('render: ' + this.state.tick);
        instance = this;
        return <span prop={this.state.tick} />;
      }
    }

    ReactNoop.render(<Foo />);

    ReactNoop.flushDeferredPri(20 + 5);
    expect(ops).toEqual([
      'render: 0',
      'componentDidMount (before setState): 0',
      'componentDidMount (after setState): 0',
      // If the setState inside componentDidMount were deferred, there would be
      // no more ops. Because it has Task priority, we get these ops, too:
      'render: 1',
      'componentDidUpdate: 1',
    ]);

    ops = [];
    instance.setState({ tick: 2 });
    ReactNoop.flushDeferredPri(20 + 5);

    expect(ops).toEqual([
      'render: 2',
      'componentDidUpdate: 2',
      'componentDidUpdate (before setState): 2',
      'componentDidUpdate (after setState): 2',
      // If the setState inside componentDidUpdate were deferred, there would be
      // no more ops. Because it has Task priority, we get these ops, too:
      'render: 3',
      'componentDidUpdate: 3',
    ]);
  });

  it('can opt-in to deferred/animation scheduling inside componentDidMount/Update', () => {
    var instance;
    var ops = [];

    class Foo extends React.Component {
      state = { tick: 0 };

      componentDidMount() {
        ReactNoop.performAnimationWork(() => {
          ops.push('componentDidMount (before setState): ' + this.state.tick);
          this.setState({ tick: 1 });
          ops.push('componentDidMount (after setState): ' + this.state.tick);
        });
      }

      componentDidUpdate() {
        ReactNoop.performAnimationWork(() => {
          ops.push('componentDidUpdate: ' + this.state.tick);
          if (this.state.tick === 2) {
            ops.push('componentDidUpdate (before setState): ' + this.state.tick);
            this.setState({ tick: 3 });
            ops.push('componentDidUpdate (after setState): ' + this.state.tick);
          }
        });
      }

      render() {
        ops.push('render: ' + this.state.tick);
        instance = this;
        return <span prop={this.state.tick} />;
      }
    }

    ReactNoop.render(<Foo />);

    ReactNoop.flushDeferredPri(20 + 5);
    expect(ops).toEqual([
      'render: 0',
      'componentDidMount (before setState): 0',
      'componentDidMount (after setState): 0',
      // Following items shouldn't appear because they are the result of an
      // update scheduled with animation priority
      // 'render: 1',
      // 'componentDidUpdate: 1',
    ]);

    ops = [];

    ReactNoop.flushAnimationPri();
    expect(ops).toEqual([
      'render: 1',
      'componentDidUpdate: 1',
    ]);

    ops = [];
    instance.setState({ tick: 2 });
    ReactNoop.flushDeferredPri(20 + 5);

    expect(ops).toEqual([
      'render: 2',
      'componentDidUpdate: 2',
      'componentDidUpdate (before setState): 2',
      'componentDidUpdate (after setState): 2',
      // Following items shouldn't appear because they are the result of an
      // update scheduled with animation priority
      // 'render: 3',
      // 'componentDidUpdate: 3',
    ]);

    ops = [];

    ReactNoop.flushAnimationPri();
    expect(ops).toEqual([
      'render: 3',
      'componentDidUpdate: 3',
    ]);
  });

  it('performs Task work even after time runs out', () => {
    class Foo extends React.Component {
      state = { step: 1 };
      componentDidMount() {
        this.setState({ step: 2 }, () => {
          this.setState({ step: 3 }, () => {
            this.setState({ step: 4 }, () => {
              this.setState({ step: 5 });
            });
          });
        });
      }
      render() {
        return <span prop={this.state.step} />;
      }
    }
    ReactNoop.render(<Foo />);
    // This should be just enough to complete all the work, but not enough to
    // commit it.
    ReactNoop.flushDeferredPri(20);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Do one more unit of work.
    ReactNoop.flushDeferredPri(10);
    // The updates should all be flushed with Task priority
    expect(ReactNoop.getChildren()).toEqual([span(5)]);
  });

  it('does not perform animation work after time runs out', () => {
    class Foo extends React.Component {
      state = { step: 1 };
      componentDidMount() {
        ReactNoop.performAnimationWork(() => {
          this.setState({ step: 2 }, () => {
            this.setState({ step: 3 }, () => {
              this.setState({ step: 4 }, () => {
                this.setState({ step: 5 });
              });
            });
          });
        });
      }
      render() {
        return <span prop={this.state.step} />;
      }
    }
    ReactNoop.render(<Foo />);
    // This should be just enough to complete all the work, but not enough to
    // commit it.
    ReactNoop.flushDeferredPri(20);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Do one more unit of work.
    ReactNoop.flushDeferredPri(10);
    // None of the updates should be flushed because they only have
    // animation priority.
    expect(ReactNoop.getChildren()).toEqual([span(1)]);
  });
});
