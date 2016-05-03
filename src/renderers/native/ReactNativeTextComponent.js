/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeTextComponent
 */

'use strict';

var ReactNativeComponentTree = require('ReactNativeComponentTree');
var ReactNativeTagHandles = require('ReactNativeTagHandles');
var UIManager = require('UIManager');

var invariant = require('invariant');

var ReactNativeTextComponent = function(text) {
  // This is really a ReactText (ReactNode), not a ReactElement
  this._currentElement = text;
  this._stringText = '' + text;
  this._nativeParent = null;
  this._rootNodeID = null;
};

Object.assign(ReactNativeTextComponent.prototype, {

  mountComponent: function(transaction, nativeParent, nativeContainerInfo, context) {
    // TODO: nativeParent should have this context already. Stop abusing context.
    invariant(
      context.isInAParentText,
      'RawText "%s" must be wrapped in an explicit <Text> component.',
      this._stringText
    );
    this._nativeParent = nativeParent;
    var tag = ReactNativeTagHandles.allocateTag();
    this._rootNodeID = tag;
    var nativeTopRootTag = nativeContainerInfo._tag;
    UIManager.createView(
      tag,
      'RCTRawText',
      nativeTopRootTag,
      {text: this._stringText}
    );

    ReactNativeComponentTree.precacheNode(this, tag);

    return tag;
  },

  getNativeNode: function() {
    return this._rootNodeID;
  },

  receiveComponent: function(nextText, transaction, context) {
    if (nextText !== this._currentElement) {
      this._currentElement = nextText;
      var nextStringText = '' + nextText;
      if (nextStringText !== this._stringText) {
        this._stringText = nextStringText;
        UIManager.updateView(
          this._rootNodeID,
          'RCTRawText',
          {text: this._stringText}
        );
      }
    }
  },

  unmountComponent: function() {
    ReactNativeComponentTree.uncacheNode(this);
    this._currentElement = null;
    this._stringText = null;
    this._rootNodeID = null;
  },

});

module.exports = ReactNativeTextComponent;
