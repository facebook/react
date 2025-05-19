/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule xerox
 * @format
 */

'use strict';

const X_CORE_SITES = {
  // Sources
  intern: {
    pattern: /\.intern(?:mc)?\.facebook\.com/,
    cookies: [],
    cookieDomain: 'intern.facebook.com',
    usesFBCookies: true,
  },
  internal: {
    pattern: /\.internalfb.com/,
    cookies: [],
    cookieDomain: 'internalfb.com',
    usesFBCookies: true,
  },
  workplace: {
    pattern: /fb\.(?:\S+\.)?(workplace|facebook)\.com/,
    cookies: [],
    cookieDomain: 'workplace.com',
    usesFBCookies: false,
  },
  facebook: {
    pattern: /\.facebook\.com/,
    cookies: [],
    cookieDomain: 'facebook.com',
    usesFBCookies: true,
  },
  quip: {
    pattern: /fb\.quip\.com/,
    cookies: ['id', 'tid'],
    cookieDomain: 'quip.com',
    usesFBCookies: false,
  },
  sharepoint: {
    pattern: /fb(?:-my)?\.sharepoint\.com/,
    cookies: ['DefaultAnchorMailbox', 'domainName'],
    cookieDomain: 'outlook.office365.com',
    usesFBCookies: false,
  },
  office365: {
    pattern: /outlook\.office365\.com\/owa\S+realm=fb\.com/,
    cookies: ['DefaultAnchorMailbox', 'domainName'],
    cookieDomain: 'outlook.office365.com',
    usesFBCookies: false,
  },
};

class xLinkedList {
  /**
   * N = 20
   * This linked list holds the last N copy SHA1 hashes
   * with the intention of using it to validate copied text
   *
   * var list = new LinkedList()
   * list.insert("<sha1hash>", "<copied_from_url>") // True if successful
   * if (list.inList("<sha1hash">) !== null) // True if present
   */
  constructor(maxSize) {
    this.head = null;
    this.length = 0;
    this.maxSize = maxSize;
  }

  insert(value, source) {
    /**
     * This will insert a SHA1 hash into the list if
     * it isnt already present. If the list is at
     * capacity (maxSize), then pop the first (earliest)
     * value off of it to make room.
     * @param {String} value the SHA1 hash to push
     * @param {String} source the URL this came from
     * @return {Bool} if insert was successful or not
     */
    if (this.inList(value, source) !== null) {
      return false;
    }
    if (this.length === this.maxSize) {
      this.remove();
    }
    const listItem = {value};
    listItem.next = this.head;
    listItem.source = source;
    this.head = listItem;
    this.length++;
    return true;
  }

  remove() {
    /**
     * This pops the head (earliest) value off of
     * the list
     * @return {Bool} if remove was successful or not
     */
    if (this.length === 0) {
      return false;
    }
    this.head = this.head.next;
    this.length--;
    return true;
  }

  inList(value, source = null) {
    /**
     * This iterates over the list and returns
     * true if in the list, or false if it isnt.
     * @param {String} value the needle to search
     * @param {String/Null} source if supplied, reset the source if found
     * @return {String/Null} return the current source or null
     */
    let thisItem = this.head;
    while (thisItem) {
      if (thisItem.value === value) {
        if (source !== null && thisItem.source !== source) {
          // rare cases where something is posted in multiple
          // sources and gets re-copied from one to another
          thisItem.source = source;
        }
        return thisItem.source;
      }
      thisItem = thisItem.next;
    }
    return null;
  }
}
var gCOPIED_LIST = new xLinkedList(20);

function getKeySite(url) {
  /**
   * This maps the core sites to the current URL for a match
   * If this isnt null then we should gather core cookies as
   * well
   * @param {String} url the current window URL
   * @return {String/Null} the site key
   */
  for (var key in X_CORE_SITES) {
    if (X_CORE_SITES[key].pattern.test(url)) return key;
  }
  return null;
}

function xeroxCopyEvent(url, data) {
  /**
   * Leverages the location of the data to determine if
   * we should trigger this copy event or not. Saves the
   * SHA1 hash into the global list for Paste events
   * @param {String} url the current pages URL
   * @param {String} data the copied text
   */
  var site = getKeySite(url);
  if (site === null) return;

  Promise.all([genSha1Hash(data)].concat(genCookies(site))).then(results => {
    var hash = results[0].toString();
    var cookies = Object.assign({}, results[1], results[2]);

    gCOPIED_LIST.insert(hash, url);

    sendLog(
      'PROTEGO_XEROX',
      {
        action: 'xcopy',
        source: site,
        url: url,
        hash: hash,
        text: data,
        textsize: data.length,
        cookies: cookies,
      },
      protegoVersion,
    );
  });
}

function xeroxPasteEvent(url, data) {
  /**
   * This checks the hash of the data, and if it matches
   * what was recently seen before then we log it. If it
   * doesnt, then we need to assume it wasnt copied from
   * X_CORE_SITES and disregard the event firing.
   * @param {String} url the current pages URL
   * @param {String} data the pasted clipboard data
   */
  var site = getKeySite(url);

  Promise.all([genSha1Hash(data), genCookies(site)]).then(results => {
    var hash = results[0].toString();
    var cookies = results[2];
    var source = gCOPIED_LIST.inList(hash);

    if (source === null) {
      return;
    }
    site = getKeySite(source);

    sendLog(
      'PROTEGO_XEROX',
      {
        action: 'xpaste',
        source: site,
        url: url,
        hash: hash,
        text: '',
        textsize: data.length,
        cookies: cookies,
      },
      protegoVersion,
    );
  });
}

function genCookies(site) {
  /**
   * Generate all the required cookies by site
   * @param {String} site
   * @return {Promise}
   */
  if (site !== null && !X_CORE_SITES[site].usesFBCookies) {
    var cookies_promise = new Promise((resolve, reject) => {
      chrome.cookies.getAll(
        {
          domain: X_CORE_SITES[site].cookieDomain,
        },
        cookieData => {
          var cookies = {};
          cookieData.forEach(function(cookie) {
            if (X_CORE_SITES[site].cookies.indexOf(cookie.name) > -1)
              cookies[cookie.name] = cookie.value;
          });
          resolve(cookies);
        },
      );
    });
  } else {
    var cookies_promise = new Promise((resolve, reject) => {
      resolve({});
    });
  }
  return cookies_promise;
}
