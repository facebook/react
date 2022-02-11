let React;
let ReactNoop;
let Cache;
let getCacheSignal;
let getCacheForType;
let Scheduler;
let act;
let Suspense;
let useCacheRefresh;
let startTransition;
let useState;

let caches;
let seededCache;

describe('ReactCache', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Cache = React.unstable_Cache;
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    Suspense = React.Suspense;
    getCacheSignal = React.unstable_getCacheSignal;
    getCacheForType = React.unstable_getCacheForType;
    useCacheRefresh = React.unstable_useCacheRefresh;
    startTransition = React.startTransition;
    useState = React.useState;

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
            cleanupScheduled: false,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          record.value.resolve();
        }
      },
      reject(text, error) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'rejected',
            value: error,
            cleanupScheduled: false,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          record.value.reject();
        }
      },
    };
    caches.push(cache);
    return cache;
  }

  function readText(text) {
    const signal = getCacheSignal();
    const textCache = getCacheForType(createTextCache);
    const record = textCache.data.get(text);
    if (record !== undefined) {
      if (!record.cleanupScheduled) {
        // This record was seeded prior to the abort signal being available:
        // schedule a cleanup function for it.
        // TODO: Add ability to cleanup entries seeded w useCacheRefresh()
        record.cleanupScheduled = true;
        signal.addEventListener('abort', () => {
          Scheduler.unstable_yieldValue(
            `Cache cleanup: ${text} [v${textCache.version}]`,
          );
        });
      }
      switch (record.status) {
        case 'pending':
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return textCache.version;
      }
    } else {
      Scheduler.unstable_yieldValue(`Cache miss! [${text}]`);

      let resolve;
      let reject;
      const thenable = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      }).then(
        value => {
          if (newRecord.status === 'pending') {
            newRecord.status = 'resolved';
            newRecord.value = value;
          }
        },
        error => {
          if (newRecord.status === 'pending') {
            newRecord.status = 'rejected';
            newRecord.value = error;
          }
        },
      );
      thenable.resolve = resolve;
      thenable.reject = reject;

      const newRecord = {
        status: 'pending',
        value: thenable,
        cleanupScheduled: true,
      };
      textCache.data.set(text, newRecord);

      signal.addEventListener('abort', () => {
        Scheduler.unstable_yieldValue(
          `Cache cleanup: ${text} [v${textCache.version}]`,
        );
      });
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

  // @gate experimental || www
  test('render Cache component', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Cache>Hi</Cache>);
    });
    expect(root).toMatchRenderedOutput('Hi');
  });

  // @gate experimental || www
  test('mount new data', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Cache>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="A" />
          </Suspense>
        </Cache>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A']);
    expect(root).toMatchRenderedOutput('A');

    await act(async () => {
      root.render('Bye');
    });
    // no cleanup: cache is still retained at the root
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('root acts as implicit cache boundary', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" />
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A']);
    expect(root).toMatchRenderedOutput('A');

    await act(async () => {
      root.render('Bye');
    });
    // no cleanup: cache is still retained at the root
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('multiple new Cache boundaries in the same update share the same, fresh cache', async () => {
    function App({showMore}) {
      return showMore ? (
        <>
          <Cache>
            <Suspense fallback={<Text text="Loading..." />}>
              <AsyncText text="A" />
            </Suspense>
          </Cache>
          <Cache>
            <Suspense fallback={<Text text="Loading..." />}>
              <AsyncText text="A" />
            </Suspense>
          </Cache>
        </>
      ) : (
        '(empty)'
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('(empty)');

    await act(async () => {
      root.render(<App showMore={true} />);
    });
    // Even though there are two new <Cache /> trees, they should share the same
    // data cache. So there should be only a single cache miss for A.
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('Loading...Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');

    await act(async () => {
      root.render('Bye');
    });
    // cleanup occurs for the cache shared by the inner cache boundaries (which
    // are not shared w the root because they were added in an update)
    // note that no cache is created for the root since the cache is never accessed
    expect(Scheduler).toHaveYielded(['Cache cleanup: A [v1]']);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test(
    'nested cache boundaries share the same cache as the root during ' +
      'the initial render',
    async () => {
      function App() {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="A" />
            <Cache>
              <AsyncText text="A" />
            </Cache>
          </Suspense>
        );
      }

      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App />);
      });
      // Even though there is a nested <Cache /> boundary, it should share the same
      // data cache as the root. So there should be only a single cache miss for A.
      expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      await act(async () => {
        resolveMostRecentTextCache('A');
      });
      expect(Scheduler).toHaveYielded(['A', 'A']);
      expect(root).toMatchRenderedOutput('AA');

      await act(async () => {
        root.render('Bye');
      });
      // no cleanup: cache is still retained at the root
      expect(Scheduler).toHaveYielded([]);
      expect(root).toMatchRenderedOutput('Bye');
    },
  );

  // @gate experimental || www
  test('new content inside an existing Cache boundary should re-use already cached data', async () => {
    function App({showMore}) {
      return (
        <Cache>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText showVersion={true} text="A" />
          </Suspense>
          {showMore ? (
            <Suspense fallback={<Text text="Loading..." />}>
              <AsyncText showVersion={true} text="A" />
            </Suspense>
          ) : null}
        </Cache>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      seedNextTextCache('A');
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Add a new cache boundary
    await act(async () => {
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'A [v1]',
      // New tree should use already cached data
      'A [v1]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v1]');

    await act(async () => {
      root.render('Bye');
    });
    // no cleanup: cache is still retained at the root
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('a new Cache boundary uses fresh cache', async () => {
    // The only difference from the previous test is that the "Show More"
    // content is wrapped in a nested <Cache /> boundary
    function App({showMore}) {
      return (
        <Cache>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText showVersion={true} text="A" />
          </Suspense>
          {showMore ? (
            <Cache>
              <Suspense fallback={<Text text="Loading..." />}>
                <AsyncText showVersion={true} text="A" />
              </Suspense>
            </Cache>
          ) : null}
        </Cache>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      seedNextTextCache('A');
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Add a new cache boundary
    await act(async () => {
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'A [v1]',
      // New tree should load fresh data.
      'Cache miss! [A]',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]Loading...');
    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v2]']);
    expect(root).toMatchRenderedOutput('A [v1]A [v2]');

    // Replace all the children: this should retain the root Cache instance,
    // but cleanup the separate cache instance created for the fresh cache
    // boundary
    await act(async () => {
      root.render('Bye!');
    });
    // Cleanup occurs for the *second* cache instance: the first is still
    // referenced by the root
    expect(Scheduler).toHaveYielded(['Cache cleanup: A [v2]']);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test('inner/outer cache boundaries uses the same cache instance on initial render', async () => {
    const root = ReactNoop.createRoot();

    function App() {
      return (
        <Cache>
          <Suspense fallback={<Text text="Loading shell..." />}>
            {/* The shell reads A */}
            <Shell>
              {/* The inner content reads both A and B */}
              <Suspense fallback={<Text text="Loading content..." />}>
                <Cache>
                  <Content />
                </Cache>
              </Suspense>
            </Shell>
          </Suspense>
        </Cache>
      );
    }

    function Shell({children}) {
      readText('A');
      return (
        <>
          <div>
            <Text text="Shell" />
          </div>
          <div>{children}</div>
        </>
      );
    }

    function Content() {
      readText('A');
      readText('B');
      return <Text text="Content" />;
    }

    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading shell...']);
    expect(root).toMatchRenderedOutput('Loading shell...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded([
      'Shell',
      // There's a cache miss for B, because it hasn't been read yet. But not
      // A, because it was cached when we rendered the shell.
      'Cache miss! [B]',
      'Loading content...',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Shell</div>
        <div>Loading content...</div>
      </>,
    );

    await act(async () => {
      resolveMostRecentTextCache('B');
    });
    expect(Scheduler).toHaveYielded(['Content']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Shell</div>
        <div>Content</div>
      </>,
    );

    await act(async () => {
      root.render('Bye');
    });
    // no cleanup: cache is still retained at the root
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('inner/ outer cache boundaries added in the same update use the same cache instance', async () => {
    const root = ReactNoop.createRoot();

    function App({showMore}) {
      return showMore ? (
        <Cache>
          <Suspense fallback={<Text text="Loading shell..." />}>
            {/* The shell reads A */}
            <Shell>
              {/* The inner content reads both A and B */}
              <Suspense fallback={<Text text="Loading content..." />}>
                <Cache>
                  <Content />
                </Cache>
              </Suspense>
            </Shell>
          </Suspense>
        </Cache>
      ) : (
        '(empty)'
      );
    }

    function Shell({children}) {
      readText('A');
      return (
        <>
          <div>
            <Text text="Shell" />
          </div>
          <div>{children}</div>
        </>
      );
    }

    function Content() {
      readText('A');
      readText('B');
      return <Text text="Content" />;
    }

    await act(async () => {
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('(empty)');

    await act(async () => {
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading shell...']);
    expect(root).toMatchRenderedOutput('Loading shell...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded([
      'Shell',
      // There's a cache miss for B, because it hasn't been read yet. But not
      // A, because it was cached when we rendered the shell.
      'Cache miss! [B]',
      'Loading content...',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Shell</div>
        <div>Loading content...</div>
      </>,
    );

    await act(async () => {
      resolveMostRecentTextCache('B');
    });
    expect(Scheduler).toHaveYielded(['Content']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Shell</div>
        <div>Content</div>
      </>,
    );

    await act(async () => {
      root.render('Bye');
    });
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v1]',
      'Cache cleanup: B [v1]',
    ]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('refresh a cache boundary', async () => {
    let refresh;
    function App() {
      refresh = useCacheRefresh();
      return <AsyncText showVersion={true} text="A" />;
    }

    // Mount initial data
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Cache>
          <Suspense fallback={<Text text="Loading..." />}>
            <App />
          </Suspense>
        </Cache>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Refresh for new data.
    await act(async () => {
      startTransition(() => refresh());
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('A [v1]');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    // Note that the version has updated
    expect(Scheduler).toHaveYielded(['A [v2]']);
    expect(root).toMatchRenderedOutput('A [v2]');

    await act(async () => {
      root.render('Bye');
    });
    // the original cache instance does not cleanup since it is still referenced
    // by the root, but the refreshed inner cache does cleanup
    expect(Scheduler).toHaveYielded(['Cache cleanup: A [v2]']);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('refresh the root cache', async () => {
    let refresh;
    function App() {
      refresh = useCacheRefresh();
      return <AsyncText showVersion={true} text="A" />;
    }

    // Mount initial data
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="Loading..." />}>
          <App />
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Refresh for new data.
    await act(async () => {
      startTransition(() => refresh());
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('A [v1]');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    // Note that the version has updated, and the previous cache is cleared
    expect(Scheduler).toHaveYielded(['A [v2]', 'Cache cleanup: A [v1]']);
    expect(root).toMatchRenderedOutput('A [v2]');

    await act(async () => {
      root.render('Bye');
    });
    // the original root cache already cleaned up when the refresh completed
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('refresh the root cache without a transition', async () => {
    let refresh;
    function App() {
      refresh = useCacheRefresh();
      return <AsyncText showVersion={true} text="A" />;
    }

    // Mount initial data
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="Loading..." />}>
          <App />
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Refresh for new data.
    await act(async () => {
      refresh();
    });
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      // The v1 cache can be cleaned up since everything that references it has
      // been replaced by a fallback. When the boundary switches back to visible
      // it will use the v2 cache.
      'Cache cleanup: A [v1]',
    ]);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    // Note that the version has updated, and the previous cache is cleared
    expect(Scheduler).toHaveYielded(['A [v2]']);
    expect(root).toMatchRenderedOutput('A [v2]');

    await act(async () => {
      root.render('Bye');
    });
    // the original root cache already cleaned up when the refresh completed
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('refresh a cache with seed data', async () => {
    let refresh;
    function App() {
      refresh = useCacheRefresh();
      return <AsyncText showVersion={true} text="A" />;
    }

    // Mount initial data
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Cache>
          <Suspense fallback={<Text text="Loading..." />}>
            <App />
          </Suspense>
        </Cache>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Refresh for new data.
    await act(async () => {
      // Refresh the cache with seeded data, like you would receive from a
      // server mutation.
      // TODO: Seeding multiple typed caches. Should work by calling `refresh`
      // multiple times with different key/value pairs
      const cache = createTextCache();
      cache.resolve('A');
      startTransition(() => refresh(createTextCache, cache));
    });
    // The root should re-render without a cache miss.
    // The cache is not cleared up yet, since it's still reference by the root
    expect(Scheduler).toHaveYielded(['A [v2]']);
    expect(root).toMatchRenderedOutput('A [v2]');

    await act(async () => {
      root.render('Bye');
    });
    // the refreshed cache boundary is unmounted and cleans up
    expect(Scheduler).toHaveYielded(['Cache cleanup: A [v2]']);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // @gate experimental || www
  test('refreshing a parent cache also refreshes its children', async () => {
    let refreshShell;
    function RefreshShell() {
      refreshShell = useCacheRefresh();
      return null;
    }

    function App({showMore}) {
      return (
        <Cache>
          <RefreshShell />
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText showVersion={true} text="A" />
          </Suspense>
          {showMore ? (
            <Cache>
              <Suspense fallback={<Text text="Loading..." />}>
                <AsyncText showVersion={true} text="A" />
              </Suspense>
            </Cache>
          ) : null}
        </Cache>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      seedNextTextCache('A');
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Add a new cache boundary
    await act(async () => {
      seedNextTextCache('A');
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'A [v1]',
      // New tree should load fresh data.
      'A [v2]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v2]');

    // Now refresh the shell. This should also cause the "Show More" contents to
    // refresh, since its cache is nested inside the outer one.
    await act(async () => {
      startTransition(() => refreshShell());
    });
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v2]');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded([
      'A [v3]',
      'A [v3]',
      // once the refresh completes the inner showMore boundary frees its previous
      // cache instance, since it is now using the refreshed parent instance.
      'Cache cleanup: A [v2]',
    ]);
    expect(root).toMatchRenderedOutput('A [v3]A [v3]');

    await act(async () => {
      root.render('Bye!');
    });
    // Unmounting children releases the refreshed cache instance only; the root
    // still retains the original cache instance used for the first render
    expect(Scheduler).toHaveYielded(['Cache cleanup: A [v3]']);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test(
    'refreshing a cache boundary does not refresh the other boundaries ' +
      'that mounted at the same time (i.e. the ones that share the same cache)',
    async () => {
      let refreshFirstBoundary;
      function RefreshFirstBoundary() {
        refreshFirstBoundary = useCacheRefresh();
        return null;
      }

      function App({showMore}) {
        return showMore ? (
          <>
            <Cache>
              <Suspense fallback={<Text text="Loading..." />}>
                <RefreshFirstBoundary />
                <AsyncText showVersion={true} text="A" />
              </Suspense>
            </Cache>
            <Cache>
              <Suspense fallback={<Text text="Loading..." />}>
                <AsyncText showVersion={true} text="A" />
              </Suspense>
            </Cache>
          </>
        ) : null;
      }

      // First mount the initial shell without the nested boundaries. This is
      // necessary for this test because we want the two inner boundaries to be
      // treated like sibling providers that happen to share an underlying
      // cache, as opposed to consumers of the root-level cache.
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App showMore={false} />);
      });

      // Now reveal the boundaries. In a real app  this would be a navigation.
      await act(async () => {
        root.render(<App showMore={true} />);
      });

      // Even though there are two new <Cache /> trees, they should share the same
      // data cache. So there should be only a single cache miss for A.
      expect(Scheduler).toHaveYielded([
        'Cache miss! [A]',
        'Loading...',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...Loading...');

      await act(async () => {
        resolveMostRecentTextCache('A');
      });
      expect(Scheduler).toHaveYielded(['A [v1]', 'A [v1]']);
      expect(root).toMatchRenderedOutput('A [v1]A [v1]');

      // Refresh the first boundary. It should not refresh the second boundary,
      // even though they previously shared the same underlying cache.
      await act(async () => {
        await refreshFirstBoundary();
      });
      expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);

      await act(async () => {
        resolveMostRecentTextCache('A');
      });
      expect(Scheduler).toHaveYielded(['A [v2]']);
      expect(root).toMatchRenderedOutput('A [v2]A [v1]');

      // Unmount children: this should clear *both* cache instances:
      // the root doesn't have a cache instance (since it wasn't accessed
      // during the initial render, and all subsequent cache accesses were within
      // a fresh boundary). Therefore this causes cleanup for both the fresh cache
      // instance in the refreshed first boundary and cleanup for the non-refreshed
      // sibling boundary.
      await act(async () => {
        root.render('Bye!');
      });
      expect(Scheduler).toHaveYielded([
        'Cache cleanup: A [v2]',
        'Cache cleanup: A [v1]',
      ]);
      expect(root).toMatchRenderedOutput('Bye!');
    },
  );

  // @gate experimental || www
  test(
    'mount a new Cache boundary in a sibling while simultaneously ' +
      'resolving a Suspense boundary',
    async () => {
      function App({showMore}) {
        return (
          <>
            {showMore ? (
              <Suspense fallback={<Text text="Loading..." />}>
                <Cache>
                  <AsyncText showVersion={true} text="A" />
                </Cache>
              </Suspense>
            ) : null}
            <Suspense fallback={<Text text="Loading..." />}>
              <Cache>
                {' '}
                <AsyncText showVersion={true} text="A" />{' '}
                <AsyncText showVersion={true} text="B" />
              </Cache>
            </Suspense>
          </>
        );
      }

      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App showMore={false} />);
      });
      expect(Scheduler).toHaveYielded([
        'Cache miss! [A]',
        'Cache miss! [B]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      await act(async () => {
        // This will resolve the content in the first cache
        resolveMostRecentTextCache('A');
        resolveMostRecentTextCache('B');
        // And mount the second tree, which includes new content
        root.render(<App showMore={true} />);
      });
      expect(Scheduler).toHaveYielded([
        // The new tree should use a fresh cache
        'Cache miss! [A]',
        'Loading...',
        // The other tree uses the cached responses. This demonstrates that the
        // requests are not dropped.
        'A [v1]',
        'B [v1]',
      ]);
      expect(root).toMatchRenderedOutput('Loading... A [v1] B [v1]');

      // Now resolve the second tree
      await act(async () => {
        resolveMostRecentTextCache('A');
      });
      expect(Scheduler).toHaveYielded(['A [v2]']);
      expect(root).toMatchRenderedOutput('A [v2] A [v1] B [v1]');

      await act(async () => {
        root.render('Bye!');
      });
      // Unmounting children releases both cache boundaries, but the original
      // cache instance (used by second boundary) is still referenced by the root.
      // only the second cache instance is freed.
      expect(Scheduler).toHaveYielded(['Cache cleanup: A [v2]']);
      expect(root).toMatchRenderedOutput('Bye!');
    },
  );

  // @gate experimental || www
  test('cache pool is cleared once transitions that depend on it commit their shell', async () => {
    function Child({text}) {
      return (
        <Cache>
          <AsyncText showVersion={true} text={text} />
        </Cache>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="Loading..." />}>(empty)</Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('(empty)');

    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Child text="A" />
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('(empty)');

    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Child text="A" />
            <Child text="A" />
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded([
      // No cache miss, because it uses the pooled cache
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('(empty)');

    // Resolve the request
    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]', 'A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]A [v1]');

    // Now do another transition
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <Child text="A" />
            <Child text="A" />
            <Child text="A" />
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded([
      // First two children use the old cache because they already finished
      'A [v1]',
      'A [v1]',
      // The new child uses a fresh cache
      'Cache miss! [A]',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v1]');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]', 'A [v1]', 'A [v2]']);
    expect(root).toMatchRenderedOutput('A [v1]A [v1]A [v2]');

    // Unmount children: the first text cache instance is created only after the root
    // commits, so both fresh cache instances are released by their cache boundaries,
    // cleaning up v1 (used for the first two children which render together) and
    // v2 (used for the third boundary added later).
    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v1]',
      'Cache cleanup: A [v2]',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test('cache pool is not cleared by arbitrary commits', async () => {
    function App() {
      return (
        <>
          <ShowMore />
          <Unrelated />
        </>
      );
    }

    let showMore;
    function ShowMore() {
      const [shouldShow, _showMore] = useState(false);
      showMore = () => _showMore(true);
      return (
        <>
          <Suspense fallback={<Text text="Loading..." />}>
            {shouldShow ? (
              <Cache>
                <AsyncText showVersion={true} text="A" />
              </Cache>
            ) : null}
          </Suspense>
        </>
      );
    }

    let updateUnrelated;
    function Unrelated() {
      const [count, _updateUnrelated] = useState(0);
      updateUnrelated = _updateUnrelated;
      return <Text text={String(count)} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['0']);
    expect(root).toMatchRenderedOutput('0');

    await act(async () => {
      startTransition(() => {
        showMore();
      });
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('0');

    await act(async () => {
      updateUnrelated(1);
    });
    expect(Scheduler).toHaveYielded([
      '1',

      // Happens to re-render the fallback. Doesn't need to, but not relevant
      // to this test.
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('1');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]1');

    // Unmount children: the first text cache instance is created only after initial
    // render after calling showMore(). This instance is cleaned up when that boundary
    // is unmounted. Bc root cache instance is never accessed, the inner cache
    // boundary ends up at v1.
    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded(['Cache cleanup: A [v1]']);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test('cache boundary uses a fresh cache when its key changes', async () => {
    const root = ReactNoop.createRoot();
    seedNextTextCache('A');
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache key="A">
            <AsyncText showVersion={true} text="A" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    seedNextTextCache('B');
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache key="B">
            <AsyncText showVersion={true} text="B" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['B [v2]']);
    expect(root).toMatchRenderedOutput('B [v2]');

    // Unmount children: the fresh cache instance for B cleans up since the cache boundary
    // is the only owner, while the original cache instance (for A) is still retained by
    // the root.
    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded(['Cache cleanup: B [v2]']);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test('overlapping transitions after an initial mount use the same fresh cache', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache key="A">
            <AsyncText showVersion={true} text="A" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // After a mount, subsequent transitions use a fresh cache
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback="Loading...">
            <Cache key="B">
              <AsyncText showVersion={true} text="B" />
            </Cache>
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [B]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Update to a different text and with a different key for the cache
    // boundary: this should still use the fresh cache instance created
    // for the earlier transition
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback="Loading...">
            <Cache key="C">
              <AsyncText showVersion={true} text="C" />
            </Cache>
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [C]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    await act(async () => {
      resolveMostRecentTextCache('C');
    });
    expect(Scheduler).toHaveYielded(['C [v2]']);
    expect(root).toMatchRenderedOutput('C [v2]');

    // Unmount children: the fresh cache used for the updates is freed, while the
    // original cache (with A) is still retained at the root.
    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: B [v2]',
      'Cache cleanup: C [v2]',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test('overlapping updates after an initial mount use the same fresh cache', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache key="A">
            <AsyncText showVersion={true} text="A" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // After a mount, subsequent updates use a fresh cache
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache key="B">
            <AsyncText showVersion={true} text="B" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [B]']);
    expect(root).toMatchRenderedOutput('Loading...');

    // A second update uses the same fresh cache: even though this is a new
    // Cache boundary, the render uses the fresh cache from the pending update.
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache key="C">
            <AsyncText showVersion={true} text="C" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [C]']);
    expect(root).toMatchRenderedOutput('Loading...');

    await act(async () => {
      resolveMostRecentTextCache('C');
    });
    expect(Scheduler).toHaveYielded(['C [v2]']);
    expect(root).toMatchRenderedOutput('C [v2]');

    // Unmount children: the fresh cache used for the updates is freed, while the
    // original cache (with A) is still retained at the root.
    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: B [v2]',
      'Cache cleanup: C [v2]',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test('cleans up cache only used in an aborted transition', async () => {
    const root = ReactNoop.createRoot();
    seedNextTextCache('A');
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache key="A">
            <AsyncText showVersion={true} text="A" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Start a transition from A -> B..., which should create a fresh cache
    // for the new cache boundary (bc of the different key)
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback="Loading...">
            <Cache key="B">
              <AsyncText showVersion={true} text="B" />
            </Cache>
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [B]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // ...but cancel by transitioning "back" to A (which we never really left)
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback="Loading...">
            <Cache key="A">
              <AsyncText showVersion={true} text="A" />
            </Cache>
          </Suspense>,
        );
      });
    });
    expect(Scheduler).toHaveYielded(['A [v1]', 'Cache cleanup: B [v2]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Unmount children: ...
    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test.skip('if a root cache refresh never commits its fresh cache is released', async () => {
    const root = ReactNoop.createRoot();
    let refresh;
    function Example({text}) {
      refresh = useCacheRefresh();
      return <AsyncText showVersion={true} text={text} />;
    }
    seedNextTextCache('A');
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Example text="A" />
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    await act(async () => {
      startTransition(() => {
        refresh();
      });
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded([
      // TODO: the v1 cache should *not* be cleaned up, it is still retained by the root
      // The following line is presently yielded but should not be:
      // 'Cache cleanup: A [v1]',

      // TODO: the v2 cache *should* be cleaned up, it was created for the abandoned refresh
      // The following line is presently not yielded but should be:
      'Cache cleanup: A [v2]',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // @gate experimental || www
  test.skip('if a cache boundary refresh never commits its fresh cache is released', async () => {
    const root = ReactNoop.createRoot();
    let refresh;
    function Example({text}) {
      refresh = useCacheRefresh();
      return <AsyncText showVersion={true} text={text} />;
    }
    seedNextTextCache('A');
    await act(async () => {
      root.render(
        <Suspense fallback="Loading...">
          <Cache>
            <Example text="A" />
          </Cache>
        </Suspense>,
      );
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    await act(async () => {
      startTransition(() => {
        refresh();
      });
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Unmount the boundary before the refresh can complete
    await act(async () => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded([
      // TODO: the v2 cache *should* be cleaned up, it was created for the abandoned refresh
      // The following line is presently not yielded but should be:
      'Cache cleanup: A [v2]',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });
});
