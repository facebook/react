let React;
let ReactFeatureFlags;
let Fragment;
let ReactNoop;
let SimpleCacheProvider;
let Placeholder;
let StrictMode;
let AsyncMode;
let lazy;

let cache;
let TextResource;
let textResourceShouldFail;

describe('ReactSuspense', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactFeatureFlags.enableSuspense = true;
    React = require('react');
    Fragment = React.Fragment;
    ReactNoop = require('react-noop-renderer');
    SimpleCacheProvider = require('simple-cache-provider');
    Placeholder = React.Placeholder;
    StrictMode = React.StrictMode;
    AsyncMode = React.unstable_AsyncMode;
    lazy = React.lazy;

    function invalidateCache() {
      cache = SimpleCacheProvider.createCache(invalidateCache);
    }
    invalidateCache();
    TextResource = SimpleCacheProvider.createResource(([text, ms = 0]) => {
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

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
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
        <Placeholder>
          <Bar>
            <AsyncText text="A" ms={100} />
            <Text text="B" />
          </Bar>
        </Placeholder>
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
    // Render two sibling Placeholder components
    ReactNoop.render(
      <Fragment>
        <Placeholder delayMs={1000} fallback={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Placeholder>
        <Placeholder delayMs={3000} fallback={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Placeholder>
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

    // Advance time by enough that the first Placeholder's promise resolves and
    // switches back to the normal view. The second Placeholder should still
    // show the placeholder
    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [A]', 'A']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('Loading B...')]);

    // Advance time by enough that the second Placeholder's promise resolves
    // and switches back to the normal view
    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [B]', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('continues rendering siblings after suspending', async () => {
    ReactNoop.render(
      <Placeholder>
        <Text text="A" />
        <AsyncText text="B" />
        <Text text="C" />
        <Text text="D" />
      </Placeholder>,
    );
    // B suspends. Continue rendering the remaining siblings.
    expect(ReactNoop.flush()).toEqual(['A', 'Suspend! [B]', 'C', 'D']);
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
        <Placeholder>
          <ErrorBoundary ref={errorBoundary}>
            <AsyncText text="Result" ms={1000} />
          </ErrorBoundary>
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]']);
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

    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]']);
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
        <Placeholder delayMs={1000} fallback={<Text text="Loading..." />}>
          <ErrorBoundary ref={errorBoundary}>
            <AsyncText text="Result" ms={3000} />
          </ErrorBoundary>
        </Placeholder>
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
        <Placeholder>
          <Text text={props.highPri} />
          <AsyncText text={props.lowPri} />
        </Placeholder>
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
        <Placeholder>
          <AsyncText text="A" />
          {props.showB && <Text text="B" />}
        </Placeholder>
      );
    }

    ReactNoop.render(<App showB={false} />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [A]']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance React's virtual time by enough to fall into a new async bucket.
    ReactNoop.expire(1200);
    ReactNoop.render(<App showB={true} />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [A]', 'B']);
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
        <Placeholder>
          <AsyncText ms={2000} text="Async" />
        </Placeholder>
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
        <Placeholder fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={20000} />
        </Placeholder>
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
        <Placeholder delayMs={1000} fallback={<Text text="Loading outer..." />}>
          <AsyncText text="Outer content" ms={2000} />
          <Placeholder
            delayMs={2500}
            fallback={<Text text="Loading inner..." />}>
            <AsyncText text="Inner content" ms={5000} />
          </Placeholder>
        </Placeholder>
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
          <Placeholder fallback={<Text text="Loading..." />}>
            <AsyncText text="Async" />
          </Placeholder>
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
          <Placeholder fallback={<Text text="Loading (outer)..." />}>
            <Placeholder fallback={<AsyncText text="Loading (inner)..." />}>
              <AsyncText text="Async" />
            </Placeholder>
            <Text text="Sync" />
          </Placeholder>
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

  it('expires early with a `delayMs` option', async () => {
    ReactNoop.render(
      <Fragment>
        <Placeholder delayMs={1000} fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={3000} />
        </Placeholder>
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

  it('throws a helpful error when an update is suspends without a placeholder', () => {
    expect(() => {
      ReactNoop.flushSync(() =>
        ReactNoop.render(
          <Placeholder>{() => <AsyncText text="Async" />}</Placeholder>,
        ),
      );
    }).toThrow('An update was suspended, but no placeholder UI was provided.');
  });

  it('a Placeholder component correctly handles more than one suspended child', async () => {
    ReactNoop.render(
      <Placeholder delayMs={0}>
        <AsyncText text="A" ms={100} />
        <AsyncText text="B" ms={100} />
      </Placeholder>,
    );
    expect(ReactNoop.expire(10000)).toEqual(['Suspend! [A]', 'Suspend! [B]']);
    expect(ReactNoop.getChildren()).toEqual([]);

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
      <Placeholder delayMs={1000} fallback={<Text text="Loading..." />}>
        <AsyncText text="Async" ms={100} />
      </Placeholder>,
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
        <Placeholder delayMs={10000}>
          {props.text === 'C' ? (
            <Text text="C" />
          ) : (
            <AsyncText text={props.text} ms={10000} />
          )}
        </Placeholder>
      );
    }

    // Schedule an update
    ReactNoop.render(<App text="A" />);
    // The update should suspend.
    expect(ReactNoop.flush()).toEqual(['Suspend! [A]']);
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
    expect(ReactNoop.flush()).toEqual(['Suspend! [B]']);
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

  it('can hide a tree to unblock its surroundings', async () => {
    function App() {
      return (
        <Placeholder delayMs={1000}>
          {didTimeout => (
            <Fragment>
              <div hidden={didTimeout}>
                <AsyncText text="Async" ms={3000} />
              </div>
              {didTimeout ? <Text text="Loading..." /> : null}
            </Fragment>
          )}
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Async]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.expire(2000);
    await advanceTimers(2000);
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(), span('Loading...')]);

    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [Async]', 'Async']);
    expect(ReactNoop.getChildren()).toEqual([div(span('Async'))]);
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
          <Placeholder fallback={<Text text="Loading..." />}>
            <AsyncText ms={20000} text={this.props.text} />
          </Placeholder>
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
      // resolve. It's always wrapped by a Placeholder.
      throw new Promise(resolve => setTimeout(() => resolve(), 10000));
    }

    function Delay({ms}) {
      return (
        <Placeholder delayMs={ms}>
          {didTimeout => {
            if (didTimeout) {
              // Once ms has elapsed, render null. This allows the rest of the
              // tree to resume rendering.
              return null;
            }
            return <Never />;
          }}
        </Placeholder>
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
          <Placeholder delayMs={1000} fallback={<Text text="Loading..." />}>
            <AsyncText ms={100} text="Result" />
          </Placeholder>
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

    it('times out immediately when Placeholder is in loose mode, even if the suspender is async', async () => {
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
          <Placeholder delayMs={1000} fallback={<Spinner />}>
            <AsyncMode>
              <UpdatingText ref={text} />
              <Text text="Sibling" />
            </AsyncMode>
          </Placeholder>
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
        'Sibling',
      ]);
      expect(ReactNoop.getChildren()).toEqual([
        span('Step: 1'),
        span('Sibling'),
      ]);

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
      expect(ReactNoop.getChildren()).toEqual([
        span('Loading (1)'),
        span('Loading (2)'),
        span('Loading (3)'),
      ]);

      await advanceTimers(100);
      expect(ReactNoop.flush()).toEqual([
        'Promise resolved [Step: 2]',
        // TODO: The state of the children is lost when switching back. Revisit
        // this in the follow up PR.
        'Step: 1',
        'Sibling',
      ]);
      expect(ReactNoop.getChildren()).toEqual([
        span('Step: 1'),
        span('Sibling'),
      ]);
    });

    it(
      'continues rendering asynchronously even if a promise is captured by ' +
        'a sync boundary (strict)',
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
              <Placeholder delayMs={1000} fallback={<Text text="Loading..." />}>
                <AsyncMode>
                  <UpdatingText ref={text1} initialText="Async: 1">
                    {text => (
                      <Fragment>
                        <Text text="Before" />
                        <AsyncText text={text} />
                        <Text text="After" />
                      </Fragment>
                    )}
                  </UpdatingText>
                </AsyncMode>
              </Placeholder>
              <AsyncMode>
                <UpdatingText ref={text2} initialText="Sync: 1">
                  {text => (
                    <Fragment>
                      <Text text="Before" />
                      <Text text={text} />
                      <Text text="After" />
                    </Fragment>
                  )}
                </UpdatingText>
              </AsyncMode>
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
          'Loading...',
          'Before',
          'Sync: 1',
          'After',
          'Did mount',
          'Promise resolved [Async: 1]',
          'Before',
          'Async: 1',
          'After',
        ]);
        expect(ReactNoop.getChildren()).toEqual([
          span('Before'),
          span('Async: 1'),
          span('After'),

          span('Before'),
          span('Sync: 1'),
          span('After'),
        ]);

        // Update. This starts out asynchronously.
        text1.current.setState({text: 'Async: 2'}, () =>
          ReactNoop.yield('Update 1 did commit'),
        );
        text2.current.setState({text: 'Sync: 2'}, () =>
          ReactNoop.yield('Update 2 did commit'),
        );

        // Start rendering asynchronously
        ReactNoop.flushThrough([
          'Before',
          // This child suspends
          'Suspend! [Async: 2]',
          // But we can still render the rest of the async tree asynchronously
          'After',
        ]);

        // Suspend during an async render.
        expect(ReactNoop.flushNextYield()).toEqual(['Loading...']);
        expect(ReactNoop.flush()).toEqual(['Before', 'Sync: 2', 'After']);
        // Commit was suspended.
        expect(ReactNoop.getChildren()).toEqual([
          span('Before'),
          span('Async: 1'),
          span('After'),

          span('Before'),
          span('Sync: 1'),
          span('After'),
        ]);

        // When the placeholder is pinged, the boundary re-
        // renders asynchronously.
        ReactNoop.expire(100);
        await advanceTimers(100);
        expect(ReactNoop.flush()).toEqual([
          'Promise resolved [Async: 2]',
          'Before',
          'Async: 2',
          'After',
          'Before',
          'Sync: 2',
          'After',
          'Update 1 did commit',
          'Update 2 did commit',
        ]);

        expect(ReactNoop.getChildren()).toEqual([
          span('Before'),
          span('Async: 2'),
          span('After'),

          span('Before'),
          span('Sync: 2'),
          span('After'),
        ]);
      },
    );

    it(
      'continues rendering asynchronously even if a promise is captured by ' +
        'a sync boundary (loose)',
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
              <Placeholder delayMs={1000} fallback={<Text text="Loading..." />}>
                <AsyncMode>
                  <UpdatingText ref={text1} initialText="Async: 1">
                    {text => (
                      <Fragment>
                        <Text text="Before" />
                        <AsyncText text={text} />
                        <Text text="After" />
                      </Fragment>
                    )}
                  </UpdatingText>
                </AsyncMode>
              </Placeholder>
              <AsyncMode>
                <UpdatingText ref={text2} initialText="Sync: 1">
                  {text => (
                    <Fragment>
                      <Text text="Before" />
                      <Text text={text} />
                      <Text text="After" />
                    </Fragment>
                  )}
                </UpdatingText>
              </AsyncMode>
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
          'Before',
          'Async: 1',
          'After',
        ]);
        expect(ReactNoop.getChildren()).toEqual([
          span('Before'),
          span('Async: 1'),
          span('After'),

          span('Before'),
          span('Sync: 1'),
          span('After'),
        ]);

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
        expect(ReactNoop.getChildren()).toEqual([
          span('Loading...'),

          span('Before'),
          span('Sync: 2'),
          span('After'),
        ]);

        // When the placeholder is pinged, the boundary must be re-rendered
        // synchronously.
        await advanceTimers(100);
        expect(ReactNoop.clearYields()).toEqual([
          'Promise resolved [Async: 2]',
          'Before',
          'Async: 1',
          'After',
        ]);

        expect(ReactNoop.getChildren()).toEqual([
          span('Before'),
          // TODO: The state of the children is lost when switching back. Revisit
          // this in the follow up PR.
          span('Async: 1'),
          span('After'),

          span('Before'),
          span('Sync: 2'),
          span('After'),
        ]);
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
          <Placeholder
            delayMs={1000}
            fallback={<TextWithLifecycle text="Loading..." />}>
            <TextWithLifecycle text="A" />
            <AsyncTextWithLifecycle ms={100} text="B" />
            <TextWithLifecycle text="C" />
          </Placeholder>
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
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);

      await advanceTimers(1000);
      expect(ReactNoop.expire(1000)).toEqual([
        'Promise resolved [B]',
        'A',
        'B',
        'C',
        // 'A' matched with the placeholder. It's ok to reuse children when
        // switching back. Though in a real app you probably don't want to.
        // TODO: This is wrong. The timed out children and the placeholder
        // should be siblings in async mode. Revisit in follow-up PR.
        'Update [A]',
        'Mount [B]',
        'Mount [C]',
      ]);

      expect(ReactNoop.getChildren()).toEqual([
        span('A'),
        span('B'),
        span('C'),
      ]);
    });

    it('suspends inside constructor', async () => {
      class AsyncTextInConstructor extends React.Component {
        constructor(props) {
          super(props);
          const text = props.text;
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
        render() {
          ReactNoop.yield(this.state.text);
          return <span prop={this.state.text} />;
        }
      }

      ReactNoop.renderLegacySyncRoot(
        <Placeholder fallback={<Text text="Loading..." />}>
          <AsyncTextInConstructor ms={100} text="Hi" />
        </Placeholder>,
      );

      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
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
            <Placeholder fallback={<Fallback />}>
              <AsyncText text="Hi" ms={100} />
            </Placeholder>
          );
        }
      }

      ReactNoop.renderLegacySyncRoot(<Demo />);
      expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
      await advanceTimers(100);
      expect(ReactNoop.getChildren()).toEqual([span('Hi')]);
    });
  });

  describe('Promise as element type', () => {
    it('accepts a promise as an element type', async () => {
      const LazyText = Promise.resolve(Text);

      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyText text="Hi" />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);

      await LazyText;

      expect(ReactNoop.flush()).toEqual(['Hi']);
      expect(ReactNoop.getChildren()).toEqual([span('Hi')]);

      // Should not suspend on update
      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyText text="Hi again" />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Hi again']);
      expect(ReactNoop.getChildren()).toEqual([span('Hi again')]);
    });

    it('throws if promise rejects', async () => {
      const LazyText = Promise.reject(new Error('Bad network'));

      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyText text="Hi" />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Loading...']);

      await LazyText.catch(() => {});

      expect(() => ReactNoop.flush()).toThrow('Bad network');
    });

    it('mount and reorder', async () => {
      class Child extends React.Component {
        componentDidMount() {
          ReactNoop.yield('Did mount: ' + this.props.label);
        }
        componentDidUpdate() {
          ReactNoop.yield('Did update: ' + this.props.label);
        }
        render() {
          return <Text text={this.props.label} />;
        }
      }

      const LazyChildA = Promise.resolve(Child);
      const LazyChildB = Promise.resolve(Child);

      function Parent({swap}) {
        return (
          <Placeholder fallback={<Text text="Loading..." />}>
            {swap
              ? [
                  <LazyChildB key="B" label="B" />,
                  <LazyChildA key="A" label="A" />,
                ]
              : [
                  <LazyChildA key="A" label="A" />,
                  <LazyChildB key="B" label="B" />,
                ]}
          </Placeholder>
        );
      }

      ReactNoop.render(<Parent swap={false} />);
      expect(ReactNoop.flush()).toEqual(['Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);

      await LazyChildA;
      await LazyChildB;

      expect(ReactNoop.flush()).toEqual([
        'A',
        'B',
        'Did mount: A',
        'Did mount: B',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);

      // Swap the position of A and B
      ReactNoop.render(<Parent swap={true} />);
      expect(ReactNoop.flush()).toEqual([
        'B',
        'A',
        'Did update: B',
        'Did update: A',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('B'), span('A')]);
    });

    it('uses `default` property, if it exists', async () => {
      const LazyText = Promise.resolve({default: Text});

      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyText text="Hi" />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);

      await LazyText;

      expect(ReactNoop.flush()).toEqual(['Hi']);
      expect(ReactNoop.getChildren()).toEqual([span('Hi')]);

      // Should not suspend on update
      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyText text="Hi again" />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Hi again']);
      expect(ReactNoop.getChildren()).toEqual([span('Hi again')]);
    });

    it('resolves defaultProps, on mount and update', async () => {
      function T(props) {
        return <Text {...props} />;
      }
      T.defaultProps = {text: 'Hi'};
      const LazyText = Promise.resolve(T);

      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyText />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);

      await LazyText;

      expect(ReactNoop.flush()).toEqual(['Hi']);
      expect(ReactNoop.getChildren()).toEqual([span('Hi')]);

      T.defaultProps = {text: 'Hi again'};

      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyText text="Hi again" />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Hi again']);
      expect(ReactNoop.getChildren()).toEqual([span('Hi again')]);
    });

    it('resolves defaultProps without breaking memoization', async () => {
      function LazyImpl(props) {
        ReactNoop.yield('Lazy');
        return (
          <Fragment>
            <Text text={props.siblingText} />
            {props.children}
          </Fragment>
        );
      }
      LazyImpl.defaultProps = {siblingText: 'Sibling'};
      const Lazy = Promise.resolve(LazyImpl);

      class Stateful extends React.Component {
        state = {text: 'A'};
        render() {
          return <Text text={this.state.text} />;
        }
      }

      const stateful = React.createRef(null);
      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <Lazy>
            <Stateful ref={stateful} />
          </Lazy>
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);
      await Lazy;
      expect(ReactNoop.flush()).toEqual(['Lazy', 'Sibling', 'A']);
      expect(ReactNoop.getChildren()).toEqual([span('Sibling'), span('A')]);

      // Lazy should not re-render
      stateful.current.setState({text: 'B'});
      expect(ReactNoop.flush()).toEqual(['B']);
      expect(ReactNoop.getChildren()).toEqual([span('Sibling'), span('B')]);
    });

    it('lazy-load using React.lazy', async () => {
      const LazyText = lazy(() => {
        ReactNoop.yield('Started loading');
        return Promise.resolve(Text);
      });

      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <Text text="A" />
          <Text text="B" />
          <LazyText text="C" />
        </Placeholder>,
      );
      // Render first two siblings. The lazy component should not have
      // started loading yet.
      ReactNoop.flushThrough(['A', 'B']);

      // Flush the rest.
      expect(ReactNoop.flush()).toEqual(['Started loading', 'Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);

      await LazyText;

      expect(ReactNoop.flush()).toEqual(['A', 'B', 'C']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A'),
        span('B'),
        span('C'),
      ]);
    });

    it('includes lazy-loaded component in warning stack', async () => {
      const LazyFoo = lazy(() => {
        ReactNoop.yield('Started loading');
        const Foo = props => (
          <div>{[<Text text="A" />, <Text text="B" />]}</div>
        );
        return Promise.resolve(Foo);
      });

      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyFoo />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Started loading', 'Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);

      await LazyFoo;
      expect(() => {
        expect(ReactNoop.flush()).toEqual(['A', 'B']);
      }).toWarnDev('    in Text (at **)\n' + '    in Foo (at **)');
      expect(ReactNoop.getChildren()).toEqual([div(span('A'), span('B'))]);
    });

    it('supports class and forwardRef components', async () => {
      const LazyClass = lazy(() => {
        class Foo extends React.Component {
          render() {
            return <Text text="Foo" />;
          }
        }
        return Promise.resolve(Foo);
      });

      const LazyForwardRef = lazy(() => {
        const Bar = React.forwardRef((props, ref) => (
          <Text text="Bar" hostRef={ref} />
        ));
        return Promise.resolve(Bar);
      });

      const ref = React.createRef();
      ReactNoop.render(
        <Placeholder fallback={<Text text="Loading..." />}>
          <LazyClass />
          <LazyForwardRef ref={ref} />
        </Placeholder>,
      );
      expect(ReactNoop.flush()).toEqual(['Loading...']);
      expect(ReactNoop.getChildren()).toEqual([]);
      expect(ref.current).toBe(null);

      await LazyClass;
      await LazyForwardRef;
      expect(ReactNoop.flush()).toEqual(['Foo', 'Bar']);
      expect(ReactNoop.getChildren()).toEqual([span('Foo'), span('Bar')]);
      expect(ref.current).not.toBe(null);
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
        <Placeholder
          delayMs={1000}
          fallback={<TextWithLifecycle text="Loading..." />}>
          <TextWithLifecycle text="A" />
          <AsyncTextWithLifecycle ms={100} text="B" />
          <TextWithLifecycle text="C" />
        </Placeholder>
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

      // A, B, and C are unmounted, but we skip calling B's componentWillUnmount
      'Unmount [A]',
      'Unmount [C]',

      // Force delete all the existing children when switching to the
      // placeholder. This should be a mount, not an update.
      'Mount [Loading...]',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
  });
});

// TODO:
// An update suspends, timeout is scheduled. Update again with different timeout.
// An update suspends, a higher priority update also suspends, each has different timeouts.
// Can update siblings of a timed out placeholder without suspending
// Pinging during the render phase
// Synchronous thenable
// Start time is computed using earliest suspended time
