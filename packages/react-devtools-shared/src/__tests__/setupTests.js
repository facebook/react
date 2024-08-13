/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {CustomConsole} from '@jest/console';

import type {
  BackendBridge,
  FrontendBridge,
} from 'react-devtools-shared/src/bridge';
const {getTestFlags} = require('../../../../scripts/jest/TestFlags');

// Argument is serialized when passed from jest-cli script through to setupTests.
const compactConsole = process.env.compactConsole === 'true';
if (compactConsole) {
  const formatter = (type, message) => {
    switch (type) {
      case 'error':
        return '\x1b[31m' + message + '\x1b[0m';
      case 'warn':
        return '\x1b[33m' + message + '\x1b[0m';
      case 'log':
      default:
        return message;
    }
  };

  global.console = new CustomConsole(process.stdout, process.stderr, formatter);
}

const expectTestToFail = async (callback, error) => {
  if (callback.length > 0) {
    throw Error(
      'Gated test helpers do not support the `done` callback. Return a ' +
        'promise instead.',
    );
  }
  try {
    const maybePromise = callback();
    if (
      maybePromise !== undefined &&
      maybePromise !== null &&
      typeof maybePromise.then === 'function'
    ) {
      await maybePromise;
    }
  } catch (testError) {
    return;
  }
  throw error;
};

const gatedErrorMessage = 'Gated test was expected to fail, but it passed.';
global._test_gate = (gateFn, testName, callback) => {
  let shouldPass;
  try {
    const flags = getTestFlags();
    shouldPass = gateFn(flags);
  } catch (e) {
    test(testName, () => {
      throw e;
    });
    return;
  }
  if (shouldPass) {
    test(testName, callback);
  } else {
    const error = new Error(gatedErrorMessage);
    Error.captureStackTrace(error, global._test_gate);
    test(`[GATED, SHOULD FAIL] ${testName}`, () =>
      expectTestToFail(callback, error));
  }
};
global._test_gate_focus = (gateFn, testName, callback) => {
  let shouldPass;
  try {
    const flags = getTestFlags();
    shouldPass = gateFn(flags);
  } catch (e) {
    test.only(testName, () => {
      throw e;
    });
    return;
  }
  if (shouldPass) {
    test.only(testName, callback);
  } else {
    const error = new Error(gatedErrorMessage);
    Error.captureStackTrace(error, global._test_gate_focus);
    test.only(`[GATED, SHOULD FAIL] ${testName}`, () =>
      expectTestToFail(callback, error));
  }
};

// Dynamic version of @gate pragma
global.gate = fn => {
  const flags = getTestFlags();
  return fn(flags);
};

beforeEach(() => {
  global.mockClipboardCopy = jest.fn();

  // Test environment doesn't support document methods like execCommand()
  // Also once the backend components below have been required,
  // it's too late for a test to mock the clipboard-js modules.
  jest.mock('clipboard-js', () => ({copy: global.mockClipboardCopy}));

  // These files should be required (and re-required) before each test,
  // rather than imported at the head of the module.
  // That's because we reset modules between tests,
  // which disconnects the DevTool's cache from the current dispatcher ref.
  const Agent = require('react-devtools-shared/src/backend/agent').default;
  const {initBackend} = require('react-devtools-shared/src/backend');
  const Bridge = require('react-devtools-shared/src/bridge').default;
  const Store = require('react-devtools-shared/src/devtools/store').default;
  const {installHook} = require('react-devtools-shared/src/hook');
  const {
    getDefaultComponentFilters,
    setSavedComponentFilters,
  } = require('react-devtools-shared/src/utils');

  // Fake timers let us flush Bridge operations between setup and assertions.
  jest.useFakeTimers();

  // We use fake timers heavily in tests but the bridge batching now uses microtasks.
  global.devtoolsJestTestScheduler = callback => {
    setTimeout(callback, 0);
  };

  // Use utils.js#withErrorsOrWarningsIgnored instead of directly mutating this array.
  global._ignoredErrorOrWarningMessages = [
    'react-test-renderer is deprecated.',
  ];
  function shouldIgnoreConsoleErrorOrWarn(args) {
    let firstArg = args[0];
    if (
      firstArg !== null &&
      typeof firstArg === 'object' &&
      String(firstArg).indexOf('Error: Uncaught [') === 0
    ) {
      firstArg = String(firstArg);
    } else if (typeof firstArg !== 'string') {
      return false;
    }
    const shouldFilter = global._ignoredErrorOrWarningMessages.some(
      errorOrWarningMessage => {
        return firstArg.indexOf(errorOrWarningMessage) !== -1;
      },
    );

    return shouldFilter;
  }

  const originalConsoleError = console.error;
  console.error = (...args) => {
    let firstArg = args[0];
    if (typeof firstArg === 'string' && firstArg.startsWith('Warning: ')) {
      // Older React versions might use the Warning: prefix. I'm not sure
      // if they use this code path.
      firstArg = firstArg.slice(9);
    }
    if (firstArg === 'React instrumentation encountered an error: %s') {
      // Rethrow errors from React.
      throw args[1];
    } else if (
      typeof firstArg === 'string' &&
      (firstArg.startsWith("It looks like you're using the wrong act()") ||
        firstArg.startsWith(
          'The current testing environment is not configured to support act',
        ) ||
        firstArg.startsWith('You seem to have overlapping act() calls'))
    ) {
      // DevTools intentionally wraps updates with acts from both DOM and test-renderer,
      // since test updates are expected to impact both renderers.
      return;
    } else if (shouldIgnoreConsoleErrorOrWarn(args)) {
      // Allows testing how DevTools behaves when it encounters console.error without cluttering the test output.
      // Errors can be ignored by running in a special context provided by utils.js#withErrorsOrWarningsIgnored
      return;
    }
    originalConsoleError.apply(console, args);
  };
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (shouldIgnoreConsoleErrorOrWarn(args)) {
      // Allows testing how DevTools behaves when it encounters console.warn without cluttering the test output.
      // Warnings can be ignored by running in a special context provided by utils.js#withErrorsOrWarningsIgnored
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Initialize filters to a known good state.
  setSavedComponentFilters(getDefaultComponentFilters());
  global.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = getDefaultComponentFilters();

  // Also initialize inline warnings so that we can test them.
  global.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ = true;

  installHook(global);

  const bridgeListeners = [];
  const bridge = new Bridge({
    listen(callback) {
      bridgeListeners.push(callback);
      return () => {
        const index = bridgeListeners.indexOf(callback);
        if (index >= 0) {
          bridgeListeners.splice(index, 1);
        }
      };
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      bridgeListeners.forEach(callback => callback({event, payload}));
    },
  });

  const agent = new Agent(((bridge: any): BackendBridge));

  const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  initBackend(hook, agent, global);

  const store = new Store(((bridge: any): FrontendBridge));

  global.agent = agent;
  global.bridge = bridge;
  global.store = store;

  const readFileSync = require('fs').readFileSync;
  async function mockFetch(url) {
    return {
      ok: true,
      status: 200,
      text: async () => readFileSync(__dirname + url, 'utf-8'),
    };
  }
  global.fetch = mockFetch;
});
afterEach(() => {
  delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // It's important to reset modules between test runs;
  // Without this, ReactDOM won't re-inject itself into the new hook.
  // It's also important to reset after tests, rather than before,
  // so that we don't disconnect the ReactCurrentDispatcher ref.
  jest.resetModules();
});
