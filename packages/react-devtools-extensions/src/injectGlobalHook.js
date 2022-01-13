/* global chrome */

import nullthrows from 'nullthrows';
import {installHook} from 'react-devtools-shared/src/hook';
import {SESSION_STORAGE_RELOAD_AND_PROFILE_KEY} from 'react-devtools-shared/src/constants';
import {sessionStorageGetItem} from 'react-devtools-shared/src/storage';

function injectCode(code) {
  const script = document.createElement('script');
  script.textContent = code;

  // This script runs before the <head> element is created,
  // so we add the script to <html> instead.
  nullthrows(document.documentElement).appendChild(script);
  nullthrows(script.parentNode).removeChild(script);
}

let lastDetectionResult;

// We want to detect when a renderer attaches, and notify the "background page"
// (which is shared between tabs and can highlight the React icon).
// Currently we are in "content script" context, so we can't listen to the hook directly
// (it will be injected directly into the page).
// So instead, the hook will use postMessage() to pass message to us here.
// And when this happens, we'll send a message to the "background page".
window.addEventListener('message', function onMessage({data, source}) {
  if (source !== window || !data) {
    return;
  }
  switch (data.source) {
    case 'react-devtools-detector':
      lastDetectionResult = {
        hasDetectedReact: true,
        reactBuildType: data.reactBuildType,
      };
      chrome.runtime.sendMessage(lastDetectionResult);
      break;
    case 'react-devtools-extension':
      if (data.payload?.type === 'fetch-file-with-cache') {
        const url = data.payload.url;

        const reject = value => {
          chrome.runtime.sendMessage({
            source: 'react-devtools-content-script',
            payload: {
              type: 'fetch-file-with-cache-error',
              url,
              value,
            },
          });
        };

        const resolve = value => {
          chrome.runtime.sendMessage({
            source: 'react-devtools-content-script',
            payload: {
              type: 'fetch-file-with-cache-complete',
              url,
              value,
            },
          });
        };

        fetch(url, {cache: 'force-cache'}).then(
          response => {
            if (response.ok) {
              response
                .text()
                .then(text => resolve(text))
                .catch(error => reject(null));
            } else {
              reject(null);
            }
          },
          error => reject(null),
        );
      }
      break;
    case 'react-devtools-inject-backend':
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('build/react_devtools_backend.js');
      document.documentElement.appendChild(script);
      script.parentNode.removeChild(script);
      break;
  }
});

// NOTE: Firefox WebExtensions content scripts are still alive and not re-injected
// while navigating the history to a document that has not been destroyed yet,
// replay the last detection result if the content script is active and the
// document has been hidden and shown again.
window.addEventListener('pageshow', function({target}) {
  if (!lastDetectionResult || target !== window.document) {
    return;
  }
  chrome.runtime.sendMessage(lastDetectionResult);
});

const detectReact = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('renderer', function({reactBuildType}) {
  window.postMessage({
    source: 'react-devtools-detector',
    reactBuildType,
  }, '*');
});
`;
const saveNativeValues = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeObjectCreate = Object.create;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap = Map;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeWeakMap = WeakMap;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeSet = Set;
`;

// If we have just reloaded to profile, we need to inject the renderer interface before the app loads.
if (sessionStorageGetItem(SESSION_STORAGE_RELOAD_AND_PROFILE_KEY) === 'true') {
  const rendererURL = chrome.runtime.getURL('build/renderer.js');
  let rendererCode;

  // We need to inject in time to catch the initial mount.
  // This means we need to synchronously read the renderer code itself,
  // and synchronously inject it into the page.
  // There are very few ways to actually do this.
  // This seems to be the best approach.
  const request = new XMLHttpRequest();
  request.addEventListener('load', function() {
    rendererCode = this.responseText;
  });
  request.open('GET', rendererURL, false);
  request.send();
  injectCode(rendererCode);
}

// Inject a __REACT_DEVTOOLS_GLOBAL_HOOK__ global for React to interact with.
// Only do this for HTML documents though, to avoid e.g. breaking syntax highlighting for XML docs.
// We need to inject this code because content scripts (ie injectGlobalHook.js) don't have access
// to the webpage's window, so in order to access front end settings
// and communicate with React, we must inject this code into the webpage
switch (document.contentType) {
  case 'text/html':
  case 'application/xhtml+xml': {
    injectCode(
      ';(' +
        installHook.toString() +
        '(window))' +
        saveNativeValues +
        detectReact,
    );
    break;
  }
}

if (typeof exportFunction === 'function') {
  // eslint-disable-next-line no-undef
  exportFunction(
    text => {
      // Call clipboard.writeText from the extension content script
      // (as it has the clipboardWrite permission) and return a Promise
      // accessible to the webpage js code.
      return new window.Promise((resolve, reject) =>
        window.navigator.clipboard.writeText(text).then(resolve, reject),
      );
    },
    window.wrappedJSObject.__REACT_DEVTOOLS_GLOBAL_HOOK__,
    {defineAs: 'clipboardCopyText'},
  );
}
