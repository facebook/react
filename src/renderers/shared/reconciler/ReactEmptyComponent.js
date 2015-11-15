/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactEmptyComponent
 */

'use strict';

var ReactElement = require('ReactElement');
var ReactReconciler = require('ReactReconciler');

var assign = require('Object.assign');

var placeholderElement;

var ReactEmptyComponentInjection = {
  injectEmptyComponent: function(component) {
    placeholderElement = ReactElement.createElement(component);
  },
};

var ReactEmptyComponent = function(instantiate) {
  this._currentElement = null;
  this._renderedComponent = instantiate(placeholderElement);
};
assign(ReactEmptyComponent.prototype, {
  construct: function(element) {
  },
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

ReactEmptyComponent.injection = ReactEmptyComponentInjection;

module.exports = ReactEmptyComponent;
