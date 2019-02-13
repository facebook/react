/* global chrome */

import { createElement } from 'react';
import { createRoot, flushSync } from 'react-dom';
import Bridge from 'src/bridge';
import DevTools from 'src/devtools/views/DevTools';
import inject from './inject';

const IS_CHROME = navigator.userAgent.indexOf('Firefox') < 0;

let browserName;
let themeName;

if (IS_CHROME) {
  browserName = 'Chrome';

  // chrome.devtools.panels added in Chrome 18.
  // chrome.devtools.panels.themeName added in Chrome 54.
  themeName = chrome.devtools.panels.themeName === 'dark' ? 'dark' : 'light';
} else {
  browserName = 'Firefox';

  // chrome.devtools.panels.themeName added in Firefox 55.
  // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/devtools.panels/themeName
  if (chrome.devtools && chrome.devtools.panels) {
    switch (chrome.devtools.panels.themeName) {
      case 'dark':
        themeName = 'dark';
        break;
      default:
        themeName = 'light';
        break;
    }
  }
}

const container = ((document.getElementById('container'): any): HTMLElement);

function injectAndInit() {
  let disconnected = false;

  const port = chrome.runtime.connect({
    name: '' + chrome.devtools.inspectedWindow.tabId,
  });
  port.onDisconnect.addListener(() => {
    disconnected = true;
  });

  const bridge = new Bridge({
    listen(fn) {
      port.onMessage.addListener(message => fn(message));
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      if (disconnected) {
        return;
      }
      port.postMessage({ event, payload }, transferable);
    },
  });

  // Clear the "React not found" initial message before rendering.
  container.innerHTML = '';

  const root = createRoot(container);
  root.render(
    createElement(DevTools, {
      bridge,
      browserName,
      browserTheme: themeName,
      showTabBar: false,
    })
  );

  // Initialize the backend only once the DevTools frontend Store has been initialized.
  // Otherwise the Store may miss important initial tree op codes.
  inject(chrome.runtime.getURL('build/backend.js'));

  // Reload the DevTools extension when the user navigates to a new page.
  function onNavigated() {
    chrome.devtools.network.onNavigated.removeListener(onNavigated);

    bridge.send('shutdown');

    flushSync(() => root.unmount(injectAndInit));
  }
  chrome.devtools.network.onNavigated.addListener(onNavigated);
}

injectAndInit();
