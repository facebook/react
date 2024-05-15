/* global chrome */

import nullthrows from 'nullthrows';

// We run scripts on the page via the service worker (background/index.js) for
// Manifest V3 extensions (Chrome & Edge).
// We need to inject this code for Firefox only because it does not support ExecutionWorld.MAIN
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/ExecutionWorld
// In this content script we have access to DOM, but don't have access to the webpage's window,
// so we inject this inline script tag into the webpage (allowed in Manifest V2).
function injectScriptSync(src) {
  let code = '';
  const request = new XMLHttpRequest();
  request.addEventListener('load', function () {
    code = this.responseText;
  });
  request.open('GET', src, false);
  request.send();

  const script = document.createElement('script');
  script.textContent = code;

  // This script runs before the <head> element is created,
  // so we add the script to <html> instead.
  nullthrows(document.documentElement).appendChild(script);
  nullthrows(script.parentNode).removeChild(script);
}

let lastSentDevToolsHookMessage;

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

  // We keep this logic here and not in `proxy.js`, because proxy content script is injected later at `document_end`
  if (data.source === 'react-devtools-hook') {
    const {source: messageSource, payload} = data;
    const message = {source: messageSource, payload};

    lastSentDevToolsHookMessage = message;
    chrome.runtime.sendMessage(message);
  }
});

// NOTE: Firefox WebExtensions content scripts are still alive and not re-injected
// while navigating the history to a document that has not been destroyed yet,
// replay the last detection result if the content script is active and the
// document has been hidden and shown again.
window.addEventListener('pageshow', function ({target}) {
  if (!lastSentDevToolsHookMessage || target !== window.document) {
    return;
  }

  chrome.runtime.sendMessage(lastSentDevToolsHookMessage);
});

if (__IS_FIREFOX__) {
  injectScriptSync(chrome.runtime.getURL('build/renderer.js'));

  // Inject a __REACT_DEVTOOLS_GLOBAL_HOOK__ global for React to interact with.
  // Only do this for HTML documents though, to avoid e.g. breaking syntax highlighting for XML docs.
  switch (document.contentType) {
    case 'text/html':
    case 'application/xhtml+xml': {
      injectScriptSync(chrome.runtime.getURL('build/installHook.js'));
      break;
    }
  }
}
