const CSRF = 'https://www.internalfb.com/intern/api/dtsg/internal';
const CSRF_KEY = 'newtabext/csrftoken/v1';
const VERSION = chrome.runtime.getManifest().version;

// Can't use fetch() API since it sets the Origin header wrong :(
function xhr(url) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();

    xhr.open('POST', url);

    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.responseType = '';

    xhr.onerror = function () {
      reject(new Error('error'));
    };

    xhr.onload = function () {
      // do something with response
      let res = xhr.response;
      resolve(res);
    };

    // send request
    xhr.send();
  });
}

function _genCSRFToken(CSRF_KEY) {
  return new Promise(function (resolve) {
    chrome.storage.local.get([CSRF_KEY], function (values) {
      const item = values[CSRF_KEY];
      const now = Date.now() / 1000 + 60;
      if (item != null && item.expire >= now) {
        resolve(item.token);
        return;
      }
      console.log('Fetching CSRF token from endpoint');
      fetch(CSRF).then(function (response) {
        if (response.status !== 200) {
          console.warn('Failed GraphQL fetch. Status Code: ' + response.status);
          resolve(null);
        }
        response.text().then(function (text) {
          if (text == null) {
            console.warn('Failed to get CSRF token');
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
    _memo = _genCSRFToken(CSRF_KEY);
    _memoTime = now + 7200;
  }
  return _memo;
}

async function genLog(event, action) {
  // TODO T138174030 Convert background to use modules to share genLog
  const csrf = await getCSRF();
  const logURI = getGraphQLURI(
    '1942031559258123',
    action ? {event, action, VERSION} : {event, VERSION},
    csrf
  );
  await xhr(logURI);
}

async function genGKResult(gkName) {
  const csrf = await getCSRF();
  const gkURI = getGraphQLURI('2150285835052187', {gk_name: gkName}, csrf);
  const result = await xhr(gkURI);
  return JSON.parse(result).data.intern_new_tab_gk_check.result === true;
}

function copyToClipboard(shortlink) {
  document.body.innerHTML =
    '<p><a href="' +
    shortlink +
    '" target="_blank" ></a><input type="text" id="shortlink" size=25 value="' +
    shortlink +
    '"></form></p>';
  document.getElementById('shortlink').select();
  document.execCommand('Copy', false, null);
}

function copyTextToClipboard(text) {
  document.body.innerHTML =
    '<p><input type="text" id="copyText" size=25 value="' +
    text +
    '"></form></p>';
  document.getElementById('copyText').select();
  document.execCommand('Copy', false, null);
}

function getGraphQLURI(docid, variables, csrf) {
  return `https://www.internalfb.com/intern/api/graphql?doc_id=${docid}&variables=${encodeURIComponent(
    JSON.stringify(variables)
  )}&fb_dtsg=${csrf}&__a=1`;
}

function genFBUrl(url) {
  return getCSRF()
    .then(function (csrf) {
      const graphql = getGraphQLURI('9291840227543151', {url}, csrf);
      return xhr(graphql);
    })
    .then(function (response) {
      const json = JSON.parse(response);
      if (json.error) {
        console.warn('Failed GraphQL fetch. Status Code: ' + json.error);
        return null;
      }
      return json != null ? json.data : null;
    })
    .then(function (response) {
      return 'https://fburl.com/' + response.create_fb_url.fb_url.string_key;
    });
}

function shortenUrl(url) {
  genFBUrl(url).then(fburl => {
    copyToClipboard(fburl);
    chrome.notifications.create(
      'fburl_creation_completed',
      {
        type: 'basic',
        title: 'fburl was copied to your clipboard',
        message: fburl + ' is a short link for ' + url,
        iconUrl: 'icon.png',
        isClickable: false,
      },
      function (notification_id) {
        // clear the notification after 3 seconds
        window.setTimeout(function () {
          chrome.notifications.clear(notification_id, function () {});
        }, 3000);
      }
    );
  });
}

function wut(input) {
  window.open(
    'https://www.internalfb.com/intern/wut/word/?word=' + input,
    '_blank'
  );
}

async function createToDo(text) {
  const csrf = await getCSRF();
  const docid = '2819119511474744';
  const graphql = getGraphQLURI(docid, {text}, csrf);
  await xhr(graphql);
  chrome.notifications.create(
    'todo_creation_completed',
    {
      type: 'basic',
      title: 'A To Do item was created',
      message: text,
      iconUrl: 'icon.png',
      isClickable: false,
    },
    function (notification_id) {
      // clear the notification after 3 seconds
      window.setTimeout(function () {
        chrome.notifications.clear(notification_id, function () {});
      }, 3000);
    }
  );
}

async function createPaste(input) {
  const csrf = await getCSRF();
  const docid = 5673899892637208;
  const graphql = getGraphQLURI(docid, {input}, csrf);
  const response = await xhr(graphql);
  const json = JSON.parse(response);
  if (json.error && json != null && json.data != null) {
    console.warn('Failed to create paste: ' + json.error);
    return null;
  }
  copyTextToClipboard(json.data.xfb_intern_create_paste.paste_id);
  chrome.notifications.create(
    'create_paste_completed',
    {
      type: 'basic',
      title:
        json.data.xfb_intern_create_paste.paste_id +
        ' was copied to your clipboard',
      message: input,
      iconUrl: 'icon.png',
      isClickable: false,
    },
    function (notification_id) {
      // clear the notification after 3 seconds
      window.setTimeout(function () {
        chrome.notifications.clear(notification_id, function () {});
      }, 3000);
    }
  );
}

async function quickSearch(menuItemId, queryText) {
  let targetURL = null;
  if (menuItemId == 'quick_search_internalfb') {
    targetURL = 'https://www.internalfb.com/search?query=' + queryText;
  } else if (menuItemId == 'quick_search_workplace') {
    targetURL = 'https://fb.workplace.com/search/top/?q=' + queryText;
  }
  if (targetURL != null) {
    chrome.tabs.create({url: targetURL});
  }
}

function onClickHandler(info, tab) {
  if (info.menuItemId == 'page') {
    shortenUrl(info.pageUrl);
  } else if (info.menuItemId == 'link') {
    shortenUrl(info.linkUrl);
  } else if (info.menuItemId == 'todo') {
    createToDo(info.selectionText);
  } else if (info.menuItemId == 'wut') {
    wut(info.selectionText);
  } else if (info.menuItemId == 'create_paste') {
    createPaste(info.selectionText);
  } else if (
    ['quick_search_internalfb', 'quick_search_workplace'].includes(
      info.menuItemId
    )
  ) {
    quickSearch(info.menuItemId, info.selectionText);
  }
  genLog('contextMenuClick', info.menuItemId);
}

async function start() {
  chrome.contextMenus.onClicked.addListener(onClickHandler);
  chrome.contextMenus.create({
    title: 'Copy FBUrl to current page',
    contexts: ['page'],
    id: 'page',
  });
  chrome.contextMenus.create({
    title: 'Copy FBUrl for the link',
    contexts: ['link'],
    id: 'link',
  });
  chrome.contextMenus.create({
    title: 'Add a To Do',
    contexts: ['selection'],
    id: 'todo',
  });
  chrome.contextMenus.create({
    title: 'Create a Paste',
    contexts: ['selection'],
    id: 'create_paste',
  });
  chrome.contextMenus.create({
    title: 'Wut?',
    contexts: ['selection'],
    id: 'wut',
  });
  const isPassingQuickSearchGK = await genGKResult(
    'intern_tab_context_menu_quick_search'
  );
  if (isPassingQuickSearchGK) {
    chrome.contextMenus.create({
      title: 'Search in InternalFB',
      contexts: ['selection'],
      id: 'quick_search_internalfb',
    });
    chrome.contextMenus.create({
      title: 'Search in Workplace',
      contexts: ['selection'],
      id: 'quick_search_workplace',
    });
  }
  chrome.browserAction.onClicked.addListener(function (tab) {
    shortenUrl(tab.url);
  });

  chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
      // Handle fburl, make sure it has an argument
      if (details.url.startsWith('https://fburl.com/')) {
        // If it has no argument, go to the main page
        if (details.url === 'https://fburl.com/') {
          return {redirectUrl: 'https://www.internalfb.com/intern/fburl/'};
        }
        return {
          redirectUrl: details.url.replace(
            'https://fburl.com/',
            'https://www.internalfb.com/intern/fburl/redirect/?s='
          ),
        };
      }
    },
    {
      urls: ['*://fburl.com/*'],
      types: ['main_frame'],
    },
    ['blocking']
  );
}

start();
