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
let Suspense;
let Offscreen;
let assertLog;
let waitForPaint;
let textCache;

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
    Suspense = React.Suspense;
    Offscreen = React.unstable_Offscreen;

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    waitForPaint = InternalTestUtils.waitForPaint;

    textCache = new Map();
  });

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.log(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);
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
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
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

  // @gate enableUseDeferredValueInitialArg
  it('supports initialValue argument', async () => {
    function App() {
      const value = useDeferredValue('Final', 'Initial');
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      await waitForPaint(['Initial']);
      expect(root).toMatchRenderedOutput('Initial');
    });
    assertLog(['Final']);
    expect(root).toMatchRenderedOutput('Final');
  });

  // @gate enableUseDeferredValueInitialArg
  it('defers during initial render when initialValue is provided, even if render is not sync', async () => {
    function App() {
      const value = useDeferredValue('Final', 'Initial');
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      // Initial mount is a transition, but it should defer anyway
      startTransition(() => root.render(<App />));
      await waitForPaint(['Initial']);
      expect(root).toMatchRenderedOutput('Initial');
    });
    assertLog(['Final']);
    expect(root).toMatchRenderedOutput('Final');
  });

  // @gate enableUseDeferredValueInitialArg
  it(
    'if a suspended render spawns a deferred task, we can switch to the ' +
      'deferred task without finishing the original one',
    async () => {
      function App() {
        const text = useDeferredValue('Final', 'Loading...');
        return <AsyncText text={text} />;
      }

      const root = ReactNoop.createRoot();
      await act(() => root.render(<App />));
      assertLog([
        'Suspend! [Loading...]',
        // The initial value suspended, so we attempt the final value, which
        // also suspends.
        'Suspend! [Final]',
      ]);
      expect(root).toMatchRenderedOutput(null);

      // The final value loads, so we can skip the initial value entirely.
      await act(() => resolveText('Final'));
      assertLog(['Final']);
      expect(root).toMatchRenderedOutput('Final');

      // When the initial value finally loads, nothing happens because we no
      // longer need it.
      await act(() => resolveText('Loading...'));
      assertLog([]);
      expect(root).toMatchRenderedOutput('Final');
    },
  );

  // @gate enableUseDeferredValueInitialArg
  it(
    'if a suspended render spawns a deferred task that also suspends, we can ' +
      'finish the original task if that one loads first',
    async () => {
      function App() {
        const text = useDeferredValue('Final', 'Loading...');
        return <AsyncText text={text} />;
      }

      const root = ReactNoop.createRoot();
      await act(() => root.render(<App />));
      assertLog([
        'Suspend! [Loading...]',
        // The initial value suspended, so we attempt the final value, which
        // also suspends.
        'Suspend! [Final]',
      ]);
      expect(root).toMatchRenderedOutput(null);

      // The initial value resolves first, so we render that.
      await act(() => resolveText('Loading...'));
      assertLog([
        'Loading...',
        // Still waiting for the final value.
        'Suspend! [Final]',
      ]);
      expect(root).toMatchRenderedOutput('Loading...');

      // The final value loads, so we can switch to that.
      await act(() => resolveText('Final'));
      assertLog(['Final']);
      expect(root).toMatchRenderedOutput('Final');
    },
  );

  // @gate enableUseDeferredValueInitialArg
  it(
    'if there are multiple useDeferredValues in the same tree, only the ' +
      'first level defers; subsequent ones go straight to the final value, to ' +
      'avoid a waterfall',
    async () => {
      function App() {
        const showContent = useDeferredValue(true, false);
        if (!showContent) {
          return <Text text="App Preview" />;
        }
        return <Content />;
      }

      function Content() {
        const text = useDeferredValue('Content', 'Content Preview');
        return <AsyncText text={text} />;
      }

      const root = ReactNoop.createRoot();
      resolveText('App Preview');

      await act(() => root.render(<App />));
      assertLog([
        // The App shows an immediate preview
        'App Preview',
        // Then we switch to showing the content. The Content component also
        // contains a useDeferredValue, but since we already showed a preview
        // in a parent component, we skip the preview in the inner one and
        // go straight to attempting the final value.
        //
        // (Note that this is intentionally different from how nested Suspense
        // boundaries work, where we always prefer to show the innermost
        // loading state.)
        'Suspend! [Content]',
      ]);
      // Still showing the App preview state because the inner
      // content suspended.
      expect(root).toMatchRenderedOutput('App Preview');

      // Finish loading the content
      await act(() => resolveText('Content'));
      // We didn't even attempt to render Content Preview.
      assertLog(['Content']);
      expect(root).toMatchRenderedOutput('Content');
    },
  );

  // @gate enableUseDeferredValueInitialArg
  it('avoids a useDeferredValue waterfall when separated by a Suspense boundary', async () => {
    // Same as the previous test but with a Suspense boundary separating the
    // two useDeferredValue hooks.
    function App() {
      const showContent = useDeferredValue(true, false);
      if (!showContent) {
        return <Text text="App Preview" />;
      }
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Content />
        </Suspense>
      );
    }

    function Content() {
      const text = useDeferredValue('Content', 'Content Preview');
      return <AsyncText text={text} />;
    }

    const root = ReactNoop.createRoot();
    resolveText('App Preview');

    await act(() => root.render(<App />));
    assertLog([
      // The App shows an immediate preview
      'App Preview',
      // Then we switch to showing the content. The Content component also
      // contains a useDeferredValue, but since we already showed a preview
      // in a parent component, we skip the preview in the inner one and
      // go straight to attempting the final value.
      'Suspend! [Content]',
      'Loading...',
    ]);
    // The content suspended, so we show a Suspense fallback
    expect(root).toMatchRenderedOutput('Loading...');

    // Finish loading the content
    await act(() => resolveText('Content'));
    // We didn't even attempt to render Content Preview.
    assertLog(['Content']);
    expect(root).toMatchRenderedOutput('Content');
  });

  // @gate enableUseDeferredValueInitialArg
  // @gate enableOffscreen
  it('useDeferredValue can spawn a deferred task while prerendering a hidden tree', async () => {
    function App() {
      const text = useDeferredValue('Final', 'Preview');
      return (
        <div>
          <AsyncText text={text} />
        </div>
      );
    }

    let revealContent;
    function Container({children}) {
      const [shouldShow, setState] = useState(false);
      revealContent = () => setState(true);
      return (
        <Offscreen mode={shouldShow ? 'visible' : 'hidden'}>
          {children}
        </Offscreen>
      );
    }

    const root = ReactNoop.createRoot();

    // Prerender a hidden tree
    resolveText('Preview');
    await act(() =>
      root.render(
        <Container>
          <App />
        </Container>,
      ),
    );
    assertLog(['Preview', 'Suspend! [Final]']);
    expect(root).toMatchRenderedOutput(<div hidden={true}>Preview</div>);

    // Finish loading the content
    await act(() => resolveText('Final'));
    assertLog(['Final']);
    expect(root).toMatchRenderedOutput(<div hidden={true}>Final</div>);

    // Now reveal the hidden tree. It should toggle the visibility without
    // having to re-render anything inside the prerendered tree.
    await act(() => revealContent());
    assertLog([]);
    expect(root).toMatchRenderedOutput(<div>Final</div>);
  });
});
