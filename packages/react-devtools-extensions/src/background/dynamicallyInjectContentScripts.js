/* global chrome */

import {IS_FIREFOX} from '../utils';

async function dynamicallyInjectContentScripts() {
  const contentScriptsToInject = [
    {
      id: '@react-devtools/hook',
      js: ['build/installHook.js'],
      matches: ['<all_urls>'],
      persistAcrossSessions: true,
      runAt: 'document_start',
      world: chrome.scripting.ExecutionWorld.MAIN,
    },
    {
      id: '@react-devtools/renderer',
      js: ['build/renderer.js'],
      matches: ['<all_urls>'],
      persistAcrossSessions: true,
      runAt: 'document_start',
      world: chrome.scripting.ExecutionWorld.MAIN,
    },
  ];

  try {
    const alreadyRegisteredContentScripts =
      await chrome.scripting.getRegisteredContentScripts();

    const scriptsToInjectNow = contentScriptsToInject.filter(
      scriptToInject =>
        !alreadyRegisteredContentScripts.some(
          registeredScript => registeredScript.id === scriptToInject.id,
        ),
    );

    if (scriptsToInjectNow.length) {
      // equivalent logic for Firefox is in prepareInjection.js
      // Manifest V3 method of injecting content script
      // TODO(hoxyq): migrate Firefox to V3 manifests
      // Note: the "world" option in registerContentScripts is only available in Chrome v102+
      // It's critical since it allows us to directly run scripts on the "main" world on the page
      // "document_start" allows it to run before the page's scripts
      // so the hook can be detected by react reconciler
      await chrome.scripting.registerContentScripts(scriptsToInjectNow);
    }
  } catch (error) {
    console.error(error);
  }
}

if (!IS_FIREFOX) {
  dynamicallyInjectContentScripts();
}
