/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getTestDocument
 */

'use strict';

function getTestDocument(markup) {
  document.open();
  document.write(
    markup ||
      '<!doctype html><html><meta charset=utf-8><title>test doc</title>',
  );
  document.close();
  return document;
}

module.exports = getTestDocument;
