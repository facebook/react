/* global chrome */

// Firefox doesn't support ExecutionWorld.MAIN yet
// equivalent logic for Firefox is in prepareInjection.js
const contentScriptsToInject = __IS_FIREFOX__
  ? [
      {
        id: '@react-devtools/proxy',
        js: ['build/proxy.js'],
        matches: ['<all_urls>'],
        persistAcrossSessions: true,
        runAt: 'document_end',
      },
      {
        id: '@react-devtools/file-fetcher',
        js: ['build/fileFetcher.js'],
        matches: ['<all_urls>'],
        persistAcrossSessions: true,
        runAt: 'document_end',
      },
    ]
  : [
      {
        id: '@react-devtools/proxy',
        js: ['build/proxy.js'],
        matches: ['<all_urls>'],
        persistAcrossSessions: true,
        runAt: 'document_end',
        world: chrome.scripting.ExecutionWorld.ISOLATED,
      },
      {
        id: '@react-devtools/file-fetcher',
        js: ['build/fileFetcher.js'],
        matches: ['<all_urls>'],
        persistAcrossSessions: true,
        runAt: 'document_end',
        world: chrome.scripting.ExecutionWorld.ISOLATED,
      },
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

async function dynamicallyInjectContentScripts() {
  try {
    // Using this, instead of filtering registered scrips with `chrome.scripting.getRegisteredScripts`
    // because of https://bugs.chromium.org/p/chromium/issues/detail?id=1393762
    // This fixes registering proxy content script in incognito mode
    await chrome.scripting.unregisterContentScripts();

    // equivalent logic for Firefox is in prepareInjection.js
    // Manifest V3 method of injecting content script
    // TODO(hoxyq): migrate Firefox to V3 manifests
    // Note: the "world" option in registerContentScripts is only available in Chrome v102+
    // It's critical since it allows us to directly run scripts on the "main" world on the page
    // "document_start" allows it to run before the page's scripts
    // so the hook can be detected by react reconciler
    await chrome.scripting.registerContentScripts(contentScriptsToInject);
  } catch (error) {
    console.error(error);
  }
}

dynamicallyInjectContentScripts();
