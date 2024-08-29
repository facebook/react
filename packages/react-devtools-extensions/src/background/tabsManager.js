/* global chrome */

'use strict';

import setExtensionIconAndPopup from './setExtensionIconAndPopup';

function isRestrictedBrowserPage(url) {
  return !url || new URL(url).protocol === 'chrome:';
}

function checkAndHandleRestrictedPageIfSo(tab) {
  if (tab && isRestrictedBrowserPage(tab.url)) {
    setExtensionIconAndPopup('restricted', tab.id);
  }
}

// update popup page of any existing open tabs, if they are restricted browser pages.
// we can't update for any other types (prod,dev,outdated etc)
// as the content script needs to be injected at document_start itself for those kinds of detection
// TODO: Show a different popup page(to reload current page probably) for old tabs, opened before the extension is installed
chrome.tabs.query({}, tabs => tabs.forEach(checkAndHandleRestrictedPageIfSo));
chrome.tabs.onCreated.addListener((tabId, changeInfo, tab) =>
  checkAndHandleRestrictedPageIfSo(tab),
);

// Listen to URL changes on the active tab and update the DevTools icon.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  checkAndHandleRestrictedPageIfSo(tab);
});
