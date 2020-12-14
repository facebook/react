let React;
let ReactNoop;
let Cache;
let getCacheForType;
let Scheduler;
let Suspense;
let useRefresh;

let textService;
let textServiceVersion;

describe('ReactCache', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Cache = React.unstable_Cache;
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    getCacheForType = React.unstable_getCacheForType;
    useRefresh = React.unstable_useRefresh;

    // Represents some data service that returns text. It likely has additional
    // caching layers, like a CDN or the local browser cache. It can be mutated
    // or emptied independently of the React cache.
    textService = new Map();
    textServiceVersion = 1;
  });

  function createTextCache() {
    return new Map();
  }

  function readText(text) {
    const textCache = getCacheForType(createTextCache);
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.unstable_yieldValue(`Cache miss! [${text}]`);

      let request = textService.get(text);
      if (request === undefined) {
        let resolve;
        let reject;
        request = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        request.resolve = resolve;
        request.reject = reject;

        // Add the request to a backing cache. This may outlive the lifetime
        // of the component that is currently reading the data.
        textService.set(text, request);
      }

      const thenable = request.then(
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

      const newRecord = {
        ping: null,
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function mutateRemoteTextService() {
    textService = new Map();
    textServiceVersion++;
  }

  function resolveText(text) {
    const request = textService.get(text);
    if (request !== undefined) {
      request.resolve(textServiceVersion);
      return request;
    } else {
      const newRequest = Promise.resolve(textServiceVersion);
      newRequest.resolve = newRequest.reject = () => {};
      textService.set(text, newRequest);
      return newRequest;
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

  // @gate experimental
  test('render Cache component', async () => {
    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<Cache>Hi</Cache>);
    });
    expect(root).toMatchRenderedOutput('Hi');
  });

  // @gate experimental
  test('mount new data', async () => {
    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
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

    await ReactNoop.act(async () => {
      await resolveText('A');
    });
    expect(Scheduler).toHaveYielded(['A']);
    expect(root).toMatchRenderedOutput('A');
  });

  // @gate experimental
  test('multiple new Cache boundaries in the same update share the same, fresh cache', async () => {
    function App({text}) {
      return (
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
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App showMore={false} />);
    });
    // Even though there are two new <Cache /> trees, they should share the same
    // data cache. So there should be only a single cache miss for A.
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('Loading...Loading...');

    await ReactNoop.act(async () => {
      await resolveText('A');
    });
    expect(Scheduler).toHaveYielded(['A', 'A']);
    expect(root).toMatchRenderedOutput('AA');
  });

  // @gate experimental
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
    await ReactNoop.act(async () => {
      await resolveText('A');
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      'A [v1]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Simulate a server mutation.
    mutateRemoteTextService();

    // Add a new cache boundary
    await ReactNoop.act(async () => {
      await resolveText('A');
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'A [v1]',
      // New tree should use already cached data
      'A [v1]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v1]');
  });

  // @gate experimental
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
    await ReactNoop.act(async () => {
      await resolveText('A');
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      'A [v1]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Simulate a server mutation.
    mutateRemoteTextService();

    // Add a new cache boundary
    await ReactNoop.act(async () => {
      await resolveText('A');
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'A [v1]',
      // New tree should load fresh data.
      'Cache miss! [A]',
      'Loading...',
      'A [v2]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v2]');
  });

  // @gate experimental
  test('inner content uses same cache as shell if spawned by the same transition', async () => {
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

    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading shell...']);
    expect(root).toMatchRenderedOutput('Loading shell...');

    await ReactNoop.act(async () => {
      await resolveText('A');
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

    await ReactNoop.act(async () => {
      await resolveText('B');
    });
    expect(Scheduler).toHaveYielded(['Content']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Shell</div>
        <div>Content</div>
      </>,
    );
  });

  // @gate experimental
  test('refresh a cache', async () => {
    let refresh;
    function App() {
      refresh = useRefresh();
      return <AsyncText showVersion={true} text="A" />;
    }

    // Mount initial data
    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
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

    await ReactNoop.act(async () => {
      await resolveText('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Mutate the text service, then refresh for new data.
    mutateRemoteTextService();
    await ReactNoop.act(async () => {
      refresh();
    });
    expect(Scheduler).toHaveYielded(['Cache miss! [A]', 'Loading...']);
    expect(root).toMatchRenderedOutput('A [v1]');

    await ReactNoop.act(async () => {
      await resolveText('A');
    });
    // Note that the version has updated
    expect(Scheduler).toHaveYielded(['A [v2]']);
    expect(root).toMatchRenderedOutput('A [v2]');
  });

  // @gate experimental
  test('refresh a cache with seed data', async () => {
    let refresh;
    function App() {
      refresh = useRefresh();
      return <AsyncText showVersion={true} text="A" />;
    }

    // Mount initial data
    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
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

    await ReactNoop.act(async () => {
      await resolveText('A');
    });
    expect(Scheduler).toHaveYielded(['A [v1]']);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Mutate the text service, then refresh for new data.
    mutateRemoteTextService();
    await ReactNoop.act(async () => {
      // Refresh the cache with seeded data, like you would receive from a
      // server mutation.
      // TODO: Seeding multiple typed caches. Should work by calling `refresh`
      // multiple times with different key/value pairs
      const seededCache = new Map();
      seededCache.set('A', {
        ping: null,
        status: 'resolved',
        value: textServiceVersion,
      });
      refresh(createTextCache, seededCache);
    });
    // The root should re-render without a cache miss.
    expect(Scheduler).toHaveYielded(['A [v2]']);
    expect(root).toMatchRenderedOutput('A [v2]');
  });

  // @gate experimental
  test('refreshing a parent cache also refreshes its children', async () => {
    let refreshShell;
    function RefreshShell() {
      refreshShell = useRefresh();
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
    await ReactNoop.act(async () => {
      await resolveText('A');
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      'A [v1]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]');

    // Simulate a server mutation.
    mutateRemoteTextService();

    // Add a new cache boundary
    await ReactNoop.act(async () => {
      await resolveText('A');
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'A [v1]',
      // New tree should load fresh data.
      'Cache miss! [A]',
      'Loading...',
      'A [v2]',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v2]');

    // Now refresh the shell. This should also cause the "Show More" contents to
    // refresh, since its cache is nested inside the outer one.
    mutateRemoteTextService();
    await ReactNoop.act(async () => {
      refreshShell();
    });
    expect(Scheduler).toHaveYielded([
      'Cache miss! [A]',
      'Loading...',
      'Loading...',
    ]);
    expect(root).toMatchRenderedOutput('A [v1]A [v2]');

    await ReactNoop.act(async () => {
      await resolveText('A');
    });
    expect(Scheduler).toHaveYielded(['A [v3]', 'A [v3]']);
    expect(root).toMatchRenderedOutput('A [v3]A [v3]');
  });

  // @gate experimental
  test(
    'refreshing a cache boundary also refreshes the other boundaries ' +
      'that mounted at the same time (i.e. the ones that share the same cache)',
    async () => {
      let refreshFirstBoundary;
      function RefreshFirstBoundary() {
        refreshFirstBoundary = useRefresh();
        return null;
      }

      function App({text}) {
        return (
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
        );
      }

      const root = ReactNoop.createRoot();
      await ReactNoop.act(async () => {
        root.render(<App showMore={false} />);
      });
      // Even though there are two new <Cache /> trees, they should share the same
      // data cache. So there should be only a single cache miss for A.
      expect(Scheduler).toHaveYielded([
        'Cache miss! [A]',
        'Loading...',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('Loading...Loading...');

      await ReactNoop.act(async () => {
        await resolveText('A');
      });
      expect(Scheduler).toHaveYielded(['A [v1]', 'A [v1]']);
      expect(root).toMatchRenderedOutput('A [v1]A [v1]');

      // Refresh the first boundary. It should also refresh the second boundary,
      // since they appeared at the same time.
      mutateRemoteTextService();
      await ReactNoop.act(async () => {
        await refreshFirstBoundary();
      });
      expect(Scheduler).toHaveYielded([
        'Cache miss! [A]',
        'Loading...',
        'Loading...',
      ]);

      await ReactNoop.act(async () => {
        await resolveText('A');
      });
      expect(Scheduler).toHaveYielded(['A [v2]', 'A [v2]']);
      expect(root).toMatchRenderedOutput('A [v2]A [v2]');
    },
  );
});
