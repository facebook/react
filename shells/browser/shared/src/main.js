/* global chrome */

let panelCreated = false;

function createPanelIfReactLoaded() {
  if (panelCreated) {
    return;
  }
  chrome.devtools.inspectedWindow.eval(
    'window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers).length > 0',
    function(pageHasReact, err) {
      if (!pageHasReact || panelCreated) {
        return;
      }

      clearInterval(loadCheckInterval);
      panelCreated = true;
      chrome.devtools.panels.create('React', '', 'panel.html', function(panel) {
        panel.onShown.addListener(function(window) {
          // TODO: When the user switches to the panel, check for an Elements tab selection.
        });
        panel.onHidden.addListener(function() {
          // TODO: Stop highlighting and stuff.
        });
      });
    }
  );
}

chrome.devtools.network.onNavigated.addListener(function() {
  createPanelIfReactLoaded();
});

// Check to see if React has loaded once per second in case React is added
// after page load
const loadCheckInterval = setInterval(function() {
  createPanelIfReactLoaded();
}, 1000);

createPanelIfReactLoaded();
