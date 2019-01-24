/* global chrome */

import nullthrows from 'nullthrows';
import { installHook } from 'src/hook';

let lastDetectionResult;

// We want to detect when a renderer attaches, and notify the "background
// page" (which is shared between tabs and can highlight the React icon).
// Currently we are in "content script" context, so we can't listen
// to the hook directly (it will be injected directly into the page).
// So instead, the hook will use postMessage() to pass message to us here.
// And when this happens, we'll send a message to the "background page".
window.addEventListener('message', function(evt) {
  if (
    evt.source === window &&
    evt.data &&
    evt.data.source === 'react-devtools-detector'
  ) {
    lastDetectionResult = {
      hasDetectedReact: true,
      reactBuildType: evt.data.reactBuildType,
    };
    chrome.runtime.sendMessage(lastDetectionResult);
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

// Inject a `__REACT_DEVTOOLS_GLOBAL_HOOK__` global so that React can detect that the
// devtools are installed (and skip its suggestion to install the devtools).
const js =
  ';(' + installHook.toString() + '(window))' + saveNativeValues + detectReact;

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
const script = document.createElement('script');
script.textContent = js;
nullthrows(document.documentElement).appendChild(script);
nullthrows(script.parentNode).removeChild(script);
