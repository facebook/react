/* global chrome */

import { createElement } from 'react';
import { render } from 'react-dom';
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
    send(data) {
      if (disconnected) {
        return;
      }
      port.postMessage(data);
    },
  });

  render(createElement(Elements, { bridge, browserName, themeName }), node);
});
