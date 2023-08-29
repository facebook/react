/* global chrome */

'use strict';

let port = null;
let backendInitialized: boolean = false;

connectPort();
sayHelloToBackendManager();

// The backend waits to install the global hook until notified by the content script.
// In the event of a page reload, the content script might be loaded before the backend manager is injected.
// Because of this we need to poll the backend manager until it has been initialized.
const intervalID = setInterval(() => {
  if (backendInitialized) {
    clearInterval(intervalID);
  } else {
    sayHelloToBackendManager();
  }
}, 500);

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
  if (message.source === 'react-devtools-service-worker' && message.stop) {
    window.removeEventListener('message', handleMessageFromPage);

    // Calling disconnect here should not emit onDisconnect event inside this script
    // This port will not attempt to reconnect again
    // It will connect only once this content script will be injected again
    port?.disconnect();
    port = null;

    return;
  }

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
  window.removeEventListener('message', handleMessageFromPage);
  port = null;

  connectPort();
}

// Creates port from application page to the React DevTools' service worker
// Which then connects it with extension port
function connectPort() {
  port = chrome.runtime.connect({
    name: 'proxy',
  });

  window.addEventListener('message', handleMessageFromPage);

  port.onMessage.addListener(handleMessageFromDevtools);
  port.onDisconnect.addListener(handleDisconnect);
}
