/* global chrome */

'use strict';

function setExtensionIconAndPopup(reactBuildType, tabId) {
  chrome.action.setIcon({
    tabId,
    path: {
      '16': chrome.runtime.getURL(`icons/16-${reactBuildType}.png`),
      '32': chrome.runtime.getURL(`icons/32-${reactBuildType}.png`),
      '48': chrome.runtime.getURL(`icons/48-${reactBuildType}.png`),
      '128': chrome.runtime.getURL(`icons/128-${reactBuildType}.png`),
    },
  });

  chrome.action.setPopup({
    tabId,
    popup: chrome.runtime.getURL(`popups/${reactBuildType}.html`),
  });
}

export default setExtensionIconAndPopup;
