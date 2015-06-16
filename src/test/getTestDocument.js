/**
 * Copyright 2013-2015, Facebook, Inc.
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
  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  var testDocument = iframe.contentDocument || iframe.contentWindow.document;
  testDocument.open();
  testDocument.write(
    markup || '<!doctype html><html><meta charset=utf-8><title>test doc</title>'
  );
  testDocument.close();

  iframe.parentNode.removeChild(iframe);
  return testDocument;
}

module.exports = getTestDocument;
