/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var ReactReconciler = require('./ReactReconciler');

var ReactSimpleEmptyComponent = function (placeholderElement, instantiate) {
  this._currentElement = null;
  this._renderedComponent = instantiate(placeholderElement);
};
_assign(ReactSimpleEmptyComponent.prototype, {
  mountComponent: function (transaction, hostParent, hostContainerInfo, context, parentDebugID) // 0 in production and for roots
  {
    return ReactReconciler.mountComponent(this._renderedComponent, transaction, hostParent, hostContainerInfo, context, parentDebugID);
  },
  receiveComponent: function () {},
  getHostNode: function () {
    return ReactReconciler.getHostNode(this._renderedComponent);
  },
  unmountComponent: function () {
    ReactReconciler.unmountComponent(this._renderedComponent);
    this._renderedComponent = null;
  }
});

module.exports = ReactSimpleEmptyComponent;