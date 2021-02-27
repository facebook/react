/** @license React v16.13.1
 * react-dom-unstable-fizz.browser.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';



if (process.env.NODE_ENV !== "production") {
  (function() {
'use strict';

function scheduleWork(callback) {
  callback();
}
function flushBuffered(destination) {// WHATWG Streams do not yet have a way to flush the underlying
  // transform streams. https://github.com/whatwg/streams/issues/960
}
function writeChunk(destination, buffer) {
  destination.enqueue(buffer);
  return destination.desiredSize > 0;
}
function close(destination) {
  destination.close();
}
var textEncoder = new TextEncoder();
function convertStringToBuffer(content) {
  return textEncoder.encode(content);
}

function formatChunkAsString(type, props) {
  var str = '<' + type + '>';

  if (typeof props.children === 'string') {
    str += props.children;
  }

  str += '</' + type + '>';
  return str;
}
function formatChunk(type, props) {
  return convertStringToBuffer(formatChunkAsString(type, props));
}

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;

function createRequest(children, destination) {
  return {
    destination: destination,
    children: children,
    completedChunks: [],
    flowing: false
  };
}

function performWork(request) {
  var element = request.children;
  request.children = null;

  if (element && element.$$typeof !== REACT_ELEMENT_TYPE) {
    return;
  }

  var type = element.type;
  var props = element.props;

  if (typeof type !== 'string') {
    return;
  }

  request.completedChunks.push(formatChunk(type, props));

  if (request.flowing) {
    flushCompletedChunks(request);
  }

  flushBuffered(request.destination);
}

function flushCompletedChunks(request) {
  var destination = request.destination;
  var chunks = request.completedChunks;
  request.completedChunks = [];

  try {
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      writeChunk(destination, chunk);
    }
  } finally {
  }

  close(destination);
}

function startWork(request) {
  request.flowing = true;
  scheduleWork(function () {
    return performWork(request);
  });
}
function startFlowing(request) {
  request.flowing = false;
  flushCompletedChunks(request);
}

function renderToReadableStream(children) {
  var request;
  return new ReadableStream({
    start: function (controller) {
      request = createRequest(children, controller);
      startWork(request);
    },
    pull: function (controller) {
      startFlowing(request);
    },
    cancel: function (reason) {}
  });
}

var ReactDOMFizzServerBrowser = {
  renderToReadableStream: renderToReadableStream
};

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest


var unstableFizz_browser = ReactDOMFizzServerBrowser.default || ReactDOMFizzServerBrowser;

module.exports = unstableFizz_browser;
  })();
}
