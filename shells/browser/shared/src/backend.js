// Do not use imports or top-level requires here!
// Running module factories is intentionally delayed until we know the hook exists.
// This is to avoid issues like: https://github.com/facebook/react-devtools/issues/1039

/** @flow */

function welcome(event) {
  if (
    event.source !== window ||
    event.data.source !== 'react-devtools-content-script'
  ) {
    return;
  }

  window.removeEventListener('message', welcome);

  setup(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
}

window.addEventListener('message', welcome);

function setup(hook) {
  const Agent = require('src/backend/agent').default;
  const Bridge = require('src/bridge').default;
  const { initBackend } = require('src/backend');

  const listeners = [];

  const bridge = new Bridge({
    listen(fn) {
      const listener = event => {
        if (
          event.source !== window ||
          !event.data ||
          event.data.source !== 'react-devtools-content-script' ||
          !event.data.payload
        ) {
          return;
        }
        fn(event.data.payload);
      };
      listeners.push(listener);
      window.addEventListener('message', listener);
    },
    send(data) {
      window.postMessage(
        {
          source: 'react-devtools-bridge',
          payload: data,
        },
        '*'
      );
    },
  });

  const agent = new Agent();
  agent.addBridge(bridge);
  agent.addListener('shutdown', () => {
    hook.emit('shutdown');
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners.splice(0);
  });

  initBackend(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent);
}
