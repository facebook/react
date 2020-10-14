/** @license React v16.13.1
 * react-dom-unstable-fizz.node.development.js
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
  setImmediate(callback);
}
function flushBuffered(destination) {
  // If we don't have any more data to send right now.
  // Flush whatever is in the buffer to the wire.
  if (typeof destination.flush === 'function') {
    // http.createServer response have flush(), but it has a different meaning and
    // is deprecated in favor of flushHeaders(). Detect to avoid a warning.
    if (typeof destination.flushHeaders !== 'function') {
      // By convention the Zlib streams provide a flush function for this purpose.
      destination.flush();
    }
  }
}
function beginWriting(destination) {
  // Older Node streams like http.createServer don't have this.
  if (typeof destination.cork === 'function') {
    destination.cork();
  }
}
function writeChunk(destination, buffer) {
  var nodeBuffer = buffer; // close enough

  return destination.write(nodeBuffer);
}
function completeWriting(destination) {
  // Older Node streams like http.createServer don't have this.
  if (typeof destination.uncork === 'function') {
    destination.uncork();
  }
}
function close(destination) {
  destination.end();
}
function convertStringToBuffer(content) {
  return Buffer.from(content, 'utf8');
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
  beginWriting(destination);

  try {
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      writeChunk(destination, chunk);
    }
  } finally {
    completeWriting(destination);
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

function createDrainHandler(destination, request) {
  return function () {
    return startFlowing(request);
  };
}

function pipeToNodeWritable(children, destination) {
  var request = createRequest(children, destination);
  destination.on('drain', createDrainHandler(destination, request));
  startWork(request);
}

var ReactDOMFizzServerNode = {
  pipeToNodeWritable: pipeToNodeWritable
};

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest


var unstableFizz_node = ReactDOMFizzServerNode.default || ReactDOMFizzServerNode;

module.exports = unstableFizz_node;
  })();
}
