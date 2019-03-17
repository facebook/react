/* global chrome */

import { createElement } from 'react';
import { unstable_createRoot as createRoot } from 'react-dom';
import Bridge from 'src/bridge';
import Store from 'src/devtools/Store';
import inject from './inject';
import {
  createViewElementSource,
  getBrowserName,
  getBrowserTheme,
} from './utils';
import DevTools from 'src/devtools/views/DevTools';

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

      let renderRootToPortal = null;
      let bridge = null;
      let store = null;
      let elementsPanel = null;
      let profilerPanel = null;
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

        const viewElementSource = createViewElementSource(bridge, store);

        const container = document.createElement('div');
        const root = createRoot(container);

        renderRootToPortal = ({ overrideTab, portalContainer }) => {
          root.render(
            createElement(DevTools, {
              bridge,
              browserName: getBrowserName(),
              browserTheme: getBrowserTheme(),
              overrideTab,
              portalContainer,
              showTabBar: false,
              store,
              viewElementSource,
            })
          );

          const oldLinkTags = document.getElementsByTagName('link');
          const newLinkTags = [];
          for (let oldLinkTag of oldLinkTags) {
            if (oldLinkTag.rel === 'stylesheet') {
              const newLinkTag = document.createElement('link');
              for (let attribute of oldLinkTag.attributes) {
                newLinkTag.setAttribute(
                  attribute.nodeName,
                  attribute.nodeValue
                );
              }
              newLinkTags.push(newLinkTag);
            }
          }

          return newLinkTags;
        };

        if (elementsPanel !== null) {
          elementsPanel.render(renderRootToPortal, 'elements');
        }
      }

      initBridgeAndStore();

      chrome.devtools.panels.create('⚛ Elements', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
          elementsPanel = panel;

          if (renderRootToPortal !== null) {
            elementsPanel.render(renderRootToPortal, 'elements');
          }

          // TODO: When the user switches to the panel, check for an Elements tab selection.
        });
        panel.onHidden.addListener(() => {
          // TODO: Stop highlighting and stuff.
        });
      });

      // TODO (profiling) Is there a way to detect profiling support and conditionally register this panel?
      chrome.devtools.panels.create('⚛ Profiler', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
          profilerPanel = panel;

          if (renderRootToPortal !== null) {
            profilerPanel.render(renderRootToPortal, 'profiler');
          }
        });
      });

      chrome.devtools.panels.create('⚛ Settings', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
          settingsPanel = panel;

          if (renderRootToPortal !== null) {
            settingsPanel.render(renderRootToPortal, 'settings');
          }
        });
      });

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
