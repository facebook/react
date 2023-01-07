/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file is only used for tests.
// It lazily loads the implementation so that we get the correct set of host configs.

import ReactVersion from 'shared/ReactVersion';
export {ReactVersion as version};

export function renderToString() {
  return require('./src/server/ReactDOMLegacyServerBrowser').renderToString.apply(
    this,
    arguments,
  );
}

export function renderToStaticMarkup() {
  return require('./src/server/ReactDOMLegacyServerBrowser').renderToStaticMarkup.apply(
    this,
    arguments,
  );
}

export function renderToNodeStream() {
  return require('./src/server/ReactDOMFizzServerBun').renderToNodeStream.apply(
    this,
    arguments,
  );
}

export function renderToStaticNodeStream() {
  return require('./src/server/ReactDOMFizzServerBun').renderToStaticNodeStream.apply(
    this,
    arguments,
  );
}

export function renderToReadableStream() {
  return require('./src/server/ReactDOMFizzServerBun').renderToReadableStream.apply(
    this,
    arguments,
  );
}

export function renderIntoContainer() {
  return require('./src/server/ReactDOMFizzServerBun').renderIntoContainer.apply(
    this,
    arguments,
  );
}

export function renderIntoDocument() {
  return require('./src/server/ReactDOMFizzServerBun').renderIntoDocument.apply(
    this,
    arguments,
  );
}
