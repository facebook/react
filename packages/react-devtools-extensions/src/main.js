/* global chrome */

import {createElement} from 'react';
import {unstable_createRoot as createRoot, flushSync} from 'react-dom';
import Bridge from 'react-devtools-shared/src/bridge';
import Store from 'react-devtools-shared/src/devtools/store';
import {getBrowserName, getBrowserTheme} from './utils';
import {LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY} from 'react-devtools-shared/src/constants';
import {
  getSavedComponentFilters,
  getAppendComponentStack,
} from 'react-devtools-shared/src/utils';
import {
  localStorageGetItem,
  localStorageRemoveItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
import DevTools from 'react-devtools-shared/src/devtools/views/DevTools';

const LOCAL_STORAGE_SUPPORTS_PROFILING_KEY =
  'React::DevTools::supportsProfiling';

const isChrome = getBrowserName() === 'Chrome';

let panelCreated = false;

// The renderer interface can't read saved component filters directly,
// because they are stored in localStorage within the context of the extension.
// Instead it relies on the extension to pass filters through.
function syncSavedPreferences() {
  const componentFilters = getSavedComponentFilters();
  chrome.devtools.inspectedWindow.eval(
    `window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = ${JSON.stringify(
      componentFilters,
    )};`,
  );

  const appendComponentStack = getAppendComponentStack();
  chrome.devtools.inspectedWindow.eval(
    `window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = ${JSON.stringify(
      appendComponentStack,
    )};`,
  );
}

syncSavedPreferences();

function createPanelIfReactLoaded() {
  if (panelCreated) {
    return;
  }

  chrome.devtools.inspectedWindow.eval(
    'window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0',
    function(pageHasReact, error) {
      if (!pageHasReact || panelCreated) {
        return;
      }

      panelCreated = true;

      clearInterval(loadCheckInterval);

      let bridge = null;
      let store = null;

      let profilingData = null;

      let componentsPortalContainer = null;
      let profilerPortalContainer = null;

      let cloneStyleTags = null;
      let mostRecentOverrideTab = null;
      let render = null;
      let root = null;

      const tabId = chrome.devtools.inspectedWindow.tabId;

      function initBridgeAndStore() {
        const port = chrome.runtime.connect({
          name: '' + tabId,
        });
        // Looks like `port.onDisconnect` does not trigger on in-tab navigation like new URL or back/forward navigation,
        // so it makes no sense to handle it here.

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
        bridge.addListener('syncSelectionToNativeElementsPanel', () => {
          setBrowserSelectionFromReact();
        });

        // This flag lets us tip the Store off early that we expect to be profiling.
        // This avoids flashing a temporary "Profiling not supported" message in the Profiler tab,
        // after a user has clicked the "reload and profile" button.
        let isProfiling = false;
        let supportsProfiling = false;
        if (
          localStorageGetItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY) === 'true'
        ) {
          supportsProfiling = true;
          isProfiling = true;
          localStorageRemoveItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY);
        }

        if (store !== null) {
          profilingData = store.profilerStore.profilingData;
        }

        bridge.addListener('extensionBackendInitialized', () => {
          // Initialize the renderer's trace-updates setting.
          // This handles the case of navigating to a new page after the DevTools have already been shown.
          bridge.send(
            'setTraceUpdatesEnabled',
            localStorageGetItem(LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY) ===
              'true',
          );
        });

        store = new Store(bridge, {
          isProfiling,
          supportsReloadAndProfile: isChrome,
          supportsProfiling,
          supportsTraceUpdates: true,
        });
        store.profilerStore.profilingData = profilingData;

        // Initialize the backend only once the Store has been initialized.
        // Otherwise the Store may miss important initial tree op codes.
        chrome.devtools.inspectedWindow.eval(
          `window.postMessage({ source: 'react-devtools-inject-backend' }, '*');`,
          function(response, evalError) {
            if (evalError) {
              console.error(evalError);
            }
          },
        );

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

        root = createRoot(document.createElement('div'));

        render = (overrideTab = mostRecentOverrideTab) => {
          mostRecentOverrideTab = overrideTab;

          root.render(
            createElement(DevTools, {
              bridge,
              browserTheme: getBrowserTheme(),
              componentsPortalContainer,
              enabledInspectedElementContextMenu: true,
              overrideTab,
              profilerPortalContainer,
              showTabBar: false,
              store,
              warnIfUnsupportedVersionDetected: true,
              viewAttributeSourceFunction,
              viewElementSourceFunction,
            }),
          );
        };

        render();
      }

      cloneStyleTags = () => {
        const linkTags = [];
        // eslint-disable-next-line no-for-of-loops/no-for-of-loops
        for (const linkTag of document.getElementsByTagName('link')) {
          if (linkTag.rel === 'stylesheet') {
            const newLinkTag = document.createElement('link');
            // eslint-disable-next-line no-for-of-loops/no-for-of-loops
            for (const attribute of linkTag.attributes) {
              newLinkTag.setAttribute(attribute.nodeName, attribute.nodeValue);
            }
            linkTags.push(newLinkTag);
          }
        }
        return linkTags;
      };

      initBridgeAndStore();

      function ensureInitialHTMLIsCleared(container) {
        if (container._hasInitialHTMLBeenCleared) {
          return;
        }
        container.innerHTML = '';
        container._hasInitialHTMLBeenCleared = true;
      }

      function setBrowserSelectionFromReact() {
        // This is currently only called on demand when you press "view DOM".
        // In the future, if Chrome adds an inspect() that doesn't switch tabs,
        // we could make this happen automatically when you select another component.
        chrome.devtools.inspectedWindow.eval(
          '(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 !== $0) ?' +
            '(inspect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0), true) :' +
            'false',
          (didSelectionChange, evalError) => {
            if (evalError) {
              console.error(evalError);
            }
          },
        );
      }

      function setReactSelectionFromBrowser() {
        // When the user chooses a different node in the browser Elements tab,
        // copy it over to the hook object so that we can sync the selection.
        chrome.devtools.inspectedWindow.eval(
          '(window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 !== $0) ?' +
            '(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = $0, true) :' +
            'false',
          (didSelectionChange, evalError) => {
            if (evalError) {
              console.error(evalError);
            } else if (didSelectionChange) {
              // Remember to sync the selection next time we show Components tab.
              needsToSyncElementSelection = true;
            }
          },
        );
      }

      setReactSelectionFromBrowser();
      chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
        setReactSelectionFromBrowser();
      });

      let currentPanel = null;
      let needsToSyncElementSelection = false;

      chrome.devtools.panels.create(
        isChrome ? '⚛ Components' : 'Components',
        '',
        'panel.html',
        extensionPanel => {
          extensionPanel.onShown.addListener(panel => {
            if (needsToSyncElementSelection) {
              needsToSyncElementSelection = false;
              bridge.send('syncSelectionFromNativeElementsPanel');
            }

            if (currentPanel === panel) {
              return;
            }

            currentPanel = panel;
            componentsPortalContainer = panel.container;

            if (componentsPortalContainer != null) {
              ensureInitialHTMLIsCleared(componentsPortalContainer);
              render('components');
              panel.injectStyles(cloneStyleTags);
            }
          });
          extensionPanel.onHidden.addListener(panel => {
            // TODO: Stop highlighting and stuff.
          });
        },
      );

      chrome.devtools.panels.create(
        isChrome ? '⚛ Profiler' : 'Profiler',
        '',
        'panel.html',
        extensionPanel => {
          extensionPanel.onShown.addListener(panel => {
            if (currentPanel === panel) {
              return;
            }

            currentPanel = panel;
            profilerPortalContainer = panel.container;

            if (profilerPortalContainer != null) {
              ensureInitialHTMLIsCleared(profilerPortalContainer);
              render('profiler');
              panel.injectStyles(cloneStyleTags);
            }
          });
        },
      );

      chrome.devtools.network.onNavigated.removeListener(checkPageForReact);

      // Re-initialize DevTools panel when a new page is loaded.
      chrome.devtools.network.onNavigated.addListener(function onNavigated() {
        // Re-initialize saved filters on navigation,
        // since global values stored on window get reset in this case.
        syncSavedPreferences();

        // It's easiest to recreate the DevTools panel (to clean up potential stale state).
        // We can revisit this in the future as a small optimization.
        flushSync(() => root.unmount());

        initBridgeAndStore();
      });
    },
  );
}

// Load (or reload) the DevTools extension when the user navigates to a new page.
function checkPageForReact() {
  syncSavedPreferences();
  createPanelIfReactLoaded();
}

chrome.devtools.network.onNavigated.addListener(checkPageForReact);

// Check to see if React has loaded once per second in case React is added
// after page load
const loadCheckInterval = setInterval(function() {
  createPanelIfReactLoaded();
}, 1000);

createPanelIfReactLoaded();
