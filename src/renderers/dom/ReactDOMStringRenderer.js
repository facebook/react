/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMStringRenderer
 */

'use strict';

var invariant = require('fbjs/lib/invariant');
var React = require('react');
var ReactPartialRenderer = require('ReactPartialRenderer');
var ReactFeatureFlags = require('ReactFeatureFlags');

/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://facebook.github.io/react/docs/react-dom-server.html#rendertostring
 */
function renderToString(element) {
  const disableNewFiberFeatures = ReactFeatureFlags.disableNewFiberFeatures;
  if (disableNewFiberFeatures) {
    invariant(
      React.isValidElement(element),
      'renderToString(): You must pass a valid ReactElement.',
    );
  }
  var renderer = new ReactPartialRenderer(element, false);
  var markup = renderer.read(Infinity);
  return markup;
}

/**
 * Similar to renderToString, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://facebook.github.io/react/docs/react-dom-server.html#rendertostaticmarkup
 */
function renderToStaticMarkup(element) {
  const disableNewFiberFeatures = ReactFeatureFlags.disableNewFiberFeatures;
  if (disableNewFiberFeatures) {
    invariant(
      React.isValidElement(element),
      'renderToStaticMarkup(): You must pass a valid ReactElement.',
    );
  }
  var renderer = new ReactPartialRenderer(element, true);
  var markup = renderer.read(Infinity);
  return markup;
}

module.exports = {
  renderToString: renderToString,
  renderToStaticMarkup: renderToStaticMarkup,
};
