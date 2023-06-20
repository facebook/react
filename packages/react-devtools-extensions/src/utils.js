/* global chrome */

import type { BrowserTheme } from 'react-devtools-shared/src/devtools/views/DevTools';

let IS_EDGE;
let IS_FIREFOX;
let IS_CHROME;

async function getBrowserData() {
  if (navigator.userAgentData) {
    const userAgentData = await navigator.userAgentData.getHighEntropyValues([
      'brands',
    ]);
    userAgentData.brands.forEach(brand => {
      switch (brand.brand.toLowerCase()) {
        case 'google chrome':
          IS_CHROME = true;
          break;
        case 'firefox':
          IS_FIREFOX = true;
          break;
        case 'edge':
          IS_EDGE = true;
          break;
      }
    });
  } else {
    throw new Error('navigator.userAgentData is not supported in this browser.');
  }
}

getBrowserData();

export type BrowserName = 'Chrome' | 'Firefox' | 'Edge';

export function getBrowserName(): BrowserName {
  if (IS_EDGE) {
    return 'Edge';
  }
  if (IS_FIREFOX) {
    return 'Firefox';
  }
  if (IS_CHROME) {
    return 'Chrome';
  }
  throw new Error(
    'Expected browser name to be one of Chrome, Edge or Firefox.'
  );
}

export function getBrowserTheme(): BrowserTheme {
  if (IS_CHROME) {
    // chrome.devtools.panels added in Chrome 18.
    // chrome.devtools.panels.themeName added in Chrome 54.
    return chrome.devtools.panels.themeName === 'dark' ? 'dark' : 'light';
  } else {
    // chrome.devtools.panels.themeName added in Firefox 55.
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/devtools.panels/themeName
    if (chrome.devtools && chrome.devtools.panels) {
      switch (chrome.devtools.panels.themeName) {
        case 'dark':
          return 'dark';
        default:
          return 'light';
      }
    }
  }
}

export const COMPACT_VERSION_NAME = 'compact';
export const EXTENSION_CONTAINED_VERSIONS = [COMPACT_VERSION_NAME];
