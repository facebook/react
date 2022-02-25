let React;
let ReactNoop;
let Scheduler;
let act;
let Suspense;
let getCacheForType;
let startTransition;

let caches;
let seededCache;

describe('ReactConcurrentErrorRecovery', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    Suspense = React.Suspense;
    startTransition = React.startTransition;

    getCacheForType = React.unstable_getCacheForType;

    caches = [];
    seededCache = null;
  });

  function createTextCache() {
    if (seededCache !== null) {
      // Trick to seed a cache before it exists.
      // TODO: Need a built-in API to seed data before the initial render (i.e.
      // not a refresh because nothing has mounted yet).
      const cache = seededCache;
      seededCache = null;
      return cache;
    }

    const data = new Map();
    const version = caches.length + 1;
    const cache = {
      version,
      data,
      resolve(text) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'resolved',
            value: text,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'resolved';
          record.value = text;
          thenable.pings.forEach(t => t());
        }
      },
      reject(text, error) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'rejected',
            value: error,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'rejected';
          record.value = error;
          thenable.pings.forEach(t => t());
        }
      },
    };
    caches.push(cache);
    return cache;
  }

  function readText(text) {
    const textCache = getCacheForType(createTextCache);
    const record = textCache.data.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          Scheduler.unstable_yieldValue(`Error! [${text}]`);
          throw record.value;
        case 'resolved':
          return textCache.version;
      }
    } else {
      Scheduler.unstable_yieldValue(`Suspend! [${text}]`);

      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.data.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function AsyncText({text, showVersion}) {
    const version = readText(text);
    const fullText = showVersion ? `${text} [v${version}]` : text;
    Scheduler.unstable_yieldValue(fullText);
    return fullText;
  }

  function seedNextTextCache(text) {
    if (seededCache === null) {
      seededCache = createTextCache();
    }
    seededCache.resolve(text);
  }

  function resolveMostRecentTextCache(text) {
    if (caches.length === 0) {
      throw Error('Cache does not exist.');
    } else {
      // Resolve the most recently created cache. An older cache can by
      // resolved with `caches[index].resolve(text)`.
      caches[caches.length - 1].resolve(text);
    }
  }

  const resolveText = resolveMostRecentTextCache;

  function rejectMostRecentTextCache(text, error) {
    if (caches.length === 0) {
      throw Error('Cache does not exist.');
    } else {
      // Resolve the most recently created cache. An older cache can by
      // resolved with `caches[index].reject(text, error)`.
      caches[caches.length - 1].reject(text, error);
    }
  }

  const rejectText = rejectMostRecentTextCache;

  // @gate enableCache
  test('errors during a refresh transition should not force fallbacks to display (suspend then error)', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error !== null) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    function App({step}) {
      return (
        <>
          <Suspense fallback={<Text text="Loading..." />}>
            <ErrorBoundary>
              <AsyncText text={'A' + step} />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<Text text="Loading..." />}>
            <ErrorBoundary>
              <AsyncText text={'B' + step} />
            </ErrorBoundary>
          </Suspense>
        </>
      );
    }

    // Initial render
    const root = ReactNoop.createRoot();
    seedNextTextCache('A1');
    seedNextTextCache('B1');
    await act(async () => {
      root.render(<App step={1} />);
    });
    expect(Scheduler).toHaveYielded(['A1', 'B1']);
    expect(root).toMatchRenderedOutput('A1B1');

    // Start a refresh transition
    await act(async () => {
      startTransition(() => {
        root.render(<App step={2} />);
      });
    });
    expect(Scheduler).toHaveYielded([
      'Suspend! [A2]',
      'Loading...',
      'Suspend! [B2]',
      'Loading...',
    ]);
    // Because this is a refresh, we don't switch to a fallback
    expect(root).toMatchRenderedOutput('A1B1');

    // B fails to load.
    await act(async () => {
      rejectText('B2', new Error('Oops!'));
    });

    // Because we're still suspended on A, we can't show an error boundary. We
    // should wait for A to resolve.
    if (gate(flags => flags.replayFailedUnitOfWorkWithInvokeGuardedCallback)) {
      expect(Scheduler).toHaveYielded([
        'Suspend! [A2]',
        'Loading...',

        'Error! [B2]',
        // This extra log happens when we replay the error
        // in invokeGuardedCallback
        'Error! [B2]',
        'Oops!',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'Suspend! [A2]',
        'Loading...',
        'Error! [B2]',
        'Oops!',
      ]);
    }
    // Remain on previous screen.
    expect(root).toMatchRenderedOutput('A1B1');

    // A finishes loading.
    await act(async () => {
      resolveText('A2');
    });
    if (gate(flags => flags.replayFailedUnitOfWorkWithInvokeGuardedCallback)) {
      expect(Scheduler).toHaveYielded([
        'A2',
        'Error! [B2]',
        // This extra log happens when we replay the error
        // in invokeGuardedCallback
        'Error! [B2]',
        'Oops!',

        'A2',
        'Error! [B2]',
        // This extra log happens when we replay the error
        // in invokeGuardedCallback
        'Error! [B2]',
        'Oops!',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'A2',
        'Error! [B2]',
        'Oops!',

        'A2',
        'Error! [B2]',
        'Oops!',
      ]);
    }
    // Now we can show the error boundary that's wrapped around B.
    expect(root).toMatchRenderedOutput('A2Oops!');
  });

  // @gate enableCache
  test('errors during a refresh transition should not force fallbacks to display (error then suspend)', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error !== null) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    function App({step}) {
      return (
        <>
          <Suspense fallback={<Text text="Loading..." />}>
            <ErrorBoundary>
              <AsyncText text={'A' + step} />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<Text text="Loading..." />}>
            <ErrorBoundary>
              <AsyncText text={'B' + step} />
            </ErrorBoundary>
          </Suspense>
        </>
      );
    }

    // Initial render
    const root = ReactNoop.createRoot();
    seedNextTextCache('A1');
    seedNextTextCache('B1');
    await act(async () => {
      root.render(<App step={1} />);
    });
    expect(Scheduler).toHaveYielded(['A1', 'B1']);
    expect(root).toMatchRenderedOutput('A1B1');

    // Start a refresh transition
    await act(async () => {
      startTransition(() => {
        root.render(<App step={2} />);
      });
    });
    expect(Scheduler).toHaveYielded([
      'Suspend! [A2]',
      'Loading...',
      'Suspend! [B2]',
      'Loading...',
    ]);
    // Because this is a refresh, we don't switch to a fallback
    expect(root).toMatchRenderedOutput('A1B1');

    // A fails to load.
    await act(async () => {
      rejectText('A2', new Error('Oops!'));
    });

    // Because we're still suspended on B, we can't show an error boundary. We
    // should wait for B to resolve.
    if (gate(flags => flags.replayFailedUnitOfWorkWithInvokeGuardedCallback)) {
      expect(Scheduler).toHaveYielded([
        'Error! [A2]',
        // This extra log happens when we replay the error
        // in invokeGuardedCallback
        'Error! [A2]',
        'Oops!',

        'Suspend! [B2]',
        'Loading...',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'Error! [A2]',
        'Oops!',
        'Suspend! [B2]',
        'Loading...',
      ]);
    }
    // Remain on previous screen.
    expect(root).toMatchRenderedOutput('A1B1');

    // B finishes loading.
    await act(async () => {
      resolveText('B2');
    });
    if (gate(flags => flags.replayFailedUnitOfWorkWithInvokeGuardedCallback)) {
      expect(Scheduler).toHaveYielded([
        'Error! [A2]',
        // This extra log happens when we replay the error
        // in invokeGuardedCallback
        'Error! [A2]',
        'Oops!',
        'B2',

        'Error! [A2]',
        // This extra log happens when we replay the error
        // in invokeGuardedCallback
        'Error! [A2]',
        'Oops!',
        'B2',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'Error! [A2]',
        'Oops!',
        'B2',

        'Error! [A2]',
        'Oops!',
        'B2',
      ]);
    }
    // Now we can show the error boundary that's wrapped around B.
    expect(root).toMatchRenderedOutput('Oops!B2');
  });

  // @gate enableCache
  test('suspending in the shell (outside a Suspense boundary) should not throw, warn, or log during a transition', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error !== null) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    // The initial render suspends without a Suspense boundary. Since it's
    // wrapped in startTransition, it suspends instead of erroring.
    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(<AsyncText text="Async" />);
      });
    });
    expect(Scheduler).toHaveYielded(['Suspend! [Async]']);
    expect(root).toMatchRenderedOutput(null);

    // This also works if the suspended component is wrapped with an error
    // boundary. (This is only interesting because when a component suspends
    // outside of a transition, we throw an error, which can be captured by
    // an error boundary.
    await act(async () => {
      startTransition(() => {
        root.render(
          <ErrorBoundary>
            <AsyncText text="Async" />
          </ErrorBoundary>,
        );
      });
    });
    expect(Scheduler).toHaveYielded(['Suspend! [Async]']);
    expect(root).toMatchRenderedOutput(null);

    // Continues rendering once data resolves
    await act(async () => {
      resolveText('Async');
    });
    expect(Scheduler).toHaveYielded(['Async']);
    expect(root).toMatchRenderedOutput('Async');
  });

  // @gate enableCache
  test(
    'errors during a suspended transition at the shell should not force ' +
      'fallbacks to display (error then suspend)',
    async () => {
      // This is similar to the earlier test for errors that occur during
      // a refresh transition. Suspending in the shell is conceptually the same
      // as a refresh, but they have slightly different implementation paths.

      class ErrorBoundary extends React.Component {
        state = {error: null};
        static getDerivedStateFromError(error) {
          return {error};
        }
        render() {
          if (this.state.error !== null) {
            return (
              <Text text={'Caught an error: ' + this.state.error.message} />
            );
          }
          return this.props.children;
        }
      }

      function Throws() {
        throw new Error('Oops!');
      }

      // Suspend and throw in the same transition
      const root = ReactNoop.createRoot();
      await act(async () => {
        startTransition(() => {
          root.render(
            <ErrorBoundary>
              <AsyncText text="Async" />
              <Throws />
            </ErrorBoundary>,
          );
        });
      });
      expect(Scheduler).toHaveYielded([
        'Suspend! [Async]',
        // TODO: Ideally we would skip this second render pass to render the
        // error UI, since it's not going to commit anyway. The same goes for
        // Suspense fallbacks during a refresh transition.
        'Caught an error: Oops!',
      ]);
      // The render suspended without committing or surfacing the error.
      expect(root).toMatchRenderedOutput(null);

      // Try the reverse order, too: throw then suspend
      await act(async () => {
        startTransition(() => {
          root.render(
            <ErrorBoundary>
              <Throws />
              <AsyncText text="Async" />
            </ErrorBoundary>,
          );
        });
      });
      expect(Scheduler).toHaveYielded([
        'Suspend! [Async]',
        'Caught an error: Oops!',
      ]);
      expect(root).toMatchRenderedOutput(null);

      await act(async () => {
        await resolveText('Async');
      });

      expect(Scheduler).toHaveYielded([
        'Async',
        'Caught an error: Oops!',

        // Try recovering from the error by rendering again synchronously
        'Async',
        'Caught an error: Oops!',
      ]);

      expect(root).toMatchRenderedOutput('Caught an error: Oops!');
    },
  );
});
