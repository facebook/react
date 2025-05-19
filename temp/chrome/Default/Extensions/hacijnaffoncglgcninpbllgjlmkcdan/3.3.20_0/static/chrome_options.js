/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall open_source
 */

document.querySelector('#reset_all')?.addEventListener('click', () => {
  chrome.storage.local.clear();
});
