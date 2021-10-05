const {test} = require('jest-snapshot-serializer-raw');

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
      signal.addEventListener('abort', () => {
        Scheduler.unstable_yieldValue(
          `Cache cleanup: ${text} [v${textCache.version}] (cached)`,
        );
      });
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

  // TODO OK
  // @gate experimental || www
  test('render Cache component', async () => {
    const root = ReactNoop.createRoot();
    function Example(props) {
      return <Cache>{props.text}</Cache>;
    }
    await act(async () => {
      root.render(<Example text="Hi" />);
    });
    expect(root).toMatchRenderedOutput('Hi');
  });

  // TODO OK
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

  // TODO OK
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

  // TODO OK
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

    await act(async => {
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
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v1]', // first AsyncText gets a cache miss
      'Cache cleanup: A [v1] (cached)', // second AsyncText shares the same entry
      'Cache cleanup: A [v1] (cached)', // 2nd render of first AsyncText
      'Cache cleanup: A [v1] (cached)', // 2nd render of second AsyncText
    ]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // TODO OK
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

  // TODO OK
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

  // TODO OK
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
    await act(async => {
      root.render('Bye!');
    });
    // Cleanup occurs for the *second* cache instance: the first is still
    // referenced by the root
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v2]', // initial render (suspends)
      'Cache cleanup: A [v2] (cached)', // second render (after data resolves)
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // TODO OK
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

  // TODO OK
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
      // first render stops on cache miss of A
      'Cache cleanup: A [v1]',
      // resume: shell reads A, Content reads A and gets a cache miss on B
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: B [v1]',
      // resume again: cache hits for A and B
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: B [v1] (cached)',
    ]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // TODO OK
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
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v2]',
      'Cache cleanup: A [v2] (cached)',
    ]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // TODO OK
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
    expect(Scheduler).toHaveYielded([
      'A [v2]',
      'Cache cleanup: A [v1]', // from initial suspended render
      'Cache cleanup: A [v1] (cached)', // from resumption
    ]);
    expect(root).toMatchRenderedOutput('A [v2]');

    await act(async () => {
      root.render('Bye');
    });
    // the original root cache already cleaned up when the refresh completed
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Bye');
  });

  // TODO OK
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

      // cleanup occurs immediately bc the root commits w a new cache
      'Cache cleanup: A [v1]',
      'Cache cleanup: A [v1] (cached)',
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

  // TODO OK
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
    expect(Scheduler).toHaveYielded([
      // note there is no non '(cached)' version, since the refresh cache was seeded
      'Cache cleanup: A [v2] (cached)',
    ]);
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
      // note that the entry is "(cached)" because the cache was seeded w a value.
      'Cache cleanup: A [v2] (cached)',
    ]);
    expect(root).toMatchRenderedOutput('A [v3]A [v3]');

    await act(async => {
      root.render('Bye!');
    });
    // Unmounting children releases the refreshed cache instance only; the root
    // still retains the original cache instance used for the first render
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v3]',
      'Cache cleanup: A [v3] (cached)',
      'Cache cleanup: A [v3] (cached)',
      'Cache cleanup: A [v3] (cached)',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // TODO OK
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

      // Replace all the children: this should clear *both* cache instances:
      // the root doesn't have a cache instance (since it wasn't accessed
      // during the initial render, and all subsequent cache accesses were within
      // a fresh boundary). Therefore this causes cleanup for both the fresh cache
      // instance in the refreshed first boundary and cleanup for the non-refreshed
      // sibling boundary.
      await act(async => {
        root.render('Bye!');
      });
      expect(Scheduler).toHaveYielded([
        'Cache cleanup: A [v2]',
        'Cache cleanup: A [v2] (cached)',
        'Cache cleanup: A [v1]',
        'Cache cleanup: A [v1] (cached)',
        'Cache cleanup: A [v1] (cached)',
        'Cache cleanup: A [v1] (cached)',
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

      await act(async => {
        root.render('Bye!');
      });
      // Unmounting children releases both cache boundaries, but the original
      // cache instance (used by second boundary) is still referenced by the root.
      // only the second cache instance is freed.
      expect(Scheduler).toHaveYielded([
        'Cache cleanup: A [v2]',
        'Cache cleanup: A [v2] (cached)',
      ]);
      expect(root).toMatchRenderedOutput('Bye!');
    },
  );

  // TODO unsure about this one
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

    await act(async => {
      root.render('Bye!');
    });
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v1]',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v1] (cached)',
      'Cache cleanup: A [v2]',
      'Cache cleanup: A [v2] (cached)',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });

  // TODO unsure about this one
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
                <AsyncText text="A" />
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
      'Cache miss! [A]',

      // Happens to re-render the fallback. Doesn't need to, but not relevant
      // to this test.
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('1');

    await act(async () => {
      resolveMostRecentTextCache('A');
    });
    expect(Scheduler).toHaveYielded(['A']);
    expect(root).toMatchRenderedOutput('A1');

    await act(async => {
      root.render('Bye!');
    });
    // the cache boundary's fresh cache is freed, but the original root cache
    // is still retained by the root
    expect(Scheduler).toHaveYielded([
      'Cache cleanup: A [v2]',
      'Cache cleanup: A [v2] (cached)',
    ]);
    expect(root).toMatchRenderedOutput('Bye!');
  });
});
