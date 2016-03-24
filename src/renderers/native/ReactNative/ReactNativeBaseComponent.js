/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeBaseComponent
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var ReactNativeAttributePayload = require('ReactNativeAttributePayload');
var ReactNativeEventEmitter = require('ReactNativeEventEmitter');
var ReactNativeTagHandles = require('ReactNativeTagHandles');
var ReactMultiChild = require('ReactMultiChild');
var UIManager = require('UIManager');

var deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var registrationNames = ReactNativeEventEmitter.registrationNames;
var putListener = ReactNativeEventEmitter.putListener;
var deleteListener = ReactNativeEventEmitter.deleteListener;
var deleteAllListeners = ReactNativeEventEmitter.deleteAllListeners;

type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object;
  uiViewClassName: string;
}

// require('UIManagerStatTracker').install(); // uncomment to enable

/**
 * @constructor ReactNativeBaseComponent
 * @extends ReactComponent
 * @extends ReactMultiChild
 * @param {!object} UIKit View Configuration.
 */
var ReactNativeBaseComponent = function(
  viewConfig: ReactNativeBaseComponentViewConfig
) {
  this.viewConfig = viewConfig;
};

/**
 * Mixin for containers that contain UIViews. NOTE: markup is rendered markup
 * which is a `viewID` ... see the return value for `mountComponent` !
 */
ReactNativeBaseComponent.Mixin = {
  getPublicInstance: function() {
    // TODO: This should probably use a composite wrapper
    return this;
  },

  construct: function(element) {
    this._currentElement = element;
  },

  unmountComponent: function() {
    deleteAllListeners(this._rootNodeID);
    this.unmountChildren();
    this._rootNodeID = null;
  },

  /**
   * Every native component is responsible for allocating its own `tag`, and
   * issuing the native `createView` command. But it is not responsible for
   * recording the fact that its own `rootNodeID` is associated with a
   * `nodeHandle`. Only the code that actually adds its `nodeHandle` (`tag`) as
   * a child of a container can confidently record that in
   * `ReactNativeTagHandles`.
   */
  initializeChildren: function(children, containerTag, transaction, context) {
    var mountImages = this.mountChildren(children, transaction, context);
    // In a well balanced tree, half of the nodes are in the bottom row and have
    // no children - let's avoid calling out to the native bridge for a large
    // portion of the children.
    if (mountImages.length) {

      // TODO: Pool these per platform view class. Reusing the `mountImages`
      // array would likely be a jit deopt.
      var createdTags = [];
      for (var i = 0, l = mountImages.length; i < l; i++) {
        var mountImage = mountImages[i];
        var childTag = mountImage.tag;
        var childID = mountImage.rootNodeID;
        warning(
          mountImage && mountImage.rootNodeID && mountImage.tag,
          'Mount image returned does not have required data'
        );
        ReactNativeTagHandles.associateRootNodeIDWithMountedNodeHandle(
          childID,
          childTag
        );
        createdTags[i] = mountImage.tag;
      }
      UIManager.setChildren(containerTag, createdTags);
    }
  },

  /**
   * Updates the component's currently mounted representation.
   *
   * @param {object} nextElement
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @internal
   */
  receiveComponent: function(nextElement, transaction, context) {
    var prevElement = this._currentElement;
    this._currentElement = nextElement;

    if (__DEV__) {
      for (var key in this.viewConfig.validAttributes) {
        if (nextElement.props.hasOwnProperty(key)) {
          deepFreezeAndThrowOnMutationInDev(nextElement.props[key]);
        }
      }
    }

    var updatePayload = ReactNativeAttributePayload.diff(
      prevElement.props,
      nextElement.props,
      this.viewConfig.validAttributes
    );

    if (updatePayload) {
      UIManager.updateView(
        ReactNativeTagHandles.mostRecentMountedNodeHandleForRootNodeID(this._rootNodeID),
        this.viewConfig.uiViewClassName,
        updatePayload
      );
    }

    this._reconcileListenersUponUpdate(
      prevElement.props,
      nextElement.props
    );
    this.updateChildren(nextElement.props.children, transaction, context);
  },

  /**
   * @param {object} initialProps Native component props.
   */
  _registerListenersUponCreation: function(initialProps) {
    for (var key in initialProps) {
      // NOTE: The check for `!props[key]`, is only possible because this method
      // registers listeners the *first* time a component is created.
      if (registrationNames[key] && initialProps[key]) {
        var listener = initialProps[key];
        putListener(this._rootNodeID, key, listener);
      }
    }
  },

  /**
   * Reconciles event listeners, adding or removing if necessary.
   * @param {object} prevProps Native component props including events.
   * @param {object} nextProps Next native component props including events.
   */
  _reconcileListenersUponUpdate: function(prevProps, nextProps) {
    for (var key in nextProps) {
      if (registrationNames[key] && (nextProps[key] !== prevProps[key])) {
        if (nextProps[key]) {
          putListener(this._rootNodeID, key, nextProps[key]);
        } else {
          deleteListener(this._rootNodeID, key);
        }
      }
    }
  },

  /**
   * @param {string} rootID Root ID of this subtree.
   * @param {Transaction} transaction For creating/updating.
   * @return {string} Unique iOS view tag.
   */
  mountComponent: function(rootID, transaction, context) {
    this._rootNodeID = rootID;

    var tag = ReactNativeTagHandles.allocateTag();

    if (__DEV__) {
      for (var key in this.viewConfig.validAttributes) {
        if (this._currentElement.props.hasOwnProperty(key)) {
          deepFreezeAndThrowOnMutationInDev(this._currentElement.props[key]);
        }
      }
    }

    var updatePayload = ReactNativeAttributePayload.create(
      this._currentElement.props,
      this.viewConfig.validAttributes
    );

    var nativeTopRootID = ReactNativeTagHandles.getNativeTopRootIDFromNodeID(rootID);
    if (nativeTopRootID == null) {
      invariant(
        false,
        'nativeTopRootID not found for tag ' + tag + ' view type ' +
          this.viewConfig.uiViewClassName + ' with rootID ' + rootID);
    }
    UIManager.createView(
      tag,
      this.viewConfig.uiViewClassName,
      ReactNativeTagHandles.rootNodeIDToTag[nativeTopRootID],
      updatePayload
    );

    this._registerListenersUponCreation(this._currentElement.props);
    this.initializeChildren(
      this._currentElement.props.children,
      tag,
      transaction,
      context
    );
    return {
      rootNodeID: rootID,
      tag: tag
    };
  }
};

/**
 * Order of mixins is important. ReactNativeBaseComponent overrides methods in
 * ReactMultiChild.
 */
Object.assign(
  ReactNativeBaseComponent.prototype,
  ReactMultiChild.Mixin,
  ReactNativeBaseComponent.Mixin,
  NativeMethodsMixin
);

module.exports = ReactNativeBaseComponent;
