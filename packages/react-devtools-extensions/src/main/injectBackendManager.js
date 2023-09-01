/* global chrome */

import {IS_FIREFOX} from '../utils';

function injectBackendManager(tabId) {
  if (IS_FIREFOX) {
    // Firefox does not support executing script in ExecutionWorld.MAIN from content script.
    // see prepareInjection.js
    chrome.devtools.inspectedWindow.eval(
      `window.postMessage({ source: 'react-devtools-inject-backend-manager' }, '*');`,
      function (response, evalError) {
        if (evalError) {
          console.error(evalError);
        }
      },
    );

    return;
  }

  chrome.runtime.sendMessage({
    source: 'react-devtools-main',
    payload: {
      type: 'react-devtools-inject-backend-manager',
      tabId,
    },
  });
}

export default injectBackendManager;
