/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMContainerInfo
 */

'use strict';

var validateDOMNesting = require('validateDOMNesting');

var DOC_NODE_TYPE = 9;

function ReactDOMContainerInfo(node) {
  var info = {
    _ownerDocument: node.nodeType === DOC_NODE_TYPE ? node : node.ownerDocument,
    _tag: node.nodeName.toLowerCase(),
    _namespaceURI: node.namespaceURI,
  };
  if (__DEV__) {
    info._ancestorInfo =
      validateDOMNesting.updatedAncestorInfo(null, info._tag, null);
  }
  return info;
}

module.exports = ReactDOMContainerInfo;
