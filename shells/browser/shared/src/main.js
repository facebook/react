/* global chrome */

import { createElement } from 'react';
import { unstable_createRoot as createRoot, flushSync } from 'react-dom';
import Bridge from 'src/bridge';
import Store from 'src/devtools/store';
import inject from './inject';
import {
  createViewElementSource,
  getBrowserName,
  getBrowserTheme,
} from './utils';
import { getSavedComponentFilters } from 'src/utils';
import DevTools from 'src/devtools/views/DevTools';

const LOCAL_STORAGE_SUPPORTS_PROFILING_KEY =
  'React::DevTools::supportsProfiling';

let panelCreated = false;

// The renderer interface can't read saved component filters directly,
// because they are stored in localStorage within the context of the extension.
// Instead it relies on the extension to pass filters through.
function initializeSavedComponentFilters() {
  const componentFilters = getSavedComponentFilters();
  chrome.devtools.inspectedWindow.eval(
    `window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = ${JSON.stringify(
      componentFilters
    )};`
  );
}

initializeSavedComponentFilters();

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
      let settingsPortalContainer = null;

      let cloneStyleTags = null;
      let mostRecentOverrideTab = null;
      let render = null;
      let root = null;

      function initBridgeAndStore() {
        const port = chrome.runtime.connect({
          name: '' + chrome.devtools.inspectedWindow.tabId,
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
            port.postMessage({ event, payload }, transferable);
          },
        });
        bridge.addListener('reloadAppForProfiling', () => {
          localStorage.setItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY, 'true');
          chrome.devtools.inspectedWindow.eval('window.location.reload();');
        });
        bridge.addListener('captureScreenshot', ({ commitIndex, rootID }) => {
          chrome.runtime.sendMessage(
            {
              captureScreenshot: true,
              commitIndex,
              rootID,
            },
            response => bridge.send('screenshotCaptured', response)
          );
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
          localStorage.getItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY) === 'true'
        ) {
          supportsProfiling = true;
          isProfiling = true;
          localStorage.removeItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY);
        }

        const browserName = getBrowserName();

        store = new Store(bridge, {
          isProfiling,
          supportsCaptureScreenshots: true,
          supportsReloadAndProfile: true,
          supportsProfiling,
        });
        store.profilerStore.profilingData = profilingData;

        // Initialize the backend only once the Store has been initialized.
        // Otherwise the Store may miss important initial tree op codes.
        inject(chrome.runtime.getURL('build/backend.js'));

        const viewElementSource = createViewElementSource(bridge, store);

        root = createRoot(document.createElement('div'));

        render = (overrideTab = mostRecentOverrideTab) => {
          mostRecentOverrideTab = overrideTab;

          root.render(
            createElement(DevTools, {
              bridge,
              browserName,
              browserTheme: getBrowserTheme(),
              componentsPortalContainer,
              overrideTab,
              profilerPortalContainer,
              settingsPortalContainer,
              showTabBar: false,
              store,
              viewElementSource,
            })
          );
        };

        render();
      }

      cloneStyleTags = () => {
        const linkTags = [];
        for (let linkTag of document.getElementsByTagName('link')) {
          if (linkTag.rel === 'stylesheet') {
            const newLinkTag = document.createElement('link');
            for (let attribute of linkTag.attributes) {
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
          (didSelectionChange, error) => {
            if (error) {
              console.error(error);
            }
          }
        );
      }

      function setReactSelectionFromBrowser() {
        // When the user chooses a different node in the browser Elements tab,
        // copy it over to the hook object so that we can sync the selection.
        chrome.devtools.inspectedWindow.eval(
          '(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 !== $0) ?' +
            '(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = $0, true) :' +
            'false',
          (didSelectionChange, error) => {
            if (error) {
              console.error(error);
            } else if (didSelectionChange) {
              // Remember to sync the selection next time we show Components tab.
              needsToSyncElementSelection = true;
            }
          }
        );
      }

      setReactSelectionFromBrowser();
      chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
        setReactSelectionFromBrowser();
      });

      let currentPanel = null;
      let needsToSyncElementSelection = false;

      chrome.devtools.panels.create('⚛ Components', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
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
        panel.onHidden.addListener(() => {
          // TODO: Stop highlighting and stuff.
        });
      });

      chrome.devtools.panels.create('⚛ Profiler', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
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
      });

      chrome.devtools.panels.create('⚛ Settings', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
          if (currentPanel === panel) {
            return;
          }

          currentPanel = panel;
          settingsPortalContainer = panel.container;

          if (settingsPortalContainer != null) {
            ensureInitialHTMLIsCleared(settingsPortalContainer);
            render('settings');
            panel.injectStyles(cloneStyleTags);
          }
        });
      });

      chrome.devtools.network.onNavigated.removeListener(checkPageForReact);

      // Shutdown bridge before a new page is loaded.
      chrome.webNavigation.onBeforeNavigate.addListener(
        function onBeforeNavigate(details) {
          // `bridge.shutdown()` will remove all listeners we added, so we don't have to.
          bridge.shutdown();

          profilingData = store.profilerStore.profilingData;
        }
      );

      // Re-initialize DevTools panel when a new page is loaded.
      chrome.devtools.network.onNavigated.addListener(function onNavigated() {
        // Re-initialize saved filters on navigation,
        // since global values stored on window get reset in this case.
        initializeSavedComponentFilters();

        // It's easiest to recreate the DevTools panel (to clean up potential stale state).
        // We can revisit this in the future as a small optimization.
        flushSync(() => {
          root.unmount(() => {
            initBridgeAndStore();
          });
        });
      });
    }
  );
}

// Load (or reload) the DevTools extension when the user navigates to a new page.
function checkPageForReact() {
  initializeSavedComponentFilters();
  createPanelIfReactLoaded();
}

chrome.devtools.network.onNavigated.addListener(checkPageForReact);

// Check to see if React has loaded once per second in case React is added
// after page load
const loadCheckInterval = setInterval(function() {
  createPanelIfReactLoaded();
}, 1000);

createPanelIfReactLoaded();
