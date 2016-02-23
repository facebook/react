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

const ReactDOMContainerInfo = require('ReactDOMContainerInfo');
const ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
const ReactElement = require('ReactElement');
const ReactMarkupChecksum = require('ReactMarkupChecksum');
const ReactServerBatchingStrategy = require('ReactServerBatchingStrategy');
const ReactServerRenderingTransaction =
  require('ReactServerRenderingTransaction');
const ReactUpdates = require('ReactUpdates');

const emptyObject = require('emptyObject');
const instantiateReactComponent = require('instantiateReactComponent');
const invariant = require('invariant');

/**
 * @param {ReactElement} element
 * @return {string} the HTML markup
 */
function renderToStringImpl(element, makeStaticMarkup) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToString(): You must pass a valid ReactElement.'
  );

  let transaction;
  try {
    ReactUpdates.injection.injectBatchingStrategy(ReactServerBatchingStrategy);

    transaction = ReactServerRenderingTransaction.getPooled(makeStaticMarkup);

    return transaction.perform(function() {
      const componentInstance = instantiateReactComponent(element);
      let markup = componentInstance.mountComponent(
        transaction,
        null,
        ReactDOMContainerInfo(),
        emptyObject
      );
      if (!makeStaticMarkup) {
        markup = ReactMarkupChecksum.addChecksumToMarkup(markup);
      }
      return markup;
    }, null);
  } finally {
    ReactServerRenderingTransaction.release(transaction);
    // Revert to the DOM batching strategy since these two renderers
    // currently share these stateful modules.
    ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);
  }
}

function renderToString(element) {
  return renderToStringImpl(element, false);
}

function renderToStaticMarkup(element) {
  return renderToStringImpl(element, true);
}

module.exports = {
  renderToString: renderToString,
  renderToStaticMarkup: renderToStaticMarkup,
};
