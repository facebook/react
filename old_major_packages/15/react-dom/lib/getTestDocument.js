/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

function getTestDocument(markup) {
  document.open();
  document.write(markup || '<!doctype html><html><meta charset=utf-8><title>test doc</title>');
  document.close();
  return document;
}

module.exports = getTestDocument;