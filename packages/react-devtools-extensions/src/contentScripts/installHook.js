import {installHook} from 'react-devtools-shared/src/hook';

// avoid double execution
if (!window.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
  installHook(window);

  // detect react
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
