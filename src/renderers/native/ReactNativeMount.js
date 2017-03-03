/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeMount
 * @flow
 */
'use strict';

var React = require('react');
var ReactInstrumentation = require('ReactInstrumentation');
var ReactNativeContainerInfo = require('ReactNativeContainerInfo');
var ReactNativeTagHandles = require('ReactNativeTagHandles');
var ReactReconciler = require('ReactReconciler');
var ReactUpdateQueue = require('ReactUpdateQueue');
var ReactUpdates = require('ReactUpdates');
var UIManager = require('UIManager');

var emptyObject = require('fbjs/lib/emptyObject');
var instantiateReactComponent = require('instantiateReactComponent');
var shouldUpdateReactComponent = require('shouldUpdateReactComponent');

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
    containerTag,
    transaction) {
  var markup = ReactReconciler.mountComponent(
    componentInstance,
    transaction,
    null,
    ReactNativeContainerInfo(containerTag),
    emptyObject,
    0 /* parentDebugID */
  );
  componentInstance._renderedComponent._topLevelWrapper = componentInstance;
  ReactNativeMount._mountImageIntoNode(markup, containerTag);
}

/**
 * Batched mount.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {number} rootID ID of the root node.
 * @param {number} containerTag container element to mount into.
 */
function batchedMountComponentIntoNode(
    componentInstance,
    containerTag) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
  transaction.perform(
    mountComponentIntoNode,
    null,
    componentInstance,
    containerTag,
    transaction
  );
  ReactUpdates.ReactReconcileTransaction.release(transaction);
}

/**
 * As soon as `ReactMount` is refactored to not rely on the DOM, we can share
 * code between the two. For now, we'll hard code the ID logic.
 */
var ReactNativeMount = {
  _instancesByContainerID: {},

  // these two functions are needed by React Devtools
  findNodeHandle: require('findNodeHandle'),

  /**
   * @param {ReactComponent} instance Instance to render.
   * @param {containerTag} containerView Handle to native view tag
   */
  renderComponent: function(
    nextElement: ReactElement<*>,
    containerTag: number,
    callback?: ?(() => void)
  ): ?ReactComponent<any, any, any> {
    var nextWrappedElement = React.createElement(
      TopLevelWrapper,
      { child: nextElement }
    );

    var topRootNodeID = containerTag;
    var prevComponent = ReactNativeMount._instancesByContainerID[topRootNodeID];
    if (prevComponent) {
      var prevWrappedElement = prevComponent._currentElement;
      var prevElement = prevWrappedElement.props.child;
      if (shouldUpdateReactComponent(prevElement, nextElement)) {
        ReactUpdateQueue.enqueueElementInternal(prevComponent, nextWrappedElement, emptyObject);
        if (callback) {
          ReactUpdateQueue.enqueueCallbackInternal(prevComponent, callback);
        }
        return prevComponent;
      } else {
        ReactNativeMount.unmountComponentAtNode(containerTag);
      }
    }

    if (!ReactNativeTagHandles.reactTagIsNativeTopRootID(containerTag)) {
      console.error('You cannot render into anything but a top root');
      return null;
    }

    ReactNativeTagHandles.assertRootTag(containerTag);

    var instance = instantiateReactComponent(nextWrappedElement, false);
    ReactNativeMount._instancesByContainerID[containerTag] = instance;

    if (callback) {
      var nonNullCallback = callback;
      instance._pendingCallbacks = [function() {
        nonNullCallback.call(instance._renderedComponent.getPublicInstance());
      }];
    }

    // The initial render is synchronous but any updates that happen during
    // rendering, in componentWillMount or componentDidMount, will be batched
    // according to the current batching strategy.

    ReactUpdates.batchedUpdates(
      batchedMountComponentIntoNode,
      instance,
      containerTag
    );
    var component = instance._renderedComponent.getPublicInstance();
    return component;
  },

  /**
   * @param {View} view View tree image.
   * @param {number} containerViewID View to insert sub-view into.
   */
  _mountImageIntoNode: function(mountImage : number, containerID : number) {
    // Since we now know that the `mountImage` has been mounted, we can
    // mark it as such.
    var childTag = mountImage;
    UIManager.setChildren(
      containerID,
      [childTag]
    );
  },

  /**
   * Standard unmounting of the component that is rendered into `containerID`,
   * but will also execute a command to remove the actual container view
   * itself. This is useful when a client is cleaning up a React tree, and also
   * knows that the container will no longer be needed. When executing
   * asynchronously, it's easier to just have this method be the one that calls
   * for removal of the view.
   */
  unmountComponentAtNodeAndRemoveContainer: function(
    containerTag: number
  ) {
    ReactNativeMount.unmountComponentAtNode(containerTag);
    // call back into native to remove all of the subviews from this container
    UIManager.removeRootView(containerTag);
  },

  /**
   * Unmount component at container ID by iterating through each child component
   * that has been rendered and unmounting it. There should just be one child
   * component at this time.
   */
  unmountComponentAtNode: function(containerTag: number): boolean {
    if (!ReactNativeTagHandles.reactTagIsNativeTopRootID(containerTag)) {
      console.error('You cannot render into anything but a top root');
      return false;
    }

    var instance = ReactNativeMount._instancesByContainerID[containerTag];
    if (!instance) {
      return false;
    }
    if (__DEV__) {
      ReactInstrumentation.debugTool.onBeginFlush();
    }
    ReactNativeMount.unmountComponentFromNode(instance, containerTag);
    delete ReactNativeMount._instancesByContainerID[containerTag];
    if (__DEV__) {
      ReactInstrumentation.debugTool.onEndFlush();
    }
    return true;
  },

  /**
   * Unmounts a component and sends messages back to iOS to remove its subviews.
   *
   * @param {ReactComponent} instance React component instance.
   * @param {string} containerID ID of container we're removing from.
   * @final
   * @internal
   * @see {ReactNativeMount.unmountComponentAtNode}
   */
  unmountComponentFromNode: function(
    instance: ReactComponent<any, any, any>,
    containerID: number
  ) {
    // Call back into native to remove all of the subviews from this container
    ReactReconciler.unmountComponent(instance);
    UIManager.removeSubviewsFromContainerWithID(containerID);
  },

};

module.exports = ReactNativeMount;
