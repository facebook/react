/* global chrome */

let backendDisconnected: boolean = false;
let backendInitialized: boolean = false;

function sayHelloToBackend() {
  window.postMessage(
    {
      source: 'react-devtools-content-script',
      hello: true,
    },
    '*'
  );
}

function handleMessageFromDevtools(message) {
  window.postMessage(
    {
      source: 'react-devtools-content-script',
      payload: message,
    },
    '*'
  );
}

function handleMessageFromPage(evt) {
  if (
    evt.source === window &&
    evt.data &&
    evt.data.source === 'react-devtools-bridge'
  ) {
    backendInitialized = true;

    port.postMessage(evt.data.payload);
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
    '*'
  );
}

// proxy from main page to devtools (via the background page)
var port = chrome.runtime.connect({
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.event === 'screenshotCaptured') {
    window.postMessage(
      {
        source: 'react-devtools-content-script',
        payload: request,
      },
      '*'
    );
  }
});
