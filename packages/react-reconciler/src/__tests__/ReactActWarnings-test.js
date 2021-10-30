/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

let React;
let Scheduler;
let ReactNoop;
let useState;
let act;
let Suspense;
let startTransition;
let getCacheForType;
let caches;

// These tests are mostly concerned with concurrent roots. The legacy root
// behavior is covered by other older test suites and is unchanged from
// React 17.
describe('act warnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    Scheduler = require('scheduler');
    ReactNoop = require('react-noop-renderer');
    act = React.unstable_act;
    useState = React.useState;
    Suspense = React.Suspense;
    startTransition = React.startTransition;
    getCacheForType = React.unstable_getCacheForType;
    caches = [];
  });

  function createTextCache() {
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

  function AsyncText({text}) {
    readText(text);
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function resolveText(text) {
    if (caches.length === 0) {
      throw Error('Cache does not exist.');
    } else {
      // Resolve the most recently created cache. An older cache can by
      // resolved with `caches[index].resolve(text)`.
      caches[caches.length - 1].resolve(text);
    }
  }

  function withActEnvironment(value, scope) {
    const prevValue = global.IS_REACT_ACT_ENVIRONMENT;
    global.IS_REACT_ACT_ENVIRONMENT = value;
    try {
      return scope();
    } finally {
      global.IS_REACT_ACT_ENVIRONMENT = prevValue;
    }
  }

  test('warns about unwrapped updates only if environment flag is enabled', () => {
    let setState;
    function App() {
      const [state, _setState] = useState(0);
      setState = _setState;
      return <Text text={state} />;
    }

    const root = ReactNoop.createRoot();
    root.render(<App />);
    expect(Scheduler).toFlushAndYield([0]);
    expect(root).toMatchRenderedOutput('0');

    // Default behavior. Flag is undefined. No warning.
    expect(global.IS_REACT_ACT_ENVIRONMENT).toBe(undefined);
    setState(1);
    expect(Scheduler).toFlushAndYield([1]);
    expect(root).toMatchRenderedOutput('1');

    // Flag is true. Warn.
    withActEnvironment(true, () => {
      expect(() => setState(2)).toErrorDev(
        'An update to App inside a test was not wrapped in act',
      );
      expect(Scheduler).toFlushAndYield([2]);
      expect(root).toMatchRenderedOutput('2');
    });

    // Flag is false. No warning.
    withActEnvironment(false, () => {
      setState(3);
      expect(Scheduler).toFlushAndYield([3]);
      expect(root).toMatchRenderedOutput('3');
    });
  });

  // @gate __DEV__
  test('act warns if the environment flag is not enabled', () => {
    let setState;
    function App() {
      const [state, _setState] = useState(0);
      setState = _setState;
      return <Text text={state} />;
    }

    const root = ReactNoop.createRoot();
    root.render(<App />);
    expect(Scheduler).toFlushAndYield([0]);
    expect(root).toMatchRenderedOutput('0');

    // Default behavior. Flag is undefined. Warn.
    expect(global.IS_REACT_ACT_ENVIRONMENT).toBe(undefined);
    expect(() => {
      act(() => {
        setState(1);
      });
    }).toErrorDev(
      'The current testing environment is not configured to support act(...)',
      {withoutStack: true},
    );
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('1');

    // Flag is true. Don't warn.
    withActEnvironment(true, () => {
      act(() => {
        setState(2);
      });
      expect(Scheduler).toHaveYielded([2]);
      expect(root).toMatchRenderedOutput('2');
    });

    // Flag is false. Warn.
    withActEnvironment(false, () => {
      expect(() => {
        act(() => {
          setState(1);
        });
      }).toErrorDev(
        'The current testing environment is not configured to support act(...)',
        {withoutStack: true},
      );
      expect(Scheduler).toHaveYielded([1]);
      expect(root).toMatchRenderedOutput('1');
    });
  });

  test('warns if root update is not wrapped', () => {
    withActEnvironment(true, () => {
      const root = ReactNoop.createRoot();
      expect(() => root.render('Hi')).toErrorDev(
        // TODO: Better error message that doesn't make it look like "Root" is
        // the name of a custom component
        'An update to Root inside a test was not wrapped in act(...)',
        {withoutStack: true},
      );
    });
  });

  // @gate __DEV__
  test('warns if class update is not wrapped', () => {
    let app;
    class App extends React.Component {
      state = {count: 0};
      render() {
        app = this;
        return <Text text={this.state.count} />;
      }
    }

    withActEnvironment(true, () => {
      const root = ReactNoop.createRoot();
      act(() => {
        root.render(<App />);
      });
      expect(() => app.setState({count: 1})).toErrorDev(
        'An update to App inside a test was not wrapped in act(...)',
      );
    });
  });

  // @gate __DEV__
  test('warns even if update is synchronous', () => {
    let setState;
    function App() {
      const [state, _setState] = useState(0);
      setState = _setState;
      return <Text text={state} />;
    }

    withActEnvironment(true, () => {
      const root = ReactNoop.createRoot();
      act(() => root.render(<App />));
      expect(Scheduler).toHaveYielded([0]);
      expect(root).toMatchRenderedOutput('0');

      // Even though this update is synchronous, we should still fire a warning,
      // because it could have spawned additional asynchronous work
      expect(() => ReactNoop.flushSync(() => setState(1))).toErrorDev(
        'An update to App inside a test was not wrapped in act(...)',
      );

      expect(Scheduler).toHaveYielded([1]);
      expect(root).toMatchRenderedOutput('1');
    });
  });

  // @gate __DEV__
  // @gate enableCache
  test('warns if Suspense retry is not wrapped', () => {
    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="Async" />
        </Suspense>
      );
    }

    withActEnvironment(true, () => {
      const root = ReactNoop.createRoot();
      act(() => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['Suspend! [Async]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      // This is a retry, not a ping, because we already showed a fallback.
      expect(() =>
        resolveText('Async'),
      ).toErrorDev(
        'A suspended resource finished loading inside a test, but the event ' +
          'was not wrapped in act(...)',
        {withoutStack: true},
      );
    });
  });

  // @gate __DEV__
  // @gate enableCache
  test('warns if Suspense ping is not wrapped', () => {
    function App({showMore}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {showMore ? <AsyncText text="Async" /> : <Text text="(empty)" />}
        </Suspense>
      );
    }

    withActEnvironment(true, () => {
      const root = ReactNoop.createRoot();
      act(() => {
        root.render(<App showMore={false} />);
      });
      expect(Scheduler).toHaveYielded(['(empty)']);
      expect(root).toMatchRenderedOutput('(empty)');

      act(() => {
        startTransition(() => {
          root.render(<App showMore={true} />);
        });
      });
      expect(Scheduler).toHaveYielded(['Suspend! [Async]', 'Loading...']);
      expect(root).toMatchRenderedOutput('(empty)');

      // This is a ping, not a retry, because no fallback is showing.
      expect(() =>
        resolveText('Async'),
      ).toErrorDev(
        'A suspended resource finished loading inside a test, but the event ' +
          'was not wrapped in act(...)',
        {withoutStack: true},
      );
    });
  });
});
