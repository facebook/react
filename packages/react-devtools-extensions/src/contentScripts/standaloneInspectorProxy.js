/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* global chrome */

// This content script runs in the isolated world and bridges
// chrome.runtime messages to/from the main world standaloneInspector.js

// Forward messages from background script to main world
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.source === 'react-devtools-context-menu') {
    window.postMessage(
      {
        source: 'react-devtools-standalone-inspector-proxy',
        type: message.type,
        payload: message.payload,
      },
      '*',
    );
  }
});

// Forward messages from main world back to background script
window.addEventListener('message', event => {
  if (event.source !== window) {
    return;
  }

  const data = event.data;
  if (data?.source === 'react-devtools-standalone-inspector') {
    chrome.runtime.sendMessage({
      source: 'react-devtools-standalone-inspector',
      type: data.type,
      payload: data.payload,
    });
  }
});
