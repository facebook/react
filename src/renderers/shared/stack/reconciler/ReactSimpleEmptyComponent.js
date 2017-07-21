/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactSimpleEmptyComponent
 */

'use strict';

var ReactReconciler = require('ReactReconciler');

var ReactSimpleEmptyComponent = function(placeholderElement, instantiate) {
  this._currentElement = null;
  this._renderedComponent = instantiate(placeholderElement);
};
Object.assign(ReactSimpleEmptyComponent.prototype, {
  mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
    context,
    parentDebugID, // 0 in production and for roots
  ) {
    return ReactReconciler.mountComponent(
      this._renderedComponent,
      transaction,
      hostParent,
      hostContainerInfo,
      context,
      parentDebugID,
    );
  },
  receiveComponent: function() {},
  getHostNode: function() {
    return ReactReconciler.getHostNode(this._renderedComponent);
  },
  unmountComponent: function(safely, skipLifecycle) {
    ReactReconciler.unmountComponent(
      this._renderedComponent,
      safely,
      skipLifecycle,
    );
    this._renderedComponent = null;
  },
});

module.exports = ReactSimpleEmptyComponent;
