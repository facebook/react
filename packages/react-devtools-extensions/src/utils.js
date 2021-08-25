/* global chrome */

import type {BrowserTheme} from 'react-devtools-shared/src/devtools/views/DevTools';

const IS_CHROME = navigator.userAgent.indexOf('Firefox') < 0;

export type BrowserName = 'Chrome' | 'Firefox';

export function getBrowserName(): BrowserName {
  return IS_CHROME ? 'Chrome' : 'Firefox';
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
