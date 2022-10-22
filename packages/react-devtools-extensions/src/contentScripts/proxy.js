/* global chrome */

'use strict';

let backendDisconnected: boolean = false;
let backendInitialized: boolean = false;

function sayHelloToBackend() {
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
  if (
    event.source === window &&
    event.data &&
    event.data.source === 'react-devtools-bridge'
  ) {
    backendInitialized = true;

    port.postMessage(event.data.payload);
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

sayHelloToBackend();

// The backend waits to install the global hook until notified by the content script.
// In the event of a page reload, the content script might be loaded before the backend is injected.
// Because of this we need to poll the backend until it has been initialized.
if (!backendInitialized) {
  const intervalID = setInterval(() => {
    if (backendInitialized || backendDisconnected) {
      clearInterval(intervalID);
    } else {
      sayHelloToBackend();
    }
  }, 500);
}
