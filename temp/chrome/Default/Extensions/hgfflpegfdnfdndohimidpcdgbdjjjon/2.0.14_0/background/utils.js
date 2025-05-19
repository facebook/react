/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * shared utility functions
 * @providesModule utils
 * @format
 */

'use strict';

const URL_BASE = 'https://www.internalfb.com/';

/**
 * Replace dots in an IP/URL with [.]
 * @param string
 * @returns {string}
 */
function defang(string) {
  return string.replace(/\./g, '[.]');
}

function prepareExtensionItem(action, extension) {
  var output = {};
  for (var key in extension) {
    if (key === 'isApp') {
      continue;
    } else if (Array.isArray(extension[key])) {
      output[camelCaseToSnakeCase(key)] = JSON.stringify(extension[key]);
    } else {
      output[camelCaseToSnakeCase(key)] = extension[key];
    }
  }
  output['action'] = action;
  return output;
}

function prepareDownloadItem(action, downloadItem) {
  var output = {};
  for (var key in downloadItem) {
    if (key == 'startTime' || key == 'endTime' || key == 'estimatedEndTime') {
      output[camelCaseToSnakeCase(key)] = Math.round(
        Date.parse(downloadItem[key]) / 1000,
      );
    } else if (key == 'trippedPolicies') {
      output[camelCaseToSnakeCase(key)] = JSON.stringify(downloadItem[key]);
    } else {
      output[camelCaseToSnakeCase(key)] = downloadItem[key];
    }
  }
  output['action'] = action;
  return output;
}

function prepareWebRequests(requestCache) {
  var output = [];
  for (var i in requestCache) {
    var log = {};
    log.initiator = requestCache[i].initiator;
    log.ip_address = requestCache[i].ip;
    log.method = requestCache[i].method;
    log.status_code = requestCache[i].statusCode;
    log.timestamp = Math.round(requestCache[i].timeStamp);
    log.type = requestCache[i].type;
    log.url = requestCache[i].url;
    output.push(log);
  }
  return output;
}

function camelCaseToSnakeCase(string) {
  var out = string
    .replace(/(?:^|\.?)([A-Z])/g, function(x, y) {
      return '_' + y.toLowerCase();
    })
    .replace(/^_/, '');
  return out;
}

/**
 * Puts defanged data onto the clipboard
 * @param info
 * @param tab
 * @returns {void}
 */
function defangCopy(info, tab) {
  let selection = info.selectionText;
  document.addEventListener('copy', function(e) {
    e.clipboardData.setData('text/plain', defang(selection));
    e.preventDefault(); // default behaviour is to copy any selected text
  });
  document.execCommand('copy');
}

/**
 * Returns protocol://domain.name:port for valid URLs
 * @param url
 * @returns {string|*}
 */
function originFromURL(url) {
  var parser = document.createElement('a');
  parser.href = url;
  return parser.origin;
}

/**
 * Return the path from a given URL
 * @param url
 * @returns {string}
 */
function pathFromURL(url) {
  let parser = document.createElement('a');
  parser.href = url;
  return parser.origin + parser.pathname;
}

/**
 * Return the domain from a given URL
 * @param url
 * @returns {string}
 */
function domainFromUrl(url) {
  let parser = document.createElement('a');
  parser.href = url;
  return parser.host;
}

/**
 * Determines whether we're running a debug build or not
 * @returns {boolean}
 */
function isDebug() {
  return chrome.runtime.id !== EXTENSION_ID;
}

/**
 * A logging utility that will write to console only if in debug mode
 * @param message
 * @returns {void}
 */
function debugLog(message) {
  if (isDebug()) {
    console.log(message);
  }
}

/**
 * Send a log back to the Protego logging endpoint
 * @param credential_type
 * @param target
 * @param version
 * @param action
 * @returns {Promise}
 */
function sendLog(log_type, logs, protego_version) {
  return new Promise((resolve, reject) => {
    getCSRF().then(token => {
      var http = new XMLHttpRequest();
      var url = URL_BASE + 'intern/security/protego/log';
      var params =
        'fb_dtsg=' +
        token +
        '&__a=1&log_type=' +
        log_type.toLowerCase() +
        '&protego_version=' +
        protego_version +
        '&logs=';
      http.open('POST', url, true);
      http.setRequestHeader(
        'Content-type',
        'application/x-www-form-urlencoded',
      );
      http.onreadystatechange = () => {
        if (http.readyState == 4 && http.status == 200) {
          resolve(http.responseText);
        } else if (http.status != 200) {
          reject(http.status);
        }
      };
      http.send(params + encodeURIComponent(JSON.stringify(logs)));
    });
  });
}

/**
 * Delete the cookies for Facebook, causing the user to log out
 * @returns {Promise}
 */
function deleteSiteCookies() {
  return new Promise((resolve, reject) => {
    for (var site in SITES) {
      chrome.cookies.getAll(
        {
          url: SITES[site]['cookieDomain'],
          name: 'xs',
        },
        function(cookies) {
          for (var i = 0; i < cookies.length; i++) {
            chrome.cookies.remove({
              url: SITES[site]['cookieDomain'],
              name: cookies[i].name,
            });
          }
        },
      );
    }
    resolve();
  });
}

/**
 * Builds out the data structures in local storage for expected site hashes
 * @returns {Promise}
 */
function primeHashes() {
  return new Promise((outerResolve, outerReject) => {
    // prime the hash list
    chrome.storage.local.get('hashes', function(data) {
      var hashes = data.hashes;
      if (hashes === undefined) {
        hashes = {};
      }

      for (var key in SITES) {
        if (hashes[key] === undefined) {
          hashes[key] = {};
        }
      }
      chrome.storage.local.set({hashes: hashes});

      for (let siteName in SITES) {
        const siteHash = hashes[siteName];
        if (siteHash.length === undefined) continue;
        passwordLengths.add(siteHash.length);
        maxPasswordLength = Math.max(siteHash.length, maxPasswordLength);
        minPasswordLength = Math.min(siteHash.length, minPasswordLength);
      }
    });
    outerResolve();
  });
}

/**
 * Get the settings object from storage, or build it if not already set
 * @returns {Promise}
 */
function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('settings', function(result) {
      if (result === undefined || Object.entries(result).length === 0) {
        var settings = {
          enableDefangCopyContextMenu: false,
        };
        chrome.storage.local.set({settings: settings}, resolve(settings));
      } else {
        resolve(result.settings);
      }
    });
  });
}

/**
 * Truncate a string, and append ...
 * @param n
 * @returns {string}
 */
String.prototype.trunc =
  String.prototype.trunc ||
  function(n) {
    return this.length > n ? this.substr(0, n - 1) + '&hellip;' : this;
  };

/**
 * This hashes the data with the SHA1 algorithm. It is more
 * collision-resistant than hashData and decently fast.
 * @param {String} data the message to hash
 * @return {Promise} a promise of the SHA1 hash
 */
function genSha1Hash(data) {
  return crypto.subtle
    .digest('SHA-1', new TextEncoder('utf-8').encode(data))
    .then(rawbytes => {
      return Array.prototype.map
        .call(new Uint8Array(rawbytes), h => ('00' + h.toString(16)).slice(-2))
        .join('');
    });
}

const CSRF = URL_BASE + 'intern/api/dtsg/internal';
const CSRF_KEY = 'protego/csrftoken';

function _genCSRFToken(CSRF_KEY) {
  return new Promise(function(resolve) {
    chrome.storage.local.get([CSRF_KEY], function(values) {
      const item = values[CSRF_KEY];
      const now = Date.now() / 1000 + 60;
      if (item != null && item.expire >= now) {
        resolve(item.token);
      }
      fetch(CSRF).then(function(response) {
        if (response.status !== 200) {
          debugLog('Failed fetch. Status Code: ' + response.status);
          resolve(null);
        }
        response.text().then(function(text) {
          if (text == null) {
            debugLog('Failed to get CSRF token');
            resolve(null);
          }
          const token = JSON.parse(text.slice(9));
          chrome.storage.local.set({[CSRF_KEY]: token});
          resolve(token.token);
        });
      });
    });
  });
}

// memoize up to 2hrs so we only send one csrf request at a time
let _memo = null;
let _memoTime = null;
function getCSRF() {
  const now = Date.now() / 1000;
  if (_memo === null || _memoTime <= now) {
    debugLog('Fetching CSRF token from endpoint');
    _memo = _genCSRFToken(CSRF_KEY);
    _memoTime = now + 7200;
  }
  return _memo;
}

module.exports = {sendLog, prepareDownloadItem};
