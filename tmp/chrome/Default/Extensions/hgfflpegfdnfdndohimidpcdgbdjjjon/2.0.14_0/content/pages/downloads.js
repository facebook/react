/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule downloads
 * @format
 */

if (DOWNLOADS_PATT.test(pathFromURL(window.location.href))) {
  $('document').ready(function() {
    let downloadItem = getOpts();
    let shouldCancel = true;
    debugLog(downloadItem);
    $('#dl_continue').click(function(e) {
      shouldCancel = false;
      chrome.runtime.sendMessage({
        action: ACTION.resumeDownload,
        downloadItemId: downloadItem.id,
        downloadItemURL: downloadItem.finalUrl,
      });
      // wait 1 second before closing
      setTimeout(function() {
        window.close();
      }, 1000);
    });

    $('#dl_cancel').click(function(e) {
      window.close();
    });
    window.onbeforeunload = function() {
      if (shouldCancel) {
        // cancel the download if the user closes the page without giving a decision
        chrome.runtime.sendMessage({
          action: ACTION.cancelDownload,
          downloadItemId: downloadItem.id,
          downloadItemURL: downloadItem.finalUrl,
        });
      }
    };
  });
}
