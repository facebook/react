/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Builds the context-menus
 *
 * @providesModule context-menus
 * @format
 */

'use strict';

getSettings().then(settings => {
  if (settings.enableDefangCopyContextMenu) {
    chrome.contextMenus.create({
      title: 'De-fang Copy',
      id: 'defangCopy',
      contexts: ['selection'],
    });
  }
});

chrome.contextMenus.create({
  title: 'Report page as phishing',
  id: 'reportPhishSite',
  contexts: ['browser_action'],
});
