// @flow

import Agent from 'src/backend/agent';
import { initBackend } from 'src/backend';
import Bridge from 'src/bridge';
import Store from 'src/devtools/store';
import { installHook } from 'src/hook';

export function setup(): Store {
  installHook(global);

  jest.useFakeTimers();

  // TODO Replace this with a polyfill?
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
  };

  const listeners = [];
  const bridge = new Bridge(
    {
      listen(callback) {
        listeners.push(callback);
      },
      send(event: string, payload: any, transferable?: Array<any>) {
        listeners.forEach(callback => callback({ event, payload }));
      },
    },
    { batchDuration: 0 }
  );

  const agent = new Agent();
  agent.addBridge(bridge);

  initBackend(global.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent, global);

  return new Store(bridge);
}
