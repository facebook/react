/* global chrome */

'use strict';

let backendDisconnected: boolean = false;
let backendInitialized: boolean = false;

function sayHelloToBackendManager() {
  window.postMessage(
    {
      source: 'react-devtools-content-script',
      hello: true,
    },
    '*',
  );
}

function handleMessageFromDevtools(message) {
  window.postMessage(
    {
      source: 'react-devtools-content-script',
      payload: message,
    },
    '*',
  );
}

function handleMessageFromPage(event) {
  if (event.source === window && event.data) {
    // This is a message from a bridge (initialized by a devtools backend)
    if (event.data.source === 'react-devtools-bridge') {
      backendInitialized = true;

      port.postMessage(event.data.payload);
    }
    // This is a message from the backend manager
    if (event.data.source === 'react-devtools-backend-manager') {
      chrome.runtime.sendMessage({
        payload: event.data.payload,
      });
    }
  }
}

function handleDisconnect() {
  backendDisconnected = true;

  window.removeEventListener('message', handleMessageFromPage);

  window.postMessage(
    {
      source: 'react-devtools-content-script',
      payload: {
        type: 'event',
        event: 'shutdown',
      },
    },
    '*',
  );
}

// proxy from main page to devtools (via the background page)
const port = chrome.runtime.connect({
  name: 'content-script',
});
port.onMessage.addListener(handleMessageFromDevtools);
port.onDisconnect.addListener(handleDisconnect);

window.addEventListener('message', handleMessageFromPage);

sayHelloToBackendManager();

// The backend waits to install the global hook until notified by the content script.
// In the event of a page reload, the content script might be loaded before the backend manager is injected.
// Because of this we need to poll the backend manager until it has been initialized.
if (!backendInitialized) {
  const intervalID = setInterval(() => {
    if (backendInitialized || backendDisconnected) {
      clearInterval(intervalID);
    } else {
      sayHelloToBackendManager();
    }
  }, 500);
}
