/* global chrome */

'use strict';

window.addEventListener('pageshow', function ({target}) {
  // Firefox's behaviour for injecting this content script can be unpredictable
  // While navigating the history, some content scripts might not be re-injected and still be alive
  if (!window.__REACT_DEVTOOLS_PROXY_INJECTED__) {
    window.__REACT_DEVTOOLS_PROXY_INJECTED__ = true;

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
  }
});

window.addEventListener('pagehide', function ({target}) {
  if (target !== window.document) {
    return;
  }

  delete window.__REACT_DEVTOOLS_PROXY_INJECTED__;
});

let port = null;
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
