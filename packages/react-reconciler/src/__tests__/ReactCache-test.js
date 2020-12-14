let React;
let ReactNoop;
let Cache;
let getCacheForType;
let Scheduler;
let Suspense;
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
});
