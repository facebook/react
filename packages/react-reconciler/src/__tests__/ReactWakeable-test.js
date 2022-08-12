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

    await act(async () => {
      startTransition(() => {
        ReactNoop.render(<App />);
      });

      // React will yield when the async component suspends.
      expect(Scheduler).toFlushUntilNextPaint(['Suspend!']);

      // Wait for microtasks to resolve
      // TODO: The async form of `act` should automatically yield to microtasks
      // when a continuation is returned, the way Scheduler does.
      await null;

      expect(Scheduler).toHaveYielded(['Resolve in microtask']);
    });

    // Finished rendering without unwinding the stack.
    expect(Scheduler).toHaveYielded(['Async']);
  });
});
