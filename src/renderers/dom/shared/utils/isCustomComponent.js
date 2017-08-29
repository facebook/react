/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule isCustomComponent
 */

'use strict';

var DOMNamespaces = require('DOMNamespaces');
var HTML_NAMESPACE = DOMNamespaces.Namespaces.html;

function isCustomComponent(tagName, props, domElement) {
  if (tagName.indexOf('-') >= 0 || typeof props.is === 'string') {
    // TODO: We always have a namespace with fiber. Drop the first
    // check when Stack is removed.
    return domElement == null || domElement.namespaceURI === HTML_NAMESPACE;
  }

  return false;
}

module.exports = isCustomComponent;
