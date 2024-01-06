/* global chrome */

import {__DEBUG__} from 'react-devtools-shared/src/constants';

let debugIDCounter = 0;

const debugLog = (...args) => {
  if (__DEBUG__) {
    console.log(...args);
  }
};

const fetchFromNetworkCache = (url, resolve, reject) => {
  // Debug ID allows us to avoid re-logging (potentially long) URL strings below,
  // while also still associating (potentially) interleaved logs with the original request.
  let debugID = null;

  if (__DEBUG__) {
    debugID = debugIDCounter++;
    debugLog(`[main] fetchFromNetworkCache(${debugID})`, url);
  }

  chrome.devtools.network.getHAR(harLog => {
    for (let i = 0; i < harLog.entries.length; i++) {
      const entry = harLog.entries[i];
      if (url !== entry.request.url) {
        continue;
      }

      debugLog(
        `[main] fetchFromNetworkCache(${debugID}) Found matching URL in HAR`,
        url,
      );

      if (entry.getContent != null) {
        entry.getContent(content => {
          if (content) {
            debugLog(
              `[main] fetchFromNetworkCache(${debugID}) Content retrieved`,
            );

            resolve(content);
          } else {
            debugLog(
              `[main] fetchFromNetworkCache(${debugID}) Invalid content returned by getContent()`,
              content,
            );

            // Edge case where getContent() returned null; fall back to fetch.
            fetchFromPage(url, resolve, reject);
          }
        });
      } else {
        const content = entry.response.content.text;

        if (content != null) {
          debugLog(
            `[main] fetchFromNetworkCache(${debugID}) Content retrieved`,
          );
          resolve(content);
        } else {
          debugLog(
            `[main] fetchFromNetworkCache(${debugID}) Invalid content returned from entry.response.content`,
            content,
          );
          fetchFromPage(url, resolve, reject);
        }
      }
    }

    debugLog(
      `[main] fetchFromNetworkCache(${debugID}) No cached request found in getHAR()`,
    );

    // No matching URL found; fall back to fetch.
    fetchFromPage(url, resolve, reject);
  });
};

const fetchFromPage = async (url, resolve, reject) => {
  debugLog('[main] fetchFromPage()', url);

  function onPortMessage({payload, source}) {
    if (source === 'react-devtools-background') {
      switch (payload?.type) {
        case 'fetch-file-with-cache-complete':
          chrome.runtime.onMessage.removeListener(onPortMessage);
          resolve(payload.value);
          break;
        case 'fetch-file-with-cache-error':
          chrome.runtime.onMessage.removeListener(onPortMessage);
          reject(payload.value);
          break;
      }
    }
  }

  chrome.runtime.onMessage.addListener(onPortMessage);

  chrome.runtime.sendMessage({
    source: 'devtools-page',
    payload: {
      type: 'fetch-file-with-cache',
      tabId: chrome.devtools.inspectedWindow.tabId,
      url,
    },
  });
};

// Fetching files from the extension won't make use of the network cache
// for resources that have already been loaded by the page.
// This helper function allows the extension to request files to be fetched
// by the content script (running in the page) to increase the likelihood of a cache hit.
const fetchFileWithCaching = url => {
  return new Promise((resolve, reject) => {
    // Try fetching from the Network cache first.
    // If DevTools was opened after the page started loading, we may have missed some requests.
    // So fall back to a fetch() from the page and hope we get a cached response that way.
    fetchFromNetworkCache(url, resolve, reject);
  });
};

export default fetchFileWithCaching;
