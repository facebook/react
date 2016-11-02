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
    jest.resetModuleRegistry();
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('schedules and flushes animation work', () => {
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="1" />);
    });
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren()).toEqual([span('1')]);
  });

  it('schedules and flushes animation work for many roots', () => {
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
      ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
      ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    });
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
  });

  it('flushes all scheduled animation work', () => {
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="1" />);
    });
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="2" />);
    });
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren()).toEqual([span('2')]);
  });

  it('flushes all scheduled animation work for many roots', () => {
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
      ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
      ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    });
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
      ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
      ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    });
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  it('schedules and flushes deferred work', () => {
    ReactNoop.render(<span prop="1" />);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren()).toEqual([span('1')]);
  });

  it('schedules and flushes deferred work for many roots', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
  });

  it('flushes scheduled deferred work fitting within deadline', () => {
    ReactNoop.render(<span prop="1" />);
    ReactNoop.render(<span prop="2" />);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren()).toEqual([span('2')]);
  });

  it('flushes scheduled deferred work fitting within deadline for many roots', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  it('schedules more deferred work if it runs out of time', () => {
    ReactNoop.render(<span prop="1" />);
    ReactNoop.render(<span prop="2" />);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushDeferredPri(5);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushDeferredPri(10);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.flushDeferredPri(10);
    expect(ReactNoop.getChildren()).toEqual([span('2')]);
  });

  it('schedules more deferred work if it runs out of time with many roots', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  it('FIXME: flushes late animation work in a deferred callback if it wins', () => {
    // Schedule early deferred
    ReactNoop.render(<span prop="1" />);
    // Schedule late animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="2" />);
    });

    // FIXME: I would expect true here because we should have scheduled an animation callback:
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([]);

    // We only scheduled deferred callback so that's what we get.
    // It will flush everything.
    ReactNoop.flushDeferredPri();
    // TODO: I would expect true here because we should have tried to schedule animation sooner:
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([span('2')]);
  });

  it('FIXME: flushes late animation work in a deferred callback if it wins with many roots', () => {
    // Schedule early deferred
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    // Schedule late animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
      ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    });

    // FIXME: I would expect true here because we should have scheduled an animation callback:
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // We only scheduled deferred callback so that's what we get.
    // It will flush everything.
    ReactNoop.flushDeferredPri();
    // TODO: I would expect true here because we tried to schedule animation sooner, and so it would still be scheduled:
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  // This test documents the existing behavior. Desired behavior:
  // it('flushes late animation work in an animation callback if it wins', () => {
  it('FIXME: ignores late animation work in an animation callback if it wins', () => {
    // Schedule early deferred
    ReactNoop.render(<span prop="1" />);
    // Schedule late animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="2" />);
    });

    // FIXME: I would expect true here because we should have scheduled an animation callback:
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flushing animation should have flushed the animation.
    // FIXME: But it currently doesn't.
    // Technically we didn't schedule this callback. This test is valid because we should have scheduled it.
    ReactNoop.flushAnimationPri();
    // TODO: I would expect [span('2')] here because it was scheduled as animation:
    // expect(ReactNoop.getChildren()).toEqual([span('2')]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // TODO: I wouldn't expect this flush to be necessary for animation work to kick in.
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren()).toEqual([span('2')]);
  });

  // This test documents the existing behavior. Desired behavior:
  // it('flushes late animation work in an animation callback if it wins with many roots', () => {
  it('FIXME: ignores late animation work in an animation callback if it wins with many roots', () => {
    // Schedule early deferred
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    // Schedule late animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
      ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    });

    // FIXME: I would expect true here because we should have scheduled an animation callback:
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // Flushing animation should have flushed the animation.
    // FIXME: But it currently doesn't.
    // Technically we didn't schedule this callback. This test is valid because we should have scheduled it.
    ReactNoop.flushAnimationPri();
    // TODO: I would expect this here because they were scheduled as animation:
    // expect(ReactNoop.getChildren('a')).toEqual([]);
    // expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    // expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // TODO: I wouldn't expect this flush to be necessary for animation work to kick in.
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  // This test documents the existing behavior. Desired behavior:
  // it('flushes all work in a deferred callback if it wins', () => {
  it('FIXME: ignores all work in a deferred callback if it wins', () => {
    // Schedule early animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="1" />);
    });
    // Schedule late deferred
    ReactNoop.render(<span prop="2" />);
    // We could also make this true because we know we have a deferred update coming.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flushing deferred should have flushed both early animation and late deferred work that invalidated it.
    // This is not a common case, as animation should generally be flushed before deferred work.
    // FIXME: Instead, it currently doesn't do anything.
    // TODO: is this even a valid test? Technically we didn't schedule this callback.
    ReactNoop.flushDeferredPri();
    // TODO: I would expect [span('2')] here because we should have flushed everything by now:
    // expect(ReactNoop.getChildren()).toEqual([span('2')]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flushing animation should have been a no-op
    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren()).toEqual([span('2')]);
  });

  // This test documents the existing behavior. Desired behavior:
  // it('flushes all work in a deferred callback if it wins with many roots', () => {
  it('FIXME: ignores all work in a deferred callback if it wins with many roots', () => {
    // Schedule early animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
      ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    });
    // Schedule late deferred
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    // We could also make this true because we know we have a deferred update coming.
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // Flushing deferred should have flushed both early animation and late deferred work that invalidated it.
    // This is not a common case, as animation should generally be flushed before deferred work.
    // FIXME: Instead, it currently doesn't do anything.
    // TODO: is this even a valid test? Technically we didn't schedule this callback.
    ReactNoop.flushDeferredPri();
    // TODO: I would expect this here because we should have flushed everything:
    // expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    // expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    // expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // Flushing animation should have been a no-op.
    ReactNoop.flushAnimationPri();
    // FIXME: this deferred work should have been handled earlier.
    // expect(ReactNoop.hasScheduledDeferredCallback()).toBe(false);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    // FIXME: this deferred work should have been handled earlier.
    // expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // FIXME: it should be unnecessary to flush one more time:
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  it('flushes root with late deferred work in an animation callback if it wins', () => {
    // Schedule early animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.render(<span prop="1" />);
    });
    // Schedule late deferred
    ReactNoop.render(<span prop="2" />);
    // We don't need a deferred callback because the root already has animation work
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flushing animation work flushes everything on this root.
    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren()).toEqual([span('2')]);
  });

  it('flushes all roots with animation work in an animation callback if it wins', () => {
    // Schedule early animation
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
      ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    });
    // Schedule late deferred
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    // TODO: I would expect this to be true because we know we have a deferred update coming.
    expect(ReactNoop.getChildren('a')).toEqual([]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // Flushing animation work flushes all roots with animation work.
    ReactNoop.flushAnimationPri();
    // Now we know we also need a deferred update. Should we have scheduled it earlier?
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);

    // Flushing deferred work flushes the root with only deferred work.
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  it('splits deferred work on multiple roots', () => {
    // Schedule one root
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);

    // Schedule two roots
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    // First scheduled one gets processed first
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual(null);
    // Then the second one gets processed
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual(null);

    // Schedule three roots
    ReactNoop.renderToRootWithID(<span prop="a:3" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:3" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:3" />, 'c');
    // They get processed in the order they were scheduled
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:3')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:3')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:3')]);

    // Schedule one root many times
    ReactNoop.renderToRootWithID(<span prop="a:4" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="a:5" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="a:6" />, 'a');
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:6')]);
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
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    // Schedule last bit of work, it will get processed the last
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    // Keep performing work in the order it was scheduled
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });

  it('handles interleaved deferred and animation work', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    ReactNoop.flush();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);

    // Schedule both deferred and animation work
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
      ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    });
    // We're flushing deferred work
    // Still, roots with animation work are handled first
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);

    // More deferred and animation work just got scheduled!
    ReactNoop.renderToRootWithID(<span prop="c:3" />, 'c');
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="b:3" />, 'b');
    });
    // Animation is still handled first
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:3')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);

    // Finally we handle deferred root in the order it was scheduled
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:3')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:3')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:3')]);
  });

  it('performs animation work in animation callback', () => {
    class Foo extends React.Component {
      componentDidMount() {
        // Animation work that will get performed during animation callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        });
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule animation work
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<Foo />, 'a');
    });

    // Flushing animation work should flush animation work scheduled inside it
    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('schedules deferred work in animation callback', () => {
    class Foo extends React.Component {
      componentDidMount() {
        // Deferred work that will get scheduled during animation callback
        ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule animation work
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<Foo />, 'a');
    });

    // Flushing animation work should not flush the deferred work
    ReactNoop.flushAnimationPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);

    // Flush the deferred work
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('schedules deferred work and performs animation work in animation callback', () => {
    let hasScheduled = false;
    class Foo extends React.Component {
      componentDidMount() {
        // Deferred work that will get scheduled during animation callback
        ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        // Animation work that will get performed during animation callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
        });
        // Deferred work that will get scheduled during animation callback
        ReactNoop.renderToRootWithID(<span prop="d:1" />, 'd');
        hasScheduled = true;
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule animation work
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<Foo />, 'a');
    });

    // Flushing animation work should flush animation work scheduled inside it
    ReactNoop.flushAnimationPri();
    expect(hasScheduled).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    expect(ReactNoop.getChildren('d')).toEqual([]);

    // Flush the deferred work
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:1')]);
  });

  it('performs animation work and schedules deferred work in animation callback', () => {
    let hasScheduled = false;
    class Foo extends React.Component {
      componentDidMount() {
        // Animation work that will get performed during animation callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        });
        // Deferred work that will get scheduled during animation callback
        ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
        // Animation work that will get performed during animation callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="d:1" />, 'd');
        });
        hasScheduled = true;
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule animation work
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<Foo />, 'a');
    });

    // Flushing animation work should flush animation work scheduled inside it
    ReactNoop.flushAnimationPri();
    expect(hasScheduled).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:1')]);

    // Flush the deferred work
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:1')]);
  });

  it('performs deferred work in deferred callback if it has time', () => {
    class Foo extends React.Component {
      componentDidMount() {
        // Deferred work that will get performed during deferred callback
        ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flushing deferred work should flush deferred work scheduled inside it
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('schedules deferred work in deferred callback if it runs out of time', () => {
    let hasScheduled = false;
    class Foo extends React.Component {
      componentDidMount() {
        // Deferred work that will get scheduled during deferred callback
        ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        hasScheduled = true;
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flush just enough deferred work to schedule more deferred work
    ReactNoop.flushDeferredPri(20);
    expect(hasScheduled).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);

    // Flush the rest of the deferred work
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('performs animated work in deferred callback if it has time', () => {
    class Foo extends React.Component {
      componentDidMount() {
        // Animated work that will get performed during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        });
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flushing deferred work should flush animated work scheduled inside it
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('performs animated work and deferred work in deferred callback if it has time', () => {
    class Foo extends React.Component {
      componentDidMount() {
        // Deferred work that will get performed during deferred callback
        ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        // Animation work that will get performed during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
        });
        // Deferred work that will get performed during deferred callback
        ReactNoop.renderToRootWithID(<span prop="d:1" />, 'd');
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flushing deferred work should flush both deferred and animated work scheduled inside it
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:1')]);
  });

  it('performs deferred and animated work work in deferred callback if it has time', () => {
    class Foo extends React.Component {
      componentDidMount() {
        // Animation work that will get performed during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        });
        // Deferred work that will get performed during deferred callback
        ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
        // Animation work that will get performed during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="d:1" />, 'd');
        });
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flushing deferred work should flush both deferred and animated work scheduled inside it
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:1')]);
  });

  // This test documents the existing behavior. Desired behavior:
  // it('schedules animated work in deferred callback if it runs out of time', () => {
  it('FIXME: schedules animated work as if it was deferred in deferred callback if it runs out of time', () => {
    let hasScheduled = false;
    class Foo extends React.Component {
      componentDidMount() {
        // Animated work that will get scheduled during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        });
        hasScheduled = true;
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flush just enough deferred work to schedule animated work
    ReactNoop.flushDeferredPri(20);
    expect(hasScheduled).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    // FIXME: I would expect these to be flipped because animation work was scheduled.
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(true);
    // expect(ReactNoop.hasScheduledDeferredCallback()).toBe(false);

    // Flush the rest of work in an animated callback.
    // Technically we didn't schedule this callback. This test is valid because we should have scheduled it.
    ReactNoop.flushAnimationPri();
    // FIXME: we should have flushed everything here.
    // expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    // expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    // expect(ReactNoop.hasScheduledAnimationCallback()).toBe(false);
    // expect(ReactNoop.hasScheduledDeferredCallback()).toBe(false);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);

    // FIXME: it should be unnecessary to flush the deferred work:
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
  });

  it('schedules animated work and deferred work in deferred callback if it runs out of time', () => {
    let isScheduled = false;
    class Foo extends React.Component {
      componentDidMount() {
        // Deferred work that will get performed during deferred callback
        ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        // Animation work that will get performed during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
        });
        // Deferred work that will get performed during deferred callback
        ReactNoop.renderToRootWithID(<span prop="d:1" />, 'd');
        isScheduled = true;
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flushing deferred work should schedule both deferred and animated work
    ReactNoop.flushDeferredPri(20);
    expect(isScheduled).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    expect(ReactNoop.getChildren('d')).toEqual([]);

    // Flush the rest of the work
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:1')]);
  });

  it('schedules deferred work and animated work in deferred callback if it runs out of time', () => {
    let isScheduled = false;
    class Foo extends React.Component {
      componentDidMount() {
        // Animation work that will get performed during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
        });
        // Deferred work that will get performed during deferred callback
        ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
        // Animation work that will get performed during deferred callback
        ReactNoop.performAnimationWork(() => {
          ReactNoop.renderToRootWithID(<span prop="d:1" />, 'd');
        });
        isScheduled = true;
      }
      render() {
        return <span prop="a:1" />;
      }
    }

    // Schedule deferred work
    ReactNoop.renderToRootWithID(<Foo />, 'a');

    // Flushing deferred work should schedule both deferred and animated work
    ReactNoop.flushDeferredPri(20);
    expect(isScheduled).toBe(true);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    expect(ReactNoop.getChildren('d')).toEqual([]);

    // Flush the rest of the work
    ReactNoop.flushDeferredPri();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    expect(ReactNoop.getChildren('d')).toEqual([span('d:1')]);
  });
});
