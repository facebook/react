/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Download Policies
 *
 * @providesModule download_policies_helpes
 * @format
 */

'use strict';

var downloadPolicies = [];
var downloadItems = {};

// for unit tests
function setDownloadPolicies(policies) {
  downloadPolicies = policies;
}

function checkForBase64(url) {
   return url.startsWith('data:');
}

const evaluateDownloadPolicies = downloadItem => {

  // exclude base64-encoded images from checking
  // https://fb.workplace.com/groups/blackbird/posts/25509210055367602/?comment_id=25608197195468887&reply_comment_id=25608481065440500
  if (checkForBase64(downloadItem.finalUrl)) {
    return
  }

  let results = {
    downloadItem: downloadItem,
    isBlocked: false,
  };
  results.downloadItem.trippedPolicies = {};
  for (var key in downloadPolicies) {
    if (downloadPolicies[key].check(downloadItem)) {
      results.downloadItem.trippedPolicies[downloadPolicies[key].name] =
        downloadPolicies[key].desc;
      results.isBlocked = true;
    }
  }
  let isBlocked =
    Object.keys(results.downloadItem.trippedPolicies).length !== 0;
  if (isBlocked) {
    if (downloadItem.state === 'in_progress') {
      chrome.downloads.pause(downloadItem.id, () => {
        if (chrome.runtime.lastError) {
          debugLog(chrome.runtime.lastError);
        }
      });
    }
    isWarningBeingDisplayed = true;
    displayDownloadWarning(results.downloadItem);
  }
};

function addNewDownloadItem(downloadItem) {
  downloadItems[downloadItem.id] = downloadItem;
}

function updateDownloadItem(delta) {
  var tempDownloadItem = downloadItems[delta.id] || {};
  for (var key in delta) {
    if (key != 'id') {
      tempDownloadItem[key] = delta[key].current;
    }
  }
  downloadItems[delta.id] = tempDownloadItem;
}

function logDownloadItem(delta) {
  updateDownloadItem(delta);
  if (
    // only evaluate after we have named the file
    delta.hasOwnProperty('filename')
  ) {
    evaluateDownloadPolicies(downloadItems[delta.id]);
  }
  if (delta.hasOwnProperty('state')) {
    if (delta.state.current === 'complete') {
      sendLog(
        'PROTEGO_DOWNLOADS',
        prepareDownloadItem('dl_complete', downloadItems[delta.id]),
        typeof protegoVersion != 'undefined' ? protegoVersion : 'no-version',
      ).then(() => {
        delete downloadItems[delta.id];
      });
    }
  }
}

if (typeof thiIsChrome == 'undefined') {
  // we are in jest/node-js
  // require some functions what's global in Chrome
  // it is used in jest tests only, where it is mocked
  var sendLog = require('./utils').sendLog;
  var prepareDownloadItem = require('./utils').prepareDownloadItem;
  var displayDownloadWarning = require('./background-helpers').displayDownloadWarning;
  var isWarningBeingDisplayed = false;
}

module.exports = {
  addNewDownloadItem,
  logDownloadItem,
  downloadPolicies,
  downloadItems,
  setDownloadPolicies,
};
