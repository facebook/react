// @flow

import type {
  BackendBridge,
  FrontendBridge,
} from 'react-devtools-shared/src/bridge';

const env = jasmine.getEnv();
env.beforeEach(() => {
  // These files should be required (and re-reuired) before each test,
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
  } = require('react-devtools-shared/src/utils');

  // Fake timers let us flush Bridge operations between setup and assertions.
  jest.useFakeTimers();

  const originalConsoleError = console.error;
  // $FlowFixMe
  console.error = (...args) => {
    if (args[0] === 'Warning: React DevTools encountered an error: %s') {
      // Rethrow errors from React.
      throw args[1];
    }
    originalConsoleError.apply(console, args);
  };

  // Initialize filters to a known good state.
  saveComponentFilters(getDefaultComponentFilters());
  global.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = getDefaultComponentFilters();

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
});
env.afterEach(() => {
  delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // It's important to reset modules between test runs;
  // Without this, ReactDOM won't re-inject itself into the new hook.
  // It's also important to reset after tests, rather than before,
  // so that we don't disconnect the ReactCurrentDispatcher ref.
  jest.resetModules();
});
