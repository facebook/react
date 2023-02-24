'use strict';

let React;
let ReactNoop;
let Scheduler;
let act;
let use;
let useDebugValue;
let useState;
let useMemo;
let Suspense;
let startTransition;
let cache;
let pendingTextRequests;

describe('ReactThenable', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    use = React.use;
    useDebugValue = React.useDebugValue;
    useState = React.useState;
    useMemo = React.useMemo;
    Suspense = React.Suspense;
    startTransition = React.startTransition;
    cache = React.cache;

    pendingTextRequests = new Map();
  });

  function resolveTextRequests(text) {
    const requests = pendingTextRequests.get(text);
    if (requests !== undefined) {
      pendingTextRequests.delete(text);
      requests.forEach(resolve => resolve(text));
    }
  }

  function getAsyncText(text) {
    // getAsyncText is completely uncached — it performs a new async operation
    // every time it's called. During a transition, React should be able to
    // unwrap it anyway.
    Scheduler.unstable_yieldValue(`Async text requested [${text}]`);
    return new Promise(resolve => {
      const requests = pendingTextRequests.get(text);
      if (requests !== undefined) {
        requests.push(resolve);
        pendingTextRequests.set(text, requests);
      } else {
        pendingTextRequests.set(text, [resolve]);
      }
    });
  }

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  // This behavior was intentionally disabled to derisk the rollout of `use`.
  // It changes the behavior of old, pre-`use` Suspense implementations. We may
  // add this back; however, the plan is to migrate all existing Suspense code
  // to `use`, so the extra code probably isn't worth it.
  // @gate TODO
  test('if suspended fiber is pinged in a microtask, retry immediately without unwinding the stack', async () => {
    let fulfilled = false;
    function Async() {
      if (fulfilled) {
        return <Text text="Async" />;
      }
      Scheduler.unstable_yieldValue('Suspend!');
      throw Promise.resolve().then(() => {
        Scheduler.unstable_yieldValue('Resolve in microtask');
        fulfilled = true;
      });
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Async />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(Scheduler).toHaveYielded([
      // React will yield when the async component suspends.
      'Suspend!',
      'Resolve in microtask',

      // Finished rendering without unwinding the stack or preparing a fallback.
      'Async',
    ]);
    expect(root).toMatchRenderedOutput('Async');
  });

  test('if suspended fiber is pinged in a microtask, it does not block a transition from completing', async () => {
    let fulfilled = false;
    function Async() {
      if (fulfilled) {
        return <Text text="Async" />;
      }
      Scheduler.unstable_yieldValue('Suspend!');
      throw Promise.resolve().then(() => {
        Scheduler.unstable_yieldValue('Resolve in microtask');
        fulfilled = true;
      });
    }

    function App() {
      return <Async />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded([
      'Suspend!',
      'Resolve in microtask',
      'Async',
    ]);
    expect(root).toMatchRenderedOutput('Async');
  });

  test('does not infinite loop if already fulfilled thenable is thrown', async () => {
    // An already fulfilled promise should never be thrown. Since it already
    // fulfilled, we shouldn't bother trying to render again — doing so would
    // likely lead to an infinite loop. This scenario should only happen if a
    // userspace Suspense library makes an implementation mistake.

    // Create an already fulfilled thenable
    const thenable = {
      then(ping) {},
      status: 'fulfilled',
      value: null,
    };

    let i = 0;
    function Async() {
      if (i++ > 50) {
        throw new Error('Infinite loop detected');
      }
      Scheduler.unstable_yieldValue('Suspend!');
      // This thenable should never be thrown because it already fulfilled.
      // But if it is thrown, React should handle it gracefully.
      throw thenable;
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Async />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Suspend!', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');
  });

  // @gate enableUseHook
  test('basic use(promise)', async () => {
    const promiseA = Promise.resolve('A');
    const promiseB = Promise.resolve('B');
    const promiseC = Promise.resolve('C');

    function Async() {
      const text = use(promiseA) + use(promiseB) + use(promiseC);
      return <Text text={text} />;
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Async />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded(['ABC']);
    expect(root).toMatchRenderedOutput('ABC');
  });

  // @gate enableUseHook
  test("using a promise that's not cached between attempts", async () => {
    function Async() {
      const text =
        use(Promise.resolve('A')) +
        use(Promise.resolve('B')) +
        use(Promise.resolve('C'));
      return <Text text={text} />;
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Async />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded(['ABC']);
    expect(root).toMatchRenderedOutput('ABC');
  });

  // @gate enableUseHook
  test('using a rejected promise will throw', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    const promiseA = Promise.resolve('A');
    const promiseB = Promise.reject(new Error('Oops!'));
    const promiseC = Promise.resolve('C');

    // Jest/Node will raise an unhandled rejected error unless we await this. It
    // works fine in the browser, though.
    await expect(promiseB).rejects.toThrow('Oops!');

    function Async() {
      const text = use(promiseA) + use(promiseB) + use(promiseC);
      return <Text text={text} />;
    }

    function App() {
      return (
        <ErrorBoundary>
          <Async />
        </ErrorBoundary>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded(['Oops!', 'Oops!']);
  });

  // @gate enableUseHook
  test('use(promise) in multiple components', async () => {
    // This tests that the state for tracking promises is reset per component.
    const promiseA = Promise.resolve('A');
    const promiseB = Promise.resolve('B');
    const promiseC = Promise.resolve('C');
    const promiseD = Promise.resolve('D');

    function Child({prefix}) {
      return <Text text={prefix + use(promiseC) + use(promiseD)} />;
    }

    function Parent() {
      return <Child prefix={use(promiseA) + use(promiseB)} />;
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Parent />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded(['ABCD']);
    expect(root).toMatchRenderedOutput('ABCD');
  });

  // @gate enableUseHook
  test('use(promise) in multiple sibling components', async () => {
    // This tests that the state for tracking promises is reset per component.

    const promiseA = {then: () => {}, status: 'pending', value: null};
    const promiseB = {then: () => {}, status: 'pending', value: null};
    const promiseC = {then: () => {}, status: 'fulfilled', value: 'C'};
    const promiseD = {then: () => {}, status: 'fulfilled', value: 'D'};

    function Sibling1({prefix}) {
      return <Text text={use(promiseA) + use(promiseB)} />;
    }

    function Sibling2() {
      return <Text text={use(promiseC) + use(promiseD)} />;
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Sibling1 />
          <Sibling2 />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded(['CD', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');
  });

  // @gate enableUseHook
  test('erroring in the same component as an uncached promise does not result in an infinite loop', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={'Caught an error: ' + this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let i = 0;
    function Async({
      // Intentionally destrucutring a prop here so that our production error
      // stack trick is triggered at the beginning of the function
      prop,
    }) {
      if (i++ > 50) {
        throw new Error('Infinite loop detected');
      }
      try {
        use(Promise.resolve('Async'));
      } catch (e) {
        Scheduler.unstable_yieldValue('Suspend! [Async]');
        throw e;
      }
      throw new Error('Oops!');
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <ErrorBoundary>
            <Async />
          </ErrorBoundary>
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded([
      // First attempt. The uncached promise suspends.
      'Suspend! [Async]',
      // Because the promise already fulfilled, we're able to unwrap the value
      // immediately in a microtask.
      //
      // Then we proceed to the rest of the component, which throws an error.
      'Caught an error: Oops!',

      // During the sync error recovery pass, the component suspends, because
      // we were unable to unwrap the value of the promise.
      'Suspend! [Async]',
      'Loading...',

      // Because the error recovery attempt suspended, React can't tell if the
      // error was actually fixed, or it was masked by the suspended data.
      // In this case, it wasn't actually fixed, so if we were to commit the
      // suspended fallback, it would enter an endless error recovery loop.
      //
      // Instead, we disable error recovery for these lanes and start
      // over again.

      // This time, the error is thrown and we commit the result.
      'Suspend! [Async]',
      'Caught an error: Oops!',
    ]);
    expect(root).toMatchRenderedOutput('Caught an error: Oops!');
  });

  // @gate enableUseHook
  test('basic use(context)', () => {
    const ContextA = React.createContext('');
    const ContextB = React.createContext('B');

    function Sync() {
      const text = use(ContextA) + use(ContextB);
      return text;
    }

    function App() {
      return (
        <ContextA.Provider value="A">
          <Sync />
        </ContextA.Provider>
      );
    }

    const root = ReactNoop.createRoot();
    root.render(<App />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(root).toMatchRenderedOutput('AB');
  });

  // @gate enableUseHook
  test('interrupting while yielded should reset contexts', async () => {
    let resolve;
    const promise = new Promise(r => {
      resolve = r;
    });

    const Context = React.createContext();

    const lazy = React.lazy(() => {
      return promise;
    });

    function ContextText() {
      return <Text text={use(Context)} />;
    }

    function App({text}) {
      return (
        <div>
          <Context.Provider value={text}>
            {lazy}
            <ContextText />
          </Context.Provider>
        </div>
      );
    }

    const root = ReactNoop.createRoot();
    startTransition(() => {
      root.render(<App text="world" />);
    });
    expect(Scheduler).toFlushUntilNextPaint([]);
    expect(root).toMatchRenderedOutput(null);

    await resolve({default: <Text key="hi" text="Hello " />});

    // Higher priority update that interrupts the first render
    ReactNoop.flushSync(() => {
      root.render(<App text="world!" />);
    });

    expect(Scheduler).toHaveYielded(['Hello ', 'world!']);

    expect(root).toMatchRenderedOutput(<div>Hello world!</div>);
  });

  // @gate enableUseHook || !__DEV__
  test('warns if use(promise) is wrapped with try/catch block', async () => {
    function Async() {
      try {
        return <Text text={use(Promise.resolve('Async'))} />;
      } catch (e) {
        return <Text text="Fallback" />;
      }
    }

    spyOnDev(console, 'error').mockImplementation(() => {});
    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Async />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.mock.calls[0][0]).toContain(
        'Warning: `use` was called from inside a try/catch block. This is not ' +
          'allowed and can lead to unexpected behavior. To handle errors ' +
          'triggered by `use`, wrap your component in a error boundary.',
      );
    }
  });

  // @gate enableUseHook
  test('during a transition, can unwrap async operations even if nothing is cached', async () => {
    function App() {
      return <Text text={use(getAsyncText('Async'))} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="Loading..." />}>
          <Text text="(empty)" />
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['(empty)']);
    expect(root).toMatchRenderedOutput('(empty)');

    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <App />
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded(['Async text requested [Async]']);
    expect(root).toMatchRenderedOutput('(empty)');

    await act(async () => {
      resolveTextRequests('Async');
    });
    expect(Scheduler).toHaveYielded(['Async text requested [Async]', 'Async']);
    expect(root).toMatchRenderedOutput('Async');
  });

  // @gate enableUseHook
  test("does not prevent a Suspense fallback from showing if it's a new boundary, even during a transition", async () => {
    function App() {
      return <Text text={use(getAsyncText('Async'))} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <App />
          </Suspense>,
        );
      });
    });
    // Even though the initial render was a transition, it shows a fallback.
    expect(Scheduler).toHaveYielded([
      'Async text requested [Async]',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('Loading...');

    // Resolve the original data
    await act(async () => {
      resolveTextRequests('Async');
    });
    // During the retry, a fresh request is initiated. Now we must wait for this
    // one to finish.
    // TODO: This is awkward. Intuitively, you might expect for `act` to wait
    // until the new request has finished loading. But if it's mock IO, as in
    // this test, how would the developer be able to imperatively flush it if it
    // wasn't initiated until the current `act` call? Can't think of a better
    // strategy at the moment.
    expect(Scheduler).toHaveYielded(['Async text requested [Async]']);
    expect(root).toMatchRenderedOutput('Loading...');

    // Flush the second request.
    await act(async () => {
      resolveTextRequests('Async');
    });
    // This time it finishes because it was during a retry.
    expect(Scheduler).toHaveYielded(['Async text requested [Async]', 'Async']);
    expect(root).toMatchRenderedOutput('Async');
  });

  // @gate enableUseHook
  test('when waiting for data to resolve, a fresh update will trigger a restart', async () => {
    function App() {
      return <Text text={use(getAsyncText('Will never resolve'))} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Suspense fallback={<Text text="Loading..." />} />);
    });

    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <App />
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [Will never resolve]',
    ]);

    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="Loading..." />}>
          <Text text="Something different" />
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Something different']);
  });

  // @gate enableUseHook
  test('while suspended, hooks cannot be called (i.e. current dispatcher is unset correctly)', async () => {
    function App() {
      return <Text text={use(getAsyncText('Will never resolve'))} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Suspense fallback={<Text text="Loading..." />} />);
    });

    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <App />
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [Will never resolve]',
    ]);

    // Calling a hook should error because we're oustide of a component.
    expect(useState).toThrow(
      'Invalid hook call. Hooks can only be called inside of the body of a ' +
        'function component.',
    );
  });

  // @gate enableUseHook
  test('unwraps thenable that fulfills synchronously without suspending', async () => {
    function App() {
      const thenable = {
        then(resolve) {
          // This thenable immediately resolves, synchronously, without waiting
          // a microtask.
          resolve('Hi');
        },
      };
      try {
        return <Text text={use(thenable)} />;
      } catch {
        throw new Error(
          '`use` should not suspend because the thenable resolved synchronously.',
        );
      }
    }
    // Because the thenable resolves synchronously, we should be able to finish
    // rendering synchronously, with no fallback.
    const root = ReactNoop.createRoot();
    ReactNoop.flushSync(() => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Hi']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  // @gate enableUseHook
  test('does not suspend indefinitely if an interleaved update was skipped', async () => {
    function Child({childShouldSuspend}) {
      return (
        <Text
          text={
            childShouldSuspend
              ? use(getAsyncText('Will never resolve'))
              : 'Child'
          }
        />
      );
    }

    let setChildShouldSuspend;
    let setShowChild;
    function Parent() {
      const [showChild, _setShowChild] = useState(true);
      setShowChild = _setShowChild;

      const [childShouldSuspend, _setChildShouldSuspend] = useState(false);
      setChildShouldSuspend = _setChildShouldSuspend;

      Scheduler.unstable_yieldValue(
        `childShouldSuspend: ${childShouldSuspend}, showChild: ${showChild}`,
      );
      return showChild ? (
        <Child childShouldSuspend={childShouldSuspend} />
      ) : (
        <Text text="(empty)" />
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<Parent />);
    });
    expect(Scheduler).toHaveYielded([
      'childShouldSuspend: false, showChild: true',
      'Child',
    ]);
    expect(root).toMatchRenderedOutput('Child');

    await act(() => {
      // Perform an update that causes the app to suspend
      startTransition(() => {
        setChildShouldSuspend(true);
      });
      expect(Scheduler).toFlushAndYieldThrough([
        'childShouldSuspend: true, showChild: true',
      ]);
      // While the update is in progress, schedule another update.
      startTransition(() => {
        setShowChild(false);
      });
    });
    expect(Scheduler).toHaveYielded([
      // Because the interleaved update is not higher priority than what we were
      // already working on, it won't interrupt. The first update will continue,
      // and will suspend.
      'Async text requested [Will never resolve]',

      // Instead of waiting for the promise to resolve, React notices there's
      // another pending update that it hasn't tried yet. It will switch to
      // rendering that instead.
      //
      // This time, the update hides the component that previous was suspending,
      // so it finishes successfully.
      'childShouldSuspend: false, showChild: false',
      '(empty)',

      // Finally, React attempts to render the first update again. It also
      // finishes successfully, because it was rebased on top of the update that
      // hid the suspended component.
      // NOTE: These this render happened to not be entangled with the previous
      // one. If they had been, this update would have been included in the
      // previous render, and there wouldn't be an extra one here. This could
      // change if we change our entanglement heurstics. Semantically, it
      // shouldn't matter, though in general we try to work on transitions in
      // parallel whenever possible. So even though in this particular case, the
      // extra render is unnecessary, it's a nice property that it wasn't
      // entangled with the other transition.
      'childShouldSuspend: true, showChild: false',
      '(empty)',
    ]);
    expect(root).toMatchRenderedOutput('(empty)');
  });

  test('when replaying a suspended component, reuses the hooks computed during the previous attempt (Memo)', async () => {
    function ExcitingText({text}) {
      // This computes the uppercased version of some text. Pretend it's an
      // expensive operation that we want to reuse.
      const uppercaseText = useMemo(() => {
        Scheduler.unstable_yieldValue('Compute uppercase: ' + text);
        return text.toUpperCase();
      }, [text]);

      // This adds an exclamation point to the text. Pretend it's an async
      // operation that is sent to a service for processing.
      const exclamatoryText = use(getAsyncText(uppercaseText + '!'));

      // This surrounds the text with sparkle emojis. The purpose in this test
      // is to show that you can suspend in the middle of a sequence of hooks
      // without breaking anything.
      const sparklingText = useMemo(() => {
        Scheduler.unstable_yieldValue('Add sparkles: ' + exclamatoryText);
        return `✨ ${exclamatoryText} ✨`;
      }, [exclamatoryText]);

      return <Text text={sparklingText} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<ExcitingText text="Hello" />);
      });
    });
    // Suspends while we wait for the async service to respond.
    expect(Scheduler).toHaveYielded([
      'Compute uppercase: Hello',
      'Async text requested [HELLO!]',
    ]);
    expect(root).toMatchRenderedOutput(null);

    // The data is received.
    await act(async () => {
      resolveTextRequests('HELLO!');
    });
    expect(Scheduler).toHaveYielded([
      // We shouldn't run the uppercase computation again, because we can reuse
      // the computation from the previous attempt.
      // 'Compute uppercase: Hello',

      'Async text requested [HELLO!]',
      'Add sparkles: HELLO!',
      '✨ HELLO! ✨',
    ]);
  });

  test('when replaying a suspended component, reuses the hooks computed during the previous attempt (State)', async () => {
    let _setFruit;
    let _setVegetable;
    function Kitchen() {
      const [fruit, setFruit] = useState('apple');
      _setFruit = setFruit;
      const usedFruit = use(getAsyncText(fruit));
      const [vegetable, setVegetable] = useState('carrot');
      _setVegetable = setVegetable;
      return <Text text={usedFruit + ' ' + vegetable} />;
    }

    // Initial render.
    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<Kitchen />);
      });
    });
    expect(Scheduler).toHaveYielded(['Async text requested [apple]']);
    expect(root).toMatchRenderedOutput(null);
    await act(async () => {
      resolveTextRequests('apple');
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [apple]',
      'apple carrot',
    ]);
    expect(root).toMatchRenderedOutput('apple carrot');

    // Update the state variable after the use().
    await act(async () => {
      startTransition(() => {
        _setVegetable('dill');
      });
    });
    expect(Scheduler).toHaveYielded(['Async text requested [apple]']);
    expect(root).toMatchRenderedOutput('apple carrot');
    await act(async () => {
      resolveTextRequests('apple');
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [apple]',
      'apple dill',
    ]);
    expect(root).toMatchRenderedOutput('apple dill');

    // Update the state variable before the use(). The second state is maintained.
    await act(async () => {
      startTransition(() => {
        _setFruit('banana');
      });
    });
    expect(Scheduler).toHaveYielded(['Async text requested [banana]']);
    expect(root).toMatchRenderedOutput('apple dill');
    await act(async () => {
      resolveTextRequests('banana');
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [banana]',
      'banana dill',
    ]);
    expect(root).toMatchRenderedOutput('banana dill');
  });

  test('when replaying a suspended component, reuses the hooks computed during the previous attempt (DebugValue+State)', async () => {
    // Make sure we don't get a Hook mismatch warning on updates if there were non-stateful Hooks before the use().
    let _setLawyer;
    function Lexicon() {
      useDebugValue(123);
      const avocado = use(getAsyncText('aguacate'));
      const [lawyer, setLawyer] = useState('abogado');
      _setLawyer = setLawyer;
      return <Text text={avocado + ' ' + lawyer} />;
    }

    // Initial render.
    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<Lexicon />);
      });
    });
    expect(Scheduler).toHaveYielded(['Async text requested [aguacate]']);
    expect(root).toMatchRenderedOutput(null);
    await act(async () => {
      resolveTextRequests('aguacate');
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [aguacate]',
      'aguacate abogado',
    ]);
    expect(root).toMatchRenderedOutput('aguacate abogado');

    // Now update the state.
    await act(async () => {
      startTransition(() => {
        _setLawyer('avocat');
      });
    });
    expect(Scheduler).toHaveYielded(['Async text requested [aguacate]']);
    expect(root).toMatchRenderedOutput('aguacate abogado');
    await act(async () => {
      resolveTextRequests('aguacate');
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [aguacate]',
      'aguacate avocat',
    ]);
    expect(root).toMatchRenderedOutput('aguacate avocat');
  });

  // @gate enableUseHook
  test(
    'wrap an async function with useMemo to skip running the function ' +
      'twice when loading new data',
    async () => {
      function App({text}) {
        const promiseForText = useMemo(async () => getAsyncText(text), [text]);
        const asyncText = use(promiseForText);
        return <Text text={asyncText} />;
      }

      const root = ReactNoop.createRoot();
      await act(async () => {
        startTransition(() => {
          root.render(<App text="Hello" />);
        });
      });
      expect(Scheduler).toHaveYielded(['Async text requested [Hello]']);
      expect(root).toMatchRenderedOutput(null);

      await act(async () => {
        resolveTextRequests('Hello');
      });
      expect(Scheduler).toHaveYielded([
        // We shouldn't request async text again, because the async function
        // was memoized
        // 'Async text requested [Hello]'

        'Hello',
      ]);
    },
  );

  // @gate enableUseHook
  test('load multiple nested Suspense boundaries', async () => {
    const getCachedAsyncText = cache(getAsyncText);

    function AsyncText({text}) {
      return <Text text={use(getCachedAsyncText(text))} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="(Loading A...)" />}>
          <AsyncText text="A" />
          <Suspense fallback={<Text text="(Loading B...)" />}>
            <AsyncText text="B" />
            <Suspense fallback={<Text text="(Loading C...)" />}>
              <AsyncText text="C" />
            </Suspense>
          </Suspense>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [A]',
      'Async text requested [B]',
      'Async text requested [C]',
      '(Loading C...)',
      '(Loading B...)',
      '(Loading A...)',
    ]);
    expect(root).toMatchRenderedOutput('(Loading A...)');

    await act(async () => {
      resolveTextRequests('A');
    });
    expect(Scheduler).toHaveYielded(['A', '(Loading C...)', '(Loading B...)']);
    expect(root).toMatchRenderedOutput('A(Loading B...)');

    await act(async () => {
      resolveTextRequests('B');
    });
    expect(Scheduler).toHaveYielded(['B', '(Loading C...)']);
    expect(root).toMatchRenderedOutput('AB(Loading C...)');

    await act(async () => {
      resolveTextRequests('C');
    });
    expect(Scheduler).toHaveYielded(['C']);
    expect(root).toMatchRenderedOutput('ABC');
  });

  // @gate enableUseHook
  test('load multiple nested Suspense boundaries (uncached requests)', async () => {
    // This the same as the previous test, except the requests are not cached.
    // The tree should still eventually resolve, despite the
    // duplicate requests.
    function AsyncText({text}) {
      // This initiates a new request on each render.
      return <Text text={use(getAsyncText(text))} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="(Loading A...)" />}>
          <AsyncText text="A" />
          <Suspense fallback={<Text text="(Loading B...)" />}>
            <AsyncText text="B" />
            <Suspense fallback={<Text text="(Loading C...)" />}>
              <AsyncText text="C" />
            </Suspense>
          </Suspense>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded([
      'Async text requested [A]',
      'Async text requested [B]',
      'Async text requested [C]',
      '(Loading C...)',
      '(Loading B...)',
      '(Loading A...)',
    ]);
    expect(root).toMatchRenderedOutput('(Loading A...)');

    await act(async () => {
      resolveTextRequests('A');
    });
    expect(Scheduler).toHaveYielded(['Async text requested [A]']);
    expect(root).toMatchRenderedOutput('(Loading A...)');

    await act(async () => {
      resolveTextRequests('A');
    });
    expect(Scheduler).toHaveYielded([
      // React suspends until A finishes loading.
      'Async text requested [A]',
      'A',

      // Now React can continue rendering the rest of the tree.

      // React does not suspend on the inner requests, because that would
      // block A from appearing. Instead it shows a fallback.
      'Async text requested [B]',
      'Async text requested [C]',
      '(Loading C...)',
      '(Loading B...)',
    ]);
    expect(root).toMatchRenderedOutput('A(Loading B...)');

    await act(async () => {
      resolveTextRequests('B');
    });
    expect(Scheduler).toHaveYielded(['Async text requested [B]']);
    expect(root).toMatchRenderedOutput('A(Loading B...)');

    await act(async () => {
      resolveTextRequests('B');
    });
    expect(Scheduler).toHaveYielded([
      // React suspends until B finishes loading.
      'Async text requested [B]',
      'B',

      // React does not suspend on C, because that would block B from appearing.
      'Async text requested [C]',
      '(Loading C...)',
    ]);
    expect(root).toMatchRenderedOutput('AB(Loading C...)');

    await act(async () => {
      resolveTextRequests('C');
    });
    expect(Scheduler).toHaveYielded(['Async text requested [C]']);
    expect(root).toMatchRenderedOutput('AB(Loading C...)');

    await act(async () => {
      resolveTextRequests('C');
    });
    expect(Scheduler).toHaveYielded(['Async text requested [C]', 'C']);
    expect(root).toMatchRenderedOutput('ABC');
  });

  // @gate enableUseHook
  test('use() combined with render phase updates', async () => {
    function Async() {
      const a = use(Promise.resolve('A'));
      const [count, setCount] = useState(0);
      if (count === 0) {
        setCount(1);
      }
      const usedCount = use(Promise.resolve(count));
      return <Text text={a + usedCount} />;
    }

    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Async />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    expect(Scheduler).toHaveYielded(['A1']);
    expect(root).toMatchRenderedOutput('A1');
  });
});
