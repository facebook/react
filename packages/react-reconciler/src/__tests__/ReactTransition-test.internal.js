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
          'Pending...',
          '(empty)',
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
});
