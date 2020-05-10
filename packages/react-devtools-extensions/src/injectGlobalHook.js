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
window.addEventListener('message', function(evt) {
  if (evt.source !== window || !evt.data) {
    return;
  }
  if (evt.data.source === 'react-devtools-detector') {
    lastDetectionResult = {
      hasDetectedReact: true,
      reactBuildType: evt.data.reactBuildType,
    };
    chrome.runtime.sendMessage(lastDetectionResult);
  } else if (evt.data.source === 'react-devtools-inject-backend') {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('build/react_devtools_backend.js');
    document.documentElement.appendChild(script);
    script.parentNode.removeChild(script);
  }
});

// NOTE: Firefox WebExtensions content scripts are still alive and not re-injected
// while navigating the history to a document that has not been destroyed yet,
// replay the last detection result if the content script is active and the
// document has been hidden and shown again.
window.addEventListener('pageshow', function(evt) {
  if (!lastDetectionResult || evt.target !== window.document) {
    return;
  }
  chrome.runtime.sendMessage(lastDetectionResult);
});

const detectReact = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('renderer', function(evt) {
  window.postMessage({
    source: 'react-devtools-detector',
    reactBuildType: evt.reactBuildType,
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
if ('text/html' === document.contentType) {
  injectCode(
    ';(' +
      installHook.toString() +
      '(window))' +
      saveNativeValues +
      detectReact,
  );
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
