/**
 * Copyright 2013-present, Facebook, Inc.
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

function ReactDOMContainerInfo(topLevelWrapper, node) {
  var info = {
    _topLevelWrapper: topLevelWrapper,
    _idCounter: 1,
    _ownerDocument: node
      ? node.nodeType === DOC_NODE_TYPE ? node : node.ownerDocument
      : null,
    _node: node,
    _tag: node ? node.nodeName.toLowerCase() : null,
    _namespaceURI: node ? node.namespaceURI : null,
  };
  if (__DEV__) {
    info._ancestorInfo = node
      ? validateDOMNesting.updatedAncestorInfo(null, info._tag, null)
      : null;
  }
  return info;
}

module.exports = ReactDOMContainerInfo;
