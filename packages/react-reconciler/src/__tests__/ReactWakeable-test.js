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
});
