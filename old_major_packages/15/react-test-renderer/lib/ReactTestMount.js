/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
'use strict';

var _prodInvariant = require('./reactProdInvariant'),
    _assign = require('object-assign');

var React = require('react/lib/React');
var ReactReconciler = require('./ReactReconciler');
var ReactUpdates = require('./ReactUpdates');

var emptyObject = require('fbjs/lib/emptyObject');
var getHostComponentFromComposite = require('./getHostComponentFromComposite');
var instantiateReactComponent = require('./instantiateReactComponent');
var invariant = require('fbjs/lib/invariant');

var defaultTestOptions = {
  createNodeMock: function () {
    return null;
  }
};

/**
 * Temporary (?) hack so that we can store all top-level pending updates on
 * composites instead of having to worry about different types of components
 * here.
 */
var TopLevelWrapper = function () {};
TopLevelWrapper.prototype.isReactComponent = {};
if (process.env.NODE_ENV !== 'production') {
  TopLevelWrapper.displayName = 'TopLevelWrapper';
}
TopLevelWrapper.prototype.render = function () {
  return this.props.child;
};
TopLevelWrapper.isReactTopLevelWrapper = true;

/**
 * Mounts this component and inserts it into the DOM.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {ReactReconcileTransaction} transaction
 * @param {Object} hostParent
 * @param {Object} hostContainerInfo
 */
function mountComponentIntoNode(componentInstance, transaction, hostParent, hostContainerInfo) {
  var image = ReactReconciler.mountComponent(componentInstance, transaction, null, hostContainerInfo, emptyObject);
  componentInstance._renderedComponent._topLevelWrapper = componentInstance;
  return image;
}

/**
 * Batched mount.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {number} rootID ID of the root node.
 * @param {number} containerTag container element to mount into.
 */
function batchedMountComponentIntoNode(componentInstance, options) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
  var image = transaction.perform(mountComponentIntoNode, null, componentInstance, transaction, null, options);
  ReactUpdates.ReactReconcileTransaction.release(transaction);
  return image;
}

var ReactTestInstance = function (component) {
  this._component = component;
};
ReactTestInstance.prototype.getInstance = function () {
  return this._component._renderedComponent.getPublicInstance();
};
ReactTestInstance.prototype.update = function (nextElement) {
  !this._component ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactTestRenderer: .update() can\'t be called after unmount.') : _prodInvariant('139') : void 0;
  var nextWrappedElement = React.createElement(TopLevelWrapper, {
    child: nextElement
  });
  var component = this._component;
  ReactUpdates.batchedUpdates(function () {
    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
    transaction.perform(function () {
      ReactReconciler.receiveComponent(component, nextWrappedElement, transaction, emptyObject);
    });
    ReactUpdates.ReactReconcileTransaction.release(transaction);
  });
};
ReactTestInstance.prototype.unmount = function (nextElement) {
  var component = this._component;
  ReactUpdates.batchedUpdates(function () {
    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
    transaction.perform(function () {
      ReactReconciler.unmountComponent(component, false);
    });
    ReactUpdates.ReactReconcileTransaction.release(transaction);
  });
  this._component = null;
};
ReactTestInstance.prototype.toJSON = function () {
  var inst = getHostComponentFromComposite(this._component);
  if (inst === null) {
    return null;
  }
  return inst.toJSON();
};

/**
 * As soon as `ReactMount` is refactored to not rely on the DOM, we can share
 * code between the two. For now, we'll hard code the ID logic.
 */
var ReactTestMount = {
  render: function (nextElement, options) {
    var nextWrappedElement = React.createElement(TopLevelWrapper, {
      child: nextElement
    });

    var instance = instantiateReactComponent(nextWrappedElement, false);

    // The initial render is synchronous but any updates that happen during
    // rendering, in componentWillMount or componentDidMount, will be batched
    // according to the current batching strategy.
    ReactUpdates.batchedUpdates(batchedMountComponentIntoNode, instance, _assign({}, defaultTestOptions, options));
    return new ReactTestInstance(instance);
  }
};

module.exports = ReactTestMount;