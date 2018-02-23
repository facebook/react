/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

'use strict';

let React;
let Fragment;
let ReactNoop;
let ReactFeatureFlags;

describe('ReactExpiration', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    Fragment = React.Fragment;
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

    // Advance time a bit, but not enough to expire the low pri update.
    ReactNoop.expire(4500);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance by another second. Now the update should expire and flush.
    ReactNoop.expire(1000);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span('done')]);
  });

  it('coalesces updates to the same component', () => {
    class Foo extends React.Component {
      state = {step: 0};
      componentDidUpdate() {
        ReactNoop.yield(`Did update ${this.props.label}: ${this.state.step}`);
      }
      render() {
        ReactNoop.yield(`Render ${this.props.label}: ${this.state.step}`);
        return <span prop={`${this.props.label}: ${this.state.step}`} />;
      }
    }

    let a = React.createRef();
    let b = React.createRef();
    ReactNoop.render(
      <Fragment>
        <Foo ref={a} label="A" />
        <Foo ref={b} label="B" />
      </Fragment>,
    );
    ReactNoop.flush();

    a.value.setState({step: 1});

    // Advance time to move into a new expiration bucket
    ReactNoop.expire(2000);

    // Update A again. This update should coalesce with the previous update.
    a.value.setState({step: 2});
    // Update B. This is the first update, so it has nothing to coalesce with.
    b.value.setState({step: 2});

    // Advance time by enough to expire step 1, but not step 2.
    ReactNoop.expire(4000);
    expect(ReactNoop.flushExpired()).toEqual([
      // Even though we called setState on A twice, both updates should flush in
      // a single batch.
      'Render A: 2',
      'Did update A: 2',
      // Update B has not expired yet, even though its setState was scheduled
      // at the same time as A
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('A: 2'), span('B: 0')]);

    // Now expire B, too.
    ReactNoop.expire(2000);
    expect(ReactNoop.flushExpired()).toEqual([
      'Render B: 2',
      'Did update B: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('A: 2'), span('B: 2')]);
  });
});
