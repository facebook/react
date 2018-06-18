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
let ReactFeatureFlags;
let ReactNoop;

describe('ReactExpiration', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
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

    // Advance time a bit, but not enough to expire the low pri update.
    ReactNoop.expire(4500);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance by another second. Now the update should expire and flush.
    ReactNoop.expire(1000);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span('done')]);
  });

  it('two updates of like priority in the same event always flush within the same batch', () => {
    class Text extends React.Component {
      componentDidMount() {
        ReactNoop.yield(`${this.props.text} [commit]`);
      }
      componentDidUpdate() {
        ReactNoop.yield(`${this.props.text} [commit]`);
      }
      render() {
        ReactNoop.yield(`${this.props.text} [render]`);
        return <span prop={this.props.text} />;
      }
    }

    // First, show what happens for updates in two separate events.
    // Schedule an update.
    ReactNoop.render(<Text text="A" />);
    // Advance the timer and flush any work that expired. Flushing the expired
    // work signals to the renderer that the event has ended.
    ReactNoop.advanceTime(2000);
    // Don't advance time by enough to expire the first update.
    expect(ReactNoop.flushExpired()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([]);
    // Schedule another update.
    ReactNoop.render(<Text text="B" />);
    // The updates should flush in separate batches, since sufficient time
    // passed in between them *and* they occurred in separate events.
    expect(ReactNoop.flush()).toEqual([
      'A [render]',
      'A [commit]',
      'B [render]',
      'B [commit]',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('B')]);

    // Now do the same thing again, except this time don't flush any work in
    // between the two updates.
    ReactNoop.render(<Text text="A" />);
    // Advance the timer, but don't flush the expired work. Because we still
    // haven't entered an idle callback, the scheduler must assume that we're
    // inside the same event.
    ReactNoop.advanceTime(2000);
    expect(ReactNoop.clearYields()).toEqual(null);
    expect(ReactNoop.getChildren()).toEqual([span('B')]);
    // Schedule another update.
    ReactNoop.render(<Text text="B" />);
    // The updates should flush in the same batch, since as far as the scheduler
    // knows, they may have occurred inside the same event.
    expect(ReactNoop.flush()).toEqual(['B [render]', 'B [commit]']);
  });

  it(
    'two updates of like priority in the same event always flush within the ' +
      "same batch, even if there's a sync update in between",
    () => {
      class Text extends React.Component {
        componentDidMount() {
          ReactNoop.yield(`${this.props.text} [commit]`);
        }
        componentDidUpdate() {
          ReactNoop.yield(`${this.props.text} [commit]`);
        }
        render() {
          ReactNoop.yield(`${this.props.text} [render]`);
          return <span prop={this.props.text} />;
        }
      }

      // First, show what happens for updates in two separate events.
      // Schedule an update.
      ReactNoop.render(<Text text="A" />);
      // Advance the timer and flush any work that expired. Flushing the expired
      // work signals to the renderer that the event has ended.
      ReactNoop.advanceTime(2000);
      // Don't advance time by enough to expire the first update.
      expect(ReactNoop.flushExpired()).toEqual([]);
      expect(ReactNoop.getChildren()).toEqual([]);
      // Schedule another update.
      ReactNoop.render(<Text text="B" />);
      // The updates should flush in separate batches, since sufficient time
      // passed in between them *and* they occurred in separate events.
      expect(ReactNoop.flush()).toEqual([
        'A [render]',
        'A [commit]',
        'B [render]',
        'B [commit]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);

      // Now do the same thing again, except this time don't flush any work in
      // between the two updates.
      ReactNoop.render(<Text text="A" />);
      // Advance the timer, but don't flush the expired work. Because we still
      // haven't entered an idle callback, the scheduler must assume that we're
      // inside the same event.
      ReactNoop.advanceTime(2000);
      expect(ReactNoop.clearYields()).toEqual(null);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);

      // Perform some synchronous work. Again, the scheduler must assume we're
      // inside the same event.
      ReactNoop.flushSync(() => {
        ReactNoop.renderToRootWithID('1', 'second-root');
      });

      // Even though React flushed a sync update, it should not have updated the
      // current time. Schedule another update.
      ReactNoop.render(<Text text="B" />);
      // The updates should flush in the same batch, since as far as the scheduler
      // knows, they may have occurred inside the same event.
      expect(ReactNoop.flush()).toEqual(['B [render]', 'B [commit]']);
    },
  );
});
