/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * For configured website login pages, this script forwards credentials to the
 * background script. For most pages, this file forwards keypresses for the
 * background script to check against said credentials.
 *
 * @providesModule content
 * @format
 */

'use strict';
function getOpts() {
  var url = new URL(window.location.href);
  var data = url.searchParams.get('data');
  var dataObj = JSON.parse(data);
  return dataObj;
}

/**
 * @callback EventCallback
 * @type {Event}
 */

/**
 * Initializes the page by binding the message listener.
 */
function initPage() {
  chrome.runtime.onMessage.addListener(messageListener);
}

/**
 * If it can find `formSelector` on the page, this treats the current page as a
 * login page and sends unsuccessfulLogin. Otherwise, it treats the current page
 * as a normal page and sends successfulLogin.
 *
 * @param {Element} formElement login/change password form
 * @param {EventCallback} submitListener
 */
function startCredentialListener(formElement, submitListener) {
  formElement.addEventListener('submit', submitListener, true);
}

/**
 * Generates an event listener for credential change.
 * @param {String} siteName
 * @param {String} passwordSelector
 * @returns {EventCallback}
 */
function getPasswordChangeListener(siteName, passwordSelector) {
  return function(event) {
    const pw = event.target[passwordSelector].value;
    chrome.runtime.sendMessage({
      action: ACTION.changePassword,
      site: siteName,
      password: pw,
    });
  };
}

/**
 * Generates an event listener for credential submission.
 * @param {String} siteName
 * @param {{loginUserSelector: String, loginPassSelector: String}}listenTo
 * @returns {EventCallback}
 */
function getLoginAttemptListener(siteName, listenTo) {
  const userSelector = listenTo.loginUserSelector;
  const passSelector = listenTo.loginPassSelector;
  return function(event) {
    let user = null;
    let pw = null;
    // user is set to null if it doesn't exist on the page
    // (workaround for incorrect password pages)
    if (event.target[userSelector]) {
      user = event.target[userSelector].value;
    }
    pw = event.target[passSelector].value;
    chrome.runtime.sendMessage({
      action: ACTION.loginAttempted,
      site: siteName,
      user: user,
      password: pw,
    });
  };
}

function onAjaxSubmit(message, sender, sendResponse) {
  var pw;
  // avoid race condition where we send a message before taking the pw
  var p = new Promise(resolve => {
    pw = document.querySelector(message.listenTo.loginPassSelector).value;
    resolve(pw);
  }).then(pw => {
    if (pw.length > 0) {
      chrome.runtime.sendMessage({
        action: ACTION.loginAttempted,
        site: message.site,
        user: null,
        password: pw,
      });
    }
  });
}

/**
 * Removes the keypress and paste event listeners.
 */
function unbindKeyMonitors() {
  document.removeEventListener('paste', pasteListener, true);
}

/**
 * Toggles keypress and paste listening on.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onMonitorKeyEvents(message, sender, sendResponse) {
  debugLog('activate');
  document.addEventListener('paste', pasteListener, true);
}

/**
 * Messages the background script about possible login state according to
 * formElement's availability.
 *
 * @param {?Element} formElement
 * @param {sendResponseCallback} sendResponse
 */
function updateCredentialFormStatus(formElement, sendResponse) {
  sendResponse({
    action: ACTION.credentialFormStatus,
    found: !!formElement,
  });
}

/**
 * Starts login form listener and toggles keypress listening off.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onMonitorForLogin(message, sender, sendResponse) {
  let selector = message.listenTo.loginFormSelector;
  let submitListener = getLoginAttemptListener(message.site, message.listenTo);
  let formElement = document.querySelector(selector);
  if (formElement) {
    unbindKeyMonitors();
    startCredentialListener(formElement, submitListener);
  }

  updateCredentialFormStatus(formElement, sendResponse);
}

/**
 * Starts password change form listener and toggles keypress listening off.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onMonitorForPasswordChange(message, sender, sendResponse) {
  let selector = message.listenTo.changePasswordFormSelector;
  let submitListener = getPasswordChangeListener(
    message.site,
    message.listenTo.changePasswordName,
  );

  let formElement = document.querySelector(selector);
  if (formElement) {
    unbindKeyMonitors();
    startCredentialListener(formElement, submitListener);
  }
  updateCredentialFormStatus(formElement, sendResponse);
}

/**
 * Toggles keypress listening off.
 *
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {sendResponseCallback} sendResponse
 */
function onDeactivate(message, sender, sendResponse) {
  document.removeEventListener('paste', pasteListener, true);
}

function onRefreshOptionsPage(message, sender, sendResponse) {
  window.location.href = message.url;
}

/**
 * Sends keypresses to the background page
 * @param {KeyboardEvent} event
 */
function keypressListener(event) {
  // only fire for password fields
  if (event.target.type === 'password') {
    chrome.runtime.sendMessage({
      action: ACTION.keypress,
      keypress: event.which,
    });
  }
}

/**
 * Sends kedowns to the background page
 * @param {KeyboardEvent} event
 */
function keydownListener(event) {
  // only fire for password fields
  if (event.target.type === 'password') {
    chrome.runtime.sendMessage({
      action: ACTION.keydown,
      keydown: event.which,
    });
  }
}

/**
 * Sends keypresses individually for each character in a paste.
 * @param {ClipboardEvent} event
 */
function pasteListener(event) {
  const pastebinSites = ['https://pastebin.com/', 'https://gist.github.com/'];
  if (pastebinSites.includes(event.target.baseURI)) {
    chrome.runtime.sendMessage({
      action: ACTION.pastebinPaste,
      site: event.target.baseURI,
    });
    return;
  }
  if (!event.clipboardData) return;

  const pasted = event.clipboardData.getData('text/plain');
  const MAX_PASTE_LEN = 100;
  if (pasted.length <= MAX_PASTE_LEN && event.target.type === 'password') {
    for (let c of pasted) {
      chrome.runtime.sendMessage({
        action: ACTION.keypress,
        keypress: c.charCodeAt(0),
      });
    }
  }
}

function xCopyListener(event) {
  let data = window
    .getSelection()
    .toString()
    .trim();
  if (data == '') return;
  chrome.runtime.sendMessage({
    action: ACTION.xeroxCopy,
    data: data,
    url: window.location.toString(),
  });
}

function xPasteListener(event) {
  if (!event.clipboardData) return;
  // Since formatting will break the textual input, we need to massage
  // the data into getting just the core-text without formatting
  // TODO: T68966143 - remove HTML parsing for text as it is an XSS hole.
  let data = event.clipboardData
    .getData('text/plain')
    .toString()
    .trim();
  if (data == '') return;
  chrome.runtime.sendMessage({
    action: ACTION.xeroxPaste,
    data: data,
    url: window.location.toString(),
  });
}

function xInitXeroxModule(message, sender, sendResponse) {
  document.addEventListener('paste', xPasteListener, true);
  document.addEventListener('copy', xCopyListener, true);
  document.addEventListener('cut', xCopyListener, true);
}

var listenerActionMap = {};
listenerActionMap[ACTION.monitorKeyEvents] = onMonitorKeyEvents;
listenerActionMap[ACTION.monitorForLogin] = onMonitorForLogin;
listenerActionMap[ACTION.monitorForPasswordChange] = onMonitorForPasswordChange;
listenerActionMap[ACTION.deactivate] = onDeactivate;
listenerActionMap[ACTION.ajaxSubmit] = onAjaxSubmit;
listenerActionMap[ACTION.refreshOptionsPage] = onRefreshOptionsPage;
listenerActionMap[ACTION.xeroxInit] = xInitXeroxModule;

function messageListener(message, sender, sendResponse) {
  function sendBackgroundMessage(response) {
    chrome.runtime.sendMessage(response);
  }

  // DANGER ZONE ASSUMPTION: ignore iFrames
  if (sender.frameId > 0) {
    return;
  }

  var actionResponder = listenerActionMap[message.action];
  if (actionResponder) {
    // only run the action after page is complete
    if (document.readyState === 'complete') {
      actionResponder(message, sender, sendBackgroundMessage);
    } else {
      document.addEventListener('Load', function() {
        actionResponder(message, sender, sendBackgroundMessage);
      });
    }
  } else {
    debugLog('ERROR: Unknown action "' + message.action + '"');
  }
}

initPage();
