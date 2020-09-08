/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

beforeEach(() => {
  jest.resetModules();

  // Unmock the Scheduler, which is mocked by default in our test setup
  jest.mock('scheduler', () => require.requireActual('scheduler'));
  jest.mock('scheduler/src/SchedulerHostConfig', () =>
    require.requireActual('scheduler/src/forks/SchedulerHostConfig.default.js'),
  );
});

// @gate __DEV__
it('public implementation of `act` works without mocking scheduler (DOM)', async () => {
  const React = require('react');
  const ReactDOM = require('react-dom');
  const TestUtils = require('react-dom/test-utils');

  const log = [];

  function App() {
    React.useEffect(() => {
      log.push('Did mount');
    }, []);
    return 'App';
  }

  const container = document.createElement('div');
  await TestUtils.act(async () => {
    ReactDOM.render(<App />, container);
  });
  expect(container.textContent).toEqual('App');
  expect(log).toEqual(['Did mount']);
});

it('internal implementation of `act` throws if Scheduler is not mocked (DOM)', async () => {
  const React = require('react');
  const ReactDOM = require('react-dom');
  const TestUtils = require('react-dom/test-utils');

  const log = [];

  function App() {
    React.useEffect(() => {
      log.push('Did mount');
    }, []);
    return 'App';
  }

  const container = document.createElement('div');
  let error = null;
  try {
    await TestUtils.unstable_concurrentAct(async () => {
      ReactDOM.render(<App />, container);
    });
  } catch (e) {
    error = e;
  }
  expect(error).not.toBe(null);
  expect(error.message).toEqual(
    'This version of `act` requires a special mock build of Scheduler.',
  );
});

it('internal implementation of `act` throws if Scheduler is not mocked (noop)', async () => {
  const React = require('react');
  const ReactNoop = require('react-noop-renderer');

  const log = [];

  function App() {
    React.useEffect(() => {
      log.push('Did mount');
    }, []);
    return 'App';
  }

  const root = ReactNoop.createRoot();
  let error = null;
  try {
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
  } catch (e) {
    error = e;
  }
  expect(error).not.toBe(null);
  expect(error.message).toEqual(
    'This version of `act` requires a special mock build of Scheduler.',
  );
});

// @gate __DEV__
it('public implementation of `act` works without mocking scheduler (test renderer)', async () => {
  const React = require('react');
  const ReactTestRenderer = require('react-test-renderer');

  const log = [];

  function App() {
    React.useEffect(() => {
      log.push('Did mount');
    }, []);
    return 'App';
  }

  const root = ReactTestRenderer.create(null);
  await ReactTestRenderer.act(async () => {
    root.update(<App />);
  });
  expect(root.toJSON()).toEqual('App');
  expect(log).toEqual(['Did mount']);
});

it('internal implementation of `act` throws if Scheduler is not mocked (test renderer)', async () => {
  const React = require('react');
  const ReactTestRenderer = require('react-test-renderer');

  const log = [];

  function App() {
    React.useEffect(() => {
      log.push('Did mount');
    }, []);
    return 'App';
  }

  const root = ReactTestRenderer.create(null);
  let error = null;
  try {
    await ReactTestRenderer.unstable_concurrentAct(async () => {
      root.update(<App />);
    });
  } catch (e) {
    error = e;
  }
  expect(error).not.toBe(null);
  expect(error.message).toEqual(
    'This version of `act` requires a special mock build of Scheduler.',
  );
});
