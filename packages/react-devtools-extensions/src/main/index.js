/* global chrome */

import {createElement} from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import Bridge from 'react-devtools-shared/src/bridge';
import Store from 'react-devtools-shared/src/devtools/store';
import {IS_CHROME, IS_EDGE, getBrowserTheme, IS_FIREFOX} from '../utils';
import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
import DevTools from 'react-devtools-shared/src/devtools/views/DevTools';
import {
  __DEBUG__,
  LOCAL_STORAGE_SUPPORTS_PROFILING_KEY,
  LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY,
} from 'react-devtools-shared/src/constants';
import {logEvent} from 'react-devtools-shared/src/Logger';

import {
  setBrowserSelectionFromReact,
  setReactSelectionFromBrowser,
} from './elementSelection';
import cloneStyleTags from './cloneStyleTags';
import injectBackendManager from './injectBackendManager';
import syncSavedPreferences from './syncSavedPreferences';
import registerEventsLogger from './registerEventsLogger';
import getProfilingFlags from './getProfilingFlags';
import './requestAnimationFramePolyfill';

function executeIfReactHasLoaded(callback) {
  chrome.devtools.inspectedWindow.eval(
    'window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0',
    (pageHasReact, exceptionInfo) => {
      if (exceptionInfo) {
        const {code, description, isError, isException, value} = exceptionInfo;

        if (isException) {
          console.error(
            `Received error while checking if react has loaded: ${value}`,
          );
          return;
        }

        if (isError) {
          console.error(
            `Received error with code ${code} while checking if react has loaded: ${description}`,
          );
          return;
        }
      }

      if (pageHasReact) {
        callback();
      }
    },
  );
}

function createBridge() {
  bridge = new Bridge({
    listen(fn) {
      const listener = message => fn(message);
      // Store the reference so that we unsubscribe from the same object.
      const portOnMessage = port.onMessage;
      portOnMessage.addListener(listener);

      return () => {
        portOnMessage.removeListener(listener);
      };
    },

    send(event: string, payload: any, transferable?: Array<any>) {
      port.postMessage({event, payload}, transferable);
    },
  });

  bridge.addListener('reloadAppForProfiling', () => {
    localStorageSetItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY, 'true');
    chrome.devtools.inspectedWindow.eval('window.location.reload();');
  });

  bridge.addListener(
    'syncSelectionToNativeElementsPanel',
    setBrowserSelectionFromReact,
  );

  bridge.addListener('extensionBackendInitialized', () => {
    // Initialize the renderer's trace-updates setting.
    // This handles the case of navigating to a new page after the DevTools have already been shown.
    bridge.send(
      'setTraceUpdatesEnabled',
      localStorageGetItem(LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY) === 'true',
    );
  });

  const onBrowserElementSelectionChanged = () =>
    setReactSelectionFromBrowser(bridge);
  const onBridgeShutdown = () => {
    chrome.devtools.panels.elements.onSelectionChanged.removeListener(
      onBrowserElementSelectionChanged,
    );
  };

  bridge.addListener('shutdown', onBridgeShutdown);

  chrome.devtools.panels.elements.onSelectionChanged.addListener(
    onBrowserElementSelectionChanged,
  );
}

function createBridgeAndStore() {
  createBridge();

  const {isProfiling, supportsProfiling} = getProfilingFlags();

  store = new Store(bridge, {
    isProfiling,
    supportsReloadAndProfile: IS_CHROME || IS_EDGE,
    supportsProfiling,
    // At this time, the timeline can only parse Chrome performance profiles.
    supportsTimeline: IS_CHROME,
    supportsTraceUpdates: true,
  });

  if (!isProfiling) {
    // We previously stored this in performCleanup function
    store.profilerStore.profilingData = profilingData;
  }

  // Initialize the backend only once the Store has been initialized.
  // Otherwise, the Store may miss important initial tree op codes.
  injectBackendManager(chrome.devtools.inspectedWindow.tabId);

  const viewAttributeSourceFunction = (id, path) => {
    const rendererID = store.getRendererIDForElement(id);
    if (rendererID != null) {
      // Ask the renderer interface to find the specified attribute,
      // and store it as a global variable on the window.
      bridge.send('viewAttributeSource', {id, path, rendererID});

      setTimeout(() => {
        // Ask Chrome to display the location of the attribute,
        // assuming the renderer found a match.
        chrome.devtools.inspectedWindow.eval(`
                if (window.$attribute != null) {
                  inspect(window.$attribute);
                }
              `);
      }, 100);
    }
  };

  const viewElementSourceFunction = id => {
    const rendererID = store.getRendererIDForElement(id);
    if (rendererID != null) {
      // Ask the renderer interface to determine the component function,
      // and store it as a global variable on the window
      bridge.send('viewElementSource', {id, rendererID});

      setTimeout(() => {
        // Ask Chrome to display the location of the component function,
        // or a render method if it is a Class (ideally Class instance, not type)
        // assuming the renderer found one.
        chrome.devtools.inspectedWindow.eval(`
                if (window.$type != null) {
                  if (
                    window.$type &&
                    window.$type.prototype &&
                    window.$type.prototype.isReactComponent
                  ) {
                    // inspect Component.render, not constructor
                    inspect(window.$type.prototype.render);
                  } else {
                    // inspect Functional Component
                    inspect(window.$type);
                  }
                }
              `);
      }, 100);
    }
  };

  let debugIDCounter = 0;

  // For some reason in Firefox, chrome.runtime.sendMessage() from a content script
  // never reaches the chrome.runtime.onMessage event listener.
  let fetchFileWithCaching = null;
  if (IS_CHROME) {
    const fetchFromNetworkCache = (url, resolve, reject) => {
      // Debug ID allows us to avoid re-logging (potentially long) URL strings below,
      // while also still associating (potentially) interleaved logs with the original request.
      let debugID = null;

      if (__DEBUG__) {
        debugID = debugIDCounter++;
        console.log(`[main] fetchFromNetworkCache(${debugID})`, url);
      }

      chrome.devtools.network.getHAR(harLog => {
        for (let i = 0; i < harLog.entries.length; i++) {
          const entry = harLog.entries[i];
          if (url === entry.request.url) {
            if (__DEBUG__) {
              console.log(
                `[main] fetchFromNetworkCache(${debugID}) Found matching URL in HAR`,
                url,
              );
            }

            entry.getContent(content => {
              if (content) {
                if (__DEBUG__) {
                  console.log(
                    `[main] fetchFromNetworkCache(${debugID}) Content retrieved`,
                  );
                }

                resolve(content);
              } else {
                if (__DEBUG__) {
                  console.log(
                    `[main] fetchFromNetworkCache(${debugID}) Invalid content returned by getContent()`,
                    content,
                  );
                }

                // Edge case where getContent() returned null; fall back to fetch.
                fetchFromPage(url, resolve, reject);
              }
            });

            return;
          }
        }

        if (__DEBUG__) {
          console.log(
            `[main] fetchFromNetworkCache(${debugID}) No cached request found in getHAR()`,
          );
        }

        // No matching URL found; fall back to fetch.
        fetchFromPage(url, resolve, reject);
      });
    };

    const fetchFromPage = (url, resolve, reject) => {
      if (__DEBUG__) {
        console.log('[main] fetchFromPage()', url);
      }

      function onPortMessage({payload, source}) {
        if (source === 'react-devtools-content-script') {
          switch (payload?.type) {
            case 'fetch-file-with-cache-complete':
              chrome.runtime.onMessage.removeListener(onPortMessage);
              resolve(payload.value);
              break;
            case 'fetch-file-with-cache-error':
              chrome.runtime.onMessage.removeListener(onPortMessage);
              reject(payload.value);
              break;
          }
        }
      }

      chrome.runtime.onMessage.addListener(onPortMessage);

      chrome.devtools.inspectedWindow.eval(`
              window.postMessage({
                source: 'react-devtools-extension',
                payload: {
                  type: 'fetch-file-with-cache',
                  url: "${url}",
                },
              });
            `);
    };

    // Fetching files from the extension won't make use of the network cache
    // for resources that have already been loaded by the page.
    // This helper function allows the extension to request files to be fetched
    // by the content script (running in the page) to increase the likelihood of a cache hit.
    fetchFileWithCaching = url => {
      return new Promise((resolve, reject) => {
        // Try fetching from the Network cache first.
        // If DevTools was opened after the page started loading, we may have missed some requests.
        // So fall back to a fetch() from the page and hope we get a cached response that way.
        fetchFromNetworkCache(url, resolve, reject);
      });
    };
  }

  // TODO (Webpack 5) Hopefully we can remove this prop after the Webpack 5 migration.
  const hookNamesModuleLoaderFunction = () =>
    import(
      /* webpackChunkName: 'parseHookNames' */ 'react-devtools-shared/src/hooks/parseHookNames'
    );

  root = createRoot(document.createElement('div'));

  render = (overrideTab = mostRecentOverrideTab) => {
    mostRecentOverrideTab = overrideTab;

    root.render(
      createElement(DevTools, {
        bridge,
        browserTheme: getBrowserTheme(),
        componentsPortalContainer,
        enabledInspectedElementContextMenu: true,
        fetchFileWithCaching,
        hookNamesModuleLoaderFunction,
        overrideTab,
        profilerPortalContainer,
        showTabBar: false,
        store,
        warnIfUnsupportedVersionDetected: true,
        viewAttributeSourceFunction,
        viewElementSourceFunction,
        viewUrlSourceFunction,
      }),
    );
  };
}

const viewUrlSourceFunction = (url, line, col) => {
  chrome.devtools.panels.openResource(url, line, col);
};

function ensureInitialHTMLIsCleared(container) {
  if (container._hasInitialHTMLBeenCleared) {
    return;
  }

  container.innerHTML = '';
  container._hasInitialHTMLBeenCleared = true;
}

function createComponentsPanel() {
  if (componentsPortalContainer) {
    render('components');

    return;
  }

  chrome.devtools.panels.create(
    IS_CHROME || IS_EDGE ? '⚛️ Components' : 'Components',
    IS_EDGE ? 'icons/production.svg' : '',
    'panel.html',
    createdPanel => {
      createdPanel.onShown.addListener(portal => {
        componentsPortalContainer = portal.container;
        if (componentsPortalContainer != null) {
          ensureInitialHTMLIsCleared(componentsPortalContainer);

          render('components');
          portal.injectStyles(cloneStyleTags);

          logEvent({event_name: 'selected-components-tab'});
        }
      });

      // TODO: we should listen to createdPanel.onHidden to unmount some listeners
      // and potentially stop highlighting
    },
  );
}

function createProfilerPanel() {
  if (profilerPortalContainer) {
    render('profiler');

    return;
  }

  chrome.devtools.panels.create(
    IS_CHROME || IS_EDGE ? '⚛️ Profiler' : 'Profiler',
    IS_EDGE ? 'icons/production.svg' : '',
    'panel.html',
    createdPanel => {
      createdPanel.onShown.addListener(portal => {
        profilerPortalContainer = portal.container;
        if (profilerPortalContainer != null) {
          ensureInitialHTMLIsCleared(profilerPortalContainer);

          render('profiler');
          portal.injectStyles(cloneStyleTags);

          logEvent({event_name: 'selected-profiler-tab'});
        }
      });
    },
  );
}

function performInTabNavigationCleanup() {
  // Potentially, if react hasn't loaded yet and user performs in-tab navigation
  clearReactPollingInterval();

  if (store !== null) {
    // Store profiling data, so it can be used later
    profilingData = store.profilerStore.profilingData;
  }

  // If panels were already created, and we have already mounted React root to display
  // tabs (Components or Profiler), we should unmount root first and render them again
  if ((componentsPortalContainer || profilerPortalContainer) && root) {
    // It's easiest to recreate the DevTools panel (to clean up potential stale state).
    // We can revisit this in the future as a small optimization.
    // This should also emit bridge.shutdown, but only if this root was mounted
    flushSync(() => root.unmount());
  } else {
    // In case Browser DevTools were opened, but user never pressed on extension panels
    // They were never mounted and there is nothing to unmount, but we need to emit shutdown event
    // because bridge was already created
    bridge?.shutdown();
  }

  // Do not nullify componentsPanelPortal and profilerPanelPortal on purpose,
  // They are not recreated when user does in-tab navigation, and they can only be accessed via
  // callback in onShown listener, which is called only when panel has been shown
  // This event won't be emitted again after in-tab navigation, if DevTools panel keeps being opened

  // Do not clean mostRecentOverrideTab on purpose, so we remember last opened
  // React DevTools tab, when user does in-tab navigation

  store = null;
  bridge = null;
  render = null;
  root = null;

  port?.disconnect();
  port = null;
}

function performFullCleanup() {
  // Potentially, if react hasn't loaded yet and user closed the browser DevTools
  clearReactPollingInterval();

  if ((componentsPortalContainer || profilerPortalContainer) && root) {
    // This should also emit bridge.shutdown, but only if this root was mounted
    flushSync(() => root.unmount());
  } else {
    bridge?.shutdown();
  }

  componentsPortalContainer = null;
  profilerPortalContainer = null;
  root = null;

  mostRecentOverrideTab = null;
  store = null;
  bridge = null;
  render = null;

  port?.disconnect();
  port = null;
}

function connectExtensionPort() {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  port = chrome.runtime.connect({
    name: String(tabId),
  });

  // This port may be disconnected by Chrome at some point, this callback
  // will be executed only if this port was disconnected from the other end
  // so, when we call `port.disconnect()` from this script,
  // this should not trigger this callback and port reconnection
  port.onDisconnect.addListener(connectExtensionPort);
}

function mountReactDevTools() {
  registerEventsLogger();

  connectExtensionPort();

  createBridgeAndStore();

  setReactSelectionFromBrowser(bridge);

  createComponentsPanel();
  createProfilerPanel();
}

// TODO: display some disclaimer if user performs in-tab navigation to non-react application
// when React DevTools panels are already opened, currently we will display just blank white block
function mountReactDevToolsWhenReactHasLoaded() {
  const checkIfReactHasLoaded = () => executeIfReactHasLoaded(onReactReady);

  // Check to see if React has loaded in case React is added after page load
  reactPollingIntervalId = setInterval(() => {
    checkIfReactHasLoaded();
  }, 500);

  function onReactReady() {
    clearReactPollingInterval();
    mountReactDevTools();
  }

  checkIfReactHasLoaded();
}

let reactPollingIntervalId = null;

let bridge = null;
let store = null;

let profilingData = null;

let componentsPortalContainer = null;
let profilerPortalContainer = null;

let mostRecentOverrideTab = null;
let render = null;
let root = null;

let port = null;

// Re-initialize saved filters on navigation,
// since global values stored on window get reset in this case.
chrome.devtools.network.onNavigated.addListener(syncSavedPreferences);

// Cleanup previous page state and remount everything
chrome.devtools.network.onNavigated.addListener(() => {
  clearReactPollingInterval();

  performInTabNavigationCleanup();
  mountReactDevToolsWhenReactHasLoaded();
});

// Should be emitted when browser DevTools are closed
if (IS_FIREFOX) {
  // For some reason Firefox doesn't emit onBeforeUnload event
  window.addEventListener('unload', performFullCleanup);
} else {
  window.addEventListener('beforeunload', performFullCleanup);
}

function clearReactPollingInterval() {
  clearInterval(reactPollingIntervalId);
  reactPollingIntervalId = null;
}

syncSavedPreferences();
mountReactDevToolsWhenReactHasLoaded();
