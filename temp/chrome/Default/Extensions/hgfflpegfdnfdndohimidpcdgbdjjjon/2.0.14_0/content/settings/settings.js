/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule settings
 * @format
 */
'use strict';

if (window.location.href === SETTINGS_PAGE_SHIM) {
  debugLog('settings shim');
  $('document').ready(function() {
    chrome.runtime.sendMessage({
      action: ACTION.openOptionsPage,
    });
    window.close();
  });
}
