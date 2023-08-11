/* global chrome */

'use strict';

import {IS_FIREFOX} from 'react-devtools-extensions/src/utils';

function setExtensionIconAndPopup(reactBuildType, tabId) {
  const action = IS_FIREFOX ? chrome.browserAction : chrome.action;

  action.setIcon({
    tabId,
    path: {
      '16': chrome.runtime.getURL(`icons/16-${reactBuildType}.png`),
      '32': chrome.runtime.getURL(`icons/32-${reactBuildType}.png`),
      '48': chrome.runtime.getURL(`icons/48-${reactBuildType}.png`),
      '128': chrome.runtime.getURL(`icons/128-${reactBuildType}.png`),
    },
  });

  action.setPopup({
    tabId,
    popup: chrome.runtime.getURL(`popups/${reactBuildType}.html`),
  });
}

export default setExtensionIconAndPopup;
