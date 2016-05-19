/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactServerRendering
 */
'use strict';

var Adler32Stream = require('Adler32Stream');
var ReactElement = require('ReactElement');
var ReactMarkupChecksum = require('ReactMarkupChecksum');
var ReactServerRenderingAsync = require('ReactServerRenderingAsync');
var invariant = require('invariant');
var stream = require('stream');

/**
 * @param {ReactElement} element
 * @return {string} the HTML markup
 */
function renderToStringImpl(element, makeStaticMarkup) {
  var chunkLength = Infinity;
  var renderer = ReactServerRenderingAsync.render(element, makeStaticMarkup);
  var result = '';

  var chunk = renderer.next(chunkLength);
  while (!chunk.done) {
    result += chunk.value;
    chunk = renderer.next(chunkLength);
  }

  return result;
}

/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://facebook.github.io/react/docs/top-level-api.html#reactdomserver.rendertostring
 */
function renderToString(element) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToString(): You must pass a valid ReactElement.'
  );
  return ReactMarkupChecksum.addChecksumToMarkup(renderToStringImpl(element, false));
}

/**
 * Similar to renderToString, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://facebook.github.io/react/docs/top-level-api.html#reactdomserver.rendertostaticmarkup
 */
function renderToStaticMarkup(element) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToStaticMarkup(): You must pass a valid ReactElement.'
  );
  return renderToStringImpl(element, true);
}

class RenderElementStream extends stream.Readable {
  constructor(element, makeStaticMarkup = false) {
    super();
    this.renderer = ReactServerRenderingAsync.render(element, makeStaticMarkup);
  }

  _read(n) {
    try {
      var chunk = this.renderer.next(n);
      if (chunk.done) {
        this.push(null);
      } else {
        this.push(chunk.value);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }
}

function renderToStream(element) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToStream(): You must pass a valid ReactElement.'
  );
  return new RenderElementStream(element, false).pipe(new Adler32Stream());
}

function renderToStaticMarkupStream(element) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToStaticMarkupStream(): You must pass a valid ReactElement.'
  );
  return new RenderElementStream(element, true);
}

module.exports = {
  renderToString: renderToString,
  renderToStaticMarkup: renderToStaticMarkup,
  renderToStream: renderToStream,
  renderToStaticMarkupStream: renderToStaticMarkupStream,
};
