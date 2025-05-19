/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule options
 * @format
 */
'use strict';

function reloadPage(changes, area) {
  if (changes.hasOwnProperty('hashes')) {
    chrome.runtime.sendMessage({
      action: ACTION.refreshOptionsParams,
    });
  }
}

// only load for the options page
if (OPTIONS_PATT.test(pathFromURL(window.location.href))) {
  debugLog('options page');
  $('document').ready(function() {
    chrome.storage.onChanged.addListener(reloadPage);
    // set up click listeners
    $('body').on('click', '[id^=clear_]', function(event) {
      event.preventDefault();
      var target = event.target;
      chrome.storage.local.get('hashes', function(result) {
        if (result.hashes) {
          var id = target.id.split('_')[1];
          var site = id;
          // validate the users input
          if (Object.keys(SITES).indexOf(site) == -1) {
            return;
          }
          var passwordLength = result.hashes[site].length;
          result.hashes[site] = {};
          new Promise(function(innerResolve) {
            chrome.runtime.sendMessage({
              action: ACTION.updatePasswordLengths,
              passwordLength: passwordLength,
              operation: 'remove',
            });
            innerResolve();
          }).then(function() {
            chrome.storage.local.set({hashes: result.hashes}, () => {
              chrome.runtime.sendMessage({
                action: ACTION.sendLog,
                close_tab: false,
                log_type: 'LOG_PROTEGO_PASSWORD_REUSE',
                logs: {
                  action: 'remove',
                  credential_type: site,
                },
                protego_version: protegoVersion,
              });
            });
          });
        }
      });
    });

    $('i').click(e => {
      event.preventDefault();
      event.stopPropagation();
      $(e.target)
        .parent('button')
        .click();
    });

    $('body').on('click', '[id^=reauth_]', function(event) {
      event.preventDefault();
      var target = event.target;
      var id = target.id.split('_')[1];
      var site = id;
      if (site === 'Facebook') {
        chrome.runtime.sendMessage({
          action: ACTION.deleteCookies,
        });
      }
      window.open(SITES[site].bootstrapURL);
    });

    $('body').on('click', '#defangCopy', function(event) {
      chrome.storage.onChanged.removeListener(reloadPage);
      chrome.storage.local.set({
        settings: {
          enableDefangCopyContextMenu: event.target.checked,
        },
      });
    });

    $('body').on('click', '#reset', function(event) {
      event.preventDefault();
      chrome.storage.onChanged.removeListener(reloadPage);
      chrome.storage.local.clear(function() {
        chrome.runtime.sendMessage({
          action: ACTION.sendLog,
          close_tab: false,
          log_type: 'LOG_PROTEGO_PASSWORD_REUSE',
          logs: {
            action: 'reset',
          },
          protego_version: protegoVersion,
        });
        return new Promise(resolve => {
          resolve();
        })
          .then(primeHashes)
          .then(() => {
            chrome.runtime.sendMessage({
              action: ACTION.updatePasswordLengths,
              operation: 'clear',
            });
            chrome.runtime.sendMessage({
              action: ACTION.refreshOptionsParams,
            });
          });
      });
    });
  });
}
