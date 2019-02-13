/* global chrome */

import { createElement } from 'react';
import { createRoot, flushSync } from 'react-dom';
import Bridge from 'src/bridge';
import DevTools from 'src/devtools/views/DevTools';
import inject from './inject';
import { getBrowserName, getBrowserTheme } from './utils';

const container = ((document.getElementById('container'): any): HTMLElement);

function injectAndInit() {
  // Noop Bridge for the Settings panel
  const bridge = new Bridge({
    listen(fn) {},
    send(event: string, payload: any, transferable?: Array<any>) {},
  });

  // Clear the "React not found" initial message before rendering.
  container.innerHTML = '';

  const root = createRoot(container);
  root.render(
    createElement(DevTools, {
      bridge,
      browserName: getBrowserName(),
      browserTheme: getBrowserTheme(),
      defaultTab: 'settings',
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
