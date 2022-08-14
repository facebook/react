'use strict';

let React;
let ReactNoop;
let Scheduler;
let act;
let Suspense;
let startTransition;

describe('ReactWakeable', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    Suspense = React.Suspense;
    startTransition = React.startTransition;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  test('if suspended fiber is pinged in a microtask, retry immediately without unwinding the stack', async () => {
    let resolved = false;
    function Async() {
      if (resolved) {
        return <Text text="Async" />;
      }
      Scheduler.unstable_yieldValue('Suspend!');
      throw Promise.resolve().then(() => {
        Scheduler.unstable_yieldValue('Resolve in microtask');
        resolved = true;
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
    let resolved = false;
    function Async() {
      if (resolved) {
        return <Text text="Async" />;
      }
      Scheduler.unstable_yieldValue('Suspend!');
      throw Promise.resolve().then(() => {
        Scheduler.unstable_yieldValue('Resolve in microtask');
        resolved = true;
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

  test('does not infinite loop if already resolved thenable is thrown', async () => {
    // An already resolved promise should never be thrown. Since it already
    // resolved, we shouldn't bother trying to render again — doing so would
    // likely lead to an infinite loop. This scenario should only happen if a
    // userspace Suspense library makes an implementation mistake.

    // Create an already resolved thenable
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
      // This thenable should never be thrown because it already resolved.
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
});
