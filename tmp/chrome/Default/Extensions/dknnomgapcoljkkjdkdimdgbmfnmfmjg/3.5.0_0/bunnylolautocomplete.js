// @author dannymiller
'use strict';

// This event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.

String.prototype.encodeHTML = function () {
  return this.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

var browser = chrome;
const SOURCE_URL = 'https://www.internalfb.com/';

// Code to fetch bunnylol locally, whole thing is only around 160kb...
const FETCH_BUNNY_CACHE_INTERVAL_SECONDS = 60 * 60 * 6; // set to 6 hours
var bunny_cmd_cache = null;
var command_mapping = {};
var controller = new AbortController();
async function download() {
  controller.abort();
  controller = new AbortController();
  return fetch(SOURCE_URL + '/intern/bunny_suggestions', {
    signal: controller.signal,
  })
    .then(r => r.json())
    .then(result => {
      bunny_cmd_cache = result;
      return bunny_cmd_cache;
    });
}
async function delay(ms) {
  // return await for better async stack trace support in case of errors.
  return await new Promise(resolve => setTimeout(resolve, ms));
}
let run = async () => {
  download();
  await delay(FETCH_BUNNY_CACHE_INTERVAL_SECONDS * 1000);
};
run();

//const I_NAME = 1, I_DESC = 2, I_URL = 3, I_MAU = 4;
const I_NAME = 'name',
  I_DESC = 'description',
  I_URL = 'url',
  I_MAU = 'mau';
async function fetchSuggestions(txt) {
  if (bunny_cmd_cache === null) {
    // recursive may be a bit weird.. probably could clean this up
    return download().then(() => fetchSuggestions(txt));
  } else {
    let word_regex = new RegExp('(?:^|\\W)' + txt, 'i');

    const filtered = bunny_cmd_cache.filter(item => {
      return (
        item[I_NAME].startsWith(txt.toLowerCase()) ||
        item[I_DESC].match(word_regex)
      );
    });
    /*
     * Now for an important pass thru -
     * If query is `t` , we don't want the first 10 suggestions to be the
     * same command. So we want to move the top one from each command to be
     * sorted to the top first...
     * Algorithm is pretty basic. For every new bunnylol class seen,
     * move it to a vec
     * At the end, concat that vec with what's left.
     */
    let prev_mau = -1;
    const to_shuffle_to_top = [];
    const reshuffled_items = [];
    for (const item of filtered) {
      const cur_mau = item[I_MAU];
      if (txt === item[I_NAME]) {
        // add exact match to tipity top no matter the popularity
        to_shuffle_to_top.unshift(item);
      } else if (cur_mau !== prev_mau) {
        prev_mau = cur_mau;
        to_shuffle_to_top.push(item);
      } else {
        reshuffled_items.push(item);
      }
    }
    return to_shuffle_to_top.concat(reshuffled_items);
  }
}

browser.omnibox.onInputStarted.addListener(function () {
  genLog('bunny_suggestions_started');
  /**
    Unfortunately, there doesn't seem to be a way to auto populate the suggest
    fields when the extension starts.
    Otherwise would do it here...
    */
});
var debug = null;
browser.omnibox.onInputChanged.addListener(function (text, suggest) {
  if (text.length > 0) {
    // technically, if someone searches for "<" or ">"
    // that won't be highlighted since it's encoded.
    // not sure if that's a big deal really
    browser.omnibox.setDefaultSuggestion({
      description:
        '<match>Loading...</match>Press \u{21B5} to run ' +
        '<match>bunnylol</match> command <match>' +
        text.encodeHTML() +
        '</match>',
    });
  }
  function createSuggestionItem(result) {
    const item_url = result[I_URL].encodeHTML();
    const raw_text = result[I_NAME].encodeHTML();
    command_mapping[raw_text] = item_url;
    const item_name = raw_text.replace(text, '<match>' + text + '</match>');
    const item_desc = result[I_DESC].encodeHTML()
      .replace(
        new RegExp('(' + text + ')', 'i'),
        '</dim><match>$1</match><dim>'
      )
      .replace(/\s{2,}/, ' ');
    const description = item_name + ' - <dim>' + item_desc + '</dim>';
    return {content: raw_text, description: description};
    // Adding space so that exact match still shows...
  }
  fetchSuggestions(text).then(results => {
    let res = [];
    for (const result of results) {
      res.push(createSuggestionItem(result));
      // chrome only can show 5 suggestions, but will hide any that have
      // "exact" match, hence why 6 is chosen below
      if (res.length >= 6) {
        break;
      }
    }
    debug = res;
    if (res.length > 0 && res[0].content === text) {
      browser.omnibox.setDefaultSuggestion({
        description: res[0]['description'],
      });
    } else if (text.length > 0) {
      browser.omnibox.setDefaultSuggestion({
        description:
          '<match>Press \u{21B5}</match> to run <match>bunnylol</match> ' +
          'command <match>' +
          text.encodeHTML() +
          '</match>',
      });
    } else {
      res = getRandom(results, 5).map(createSuggestionItem);
      browser.omnibox.setDefaultSuggestion({
        description:
          '<match>Start typing a bunnylol command. ' +
          'Below are some random ones</match>',
      });
    }
    suggest(res);
  });
});
browser.omnibox.onInputEntered.addListener(function (text) {
  browser.tabs.query({active: true}, function (tab) {
    let url = text;
    // for privacy reasons let's not pass this up unless it matches
    let report = 'unknown';
    if (text in command_mapping) {
      url = command_mapping[text];
      report = text;
    } else {
      url =
        'https://www.internalfb.com/intern/bunny/?q=' +
        encodeURIComponent(text);
    }
    genLog('bunny_suggestions_selected', report);
    browser.tabs.update(tab.id, {url: url});
  });
});

/*
 * From https://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array/38571132
 */
function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError('getRandom: more elements taken than available');
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

// Code to send logs, since this is a background script I've got to copy
// and paste code from the src directory.
// TODO: figure out how to share the code

const ROOT = 'https://www.internalfb.com/intern/api/graphql?doc_id=';

function genGraphQL(fbid, variables) {
  return _genCSRFToken(CSRF_KEY)
    .then(csrf => {
      let url = ROOT + fbid;
      if (variables) {
        url += '&variables=' + encodeURIComponent(JSON.stringify(variables));
      }
      url += '&fb_dtsg=' + csrf + '&__a=1';
      return xhr(url);
    })
    .then(response => {
      const json = JSON.parse(response);
      if (json.error) {
        console.warn('Failed GraphQL fetch. Status Code: ' + json.error);
        return null;
      }
      return json != null ? json.data : null;
    });
}

const version = chrome.runtime.getManifest().version;

function genLog(event, action) {
  genGraphQL(
    '1942031559258123',
    action ? {event, action, version} : {event, version}
  );
}

const EXTENSION_URL = chrome.extension.getURL('/');
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.startsWith(EXTENSION_URL + '?q=')) {
      return {
        redirectUrl: details.url.replace(
          EXTENSION_URL,
          SOURCE_URL + 'intern/bunny/'
        ),
      };
    }
  },
  {
    urls: [EXTENSION_URL + '*'],
    types: ['main_frame'],
  },
  ['blocking']
);
