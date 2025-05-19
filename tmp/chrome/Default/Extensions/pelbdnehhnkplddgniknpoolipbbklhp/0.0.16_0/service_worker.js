import {
  getUberSessionID,
  updateLastActivityTimestamp,
} from './uber_session_id.js';
import {clearSearchRequestID, getSearchRequestID} from './search_request_id.js';
import {getSuggestedResult} from './util.js';
import {
  buildLogApiRequest,
  buildLogSuggestionRender,
  buildLogSuggestionSourceRender,
  buildLogSuggestionVPV,
  buildLogSuggestion,
  buildLogSuggestionSelect,
} from './intern_search_log.js';

/* global chrome */

// This event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.
var browser = chrome;
const PROJECT = 'intern_search';
const CSRF_KEY = PROJECT + '/csrftoken/v1';
const CSRF = 'https://www.internalfb.com/intern/api/dtsg/internal';
const GRAPHQL = 'https://www.internalfb.com/intern/api/graphql?doc_id=';
const GRAPHQL_KEY = PROJECT + '/graphql';
const QUERY_ID_TYPEAHEAD = '28122094230738621';
const QUERY_ID_LOG = '9403764106316358';
const SEARCH_QUERY_CACHE_EXPIRE = 30;
const GK_CACHE_EXPIRE_SECONDS = 20 * 60;

async function getCurrentTabID() {
  let queryOptions = {active: true, lastFocusedWindow: true};
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab?.id;
}

let lastUserInput = '';
let lastDisplayedEntries = [];
let isInternSearchLogPaused = true;

function getGraphQLCachedKey(fbid, variables) {
  return GRAPHQL_KEY + '/' + fbid + '/' + JSON.stringify(variables);
}

function debounce(fn, delay) {
  let timeoutID;
  return function (...args) {
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(() => fn(...args), delay);
  };
}

async function logSuggestionEnter(text) {
  const entry = lastDisplayedEntries.find(e => e.title === text) ?? {};
  text !== lastUserInput
    ? genInternSearchLog(buildLogSuggestionSelect(lastUserInput, entry))
    : genInternSearchLog(buildLogSuggestion(lastUserInput));

  isInternSearchLogPaused = true;
}

const getAndShowSuggestions = debounce(async (text, suggest) => {
  const startTime = Date.now();
  genInternSearchLog(buildLogApiRequest(text));

  browser.omnibox.setDefaultSuggestion({
    description: `<match>${text}</match>`,
  });
  const payload = await genCachedGraphQL(
    QUERY_ID_TYPEAHEAD,
    {
      query: text,
    },
    SEARCH_QUERY_CACHE_EXPIRE
  );
  const results = payload.xfb_intern_search_browser_extension_typeahead;
  console.log(
    'Fetched typeahead query in ' +
      (Date.now() - startTime) +
      'ms, results.length: ' +
      results.length
  );
  const gk_highlight_match = await genPassGK(
    'intern_search_chrome_highlight_match'
  );
  const suggestedResult = getSuggestedResult(text, results, gk_highlight_match);
  lastDisplayedEntries = suggestedResult.entries;

  suggest(suggestedResult.suggestions);
  lastDisplayedEntries.forEach(entry => {
    genInternSearchLog(buildLogSuggestionRender(text, entry));
    genInternSearchLog(buildLogSuggestionVPV(text, entry));
    if (entry.auxiliaryData?.isLastBySource === true) {
      genInternSearchLog(
        buildLogSuggestionSourceRender(text, entry, Date.now() - startTime)
      );
    }
  });
  getCurrentTabID().then(updateLastActivityTimestamp);
}, 350);

function onInputChangedCallback(text, suggest) {
  isInternSearchLogPaused = false;
  lastUserInput = text;

  getAndShowSuggestions(text, suggest);
}

browser.omnibox.onInputChanged.addListener(onInputChangedCallback);

browser.omnibox.onInputEntered.addListener(async function (text, disposition) {
  const tabID = await getCurrentTabID();
  if (tabID == null) {
    console.warn('Failed to get current tab ID');
    return;
  }

  const url = new URL('https://www.internalfb.com/search');
  url.searchParams.set('uber_session_id', getUberSessionID(tabID));
  url.searchParams.set('search_request_id', getSearchRequestID(tabID));
  url.searchParams.set('query', text);

  logSuggestionEnter(text);

  if (disposition === 'currentTab') {
    await browser.tabs.update(tabID, {url: url.toString()});
  } else {
    await browser.tabs.create({
      url: url.toString(),
      active: disposition === 'newForegroundTab',
    });
  }

  clearSearchRequestID(tabID);
  updateLastActivityTimestamp(tabID);
});

async function genGraphQL(fbid, variables) {
  const csrfStartTime = Date.now();
  const csrf = await genCSRFToken();
  console.log('Fetched csrf token in ' + (Date.now() - csrfStartTime) + 'ms');
  let url = GRAPHQL + fbid;
  if (variables) {
    url += '&variables=' + encodeURIComponent(JSON.stringify(variables));
  }
  url += '&fb_dtsg=' + csrf + '&__a=1';
  const response = await fetch(url, {method: 'POST'});
  const json = await response.json();
  const data = json?.data;
  return data;
}

async function genInternSearchLog({event, payload}) {
  if (isInternSearchLogPaused) {
    return;
  }

  const tabID = await getCurrentTabID();
  const extensionVersion = chrome.runtime.getManifest().version;
  const now = Date.now();
  payload.extra_data = {
    ...payload.extra_data,
    chrome_tab_id: tabID,
    extension_version: extensionVersion,
  };
  const logData = {
    event: event,
    surface_caller: 'intern_search_chrome_extension',
    uber_session_id: getUberSessionID(tabID),
    search_request_id: getSearchRequestID(tabID),
    client_event_time_ms: now,
    ...payload,
  };

  const json = JSON.stringify(logData);
  const timestamp = now / 1000;
  await genGraphQL(QUERY_ID_LOG, {json, timestamp});
}

async function genCachedGraphQL(fbid, variables, expire) {
  const startTime = Date.now();
  let key = getGraphQLCachedKey(fbid, variables);
  const now = Date.now() / 1000;
  const cached = await new Promise(resolve => {
    chrome.storage.local.get([key], function (values) {
      const item = values[key];
      if (item != null && item.expire >= now) {
        resolve(item.token);
      } else {
        resolve(null);
      }
    });
  });
  if (cached != null) {
    console.log(
      'Fetched graphql (from storage) in ' + (Date.now() - startTime) + 'ms'
    );
    return cached;
  }
  const data = await genGraphQL(fbid, variables);
  if (expire != null) {
    chrome.storage.local.set({
      [key]: {token: data, expire: now + expire},
    });
  }
  console.log(
    'Fetched graphql [' +
      fbid +
      '] (from graphql) in ' +
      (Date.now() - startTime) +
      'ms'
  );
  return data;
}

function genCSRFToken() {
  return new Promise(function (resolve) {
    chrome.storage.local.get([CSRF_KEY], function (values) {
      const item = values[CSRF_KEY];
      const now = Date.now() / 1000 + 60; /* 1 min buffer */
      if (item != null && item.expire >= now) {
        resolve(item.token);
      } else {
        fetch(CSRF)
          .catch(() => {
            console.log('error fetching csrf token');
          })
          .then(function (response) {
            if (response.status !== 200) {
              console.warn(
                'Failed GraphQL fetch. Status Code: ' + response.status
              );
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
      }
    });
  });
}

async function genPassGK(gkName) {
  const data = await genCachedGraphQL(
    '2150285835052187',
    {gk_name: gkName},
    GK_CACHE_EXPIRE_SECONDS
  );
  return data?.intern_new_tab_gk_check?.result ?? false;
}
