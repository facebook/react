let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let Suspense;
let scheduleCallback;
let NormalPriority;
let waitForAll;
let waitFor;

describe('ReactSuspenseList', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');

    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactFeatureFlags.disableSchedulerTimeoutBasedOnReactExpirationTime = true;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;

    scheduleCallback = Scheduler.unstable_scheduleCallback;
    NormalPriority = Scheduler.unstable_NormalPriority;

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    waitFor = InternalTestUtils.waitFor;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  function createAsyncText(text) {
    let resolved = false;
    const Component = function () {
      if (!resolved) {
        Scheduler.unstable_yieldValue('Suspend! [' + text + ']');
        throw promise;
      }
      return <Text text={text} />;
    };
    const promise = new Promise(resolve => {
      Component.resolve = function () {
        resolved = true;
        return resolve();
      };
    });
    return Component;
  }

  it('appends rendering tasks to the end of the priority queue', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');

    function App({show}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {show ? <A /> : null}
          {show ? <B /> : null}
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot(null);

    root.render(<App show={false} />);
    await waitForAll([]);

    React.startTransition(() => {
      root.render(<App show={true} />);
    });
    await waitForAll(['Suspend! [A]', 'Suspend! [B]', 'Loading...']);
    expect(root).toMatchRenderedOutput(null);

    Scheduler.unstable_advanceTime(2000);
    expect(root).toMatchRenderedOutput(null);

    scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_yieldValue('Resolve A');
      A.resolve();
    });
    scheduleCallback(NormalPriority, () => {
      Scheduler.unstable_yieldValue('Resolve B');
      B.resolve();
    });

    // This resolves A and schedules a task for React to retry.
    await waitFor(['Resolve A']);

    // The next task that flushes should be the one that resolves B. The render
    // task should not jump the queue ahead of B.
    await waitFor(['Resolve B']);

    await waitForAll(['A', 'B']);
    expect(root).toMatchRenderedOutput('AB');
  });
});
