/* global chrome */

const IS_CHROME = navigator.userAgent.indexOf('Firefox') < 0;

export function createViewElementSource(bridge: Bridge, store: Store) {
  return function viewElementSource(id) {
    const rendererID = store.getRendererIDForElement(id);
    if (rendererID != null) {
      // Ask the renderer interface to determine the component function,
      // and store it as a global variable on the window
      bridge.send('viewElementSource', { id, rendererID });

      setTimeout(() => {
        // Ask Chrome to display the location of the component function,
        // assuming the renderer found one.
        chrome.devtools.inspectedWindow.eval(`
          if (window.$type != null) {
            inspect(window.$type);
          }
        `);
      }, 100);
    }
  };
}

export function getBrowserName() {
  return IS_CHROME ? 'Chrome' : 'Firefox';
}

export function getBrowserTheme() {
  if (IS_CHROME) {
    // chrome.devtools.panels added in Chrome 18.
    // chrome.devtools.panels.themeName added in Chrome 54.
    return chrome.devtools.panels.themeName === 'dark' ? 'dark' : 'light';
  } else {
    // chrome.devtools.panels.themeName added in Firefox 55.
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/devtools.panels/themeName
    if (chrome.devtools && chrome.devtools.panels) {
      switch (chrome.devtools.panels.themeName) {
        case 'dark':
          return 'dark';
        default:
          return 'light';
      }
    }
  }
}
