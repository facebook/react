/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var React;
var ReactNoop;

describe('ReactExpiration', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('increases priority of updates as time progresses', () => {
    ReactNoop.render(<span prop="done" />);

    expect(ReactNoop.getChildren()).toEqual([]);

    // Nothing has expired yet because time hasn't advanced.
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance by 300ms, not enough to expire the low pri update.
    ReactNoop.expire(300);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance by another second. Now the update should expire and flush.
    ReactNoop.expire(1000);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span('done')]);
  });

  it('coalesces updates to the same component', () => {
    const foos = [];
    class Foo extends React.Component {
      constructor() {
        super();
        this.state = {step: 0};
        foos.push(this);
      }
      render() {
        return <span prop={this.state.step} />;
      }
    }

    ReactNoop.render([<Foo key="A" />, <Foo key="B" />]);
    ReactNoop.flush();
    const [a, b] = foos;

    a.setState({step: 1});

    // Advance time by 500ms.
    ReactNoop.expire(500);

    // Update A again. This update should coalesce with the previous update.
    a.setState({step: 2});
    // Update B. This is the first update, so it has nothing to coalesce with.
    b.setState({step: 1});

    // Advance time. This should be enough to flush both updates to A, but not
    // the update to B. If only the first update to A flushes, but not the
    // second, then it wasn't coalesced properly.
    ReactNoop.expire(600);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span(2), span(0)]);

    // Now expire the update to B.
    ReactNoop.expire(500);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span(2), span(1)]);
  });

  it('stops coalescing after a certain threshold', () => {
    let instance;
    class Foo extends React.Component {
      state = {step: 0};
      render() {
        instance = this;
        return <span prop={this.state.step} />;
      }
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

    instance.setState({step: 1});

    // Advance time by 500 ms.
    ReactNoop.expire(500);

    // Update again. This update should coalesce with the previous update.
    instance.setState({step: 2});

    // Advance time by 480ms. Not enough to expire the updates.
    ReactNoop.expire(480);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span(0)]);

    // Update again. This update should NOT be coalesced, because the
    // previous updates have almost expired.
    instance.setState({step: 3});

    // Advance time. This should expire the first two updates,
    // but not the third.
    ReactNoop.expire(500);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span(2)]);

    // Now expire the remaining update.
    ReactNoop.expire(1000);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span(3)]);
  });
});
