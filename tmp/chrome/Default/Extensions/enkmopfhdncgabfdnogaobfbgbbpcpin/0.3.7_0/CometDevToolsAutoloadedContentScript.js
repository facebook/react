/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @haste-ignore
 * @noflow
 * @oncall ws_tools
 */

/**
 * This content script acts like glue between Comet and Comet Dev Tools.
 *
 * It is is auto-loaded before Comet javsacript for any employee that has
 * the extension installed.
 */

/**
 * NOTE: We want this file to be copied as is.
 * This is because this file gets injected into the page. We don't need/want any
 * cruft that might interfere with the page or do things we don't explicitly
 * expect it to. We also would prefer to keep it as lean as possible. This also
 * has a few implications:
 * - We tag this file with @haste-ignore above, which means it's invisible to
 *   to haste, so any time it's referenced, it has to be referenced by its full
 *   path.
 * - The file runs in the browser untouched: so we can't use requires, flow
 *   types, etc.
 * - Loading this static resource will still fail if it notices any non-ES3
 *   code. Hence, it should all be ES3.
 */

/* This file can't use requires. Below are expressions extracted from
 * other places in the codebase instead. */

var runtime = window.chrome
  ? window.chrome.runtime
  : // For whatever reason, window.browser doesn't work on firefox, it has to be
    // just 'browser'. Yes, this took way too long to debug. No, idk why it works
    // this way.
    // eslint-disable-next-line no-undef
    browser.runtime;

/** From EasyMessageChannels.js */
function listen(options, onConnected) {
  var win = options.window ? options.window : window;

  // handle requests
  var receiveREQ = function (message) {
    if (message.data.type !== 'REQ') {
      return;
    }

    if (!(message.ports && message.ports[0])) {
      onConnected(
        new Error('ERROR 2315: connection request was malformed. No port.'),
      );
      return;
    }

    if (!message.data.hash) {
      onConnected(
        new Error('ERROR 2315: connection request was malformed. No hash.'),
      );
      return;
    }

    if (message.data.hash !== options.hash) {
      // they want to connect to another hash
      return;
    }

    message.ports[0].postMessage({type: 'REQ_ACK'});
    onConnected(null, message.ports[0]);
  };

  // listen for requests
  win.addEventListener('message', receiveREQ);
}

/**
 * That's it for expressions copied over. Below, is our actual implementation.
 */

// content script <--> background
var backgroundPort = null;
// page <--> content script
var pagePort = null;

function init() {
  listen({hash: 'comet://devtools/connect'}, function (error, port) {
    if (!port) {
      throw error;
    }

    // content script <--> background
    backgroundPort = runtime.connect({
      name: 'content_script',
    });
    backgroundPort.onMessage.addListener(onMessageFromBackground);

    pagePort = port;
    pagePort.onmessage = onMessageFromPage;
  });
}

function isValidMessage(message) {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof message.action === 'string'
  );
}

function onMessageFromBackground(message) {
  if (!pagePort) {
    // This can happen if we're getting messages from the panel
    // and the page is in the process of loading (say, after a
    // refresh). The page hasn't attempted to connect to dev tools
    // yet (IE, hasn't called CometDevTools.connect() at least once)
    throw new Error('No page port to connect to.');
  }

  pagePort.postMessage(message);
}

function onMessageFromPage(event) {
  var message = event.data;
  if (!isValidMessage(message)) {
    throw new Error(
      'Invalid message received by comet dev tools content script.',
    );
  }

  switch (message.action) {
    case 'ready':
      var body = message.body;
      if (!Array.isArray(body)) {
        return;
      }

      backgroundPort.postMessage({
        action: 'ready',
        body: body.concat(['content_script']),
      });
      return;

    case 'relay':
    default:
      backgroundPort.postMessage(message);
  }
}

function initFlipper() {
  var flipper_port;

  window.addEventListener('message', function (event) {
    if (event.data.type === 'flipper_start') {
      flipper_port = window.chrome.runtime.connect({
        name: 'flipper:' + event.data.app + ':' + event.data.plugins.join(','),
      });
      flipper_port.onMessage.addListener(function (m) {
        if (m.method === 'onConnect') {
          window.postMessage({
            type: 'flipper_onconnect',
          });
        }
        if (m.method === 'onDisconnect') {
          window.postMessage({
            type: 'flipper_ondisconnect',
          });
        }
      });
    }
    if (event.data.type === 'flipper_send') {
      flipper_port.postMessage({
        method: 'send',
        payload: {
          method: 'execute',
          params: {
            api: event.data.plugin,
            method: event.data.method,
            params: event.data.data,
          },
        },
      });
    }
  });
}

if (
  // don't run on a page where we are running the browser tools UI itself in dev
  window.location.pathname !== '/intern/comet_dev_tools/main'
) {
  init();
  initFlipper();
}

/*  */