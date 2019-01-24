/* global chrome */

export default function checkForReact(done: (pageHasReact: boolean) => void) {
  chrome.devtools.inspectedWindow.eval(
    `!!(
    (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers).length) || window.React || (window.require && (require('react') || require('React')))
  )`,
    function(pageHasReact, err) {
      done(pageHasReact);
    }
  );
}
