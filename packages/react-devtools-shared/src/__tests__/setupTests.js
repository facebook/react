/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

const env = jasmine.getEnv();
env.beforeEach(() => {
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
    saveComponentFilters,
    setShowInlineWarningsAndErrors,
  } = require('react-devtools-shared/src/utils');

  // Fake timers let us flush Bridge operations between setup and assertions.
  jest.useFakeTimers();

  // Use utils.js#withErrorsOrWarningsIgnored instead of directly mutating this array.
  global._ignoredErrorOrWarningMessages = [];
  function shouldIgnoreConsoleErrorOrWarn(args) {
    const firstArg = args[0];
    if (typeof firstArg !== 'string') {
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
  // $FlowFixMe
  console.error = (...args) => {
    const firstArg = args[0];
    if (
      firstArg === 'Warning: React instrumentation encountered an error: %s'
    ) {
      // Rethrow errors from React.
      throw args[1];
    } else if (
      typeof firstArg === 'string' &&
      (firstArg.startsWith(
        "Warning: It looks like you're using the wrong act()",
      ) ||
        firstArg.startsWith(
          'Warning: The current testing environment is not configured to support act',
        ) ||
        firstArg.startsWith(
          'Warning: You seem to have overlapping act() calls',
        ))
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
  // $FlowFixMe
  console.warn = (...args) => {
    if (shouldIgnoreConsoleErrorOrWarn(args)) {
      // Allows testing how DevTools behaves when it encounters console.warn without cluttering the test output.
      // Warnings can be ignored by running in a special context provided by utils.js#withErrorsOrWarningsIgnored
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Initialize filters to a known good state.
  saveComponentFilters(getDefaultComponentFilters());
  global.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = getDefaultComponentFilters();

  // Also initialize inline warnings so that we can test them.
  setShowInlineWarningsAndErrors(true);
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
env.afterEach(() => {
  delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // It's important to reset modules between test runs;
  // Without this, ReactDOM won't re-inject itself into the new hook.
  // It's also important to reset after tests, rather than before,
  // so that we don't disconnect the ReactCurrentDispatcher ref.
  jest.resetModules();
});

expect.extend({
  ...require('../../../../scripts/jest/matchers/schedulerTestMatchers'),
});
