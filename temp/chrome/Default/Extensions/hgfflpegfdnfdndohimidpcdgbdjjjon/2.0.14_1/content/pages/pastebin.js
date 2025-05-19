/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule pastebin
 * @format
 */
'use strict';

// only load for the warning page
if (PASTEBIN_PATT.test(pathFromURL(window.location.href))) {
  $('document').ready(function() {
    chrome.runtime.sendMessage({
      action: ACTION.sendLog,
      close_tab: false,
      log_type: 'PROTEGO_PASTEBIN',
      logs: {
        action: 'pb_warning',
      },
      protego_version: protegoVersion,
    });
    let opts = getOpts();
    $('#pb_ignore').click(function(e) {
      chrome.runtime.sendMessage({
        action: ACTION.sendLog,
        close_tab: true,
        log_type: 'PROTEGO_PASTEBIN',
        logs: {
          action: 'pb_ignore',
        },
        protego_version: protegoVersion,
      });
    });

    $('#pb_intern').click(function() {
      var win = window.open(
        'https://www.internalfb.com/intern/paste/create',
        '_blank',
      );
      win.focus();
      chrome.runtime.sendMessage({
        action: ACTION.sendLog,
        close_tab: true,
        log_type: 'PROTEGO_PASTEBIN',
        logs: {
          action: 'pb_cancel',
        },
        protego_version: protegoVersion,
      });
    });
  });
}
