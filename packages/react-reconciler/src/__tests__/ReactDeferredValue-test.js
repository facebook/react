/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let React;
let ReactNoop;
let Scheduler;
let act;
let startTransition;
let useDeferredValue;
let useMemo;
let useState;
let assertLog;
let waitForPaint;

describe('ReactDeferredValue', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    startTransition = React.startTransition;
    useDeferredValue = React.useDeferredValue;
    useMemo = React.useMemo;
    useState = React.useState;

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    waitForPaint = InternalTestUtils.waitForPaint;
  });

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  it('does not cause an infinite defer loop if the original value isn\t memoized', async () => {
    function App({value}) {
      // The object passed to useDeferredValue is never the same as the previous
      // render. A naive implementation would endlessly spawn deferred renders.
      const {value: deferredValue} = useDeferredValue({value});

      const child = useMemo(
        () => <Text text={'Original: ' + value} />,
        [value],
      );

      const deferredChild = useMemo(
        () => <Text text={'Deferred: ' + deferredValue} />,
        [deferredValue],
      );

      return (
        <div>
          <div>{child}</div>
          <div>{deferredChild}</div>
        </div>
      );
    }

    const root = ReactNoop.createRoot();

    // Initial render
    await act(() => {
      root.render(<App value={1} />);
    });
    assertLog(['Original: 1', 'Deferred: 1']);

    // If it's an urgent update, the value is deferred
    await act(async () => {
      root.render(<App value={2} />);

      await waitForPaint(['Original: 2']);
      // The deferred value updates in a separate render
      await waitForPaint(['Deferred: 2']);
    });
    expect(root).toMatchRenderedOutput(
      <div>
        <div>Original: 2</div>
        <div>Deferred: 2</div>
      </div>,
    );

    // But if it updates during a transition, it doesn't defer
    await act(async () => {
      startTransition(() => {
        root.render(<App value={3} />);
      });
      // The deferred value updates in the same render as the original
      await waitForPaint(['Original: 3', 'Deferred: 3']);
    });
    expect(root).toMatchRenderedOutput(
      <div>
        <div>Original: 3</div>
        <div>Deferred: 3</div>
      </div>,
    );
  });

  it('does not defer during a transition', async () => {
    function App({value}) {
      const deferredValue = useDeferredValue(value);

      const child = useMemo(
        () => <Text text={'Original: ' + value} />,
        [value],
      );

      const deferredChild = useMemo(
        () => <Text text={'Deferred: ' + deferredValue} />,
        [deferredValue],
      );

      return (
        <div>
          <div>{child}</div>
          <div>{deferredChild}</div>
        </div>
      );
    }

    const root = ReactNoop.createRoot();

    // Initial render
    await act(() => {
      root.render(<App value={1} />);
    });
    assertLog(['Original: 1', 'Deferred: 1']);

    // If it's an urgent update, the value is deferred
    await act(async () => {
      root.render(<App value={2} />);

      await waitForPaint(['Original: 2']);
      // The deferred value updates in a separate render
      await waitForPaint(['Deferred: 2']);
    });
    expect(root).toMatchRenderedOutput(
      <div>
        <div>Original: 2</div>
        <div>Deferred: 2</div>
      </div>,
    );

    // But if it updates during a transition, it doesn't defer
    await act(async () => {
      startTransition(() => {
        root.render(<App value={3} />);
      });
      // The deferred value updates in the same render as the original
      await waitForPaint(['Original: 3', 'Deferred: 3']);
    });
    expect(root).toMatchRenderedOutput(
      <div>
        <div>Original: 3</div>
        <div>Deferred: 3</div>
      </div>,
    );
  });

  it("works if there's a render phase update", async () => {
    function App({value: propValue}) {
      const [value, setValue] = useState(null);
      if (value !== propValue) {
        setValue(propValue);
      }

      const deferredValue = useDeferredValue(value);

      const child = useMemo(
        () => <Text text={'Original: ' + value} />,
        [value],
      );

      const deferredChild = useMemo(
        () => <Text text={'Deferred: ' + deferredValue} />,
        [deferredValue],
      );

      return (
        <div>
          <div>{child}</div>
          <div>{deferredChild}</div>
        </div>
      );
    }

    const root = ReactNoop.createRoot();

    // Initial render
    await act(() => {
      root.render(<App value={1} />);
    });
    assertLog(['Original: 1', 'Deferred: 1']);

    // If it's an urgent update, the value is deferred
    await act(async () => {
      root.render(<App value={2} />);

      await waitForPaint(['Original: 2']);
      // The deferred value updates in a separate render
      await waitForPaint(['Deferred: 2']);
    });
    expect(root).toMatchRenderedOutput(
      <div>
        <div>Original: 2</div>
        <div>Deferred: 2</div>
      </div>,
    );

    // But if it updates during a transition, it doesn't defer
    await act(async () => {
      startTransition(() => {
        root.render(<App value={3} />);
      });
      // The deferred value updates in the same render as the original
      await waitForPaint(['Original: 3', 'Deferred: 3']);
    });
    expect(root).toMatchRenderedOutput(
      <div>
        <div>Original: 3</div>
        <div>Deferred: 3</div>
      </div>,
    );
  });

  it('regression test: during urgent update, reuse previous value, not initial value', async () => {
    function App({value: propValue}) {
      const [value, setValue] = useState(null);
      if (value !== propValue) {
        setValue(propValue);
      }

      const deferredValue = useDeferredValue(value);

      const child = useMemo(
        () => <Text text={'Original: ' + value} />,
        [value],
      );

      const deferredChild = useMemo(
        () => <Text text={'Deferred: ' + deferredValue} />,
        [deferredValue],
      );

      return (
        <div>
          <div>{child}</div>
          <div>{deferredChild}</div>
        </div>
      );
    }

    const root = ReactNoop.createRoot();

    // Initial render
    await act(async () => {
      root.render(<App value={1} />);
      await waitForPaint(['Original: 1', 'Deferred: 1']);
      expect(root).toMatchRenderedOutput(
        <div>
          <div>Original: 1</div>
          <div>Deferred: 1</div>
        </div>,
      );
    });

    await act(async () => {
      startTransition(() => {
        root.render(<App value={2} />);
      });
      // In the regression, the memoized value was not updated during non-urgent
      // updates, so this would flip the deferred value back to the initial
      // value (1) instead of reusing the current one (2).
      await waitForPaint(['Original: 2', 'Deferred: 2']);
      expect(root).toMatchRenderedOutput(
        <div>
          <div>Original: 2</div>
          <div>Deferred: 2</div>
        </div>,
      );
    });

    await act(async () => {
      root.render(<App value={3} />);
      await waitForPaint(['Original: 3']);
      expect(root).toMatchRenderedOutput(
        <div>
          <div>Original: 3</div>
          <div>Deferred: 2</div>
        </div>,
      );
      await waitForPaint(['Deferred: 3']);
      expect(root).toMatchRenderedOutput(
        <div>
          <div>Original: 3</div>
          <div>Deferred: 3</div>
        </div>,
      );
    });
  });
});
