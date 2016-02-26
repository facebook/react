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

const ReactReconciler = require('ReactReconciler');

const assign = require('Object.assign');

const ReactSimpleEmptyComponent = function(placeholderElement, instantiate) {
  this._currentElement = null;
  this._renderedComponent = instantiate(placeholderElement);
};
assign(ReactSimpleEmptyComponent.prototype, {
  mountComponent: function(
    transaction,
    nativeParent,
    nativeContainerInfo,
    context
  ) {
    return ReactReconciler.mountComponent(
      this._renderedComponent,
      transaction,
      nativeParent,
      nativeContainerInfo,
      context
    );
  },
  receiveComponent: function() {
  },
  getNativeNode: function() {
    return ReactReconciler.getNativeNode(this._renderedComponent);
  },
  unmountComponent: function() {
    ReactReconciler.unmountComponent(this._renderedComponent);
    this._renderedComponent = null;
  },
});

module.exports = ReactSimpleEmptyComponent;
