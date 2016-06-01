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

var ReactElement = require('ReactElement');
var ReactInstrumentation = require('ReactInstrumentation');
var ReactReconciler = require('ReactReconciler');
var ReactUpdates = require('ReactUpdates');

var emptyObject = require('emptyObject');
var getHostComponentFromComposite = require('getHostComponentFromComposite');
var instantiateReactComponent = require('instantiateReactComponent');

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
  // this.props is actually a ReactElement
  return this.props;
};

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

var ReactTestInstance = function(component) {
  this._component = component;
};
ReactTestInstance.prototype.getInstance = function() {
  return this._component._renderedComponent.getPublicInstance();
};
ReactTestInstance.prototype.toJSON = function() {
  var inst = getHostComponentFromComposite(this._component);
  return inst.toJSON();
};

/**
 * As soon as `ReactMount` is refactored to not rely on the DOM, we can share
 * code between the two. For now, we'll hard code the ID logic.
 */
var ReactHostMount = {

  render: function(
    nextElement: ReactElement
  ): ?ReactComponent {
    var nextWrappedElement = new ReactElement(
      TopLevelWrapper,
      null,
      null,
      null,
      null,
      null,
      nextElement
    );

    // var prevComponent = ReactHostMount._instancesByContainerID[containerTag];
    // if (prevComponent) {
    //   var prevWrappedElement = prevComponent._currentElement;
    //   var prevElement = prevWrappedElement.props;
    //   if (shouldUpdateReactComponent(prevElement, nextElement)) {
    //     ReactUpdateQueue.enqueueElementInternal(prevComponent, nextWrappedElement);
    //     if (callback) {
    //       ReactUpdateQueue.enqueueCallbackInternal(prevComponent, callback);
    //     }
    //     return prevComponent;
    //   }
    // }

    var instance = instantiateReactComponent(nextWrappedElement);

    if (__DEV__) {
      // Mute future events from the top level wrapper.
      // It is an implementation detail that devtools should not know about.
      instance._debugID = 0;

      if (__DEV__) {
        ReactInstrumentation.debugTool.onBeginFlush();
      }
    }

    // The initial render is synchronous but any updates that happen during
    // rendering, in componentWillMount or componentDidMount, will be batched
    // according to the current batching strategy.

    ReactUpdates.batchedUpdates(
      batchedMountComponentIntoNode,
      instance
    );
    if (__DEV__) {
      // The instance here is TopLevelWrapper so we report mount for its child.
      ReactInstrumentation.debugTool.onMountRootComponent(
        instance._renderedComponent._debugID
      );
      ReactInstrumentation.debugTool.onEndFlush();
    }
    return new ReactTestInstance(instance);
  },

};

module.exports = ReactHostMount;
