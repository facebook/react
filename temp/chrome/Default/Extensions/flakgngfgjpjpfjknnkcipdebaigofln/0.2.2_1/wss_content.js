/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 * @haste-ignore
 * @preserve-whitespace
 */

/**
 * This content script is used to announce plugin availability
 */
(function(html) {
  const features = [
    'cancelChooseDesktopMedia',
    'clearNotification',
    'createNotification',
    'focusTabAndWindow',
    'getAllNotifications',
    'getLastFocusedWindow',
    'getNotificationsPermissionLevel',
    'getStreamID',
    'getTabAndWindowForSender',
    'getTabForSender',
    'getWindow',
    'ping',
    'updateNotification',
    'updateTab',
    'updateWindow',
    'createWindow',
  ];

  const version = chrome.runtime.getManifest().version;

  if (html !== null) {
    html.setAttribute('data-intern-screensharing-extension-available', version);
    html.setAttribute(
      'data-intern-screensharing-extension-features',
      features.join(','),
    );
  }
})(document.documentElement);
