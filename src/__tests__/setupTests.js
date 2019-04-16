// @flow

import Agent from 'src/backend/agent';
import { initBackend } from 'src/backend';
import Bridge from 'src/bridge';
import Store from 'src/devtools/store';
import { installHook } from 'src/hook';

const env = jasmine.getEnv();
env.beforeEach(() => {
  // It's important to reset modules between test runs;
  // Without this, ReactDOM won't re-inject itself into the new hook.
  jest.resetModules();

  // Fake timers let us flush Bridge operations between setup and assertions.
  jest.useFakeTimers();

  installHook(global);

  const bridgeListeners = [];

  const bridge = new Bridge({
    listen(callback) {
      bridgeListeners.push(callback);
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      bridgeListeners.forEach(callback => callback({ event, payload }));
    },
  });

  const agent = new Agent();
  agent.addBridge(bridge);

  initBackend(global.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent, global);

  global.bridge = bridge;
  global.store = new Store(bridge);
});
env.afterEach(() => {
  delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
});
