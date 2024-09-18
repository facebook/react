import {installHook} from 'react-devtools-shared/src/hook';

let resolveHookSettingsInjection;

function messageListener(event: MessageEvent) {
  if (event.source !== window) {
    return;
  }

  if (event.data.source === 'react-devtools-hook-settings-injector') {
    // In case handshake message was sent prior to hookSettingsInjector execution
    // We can't guarantee order
    if (event.data.payload.handshake) {
      window.postMessage({
        source: 'react-devtools-hook-installer',
        payload: {handshake: true},
      });
    } else if (event.data.payload.settings) {
      window.removeEventListener('message', messageListener);
      resolveHookSettingsInjection(event.data.payload.settings);
    }
  }
}

// Avoid double execution
if (!window.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
  const hookSettingsPromise = new Promise(resolve => {
    resolveHookSettingsInjection = resolve;
  });

  window.addEventListener('message', messageListener);
  window.postMessage({
    source: 'react-devtools-hook-installer',
    payload: {handshake: true},
  });

  // Can't delay hook installation, inject settings lazily
  installHook(window, hookSettingsPromise);

  // Detect React
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on(
    'renderer',
    function ({reactBuildType}) {
      window.postMessage(
        {
          source: 'react-devtools-hook',
          payload: {
            type: 'react-renderer-attached',
            reactBuildType,
          },
        },
        '*',
      );
    },
  );
}
