let React;
let ReactFeatureFlags;
let Fragment;
let ReactNoop;
let ReactCache;
let Suspense;
let StrictMode;
let ConcurrentMode;

let cache;
let TextResource;
let textResourceShouldFail;

// These tests use React Noop Renderer.  All new tests should use React Test
// Renderer and go in ReactSuspense-test; plan is gradually migrate the noop
// tests to that file.
describe('ReactSuspenseWithNoopRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    Fragment = React.Fragment;
    ReactNoop = require('react-noop-renderer');
    ReactCache = require('react-cache');
    Suspense = React.Suspense;
    StrictMode = React.StrictMode;
    ConcurrentMode = React.unstable_ConcurrentMode;

    function invalidateCache() {
      cache = ReactCache.createCache(invalidateCache);
    }
    invalidateCache();
    TextResource = ReactCache.unstable_createResource(([text, ms = 0]) => {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          if (textResourceShouldFail) {
            ReactNoop.yield(`Promise rejected [${text}]`);
            reject(new Error('Failed to load: ' + text));
          } else {
            ReactNoop.yield(`Promise resolved [${text}]`);
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

  function advanceTimers(ms) {
    // Note: This advances Jest's virtual time but not React's. Use
    // ReactNoop.expire for that.
    if (typeof ms !== 'number') {
      throw new Error('Must specify ms');
    }
    jest.advanceTimersByTime(ms);
    // Wait until the end of the current tick
    return new Promise(resolve => {
      setImmediate(resolve);
    });
  }

  function Text(props) {
    ReactNoop.yield(props.text);
    return <span prop={props.text} ref={props.hostRef} />;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read(cache, [props.text, props.ms]);
      ReactNoop.yield(text);
      return <span prop={text} />;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        ReactNoop.yield(`Suspend! [${text}]`);
      } else {
        ReactNoop.yield(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('suspends rendering and continues later', async () => {
    function Bar(props) {
      ReactNoop.yield('Bar');
      return props.children;
    }

    function Foo() {
      ReactNoop.yield('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Bar>
            <AsyncText text="A" ms={100} />
            <Text text="B" />
          </Bar>
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);
    expect(ReactNoop.flush()).toEqual([
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
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Flush the promise completely
    await advanceTimers(50);
    // Renders successfully
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [A]',
      'Foo',
      'Bar',
      'A',
      'B',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('suspends siblings and later recovers each independently', async () => {
    // Render two sibling Suspense components
    ReactNoop.render(
      <Fragment>
        <Suspense maxDuration={1000} fallback={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Suspense>
        <Suspense maxDuration={3000} fallback={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Suspense>
      </Fragment>,
    );
    expect(ReactNoop.flush()).toEqual([
      'Suspend! [A]',
      'Loading A...',
      'Suspend! [B]',
      'Loading B...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time by enough to timeout both components and commit their placeholders
    ReactNoop.expire(4000);
    await advanceTimers(4000);

    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Loading A...'),
      span('Loading B...'),
    ]);

    // Advance time by enough that the first Suspense's promise resolves and
    // switches back to the normal view. The second Suspense should still
    // show the placeholder
    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [A]', 'A']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('Loading B...')]);

    // Advance time by enough that the second Suspense's promise resolves
    // and switches back to the normal view
    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [B]', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('continues rendering siblings after suspending', async () => {
    ReactNoop.render(
      <Suspense fallback={<Text text="Loading..." />}>
        <Text text="A" />
        <AsyncText text="B" />
        <Text text="C" />
        <Text text="D" />
      </Suspense>,
    );
    // B suspends. Continue rendering the remaining siblings.
    expect(ReactNoop.flush()).toEqual([
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
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [B]',
      'A',
      'B',
      'C',
      'D',
    ]);
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
    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <ErrorBoundary ref={errorBoundary}>
            <AsyncText text="Result" ms={1000} />
          </ErrorBoundary>
        </Suspense>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    textResourceShouldFail = true;
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    textResourceShouldFail = false;

    expect(ReactNoop.flush()).toEqual([
      'Promise rejected [Result]',
      'Error! [Result]',

      // React retries one more time
      'Error! [Result]',

      // Errored again on retry. Now handle it.
      'Caught error: Failed to load: Result',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Caught error: Failed to load: Result'),
    ]);

    // Reset the error boundary and cache, and try again.
    errorBoundary.current.reset();
    cache.invalidate();

    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]', 'Loading...']);
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Result]', 'Result']);
    expect(ReactNoop.getChildren()).toEqual([span('Result')]);
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
        <Suspense maxDuration={1000} fallback={<Text text="Loading..." />}>
          <ErrorBoundary ref={errorBoundary}>
            <AsyncText text="Result" ms={3000} />
          </ErrorBoundary>
        </Suspense>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.expire(2000);
    await advanceTimers(2000);
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    textResourceShouldFail = true;
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    textResourceShouldFail = false;

    expect(ReactNoop.flush()).toEqual([
      'Promise rejected [Result]',
      'Error! [Result]',

      // React retries one more time
      'Error! [Result]',

      // Errored again on retry. Now handle it.

      'Caught error: Failed to load: Result',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Caught error: Failed to load: Result'),
    ]);

    // Reset the error boundary and cache, and try again.
    errorBoundary.current.reset();
    cache.invalidate();

    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]', 'Loading...']);
    ReactNoop.expire(3000);
    await advanceTimers(3000);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Result]', 'Result']);
    expect(ReactNoop.getChildren()).toEqual([span('Result')]);
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
    ReactNoop.flush();
    await advanceTimers(0);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('1')]);

    // Update the low-pri text
    ReactNoop.render(<App highPri="A" lowPri="2" />);
    expect(ReactNoop.flush()).toEqual([
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
    expect(ReactNoop.flush()).toEqual(['B', '1']);
    expect(ReactNoop.getChildren()).toEqual([span('B'), span('1')]);

    // Unblock the low-pri text and finish
    await advanceTimers(0);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [2]']);
    expect(ReactNoop.getChildren()).toEqual([span('B'), span('1')]);
  });

  it('keeps working on lower priority work after being pinged', async () => {
    function App(props) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" />
          {props.showB && <Text text="B" />}
        </Suspense>
      );
    }

    ReactNoop.render(<App showB={false} />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [A]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance React's virtual time by enough to fall into a new async bucket.
    ReactNoop.expire(1200);
    ReactNoop.render(<App showB={true} />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [A]', 'B', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    await advanceTimers(0);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [A]', 'A', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('tries rendering a lower priority pending update even if a higher priority one suspends', async () => {
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
    ReactNoop.interactiveUpdates(() => {
      // High pri
      ReactNoop.render(<App />);
    });
    // Low pri
    ReactNoop.render(<App hide={true} />);

    expect(ReactNoop.flush()).toEqual([
      // The first update suspends
      'Suspend! [Async]',
      // but we have another pending update that we can work on
      '(empty)',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('(empty)')]);
  });

  it('forces an expiration after an update times out', async () => {
    ReactNoop.render(
      <Fragment>
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={20000} />
        </Suspense>
        <Text text="Sync" />
      </Fragment>,
    );

    expect(ReactNoop.flush()).toEqual([
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
    expect(ReactNoop.flushExpired()).toEqual([]);
    // Should have committed the placeholder.
    expect(ReactNoop.getChildren()).toEqual([span('Loading...'), span('Sync')]);

    // Once the promise resolves, we render the suspended view
    await advanceTimers(10000);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Async]', 'Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async'), span('Sync')]);
  });

  it('switches to an inner fallback even if it expires later', async () => {
    ReactNoop.render(
      <Fragment>
        <Text text="Sync" />
        <Suspense
          maxDuration={1000}
          fallback={<Text text="Loading outer..." />}>
          <AsyncText text="Outer content" ms={2000} />
          <Suspense
            maxDuration={2500}
            fallback={<Text text="Loading inner..." />}>
            <AsyncText text="Inner content" ms={5000} />
          </Suspense>
        </Suspense>
      </Fragment>,
    );

    expect(ReactNoop.flush()).toEqual([
      'Sync',
      // The async content suspends
      'Suspend! [Outer content]',
      'Suspend! [Inner content]',
      'Loading inner...',
      'Loading outer...',
    ]);
    // The update hasn't expired yet, so we commit nothing.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Expire the outer timeout, but don't expire the inner one.
    // We should see the outer loading placeholder.
    ReactNoop.expire(1500);
    await advanceTimers(1500);
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Loading outer...'),
    ]);

    // Resolve the outer promise.
    ReactNoop.expire(2000);
    await advanceTimers(2000);
    // At this point, 3.5 seconds have elapsed total. The outer placeholder
    // timed out at 1.5 seconds. So, 2 seconds have elapsed since the
    // placeholder timed out. That means we still haven't reached the 2.5 second
    // threshold of the inner placeholder.
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [Outer content]',
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
    // Now that 2.5 seconds have elapsed since the outer placeholder timed out,
    // we can timeout the inner placeholder.
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Outer content'),
      span('Loading inner...'),
    ]);

    // Finally, flush the inner promise. We should see the complete screen.
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [Inner content]',
      'Inner content',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Outer content'),
      span('Inner content'),
    ]);
  });

  it('renders an expiration boundary synchronously', async () => {
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
    expect(ReactNoop.clearYields()).toEqual([
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
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Async]', 'Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async'), span('Sync')]);
  });

  it('suspending inside an expired expiration boundary will bubble to the next one', async () => {
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
    expect(ReactNoop.clearYields()).toEqual([
      'Suspend! [Async]',
      'Suspend! [Loading (inner)...]',
      'Sync',
      'Loading (outer)...',
    ]);
    // The tree commits synchronously
    expect(ReactNoop.getChildren()).toEqual([span('Loading (outer)...')]);
  });

  it('expires early with a `maxDuration` option', async () => {
    ReactNoop.render(
      <Fragment>
        <Suspense maxDuration={1000} fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={3000} />
        </Suspense>
        <Text text="Sync" />
      </Fragment>,
    );

    expect(ReactNoop.flush()).toEqual([
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
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...'), span('Sync')]);

    // Once the promise resolves, we render the suspended view
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Async]', 'Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async'), span('Sync')]);
  });

  it('resolves successfully even if fallback render is pending', async () => {
    ReactNoop.render(
      <Suspense maxDuration={1000} fallback={<Text text="Loading..." />}>
        <AsyncText text="Async" ms={3000} />
      </Suspense>,
    );
    expect(ReactNoop.flushNextYield()).toEqual(['Suspend! [Async]']);
    await advanceTimers(1500);
    expect(ReactNoop.expire(1500)).toEqual([]);
    // Before we have a chance to flush, the promise resolves.
    await advanceTimers(2000);
    expect(ReactNoop.clearYields()).toEqual(['Promise resolved [Async]']);
    expect(ReactNoop.flush()).toEqual(['Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async')]);
  });

  it('throws a helpful error when an update is suspends without a placeholder', () => {
    expect(() => {
      ReactNoop.flushSync(() => ReactNoop.render(<AsyncText text="Async" />));
    }).toThrow('An update was suspended, but no placeholder UI was provided.');
  });

  it('a Suspense component correctly handles more than one suspended child', async () => {
    ReactNoop.render(
      <Suspense maxDuration={0} fallback={<Text text="Loading..." />}>
        <AsyncText text="A" ms={100} />
        <AsyncText text="B" ms={100} />
      </Suspense>,
    );
    expect(ReactNoop.expire(10000)).toEqual([
      'Suspend! [A]',
      'Suspend! [B]',
      'Loading...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    await advanceTimers(100);

    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [A]',
      'Promise resolved [B]',
      'A',
      'B',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('can resume rendering earlier than a timeout', async () => {
    ReactNoop.render(
      <Suspense maxDuration={1000} fallback={<Text text="Loading..." />}>
        <AsyncText text="Async" ms={100} />
      </Suspense>,
    );
    expect(ReactNoop.flush()).toEqual(['Suspend! [Async]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time by an amount slightly smaller than what's necessary to
    // resolve the promise
    await advanceTimers(99);

    // Nothing has rendered yet
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Resolve the promise
    await advanceTimers(1);
    // We can now resume rendering
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Async]', 'Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async')]);
  });

  it('starts working on an update even if its priority falls between two suspended levels', async () => {
    function App(props) {
      return (
        <Suspense fallback={<Text text="Loading..." />} maxDuration={10000}>
          {props.text === 'C' ? (
            <Text text="C" />
          ) : (
            <AsyncText text={props.text} ms={10000} />
          )}
        </Suspense>
      );
    }

    // Schedule an update
    ReactNoop.render(<App text="A" />);
    // The update should suspend.
    expect(ReactNoop.flush()).toEqual(['Suspend! [A]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time until right before it expires. This number may need to
    // change if the default expiration for low priority updates is adjusted.
    await advanceTimers(4999);
    ReactNoop.expire(4999);
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Schedule another low priority update.
    ReactNoop.render(<App text="B" />);
    // This update should also suspend.
    expect(ReactNoop.flush()).toEqual(['Suspend! [B]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Schedule a high priority update. Its expiration time will fall between
    // the expiration times of the previous two updates.
    ReactNoop.interactiveUpdates(() => {
      ReactNoop.render(<App text="C" />);
    });
    expect(ReactNoop.flush()).toEqual(['C']);
    expect(ReactNoop.getChildren()).toEqual([span('C')]);

    await advanceTimers(10000);
    // Flush the remaining work.
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [A]',
      'Promise resolved [B]',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('C')]);
  });

  it('flushes all expired updates in a single batch', async () => {
    class Foo extends React.Component {
      componentDidUpdate() {
        ReactNoop.yield('Commit: ' + this.props.text);
      }
      componentDidMount() {
        ReactNoop.yield('Commit: ' + this.props.text);
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

    ReactNoop.advanceTime(10000);
    jest.advanceTimersByTime(10000);

    expect(ReactNoop.flush()).toEqual([
      'Suspend! [goodbye]',
      'Loading...',
      'Commit: goodbye',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    ReactNoop.advanceTime(20000);
    await advanceTimers(20000);
    expect(ReactNoop.clearYields()).toEqual(['Promise resolved [goodbye]']);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

    expect(ReactNoop.flush()).toEqual(['goodbye']);
    expect(ReactNoop.getChildren()).toEqual([span('goodbye')]);
  });

  describe('a Delay component', () => {
    function Never() {
      // Throws a promise that resolves after some arbitrarily large
      // number of seconds. The idea is that this component will never
      // resolve. It's always wrapped by a Suspense.
      throw new Promise(resolve => setTimeout(() => resolve(), 10000));
    }

    function Delay({ms}) {
      // Once ms has elapsed, render null. This allows the rest of the
      // tree to resume rendering.
      return (
        <Suspense fallback={null} maxDuration={ms}>
          <Never />
        </Suspense>
      );
    }

    function DebouncedText({text, ms}) {
      return (
        <Fragment>
          <Delay ms={ms} />
          <Text text={text} />
        </Fragment>
      );
    }

    it('works', async () => {
      ReactNoop.render(<DebouncedText text="A" ms={1000} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([]);

      await advanceTimers(800);
      ReactNoop.expire(800);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([]);

      await advanceTimers(1000);
      ReactNoop.expire(1000);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('A')]);
    });
  });

  describe('sync mode', () => {
    it('times out immediately', async () => {
      function App() {
        return (
          <Suspense maxDuration={1000} fallback={<Text text="Loading..." />}>
            <AsyncText ms={100} text="Result" />
          </Suspense>
        );
      }

      // Times out immediately, ignoring the specified threshold.
      ReactNoop.renderLegacySyncRoot(<App />);
      expect(ReactNoop.clearYields()).toEqual([
        'Suspend! [Result]',
        'Loading...',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

      await advanceTimers(100);
      expect(ReactNoop.expire(100)).toEqual([
        'Promise resolved [Result]',
        'Result',
      ]);

      expect(ReactNoop.getChildren()).toEqual([span('Result')]);
    });

    it('times out immediately when Suspense is in loose mode, even if the suspender is async', async () => {
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
          <Suspense maxDuration={1000} fallback={<Spinner />}>
            <ConcurrentMode>
              <UpdatingText ref={text} />
              <Text text="Sibling" />
            </ConcurrentMode>
          </Suspense>
        );
      }

      // Initial mount. This is synchronous, because the root is sync.
      ReactNoop.renderLegacySyncRoot(<App />);
      await advanceTimers(100);
      expect(ReactNoop.clearYields()).toEqual([
        'Suspend! [Step: 1]',
        'Sibling',
        'Loading (1)',
        'Loading (2)',
        'Loading (3)',
        'Promise resolved [Step: 1]',
        'Step: 1',
      ]);
      expect(ReactNoop.getChildrenAsJSX()).toEqual(
        <React.Fragment>
          <span prop="Step: 1" />
          <span prop="Sibling" />
        </React.Fragment>,
      );

      // Update. This starts out asynchronously.
      text.current.setState({step: 2}, () =>
        ReactNoop.yield('Update did commit'),
      );

      // Suspend during an async render.
      expect(ReactNoop.flushNextYield()).toEqual(['Suspend! [Step: 2]']);
      expect(ReactNoop.flush()).toEqual([
        'Update did commit',
        // Switch to the placeholder in a subsequent commit
        'Loading (1)',
        'Loading (2)',
        'Loading (3)',
      ]);
      expect(ReactNoop.getChildrenAsJSX()).toEqual(
        <React.Fragment>
          <span hidden={true} prop="Sibling" />
          <span prop="Loading (1)" />
          <span prop="Loading (2)" />
          <span prop="Loading (3)" />
        </React.Fragment>,
      );

      await advanceTimers(100);
      expect(ReactNoop.flush()).toEqual([
        'Promise resolved [Step: 2]',
        'Step: 2',
      ]);
      expect(ReactNoop.getChildrenAsJSX()).toEqual(
        <React.Fragment>
          <span prop="Step: 2" />
          <span prop="Sibling" />
        </React.Fragment>,
      );
    });

    it(
      'continues rendering asynchronously even if a promise is captured by ' +
        'a sync boundary (default mode)',
      async () => {
        class UpdatingText extends React.Component {
          state = {text: this.props.initialText};
          render() {
            return this.props.children(this.state.text);
          }
        }

        const text1 = React.createRef(null);
        const text2 = React.createRef(null);
        function App() {
          return (
            <Fragment>
              <Suspense
                maxDuration={1000}
                fallback={<Text text="Loading..." />}>
                <ConcurrentMode>
                  <UpdatingText ref={text1} initialText="Async: 1">
                    {text => (
                      <Fragment>
                        <Text text="Before" />
                        <AsyncText text={text} />
                        <Text text="After" />
                      </Fragment>
                    )}
                  </UpdatingText>
                </ConcurrentMode>
              </Suspense>
              <ConcurrentMode>
                <UpdatingText ref={text2} initialText="Sync: 1">
                  {text => (
                    <Fragment>
                      <Text text="Before" />
                      <Text text={text} />
                      <Text text="After" />
                    </Fragment>
                  )}
                </UpdatingText>
              </ConcurrentMode>
            </Fragment>
          );
        }

        // Initial mount
        ReactNoop.renderLegacySyncRoot(<App />, () =>
          ReactNoop.yield('Did mount'),
        );
        await advanceTimers(100);
        expect(ReactNoop.clearYields()).toEqual([
          'Before',
          'Suspend! [Async: 1]',
          'After',
          'Before',
          'Sync: 1',
          'After',
          'Did mount',
          // The placeholder is rendered in a subsequent commit
          'Loading...',
          'Promise resolved [Async: 1]',
          'Async: 1',
        ]);
        expect(ReactNoop.getChildrenAsJSX()).toEqual(
          <React.Fragment>
            <span prop="Before" />
            <span prop="Async: 1" />
            <span prop="After" />

            <span prop="Before" />
            <span prop="Sync: 1" />
            <span prop="After" />
          </React.Fragment>,
        );

        // Update. This starts out asynchronously.
        text1.current.setState({text: 'Async: 2'}, () =>
          ReactNoop.yield('Update 1 did commit'),
        );
        text2.current.setState({text: 'Sync: 2'}, () =>
          ReactNoop.yield('Update 2 did commit'),
        );

        // Start rendering asynchronously
        ReactNoop.flushThrough(['Before']);

        // Now render the next child, which suspends
        expect(ReactNoop.flushNextYield()).toEqual([
          // This child suspends
          'Suspend! [Async: 2]',
        ]);
        expect(ReactNoop.flush()).toEqual([
          'After',
          'Before',
          'Sync: 2',
          'After',
          'Update 1 did commit',
          'Update 2 did commit',

          // Switch to the placeholder in a subsequent commit
          'Loading...',
        ]);
        expect(ReactNoop.getChildrenAsJSX()).toEqual(
          <React.Fragment>
            <span hidden={true} prop="Before" />
            <span hidden={true} prop="After" />
            <span prop="Loading..." />

            <span prop="Before" />
            <span prop="Sync: 2" />
            <span prop="After" />
          </React.Fragment>,
        );

        // When the placeholder is pinged, the boundary must be re-rendered
        // synchronously.
        await advanceTimers(100);
        expect(ReactNoop.clearYields()).toEqual([
          'Promise resolved [Async: 2]',
          'Async: 2',
        ]);

        expect(ReactNoop.getChildrenAsJSX()).toEqual(
          <React.Fragment>
            <span prop="Before" />
            <span prop="Async: 2" />
            <span prop="After" />

            <span prop="Before" />
            <span prop="Sync: 2" />
            <span prop="After" />
          </React.Fragment>,
        );
      },
    );

    it(
      'continues rendering asynchronously even if a promise is captured by ' +
        'a sync boundary (strict, non-concurrent)',
      async () => {
        class UpdatingText extends React.Component {
          state = {text: this.props.initialText};
          render() {
            return this.props.children(this.state.text);
          }
        }

        const text1 = React.createRef(null);
        const text2 = React.createRef(null);
        function App() {
          return (
            <StrictMode>
              <Suspense
                maxDuration={1000}
                fallback={<Text text="Loading..." />}>
                <ConcurrentMode>
                  <UpdatingText ref={text1} initialText="Async: 1">
                    {text => (
                      <Fragment>
                        <Text text="Before" />
                        <AsyncText text={text} />
                        <Text text="After" />
                      </Fragment>
                    )}
                  </UpdatingText>
                </ConcurrentMode>
              </Suspense>
              <ConcurrentMode>
                <UpdatingText ref={text2} initialText="Sync: 1">
                  {text => (
                    <Fragment>
                      <Text text="Before" />
                      <Text text={text} />
                      <Text text="After" />
                    </Fragment>
                  )}
                </UpdatingText>
              </ConcurrentMode>
            </StrictMode>
          );
        }

        // Initial mount
        ReactNoop.renderLegacySyncRoot(<App />, () =>
          ReactNoop.yield('Did mount'),
        );
        await advanceTimers(100);
        expect(ReactNoop.clearYields()).toEqual([
          'Before',
          'Suspend! [Async: 1]',
          'After',
          'Before',
          'Sync: 1',
          'After',
          'Did mount',
          // The placeholder is rendered in a subsequent commit
          'Loading...',
          'Promise resolved [Async: 1]',
          'Async: 1',
        ]);
        expect(ReactNoop.getChildrenAsJSX()).toEqual(
          <React.Fragment>
            <span prop="Before" />
            <span prop="Async: 1" />
            <span prop="After" />

            <span prop="Before" />
            <span prop="Sync: 1" />
            <span prop="After" />
          </React.Fragment>,
        );

        // Update. This starts out asynchronously.
        text1.current.setState({text: 'Async: 2'}, () =>
          ReactNoop.yield('Update 1 did commit'),
        );
        text2.current.setState({text: 'Sync: 2'}, () =>
          ReactNoop.yield('Update 2 did commit'),
        );

        // Start rendering asynchronously
        ReactNoop.flushThrough(['Before']);

        // Now render the next child, which suspends
        expect(ReactNoop.flushNextYield()).toEqual([
          // This child suspends
          'Suspend! [Async: 2]',
        ]);
        expect(ReactNoop.flush()).toEqual([
          'After',
          'Before',
          'Sync: 2',
          'After',
          'Update 1 did commit',
          'Update 2 did commit',

          // Switch to the placeholder in a subsequent commit
          'Loading...',
        ]);
        expect(ReactNoop.getChildrenAsJSX()).toEqual(
          <React.Fragment>
            <span hidden={true} prop="Before" />
            <span hidden={true} prop="After" />
            <span prop="Loading..." />

            <span prop="Before" />
            <span prop="Sync: 2" />
            <span prop="After" />
          </React.Fragment>,
        );

        // When the placeholder is pinged, the boundary must be re-rendered
        // synchronously.
        await advanceTimers(100);
        expect(ReactNoop.clearYields()).toEqual([
          'Promise resolved [Async: 2]',
          'Async: 2',
        ]);

        expect(ReactNoop.getChildrenAsJSX()).toEqual(
          <React.Fragment>
            <span prop="Before" />
            <span prop="Async: 2" />
            <span prop="After" />

            <span prop="Before" />
            <span prop="Sync: 2" />
            <span prop="After" />
          </React.Fragment>,
        );
      },
    );

    it('does not re-render siblings in loose mode', async () => {
      class TextWithLifecycle extends React.Component {
        componentDidMount() {
          ReactNoop.yield(`Mount [${this.props.text}]`);
        }
        componentDidUpdate() {
          ReactNoop.yield(`Update [${this.props.text}]`);
        }
        render() {
          return <Text {...this.props} />;
        }
      }

      class AsyncTextWithLifecycle extends React.Component {
        componentDidMount() {
          ReactNoop.yield(`Mount [${this.props.text}]`);
        }
        componentDidUpdate() {
          ReactNoop.yield(`Update [${this.props.text}]`);
        }
        render() {
          return <AsyncText {...this.props} />;
        }
      }

      function App() {
        return (
          <Suspense
            maxDuration={1000}
            fallback={<TextWithLifecycle text="Loading..." />}>
            <TextWithLifecycle text="A" />
            <AsyncTextWithLifecycle ms={100} text="B" />
            <TextWithLifecycle text="C" />
          </Suspense>
        );
      }

      ReactNoop.renderLegacySyncRoot(<App />, () =>
        ReactNoop.yield('Commit root'),
      );
      expect(ReactNoop.clearYields()).toEqual([
        'A',
        'Suspend! [B]',
        'C',

        'Mount [A]',
        'Mount [B]',
        'Mount [C]',
        'Commit root',

        // In a subsequent commit, render a placeholder
        'Loading...',
        // Force delete all the existing children when switching to the
        // placeholder. This should be a mount, not an update.
        'Mount [Loading...]',
      ]);
      expect(ReactNoop.getChildrenAsJSX()).toEqual(
        <React.Fragment>
          <span hidden={true} prop="A" />
          <span hidden={true} prop="C" />

          <span prop="Loading..." />
        </React.Fragment>,
      );

      await advanceTimers(1000);
      expect(ReactNoop.expire(1000)).toEqual(['Promise resolved [B]', 'B']);

      expect(ReactNoop.getChildrenAsJSX()).toEqual(
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
          ReactNoop.yield('constructor');
          try {
            TextResource.read(cache, [props.text, props.ms]);
            this.state = {text};
          } catch (promise) {
            if (typeof promise.then === 'function') {
              ReactNoop.yield(`Suspend! [${text}]`);
            } else {
              ReactNoop.yield(`Error! [${text}]`);
            }
            throw promise;
          }
        }
        componentDidMount() {
          ReactNoop.yield('componentDidMount');
        }
        render() {
          ReactNoop.yield(this.state.text);
          return <span prop={this.state.text} />;
        }
      }

      ReactNoop.renderLegacySyncRoot(
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncTextInConstructor ms={100} text="Hi" />
        </Suspense>,
      );

      expect(ReactNoop.clearYields()).toEqual([
        'constructor',
        'Suspend! [Hi]',
        'Loading...',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

      await advanceTimers(1000);
      expect(ReactNoop.clearYields()).toEqual([
        'Promise resolved [Hi]',
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
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
      await advanceTimers(100);
      expect(ReactNoop.getChildren()).toEqual([span('Hi')]);
    });
  });

  it('does not call lifecycles of a suspended component', async () => {
    class TextWithLifecycle extends React.Component {
      componentDidMount() {
        ReactNoop.yield(`Mount [${this.props.text}]`);
      }
      componentDidUpdate() {
        ReactNoop.yield(`Update [${this.props.text}]`);
      }
      componentWillUnmount() {
        ReactNoop.yield(`Unmount [${this.props.text}]`);
      }
      render() {
        return <Text {...this.props} />;
      }
    }

    class AsyncTextWithLifecycle extends React.Component {
      componentDidMount() {
        ReactNoop.yield(`Mount [${this.props.text}]`);
      }
      componentDidUpdate() {
        ReactNoop.yield(`Update [${this.props.text}]`);
      }
      componentWillUnmount() {
        ReactNoop.yield(`Unmount [${this.props.text}]`);
      }
      render() {
        const text = this.props.text;
        const ms = this.props.ms;
        try {
          TextResource.read(cache, [text, ms]);
          ReactNoop.yield(text);
          return <span prop={text} />;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            ReactNoop.yield(`Suspend! [${text}]`);
          } else {
            ReactNoop.yield(`Error! [${text}]`);
          }
          throw promise;
        }
      }
    }

    function App() {
      return (
        <Suspense
          maxDuration={1000}
          fallback={<TextWithLifecycle text="Loading..." />}>
          <TextWithLifecycle text="A" />
          <AsyncTextWithLifecycle ms={100} text="B" />
          <TextWithLifecycle text="C" />
        </Suspense>
      );
    }

    ReactNoop.renderLegacySyncRoot(<App />, () =>
      ReactNoop.yield('Commit root'),
    );
    expect(ReactNoop.clearYields()).toEqual([
      'A',
      'Suspend! [B]',
      'C',

      'Mount [A]',
      // B's lifecycle should not fire because it suspended
      // 'Mount [B]',
      'Mount [C]',
      'Commit root',

      // In a subsequent commit, render a placeholder
      'Loading...',
      'Mount [Loading...]',
    ]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <span hidden={true} prop="A" />
        <span hidden={true} prop="C" />
        <span prop="Loading..." />
      </React.Fragment>,
    );
  });
});

// TODO:
// An update suspends, timeout is scheduled. Update again with different timeout.
// An update suspends, a higher priority update also suspends, each has different timeouts.
// Can update siblings of a timed out placeholder without suspending
// Pinging during the render phase
// Synchronous thenable
// Start time is computed using earliest suspended time
