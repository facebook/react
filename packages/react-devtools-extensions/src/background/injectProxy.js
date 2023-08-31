/* global chrome */

// We keep this logic in background, because Firefox doesn't allow using these APIs
// from extension page script
function injectProxy(tabId: number) {
  chrome.scripting.executeScript({
    target: {tabId},
    files: ['/build/proxy.js'],
  });
}

export default injectProxy;
