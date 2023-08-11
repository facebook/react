/* global chrome */

'use strict';

import {IS_FIREFOX, EXTENSION_CONTAINED_VERSIONS} from '../utils';

import './dynamicallyInjectContentScripts';
import './tabsManager';
import setExtensionIconAndPopup from './setExtensionIconAndPopup';
import injectProxy from './injectProxy';

/*
  {
    [tabId]: {
      extension: ExtensionPort,
      proxy: ProxyPort,
      disconnectPipe: Function,
    },
    ...
   }
 */
const ports = {};

function registerTab(tabId) {
  if (!ports[tabId]) {
    ports[tabId] = {
      extension: null,
      proxy: null,
      disconnectPipe: null,
    };
  }
}

function registerExtensionPort(port, tabId) {
  ports[tabId].extension = port;

  port.onDisconnect.addListener(() => {
    // This should delete disconnectPipe from ports dictionary
    ports[tabId].disconnectPipe?.();

    delete ports[tabId].extension;

    const proxyPort = ports[tabId].proxy;
    if (proxyPort) {
      // Do not disconnect proxy port, we will inject this content script again
      // If extension port has disconnected, it probably means that user did in-tab navigation
      clearReconnectionTimeout(proxyPort);

      proxyPort.postMessage({
        source: 'react-devtools-service-worker',
        stop: true,
      });
    }
  });
}

function registerProxyPort(port, tabId) {
  ports[tabId].proxy = port;

  // In case proxy port was disconnected from the other end, from content script
  // This can happen if content script was detached, when user does in-tab navigation
  // Or if when we notify proxy port to stop reconnecting, when extension port dies
  // This listener should never be called when we call port.shutdown() from this (background/index.js) script
  port.onDisconnect.addListener(() => {
    ports[tabId].disconnectPipe?.();

    delete ports[tabId].proxy;
  });

  port._reconnectionTimeoutId = setTimeout(
    reconnectProxyPort,
    25_000,
    port,
    tabId,
  );
}

function clearReconnectionTimeout(port) {
  if (port._reconnectionTimeoutId) {
    clearTimeout(port._reconnectionTimeoutId);
    delete port._reconnectionTimeoutId;
  }
}

function reconnectProxyPort(port, tabId) {
  // IMPORTANT: port.onDisconnect will only be emitted if disconnect() was called from the other end
  // We need to do it manually here if we disconnect proxy port from service worker
  ports[tabId].disconnectPipe?.();

  // It should be reconnected automatically by proxy content script, look at proxy.js
  port.disconnect();
}

function isNumeric(str: string): boolean {
  return +str + '' === str;
}

chrome.runtime.onConnect.addListener(async port => {
  if (port.name === 'proxy') {
    // Proxy content script is executed in tab, so it should have it specified.
    const tabId = port.sender.tab.id;

    registerTab(tabId);
    registerProxyPort(port, tabId);

    connectExtensionAndProxyPorts(
      ports[tabId].extension,
      ports[tabId].proxy,
      tabId,
    );

    return;
  }

  if (isNumeric(port.name)) {
    // Extension port doesn't have tab id specified, because its sender is the extension.
    const tabId = +port.name;

    registerTab(tabId);
    registerExtensionPort(port, tabId);

    injectProxy(tabId);

    return;
  }

  // I am not sure if we should throw here
  console.warn(`Unknown port ${port.name} connected`);
});

function connectExtensionAndProxyPorts(extensionPort, proxyPort, tabId) {
  if (!extensionPort) {
    throw new Error(
      `Attempted to connect ports, when extension port is not present`,
    );
  }

  if (!proxyPort) {
    throw new Error(
      `Attempted to connect ports, when proxy port is not present`,
    );
  }

  if (ports[tabId].disconnectPipe) {
    throw new Error(
      `Attempted to connect already connected ports for tab with id ${tabId}`,
    );
  }

  function extensionPortMessageListener(message) {
    try {
      proxyPort.postMessage(message);
    } catch (e) {
      if (__DEV__) {
        console.log(`Broken pipe ${tabId}: `, e);
      }

      disconnectListener();
    }
  }

  function proxyPortMessageListener(message) {
    try {
      extensionPort.postMessage(message);
    } catch (e) {
      if (__DEV__) {
        console.log(`Broken pipe ${tabId}: `, e);
      }

      disconnectListener();
    }
  }

  function disconnectListener() {
    extensionPort.onMessage.removeListener(extensionPortMessageListener);
    proxyPort.onMessage.removeListener(proxyPortMessageListener);

    // We handle disconnect() calls manually, based on each specific case
    // No need to disconnect other port here

    delete ports[tabId].disconnectPipe;
  }

  ports[tabId].disconnectPipe = disconnectListener;

  extensionPort.onMessage.addListener(extensionPortMessageListener);
  proxyPort.onMessage.addListener(proxyPortMessageListener);

  extensionPort.onDisconnect.addListener(disconnectListener);
  proxyPort.onDisconnect.addListener(disconnectListener);
}

chrome.runtime.onMessage.addListener((message, sender) => {
  const tab = sender.tab;
  // sender.tab.id from content script points to the tab that injected the content script
  if (tab) {
    const id = tab.id;
    // This is sent from the hook content script.
    // It tells us a renderer has attached.
    if (message.hasDetectedReact) {
      setExtensionIconAndPopup(message.reactBuildType, id);
    } else {
      const extensionPort = ports[id]?.extension;

      switch (message.payload?.type) {
        case 'fetch-file-with-cache-complete':
        case 'fetch-file-with-cache-error':
          // Forward the result of fetch-in-page requests back to the extension.
          extensionPort?.postMessage(message);
          break;
        // This is sent from the backend manager running on a page
        case 'react-devtools-required-backends':
          const backendsToDownload = [];
          message.payload.versions.forEach(version => {
            if (EXTENSION_CONTAINED_VERSIONS.includes(version)) {
              if (!IS_FIREFOX) {
                // equivalent logic for Firefox is in prepareInjection.js
                chrome.scripting.executeScript({
                  target: {tabId: id},
                  files: [`/build/react_devtools_backend_${version}.js`],
                  world: chrome.scripting.ExecutionWorld.MAIN,
                });
              }
            } else {
              backendsToDownload.push(version);
            }
          });

          // Request the necessary backends in the extension DevTools UI
          // TODO: handle this message in index.js to build the UI
          extensionPort?.postMessage({
            payload: {
              type: 'react-devtools-additional-backends',
              versions: backendsToDownload,
            },
          });
          break;
      }
    }
  }

  // This is sent from the devtools page when it is ready for injecting the backend
  if (message?.payload?.type === 'react-devtools-inject-backend-manager') {
    // sender.tab.id from devtools page may not exist, or point to the undocked devtools window
    // so we use the payload to get the tab id
    const tabId = message.payload.tabId;

    if (tabId && !IS_FIREFOX) {
      // equivalent logic for Firefox is in prepareInjection.js
      chrome.scripting.executeScript({
        target: {tabId},
        files: ['/build/backendManager.js'],
        world: chrome.scripting.ExecutionWorld.MAIN,
      });
    }
  }
});
