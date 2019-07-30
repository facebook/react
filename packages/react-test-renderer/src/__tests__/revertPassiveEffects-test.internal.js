/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');
const ReactFeatureFlags = require('shared/ReactFeatureFlags');
const Scheduler = require('scheduler');

// changing this to true passes the test
ReactFeatureFlags.revertPassiveEffectsChange = false;

function renderApp(name) {
  function App() {
    const [, setState] = React.useState(0);
    React.useEffect(() => {
      Scheduler.unstable_yieldValue(`inside effect ${name}`);
      setState(1);
    }, []);
    return null;
  }
  ReactTestRenderer.create(<App />);
}

it('should work', () => {
  renderApp('a');
  expect(Scheduler).toHaveYielded([]);

  renderApp('b');
  expect(Scheduler).toHaveYielded(['inside effect a']);
  // this fails, instead yielding ['inside effect a', 'inside effect b']

  renderApp('c');
  expect(Scheduler).toHaveYielded(['inside effect b']);
});
