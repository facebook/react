/* global chrome */

import type {BrowserTheme} from 'react-devtools-shared/src/devtools/views/DevTools';

export const IS_EDGE: boolean = process.env.IS_EDGE;
export const IS_FIREFOX: boolean = process.env.IS_FIREFOX;
export const IS_CHROME: boolean = process.env.IS_CHROME;

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
