/* global chrome */

import { createElement } from 'react';
import { unstable_createRoot as createRoot, flushSync } from 'react-dom';
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

      let bridge = null;
      let store = null;

      let elementsPortalContainer = null;
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

        store = new Store(bridge);

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
              browserName: getBrowserName(),
              browserTheme: getBrowserTheme(),
              elementsPortalContainer,
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

      chrome.devtools.panels.create('⚛ Elements', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
          elementsPortalContainer = panel.container;
          if (elementsPortalContainer != null) {
            elementsPortalContainer.innerHTML = '';
            render('elements');
            panel.injectStyles(cloneStyleTags);
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
          profilerPortalContainer = panel.container;
          if (profilerPortalContainer != null) {
            profilerPortalContainer.innerHTML = '';
            render('profiler');
            panel.injectStyles(cloneStyleTags);
          }
        });
      });

      chrome.devtools.panels.create('⚛ Settings', '', 'panel.html', panel => {
        panel.onShown.addListener(panel => {
          settingsPortalContainer = panel.container;
          if (settingsPortalContainer != null) {
            settingsPortalContainer.innerHTML = '';
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
