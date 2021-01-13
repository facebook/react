/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let React;
let ReactNoop;

beforeEach(() => {
  React = require('react');
  ReactNoop = require('react-noop-renderer');
});

// Don't feel too guilty if you have to delete this test.
// @gate dfsEffectsRefactor
// @gate new
// @gate __DEV__
test('warns in DEV if return pointer is inconsistent', async () => {
  const {useRef, useLayoutEffect} = React;

  let ref = null;
  function App({text}) {
    ref = useRef(null);
    return (
      <>
        <Sibling text={text} />
        <div ref={ref}>{text}</div>
      </>
    );
  }

  function Sibling({text}) {
    useLayoutEffect(() => {
      if (text === 'B') {
        // Mutate the return pointer of the div to point to the wrong alternate.
        // This simulates the most common type of return pointer inconsistency.
        const current = ref.current.fiber;
        const workInProgress = current.alternate;
        workInProgress.return = current.return;
      }
    }, [text]);
    return null;
  }

  const root = ReactNoop.createRoot();
  await ReactNoop.act(async () => {
    root.render(<App text="A" />);
  });

  spyOnDev(console, 'error');
  await ReactNoop.act(async () => {
    root.render(<App text="B" />);
  });
  expect(console.error.calls.count()).toBe(1);
  expect(console.error.calls.argsFor(0)[0]).toMatch(
    'Internal React error: Return pointer is inconsistent with parent.',
  );
});
