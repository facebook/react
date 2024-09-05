/* global chrome */

export function setBrowserSelectionFromReact() {
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

export function setReactSelectionFromBrowser(bridge) {
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
        if (!bridge) {
          console.error(
            'Browser element selection changed, but bridge was not initialized',
          );
          return;
        }

        // Remember to sync the selection next time we show Components tab.
        bridge.send('syncSelectionFromBuiltinElementsPanel');
      }
    },
  );
}
