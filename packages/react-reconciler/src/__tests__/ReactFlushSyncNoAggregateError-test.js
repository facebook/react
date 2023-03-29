let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;

let overrideQueueMicrotask;
let flushFakeMicrotasks;

// TODO: Migrate tests to React DOM instead of React Noop

describe('ReactFlushSync (AggregateError not available)', () => {
  beforeEach(() => {
    jest.resetModules();

    global.AggregateError = undefined;

    // When AggregateError is not available, the errors are rethrown in a
    // microtask. This is an implementation detail but we want to test it here
    // so override the global one.
    const originalQueueMicrotask = queueMicrotask;
    overrideQueueMicrotask = false;
    const fakeMicrotaskQueue = [];
    global.queueMicrotask = cb => {
      if (overrideQueueMicrotask) {
        fakeMicrotaskQueue.push(cb);
      } else {
        originalQueueMicrotask(cb);
      }
    };
    flushFakeMicrotasks = () => {
      while (fakeMicrotaskQueue.length > 0) {
        const cb = fakeMicrotaskQueue.shift();
        cb();
      }
    };

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
  });

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  test('completely exhausts synchronous work queue even if something throws', async () => {
    function Throws({error}) {
      throw error;
    }

    const root1 = ReactNoop.createRoot();
    const root2 = ReactNoop.createRoot();
    const root3 = ReactNoop.createRoot();

    await act(async () => {
      root1.render(<Text text="Hi" />);
      root2.render(<Text text="Andrew" />);
      root3.render(<Text text="!" />);
    });
    assertLog(['Hi', 'Andrew', '!']);

    const aahh = new Error('AAHH!');
    const nooo = new Error('Noooooooooo!');

    // Override the global queueMicrotask so we can test the behavior.
    overrideQueueMicrotask = true;
    let error;
    try {
      ReactNoop.flushSync(() => {
        root1.render(<Throws error={aahh} />);
        root2.render(<Throws error={nooo} />);
        root3.render(<Text text="aww" />);
      });
    } catch (e) {
      error = e;
    }

    // The update to root 3 should have finished synchronously, even though the
    // earlier updates errored.
    assertLog(['aww']);
    // Roots 1 and 2 were unmounted.
    expect(root1).toMatchRenderedOutput(null);
    expect(root2).toMatchRenderedOutput(null);
    expect(root3).toMatchRenderedOutput('aww');

    // In modern environments, React would throw an AggregateError. Because
    // AggregateError is not available, React throws the first error, then
    // throws the remaining errors in separate tasks.
    expect(error).toBe(aahh);
    expect(flushFakeMicrotasks).toThrow(nooo);
  });
});
