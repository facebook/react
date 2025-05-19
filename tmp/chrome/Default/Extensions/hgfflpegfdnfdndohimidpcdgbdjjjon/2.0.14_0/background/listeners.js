/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule listeners
 * @format
 */

'use strict';

/**
 * Mapping of the action attribute in messages to the appropriate handler.
 *
 * @type {{eventName: function}}
 */
var listenerActionMap = {};
listenerActionMap[ACTION.keypress] = onKeypress;
listenerActionMap[ACTION.keydown] = onKeydown;
// yes, we treat these two things the same way
listenerActionMap[ACTION.loginAttempted] = onLoginAttempt;
listenerActionMap[ACTION.changePassword] = onLoginAttempt;

listenerActionMap[ACTION.credentialFormStatus] = onCredentialFormStatus;
listenerActionMap[ACTION.updatePasswordLengths] = onUpdatePasswordLengths;

listenerActionMap[ACTION.pastebinPaste] = onPastebinPaste;

listenerActionMap[ACTION.deleteCookies] = onDeleteCookies;
listenerActionMap[ACTION.refreshOptionsParams] = onrefreshOptionsParams;
listenerActionMap[ACTION.openOptionsPage] = onOpenOptionsPage;
listenerActionMap[ACTION.cancelDownload] = onCancelDownload;
listenerActionMap[ACTION.resumeDownload] = onResumeDownload;
listenerActionMap[ACTION.sendLog] = onSendLog;
// Xerox module
listenerActionMap[ACTION.xeroxCopy] = xCopyEvent;
listenerActionMap[ACTION.xeroxPaste] = xPasteEvent;

/**
 * Delegates keystrokes to a PageState instance.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onKeypress(message, sender, sendResponse) {
  var pageState = pages[sender.tab.id];
  pageState.type(message.keypress, 'keypress');
}

/**
 * Delegates keydown to a PageState instance.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onKeydown(message, sender, sendResponse) {
  var pageState = pages[sender.tab.id];
  pageState.type(message.keydown, 'keydown');
}

/**
 * Records credential add/change attempt.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onLoginAttempt(message, sender, sendResponse) {
  const salt = genSalt();
  hashPassword(message.password, salt).then(function(trimmedHash) {
    debugLog('Storing attempt hash ' + trimmedHash + ' for ' + message.user);
    let attempt = {
      site: message.site,
      user: message.user,
      hash: trimmedHash,
      length: message.password.length,
      salt: salt,
    };

    // add new attempt
    new Promise(function(resolve, reject) {
      chrome.storage.local.get('hashAttempts', resolve);
    }).then(function(data) {
      let hashAttempts = data['hashAttempts'] || {};
      hashAttempts[sender.tab.id] = attempt;
      chrome.storage.local.set({hashAttempts: hashAttempts});
    });
  });
}

/**
 * Records or clears a credential add/change attempt.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onCredentialFormStatus(message, sender, sendResponse) {
  debugLog(message);
  const tabId = sender.tab.id;
  if (message.found) {
    // If there was a login attempt on the last page, it was unsuccessful
    // because the tab navigated back to the login page again and we see the
    // form.
    clearLastAttempt(tabId);
  } else {
    // If the form isn't found, then it's probably successful!
    commitLastAttempt(tabId);
    sendResponse({action: ACTION.monitorKeyEvents});
  }
}

/**
 * Adds/Removes password lengths to the passwordLengths set
 *
 * @param {Object} message
 */
function onUpdatePasswordLengths(message, sender, sendResponse) {
  var i = new Promise(function(resolve) {
    if (message.operation === 'add') {
      passwordLengths.add(message.passwordLength);
    } else if (message.operation === 'clear') {
      passwordLengths.clear();
      maxPasswordLength = -1;
      minPasswordLength = Number.MAX_SAFE_INTEGER;
    } else {
      passwordLengths.delete(message.passwordLength);
    }
    resolve();
  });
  i.then(function() {
    passwordLengths.forEach(function(e) {
      maxPasswordLength = Math.max(maxPasswordLength, e);
      minPasswordLength = Math.min(minPasswordLength, e);
    });
  });
}

/**
 * Fires warning on Pastebin Paste.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onPastebinPaste(message, sender, sendResponse) {
  displayPastebinWarning(message.site, sender.tab.id);
  sendLog(
    'PROTEGO_PASTEBIN',
    {
      action: 'pb_paste',
      target: sender.url,
    },
    protegoVersion,
  );
}

/**
 * Fires warning on call for deleteCookies.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onDeleteCookies(message, sender, sendResponse) {
  deleteSiteCookies();
}

function onrefreshOptionsParams(message, sender, sendResponse) {
  getOptionsData().then(optionsJSON => {
    let optionsJSONString = JSON.stringify(optionsJSON);
    let url = OPTIONS_URL + '?data=' + encodeURIComponent(optionsJSONString);
    let response = sendResponse({action: ACTION.refreshOptionsPage, url: url});
  });
}

function onOpenOptionsPage(message, sender, sendResponse) {
  getOptionsData().then(optionsJSON => {
    let optionsJSONString = JSON.stringify(optionsJSON);
    let url = OPTIONS_URL + '?data=' + encodeURIComponent(optionsJSONString);
    window.open(url);
  });
}

function onCancelDownload(message, sender, sendResponse) {
  chrome.downloads.search(
    {
      id: message.downloadItemId,
      limit: 1,
    },
    downloadItem => {
      if (downloadItem[0].paused && downloadItem[0].state === 'in_progress') {
        chrome.downloads.cancel(message.downloadItemId, () => {
          sendLog(
            'PROTEGO_DOWNLOADS',
            prepareDownloadItem('dl_cancel', downloadItem[0]),
            protegoVersion,
          );
        });
      } else if (downloadItem[0].state === 'complete') {
        chrome.downloads.removeFile(message.downloadItemId, () => {
          sendLog(
            'PROTEGO_DOWNLOADS',
            prepareDownloadItem('dl_remove', downloadItem[0]),
            protegoVersion,
          );
        });
      }
    },
  );
}

function onResumeDownload(message, sender, sendResponse) {
  chrome.downloads.search(
    {
      id: message.downloadItemId,
      limit: 1,
    },
    downloadItem => {
      chrome.downloads.resume(message.downloadItemId, () => {
        sendLog(
          'PROTEGO_DOWNLOADS',
          prepareDownloadItem('dl_continue', downloadItem[0]),
          protegoVersion,
        );
      });
    },
  );
}

function onSendLog(message, sender, sendResponse) {
  sendLog(message.log_type, message.logs, message.protego_version).then(() => {
    if (message.close_tab) {
      chrome.tabs.remove(sender.tab.id);
    }
  });
}

function xCopyEvent(message, sender, sendResponse) {
  xeroxCopyEvent(message.url, message.data);
}

function xPasteEvent(message, sender, sendResponse) {
  xeroxPasteEvent(message.url, message.data);
}

function onInstalledExtension(extension) {
  sendLog(
    'PROTEGO_CHROME_EXTENSIONS',
    prepareExtensionItem('ext_installed', extension),
    protegoVersion,
  );
}

function onUninstalledExtension(ext_id) {
  sendLog(
    'PROTEGO_CHROME_EXTENSIONS',
    {
      action: 'ext_uninstalled',
      id: ext_id,
    },
    protegoVersion,
  );
}

function onEnabledExtension(extension) {
  sendLog(
    'PROTEGO_CHROME_EXTENSIONS',
    prepareExtensionItem('ext_enabled', extension),
    protegoVersion,
  );
}

function onDisabledExtension(extension) {
  sendLog(
    'PROTEGO_CHROME_EXTENSIONS',
    prepareExtensionItem('ext_disabled', extension),
    protegoVersion,
  );
}

function onWebRequest(request) {
  if (request.initiator === 'chrome-extension://' + chrome.runtime.id) {
    return;
  }
  requestCache.push(request);
  if (requestCache.length >= WEB_REQUEST_MAX_BATCH) {
    sendBatchedWebRequestLogs();
  }
  if (requestTimer !== null) {
    clearTimeout(requestTimer);
  }
  requestTimer = setTimeout(
    sendBatchedWebRequestLogs,
    WEB_REQUEST_BATCH_TIMEOUT,
  );
}

function sendBatchedWebRequestLogs() {
  sendLog(
    'PROTEGO_WEB_REQUESTS',
    prepareWebRequests(requestCache),
    protegoVersion,
  );
  requestCache = [];
  clearTimeout(requestTimer);
  requestTimer = null;
}
