/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Background script that processes keypresses, credentials, warnings, and
 * notifications. Receives keypresses, credentials, and context from the content
 * scripts.
 *
 * @providesModule background
 * @format
 */

'use strict';

/**
 * @type {number}
 */
const MINUTELY_HASH_RATE_LIMIT = 250;

/**
 * `findSiteWithMatchingPassword` invocations so far.
 * @type {number}
 */
var minutelyHashRateLimitCount = 0;

/**
 * When to zero out `hourlyRateLimitCount`.
 * @type {Date}
 */
var minutelyHashRateLimitExpiry;

const URL_TYPES = {
  normal: 'normal',
  subDomainPage: 'subDomainPage',
  changePage: 'changePage',
  loginPage: 'loginPage',
};

/**
 * Enumeration of URL types detected. Order is important because the order
 * in the array represents their value for masterSite.
 * @type {{int: string}}
 */
const URL_TYPE_VALUES = [
  URL_TYPES.normal,
  URL_TYPES.subDomainPage,
  URL_TYPES.changePage,
  URL_TYPES.loginPage,
];

/**
 * Maximum typed length to keep.
 *
 * @type {number}
 */
var maxPasswordLength = -1;

/**
 * Minimum typed length to start hashing.
 *
 * @type {number}
 */
var minPasswordLength = Number.MAX_SAFE_INTEGER;

/**
 * Set of password lengths to check.
 *
 * @type {Set<Number>}
 */
var passwordLengths = new Set();

/**
 * Holds all known pages.
 *
 * @type {{senderTabID: PageState}}
 */
var pages = {};

var logCooldown = true;
var cooldownCounter = 0;

var requestCache = [];
var requestTimer = null;

/**
 * Holds info on the most important site for this page
 * For example, a page could be a login page for one site, but a normal page
 * for another. We take the highest priority site as masterSite. Priorities
 * dictated by order in URL_TYPE_VALUES
 *
 * @type {{senderTabID: PageState}}
 */
var masterSite = {name: null, urlType: URL_TYPES.normal};

class PageState {
  /**
   * @param {Number} tabId
   */
  constructor(tabId) {
    this.typed = '';
    chrome.tabs.get(tabId, tab => {
      if (chrome.runtime.lastError) {
        debugLog(chrome.runtime.lastError.message);
      } else {
        this.url = tab.url;
      }
    });
    this.tabId = tabId;
  }

  /**
   * Modifies and calls a potential password check depending on `keyIdentifier`.
   *
   * Called when the user types a key into the page.
   *
   * @param {KeyboardEvent.which|String} which
   */
  type(which, type) {
    switch (type) {
      case 'keypress':
        let char = String.fromCharCode(which);
        this.typed += char;

        debugLog(this.typed.length + '/' + minPasswordLength);
        if (this.typed.length > maxPasswordLength) {
          const diff = this.typed.length - maxPasswordLength;
          this.typed = this.typed.substr(diff);
        }
        if (this.typed.length >= minPasswordLength) {
          this.checkTyped();
        }
        break;
      case 'keydown':
        if (which === 0x08) {
          this.typed = this.typed.substring(0, this.typed.length - 1);
        }
        break;
    }
  }

  /**
   * Checks substrings of this.typed against stored, salted hashes, displaying
   * a password warning if this happens to match a site's hash.
   *
   */
  checkTyped() {
    const that = this;
    let promises = [];

    // Hashing is in nanoseconds, so not too worried here about timing attacks.
    for (let i of passwordLengths) {
      if (this.typed.length < i) {
        continue;
      }
      const toCheck = this.typed.substr(this.typed.length - i);
      promises.push(findSiteWithMatchingPassword(toCheck));
    }
    // Timing independent check on which site the hash matches.
    // Resolve all promise return values to actual values and then filter them
    // down to one site name.
    Promise.all(promises).then(function(values) {
      // filter values by return type
      const matchedSites = values.filter(function(element) {
        return typeof element === 'string';
      });
      if (matchedSites.length >= 1) {
        const siteName = matchedSites[0];
        var url;
        chrome.tabs.get(that.tabId, data => {
          if (chrome.runtime.lastError) {
            debugLog(chrome.runtime.lastError.message);
          } else {
            chrome.browserAction.setTitle({
              title: 'Protego - ' + siteName + ' ' + WARNING_TXT,
              tabId: that.tabId,
            });
            chrome.browserAction.setBadgeBackgroundColor({
              color: WARNING_COLOR,
              tabId: that.tabId,
            });
            chrome.browserAction.setBadgeText({
              text: WARNING_LABEL,
              tabId: that.tabId,
            });
            url = data.url;
            sendLog(
              'PROTEGO_PASSWORD_REUSE',
              {
                action: 'password_hit',
                credential_type: siteName,
                target: pathFromURL(url),
              },
              protegoVersion,
            );
          }
        });
      }
    });
  }
}

/**
 * Returns one of `URL_TYPE_VALUES` after checking URLs for configured login or
 * password change pages.
 *
 * @param {Object} site configured site in `SITES`
 * @param {String} href page URL
 * @returns {String}
 */
async function getURLTypeForSite(site, href) {
  const path = pathFromURL(href);
  let isLoginPage;
  let isPasswordChangePage;
  let isSubDomainPage;
  // check for loginUrl
  if (site.loginURL) {
    if (typeof site.loginURL === 'string') {
      isLoginPage = site.loginURL === path;
    } else {
      isLoginPage = site.loginURL.test(path);
    }
    if (isLoginPage) {
      return URL_TYPES.loginPage;
    }
  }
  // see if it's a change password page
  if (typeof site.changePasswordURL === 'string') {
    isPasswordChangePage = site.changePasswordURL === href;
  } else {
    isPasswordChangePage = site.changePasswordURL.test(href);
  }
  if (isPasswordChangePage) {
    return URL_TYPES.changePage;
  }

  // check for subdomains
  if (site.subDomainPattern) {
    isSubDomainPage = site.subDomainPattern.test(path);
  }
  if (isSubDomainPage) {
    return URL_TYPES.subDomainPage;
  }

  return URL_TYPES.normal;
}

/**
 * Returns whether the rate limit has been surpassed or not.
 * @returns {boolean}
 */
function hashIsBelowRateLimit() {
  let now = new Date();
  // initialization and expiration
  if (
    typeof minutelyHashRateLimitExpiry === 'undefined' ||
    now >= minutelyHashRateLimitExpiry
  ) {
    minutelyHashRateLimitExpiry = now.setMinutes(now.getMinutes() + 1);
    minutelyHashRateLimitCount = 0;
  }
  return minutelyHashRateLimitCount <= MINUTELY_HASH_RATE_LIMIT;
}

/**
 * Checks an input string against all stored hashes. If rate limited, then this
 * fails open and promises `false`.
 *
 * @param {String} candidatePassword what might be a password
 * @returns {Promise<String|Boolean>} promises the matching site name or false
 */
function findSiteWithMatchingPassword(candidatePassword) {
  if (hashIsBelowRateLimit()) {
    minutelyHashRateLimitCount++;
  } else {
    // fail open
    return new Promise(function(resolve, reject) {
      resolve(false);
    });
  }

  // hash rate not reached, so hash the input!
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get('hashes', function(data) {
      let hashes = data['hashes'] || {};
      resolve(hashes);
    });
  }).then(function(hashes) {
    var promiseArray = [];
    for (let siteName in hashes) {
      if (
        !hashes.hasOwnProperty(siteName) ||
        candidatePassword.length < hashes[siteName].length ||
        Object.keys(hashes[siteName]).length === 0
      ) {
        continue;
      }
      const site = hashes[siteName];
      // promise that returns an object with whether something matched
      var pHash = new Promise(function(resolve, reject) {
        hashPassword(candidatePassword, site.salt).then(resolve);
      }).then(function(saltedHash) {
        debugLog('Salted hash: ' + saltedHash + ' === ' + site.hash);
        return {
          name: siteName,
          matched: saltedHash.compareHash(site.hash),
        };
      });
      promiseArray.push(pHash);
    }

    // convert the array of promises to the output of Array.some
    return Promise.all(promiseArray).then(function(values) {
      // return the name of the matching site
      let name = false;
      for (let v of values) {
        name = v.matched ? v.name : name;
      }
      return name;
    });
  });
}

/**
 * Display the Pastebin warning.
 *
 * @param {Number} tabId
 */
function displayPastebinWarning(siteName, tabId) {
  const opts = JSON.stringify({
    site: siteName,
    tabId: tabId,
  });
  window.open(PASTEBIN_URL + '?data=' + encodeURIComponent(opts));
}

/**
 * Display the Download warning.
 *
 * @param {Object} downloadItem
 */
function displayDownloadWarning(downloadItem) {
  if (downloadItem.filename.current !== undefined) {
    downloadItem.filename = downloadItem.filename.current;
  }
  const opts = JSON.stringify(downloadItem);
  window.open(DOWNLOADS_URL + '?data=' + encodeURIComponent(opts));
  sendLog(
    'PROTEGO_DOWNLOADS',
    prepareDownloadItem('dl_warning', downloadItem),
    protegoVersion,
  );
}

function getLastAttempt(tabId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('hashAttempts', function(attemptData) {
      let attempts = attemptData['hashAttempts'] || {};
      if (!(tabId in attempts)) {
        reject();
      }
      resolve(attempts[tabId]);
    });
  });
}

/**
 * Commit the last login/change password attempt (if any) for a given tab.
 * Pops said attempt out of `hashAttempts` and cleans it up a bit before
 * inserting it into the hashes array.
 *
 * @param {Number} tabId
 */
async function commitLastAttempt(tabId) {
  try {
    var attempt = await getLastAttempt(tabId);
  } catch (e) {
    return;
  }
  const siteName = attempt.site;
  const user = attempt.user;

  debugLog('Committing creds attempt for ' + siteName);
  chrome.storage.local.get('hashes', function(hashesData) {
    var hashes = hashesData['hashes'] || {};
    let oldLength = hashes[siteName].length;
    // clean up data duplication and commit to hashes
    hashes[siteName] = attempt;
    clearLastAttempt(tabId);
    // never commit passwords of 0 length
    if (attempt.length >= SITES[siteName].minimumLength) {
      chrome.storage.local.set({hashes: hashes}, () => {
        // add and refresh max password length
        delete passwordLengths[oldLength];
        passwordLengths.add(hashes[siteName].length);
        passwordLengths.forEach(function(e) {
          maxPasswordLength = Math.max(maxPasswordLength, e);
          minPasswordLength = Math.min(minPasswordLength, e);
        });
        sendLog(
          'PROTEGO_PASSWORD_REUSE',
          {
            action: 'capture',
            credential_type: siteName,
          },
          protegoVersion,
        );
      });
    } else {
      sendLog(
        'PROTEGO_DEBUG',
        {
          action: 'password_below_min',
          credential_type: siteName,
        },
        protegoVersion,
      );
    }
  });
}

/**
 * Deletes the last attempt (if any) for a given tab ID.
 *
 * @param {Number} tabId
 */
function clearLastAttempt(tabId) {
  debugLog('clearing last creds attempt');
  chrome.storage.local.get('hashAttempts', function(data) {
    let attempts = data['hashAttempts'];
    if (attempts && attempts[tabId]) {
      delete attempts[tabId];
      chrome.storage.local.set({hashAttempts: attempts});
    }
  });
}

function setBrowserAction(urlType, tabId) {
  switch (urlType) {
    case URL_TYPES.loginPage:
      chrome.browserAction.setTitle({
        title: 'Protego - ' + LOGIN_TXT,
        tabId: tabId,
      });
      chrome.browserAction.setBadgeBackgroundColor({
        color: BACKGROUND_COLOR,
        tabId: tabId,
      });
      chrome.browserAction.setBadgeText({
        text: LOGIN_LABEL,
        tabId: tabId,
      });
      break;

    case URL_TYPES.changePage:
      chrome.browserAction.setTitle({
        title: 'Protego - ' + CHANGE_TXT,
        tabId: tabId,
      });
      chrome.browserAction.setBadgeBackgroundColor({
        color: BACKGROUND_COLOR,
        tabId: tabId,
      });
      chrome.browserAction.setBadgeText({
        text: LOGIN_LABEL,
        tabId: tabId,
      });
      break;

    case URL_TYPES.subDomainPage:
      chrome.browserAction.setTitle({
        title: 'Protego - ' + ALLOWLIST_TXT,
        tabId: tabId,
      });
      chrome.browserAction.setBadgeBackgroundColor({
        color: BACKGROUND_COLOR,
        tabId: tabId,
      });
      chrome.browserAction.setBadgeText({
        text: ALLOWLIST_LABEL,
        tabId: tabId,
      });
      break;

    case URL_TYPES.normal:
      chrome.browserAction.setTitle({
        title: 'Protego - ' + NORMAL_TXT,
        tabId: tabId,
      });
      chrome.browserAction.setBadgeBackgroundColor({
        color: BACKGROUND_COLOR,
        tabId: tabId,
      });
      break;
  }
}

/**
 * Determine if the content script should listen for login/password change forms
 * or deactivate listening on the page entirely because its origin is
 * subdomain. Messages the action back to the tab as appropriate.
 *
 * @param {Object} tab
 */
async function onNewPage(tab) {
  pages[tab.id] = new PageState(tab.id);
  let sendMessage = function(message) {
    chrome.tabs.sendMessage(tab.id, message);
  };
  masterSite.urlType = URL_TYPES.normal;
  // find out if we should be listening on this page
  for (let name in SITES) {
    let previousMasterSiteUrlType = masterSite.urlType;
    // decide whether to deactivate keystroke logging on the page
    // also, create a new PageState for the tab if one doesn't exist
    let urlType = await getURLTypeForSite(SITES[name], tab.url);
    masterSite.urlType =
      URL_TYPE_VALUES[
        Math.max(
          URL_TYPE_VALUES.indexOf(masterSite.urlType),
          URL_TYPE_VALUES.indexOf(urlType),
        )
      ];
    // if masterSite.urlType has changed, it must have been this
    // site that changed it
    if (masterSite.urlType !== previousMasterSiteUrlType) {
      masterSite.name = name;
    }
  }
  let site = SITES[masterSite.name];
  // change the icon for the appropriate urlType
  setBrowserAction(masterSite.urlType, tab.id);
  switch (masterSite.urlType) {
    case URL_TYPES.normal:
      chrome.tabs.sendMessage(tab.id, {action: ACTION.monitorKeyEvents});
      break;

    case URL_TYPES.loginPage:
      // if login is Ajax, then we need to start the webRequest
      // listener now ready for the auth request to be returned
      isListeningAjax = chrome.webRequest.onBeforeRequest.hasListeners();
      if (site.loginIsAjax && !isListeningAjax) {
        onBeforeAjaxRequest = function(siteName, site, tabId) {
          var message = {
            action: ACTION.ajaxSubmit,
            site: siteName,
            listenTo: {
              loginFormSelector: site.loginFormSelector,
              loginUserSelector: site.loginUserSelector,
              loginPassSelector: site.loginPassSelector,
            },
          };
          chrome.tabs.sendMessage(tabId, message);
        };
        onCompletedAjaxRequest = function(site, details) {
          onAjaxAuthAttempt(site, details);
        };
        onBeforeAjaxRequest = onBeforeAjaxRequest.bind(
          null,
          masterSite.name,
          site,
          tab.id,
        );
        chrome.webRequest.onBeforeRequest.addListener(
          onBeforeAjaxRequest,
          {urls: [site.loginAjaxURL]},
          ['blocking'],
        );
        onCompletedAjaxRequest = onCompletedAjaxRequest.bind(null, site);
        chrome.webRequest.onCompleted.addListener(onCompletedAjaxRequest, {
          urls: [site.loginAjaxURL],
        });
      }
      sendMessage({
        action: ACTION.monitorForLogin,
        site: masterSite.name,
        listenTo: {
          loginFormSelector: site.loginFormSelector,
          loginUserSelector: site.loginUserSelector,
          loginPassSelector: site.loginPassSelector,
        },
      });
      break;

    case URL_TYPES.changePage:
      sendMessage({
        action: ACTION.monitorForPasswordChange,
        site: masterSite.name,
        listenTo: {
          changePasswordFormSelector: site.changePasswordFormSelector,
          changePasswordName: site.changePasswordName,
        },
      });
      break;

    case URL_TYPES.subDomainPage:
      chrome.tabs.sendMessage(tab.id, {action: 'deactivate'});
      // we check if there is a previous attempt and commit if there was
      commitLastAttempt(tab.id);
      break;

    default:
      break;
  }
  chrome.tabs.sendMessage(tab.id, {action: ACTION.xeroxInit});

  debugLog(masterSite);
}

// only process one tab update every 1 seconds per tab
setInterval(function() {
  if (cooldownCounter > 0) {
    cooldownCounter--;
  } else if (cooldownCounter === 0) {
    logCooldown = true;
  }
}, 1000);

/**
 * Sets us webRequest listener for Ajax auth requests
 *
 * @param {Object} site site properties from common.js
 * @param {Object} requestDetails Chrome webRequest details
 */
function onAjaxAuthAttempt(site, requestDetails) {
  // auth response was a 200, which means the password was valid
  if (requestDetails.statusCode === 200) {
    // Ajax is now complete, so remove listeners
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeAjaxRequest);
    chrome.webRequest.onCompleted.removeListener(onCompletedAjaxRequest);
    isListeningAjax = false;
    commitLastAttempt(requestDetails.tabId);
  } else {
    clearLastAttempt(requestDetails.tabId);
  }
}

function onContextMenuClick(info, tab) {
  switch (info.menuItemId) {
    case 'reportPhishSite':
      reportPhishSite(tab);
      break;
    case 'defangCopy':
      defangCopy(info, tab);
      break;
  }
}

function reportPhishSite(tab) {
  var r = confirm(
    'Report page:\n\n' +
      tab.url +
      '\n\nas phishing? A case will be opened with CERT.',
  );
  if (r == true) {
    sendLog(
      'PROTEGO_PHISH',
      {
        action: 'report_phish',
        target: encodeURIComponent(tab.url),
      },
      protegoVersion,
    ).then(() => {
      chrome.browserAction.setTitle({
        title: 'Protego - ' + PHISH_TXT,
        tabId: tab.id,
      });
      chrome.browserAction.setBadgeBackgroundColor({
        color: PHISH_COLOR,
        tabId: tab.id,
      });
      chrome.browserAction.setBadgeText({
        text: PHISH_LABEL,
        tabId: tab.id,
      });
    });
  }
}

function messageListener(message, sender, sendResponse) {
  // log stuff
  function sendTabMessage(response) {
    chrome.tabs.sendMessage(sender.tab.id, response);
  }
  // DANGER ZONE ASSUMPTION: ignore iFrames
  if (sender.frameId > 0) {
    return;
  }
  listenerActionMap[message.action](message, sender, sendTabMessage);
}

async function initBackground() {
  // log platformInfo
  chrome.runtime.getPlatformInfo(function(info) {
    sendLog(
      'PROTEGO_INIT',
      {
        platform_os: info['os'],
        platform_arch: info['arch'],
        platform_nacl_arch: info['nacl_arch'],
      },
      protegoVersion,
    );
  });
  // Check whether new version is installed
  chrome.runtime.onInstalled.addListener(async function(details) {
    enumerateExtensions();
    if (details.reason == 'install') {
      debugLog('installation mode');
      sendLog(
        'PROTEGO_DEBUG',
        {
          action: 'installation',
        },
        protegoVersion,
      );
    }
    if (details.reason == 'update') {
      protegoVersion = chrome.runtime.getManifest().version;
      sendLog(
        'PROTEGO_DEBUG',
        {
          action: 'update',
        },
        protegoVersion,
      );
    }
  });
  primeHashes();
  // only enable webRequest logging for cros
  chrome.runtime.getPlatformInfo(function(info) {
    if (info.os === 'cros') {
      var filters = {
        urls: ['<all_urls>'],
        types: [
          'main_frame',
          'sub_frame',
          'stylesheet',
          'script',
          'image',
          'font',
          'object',
          'ping',
          'csp_report',
          'media',
          'websocket',
          'other',
        ],
      };
      chrome.webRequest.onCompleted.addListener(onWebRequest, filters);
    }
  });
  // initialize listeners
  // chrome extensions
  chrome.management.onInstalled.addListener(onInstalledExtension);
  chrome.management.onUninstalled.addListener(onUninstalledExtension);
  chrome.management.onEnabled.addListener(onEnabledExtension);
  chrome.management.onDisabled.addListener(onDisabledExtension);

  chrome.contextMenus.onClicked.addListener(onContextMenuClick);
  chrome.runtime.onMessage.addListener(messageListener);
  chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && cooldownCounter < 10) {
      cooldownCounter++;
      if (cooldownCounter === 10 && logCooldown) {
        logCooldown = false;
      }
      await onNewPage(tab);
    }
  });
  chrome.tabs.onRemoved.addListener(function(tabId) {
    delete pages[tabId];
  });
}

function getOptionsData() {
  var result = {sites: {}, settings: {}};
  return new Promise(resolve => {
    chrome.storage.local.get(null, function(data) {
      let hashes = data.hashes;
      let settings = data.settings;
      // find out if each site is protected or not
      for (let index in hashes) {
        result.sites[index] = hashes[index].hasOwnProperty('hash');
      }
      // settings
      result.settings = data.settings;
      resolve(result);
    });
  });
}

function enumerateExtensions() {
  chrome.management.getAll(extensions => {
    for (var key in extensions) {
      sendLog(
        'PROTEGO_CHROME_EXTENSIONS',
        prepareExtensionItem('ext_found', extensions[key]),
        protegoVersion,
      );
    }
  });
}

var isListeningAjax = false;
var onBeforeAjaxRequest;
var onCompletedAjaxRequest;

module.exports = {displayDownloadWarning, initBackground};
