// @flow

import Agent from 'src/backend/agent';
import { initBackend } from 'src/backend';
import Bridge from 'src/bridge';
import Store from 'src/devtools/store';
import { installHook } from 'src/hook';

let agent;
let bridge;
let bridgeListeners;

// Mimic the global we set with Webpack's DefinePlugin
global.__DEV__ = process.env.NODE_ENV !== 'production';

const env = jasmine.getEnv();
env.beforeEach(() => {
  // It's important to reset modules between test runs;
  // Without this, ReactDOM won't re-inject itself into the new hook.
  jest.resetModules();

  // Fake timers let us flush Bridge operations between setup and assertions.
  jest.useFakeTimers();

  installHook(global);

  bridgeListeners = [];

  bridge = new Bridge({
    listen(callback) {
      bridgeListeners.push(callback);
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      bridgeListeners.forEach(callback => callback({ event, payload }));
    },
  });

  agent = new Agent();
  agent.addBridge(bridge);

  initBackend(global.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent, global);

  global.store = new Store(bridge);
});
env.afterEach(() => {
  delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
});
