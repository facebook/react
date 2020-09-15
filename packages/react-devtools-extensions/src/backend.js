// Do not use imports or top-level requires here!
// Running module factories is intentionally delayed until we know the hook exists.
// This is to avoid issues like: https://github.com/facebook/react-devtools/issues/1039

/** @flow */

'use strict';

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
  if (hook == null) {
    // DevTools didn't get injected into this page (maybe b'c of the contentType).
    return;
  }
  const Agent = require('react-devtools-shared/src/backend/agent').default;
  const Bridge = require('react-devtools-shared/src/bridge').default;
  const {initBackend} = require('react-devtools-shared/src/backend');
  const setupNativeStyleEditor = require('react-devtools-shared/src/backend/NativeStyleEditor/setupNativeStyleEditor')
    .default;

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
      window.addEventListener('message', listener);
      return () => {
        window.removeEventListener('message', listener);
      };
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      window.postMessage(
        {
          source: 'react-devtools-bridge',
          payload: {event, payload},
        },
        '*',
        transferable,
      );
    },
  });

  const agent = new Agent(bridge);
  agent.addListener('shutdown', () => {
    // If we received 'shutdown' from `agent`, we assume the `bridge` is already shutting down,
    // and that caused the 'shutdown' event on the `agent`, so we don't need to call `bridge.shutdown()` here.
    hook.emit('shutdown');
  });

  initBackend(hook, agent, window);

  // Let the frontend know that the backend has attached listeners and is ready for messages.
  // This covers the case of syncing saved values after reloading/navigating while DevTools remain open.
  bridge.send('extensionBackendInitialized');

  // Setup React Native style editor if a renderer like react-native-web has injected it.
  if (hook.resolveRNStyle) {
    setupNativeStyleEditor(
      bridge,
      agent,
      hook.resolveRNStyle,
      hook.nativeStyleEditorValidAttributes,
    );
  }
}
