// @flow

const env = jasmine.getEnv();
env.beforeEach(() => {
  // These files should be required (and re-reuired) before each test,
  // rather than imported at the head of the module.
  // That's because we reset modules between tests,
  // which disconnects the DevTool's cache from the current dispatcher ref.
  const Agent = require('src/backend/agent').default;
  const { initBackend } = require('src/backend');
  const Bridge = require('src/bridge').default;
  const Store = require('src/devtools/store').default;
  const { installHook } = require('src/hook');
  const { getDefaultComponentFilters } = require('src/utils');

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

  // Avoid "Invalid component filters" warning.
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
      bridgeListeners.forEach(callback => callback({ event, payload }));
    },
  });

  const agent = new Agent(bridge);

  const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  initBackend(hook, agent, global);

  global.agent = agent;
  global.bridge = bridge;
  global.store = new Store(bridge);
});
env.afterEach(() => {
  delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // It's important to reset modules between test runs;
  // Without this, ReactDOM won't re-inject itself into the new hook.
  // It's also important to reset after tests, rather than before,
  // so that we don't disconnect the ReactCurrentDispatcher ref.
  jest.resetModules();
});
