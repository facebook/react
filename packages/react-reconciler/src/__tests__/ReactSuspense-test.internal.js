let React;
let ReactTestRenderer;
let ReactFeatureFlags;
let Scheduler;
let ReactCache;
let Suspense;
let act;

let TextResource;
let textResourceShouldFail;

let assertLog;
let waitForPaint;
let waitForAll;
let waitFor;

describe('ReactSuspense', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');

    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    act = require('jest-react').act;
    Scheduler = require('scheduler');
    ReactCache = require('react-cache');

    Suspense = React.Suspense;

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    waitForPaint = InternalTestUtils.waitForPaint;
    assertLog = InternalTestUtils.assertLog;
    waitFor = InternalTestUtils.waitFor;

    TextResource = ReactCache.unstable_createResource(
      ([text, ms = 0]) => {
        let listeners = null;
        let status = 'pending';
        let value = null;
        return {
          then(resolve, reject) {
            switch (status) {
              case 'pending': {
                if (listeners === null) {
                  listeners = [{resolve, reject}];
                  setTimeout(() => {
                    if (textResourceShouldFail) {
                      Scheduler.log(`Promise rejected [${text}]`);
                      status = 'rejected';
                      value = new Error('Failed to load: ' + text);
                      listeners.forEach(listener => listener.reject(value));
                    } else {
                      Scheduler.log(`Promise resolved [${text}]`);
                      status = 'resolved';
                      value = text;
                      listeners.forEach(listener => listener.resolve(value));
                    }
                  }, ms);
                } else {
                  listeners.push({resolve, reject});
                }
                break;
              }
              case 'resolved': {
                resolve(value);
                break;
              }
              case 'rejected': {
                reject(value);
                break;
              }
            }
          },
        };
      },
      ([text, ms]) => text,
    );
    textResourceShouldFail = false;
  });

  function Text(props) {
    Scheduler.log(props.text);
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read([props.text, props.ms]);
      Scheduler.log(text);
      return text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.log(`Suspend! [${text}]`);
      } else {
        Scheduler.log(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('suspends rendering and continues later', async () => {
    function Bar(props) {
      Scheduler.log('Bar');
      return props.children;
    }

    function Foo({renderBar}) {
      Scheduler.log('Foo');
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

    // Render an empty shell
    const root = ReactTestRenderer.create(<Foo />, {
      unstable_isConcurrent: true,
    });

    await waitForAll(['Foo']);
    expect(root).toMatchRenderedOutput(null);

    // Navigate the shell to now render the child content.
    // This should suspend.
    React.startTransition(() => {
      root.update(<Foo renderBar={true} />);
    });

    await waitForAll([
      'Foo',
      'Bar',
      // A suspends
      'Suspend! [A]',
      // But we keep rendering the siblings
      'B',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput(null);

    // Flush some of the time
    jest.advanceTimersByTime(50);
    // Still nothing...
    await waitForAll([]);
    expect(root).toMatchRenderedOutput(null);

    // Flush the promise completely
    jest.advanceTimersByTime(50);
    // Renders successfully
    assertLog(['Promise resolved [A]']);
    await waitForAll(['Foo', 'Bar', 'A', 'B']);
    expect(root).toMatchRenderedOutput('AB');
  });

  it('suspends siblings and later recovers each independently', async () => {
    // Render two sibling Suspense components
    const root = ReactTestRenderer.create(
      <>
        <Suspense fallback={<Text text="Loading A..." />}>
          <AsyncText text="A" ms={5000} />
        </Suspense>
        <Suspense fallback={<Text text="Loading B..." />}>
          <AsyncText text="B" ms={6000} />
        </Suspense>
      </>,
      {
        unstable_isConcurrent: true,
      },
    );

    await waitForAll([
      'Suspend! [A]',
      'Loading A...',
      'Suspend! [B]',
      'Loading B...',
    ]);
    expect(root).toMatchRenderedOutput('Loading A...Loading B...');

    // Advance time by enough that the first Suspense's promise resolves and
    // switches back to the normal view. The second Suspense should still
    // show the placeholder
    jest.advanceTimersByTime(5000);
    // TODO: Should we throw if you forget to call toHaveYielded?
    assertLog(['Promise resolved [A]']);
    await waitForAll(['A']);
    expect(root).toMatchRenderedOutput('ALoading B...');

    // Advance time by enough that the second Suspense's promise resolves
    // and switches back to the normal view
    jest.advanceTimersByTime(1000);
    assertLog(['Promise resolved [B]']);
    await waitForAll(['B']);
    expect(root).toMatchRenderedOutput('AB');
  });

  it('interrupts current render if promise resolves before current render phase', async () => {
    let didResolve = false;
    const listeners = [];

    const thenable = {
      then(resolve) {
        if (!didResolve) {
          listeners.push(resolve);
        } else {
          resolve();
        }
      },
    };

    function resolveThenable() {
      didResolve = true;
      listeners.forEach(l => l());
    }

    function Async() {
      if (!didResolve) {
        Scheduler.log('Suspend!');
        throw thenable;
      }
      Scheduler.log('Async');
      return 'Async';
    }

    const root = ReactTestRenderer.create(
      <>
        <Suspense fallback={<Text text="Loading..." />} />
        <Text text="Initial" />
      </>,
      {
        unstable_isConcurrent: true,
      },
    );
    await waitForAll(['Initial']);
    expect(root).toMatchRenderedOutput('Initial');

    // The update will suspend.
    React.startTransition(() => {
      root.update(
        <>
          <Suspense fallback={<Text text="Loading..." />}>
            <Async />
          </Suspense>
          <Text text="After Suspense" />
          <Text text="Sibling" />
        </>,
      );
    });
    // Yield past the Suspense boundary but don't complete the last sibling.
    await waitFor(['Suspend!', 'Loading...', 'After Suspense']);

    // The promise resolves before the current render phase has completed
    resolveThenable();
    assertLog([]);
    expect(root).toMatchRenderedOutput('Initial');

    // Start over from the root, instead of continuing.
    await waitForAll([
      // Async renders again *before* Sibling
      'Async',
      'After Suspense',
      'Sibling',
    ]);
    expect(root).toMatchRenderedOutput('AsyncAfter SuspenseSibling');
  });

  it('throttles fallback committing globally', async () => {
    function Foo() {
      Scheduler.log('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" ms={200} />
          <Suspense fallback={<Text text="Loading more..." />}>
            <AsyncText text="B" ms={300} />
          </Suspense>
        </Suspense>
      );
    }

    // Committing fallbacks should be throttled.
    // First, advance some time to skip the first threshold.
    jest.advanceTimersByTime(600);
    Scheduler.unstable_advanceTime(600);

    const root = ReactTestRenderer.create(<Foo />, {
      unstable_isConcurrent: true,
    });

    await waitForAll([
      'Foo',
      'Suspend! [A]',
      'Suspend! [B]',
      'Loading more...',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('Loading...');

    // Resolve A.
    jest.advanceTimersByTime(200);
    Scheduler.unstable_advanceTime(200);
    assertLog(['Promise resolved [A]']);
    await waitForAll(['A', 'Suspend! [B]', 'Loading more...']);

    // By this point, we have enough info to show "A" and "Loading more..."
    // However, we've just shown the outer fallback. So we'll delay
    // showing the inner fallback hoping that B will resolve soon enough.
    expect(root).toMatchRenderedOutput('Loading...');

    // Resolve B.
    jest.advanceTimersByTime(100);
    Scheduler.unstable_advanceTime(100);
    assertLog(['Promise resolved [B]']);

    // By this point, B has resolved.
    // We're still showing the outer fallback.
    expect(root).toMatchRenderedOutput('Loading...');
    await waitForAll(['A', 'B']);
    // Then contents of both should pop in together.
    expect(root).toMatchRenderedOutput('AB');
  });

  it('does not throttle fallback committing for too long', async () => {
    function Foo() {
      Scheduler.log('Foo');
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" ms={200} />
          <Suspense fallback={<Text text="Loading more..." />}>
            <AsyncText text="B" ms={1200} />
          </Suspense>
        </Suspense>
      );
    }

    // Committing fallbacks should be throttled.
    // First, advance some time to skip the first threshold.
    jest.advanceTimersByTime(600);
    Scheduler.unstable_advanceTime(600);

    const root = ReactTestRenderer.create(<Foo />, {
      unstable_isConcurrent: true,
    });

    await waitForAll([
      'Foo',
      'Suspend! [A]',
      'Suspend! [B]',
      'Loading more...',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('Loading...');

    // Resolve A.
    jest.advanceTimersByTime(200);
    Scheduler.unstable_advanceTime(200);
    assertLog(['Promise resolved [A]']);
    await waitForAll(['A', 'Suspend! [B]', 'Loading more...']);

    // By this point, we have enough info to show "A" and "Loading more..."
    // However, we've just shown the outer fallback. So we'll delay
    // showing the inner fallback hoping that B will resolve soon enough.
    expect(root).toMatchRenderedOutput('Loading...');

    // Wait some more. B is still not resolving.
    jest.advanceTimersByTime(500);
    Scheduler.unstable_advanceTime(500);
    // Give up and render A with a spinner for B.
    expect(root).toMatchRenderedOutput('ALoading more...');

    // Resolve B.
    jest.advanceTimersByTime(500);
    Scheduler.unstable_advanceTime(500);
    assertLog(['Promise resolved [B]']);
    await waitForAll(['B']);
    expect(root).toMatchRenderedOutput('AB');
  });

  it('mounts a lazy class component in non-concurrent mode', async () => {
    class Class extends React.Component {
      componentDidMount() {
        Scheduler.log('Did mount: ' + this.props.label);
      }
      componentDidUpdate() {
        Scheduler.log('Did update: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    async function fakeImport(result) {
      return {default: result};
    }

    const LazyClass = React.lazy(() => fakeImport(Class));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <LazyClass label="Hi" />
      </Suspense>,
    );

    assertLog(['Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await LazyClass;

    await waitForPaint(['Hi', 'Did mount: Hi']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('updates memoized child of suspense component when context updates (simple memo)', async () => {
    const {useContext, createContext, useState, memo} = React;

    const ValueContext = createContext(null);

    const MemoizedChild = memo(function MemoizedChild() {
      const text = useContext(ValueContext);
      try {
        TextResource.read([text, 1000]);
        Scheduler.log(text);
        return text;
      } catch (promise) {
        if (typeof promise.then === 'function') {
          Scheduler.log(`Suspend! [${text}]`);
        } else {
          Scheduler.log(`Error! [${text}]`);
        }
        throw promise;
      }
    });

    let setValue;
    function App() {
      const [value, _setValue] = useState('default');
      setValue = _setValue;

      return (
        <ValueContext.Provider value={value}>
          <Suspense fallback={<Text text="Loading..." />}>
            <MemoizedChild />
          </Suspense>
        </ValueContext.Provider>
      );
    }

    const root = ReactTestRenderer.create(<App />, {
      unstable_isConcurrent: true,
    });
    await waitForAll(['Suspend! [default]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [default]']);
    await waitForAll(['default']);
    expect(root).toMatchRenderedOutput('default');

    act(() => setValue('new value'));
    assertLog(['Suspend! [new value]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [new value]']);
    await waitForAll(['new value']);
    expect(root).toMatchRenderedOutput('new value');
  });

  it('updates memoized child of suspense component when context updates (manual memo)', async () => {
    const {useContext, createContext, useState, memo} = React;

    const ValueContext = createContext(null);

    const MemoizedChild = memo(
      function MemoizedChild() {
        const text = useContext(ValueContext);
        try {
          TextResource.read([text, 1000]);
          Scheduler.log(text);
          return text;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.log(`Suspend! [${text}]`);
          } else {
            Scheduler.log(`Error! [${text}]`);
          }
          throw promise;
        }
      },
      function areEqual(prevProps, nextProps) {
        return true;
      },
    );

    let setValue;
    function App() {
      const [value, _setValue] = useState('default');
      setValue = _setValue;

      return (
        <ValueContext.Provider value={value}>
          <Suspense fallback={<Text text="Loading..." />}>
            <MemoizedChild />
          </Suspense>
        </ValueContext.Provider>
      );
    }

    const root = ReactTestRenderer.create(<App />, {
      unstable_isConcurrent: true,
    });
    await waitForAll(['Suspend! [default]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [default]']);
    await waitForAll(['default']);
    expect(root).toMatchRenderedOutput('default');

    act(() => setValue('new value'));
    assertLog(['Suspend! [new value]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [new value]']);
    await waitForAll(['new value']);
    expect(root).toMatchRenderedOutput('new value');
  });

  it('updates memoized child of suspense component when context updates (function)', async () => {
    const {useContext, createContext, useState} = React;

    const ValueContext = createContext(null);

    function MemoizedChild() {
      const text = useContext(ValueContext);
      try {
        TextResource.read([text, 1000]);
        Scheduler.log(text);
        return text;
      } catch (promise) {
        if (typeof promise.then === 'function') {
          Scheduler.log(`Suspend! [${text}]`);
        } else {
          Scheduler.log(`Error! [${text}]`);
        }
        throw promise;
      }
    }

    let setValue;
    function App({children}) {
      const [value, _setValue] = useState('default');
      setValue = _setValue;

      return (
        <ValueContext.Provider value={value}>{children}</ValueContext.Provider>
      );
    }

    const root = ReactTestRenderer.create(
      <App>
        <Suspense fallback={<Text text="Loading..." />}>
          <MemoizedChild />
        </Suspense>
      </App>,
      {
        unstable_isConcurrent: true,
      },
    );
    await waitForAll(['Suspend! [default]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [default]']);
    await waitForAll(['default']);
    expect(root).toMatchRenderedOutput('default');

    act(() => setValue('new value'));
    assertLog(['Suspend! [new value]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [new value]']);
    await waitForAll(['new value']);
    expect(root).toMatchRenderedOutput('new value');
  });

  it('updates memoized child of suspense component when context updates (forwardRef)', async () => {
    const {forwardRef, useContext, createContext, useState} = React;

    const ValueContext = createContext(null);

    const MemoizedChild = forwardRef(() => {
      const text = useContext(ValueContext);
      try {
        TextResource.read([text, 1000]);
        Scheduler.log(text);
        return text;
      } catch (promise) {
        if (typeof promise.then === 'function') {
          Scheduler.log(`Suspend! [${text}]`);
        } else {
          Scheduler.log(`Error! [${text}]`);
        }
        throw promise;
      }
    });

    let setValue;
    function App({children}) {
      const [value, _setValue] = useState('default');
      setValue = _setValue;

      return (
        <ValueContext.Provider value={value}>{children}</ValueContext.Provider>
      );
    }

    const root = ReactTestRenderer.create(
      <App>
        <Suspense fallback={<Text text="Loading..." />}>
          <MemoizedChild />
        </Suspense>
      </App>,
      {
        unstable_isConcurrent: true,
      },
    );
    await waitForAll(['Suspend! [default]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [default]']);
    await waitForAll(['default']);
    expect(root).toMatchRenderedOutput('default');

    act(() => setValue('new value'));
    assertLog(['Suspend! [new value]', 'Loading...']);
    jest.advanceTimersByTime(1000);

    assertLog(['Promise resolved [new value]']);
    await waitForAll(['new value']);
    expect(root).toMatchRenderedOutput('new value');
  });

  it('re-fires layout effects when re-showing Suspense', async () => {
    function TextWithLayout(props) {
      Scheduler.log(props.text);
      React.useLayoutEffect(() => {
        Scheduler.log('create layout');
        return () => {
          Scheduler.log('destroy layout');
        };
      }, []);
      return props.text;
    }

    let _setShow;
    function App(props) {
      const [show, setShow] = React.useState(false);
      _setShow = setShow;
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <TextWithLayout text="Child 1" />
          {show && <AsyncText ms={1000} text="Child 2" />}
        </Suspense>
      );
    }

    const root = ReactTestRenderer.create(<App />, {
      unstable_isConcurrent: true,
    });

    await waitForAll(['Child 1', 'create layout']);
    expect(root).toMatchRenderedOutput('Child 1');

    act(() => {
      _setShow(true);
    });
    assertLog(['Child 1', 'Suspend! [Child 2]', 'Loading...']);
    jest.advanceTimersByTime(1000);
    assertLog(['destroy layout', 'Promise resolved [Child 2]']);
    await waitForAll(['Child 1', 'Child 2', 'create layout']);
    expect(root).toMatchRenderedOutput(['Child 1', 'Child 2'].join(''));
  });

  describe('outside concurrent mode', () => {
    it('a mounted class component can suspend without losing state', async () => {
      class TextWithLifecycle extends React.Component {
        componentDidMount() {
          Scheduler.log(`Mount [${this.props.text}]`);
        }
        componentDidUpdate() {
          Scheduler.log(`Update [${this.props.text}]`);
        }
        componentWillUnmount() {
          Scheduler.log(`Unmount [${this.props.text}]`);
        }
        render() {
          return <Text {...this.props} />;
        }
      }

      let instance;
      class AsyncTextWithLifecycle extends React.Component {
        state = {step: 1};
        componentDidMount() {
          Scheduler.log(`Mount [${this.props.text}:${this.state.step}]`);
        }
        componentDidUpdate() {
          Scheduler.log(`Update [${this.props.text}:${this.state.step}]`);
        }
        componentWillUnmount() {
          Scheduler.log(`Unmount [${this.props.text}:${this.state.step}]`);
        }
        render() {
          instance = this;
          const text = `${this.props.text}:${this.state.step}`;
          const ms = this.props.ms;
          try {
            TextResource.read([text, ms]);
            Scheduler.log(text);
            return text;
          } catch (promise) {
            if (typeof promise.then === 'function') {
              Scheduler.log(`Suspend! [${text}]`);
            } else {
              Scheduler.log(`Error! [${text}]`);
            }
            throw promise;
          }
        }
      }

      function App() {
        return (
          <Suspense fallback={<TextWithLifecycle text="Loading..." />}>
            <TextWithLifecycle text="A" />
            <AsyncTextWithLifecycle ms={100} text="B" ref={instance} />
            <TextWithLifecycle text="C" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);

      assertLog([
        'A',
        'Suspend! [B:1]',
        'C',
        'Loading...',

        'Mount [A]',
        // B's lifecycle should not fire because it suspended
        // 'Mount [B]',
        'Mount [C]',
        'Mount [Loading...]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(100);

      assertLog(['Promise resolved [B:1]']);
      await waitForPaint([
        'B:1',
        'Unmount [Loading...]',
        // Should be a mount, not an update
        'Mount [B:1]',
      ]);
      expect(root).toMatchRenderedOutput('AB:1C');

      instance.setState({step: 2});
      assertLog(['Suspend! [B:2]', 'Loading...', 'Mount [Loading...]']);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(100);

      assertLog(['Promise resolved [B:2]']);
      await waitForPaint(['B:2', 'Unmount [Loading...]', 'Update [B:2]']);
      expect(root).toMatchRenderedOutput('AB:2C');
    });

    it('bails out on timed-out primary children even if they receive an update', async () => {
      let instance;
      class Stateful extends React.Component {
        state = {step: 1};
        render() {
          instance = this;
          return <Text text={`Stateful: ${this.state.step}`} />;
        }
      }

      function App(props) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <Stateful />
            <AsyncText ms={1000} text={props.text} />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App text="A" />);

      assertLog(['Stateful: 1', 'Suspend! [A]', 'Loading...']);

      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [A]']);
      await waitForPaint(['A']);
      expect(root).toMatchRenderedOutput('Stateful: 1A');

      root.update(<App text="B" />);
      assertLog(['Stateful: 1', 'Suspend! [B]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      instance.setState({step: 2});
      assertLog(['Stateful: 2', 'Suspend! [B]']);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [B]']);
      await waitForPaint(['B']);
      expect(root).toMatchRenderedOutput('Stateful: 2B');
    });

    it('when updating a timed-out tree, always retries the suspended component', async () => {
      let instance;
      class Stateful extends React.Component {
        state = {step: 1};
        render() {
          instance = this;
          return <Text text={`Stateful: ${this.state.step}`} />;
        }
      }

      const Indirection = React.Fragment;

      function App(props) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <Stateful />
            <Indirection>
              <Indirection>
                <Indirection>
                  <AsyncText ms={1000} text={props.text} />
                </Indirection>
              </Indirection>
            </Indirection>
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App text="A" />);

      assertLog(['Stateful: 1', 'Suspend! [A]', 'Loading...']);

      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [A]']);
      await waitForPaint(['A']);
      expect(root).toMatchRenderedOutput('Stateful: 1A');

      root.update(<App text="B" />);
      assertLog(['Stateful: 1', 'Suspend! [B]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      instance.setState({step: 2});
      assertLog([
        'Stateful: 2',

        // The suspended component should suspend again. If it doesn't, the
        // likely mistake is that the suspended fiber wasn't marked with
        // pending work, so it was improperly treated as complete.
        'Suspend! [B]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [B]']);
      await waitForPaint(['B']);
      expect(root).toMatchRenderedOutput('Stateful: 2B');
    });

    it('suspends in a class that has componentWillUnmount and is then deleted', () => {
      class AsyncTextWithUnmount extends React.Component {
        componentWillUnmount() {
          Scheduler.log('will unmount');
        }
        render() {
          const text = this.props.text;
          const ms = this.props.ms;
          try {
            TextResource.read([text, ms]);
            Scheduler.log(text);
            return text;
          } catch (promise) {
            if (typeof promise.then === 'function') {
              Scheduler.log(`Suspend! [${text}]`);
            } else {
              Scheduler.log(`Error! [${text}]`);
            }
            throw promise;
          }
        }
      }

      function App({text}) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncTextWithUnmount text={text} ms={100} />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App text="A" />);
      assertLog(['Suspend! [A]', 'Loading...']);
      root.update(<Text text="B" />);
      // Should not fire componentWillUnmount
      assertLog(['B']);
      expect(root).toMatchRenderedOutput('B');
    });

    it('suspends in a component that also contains useEffect', async () => {
      const {useLayoutEffect} = React;

      function AsyncTextWithEffect(props) {
        const text = props.text;

        useLayoutEffect(() => {
          Scheduler.log('Did commit: ' + text);
        }, [text]);

        try {
          TextResource.read([props.text, props.ms]);
          Scheduler.log(text);
          return text;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.log(`Suspend! [${text}]`);
          } else {
            Scheduler.log(`Error! [${text}]`);
          }
          throw promise;
        }
      }

      function App({text}) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncTextWithEffect text={text} ms={100} />
          </Suspense>
        );
      }

      ReactTestRenderer.create(<App text="A" />);
      assertLog(['Suspend! [A]', 'Loading...']);
      jest.advanceTimersByTime(500);

      assertLog(['Promise resolved [A]']);
      await waitForPaint(['A', 'Did commit: A']);
    });

    it('retries when an update is scheduled on a timed out tree', async () => {
      let instance;
      class Stateful extends React.Component {
        state = {step: 1};
        render() {
          instance = this;
          return <AsyncText ms={1000} text={`Step: ${this.state.step}`} />;
        }
      }

      function App(props) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <Stateful />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      });

      // Initial render
      await waitForAll(['Suspend! [Step: 1]', 'Loading...']);
      jest.advanceTimersByTime(1000);
      assertLog(['Promise resolved [Step: 1]']);
      await waitForAll(['Step: 1']);
      expect(root).toMatchRenderedOutput('Step: 1');

      // Update that suspends
      instance.setState({step: 2});
      await waitForAll(['Suspend! [Step: 2]', 'Loading...']);
      jest.advanceTimersByTime(500);
      expect(root).toMatchRenderedOutput('Loading...');

      // Update while still suspended
      instance.setState({step: 3});
      await waitForAll(['Suspend! [Step: 3]']);
      expect(root).toMatchRenderedOutput('Loading...');

      jest.advanceTimersByTime(1000);
      assertLog(['Promise resolved [Step: 2]', 'Promise resolved [Step: 3]']);
      await waitForAll(['Step: 3']);
      expect(root).toMatchRenderedOutput('Step: 3');
    });

    it('does not remount the fallback while suspended children resolve in legacy mode', async () => {
      let mounts = 0;
      class ShouldMountOnce extends React.Component {
        componentDidMount() {
          mounts++;
        }
        render() {
          return <Text text="Loading..." />;
        }
      }

      function App(props) {
        return (
          <Suspense fallback={<ShouldMountOnce />}>
            <AsyncText ms={1000} text="Child 1" />
            <AsyncText ms={2000} text="Child 2" />
            <AsyncText ms={3000} text="Child 3" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);

      // Initial render
      assertLog([
        'Suspend! [Child 1]',
        'Suspend! [Child 2]',
        'Suspend! [Child 3]',
        'Loading...',
      ]);
      await waitForAll([]);

      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [Child 1]']);
      await waitForPaint([
        'Child 1',
        'Suspend! [Child 2]',
        'Suspend! [Child 3]',
      ]);

      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [Child 2]']);
      await waitForPaint(['Child 2', 'Suspend! [Child 3]']);

      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [Child 3]']);
      await waitForPaint(['Child 3']);
      expect(root).toMatchRenderedOutput(
        ['Child 1', 'Child 2', 'Child 3'].join(''),
      );
      expect(mounts).toBe(1);
    });

    it('does not get stuck with fallback in concurrent mode for a large delay', async () => {
      function App(props) {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText ms={1000} text="Child 1" />
            <AsyncText ms={7000} text="Child 2" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      });

      await waitForAll([
        'Suspend! [Child 1]',
        'Suspend! [Child 2]',
        'Loading...',
      ]);
      jest.advanceTimersByTime(1000);
      assertLog(['Promise resolved [Child 1]']);
      await waitForAll(['Child 1', 'Suspend! [Child 2]']);
      jest.advanceTimersByTime(6000);
      assertLog(['Promise resolved [Child 2]']);
      await waitForAll(['Child 1', 'Child 2']);
      expect(root).toMatchRenderedOutput(['Child 1', 'Child 2'].join(''));
    });

    it('reuses effects, including deletions, from the suspended tree', async () => {
      const {useState} = React;

      let setTab;
      function App() {
        const [tab, _setTab] = useState(0);
        setTab = _setTab;

        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText key={tab} text={'Tab: ' + tab} ms={1000} />
            <Text key={tab + 'sibling'} text=" + sibling" />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(<App />);
      assertLog(['Suspend! [Tab: 0]', ' + sibling', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [Tab: 0]']);
      await waitForPaint(['Tab: 0']);
      expect(root).toMatchRenderedOutput('Tab: 0 + sibling');

      act(() => setTab(1));
      assertLog(['Suspend! [Tab: 1]', ' + sibling', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [Tab: 1]']);
      await waitForPaint(['Tab: 1']);
      expect(root).toMatchRenderedOutput('Tab: 1 + sibling');

      act(() => setTab(2));
      assertLog(['Suspend! [Tab: 2]', ' + sibling', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [Tab: 2]']);
      await waitForPaint(['Tab: 2']);
      expect(root).toMatchRenderedOutput('Tab: 2 + sibling');
    });

    it('does not warn if an mounted component is pinged', async () => {
      const {useState} = React;

      const root = ReactTestRenderer.create(null);

      let setStep;
      function UpdatingText({text, ms}) {
        const [step, _setStep] = useState(0);
        setStep = _setStep;
        const fullText = `${text}:${step}`;
        try {
          TextResource.read([fullText, ms]);
          Scheduler.log(fullText);
          return fullText;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.log(`Suspend! [${fullText}]`);
          } else {
            Scheduler.log(`Error! [${fullText}]`);
          }
          throw promise;
        }
      }

      root.update(
        <Suspense fallback={<Text text="Loading..." />}>
          <UpdatingText text="A" ms={1000} />
        </Suspense>,
      );

      assertLog(['Suspend! [A:0]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [A:0]']);
      await waitForPaint(['A:0']);
      expect(root).toMatchRenderedOutput('A:0');

      act(() => setStep(1));
      assertLog(['Suspend! [A:1]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      root.update(null);
      await waitForAll([]);
      jest.advanceTimersByTime(1000);
    });

    it('memoizes promise listeners per thread ID to prevent redundant renders', async () => {
      function App() {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="A" ms={1000} />
            <AsyncText text="B" ms={2000} />
            <AsyncText text="C" ms={3000} />
          </Suspense>
        );
      }

      const root = ReactTestRenderer.create(null);

      root.update(<App />);

      assertLog(['Suspend! [A]', 'Suspend! [B]', 'Suspend! [C]', 'Loading...']);

      // Resolve A
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [A]']);
      await waitForPaint([
        'A',
        // The promises for B and C have now been thrown twice
        'Suspend! [B]',
        'Suspend! [C]',
      ]);

      // Resolve B
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [B]']);
      await waitForPaint([
        // Even though the promise for B was thrown twice, we should only
        // re-render once.
        'B',
        // The promise for C has now been thrown three times
        'Suspend! [C]',
      ]);

      // Resolve C
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [C]']);
      await waitForPaint([
        // Even though the promise for C was thrown three times, we should only
        // re-render once.
        'C',
      ]);
    });

    it('#14162', () => {
      const {lazy} = React;

      function Hello() {
        return <span>hello</span>;
      }

      async function fetchComponent() {
        return new Promise(r => {
          // simulating a delayed import() call
          setTimeout(r, 1000, {default: Hello});
        });
      }

      const LazyHello = lazy(fetchComponent);

      class App extends React.Component {
        state = {render: false};

        componentDidMount() {
          setTimeout(() => this.setState({render: true}));
        }

        render() {
          return (
            <Suspense fallback={<span>loading...</span>}>
              {this.state.render && <LazyHello />}
            </Suspense>
          );
        }
      }

      const root = ReactTestRenderer.create(null);

      root.update(<App name="world" />);
      jest.advanceTimersByTime(1000);
    });

    it('updates memoized child of suspense component when context updates (simple memo)', async () => {
      const {useContext, createContext, useState, memo} = React;

      const ValueContext = createContext(null);

      const MemoizedChild = memo(function MemoizedChild() {
        const text = useContext(ValueContext);
        try {
          TextResource.read([text, 1000]);
          Scheduler.log(text);
          return text;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.log(`Suspend! [${text}]`);
          } else {
            Scheduler.log(`Error! [${text}]`);
          }
          throw promise;
        }
      });

      let setValue;
      function App() {
        const [value, _setValue] = useState('default');
        setValue = _setValue;

        return (
          <ValueContext.Provider value={value}>
            <Suspense fallback={<Text text="Loading..." />}>
              <MemoizedChild />
            </Suspense>
          </ValueContext.Provider>
        );
      }

      const root = ReactTestRenderer.create(<App />);
      assertLog(['Suspend! [default]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [default]']);
      await waitForPaint(['default']);
      expect(root).toMatchRenderedOutput('default');

      act(() => setValue('new value'));
      assertLog(['Suspend! [new value]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [new value]']);
      await waitForPaint(['new value']);
      expect(root).toMatchRenderedOutput('new value');
    });

    it('updates memoized child of suspense component when context updates (manual memo)', async () => {
      const {useContext, createContext, useState, memo} = React;

      const ValueContext = createContext(null);

      const MemoizedChild = memo(
        function MemoizedChild() {
          const text = useContext(ValueContext);
          try {
            TextResource.read([text, 1000]);
            Scheduler.log(text);
            return text;
          } catch (promise) {
            if (typeof promise.then === 'function') {
              Scheduler.log(`Suspend! [${text}]`);
            } else {
              Scheduler.log(`Error! [${text}]`);
            }
            throw promise;
          }
        },
        function areEqual(prevProps, nextProps) {
          return true;
        },
      );

      let setValue;
      function App() {
        const [value, _setValue] = useState('default');
        setValue = _setValue;

        return (
          <ValueContext.Provider value={value}>
            <Suspense fallback={<Text text="Loading..." />}>
              <MemoizedChild />
            </Suspense>
          </ValueContext.Provider>
        );
      }

      const root = ReactTestRenderer.create(<App />);
      assertLog(['Suspend! [default]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [default]']);
      await waitForPaint(['default']);
      expect(root).toMatchRenderedOutput('default');

      act(() => setValue('new value'));
      assertLog(['Suspend! [new value]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [new value]']);
      await waitForPaint(['new value']);
      expect(root).toMatchRenderedOutput('new value');
    });

    it('updates memoized child of suspense component when context updates (function)', async () => {
      const {useContext, createContext, useState} = React;

      const ValueContext = createContext(null);

      function MemoizedChild() {
        const text = useContext(ValueContext);
        try {
          TextResource.read([text, 1000]);
          Scheduler.log(text);
          return text;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.log(`Suspend! [${text}]`);
          } else {
            Scheduler.log(`Error! [${text}]`);
          }
          throw promise;
        }
      }

      let setValue;
      function App({children}) {
        const [value, _setValue] = useState('default');
        setValue = _setValue;

        return (
          <ValueContext.Provider value={value}>
            {children}
          </ValueContext.Provider>
        );
      }

      const root = ReactTestRenderer.create(
        <App>
          <Suspense fallback={<Text text="Loading..." />}>
            <MemoizedChild />
          </Suspense>
        </App>,
      );
      assertLog(['Suspend! [default]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [default]']);
      await waitForPaint(['default']);
      expect(root).toMatchRenderedOutput('default');

      act(() => setValue('new value'));
      assertLog(['Suspend! [new value]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [new value]']);
      await waitForPaint(['new value']);
      expect(root).toMatchRenderedOutput('new value');
    });

    it('updates memoized child of suspense component when context updates (forwardRef)', async () => {
      const {forwardRef, useContext, createContext, useState} = React;

      const ValueContext = createContext(null);

      const MemoizedChild = forwardRef(function MemoizedChild() {
        const text = useContext(ValueContext);
        try {
          TextResource.read([text, 1000]);
          Scheduler.log(text);
          return text;
        } catch (promise) {
          if (typeof promise.then === 'function') {
            Scheduler.log(`Suspend! [${text}]`);
          } else {
            Scheduler.log(`Error! [${text}]`);
          }
          throw promise;
        }
      });

      let setValue;
      function App() {
        const [value, _setValue] = useState('default');
        setValue = _setValue;

        return (
          <ValueContext.Provider value={value}>
            <Suspense fallback={<Text text="Loading..." />}>
              <MemoizedChild />
            </Suspense>
          </ValueContext.Provider>
        );
      }

      const root = ReactTestRenderer.create(<App />);
      assertLog(['Suspend! [default]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [default]']);
      await waitForPaint(['default']);
      expect(root).toMatchRenderedOutput('default');

      act(() => setValue('new value'));
      assertLog(['Suspend! [new value]', 'Loading...']);
      jest.advanceTimersByTime(1000);

      assertLog(['Promise resolved [new value]']);
      await waitForPaint(['new value']);
      expect(root).toMatchRenderedOutput('new value');
    });

    it('updates context consumer within child of suspended suspense component when context updates', () => {
      const {createContext, useState} = React;

      const ValueContext = createContext(null);

      const promiseThatNeverResolves = new Promise(() => {});
      function Child() {
        return (
          <ValueContext.Consumer>
            {value => {
              Scheduler.log(`Received context value [${value}]`);
              if (value === 'default') return <Text text="default" />;
              throw promiseThatNeverResolves;
            }}
          </ValueContext.Consumer>
        );
      }

      let setValue;
      function Wrapper({children}) {
        const [value, _setValue] = useState('default');
        setValue = _setValue;
        return (
          <ValueContext.Provider value={value}>
            {children}
          </ValueContext.Provider>
        );
      }

      function App() {
        return (
          <Wrapper>
            <Suspense fallback={<Text text="Loading..." />}>
              <Child />
            </Suspense>
          </Wrapper>
        );
      }

      const root = ReactTestRenderer.create(<App />);
      assertLog(['Received context value [default]', 'default']);
      expect(root).toMatchRenderedOutput('default');

      act(() => setValue('new value'));
      assertLog(['Received context value [new value]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      act(() => setValue('default'));
      assertLog(['Received context value [default]', 'default']);
      expect(root).toMatchRenderedOutput('default');
    });
  });
});
