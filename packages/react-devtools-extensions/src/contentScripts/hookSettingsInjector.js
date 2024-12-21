/* global chrome */

// We can't use chrome.storage domain from scripts which are injected in ExecutionWorld.MAIN
// This is the only purpose of this script - to send persisted settings to installHook.js content script

async function messageListener(event: MessageEvent) {
  if (event.source !== window) {
    return;
  }

  if (event.data.source === 'react-devtools-hook-installer') {
    if (event.data.payload.handshake) {
      const settings = await chrome.storage.local.get();
      // If storage was empty (first installation), define default settings
      if (typeof settings.appendComponentStack !== 'boolean') {
        settings.appendComponentStack = true;
      }
      if (typeof settings.breakOnConsoleErrors !== 'boolean') {
        settings.breakOnConsoleErrors = false;
      }
      if (typeof settings.showInlineWarningsAndErrors !== 'boolean') {
        settings.showInlineWarningsAndErrors = true;
      }
      if (typeof settings.hideConsoleLogsInStrictMode !== 'boolean') {
        settings.hideConsoleLogsInStrictMode = false;
      }

      window.postMessage({
        source: 'react-devtools-hook-settings-injector',
        payload: {settings},
      });

      window.removeEventListener('message', messageListener);
    }
  }
}

window.addEventListener('message', messageListener);
window.postMessage({
  source: 'react-devtools-hook-settings-injector',
  payload: {handshake: true},
});
