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

describe('ReactIncrementalUpdates', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function div(...children) {
    children = children.map(c => typeof c === 'string' ? { text: c } : c);
    return { type: 'div', children, prop: undefined };
  }

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('applies updates in order of priority', () => {
    let state;
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        ReactNoop.performAnimationWork(() => {
          //  Has Animation priority
          this.setState({ b: 'b' });
          this.setState({ c: 'c' });
        });
        // Has Task priority
        this.setState({ a: 'a' });
      }
      render() {
        state = this.state;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(Object.keys(state)).toEqual(['a', 'b', 'c']);
  });

  it('applies updates with equal priority in insertion order', () => {
    let state;
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        // All have Task priority
        this.setState({ a: 'a' });
        this.setState({ b: 'b' });
        this.setState({ c: 'c' });
      }
      render() {
        state = this.state;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(Object.keys(state)).toEqual(['a', 'b', 'c']);
  });

  it('only drops updates with equal or lesser priority when replaceState is called', () => {
    let instance;
    const Foo = React.createClass({
      getInitialState() {
        return {};
      },
      render() {
        instance = this;
        return (
          <span prop={Object.keys(this.state).join('')} />
        );
      },
    });

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    instance.setState({ x: 'x' });
    instance.setState({ y: 'y' });
    ReactNoop.performAnimationWork(() => {
      instance.setState({ a: 'a' });
      instance.setState({ b: 'b' });
    });
    instance.replaceState({ c: 'c' });
    instance.setState({ d: 'd' });

    ReactNoop.flushAnimationPri();
    // Even though a replaceState has been already scheduled, it hasn't been
    // flushed yet because it has low priority.
    expect(ReactNoop.getChildren()).toEqual([span('ab')]);

    ReactNoop.flush();
    // Now the rest of the updates are flushed.
    expect(ReactNoop.getChildren()).toEqual([span('cd')]);
  });

  it('can abort an update, schedule additional updates, and resume', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        instance = this;
        return (
          <span prop={Object.keys(this.state).join('')} />
        );
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    let progressedUpdates = [];
    function createUpdate(letter) {
      return () => {
        progressedUpdates.push(letter);
        return {
          [letter]: letter,
        };
      };
    }

    instance.setState(createUpdate('a'));
    instance.setState(createUpdate('b'));
    instance.setState(createUpdate('c'));

    // Do just enough work to begin the update but not enough to flush it
    ReactNoop.flushDeferredPri(20);
    expect(ReactNoop.getChildren()).toEqual([span('')]);
    expect(progressedUpdates).toEqual(['a', 'b', 'c']);

    instance.setState(createUpdate('f'));
    ReactNoop.performAnimationWork(() => {
      instance.setState(createUpdate('d'));
      instance.setState(createUpdate('e'));
    });
    instance.setState(createUpdate('g'));

    // Updates a, b, and c were aborted, so they should be applied first even
    // though they have low priority. Update f was scheduled after the render
    // was aborted, so it should come after d and e, which have higher priority.
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('abcdefg')]);
    expect(progressedUpdates).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('can abort an update, schedule a replaceState, and resume', () => {
    let instance;
    const Foo = React.createClass({
      getInitialState() {
        return {};
      },
      render() {
        instance = this;
        return (
          <span prop={Object.keys(this.state).join('')} />
        );
      },
    });

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    let progressedUpdates = [];
    function createUpdate(letter) {
      return () => {
        progressedUpdates.push(letter);
        return {
          [letter]: letter,
        };
      };
    }

    instance.setState(createUpdate('a'));
    instance.setState(createUpdate('b'));
    instance.setState(createUpdate('c'));

    // Do just enough work to begin the update but not enough to flush it
    ReactNoop.flushDeferredPri(20);
    expect(ReactNoop.getChildren()).toEqual([span('')]);
    expect(progressedUpdates).toEqual(['a', 'b', 'c']);

    progressedUpdates = [];

    instance.setState(createUpdate('f'));
    ReactNoop.performAnimationWork(() => {
      instance.setState(createUpdate('d'));
      instance.replaceState(createUpdate('e'));
    });
    instance.setState(createUpdate('g'));

    // Updates a, b, and c were aborted, so they should be applied first even
    // though they have low priority. Update f was scheduled after the render
    // was aborted, so it should come after d and e, which have higher priority.
    // Because e is a replaceState, d gets dropped.
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('efg')]);
    // Ensure that updater function d is never called.
    expect(progressedUpdates).toEqual(['e', 'f', 'g']);
  });

  it('does not call callbacks that are scheduled by another callback until a later commit', () => {
    let ops = [];
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        ops.push('did mount');
        this.setState({ a: 'a' }, () => {
          ops.push('callback a');
          this.setState({ b: 'b' }, () => {
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
});
