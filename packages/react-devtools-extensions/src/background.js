/* global chrome */

'use strict';

import {IS_FIREFOX} from './utils';

const ports = {};

if (!IS_FIREFOX) {
  // equivalent logic for Firefox is in prepareInjection.js
  // Manifest V3 method of injecting content scripts (not yet supported in Firefox)
  // Note: the "world" option in registerContentScripts is only available in Chrome v102+
  // It's critical since it allows us to directly run scripts on the "main" world on the page
  // "document_start" allows it to run before the page's scripts
  // so the hook can be detected by react reconciler
  chrome.scripting.registerContentScripts(
    [
      {
        id: 'hook',
        matches: ['<all_urls>'],
        js: ['build/installHook.js'],
        runAt: 'document_start',
        world: chrome.scripting.ExecutionWorld.MAIN,
      },
    ],
    function () {
      // When the content scripts are already registered, an error will be thrown.
      // It happens when the service worker process is incorrectly duplicated.
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      }
    },
  );
}

chrome.runtime.onConnect.addListener(function (port) {
  let tab = null;
  let name = null;
  if (isNumeric(port.name)) {
    tab = port.name;
    name = 'devtools';
    installProxy(+port.name);
  } else {
    tab = port.sender.tab.id;
    name = 'content-script';
  }

  if (!ports[tab]) {
    ports[tab] = {
      devtools: null,
      'content-script': null,
    };
  }
  ports[tab][name] = port;

  if (ports[tab].devtools && ports[tab]['content-script']) {
    doublePipe(ports[tab].devtools, ports[tab]['content-script'], tab);
  }
});

function isNumeric(str: string): boolean {
  return +str + '' === str;
}

function installProxy(tabId: number) {
  if (IS_FIREFOX) {
    chrome.tabs.executeScript(tabId, {file: '/build/proxy.js'}, function () {});
  } else {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      files: ['/build/proxy.js'],
    });
  }
}

function doublePipe(one, two, tabId) {
  one.onMessage.addListener(lOne);
  function lOne(message) {
    try {
      two.postMessage(message);
    } catch (e) {
      if (__DEV__) {
        console.log(`Broken pipe ${tabId}: `, e);
      }
      shutdown();
    }
  }
  two.onMessage.addListener(lTwo);
  function lTwo(message) {
    try {
      one.postMessage(message);
    } catch (e) {
      if (__DEV__) {
        console.log(`Broken pipe ${tabId}: `, e);
      }
      shutdown();
    }
  }
  function shutdown() {
    one.onMessage.removeListener(lOne);
    two.onMessage.removeListener(lTwo);
    one.disconnect();
    two.disconnect();
    // clean up so that we can rebuild the double pipe if the page is reloaded
    ports[tabId] = null;
  }
  one.onDisconnect.addListener(shutdown);
  two.onDisconnect.addListener(shutdown);
}

function setIconAndPopup(reactBuildType, tabId) {
  const action = IS_FIREFOX ? chrome.browserAction : chrome.action;
  action.setIcon({
    tabId: tabId,
    path: {
      '16': chrome.runtime.getURL(`icons/16-${reactBuildType}.png`),
      '32': chrome.runtime.getURL(`icons/32-${reactBuildType}.png`),
      '48': chrome.runtime.getURL(`icons/48-${reactBuildType}.png`),
      '128': chrome.runtime.getURL(`icons/128-${reactBuildType}.png`),
    },
  });
  action.setPopup({
    tabId: tabId,
    popup: chrome.runtime.getURL(`popups/${reactBuildType}.html`),
  });
}

function isRestrictedBrowserPage(url) {
  return !url || new URL(url).protocol === 'chrome:';
}

function checkAndHandleRestrictedPageIfSo(tab) {
  if (tab && isRestrictedBrowserPage(tab.url)) {
    setIconAndPopup('restricted', tab.id);
  }
}

// update popup page of any existing open tabs, if they are restricted browser pages.
// we can't update for any other types (prod,dev,outdated etc)
// as the content script needs to be injected at document_start itself for those kinds of detection
// TODO: Show a different popup page(to reload current page probably) for old tabs, opened before the extension is installed
if (!IS_FIREFOX) {
  chrome.tabs.query({}, tabs => tabs.forEach(checkAndHandleRestrictedPageIfSo));
  chrome.tabs.onCreated.addListener((tabId, changeInfo, tab) =>
    checkAndHandleRestrictedPageIfSo(tab),
  );
}

// Listen to URL changes on the active tab and update the DevTools icon.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (IS_FIREFOX) {
    // We don't properly detect protected URLs in Firefox at the moment.
    // However we can reset the DevTools icon to its loading state when the URL changes.
    // It will be updated to the correct icon by the onMessage callback below.
    if (tab.active && changeInfo.status === 'loading') {
      setIconAndPopup('disabled', tabId);
    }
  } else {
    // Don't reset the icon to the loading state for Chrome or Edge.
    // The onUpdated callback fires more frequently for these browsers,
    // often after onMessage has been called.
    checkAndHandleRestrictedPageIfSo(tab);
  }
});

chrome.runtime.onMessage.addListener((request, sender) => {
  const tab = sender.tab;
  if (tab) {
    const id = tab.id;
    // This is sent from the hook content script.
    // It tells us a renderer has attached.
    if (request.hasDetectedReact) {
      setIconAndPopup(request.reactBuildType, id);
    } else {
      switch (request.payload?.type) {
        case 'fetch-file-with-cache-complete':
        case 'fetch-file-with-cache-error':
          // Forward the result of fetch-in-page requests back to the extension.
          const devtools = ports[id]?.devtools;
          if (devtools) {
            devtools.postMessage(request);
          }
          break;
      }
    }
  } else if (request.payload?.tabId) {
    const tabId = request.payload?.tabId;
    // This is sent from the devtools page when it is ready for injecting the backend
    if (request.payload.type === 'react-devtools-inject-backend') {
      if (!IS_FIREFOX) {
        // equivalent logic for Firefox is in prepareInjection.js
        chrome.scripting.executeScript({
          target: {tabId},
          files: ['/build/react_devtools_backend.js'],
          world: chrome.scripting.ExecutionWorld.MAIN,
        });
      }
    }
  }
});
