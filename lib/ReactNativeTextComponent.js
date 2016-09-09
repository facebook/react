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

var _prodInvariant = require('./reactProdInvariant'),
    _assign = require('object-assign');

var ReactNativeComponentTree = require('./ReactNativeComponentTree');
var ReactNativeTagHandles = require('./ReactNativeTagHandles');
var UIManager = require('react-native/lib/UIManager');

var invariant = require('fbjs/lib/invariant');

var ReactNativeTextComponent = function (text) {
  // This is really a ReactText (ReactNode), not a ReactElement
  this._currentElement = text;
  this._stringText = '' + text;
  this._hostParent = null;
  this._rootNodeID = 0;
};

_assign(ReactNativeTextComponent.prototype, {

  mountComponent: function (transaction, hostParent, hostContainerInfo, context) {
    // TODO: hostParent should have this context already. Stop abusing context.
    !context.isInAParentText ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RawText "%s" must be wrapped in an explicit <Text> component.', this._stringText) : _prodInvariant('20', this._stringText) : void 0;
    this._hostParent = hostParent;
    var tag = ReactNativeTagHandles.allocateTag();
    this._rootNodeID = tag;
    var nativeTopRootTag = hostContainerInfo._tag;
    UIManager.createView(tag, 'RCTRawText', nativeTopRootTag, { text: this._stringText });

    ReactNativeComponentTree.precacheNode(this, tag);

    return tag;
  },

  getHostNode: function () {
    return this._rootNodeID;
  },

  receiveComponent: function (nextText, transaction, context) {
    if (nextText !== this._currentElement) {
      this._currentElement = nextText;
      var nextStringText = '' + nextText;
      if (nextStringText !== this._stringText) {
        this._stringText = nextStringText;
        UIManager.updateView(this._rootNodeID, 'RCTRawText', { text: this._stringText });
      }
    }
  },

  unmountComponent: function () {
    ReactNativeComponentTree.uncacheNode(this);
    this._currentElement = null;
    this._stringText = null;
    this._rootNodeID = 0;
  }

});

module.exports = ReactNativeTextComponent;