/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMEmptyComponent
 */

'use strict';

const DOMLazyTree = require('DOMLazyTree');
const ReactDOMComponentTree = require('ReactDOMComponentTree');

const assign = require('Object.assign');

const ReactDOMEmptyComponent = function(instantiate) {
  // ReactCompositeComponent uses this:
  this._currentElement = null;
  // ReactDOMComponentTree uses these:
  this._nativeNode = null;
  this._nativeParent = null;
  this._nativeContainerInfo = null;
  this._domID = null;
};
assign(ReactDOMEmptyComponent.prototype, {
  mountComponent: function(
    transaction,
    nativeParent,
    nativeContainerInfo,
    context
  ) {
    const domID = nativeContainerInfo._idCounter++;
    this._domID = domID;
    this._nativeParent = nativeParent;
    this._nativeContainerInfo = nativeContainerInfo;

    const nodeValue = ' react-empty: ' + this._domID + ' ';
    if (transaction.useCreateElement) {
      const ownerDocument = nativeContainerInfo._ownerDocument;
      const node = ownerDocument.createComment(nodeValue);
      ReactDOMComponentTree.precacheNode(this, node);
      return DOMLazyTree(node);
    } else {
      if (transaction.renderToStaticMarkup) {
        // Normally we'd insert a comment node, but since this is a situation
        // where React won't take over (static pages), we can simply return
        // nothing.
        return '';
      }
      return '<!--' + nodeValue + '-->';
    }
  },
  receiveComponent: function() {
  },
  getNativeNode: function() {
    return ReactDOMComponentTree.getNodeFromInstance(this);
  },
  unmountComponent: function() {
    ReactDOMComponentTree.uncacheNode(this);
  },
});

module.exports = ReactDOMEmptyComponent;
