/* global chrome */

import Bridge from 'src/bridge';
import Store from 'src/devtools/Store';
import inject from './inject';

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
      let elementsPanel = null;
      let settingsPanel = null;

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

        store = new Store(bridge);

        // Initialize the backend only once the Store has been initialized.
        // Otherwise the Store may miss important initial tree op codes.
        inject(chrome.runtime.getURL('build/backend.js'));

        if (elementsPanel !== null) {
          elementsPanel.injectBridgeAndStore(bridge, store);
        }
        if (settingsPanel !== null) {
          settingsPanel.injectBridgeAndStore(bridge, store);
        }
      }

      initBridgeAndStore();

      chrome.devtools.panels.create(
        '⚛ Elements',
        '',
        'elements.html',
        panel => {
          panel.onShown.addListener(panel => {
            if (elementsPanel === null) {
              panel.injectBridgeAndStore(bridge, store);
            }

            elementsPanel = panel;

            // TODO: When the user switches to the panel, check for an Elements tab selection.
          });
          panel.onHidden.addListener(() => {
            // TODO: Stop highlighting and stuff.
          });
        }
      );

      chrome.devtools.panels.create(
        '⚛ Settings',
        '',
        'settings.html',
        panel => {
          panel.onShown.addListener(panel => {
            if (settingsPanel === null) {
              panel.injectBridgeAndStore(bridge, store);
            }

            settingsPanel = panel;
          });
        }
      );

      chrome.devtools.network.onNavigated.removeListener(checkPageForReact);

      // Shutdown bridge and re-initialize DevTools panel when a new page is loaded.
      chrome.devtools.network.onNavigated.addListener(function onNavigated() {
        bridge.send('shutdown');

        initBridgeAndStore();
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
