let React;
let ReactFeatureFlags;
let Fragment;
let ReactNoop;
let SimpleCacheProvider;
let Timeout;

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
    Timeout = React.Timeout;

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
    return <span prop={props.text} />;
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

  function Fallback(props) {
    return (
      <Timeout ms={props.timeout}>
        {didExpire => (didExpire ? props.placeholder : props.children)}
      </Timeout>
    );
  }
  it('suspends rendering and continues later', async () => {
    function Bar(props) {
      ReactNoop.yield('Bar');
      return props.children;
    }

    function Foo() {
      ReactNoop.yield('Foo');
      return (
        <Fallback>
          <Bar>
            <AsyncText text="A" ms={100} />
            <Text text="B" />
          </Bar>
        </Fallback>
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
    // Render two sibling Timeout components
    ReactNoop.render(
      <Fragment>
        <Fallback timeout={1000} placeholder={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Fallback>
        <Fallback timeout={3000} placeholder={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Fallback>
      </Fragment>,
    );
    expect(ReactNoop.flush()).toEqual(['Suspend! [A]', 'Suspend! [B]']);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time by enough to timeout both components and commit their placeholders
    ReactNoop.expire(4000);
    await advanceTimers(4000);

    expect(ReactNoop.flush()).toEqual([
      'Suspend! [A]',
      'Loading A...',
      'Suspend! [B]',
      'Loading B...',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Loading A...'),
      span('Loading B...'),
    ]);

    // Advance time by enough that the first Timeout's promise resolves
    // and switches back to the normal view. The second Timeout should still show the placeholder
    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [A]', 'A']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('Loading B...')]);

    // Advance time by enough that the second Timeout's promise resolves
    // and switches back to the normal view
    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [B]', 'B']);
    expect(ReactNoop.getChildren()).toEqual([span('A'), span('B')]);
  });

  it('continues rendering siblings after suspending', async () => {
    ReactNoop.render(
      <Fallback>
        <Text text="A" />
        <AsyncText text="B" />
        <Text text="C" />
        <Text text="D" />
      </Fallback>,
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
        <Fallback>
          <ErrorBoundary ref={errorBoundary}>
            <AsyncText text="Result" ms={1000} />
          </ErrorBoundary>
        </Fallback>
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
        <Fallback timeout={1000} placeholder={<Text text="Loading..." />}>
          <ErrorBoundary ref={errorBoundary}>
            <AsyncText text="Result" ms={3000} />
          </ErrorBoundary>
        </Fallback>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]']);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.expire(2000);
    await advanceTimers(2000);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]', 'Loading...']);
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

    expect(ReactNoop.flush()).toEqual(['Suspend! [Result]']);
    ReactNoop.expire(3000);
    await advanceTimers(3000);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Result]', 'Result']);
    expect(ReactNoop.getChildren()).toEqual([span('Result')]);
  });

  it('can update at a higher priority while in a suspended state', async () => {
    function App(props) {
      return (
        <Fallback>
          <Text text={props.highPri} />
          <AsyncText text={props.lowPri} />
        </Fallback>
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
        <Fallback>
          <AsyncText text="A" />
          {props.showB && <Text text="B" />}
        </Fallback>
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
        <Fallback>
          <AsyncText ms={2000} text="Async" />
        </Fallback>
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

  it('coalesces all async updates when in a suspended state', async () => {
    ReactNoop.render(
      <Fallback>
        <AsyncText text="A" />
      </Fallback>,
    );
    ReactNoop.flush();
    await advanceTimers(0);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    ReactNoop.render(
      <Fallback>
        <AsyncText text="B" ms={50} />
      </Fallback>,
    );
    expect(ReactNoop.flush()).toEqual(['Suspend! [B]']);
    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    // Advance React's virtual time so that C falls into a new expiration bucket
    ReactNoop.expire(1000);
    ReactNoop.render(
      <Fallback>
        <AsyncText text="C" ms={100} />
      </Fallback>,
    );
    expect(ReactNoop.flush()).toEqual([
      // Tries C first, since it has a later expiration time
      'Suspend! [C]',
      // Does not retry B, because its promise has not resolved yet.
    ]);

    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    // Unblock B
    await advanceTimers(90);
    // Even though B's promise resolved, the view is still suspended because it
    // coalesced with C.
    expect(ReactNoop.flush()).toEqual(['Promise resolved [B]']);
    expect(ReactNoop.getChildren()).toEqual([span('A')]);

    // Unblock C
    await advanceTimers(50);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [C]', 'C']);
    expect(ReactNoop.getChildren()).toEqual([span('C')]);
  });

  it('forces an expiration after an update times out', async () => {
    ReactNoop.render(
      <Fragment>
        <Fallback placeholder={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={20000} />
        </Fallback>
        <Text text="Sync" />
      </Fragment>,
    );

    expect(ReactNoop.flush()).toEqual([
      // The async child suspends
      'Suspend! [Async]',
      // Continue on the sibling
      'Sync',
    ]);
    // The update hasn't expired yet, so we commit nothing.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance both React's virtual time and Jest's timers by enough to expire
    // the update, but not by enough to flush the suspending promise.
    ReactNoop.expire(10000);
    await advanceTimers(10000);
    expect(ReactNoop.flushExpired()).toEqual([
      // Still suspended.
      'Suspend! [Async]',
      // Now that the update has expired, we render the fallback UI
      'Loading...',
      'Sync',
    ]);
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
        <Fallback timeout={1000} placeholder={<Text text="Loading outer..." />}>
          <AsyncText text="Outer content" ms={2000} />
          <Fallback
            timeout={3000}
            placeholder={<Text text="Loading inner..." />}>
            <AsyncText text="Inner content" ms={4000} />
          </Fallback>
        </Fallback>
      </Fragment>,
    );

    expect(ReactNoop.flush()).toEqual([
      'Sync',
      // The async content suspends
      'Suspend! [Outer content]',
      'Suspend! [Inner content]',
    ]);
    // The update hasn't expired yet, so we commit nothing.
    expect(ReactNoop.getChildren()).toEqual([]);

    // Expire the outer timeout, but don't expire the inner one.
    // We should see the outer loading placeholder.
    ReactNoop.expire(1500);
    await advanceTimers(1500);
    expect(ReactNoop.flush()).toEqual([
      'Sync',
      // Still suspended.
      'Suspend! [Outer content]',
      'Suspend! [Inner content]',
      // We attempt to fallback to the inner placeholder
      'Loading inner...',
      // But the outer content is still suspended, so we need to fallback to
      // the outer placeholder.
      'Loading outer...',
    ]);

    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Loading outer...'),
    ]);

    // Resolve the outer content's promise
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [Outer content]',
      'Outer content',
      // Inner content still hasn't loaded
      'Suspend! [Inner content]',
      'Loading inner...',
    ]);
    // We should now see the inner fallback UI.
    expect(ReactNoop.getChildren()).toEqual([
      span('Sync'),
      span('Outer content'),
      span('Loading inner...'),
    ]);

    // Finally, flush the inner promise. We should see the complete screen.
    ReactNoop.expire(3000);
    await advanceTimers(3000);
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
          <Fallback placeholder={<Text text="Loading..." />}>
            <AsyncText text="Async" />
          </Fallback>
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
          <Fallback placeholder={<Text text="Loading (outer)..." />}>
            <Fallback placeholder={<AsyncText text="Loading (inner)..." />}>
              <AsyncText text="Async" />
            </Fallback>
            <Text text="Sync" />
          </Fallback>
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

  it('expires early with a `timeout` option', async () => {
    ReactNoop.render(
      <Fragment>
        <Fallback timeout={1000} placeholder={<Text text="Loading..." />}>
          <AsyncText text="Async" ms={3000} />
        </Fallback>
        <Text text="Sync" />
      </Fragment>,
    );

    expect(ReactNoop.flush()).toEqual([
      // The async child suspends
      'Suspend! [Async]',
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
    expect(ReactNoop.flush()).toEqual([
      // Still suspended.
      'Suspend! [Async]',
      // Now that the expiration view has timed out, we render the fallback UI
      'Loading...',
      'Sync',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...'), span('Sync')]);

    // Once the promise resolves, we render the suspended view
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Async]', 'Async']);
    expect(ReactNoop.getChildren()).toEqual([span('Async'), span('Sync')]);
  });

  it('throws a helpful error when a synchronous update is suspended', () => {
    expect(() => {
      ReactNoop.flushSync(() =>
        ReactNoop.render(<Timeout>{() => <AsyncText text="Async" />}</Timeout>),
      );
    }).toThrow(
      'A synchronous update was suspended, but no fallback UI was provided.',
    );
  });

  it('throws a helpful error when an expired update is suspended', async () => {
    ReactNoop.render(
      <Timeout>{() => <AsyncText text="Async" ms={20000} />}</Timeout>,
    );
    expect(ReactNoop.flush()).toEqual(['Suspend! [Async]']);
    await advanceTimers(10000);
    expect(() => {
      ReactNoop.expire(10000);
    }).toThrow(
      'An update was suspended for longer than the timeout, but no fallback ' +
        'UI was provided.',
    );
  });

  it('a Timeout component correctly handles more than one suspended child', async () => {
    ReactNoop.render(
      <Fallback timeout={0}>
        <AsyncText text="A" ms={100} />
        <AsyncText text="B" ms={100} />
      </Fallback>,
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
      <Fallback timeout={1000} placeholder={<Text text="Loading..." />}>
        <AsyncText text="Async" ms={100} />
      </Fallback>,
    );
    expect(ReactNoop.flush()).toEqual(['Suspend! [Async]']);
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
        <Fallback timeout={10000}>
          {props.text === 'C' ? (
            <Text text="C" />
          ) : (
            <AsyncText text={props.text} ms={10000} />
          )}
        </Fallback>
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
        <Timeout ms={1000}>
          {didTimeout => (
            <Fragment>
              <div hidden={didTimeout}>
                <AsyncText text="Async" ms={3000} />
              </div>
              {didTimeout ? <Text text="Loading..." /> : null}
            </Fragment>
          )}
        </Timeout>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Async]']);
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.expire(2000);
    await advanceTimers(2000);
    expect(ReactNoop.flush()).toEqual([
      'Suspend! [Async]',
      'Loading...',
      'Suspend! [Async]',
    ]);
    expect(ReactNoop.getChildren()).toEqual([div(), span('Loading...')]);

    ReactNoop.expire(1000);
    await advanceTimers(1000);

    expect(ReactNoop.flush()).toEqual(['Promise resolved [Async]', 'Async']);
    expect(ReactNoop.getChildren()).toEqual([div(span('Async'))]);
  });

  describe('splitting a high-pri update into high and low', () => {
    React = require('react');

    class AsyncValue extends React.Component {
      state = {asyncValue: this.props.defaultValue};
      componentDidMount() {
        ReactNoop.deferredUpdates(() => {
          this.setState((state, props) => ({asyncValue: props.value}));
        });
      }
      componentDidUpdate() {
        if (this.props.value !== this.state.asyncValue) {
          ReactNoop.deferredUpdates(() => {
            this.setState((state, props) => ({asyncValue: props.value}));
          });
        }
      }
      render() {
        return this.props.children(this.state.asyncValue);
      }
    }

    it('coalesces async values when in a suspended state', async () => {
      function App(props) {
        const highPriText = props.text;
        return (
          <Fallback>
            <AsyncValue value={highPriText} defaultValue={null}>
              {lowPriText => (
                <Fragment>
                  <Text text={`High-pri: ${highPriText}`} />
                  {lowPriText && (
                    <AsyncText text={`Low-pri: ${lowPriText}`} ms={100} />
                  )}
                </Fragment>
              )}
            </AsyncValue>
          </Fallback>
        );
      }

      function renderAppSync(props) {
        ReactNoop.flushSync(() => ReactNoop.render(<App {...props} />));
      }

      // Initial mount
      renderAppSync({text: 'A'});
      expect(ReactNoop.flush()).toEqual([
        // First we render at high priority
        'High-pri: A',
        // Then we come back later to render a low priority
        'High-pri: A',
        // The low-pri view suspends
        'Suspend! [Low-pri: A]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('High-pri: A')]);

      // Partially flush the promise for 'A', not by enough to resolve it.
      await advanceTimers(99);

      // Advance React's virtual time so that the next update falls into a new
      // expiration bucket
      ReactNoop.expire(2000);
      // Update to B. At this point, the low-pri view still hasn't updated
      // to 'A'.
      renderAppSync({text: 'B'});
      expect(ReactNoop.flush()).toEqual([
        // First we render at high priority
        'High-pri: B',
        // Then we come back later to render a low priority
        'High-pri: B',
        // The low-pri view suspends
        'Suspend! [Low-pri: B]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('High-pri: B')]);

      // Flush the rest of the promise for 'A', without flushing the one
      // for 'B'.
      await advanceTimers(1);
      expect(ReactNoop.flush()).toEqual([
        // A is unblocked
        'Promise resolved [Low-pri: A]',
        // But we don't try to render it, because there's a lower priority
        // update that is also suspended.
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('High-pri: B')]);

      // Flush the remaining work.
      await advanceTimers(99);
      expect(ReactNoop.flush()).toEqual([
        // B is unblocked
        'Promise resolved [Low-pri: B]',
        // Now we can continue rendering the async view
        'High-pri: B',
        'Low-pri: B',
      ]);
      expect(ReactNoop.getChildren()).toEqual([
        span('High-pri: B'),
        span('Low-pri: B'),
      ]);
    });
  });

  describe('a Delay component', () => {
    function Never() {
      // Throws a promise that resolves after some arbitrarily large
      // number of seconds. The idea is that this component will never
      // resolve. It's always wrapped by a Timeout.
      throw new Promise(resolve => setTimeout(() => resolve(), 10000));
    }

    function Delay({ms}) {
      return (
        <Timeout ms={ms}>
          {didTimeout => {
            if (didTimeout) {
              // Once ms has elapsed, render null. This allows the rest of the
              // tree to resume rendering.
              return null;
            }
            return <Never />;
          }}
        </Timeout>
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
});
