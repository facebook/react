/* global chrome */

const ports = {};

const IS_FIREFOX = navigator.userAgent.indexOf('Firefox') >= 0;

chrome.runtime.onConnect.addListener(function(port) {
  let tab = null;
  let name = null;
  if (isNumeric(port.name)) {
    tab = port.name;
    name = 'devtools';
    installContentScript(+port.name);
  } else {
    tab = port.sender.tab.id;
    name = 'content-script';
  }

  if (!ports[tab]) {
    ports[tab] = {
      devtools: null,
      'content-script': null,
    };
  }
  ports[tab][name] = port;

  if (ports[tab].devtools && ports[tab]['content-script']) {
    doublePipe(ports[tab].devtools, ports[tab]['content-script']);
  }
});

function isNumeric(str: string): boolean {
  return +str + '' === str;
}

function installContentScript(tabId: number) {
  chrome.tabs.executeScript(
    tabId,
    { file: '/build/contentScript.js' },
    function() {}
  );
}

function doublePipe(one, two) {
  one.onMessage.addListener(lOne);
  function lOne(message) {
    two.postMessage(message);
  }
  two.onMessage.addListener(lTwo);
  function lTwo(message) {
    one.postMessage(message);
  }
  function shutdown() {
    one.onMessage.removeListener(lOne);
    two.onMessage.removeListener(lTwo);
    one.disconnect();
    two.disconnect();
  }
  one.onDisconnect.addListener(shutdown);
  two.onDisconnect.addListener(shutdown);
}

function setIconAndPopup(reactBuildType, tabId) {
  chrome.browserAction.setIcon({
    tabId: tabId,
    path: {
      '16': 'icons/16-' + reactBuildType + '.png',
      '32': 'icons/32-' + reactBuildType + '.png',
      '48': 'icons/48-' + reactBuildType + '.png',
      '128': 'icons/128-' + reactBuildType + '.png',
    },
  });
  chrome.browserAction.setPopup({
    tabId: tabId,
    popup: 'popups/' + reactBuildType + '.html',
  });
}

// Listen to URL changes on the active tab and reset the DevTools icon.
// This prevents non-disabled icons from sticking in Firefox.
// Don't listen to this event in Chrome though.
// It fires more frequently, often after onMessage() has been called.
if (IS_FIREFOX) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.status === 'loading') {
      setIconAndPopup('disabled', tabId);
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender) => {
  if (sender.tab) {
    // This is sent from the hook content script.
    // It tells us a renderer has attached.
    if (request.hasDetectedReact) {
      // We use browserAction instead of pageAction because this lets us
      // display a custom default popup when React is *not* detected.
      // It is specified in the manifest.
      let reactBuildType = request.reactBuildType;
      if (sender.url.indexOf('facebook.github.io/react') !== -1) {
        // Cheat: We use the development version on the website because
        // it is better for interactive examples. However we're going
        // to get misguided bug reports if the extension highlights it
        // as using the dev version. We're just going to special case
        // our own documentation and cheat. It is acceptable to use dev
        // version of React in React docs, but not in any other case.
        reactBuildType = 'production';
      }

      setIconAndPopup(reactBuildType, sender.tab.id);
    }

    if (request.exportFile) {
      let { contents, filename } = request;
      if (!Array.isArray(contents)) {
        contents = [contents];
      }

      const blob = new Blob(contents, { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({ filename, saveAs: true, url });
    }
  }
});
