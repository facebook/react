let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let Suspense;
let scheduleCallback;
let NormalPriority;

describe('ReactSuspenseList', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactFeatureFlags.disableSchedulerTimeoutBasedOnReactExpirationTime = true;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;

    scheduleCallback = Scheduler.unstable_scheduleCallback;
    NormalPriority = Scheduler.unstable_NormalPriority;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  function createAsyncText(text) {
    let resolved = false;
    let Component = function() {
      if (!resolved) {
        Scheduler.unstable_yieldValue('Suspend! [' + text + ']');
        throw promise;
      }
      return <Text text={text} />;
    };
    let promise = new Promise(resolve => {
      Component.resolve = function() {
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
    expect(Scheduler).toFlushAndYield([]);

    root.render(<App show={true} />);
    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      'Suspend! [B]',
      'Loading...',
    ]);
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
    await expect(Scheduler).toFlushAndYieldThrough(['Resolve A']);

    // The next task that flushes should be the one that resolves B. The render
    // task should not jump the queue ahead of B.
    await expect(Scheduler).toFlushAndYieldThrough(['Resolve B']);

    expect(Scheduler).toFlushAndYield(['A', 'B']);
    expect(root).toMatchRenderedOutput('AB');
  });
});
