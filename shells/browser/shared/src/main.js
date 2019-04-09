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
import DevTools from 'src/devtools/views/DevTools';

const LOCAL_STORAGE_SUPPORTS_PROFILING_KEY =
  'React::DevTools::supportsProfiling';

let panelCreated = false;

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

      let componentsPortalContainer = null;
      let profilerPortalContainer = null;
      let settingsPortalContainer = null;

      let cloneStyleTags = null;
      let mostRecentOverrideTab = null;
      let render = null;
      let root = null;

      function initBridgeAndStore() {
        let hasPortBeenDisconnected = false;
        const port = chrome.runtime.connect({
          name: '' + chrome.devtools.inspectedWindow.tabId,
        });
        port.onDisconnect.addListener(() => {
          hasPortBeenDisconnected = true;
        });

        bridge = new Bridge({
          listen(fn) {
            port.onMessage.addListener(message => fn(message));
          },
          send(event: string, payload: any, transferable?: Array<any>) {
            if (!hasPortBeenDisconnected) {
              port.postMessage({ event, payload }, transferable);
            }
          },
        });
        bridge.addListener('reloadAppForProfiling', () => {
          localStorage.setItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY, 'true');
          chrome.devtools.inspectedWindow.eval('window.location.reload();');
        });
        bridge.addListener('exportFile', ({ contents, filename }) => {
          chrome.runtime.sendMessage({
            exportFile: true,
            contents,
            filename,
          });
        });
        bridge.addListener('captureScreenshot', ({ commitIndex }) => {
          chrome.runtime.sendMessage(
            {
              captureScreenshot: true,
              commitIndex,
            },
            response => bridge.send('screenshotCaptured', response)
          );
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
          supportsFileDownloads: browserName === 'Chrome',
          supportsReloadAndProfile: true,
          supportsProfiling,
        });

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

      function setReactSelectionFromBrowser() {
        // When the user chooses a different node in the browser Elements tab,
        // copy it over to the hook object so that we can sync the selection.
        chrome.devtools.inspectedWindow.eval(
          '(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = $0, undefined)',
          (_, error) => {
            if (error) {
              console.error(error);
            } else {
              bridge.send('syncSelectionFromNativeElementsPanel');
            }
          }
        );
      }

      // When the user selects another item in the native Elements tab,
      // select the corresponding React component.
      let isListeningToNativeSelectionChange = false;
      function ensureListeningToNativeSelectionChange() {
        if (isListeningToNativeSelectionChange) {
          return;
        }
        isListeningToNativeSelectionChange = true;
        setReactSelectionFromBrowser();
        chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
          setReactSelectionFromBrowser();
        });
      }

      let currentPanel = null;

      chrome.devtools.panels.create('⚛ Components', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
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

          // Don't start listening to native selection change
          // until *after* the panel is visible. Otherwise, we'll
          // set the selected element too early and won't scroll
          // to it the first time we open Components panel.
          ensureListeningToNativeSelectionChange();
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

      // Shutdown bridge and re-initialize DevTools panel when a new page is loaded.
      chrome.devtools.network.onNavigated.addListener(function onNavigated() {
        bridge.send('shutdown');

        // It's easiest to recreate the DevTools panel (to clean up potential stale state).
        // We can revisit this in the future as a small optimization.
        flushSync(() => root.unmount(initBridgeAndStore));
      });
    }
  );
}

// Load (or reload) the DevTools extension when the user navigates to a new page.
function checkPageForReact() {
  createPanelIfReactLoaded();
}

chrome.devtools.network.onNavigated.addListener(checkPageForReact);

// Check to see if React has loaded once per second in case React is added
// after page load
const loadCheckInterval = setInterval(function() {
  createPanelIfReactLoaded();
}, 1000);

createPanelIfReactLoaded();
