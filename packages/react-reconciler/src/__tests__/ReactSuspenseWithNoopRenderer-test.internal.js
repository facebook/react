let React;
let ReactFeatureFlags;
let Fragment;
let ReactNoop;
let Scheduler;
let ReactCache;
let Suspense;

let TextResource;
let textResourceShouldFail;

describe('ReactSuspenseWithNoopRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    Fragment = React.Fragment;
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ReactCache = require('react-cache');
    Suspense = React.Suspense;

    TextResource = ReactCache.unstable_createResource(([text, ms = 0]) => {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          if (textResourceShouldFail) {
            Scheduler.unstable_yieldValue(`Promise rejected [${text}]`);
            reject(new Error('Failed to load: ' + text));
          } else {
            Scheduler.unstable_yieldValue(`Promise resolved [${text}]`);
            resolve(text);
          }
        }, ms),
      );
    }, ([text, ms]) => text);
    textResourceShouldFail = false;
  });

  // function div(...children) {
  //   children = children.map(
  //     c => (typeof c === 'string' ? {text: c, hidden: false} : c),
  //   );
  //   return {type: 'div', children, prop: undefined, hidden: false};
  // }

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function hiddenSpan(prop) {
    return {type: 'span', children: [], prop, hidden: true};
  }

  function advanceTimers(ms) {
    // Note: This advances Jest's virtual time but not React's. Use
    // ReactNoop.expire for that.
    if (typeof ms !== 'number') {
      throw new Error('Must specify ms');
    }
    jest.advanceTimersByTime(ms);
    // Wait until the end of the current tick
    // We cannot use a timer since we're faking them
    return Promise.resolve().then(() => {});
  }

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} ref={props.hostRef} />;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read([props.text, props.ms]);
      Scheduler.unstable_yieldValue(text);
      return <span prop={text} />;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
      } else {
        Scheduler.unstable_yieldValue(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('warns if the deprecated maxDuration option is used', () => {
    function Foo() {
      return (
        <Suspense maxDuration={100} fallback="Loading...">
          <div />;
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: maxDuration has been removed from React. ' +
        'Remove the maxDuration prop.' +
        '\n    in Suspense (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('does not restart rendering for initial render', async () => {
    function Bar(props) {
      Scheduler.unstable_yieldValue('Bar');
      return props.children;
    }

    function Foo() {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <React.Fragment>
          <Suspense fallback={<Text text="Loading..." />}>
            <Bar>
              <AsyncText text="A" ms={100} />
              <Text text="B" />
            </Bar>
          </Suspense>
          <Text text="C" />
          <Text text="D" />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYieldThrough([
      'Foo',
      'Bar',
      // A suspends
      'Suspend! [A]',
      // But we keep rendering the siblings
      'B',
      'Loading...',
      'C',
      // We leave D incomplete.
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flush the promise completely
    Scheduler.unstable_advanceTime(100);
    await advanceTimers(100);
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);

    // Even though the promise has resolved, we should now flush
    // and commit the in progress render instead of restarting.
    expect(Scheduler).toFlushAndYield(['D']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Loading...'),
      span('C'),
      span('D'),
    ]);

    // Await one micro task to attach the retry listeners.
    await null;

    // Next, we'll flush the complete content.
    expect(Scheduler).toFlushAndYield(['Bar', 'A', 'B']);

    expect(ReactNoop.getChildren()).toEqual([
      span('A'),
      span('B'),
      span('C'),
      span('D'),
    ]);
  });

  it('suspends rendering and continues later', async () => {
    function Bar(props) {
      Scheduler.unstable_yieldValue('Bar');
      return props.children;
    }

    function Foo({renderBar}) {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {renderBar ? (
            <Bar>
              <AsyncText text="A" ms={100} />
              <Text text="B" />
            </Bar>
          ) : null}
        </Suspense>
      );
    }

    // Render empty shell.
    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['Foo']);

    // The update will suspend.
    ReactNoop.render(<Foo renderBar={true} />);
    expect(Scheduler).toFlushAndYield([
      'Foo',
      'Bar',
      // A suspends
      'Suspend! [A]',
      // But we keep rendering the siblings
      'B',
      'Loading...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flush some of the time
    await advanceTimers(50);
    // Still nothing...
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flush the promise completely
    await advanceTimers(50);
    // Renders successfully
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['Foo', 'Bar', 'A', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('suspends siblings and later recovers each independently', async () => {
    // Render two sibling Suspense components
    ReactNoop.render(
      <Fragment>
        <Suspense fallback={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Suspense>
        <Suspense fallback={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Suspense>
      </Fragment>,
    );
    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      'Loading A...',
      'Suspend! [B]',
      'Loading B...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Loading A...'),
      span('Loading B...'),
    ]);

    // Advance time by enough that the first Suspense's promise resolves and
    // switches back to the normal view. The second Suspense should still
    // show the placeholder
    ReactNoop.expire(5000);
    await advanceTimers(5000);

    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['A']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('Loading B...')]);

    // Advance time by enough that the second Suspense's promise resolves
    // and switches back to the normal view
    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(Scheduler).toFlushAndYield(['B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('continues rendering siblings after suspending', async () => {
    // A shell is needed. The update cause it to suspend.
    ReactNoop.render(<Suspense fallback={<Text text="Loading..." />} />);
    expect(Scheduler).toFlushAndYield([]);
    // B suspends. Continue rendering the remaining siblings.
    ReactNoop.render(
      <Suspense fallback={<Text text="Loading..." />}>
        <Text text="A" />
        <AsyncText text="B" />
        <Text text="C" />
        <Text text="D" />
      </Suspense>,
    );
    // B suspends. Continue rendering the remaining siblings.
    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'C',
      'D',
      'Loading...',
    ]);
    // Did not commit yet.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Wait for data to resolve
    await advanceTimers(100);
    // Renders successfully
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(Scheduler).toFlushAndYield(['A', 'B', 'C', 'D']);
    expect(ReactNoop.getChildren()).toEqual([
      span('A'),
      span('B'),
      span('C'),
      span('D'),
    ]);
  });

  it('retries on error', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      reset() {
        this.setState({error: null});
      }
      render() {
        if (this.state.error !== null) {
          return <Text text={'Caught error: ' + this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    const errorBoundary = React.createRef();
    function App({renderContent}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {renderContent ? (
            <ErrorBoundary ref={errorBoundary}>
              <AsyncText text="Result" ms={1000} />
            </ErrorBoundary>
          ) : null}
        </Suspense>
      );
    }

    ReactNoop.render(<App />);
    expect(Scheduler).toFlushAndYield([]);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.render(<App renderContent={true} />);
    expect(Scheduler).toFlushAndYield(['Suspend! [Result]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    textResourceShouldFail = true;
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    textResourceShouldFail = false;

    expect(Scheduler).toHaveYielded(['Promise rejected [Result]']);

    expect(Scheduler).toFlushAndYield([
      'Error! [Result]',

      // React retries one more time
      'Error! [Result]',

      // Errored again on retry. Now handle it.
      'Caught error: Failed to load: Result',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Caught error: Failed to load: Result'),
    ]);
  });

  it('retries on error after falling back to a placeholder', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      reset() {
        this.setState({error: null});
      }
      render() {
        if (this.state.error !== null) {
          return <Text text={'Caught error: ' + this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    const errorBoundary = React.createRef();
    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <ErrorBoundary ref={errorBoundary}>
            <AsyncText text="Result" ms={3000} />
          </ErrorBoundary>
        </Suspense>
      );
    }

    ReactNoop.render(<App />);
    expect(Scheduler).toFlushAndYield(['Suspend! [Result]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    textResourceShouldFail = true;
    ReactNoop.expire(3000);
    await advanceTimers(3000);
    textResourceShouldFail = false;

    expect(Scheduler).toHaveYielded(['Promise rejected [Result]']);
    expect(Scheduler).toFlushAndYield([
      'Error! [Result]',

      // React retries one more time
      'Error! [Result]',

      // Errored again on retry. Now handle it.

      'Caught error: Failed to load: Result',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Caught error: Failed to load: Result'),
    ]);
  });

  it('can update at a higher priority while in a suspended state', async () => {
    function App(props) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Text text={props.highPri} />
          <AsyncText text={props.lowPri} />
        </Suspense>
      );
    }

    // Initial mount
    ReactNoop.render(<App highPri="A" lowPri="1" />);
    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [1]', 'Loading...']);
    await advanceTimers(0);
    expect(Scheduler).toHaveYielded(['Promise resolved [1]']);
    expect(Scheduler).toFlushAndYield(['A', '1']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('1')]);

    // Update the low-pri text
    ReactNoop.render(<App highPri="A" lowPri="2" />);
    expect(Scheduler).toFlushAndYield([
      'A',
      // Suspends
      'Suspend! [2]',
      'Loading...',
    ]);

    // While we're still waiting for the low-pri update to complete, update the
    // high-pri text at high priority.
    ReactNoop.flushSync(() => {
      ReactNoop.render(<App highPri="B" lowPri="1" />);
    });
    expect(Scheduler).toHaveYielded(['B', '1']);
    expect(ReactNoop.getChildren()).toEqual([span('B'), span('1')]);

    // Unblock the low-pri text and finish
    await advanceTimers(0);
    expect(Scheduler).toHaveYielded(['Promise resolved [2]']);
    expect(ReactNoop.getChildren()).toEqual([span('B'), span('1')]);
  });

  it('keeps working on lower priority work after being pinged', async () => {
    // Advance the virtual time so that we're close to the edge of a bucket.
    ReactNoop.expire(149);

    function App(props) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {props.showA && <AsyncText text="A" />}
          {props.showB && <Text text="B" />}
        </Suspense>
      );
    }

    ReactNoop.render(<App showA={false} showB={false} />);
    expect(Scheduler).toFlushAndYield([]);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.render(<App showA={true} showB={false} />);
    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance React's virtual time by enough to fall into a new async bucket,
    // but not enough to expire the suspense timeout.
    ReactNoop.expire(120);
    ReactNoop.render(<App showA={true} showB={true} />);
    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'B', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    await advanceTimers(0);
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['A', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('tries rendering a lower priority pending update even if a higher priority one suspends', async () => {
    spyOnDev(console, 'error');
    function App(props) {
      if (props.hide) {
        return <Text text="(empty)" />;
      }
      return (
        <Suspense>
          <AsyncText ms={2000} text="Async" />
        </Suspense>
      );
    }

    // Schedule a high pri update and a low pri update, without rendering in
    // between.
    ReactNoop.discreteUpdates(() => {
      // High pri
      ReactNoop.render(<App />);
    });
    // Low pri
    ReactNoop.render(<App hide={true} />);

    expect(Scheduler).toFlushAndYield([
      // The first update suspends
      'Suspend! [Async]',
      // but we have another pending update that we can work on
      '(empty)',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('(empty)')]);
    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: %s\n\nThe fix is to split the update',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain(
        'A user-blocking update was suspended by:',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain('AsyncText');
    }
  });

  it('forces an expiration after an update times out', async () => {
    ReactNoop.render(
      <Fragment>
        <Suspense fallback={<Text text="Loading..." />} />
      </Fragment>,
    );
    expect(Scheduler).toFlushAndYield([]);

    ReactNoop.render(
      <Fragment>
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={20000} />
        </Suspense>
        <Text text="Sync" />
      </Fragment>,
    );

    expect(Scheduler).toFlushAndYield([
      // The async child suspends
      'Suspend! [Async]',
      // Render the placeholder
      'Loading...',
      // Continue on the sibling
      'Sync',
    ]);
    // The update hasn't expired yet, so we commit nothing.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance both React's virtual time and Jest's timers by enough to expire
    // the update, but not by enough to flush the suspending promise.
    ReactNoop.expire(10000);
    await advanceTimers(10000);
    // No additional rendering work is required, since we already prepared
    // the placeholder.
    expect(Scheduler).toHaveYielded([]);
    // Should have committed the placeholder.
    expect(ReactNoop.getChildren()).toEqual([span('Loading...'), span('Sync')]);

    // Once the promise resolves, we render the suspended view
    await advanceTimers(10000);
    expect(Scheduler).toHaveYielded(['Promise resolved [Async]']);
    expect(Scheduler).toFlushAndYield(['Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async'), span('Sync')]);
  });

  it('switches to an inner fallback after suspending for a while', async () => {
    // Advance the virtual time so that we're closer to the edge of a bucket.
    ReactNoop.expire(200);

    ReactNoop.render(
      <Fragment>
        <Text text="Sync" />
        <Suspense fallback={<Text text="Loading outer..." />}>
          <AsyncText text="Outer content" ms={300} />
          <Suspense fallback={<Text text="Loading inner..." />}>
            <AsyncText text="Inner content" ms={1000} />
          </Suspense>
        </Suspense>
      </Fragment>,
    );

    expect(Scheduler).toFlushAndYield([
      'Sync',
      // The async content suspends
      'Suspend! [Outer content]',
      'Suspend! [Inner content]',
      'Loading inner...',
      'Loading outer...',
    ]);
    // The outer loading state finishes immediately.
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Loading outer...'),
    ]);

    // Resolve the outer promise.
    ReactNoop.expire(300);
    await advanceTimers(300);
    expect(Scheduler).toHaveYielded(['Promise resolved [Outer content]']);
    expect(Scheduler).toFlushAndYield([
      'Outer content',
      'Suspend! [Inner content]',
      'Loading inner...',
    ]);
    // Don't commit the inner placeholder yet.
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Loading outer...'),
    ]);

    // Expire the inner timeout.
    ReactNoop.expire(500);
    await advanceTimers(500);
    // Now that 750ms have elapsed since the outer placeholder timed out,
    // we can timeout the inner placeholder.
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Outer content'),
      span('Loading inner...'),
    ]);

    // Finally, flush the inner promise. We should see the complete screen.
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(Scheduler).toHaveYielded(['Promise resolved [Inner content]']);
    expect(Scheduler).toFlushAndYield(['Inner content']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Outer content'),
      span('Inner content'),
    ]);
  });

  it('renders an expiration boundary synchronously', async () => {
    spyOnDev(console, 'error');
    // Synchronously render a tree that suspends
    ReactNoop.flushSync(() =>
      ReactNoop.render(
        <Fragment>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="Async" />
          </Suspense>
          <Text text="Sync" />
        </Fragment>,
      ),
    );
    expect(Scheduler).toHaveYielded([
      // The async child suspends
      'Suspend! [Async]',
      // We immediately render the fallback UI
      'Loading...',
      // Continue on the sibling
      'Sync',
    ]);
    // The tree commits synchronously
    expect(ReactNoop.getChildren()).toEqual([span('Loading...'), span('Sync')]);

    // Once the promise resolves, we render the suspended view
    await advanceTimers(0);
    expect(Scheduler).toHaveYielded(['Promise resolved [Async]']);
    expect(Scheduler).toFlushAndYield(['Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async'), span('Sync')]);

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: %s\n\nThe fix is to split the update',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain(
        'A user-blocking update was suspended by:',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain('AsyncText');
    }
  });

  it('suspending inside an expired expiration boundary will bubble to the next one', async () => {
    spyOnDev(console, 'error');

    ReactNoop.flushSync(() =>
      ReactNoop.render(
        <Fragment>
          <Suspense fallback={<Text text="Loading (outer)..." />}>
            <Suspense fallback={<AsyncText text="Loading (inner)..." />}>
              <AsyncText text="Async" />
            </Suspense>
            <Text text="Sync" />
          </Suspense>
        </Fragment>,
      ),
    );
    expect(Scheduler).toHaveYielded([
      'Suspend! [Async]',
      'Suspend! [Loading (inner)...]',
      'Sync',
      'Loading (outer)...',
    ]);
    // The tree commits synchronously
    expect(ReactNoop.getChildren()).toEqual([span('Loading (outer)...')]);

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: %s\n\nThe fix is to split the update',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain(
        'A user-blocking update was suspended by:',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain('AsyncText');
    }
  });

  it('expires early by default', async () => {
    ReactNoop.render(
      <Fragment>
        <Suspense fallback={<Text text="Loading..." />} />
      </Fragment>,
    );
    expect(Scheduler).toFlushAndYield([]);

    ReactNoop.render(
      <Fragment>
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={3000} />
        </Suspense>
        <Text text="Sync" />
      </Fragment>,
    );

    expect(Scheduler).toFlushAndYield([
      // The async child suspends
      'Suspend! [Async]',
      'Loading...',
      // Continue on the sibling
      'Sync',
    ]);
    // The update hasn't expired yet, so we commit nothing.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance both React's virtual time and Jest's timers by enough to trigger
    // the timeout, but not by enough to flush the promise or reach the true
    // expiration time.
    ReactNoop.expire(2000);
    await advanceTimers(2000);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('Loading...'), span('Sync')]);

    // Once the promise resolves, we render the suspended view
    await advanceTimers(1000);
    expect(Scheduler).toHaveYielded(['Promise resolved [Async]']);
    expect(Scheduler).toFlushAndYield(['Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async'), span('Sync')]);
  });

  it('resolves successfully even if fallback render is pending', async () => {
    ReactNoop.render(
      <React.Fragment>
        <Suspense fallback={<Text text="Loading..." />} />
      </React.Fragment>,
    );
    expect(Scheduler).toFlushAndYield([]);
    expect(ReactNoop.getChildren()).toEqual([]);
    ReactNoop.render(
      <React.Fragment>
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={3000} />
        </Suspense>
      </React.Fragment>,
    );
    expect(ReactNoop.flushNextYield()).toEqual(['Suspend! [Async]']);
    await advanceTimers(1500);
    expect(Scheduler).toHaveYielded([]);
    expect(ReactNoop.getChildren()).toEqual([]);
    // Before we have a chance to flush, the promise resolves.
    await advanceTimers(2000);
    expect(Scheduler).toHaveYielded(['Promise resolved [Async]']);
    expect(Scheduler).toFlushAndYield([
      // We've now pinged the boundary but we don't know if we should restart yet,
      // because we haven't completed the suspense boundary.
      'Loading...',
      // Once we've completed the boundary we restarted.
      'Async',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Async')]);
  });

  it('throws a helpful error when an update is suspends without a placeholder', () => {
    spyOnDev(console, 'error');
    ReactNoop.render(<AsyncText ms={1000} text="Async" />);
    expect(Scheduler).toFlushAndThrow(
      'AsyncText suspended while rendering, but no fallback UI was specified.',
    );
    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: %s\n\nThe fix is to split the update',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain(
        'A user-blocking update was suspended by:',
      );
      expect(console.error.calls.argsFor(0)[1]).toContain('AsyncText');
    }
  });

  it('a Suspense component correctly handles more than one suspended child', async () => {
    ReactNoop.render(
      <Suspense fallback={<Text text="Loading..." />}>
        <AsyncText text="A" ms={100} />
        <AsyncText text="B" ms={100} />
      </Suspense>,
    );
    Scheduler.unstable_advanceTime(10000);
    expect(Scheduler).toHaveYielded([
      'Suspend! [A]',
      'Suspend! [B]',
      'Loading...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    await advanceTimers(100);

    expect(Scheduler).toHaveYielded([
      'Promise resolved [A]',
      'Promise resolved [B]',
    ]);
    expect(Scheduler).toFlushAndYield(['A', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('can resume rendering earlier than a timeout', async () => {
    ReactNoop.render(<Suspense fallback={<Text text="Loading..." />} />);
    expect(Scheduler).toFlushAndYield([]);

    ReactNoop.render(
      <Suspense fallback={<Text text="Loading..." />}>
        <AsyncText text="Async" ms={100} />
      </Suspense>,
    );
    expect(Scheduler).toFlushAndYield(['Suspend! [Async]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time by an amount slightly smaller than what's necessary to
    // resolve the promise
    await advanceTimers(99);

    // Nothing has rendered yet
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Resolve the promise
    await advanceTimers(1);
    // We can now resume rendering
    expect(Scheduler).toHaveYielded(['Promise resolved [Async]']);
    expect(Scheduler).toFlushAndYield(['Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async')]);
  });

  it('starts working on an update even if its priority falls between two suspended levels', async () => {
    function App(props) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {props.text === 'C' || props.text === 'S' ? (
            <Text text={props.text} />
          ) : (
            <AsyncText text={props.text} ms={10000} />
          )}
        </Suspense>
      );
    }

    // First mount without suspending. This ensures we already have content
    // showing so that subsequent updates will suspend.
    ReactNoop.render(<App text="S" />);
    expect(Scheduler).toFlushAndYield(['S']);

    // Schedule an update, and suspend for up to 5 seconds.
    React.unstable_withSuspenseConfig(
      () => ReactNoop.render(<App text="A" />),
      {
        timeoutMs: 5000,
      },
    );
    // The update should suspend.
    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([span('S')]);

    // Advance time until right before it expires.
    await advanceTimers(4999);
    ReactNoop.expire(4999);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('S')]);

    // Schedule another low priority update.
    React.unstable_withSuspenseConfig(
      () => ReactNoop.render(<App text="B" />),
      {
        timeoutMs: 10000,
      },
    );
    // This update should also suspend.
    expect(Scheduler).toFlushAndYield(['Suspend! [B]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([span('S')]);

    // Schedule a regular update. Its expiration time will fall between
    // the expiration times of the previous two updates.
    ReactNoop.render(<App text="C" />);
    expect(Scheduler).toFlushAndYield(['C']);
    expect(ReactNoop.getChildren()).toEqual([span('C')]);

    await advanceTimers(10000);
    // Flush the remaining work.
    expect(Scheduler).toHaveYielded([
      'Promise resolved [A]',
      'Promise resolved [B]',
    ]);
    // Nothing else to render.
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('C')]);
  });

  it('flushes all expired updates in a single batch', async () => {
    class Foo extends React.Component {
      componentDidUpdate() {
        Scheduler.unstable_yieldValue('Commit: ' + this.props.text);
      }
      componentDidMount() {
        Scheduler.unstable_yieldValue('Commit: ' + this.props.text);
      }
      render() {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText ms={20000} text={this.props.text} />
          </Suspense>
        );
      }
    }

    ReactNoop.render(<Foo text="" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo text="go" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo text="good" />);
    ReactNoop.expire(1000);
    jest.advanceTimersByTime(1000);
    ReactNoop.render(<Foo text="goodbye" />);

    Scheduler.unstable_advanceTime(10000);
    jest.advanceTimersByTime(10000);

    expect(Scheduler).toHaveYielded([
      'Suspend! [goodbye]',
      'Loading...',
      'Commit: goodbye',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    Scheduler.unstable_advanceTime(20000);
    await advanceTimers(20000);
    expect(Scheduler).toHaveYielded(['Promise resolved [goodbye]']);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    expect(Scheduler).toFlushAndYield(['goodbye']);
    expect(ReactNoop.getChildren()).toEqual([span('goodbye')]);
  });

  it('a suspended update that expires', async () => {
    // Regression test. This test used to fall into an infinite loop.
    function ExpensiveText({text}) {
      // This causes the update to expire.
      Scheduler.unstable_advanceTime(10000);
      // Then something suspends.
      return <AsyncText text={text} ms={200000} />;
    }

    function App() {
      return (
        <Suspense fallback="Loading...">
          <ExpensiveText text="A" />
          <ExpensiveText text="B" />
          <ExpensiveText text="C" />
        </Suspense>
      );
    }

    ReactNoop.render(<App />);
    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      'Suspend! [B]',
      'Suspend! [C]',
    ]);
    expect(ReactNoop).toMatchRenderedOutput('Loading...');

    await advanceTimers(200000);
    expect(Scheduler).toHaveYielded([
      'Promise resolved [A]',
      'Promise resolved [B]',
      'Promise resolved [C]',
    ]);

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);
    expect(ReactNoop).toMatchRenderedOutput(
      <React.Fragment>
        <span prop="A" />
        <span prop="B" />
        <span prop="C" />
      </React.Fragment>,
    );
  });

  describe('legacy mode mode', () => {
    it('times out immediately', async () => {
      function App() {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText ms={100} text="Result" />
          </Suspense>
        );
      }

      // Times out immediately, ignoring the specified threshold.
      ReactNoop.renderLegacySyncRoot(<App />);
      expect(Scheduler).toHaveYielded(['Suspend! [Result]', 'Loading...']);
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

      ReactNoop.expire(100);
      await advanceTimers(100);

      expect(Scheduler).toHaveYielded(['Promise resolved [Result]']);
      expect(Scheduler).toFlushExpired(['Result']);
      expect(ReactNoop.getChildren()).toEqual([span('Result')]);
    });

    it('times out immediately when Suspense is in legacy mode', async () => {
      class UpdatingText extends React.Component {
        state = {step: 1};
        render() {
          return <AsyncText ms={100} text={`Step: ${this.state.step}`} />;
        }
      }

      function Spinner() {
        return (
          <Fragment>
            <Text text="Loading (1)" />
            <Text text="Loading (2)" />
            <Text text="Loading (3)" />
          </Fragment>
        );
      }

      const text = React.createRef(null);
      function App() {
        return (
          <Suspense fallback={<Spinner />}>
            <UpdatingText ref={text} />
            <Text text="Sibling" />
          </Suspense>
        );
      }

      // Initial mount.
      ReactNoop.renderLegacySyncRoot(<App />);
      await advanceTimers(100);
      expect(Scheduler).toHaveYielded([
        'Suspend! [Step: 1]',
        'Sibling',
        'Loading (1)',
        'Loading (2)',
        'Loading (3)',
        'Promise resolved [Step: 1]',
      ]);
      expect(Scheduler).toFlushExpired(['Step: 1']);
      expect(ReactNoop).toMatchRenderedOutput(
        <React.Fragment>
          <span prop="Step: 1" />
          <span prop="Sibling" />
        </React.Fragment>,
      );

      // Update.
      text.current.setState({step: 2}, () =>
        Scheduler.unstable_yieldValue('Update did commit'),
      );

      expect(ReactNoop.flushNextYield()).toEqual([
        'Suspend! [Step: 2]',
        'Loading (1)',
        'Loading (2)',
        'Loading (3)',
        'Update did commit',
      ]);
      expect(ReactNoop).toMatchRenderedOutput(
        <React.Fragment>
          <span hidden={true} prop="Step: 1" />
          <span hidden={true} prop="Sibling" />
          <span prop="Loading (1)" />
          <span prop="Loading (2)" />
          <span prop="Loading (3)" />
        </React.Fragment>,
      );

      await advanceTimers(100);
      expect(Scheduler).toHaveYielded(['Promise resolved [Step: 2]']);
      expect(Scheduler).toFlushExpired(['Step: 2']);
      expect(ReactNoop).toMatchRenderedOutput(
        <React.Fragment>
          <span prop="Step: 2" />
          <span prop="Sibling" />
        </React.Fragment>,
      );
    });

    it('does not re-render siblings in loose mode', async () => {
      class TextWithLifecycle extends React.Component {
        componentDidMount() {
          Scheduler.unstable_yieldValue(`Mount [${this.props.text}]`);
        }
        componentDidUpdate() {
          Scheduler.unstable_yieldValue(`Update [${this.props.text}]`);
        }
        render() {
          return <Text {...this.props} />;
        }
      }

      class AsyncTextWithLifecycle extends React.Component {
        componentDidMount() {
          Scheduler.unstable_yieldValue(`Mount [${this.props.text}]`);
        }
        componentDidUpdate() {
          Scheduler.unstable_yieldValue(`Update [${this.props.text}]`);
        }
        render() {
          return <AsyncText {...this.props} />;
        }
      }

      function App() {
        return (
          <Suspense fallback={<TextWithLifecycle text="Loading..." />}>
            <TextWithLifecycle text="A" />
            <AsyncTextWithLifecycle ms={100} text="B" />
            <TextWithLifecycle text="C" />
          </Suspense>
        );
      }

      ReactNoop.renderLegacySyncRoot(<App />, () =>
        Scheduler.unstable_yieldValue('Commit root'),
      );
      expect(Scheduler).toHaveYielded([
        'A',
        'Suspend! [B]',
        'C',

        'Loading...',
        'Mount [A]',
        'Mount [B]',
        'Mount [C]',
        // This should be a mount, not an update.
        'Mount [Loading...]',
        'Commit root',
      ]);
      expect(ReactNoop).toMatchRenderedOutput(
        <React.Fragment>
          <span hidden={true} prop="A" />
          <span hidden={true} prop="C" />

          <span prop="Loading..." />
        </React.Fragment>,
      );

      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
      expect(Scheduler).toFlushExpired(['B']);
      expect(ReactNoop).toMatchRenderedOutput(
        <React.Fragment>
          <span prop="A" />
          <span prop="B" />
          <span prop="C" />
        </React.Fragment>,
      );
    });

    it('suspends inside constructor', async () => {
      class AsyncTextInConstructor extends React.Component {
        constructor(props) {
          super(props);
          const text = props.text;
          Scheduler.unstable_yieldValue('constructor');
          try {
            TextResource.read([props.text, props.ms]);
            this.state = {text};
          } catch (promise) {
            if (typeof promise.then === 'function') {
              Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
            } else {
              Scheduler.unstable_yieldValue(`Error! [${text}]`);
            }
            throw promise;
          }
        }
        componentDidMount() {
          Scheduler.unstable_yieldValue('componentDidMount');
        }
        render() {
          Scheduler.unstable_yieldValue(this.state.text);
          return <span prop={this.state.text} />;
        }
      }

      ReactNoop.renderLegacySyncRoot(
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncTextInConstructor ms={100} text="Hi" />
        </Suspense>,
      );

      expect(Scheduler).toHaveYielded([
        'constructor',
        'Suspend! [Hi]',
        'Loading...',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

      await advanceTimers(1000);

      expect(Scheduler).toHaveYielded(['Promise resolved [Hi]']);
      expect(Scheduler).toFlushExpired([
        'constructor',
        'Hi',
        'componentDidMount',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Hi')]);
    });

    it('does not infinite loop if fallback contains lifecycle method', async () => {
      class Fallback extends React.Component {
        state = {
          name: 'foo',
        };
        componentDidMount() {
          this.setState({
            name: 'bar',
          });
        }
        render() {
          return <Text text="Loading..." />;
        }
      }

      class Demo extends React.Component {
        render() {
          return (
            <Suspense fallback={<Fallback />}>
              <AsyncText text="Hi" ms={100} />
            </Suspense>
          );
        }
      }

      ReactNoop.renderLegacySyncRoot(<Demo />);

      expect(Scheduler).toHaveYielded([
        'Suspend! [Hi]',
        'Loading...',
        // Re-render due to lifecycle update
        'Loading...',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
      await advanceTimers(100);
      expect(Scheduler).toHaveYielded(['Promise resolved [Hi]']);
      expect(Scheduler).toFlushExpired(['Hi']);
      expect(ReactNoop.getChildren()).toEqual([span('Hi')]);
    });

    if (global.__PERSISTENT__) {
      it('hides/unhides suspended children before layout effects fire (persistent)', async () => {
        const {useRef, useLayoutEffect} = React;

        function Parent() {
          const child = useRef(null);

          useLayoutEffect(() => {
            Scheduler.unstable_yieldValue(ReactNoop.getPendingChildrenAsJSX());
          });

          return (
            <span ref={child} hidden={false}>
              <AsyncText ms={1000} text="Hi" />
            </span>
          );
        }

        function App(props) {
          return (
            <Suspense fallback={<Text text="Loading..." />}>
              <Parent />
            </Suspense>
          );
        }

        ReactNoop.renderLegacySyncRoot(<App middleText="B" />);

        expect(Scheduler).toHaveYielded([
          'Suspend! [Hi]',
          'Loading...',
          // The child should have already been hidden
          <React.Fragment>
            <span hidden={true} />
            <span prop="Loading..." />
          </React.Fragment>,
        ]);

        await advanceTimers(1000);

        expect(Scheduler).toHaveYielded(['Promise resolved [Hi]']);
        expect(Scheduler).toFlushExpired(['Hi']);
      });
    } else {
      it('hides/unhides suspended children before layout effects fire (mutation)', async () => {
        const {useRef, useLayoutEffect} = React;

        function Parent() {
          const child = useRef(null);

          useLayoutEffect(() => {
            Scheduler.unstable_yieldValue(
              'Child is hidden: ' + child.current.hidden,
            );
          });

          return (
            <span ref={child} hidden={false}>
              <AsyncText ms={1000} text="Hi" />
            </span>
          );
        }

        function App(props) {
          return (
            <Suspense fallback={<Text text="Loading..." />}>
              <Parent />
            </Suspense>
          );
        }

        ReactNoop.renderLegacySyncRoot(<App middleText="B" />);

        expect(Scheduler).toHaveYielded([
          'Suspend! [Hi]',
          'Loading...',
          // The child should have already been hidden
          'Child is hidden: true',
        ]);

        await advanceTimers(1000);

        expect(Scheduler).toHaveYielded(['Promise resolved [Hi]']);
        expect(Scheduler).toFlushExpired(['Hi']);
      });
    }
  });

  it('does not call lifecycles of a suspended component', async () => {
    class TextWithLifecycle extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue(`Mount [${this.props.text}]`);
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue(`Update [${this.props.text}]`);
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue(`Unmount [${this.props.text}]`);
      }
      render() {
        return <Text {...this.props} />;
      }
    }

    class AsyncTextWithLifecycle extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue(`Mount [${this.props.text}]`);
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue(`Update [${this.props.text}]`);
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue(`Unmount [${this.props.text}]`);
      }
      render() {
        const text = this.props.text;
        const ms = this.props.ms;
        try {
          TextResource.read([text, ms]);
          Scheduler.unstable_yieldValue(text);
          return <span prop={text} />;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
          } else {
            Scheduler.unstable_yieldValue(`Error! [${text}]`);
          }
          throw promise;
        }
      }
    }

    function App() {
      return (
        <Suspense fallback={<TextWithLifecycle text="Loading..." />}>
          <TextWithLifecycle text="A" />
          <AsyncTextWithLifecycle ms={100} text="B" />
          <TextWithLifecycle text="C" />
        </Suspense>
      );
    }

    ReactNoop.renderLegacySyncRoot(<App />, () =>
      Scheduler.unstable_yieldValue('Commit root'),
    );
    expect(Scheduler).toHaveYielded([
      'A',
      'Suspend! [B]',
      'C',
      'Loading...',

      'Mount [A]',
      // B's lifecycle should not fire because it suspended
      // 'Mount [B]',
      'Mount [C]',
      'Mount [Loading...]',
      'Commit root',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <React.Fragment>
        <span hidden={true} prop="A" />
        <span hidden={true} prop="C" />
        <span prop="Loading..." />
      </React.Fragment>,
    );
  });

  it('suspends for longer if something took a long (CPU bound) time to render', async () => {
    function Foo({renderContent}) {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {renderContent ? <AsyncText text="A" ms={5000} /> : null}
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['Foo']);

    ReactNoop.render(<Foo renderContent={true} />);
    Scheduler.unstable_advanceTime(100);
    await advanceTimers(100);
    // Start rendering
    expect(Scheduler).toFlushAndYieldThrough(['Foo']);
    // For some reason it took a long time to render Foo.
    Scheduler.unstable_advanceTime(1250);
    await advanceTimers(1250);
    expect(Scheduler).toFlushAndYield([
      // A suspends
      'Suspend! [A]',
      'Loading...',
    ]);
    // We're now suspended and we haven't shown anything yet.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flush some of the time
    Scheduler.unstable_advanceTime(450);
    await advanceTimers(450);
    // Because we've already been waiting for so long we can
    // wait a bit longer. Still nothing...
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Eventually we'll show the fallback.
    Scheduler.unstable_advanceTime(500);
    await advanceTimers(500);
    // No need to rerender.
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    // Flush the promise completely
    Scheduler.unstable_advanceTime(4500);
    await advanceTimers(4500);
    // Renders successfully
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['A']);
    expect(ReactNoop.getChildren()).toEqual([span('A')]);
  });

  it('does not suspends if a fallback has been shown for a long time', async () => {
    function Foo() {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" ms={5000} />
          <Suspense fallback={<Text text="Loading more..." />}>
            <AsyncText text="B" ms={10000} />
          </Suspense>
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    // Start rendering
    expect(Scheduler).toFlushAndYield([
      'Foo',
      // A suspends
      'Suspend! [A]',
      // B suspends
      'Suspend! [B]',
      'Loading more...',
      'Loading...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    // Wait a long time.
    Scheduler.unstable_advanceTime(5000);
    await advanceTimers(5000);
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);

    // Retry with the new content.
    expect(Scheduler).toFlushAndYield([
      'A',
      // B still suspends
      'Suspend! [B]',
      'Loading more...',
    ]);
    // Because we've already been waiting for so long we've exceeded
    // our threshold and we show the next level immediately.
    expect(ReactNoop.getChildren()).toEqual([
      span('A'),
      span('Loading more...'),
    ]);

    // Flush the last promise completely
    Scheduler.unstable_advanceTime(5000);
    await advanceTimers(5000);
    // Renders successfully
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(Scheduler).toFlushAndYield(['B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('does suspend if a fallback has been shown for a short time', async () => {
    function Foo() {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" ms={200} />
          <Suspense fallback={<Text text="Loading more..." />}>
            <AsyncText text="B" ms={450} />
          </Suspense>
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    // Start rendering
    expect(Scheduler).toFlushAndYield([
      'Foo',
      // A suspends
      'Suspend! [A]',
      // B suspends
      'Suspend! [B]',
      'Loading more...',
      'Loading...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    // Wait a short time.
    Scheduler.unstable_advanceTime(250);
    await advanceTimers(250);
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);

    // Retry with the new content.
    expect(Scheduler).toFlushAndYield([
      'A',
      // B still suspends
      'Suspend! [B]',
      'Loading more...',
    ]);
    // Because we've already been waiting for so long we can
    // wait a bit longer. Still nothing...
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    Scheduler.unstable_advanceTime(200);
    await advanceTimers(200);

    // Before we commit another Promise resolves.
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    // We're still showing the first loading state.
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
    // Restart and render the complete content.
    expect(Scheduler).toFlushAndYield(['A', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('does not suspend for very long after a higher priority update', async () => {
    function Foo({renderContent}) {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {renderContent ? <AsyncText text="A" ms={5000} /> : null}
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['Foo']);

    ReactNoop.discreteUpdates(() =>
      ReactNoop.render(<Foo renderContent={true} />),
    );
    expect(Scheduler).toFlushAndYieldThrough(['Foo']);

    // Advance some time.
    Scheduler.unstable_advanceTime(100);
    await advanceTimers(100);

    expect(() => {
      expect(Scheduler).toFlushAndYield([
        // A suspends
        'Suspend! [A]',
        'Loading...',
      ]);
    }).toWarnDev(
      'Warning: A user-blocking update was suspended by:' +
        '\n\n' +
        '  AsyncText',
      {withoutStack: true},
    );

    // We're now suspended and we haven't shown anything yet.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flush some of the time
    Scheduler.unstable_advanceTime(500);
    jest.advanceTimersByTime(500);

    // We should have already shown the fallback.
    // When we wrote this test, we inferred the start time of high priority
    // updates as way earlier in the past. This test ensures that we don't
    // use this assumption to add a very long JND.
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
  });

  it('warns when a low priority update suspends inside a high priority update for functional components', async () => {
    let _setShow;
    function App() {
      let [show, setShow] = React.useState(false);
      _setShow = setShow;
      return (
        <Suspense fallback="Loading...">
          {show && <AsyncText text="A" />}
        </Suspense>
      );
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<App />);
    });

    expect(() => {
      ReactNoop.act(() => {
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_UserBlockingPriority,
          () => _setShow(true),
        );
      });
    }).toWarnDev(
      'Warning: The following components triggered a user-blocking update:' +
        '\n\n' +
        '  App' +
        '\n\n' +
        'that was then suspended by:' +
        '\n\n' +
        '  AsyncText',
      {withoutStack: true},
    );
  });

  it('warns when a low priority update suspends inside a high priority update for class components', async () => {
    let show;
    class App extends React.Component {
      state = {show: false};

      render() {
        show = () => this.setState({show: true});
        return (
          <Suspense fallback="Loading...">
            {this.state.show && <AsyncText text="A" />}
          </Suspense>
        );
      }
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<App />);
    });

    expect(() => {
      ReactNoop.act(() => {
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_UserBlockingPriority,
          () => show(),
        );
      });
    }).toWarnDev(
      'Warning: The following components triggered a user-blocking update:' +
        '\n\n' +
        '  App' +
        '\n\n' +
        'that was then suspended by:' +
        '\n\n' +
        '  AsyncText',
      {withoutStack: true},
    );
  });

  it('warns when suspending inside discrete update', async () => {
    function A() {
      Scheduler.unstable_yieldValue('A');
      TextResource.read(['A', 1000]);
      return 'A';
    }

    function B() {
      return 'B';
    }

    function C() {
      TextResource.read(['C', 1000]);
      return 'C';
    }

    function App() {
      return (
        <Suspense fallback="Loading...">
          <A />
          <B />
          <C />
          <C />
          <C />
          <C />
        </Suspense>
      );
    }

    ReactNoop.discreteUpdates(() => ReactNoop.render(<App />));
    expect(Scheduler).toFlushAndYieldThrough(['A']);

    // Warning is not flushed until the commit phase

    // Timeout and commit the fallback
    expect(() => {
      Scheduler.unstable_flushAll();
    }).toWarnDev(
      'Warning: A user-blocking update was suspended by:' + '\n\n' + '  A, C',
      {withoutStack: true},
    );
  });

  it('normal priority updates suspending do not warn for class components', async () => {
    let show;
    class App extends React.Component {
      state = {show: false};

      render() {
        show = () => this.setState({show: true});
        return (
          <Suspense fallback="Loading...">
            {this.state.show && <AsyncText text="A" />}
          </Suspense>
        );
      }
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<App />);
    });

    // also make sure lowpriority is okay
    await ReactNoop.act(async () => show(true));

    expect(Scheduler).toHaveYielded(['Suspend! [A]']);
    Scheduler.unstable_advanceTime(100);
    await advanceTimers(100);

    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
  });

  it('normal priority updates suspending do not warn for functional components', async () => {
    let _setShow;
    function App() {
      let [show, setShow] = React.useState(false);
      _setShow = setShow;
      return (
        <Suspense fallback="Loading...">
          {show && <AsyncText text="A" />}
        </Suspense>
      );
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<App />);
    });

    // also make sure lowpriority is okay
    await ReactNoop.act(async () => _setShow(true));

    expect(Scheduler).toHaveYielded(['Suspend! [A]']);
    Scheduler.unstable_advanceTime(100);
    await advanceTimers(100);

    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
  });

  it('shows the parent fallback if the inner fallback should be avoided', async () => {
    function Foo({showC}) {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense fallback={<Text text="Initial load..." />}>
          <Suspense
            unstable_avoidThisFallback={true}
            fallback={<Text text="Updating..." />}>
            <AsyncText text="A" ms={5000} />
            {showC ? <AsyncText text="C" ms={5000} /> : null}
          </Suspense>
          <Text text="B" />
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield([
      'Foo',
      'Suspend! [A]',
      'B',
      'Initial load...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Initial load...')]);

    // Eventually we resolve and show the data.
    Scheduler.unstable_advanceTime(5000);
    await advanceTimers(5000);
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['A', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);

    // Update to show C
    ReactNoop.render(<Foo showC={true} />);
    expect(Scheduler).toFlushAndYield([
      'Foo',
      'A',
      'Suspend! [C]',
      'Updating...',
      'B',
    ]);
    // Flush to skip suspended time.
    Scheduler.unstable_advanceTime(600);
    await advanceTimers(600);
    // Since the optional suspense boundary is already showing its content,
    // we have to use the inner fallback instead.
    expect(ReactNoop.getChildren()).toEqual([
      hiddenSpan('A'),
      span('Updating...'),
      span('B'),
    ]);

    // Later we load the data.
    Scheduler.unstable_advanceTime(5000);
    await advanceTimers(5000);
    expect(Scheduler).toHaveYielded(['Promise resolved [C]']);
    expect(Scheduler).toFlushAndYield(['A', 'C']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('C'), span('B')]);
  });

  it('favors showing the inner fallback for nested top level avoided fallback', async () => {
    function Foo({showB}) {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense
          unstable_avoidThisFallback={true}
          fallback={<Text text="Loading A..." />}>
          <Text text="A" />
          <Suspense
            unstable_avoidThisFallback={true}
            fallback={<Text text="Loading B..." />}>
            <AsyncText text="B" ms={5000} />
          </Suspense>
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield([
      'Foo',
      'A',
      'Suspend! [B]',
      'Loading B...',
    ]);
    // Flush to skip suspended time.
    Scheduler.unstable_advanceTime(600);
    await advanceTimers(600);

    expect(ReactNoop.getChildren()).toEqual([span('A'), span('Loading B...')]);
  });

  it('keeps showing an avoided parent fallback if it is already showing', async () => {
    function Foo({showB}) {
      Scheduler.unstable_yieldValue('Foo');
      return (
        <Suspense fallback={<Text text="Initial load..." />}>
          <Suspense
            unstable_avoidThisFallback={true}
            fallback={<Text text="Loading A..." />}>
            <Text text="A" />
            {showB ? (
              <Suspense
                unstable_avoidThisFallback={true}
                fallback={<Text text="Loading B..." />}>
                <AsyncText text="B" ms={5000} />
              </Suspense>
            ) : null}
          </Suspense>
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['Foo', 'A']);
    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    ReactNoop.render(<Foo showB={true} />);

    expect(Scheduler).toFlushAndYield([
      'Foo',
      'A',
      'Suspend! [B]',
      'Loading B...',
    ]);
    // Still suspended.
    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    // Flush to skip suspended time.
    Scheduler.unstable_advanceTime(600);
    await advanceTimers(600);

    expect(ReactNoop.getChildren()).toEqual([span('A'), span('Loading B...')]);
  });

  it('commits a suspended idle pri render within a reasonable time', async () => {
    function Foo({renderContent}) {
      return (
        <Fragment>
          <Suspense fallback={<Text text="Loading A..." />}>
            {renderContent ? <AsyncText text="A" ms={10000} /> : null}
          </Suspense>
        </Fragment>
      );
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield([]);

    ReactNoop.render(<Foo renderContent={1} />);

    // Took a long time to render. This is to ensure we get a long suspense time.
    // Could also use something like withSuspenseConfig to simulate this.
    Scheduler.unstable_advanceTime(1500);
    await advanceTimers(1500);

    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading A...']);
    // We're still suspended.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Schedule an update at idle pri.
    Scheduler.unstable_runWithPriority(Scheduler.unstable_IdlePriority, () =>
      ReactNoop.render(<Foo renderContent={2} />),
    );
    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading A...']);

    // We're still suspended.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time a little bit.
    Scheduler.unstable_advanceTime(150);
    await advanceTimers(150);

    // We should not have committed yet because we had a long suspense time.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flush to skip suspended time.
    Scheduler.unstable_advanceTime(600);
    await advanceTimers(600);

    expect(ReactNoop.getChildren()).toEqual([span('Loading A...')]);
  });

  describe('delays transitions when there a suspense config is supplied', () => {
    const SUSPENSE_CONFIG = {
      timeoutMs: 2000,
    };

    it('top level render', async () => {
      function App({page}) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text={page} ms={5000} />
          </Suspense>
        );
      }

      // Initial render.
      React.unstable_withSuspenseConfig(
        () => ReactNoop.render(<App page="A" />),
        SUSPENSE_CONFIG,
      );

      expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
      // Only a short time is needed to unsuspend the initial loading state.
      Scheduler.unstable_advanceTime(400);
      await advanceTimers(400);
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

      // Later we load the data.
      Scheduler.unstable_advanceTime(5000);
      await advanceTimers(5000);
      expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
      expect(Scheduler).toFlushAndYield(['A']);
      expect(ReactNoop.getChildren()).toEqual([span('A')]);

      // Start transition.
      React.unstable_withSuspenseConfig(
        () => ReactNoop.render(<App page="B" />),
        SUSPENSE_CONFIG,
      );

      expect(Scheduler).toFlushAndYield(['Suspend! [B]', 'Loading...']);
      Scheduler.unstable_advanceTime(1000);
      await advanceTimers(1000);
      // Even after a second, we have still not yet flushed the loading state.
      expect(ReactNoop.getChildren()).toEqual([span('A')]);
      Scheduler.unstable_advanceTime(1100);
      await advanceTimers(1100);
      // After the timeout, we do show the loading state.
      expect(ReactNoop.getChildren()).toEqual([
        hiddenSpan('A'),
        span('Loading...'),
      ]);
      // Later we load the data.
      Scheduler.unstable_advanceTime(3000);
      await advanceTimers(3000);
      expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
      expect(Scheduler).toFlushAndYield(['B']);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);
    });

    it('hooks', async () => {
      let transitionToPage;
      function App() {
        let [page, setPage] = React.useState('none');
        transitionToPage = setPage;
        if (page === 'none') {
          return null;
        }
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text={page} ms={5000} />
          </Suspense>
        );
      }

      ReactNoop.render(<App />);
      expect(Scheduler).toFlushAndYield([]);

      // Initial render.
      await ReactNoop.act(async () => {
        React.unstable_withSuspenseConfig(
          () => transitionToPage('A'),
          SUSPENSE_CONFIG,
        );

        expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
        // Only a short time is needed to unsuspend the initial loading state.
        Scheduler.unstable_advanceTime(400);
        await advanceTimers(400);
        expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
      });

      // Later we load the data.
      Scheduler.unstable_advanceTime(5000);
      await advanceTimers(5000);
      expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
      expect(Scheduler).toFlushAndYield(['A']);
      expect(ReactNoop.getChildren()).toEqual([span('A')]);

      // Start transition.
      await ReactNoop.act(async () => {
        React.unstable_withSuspenseConfig(
          () => transitionToPage('B'),
          SUSPENSE_CONFIG,
        );

        expect(Scheduler).toFlushAndYield(['Suspend! [B]', 'Loading...']);
        Scheduler.unstable_advanceTime(1000);
        await advanceTimers(1000);
        // Even after a second, we have still not yet flushed the loading state.
        expect(ReactNoop.getChildren()).toEqual([span('A')]);
        Scheduler.unstable_advanceTime(1100);
        await advanceTimers(1100);
        // After the timeout, we do show the loading state.
        expect(ReactNoop.getChildren()).toEqual([
          hiddenSpan('A'),
          span('Loading...'),
        ]);
      });
      // Later we load the data.
      Scheduler.unstable_advanceTime(3000);
      await advanceTimers(3000);
      expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
      expect(Scheduler).toFlushAndYield(['B']);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);
    });

    it('classes', async () => {
      let transitionToPage;
      class App extends React.Component {
        state = {page: 'none'};
        render() {
          transitionToPage = page => this.setState({page});
          let page = this.state.page;
          if (page === 'none') {
            return null;
          }
          return (
            <Suspense fallback={<Text text="Loading..." />}>
              <AsyncText text={page} ms={5000} />
            </Suspense>
          );
        }
      }

      ReactNoop.render(<App />);
      expect(Scheduler).toFlushAndYield([]);

      // Initial render.
      await ReactNoop.act(async () => {
        React.unstable_withSuspenseConfig(
          () => transitionToPage('A'),
          SUSPENSE_CONFIG,
        );

        expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
        // Only a short time is needed to unsuspend the initial loading state.
        Scheduler.unstable_advanceTime(400);
        await advanceTimers(400);
        expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
      });

      // Later we load the data.
      Scheduler.unstable_advanceTime(5000);
      await advanceTimers(5000);
      expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
      expect(Scheduler).toFlushAndYield(['A']);
      expect(ReactNoop.getChildren()).toEqual([span('A')]);

      // Start transition.
      await ReactNoop.act(async () => {
        React.unstable_withSuspenseConfig(
          () => transitionToPage('B'),
          SUSPENSE_CONFIG,
        );

        expect(Scheduler).toFlushAndYield(['Suspend! [B]', 'Loading...']);
        Scheduler.unstable_advanceTime(1000);
        await advanceTimers(1000);
        // Even after a second, we have still not yet flushed the loading state.
        expect(ReactNoop.getChildren()).toEqual([span('A')]);
        Scheduler.unstable_advanceTime(1100);
        await advanceTimers(1100);
        // After the timeout, we do show the loading state.
        expect(ReactNoop.getChildren()).toEqual([
          hiddenSpan('A'),
          span('Loading...'),
        ]);
      });
      // Later we load the data.
      Scheduler.unstable_advanceTime(3000);
      await advanceTimers(3000);
      expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
      expect(Scheduler).toFlushAndYield(['B']);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);
    });
  });

  it('disables suspense config when nothing is passed to withSuspenseConfig', async () => {
    function App({page}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text={page} ms={2000} />
        </Suspense>
      );
    }

    // Initial render.
    ReactNoop.render(<App page="A" />);
    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
    Scheduler.unstable_advanceTime(2000);
    await advanceTimers(2000);
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['A']);
    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    // Start transition.
    React.unstable_withSuspenseConfig(
      () => {
        // When we schedule an inner transition without a suspense config
        // so it should only suspend for a short time.
        React.unstable_withSuspenseConfig(() =>
          ReactNoop.render(<App page="B" />),
        );
      },
      {timeoutMs: 2000},
    );

    expect(Scheduler).toFlushAndYield(['Suspend! [B]', 'Loading...']);
    // Suspended
    expect(ReactNoop.getChildren()).toEqual([span('A')]);
    Scheduler.unstable_advanceTime(500);
    await advanceTimers(500);
    // Committed loading state.
    expect(ReactNoop.getChildren()).toEqual([
      hiddenSpan('A'),
      span('Loading...'),
    ]);

    Scheduler.unstable_advanceTime(2000);
    await advanceTimers(2000);
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(Scheduler).toFlushAndYield(['B']);
    expect(ReactNoop.getChildren()).toEqual([span('B')]);

    React.unstable_withSuspenseConfig(
      () => {
        // First we schedule an inner unrelated update.
        React.unstable_withSuspenseConfig(() =>
          ReactNoop.render(<App page="B" unrelated={true} />),
        );
        // Then we schedule another transition to a slow page,
        // but at this scope we should suspend for longer.
        Scheduler.unstable_next(() => ReactNoop.render(<App page="C" />));
      },
      {timeoutMs: 2000},
    );
    expect(Scheduler).toFlushAndYield([
      'Suspend! [C]',
      'Loading...',
      'Suspend! [C]',
      'Loading...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('B')]);
    Scheduler.unstable_advanceTime(1200);
    await advanceTimers(1200);
    // Even after a second, we have still not yet flushed the loading state.
    expect(ReactNoop.getChildren()).toEqual([span('B')]);
    Scheduler.unstable_advanceTime(1200);
    await advanceTimers(1200);
    // After the two second timeout we show the loading state.
    expect(ReactNoop.getChildren()).toEqual([
      hiddenSpan('B'),
      span('Loading...'),
    ]);
  });

  it('withSuspenseConfig timeout applies when we use an updated avoided boundary', async () => {
    function App({page}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Text text="Hi!" />
          <Suspense
            fallback={<Text text={'Loading ' + page + '...'} />}
            unstable_avoidThisFallback={true}>
            <AsyncText text={page} ms={3000} />
          </Suspense>
        </Suspense>
      );
    }

    // Initial render.
    ReactNoop.render(<App page="A" />);
    expect(Scheduler).toFlushAndYield(['Hi!', 'Suspend! [A]', 'Loading...']);
    Scheduler.unstable_advanceTime(3000);
    await advanceTimers(3000);
    expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
    expect(Scheduler).toFlushAndYield(['Hi!', 'A']);
    expect(ReactNoop.getChildren()).toEqual([span('Hi!'), span('A')]);

    // Start transition.
    React.unstable_withSuspenseConfig(
      () => ReactNoop.render(<App page="B" />),
      {timeoutMs: 2000},
    );

    expect(Scheduler).toFlushAndYield(['Hi!', 'Suspend! [B]', 'Loading B...']);

    // Suspended
    expect(ReactNoop.getChildren()).toEqual([span('Hi!'), span('A')]);
    Scheduler.unstable_advanceTime(1800);
    await advanceTimers(1800);
    expect(Scheduler).toFlushAndYield([]);
    // We should still be suspended here because this loading state should be avoided.
    expect(ReactNoop.getChildren()).toEqual([span('Hi!'), span('A')]);
    Scheduler.unstable_advanceTime(1500);
    await advanceTimers(1500);
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Hi!'),
      hiddenSpan('A'),
      span('Loading B...'),
    ]);
  });

  it('withSuspenseConfig timeout applies when we use a newly created avoided boundary', async () => {
    function App({page}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Text text="Hi!" />
          {page === 'A' ? (
            <Text text="A" />
          ) : (
            <Suspense
              fallback={<Text text={'Loading ' + page + '...'} />}
              unstable_avoidThisFallback={true}>
              <AsyncText text={page} ms={3000} />
            </Suspense>
          )}
        </Suspense>
      );
    }

    // Initial render.
    ReactNoop.render(<App page="A" />);
    expect(Scheduler).toFlushAndYield(['Hi!', 'A']);
    expect(ReactNoop.getChildren()).toEqual([span('Hi!'), span('A')]);

    // Start transition.
    React.unstable_withSuspenseConfig(
      () => ReactNoop.render(<App page="B" />),
      {timeoutMs: 2000},
    );

    expect(Scheduler).toFlushAndYield(['Hi!', 'Suspend! [B]', 'Loading B...']);

    // Suspended
    expect(ReactNoop.getChildren()).toEqual([span('Hi!'), span('A')]);
    Scheduler.unstable_advanceTime(1800);
    await advanceTimers(1800);
    expect(Scheduler).toFlushAndYield([]);
    // We should still be suspended here because this loading state should be avoided.
    expect(ReactNoop.getChildren()).toEqual([span('Hi!'), span('A')]);
    Scheduler.unstable_advanceTime(1500);
    await advanceTimers(1500);
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Hi!'),
      span('Loading B...'),
    ]);
  });

  it('supports delaying a busy spinner from disappearing', async () => {
    function useLoadingIndicator(config) {
      let [isLoading, setLoading] = React.useState(false);
      let start = React.useCallback(
        cb => {
          setLoading(true);
          Scheduler.unstable_next(() =>
            React.unstable_withSuspenseConfig(() => {
              setLoading(false);
              cb();
            }, config),
          );
        },
        [setLoading, config],
      );
      return [isLoading, start];
    }

    const SUSPENSE_CONFIG = {
      timeoutMs: 10000,
      busyDelayMs: 500,
      busyMinDurationMs: 400,
    };

    let transitionToPage;

    function App() {
      let [page, setPage] = React.useState('A');
      let [isLoading, startLoading] = useLoadingIndicator(SUSPENSE_CONFIG);
      transitionToPage = nextPage => startLoading(() => setPage(nextPage));
      return (
        <Fragment>
          <Text text={page} />
          {isLoading ? <Text text="L" /> : null}
        </Fragment>
      );
    }

    // Initial render.
    ReactNoop.render(<App />);
    expect(Scheduler).toFlushAndYield(['A']);
    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    await ReactNoop.act(async () => {
      transitionToPage('B');
      // Rendering B is quick and we didn't have enough
      // time to show the loading indicator.
      Scheduler.unstable_advanceTime(200);
      await advanceTimers(200);
      expect(Scheduler).toFlushAndYield(['A', 'L', 'B']);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);
    });

    await ReactNoop.act(async () => {
      transitionToPage('C');
      // Rendering C is a bit slower so we've already showed
      // the loading indicator.
      Scheduler.unstable_advanceTime(600);
      await advanceTimers(600);
      expect(Scheduler).toFlushAndYield(['B', 'L', 'C']);
      // We're technically done now but we haven't shown the
      // loading indicator for long enough yet so we'll suspend
      // while we keep it on the screen a bit longer.
      expect(ReactNoop.getChildren()).toEqual([span('B'), span('L')]);
      Scheduler.unstable_advanceTime(400);
      await advanceTimers(400);
      expect(ReactNoop.getChildren()).toEqual([span('C')]);
    });

    await ReactNoop.act(async () => {
      transitionToPage('D');
      // Rendering D is very slow so we've already showed
      // the loading indicator.
      Scheduler.unstable_advanceTime(1000);
      await advanceTimers(1000);
      expect(Scheduler).toFlushAndYield(['C', 'L', 'D']);
      // However, since we exceeded the minimum time to show
      // the loading indicator, we commit immediately.
      expect(ReactNoop.getChildren()).toEqual([span('D')]);
    });
  });

  it("suspended commit remains suspended even if there's another update at same expiration", async () => {
    // Regression test
    function App({text}) {
      return (
        <Suspense fallback="Loading...">
          <AsyncText ms={2000} text={text} />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App text="Initial" />);
    });

    // Resolve initial render
    await ReactNoop.act(async () => {
      Scheduler.unstable_advanceTime(2000);
      await advanceTimers(2000);
    });
    expect(Scheduler).toHaveYielded([
      'Suspend! [Initial]',
      'Promise resolved [Initial]',
      'Initial',
    ]);
    expect(root).toMatchRenderedOutput(<span prop="Initial" />);

    // Update. Since showing a fallback would hide content that's already
    // visible, it should suspend for a bit without committing.
    await ReactNoop.act(async () => {
      root.render(<App text="First update" />);

      expect(Scheduler).toFlushAndYield(['Suspend! [First update]']);
      // Should not display a fallback
      expect(root).toMatchRenderedOutput(<span prop="Initial" />);
    });

    // Update again. This should also suspend for a bit.
    await ReactNoop.act(async () => {
      root.render(<App text="Second update" />);

      expect(Scheduler).toFlushAndYield(['Suspend! [Second update]']);
      // Should not display a fallback
      expect(root).toMatchRenderedOutput(<span prop="Initial" />);
    });
  });
});
