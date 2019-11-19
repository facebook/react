/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let ReactFeatureFlags;
let React;
let ReactNoop;
let Scheduler;
let Suspense;
let useState;
let useTransition;
let act;

describe('ReactTransition', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableSchedulerTracing = true;
    ReactFeatureFlags.flushSuspenseFallbacksInTests = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useState = React.useState;
    useTransition = React.useTransition;
    Suspense = React.Suspense;
    act = ReactNoop.act;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  function createAsyncText(text) {
    let resolved = false;
    let Component = function() {
      if (!resolved) {
        Scheduler.unstable_yieldValue('Suspend! [' + text + ']');
        throw promise;
      }
      return <Text text={text} />;
    };
    let promise = new Promise(resolve => {
      Component.resolve = function() {
        resolved = true;
        return resolve();
      };
    });
    return Component;
  }

  it.experimental(
    'isPending works even if called from outside an input event',
    async () => {
      const Async = createAsyncText('Async');
      let start;
      function App() {
        const [show, setShow] = useState(false);
        const [startTransition, isPending] = useTransition();
        start = () => startTransition(() => setShow(true));
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            {isPending ? <Text text="Pending..." /> : null}
            {show ? <Async /> : <Text text="(empty)" />}
          </Suspense>
        );
      }

      const root = ReactNoop.createRoot();

      await act(async () => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['(empty)']);
      expect(root).toMatchRenderedOutput('(empty)');

      await act(async () => {
        start();

        expect(Scheduler).toFlushAndYield([
          // Render pending state
          'Pending...',
          '(empty)',
          // Try rendering transition
          'Suspend! [Async]',
          'Loading...',
        ]);

        expect(root).toMatchRenderedOutput('Pending...(empty)');

        await Async.resolve();
      });
      expect(Scheduler).toHaveYielded(['Async']);
      expect(root).toMatchRenderedOutput('Async');
    },
  );

  it.experimental(
    'works if two transitions happen one right after the other',
    async () => {
      // Tests an implementation path where two transitions get batched into the
      // same render. This is an edge case in our current expiration times
      // implementation but will be the normal case if/when we replace expiration
      // times with a different model that puts all transitions into the same
      // batch by default.
      const CONFIG = {
        timeoutMs: 100000,
      };

      let setTab;
      let startTransition;
      function App() {
        const [tab, _setTab] = useState(1);
        const [_startTransition, isPending] = useTransition(CONFIG);
        startTransition = _startTransition;
        setTab = _setTab;
        return (
          <Text text={'Tab ' + tab + (isPending ? ' (pending...)' : '')} />
        );
      }

      const root = ReactNoop.createRoot();

      await act(async () => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['Tab 1']);
      expect(root).toMatchRenderedOutput('Tab 1');

      await act(async () => {
        startTransition(() => setTab(2));
      });
      expect(Scheduler).toHaveYielded(['Tab 1 (pending...)', 'Tab 2']);
      expect(root).toMatchRenderedOutput('Tab 2');

      // Because time has not advanced, this will fall into the same bucket
      // as the previous transition.
      await act(async () => {
        startTransition(() => setTab(3));
      });
      expect(Scheduler).toHaveYielded(['Tab 2 (pending...)', 'Tab 3']);
      expect(root).toMatchRenderedOutput('Tab 3');
    },
  );
});
