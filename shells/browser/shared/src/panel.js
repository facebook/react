/* global chrome */

import { createElement } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import Bridge from 'src/bridge';
import Elements from 'src/devtools/views/Elements';
import inject from './inject';

const IS_CHROME = navigator.userAgent.indexOf('Firefox') < 0;

let browserName;
let themeName;

if (IS_CHROME) {
  browserName = 'Chrome';

  // chrome.devtools.panels added in Chrome 18.
  // chrome.devtools.panels.themeName added in Chrome 54.
  themeName = chrome.devtools.panels.themeName === 'dark' ? 'Dark' : 'Default';
} else {
  browserName = 'Firefox';

  // chrome.devtools.panels.themeName added in Firefox 55.
  // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/devtools.panels/themeName
  if (chrome.devtools && chrome.devtools.panels) {
    switch (chrome.devtools.panels.themeName) {
      case 'dark':
        themeName = 'Dark';
        break;
      default:
        themeName = 'Light';
        break;
    }
  }
}

const node = ((document.getElementById('container'): any): HTMLElement);

function reloadDevTools() {
  setTimeout(() => {
    unmountComponentAtNode(node);

    node.innerHTML = '';

    injectAndInit();
  }, 100);
}

function injectAndInit() {
  inject(chrome.runtime.getURL('build/backend.js'), () => {
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

    // Reload the DevTools extension when the user navigates to a new page.
    function onNavigated() {
      chrome.devtools.network.onNavigated.removeListener(onNavigated);
      bridge.send('shutdown');
      reloadDevTools();
    }
    chrome.devtools.network.onNavigated.addListener(onNavigated);

    render(
      createElement(Elements, {
        bridge,
        browserName,
        themeName,
      }),
      node
    );
  });
}

injectAndInit();
