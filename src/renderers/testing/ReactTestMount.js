/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestMount
 * @flow
 */
'use strict';

var React = require('React');
var ReactReconciler = require('ReactReconciler');
var ReactUpdates = require('ReactUpdates');

var emptyObject = require('emptyObject');
var getHostComponentFromComposite = require('getHostComponentFromComposite');
var instantiateReactComponent = require('instantiateReactComponent');
var invariant = require('invariant');
var shouldUpdateReactComponent = require('shouldUpdateReactComponent');
var warning = require('warning');

/**
 * Temporary (?) hack so that we can store all top-level pending updates on
 * composites instead of having to worry about different types of components
 * here.
 */
var TopLevelWrapper = function() {};
TopLevelWrapper.prototype.isReactComponent = {};
if (__DEV__) {
  TopLevelWrapper.displayName = 'TopLevelWrapper';
}
TopLevelWrapper.prototype.render = function() {
  return this.props.child;
};
TopLevelWrapper.isReactTopLevelWrapper = true;

/**
 * Mounts this component and inserts it into the DOM.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {number} rootID ID of the root node.
 * @param {number} containerTag container element to mount into.
 * @param {ReactReconcileTransaction} transaction
 */
function mountComponentIntoNode(
    componentInstance,
    transaction) {
  var image = ReactReconciler.mountComponent(
    componentInstance,
    transaction,
    null,
    null,
    emptyObject
  );
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
function batchedMountComponentIntoNode(
    componentInstance) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
  var image = transaction.perform(
    mountComponentIntoNode,
    null,
    componentInstance,
    transaction
  );
  ReactUpdates.ReactReconcileTransaction.release(transaction);
  return image;
}

var ReactTestInstance = function(isTopLevel, component) {
  this._isTopLevel = isTopLevel;
  this._component = component;
  this._typeChanged = false;
};
ReactTestInstance.prototype._getInternalInstance = function() {
  invariant(
    !this._typeChanged,
    'ReactTestRenderer: Can\'t inspect or traverse after changing component ' +
    'type or key. Fix the earlier warning and try again.'
  );
  var component = this._component;
  if (this._isTopLevel) {
    component = component._renderedComponent;
  }
  invariant(
    // _unmounted is present on test (host) components, not on composites
    component && !component._unmounted && component._renderedComponent !== null,
    'ReactTestRenderer: Can\'t inspect or traverse unmounted components.'
  );
  return component;
};
ReactTestInstance.prototype.isText = function() {
  var el = this._getInternalInstance()._currentElement;
  return typeof el === 'string' || typeof el === 'number';
};
ReactTestInstance.prototype.getInstance = function() {
  return this._getInternalInstance().getPublicInstance();
};
ReactTestInstance.prototype.getType = function() {
  return this._getInternalInstance()._currentElement.type || null;
};
ReactTestInstance.prototype.getProps = function() {
  return this._getInternalInstance()._currentElement.props || null;
};
ReactTestInstance.prototype.getChildren = function() {
  var instance = this._getInternalInstance();
  var el = instance._currentElement;
  if (React.isValidElement(el)) {
    var children;
    if (typeof el.type === 'function') {
      children = [instance._renderedComponent];
    } else {
      children = Object.keys(this._renderedChildren)
        .map((childKey) => this._renderedChildren[childKey]);
    }
    return children
      .filter((child) =>
        child._currentElement !== null && child._currentElement !== false
      )
      .map((child) => new ReactTestInstance(false, child));
  } else if (typeof el === 'string' || typeof el === 'number') {
    return [];
  } else {
    invariant(false, 'Unrecognized React node %s', el);
  }
};
ReactTestInstance.prototype.update = function(nextElement) {
  invariant(
    this._isTopLevel,
    'ReactTestRenderer: .update() can only be called at the top level.'
  );
  invariant(
    this._component,
    "ReactTestRenderer: .update() can't be called after unmount."
  );
  var prevElement = this._component._currentElement.props.child;
  // TODO: Change to invariant in React 16
  if (!shouldUpdateReactComponent(prevElement, nextElement)) {
    warning(
      false,
      'ReactTestRenderer: Component type and key must be preserved when ' +
      'updating. If necessary, call ReactTestRenderer.create again instead.'
    );
    this._typeChanged = true;
  }
  var nextWrappedElement = React.createElement(
    TopLevelWrapper,
    { child: nextElement }
  );
  var component = this._component;
  ReactUpdates.batchedUpdates(function() {
    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
    transaction.perform(function() {
      ReactReconciler.receiveComponent(
        component,
        nextWrappedElement,
        transaction,
        emptyObject
      );
    });
    ReactUpdates.ReactReconcileTransaction.release(transaction);
  });
};
ReactTestInstance.prototype.unmount = function(nextElement) {
  invariant(
    this._isTopLevel,
    'ReactTestRenderer: .unmount() can only be called at the top level.'
  );
  var component = this._component;
  ReactUpdates.batchedUpdates(function() {
    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
    transaction.perform(function() {
      ReactReconciler.unmountComponent(
        component,
        false
      );
    });
    ReactUpdates.ReactReconcileTransaction.release(transaction);
  });
  this._component = null;
};
ReactTestInstance.prototype.toJSON = function() {
  var inst = getHostComponentFromComposite(this._component);
  return inst.toJSON();
};

/**
 * As soon as `ReactMount` is refactored to not rely on the DOM, we can share
 * code between the two. For now, we'll hard code the ID logic.
 */
var ReactTestMount = {

  render: function(
    nextElement: ReactElement<any>
  ): ReactTestInstance {
    var nextWrappedElement = React.createElement(
      TopLevelWrapper,
      { child: nextElement }
    );

    var instance = instantiateReactComponent(nextWrappedElement, false);

    // The initial render is synchronous but any updates that happen during
    // rendering, in componentWillMount or componentDidMount, will be batched
    // according to the current batching strategy.

    ReactUpdates.batchedUpdates(
      batchedMountComponentIntoNode,
      instance
    );
    return new ReactTestInstance(true, instance);
  },

};

module.exports = ReactTestMount;
