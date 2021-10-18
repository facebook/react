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
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
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
});
