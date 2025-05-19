/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule common
 * @format
 */
'use strict';

/**
 * Configurations for websites.
 *
 * @type {{siteName: {
 *                   name: string,
 *                   cookieDomain: string,
 *                   loginURL: RegExp,
 *                   subdomainUrl: RegExp,
 *                   loginFormSelector: string,
 *                   loginUserSelector: string,
 *                   loginPassSelector: string,
 *                   loginInitURL: string,
 *                   secondFactorURL: RegExp,
 *                   secondFactorFormSelector: string,
 *                   changePasswordURL: string,
 *                   changePasswordFormSelector: string,
 *                   changePasswordName: string,
 *                   displayUserAlert: boolean,
 *                   shouldInitializePassword: boolean,
 *                   securityEmailAddress: string,
 *                   minimumLength: number},
 *      }}
 */
var SITES = {
  Facebook: {
    name: 'Facebook',
    description: 'Your facebook.com password',
    // settings for the content page
    bootstrapURL: 'https://www.facebook.com/login/',
    cookieDomain: 'https://www.facebook.com',
    loginURL: /^https:\/\/.*\.facebook\.com\/?(login\.php|index.php|login|login\/device-based\/regular\/login|work\/landing\/input)?\/?$/,
    loginFormSelector: '#login_form',
    loginUserSelector: 'email',
    loginPassSelector: 'pass',
    loginIsAjax: false,
    loginInitURL: 'https://www.facebook.com/',
    subDomainPattern: /^https:\/\/.*\.(thefacebook|facebook|workplace|internalfb).com(\/|:|$)/,
    secondFactorURL: /^https:\/\/[a-z\-0-9]+\.facebook\.com\/checkpoint\/?$/,
    secondFactorFormSelector: 'form.checkpoint',
    changePasswordURL: /^https:\/\/.*\.facebook\.com\/settings\?tab=security&section=password&view/,
    changePasswordFormSelector:
      'form[action="/ajax/settings/security/password.php"]',
    changePasswordName: 'password_new',
    displayUserAlert: true,
    shouldInitializePassword: true,
    securityEmailAddress: 'cert@fb.com',
    minimumLength: 6,
  },
  Intern: {
    name: 'Intern',
    description: 'The password you use to log into your machine, email, AD etc',
    bootstrapURL: 'https://www.internalfb.com/intern/employee/login/',
    cookieDomain: 'https://www.facebook.com',
    loginURL: /^https:\/\/.*\.(facebook|internalfb)\.com\/intern\/employee\/login\/?$/,
    loginFormSelector: 'button[type="submit"]',
    loginPassSelector: 'input[type="password"]',
    loginIsAjax: true,
    loginAjaxURL: 'https://*/intern/employee/login/validate/*',
    subDomainPattern: /^https:\/\/.*\.(thefacebook|facebook|workplace|internalfb).com(\/|:|$)/,
    changePasswordURL: /^https:\/\/.*\.(facebook|internalfb)\.com\/intern\/(password|unix\/reset)\/?$/,
    changePasswordFormSelector: 'form[action="/intern/password/change/"]',
    changePasswordName: 'new_password1',

    displayUserAlert: true,
    shouldInitializePassword: true,
    securityEmailAddress: 'cert@fb.com',
    minimumLength: 12,
  },
};

/**
 * Enumeration of message['action'] passed between content and background
 * scripts.
 *
 * Content -> Background:
 * - keypress: User has pressed a key on the page
 * - navigateToPage: Browser has navigated to a new page or location.href is
 *  modified using `window.history`.
 * - loginAttempted: User has attempted to log into a page; creds attached.
 * - changePassword: User has attempted to change his/her password; creds
 *  attached.
 * - credentialFormStatus: Whether the login/change password form has been found
 *  on the current page. Sent as a response to `monitorForLogin` and
 *  `monitorForPasswordChange`.
 *
 * Background -> Content:
 * - monitorKeypress: Keypress information should be sent to the background
 *  script.
 * - monitorForLogin: Content script should treat the current page as a login
 *  page. Can be rejected by the content script if message['selector'] doesn't
 *  exist when the message is received!
 * - monitorForPasswordChange: Content script should treat the current page as a
 *  password change page. Rejects according to startLogin's criteria.
 * - deactivate: Content script should stop listening for keys on the current
 *  page. Usually sent when href.origin is marked "always ignore".
 */
const ACTION = {
  // content -> background
  keypress: 'keypress',
  loginAttempted: 'loginAttempt',
  changePassword: 'changePassword',
  credentialFormStatus: 'credentialFormStatus',
  pastebinPaste: 'pastebinPaste',
  ajaxAuthAttempt: 'ajaxAuthAttempt',
  deleteCookies: 'deleteCookies',
  refreshOptionsParams: 'refreshOptionsParams',
  sendLog: 'sendLog',
  // background -> options.js
  refreshOptionsPage: 'refreshOptionsPage',
  openOptionsPage: 'openOptionsPage',

  // background -> content
  monitorKeyEvents: 'monitorKeyEvents',
  monitorForLogin: 'monitorForLogin',
  monitorForPasswordChange: 'monitorForPasswordChange',
  deactivate: 'deactivate',
  ajaxSubmit: 'ajaxSubmit',

  // settings -> Background
  updatePasswordLengths: 'updatePasswordLengths',

  // download.js -> Background
  cancelDownload: 'cancelDownload',
  resumeDownload: 'resumeDownload',

  // xerox Module -> background
  xeroxCopy: 'xeroxCopy',
  xeroxPaste: 'xeroxPaste',

  // xerox Module -> content
  xeroxInit: 'xeroxInit',
};

const OPTIONS_URL =
  'https://www.internalfb.com/intern/security/protego/options/';
const OPTIONS_PATT = /^https:\/\/.*\.?(facebook|internalfb)\.com\/intern\/security\/protego\/options\/?/;

const PASTEBIN_URL =
  'https://www.internalfb.com/intern/security/protego/pastebin/';
const PASTEBIN_PATT = /^https:\/\/.*\.?(facebook|internalfb)\.com\/intern\/security\/protego\/pastebin\/?/;

const DOWNLOADS_URL =
  'https://www.internalfb.com/intern/security/protego/download/';
const DOWNLOADS_PATT = /^https:\/\/.*\.?(facebook|internalfb)\.com\/intern\/security\/protego\/download\/?/;

const SETTINGS_PAGE_SHIM =
  'chrome-extension://' + chrome.runtime.id + '/content/settings/index.html';

let protegoVersion = chrome.runtime.getManifest().version;

// colors
const BACKGROUND_COLOR = '#77A7FF';
const PHISH_COLOR = '#F7923B';
const WARNING_COLOR = '#F34F46';

// labels
const LOGIN_LABEL = '\u{2713}';
const ALLOWLIST_LABEL = '\u{2713}';
const WARNING_LABEL = '!';
const PHISH_LABEL = 'SENT';

// text
const LOGIN_TXT = 'Login Page';
const ALLOWLIST_TXT = 'Allow listed Page';
const WARNING_TXT = 'password was reused on this page';
const PHISH_TXT = 'Successfully reported as Phishing';
const CHANGE_TXT = 'Change Page';
const NORMAL_TXT = 'Normal Page';

// other
const EXTENSION_ID = 'hgfflpegfdnfdndohimidpcdgbdjjjon';
const WEB_REQUEST_MAX_BATCH = 200;
const WEB_REQUEST_BATCH_TIMEOUT = 3000;
