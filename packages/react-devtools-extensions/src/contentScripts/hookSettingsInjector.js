/* global chrome */
/** @flow */

// We can't use chrome.storage domain from scripts which are injected in ExecutionWorld.MAIN
// This is the only purpose of this script - to send persisted settings to installHook.js content script

import type {UnknownMessageEvent} from './messages';
import type {DevToolsHookSettings} from 'react-devtools-shared/src/backend/types';
import {postMessage} from './messages';

async function messageListener(event: UnknownMessageEvent) {
  if (event.source !== window) {
    return;
  }

  if (event.data.source === 'react-devtools-hook-installer') {
    if (event.data.payload.handshake) {
      const settings: Partial<DevToolsHookSettings> =
        await chrome.storage.local.get();
      // If storage was empty (first installation), define default settings
      const hookSettings: DevToolsHookSettings = {
        appendComponentStack:
          typeof settings.appendComponentStack === 'boolean'
            ? settings.appendComponentStack
            : true,
        breakOnConsoleErrors:
          typeof settings.breakOnConsoleErrors === 'boolean'
            ? settings.breakOnConsoleErrors
            : false,
        showInlineWarningsAndErrors:
          typeof settings.showInlineWarningsAndErrors === 'boolean'
            ? settings.showInlineWarningsAndErrors
            : true,
        hideConsoleLogsInStrictMode:
          typeof settings.hideConsoleLogsInStrictMode === 'boolean'
            ? settings.hideConsoleLogsInStrictMode
            : false,
        disableSecondConsoleLogDimmingInStrictMode:
          typeof settings.disableSecondConsoleLogDimmingInStrictMode ===
          'boolean'
            ? settings.disableSecondConsoleLogDimmingInStrictMode
            : false,
      };

      postMessage({
        source: 'react-devtools-hook-settings-injector',
        payload: {settings: hookSettings},
      });

      window.removeEventListener('message', messageListener);
    }
  }
}

window.addEventListener('message', messageListener);
postMessage({
  source: 'react-devtools-hook-settings-injector',
  payload: {handshake: true},
});
