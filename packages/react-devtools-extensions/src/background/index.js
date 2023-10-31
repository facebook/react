/* global chrome */

'use strict';

import './dynamicallyInjectContentScripts';
import './tabsManager';

import {
  handleDevToolsPageMessage,
  handleBackendManagerMessage,
  handleReactDevToolsHookMessage,
  handleFetchResourceContentScriptMessage,
} from './messageHandlers';

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
  });
}

function registerProxyPort(port, tabId) {
  ports[tabId].proxy = port;

  // In case proxy port was disconnected from the other end, from content script
  // This can happen if content script was detached, when user does in-tab navigation
  // This listener should never be called when we call port.disconnect() from this (background/index.js) script
  port.onDisconnect.addListener(() => {
    ports[tabId].disconnectPipe?.();

    delete ports[tabId].proxy;
  });
}

function isNumeric(str: string): boolean {
  return +str + '' === str;
}

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'proxy') {
    // Might not be present for restricted pages in Firefox
    if (port.sender?.tab?.id == null) {
      // Not disconnecting it, so it would not reconnect
      return;
    }

    // Proxy content script is executed in tab, so it should have it specified.
    const tabId = port.sender.tab.id;

    if (ports[tabId]?.proxy) {
      ports[tabId].disconnectPipe?.();
      ports[tabId].proxy.disconnect();
    }

    registerTab(tabId);
    registerProxyPort(port, tabId);

    if (ports[tabId].extension) {
      connectExtensionAndProxyPorts(
        ports[tabId].extension,
        ports[tabId].proxy,
        tabId,
      );
    }

    return;
  }

  if (isNumeric(port.name)) {
    // DevTools page port doesn't have tab id specified, because its sender is the extension.
    const tabId = +port.name;

    registerTab(tabId);
    registerExtensionPort(port, tabId);

    if (ports[tabId].proxy) {
      connectExtensionAndProxyPorts(
        ports[tabId].extension,
        ports[tabId].proxy,
        tabId,
      );
    }

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
  switch (message?.source) {
    case 'devtools-page': {
      handleDevToolsPageMessage(message);
      break;
    }
    case 'react-devtools-fetch-resource-content-script': {
      handleFetchResourceContentScriptMessage(message);
      break;
    }
    case 'react-devtools-backend-manager': {
      handleBackendManagerMessage(message, sender);
      break;
    }
    case 'react-devtools-hook': {
      handleReactDevToolsHookMessage(message, sender);
    }
  }
});

chrome.tabs.onActivated.addListener(({tabId: activeTabId}) => {
  for (const registeredTabId in ports) {
    if (
      ports[registeredTabId].proxy != null &&
      ports[registeredTabId].extension != null
    ) {
      const numericRegisteredTabId = +registeredTabId;
      const event =
        activeTabId === numericRegisteredTabId
          ? 'resumeElementPolling'
          : 'pauseElementPolling';

      ports[registeredTabId].extension.postMessage({event});
    }
  }
});
