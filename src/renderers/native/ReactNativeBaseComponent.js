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
var ReactNativeComponentTree = require('ReactNativeComponentTree');
var ReactNativeTagHandles = require('ReactNativeTagHandles');
var ReactMultiChild = require('ReactMultiChild');
var UIManager = require('UIManager');

var deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');

type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object,
  uiViewClassName: string,
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

  unmountComponent: function(safely, skipLifecycle) {
    ReactNativeComponentTree.uncacheNode(this);
    this.unmountChildren(safely, skipLifecycle);
    this._rootNodeID = 0;
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
        var childTag = mountImage;
        createdTags[i] = childTag;
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
        this._rootNodeID,
        this.viewConfig.uiViewClassName,
        updatePayload
      );
    }

    this.updateChildren(nextElement.props.children, transaction, context);
  },

  /**
   * Currently this still uses IDs for reconciliation so this can return null.
   *
   * @return {null} Null.
   */
  getHostNode: function() {
    return this._rootNodeID;
  },

  /**
   * @param {ReactNativeReconcileTransaction} transaction
   * @param {?ReactNativeBaseComponent} the parent component instance
   * @param {?object} info about the host container
   * @param {object} context
   * @return {string} Unique iOS view tag.
   */
  mountComponent: function(transaction, hostParent, hostContainerInfo, context) {
    var tag = ReactNativeTagHandles.allocateTag();

    this._rootNodeID = tag;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

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

    var nativeTopRootTag = hostContainerInfo._tag;
    UIManager.createView(
      tag,
      this.viewConfig.uiViewClassName,
      nativeTopRootTag,
      updatePayload
    );

    ReactNativeComponentTree.precacheNode(this, tag);

    this.initializeChildren(
      this._currentElement.props.children,
      tag,
      transaction,
      context
    );
    return tag;
  },
};

/**
 * Order of mixins is important. ReactNativeBaseComponent overrides methods in
 * ReactMultiChild.
 */
Object.assign(
  ReactNativeBaseComponent.prototype,
  ReactMultiChild,
  ReactNativeBaseComponent.Mixin,
  NativeMethodsMixin
);

module.exports = ReactNativeBaseComponent;
