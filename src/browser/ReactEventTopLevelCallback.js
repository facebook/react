/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventTopLevelCallback
 * @typechecks static-only
 */

"use strict";

var ReactEventEmitter = require('ReactEventEmitter');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactMount = require('ReactMount');

var getEventTarget = require('getEventTarget');

/**
 * @type {boolean}
 * @private
 */
var _topLevelListenersEnabled = true;

/**
 * Finds the parent React component of `node`.
 *
 * @param {*} node
 * @return {?DOMEventTarget} Parent container, or `null` if the specified node
 *                           is not nested.
 */
function findParent(node) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  var nodeID = ReactMount.getID(node);
  var rootID = ReactInstanceHandles.getReactRootIDFromNodeID(nodeID);
  var container = ReactMount.findReactContainerForID(rootID);
  var parent = ReactMount.getFirstReactDOM(container);
  return parent;
}

// Used to store ancestor hierarchy in top level callback
var topLevelCallbackReusableArray = [];

/**
 * Top-level callback creator used to implement event handling using delegation.
 * This is used via dependency injection.
 */
var ReactEventTopLevelCallback = {

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    _topLevelListenersEnabled = !!enabled;
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return _topLevelListenersEnabled;
  },

  /**
   * Creates a callback for the supplied `topLevelType` that could be added as
   * a listener to the document. The callback computes a `topLevelTarget` which
   * should be the root node of a mounted React component where the listener
   * is attached.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @return {function} Callback for handling top-level events.
   */
  createTopLevelCallback: function(topLevelType) {
    return function(nativeEvent) {
      if (!_topLevelListenersEnabled) {
        return;
      }
      var topLevelTarget = ReactMount.getFirstReactDOM(
        getEventTarget(nativeEvent)
      ) || window;

      var ancestors = topLevelCallbackReusableArray;
      ancestors.length = 0;

      // Loop through the hierarchy, in case there's any nested components.
      // It's important that we build the array of ancestors before calling any
      // event handlers, because event handlers can modify the DOM, leading to
      // inconsistencies with ReactMount's node cache. See #1105.
      var ancestor = topLevelTarget;
      while (ancestor) {
        ancestors.push(ancestor);
        ancestor = findParent(ancestor);
      }

      for (var i = 0, l = ancestors.length; i < l; i++) {
        topLevelTarget = ancestors[i];
        var topLevelTargetID = ReactMount.getID(topLevelTarget) || '';
        ReactEventEmitter.handleTopLevel(
          topLevelType,
          topLevelTarget,
          topLevelTargetID,
          nativeEvent
        );
      }

      // Emptying ancestors/topLevelCallbackReusableArray is
      // not necessary for correctness, but it helps the GC reclaim
      // any nodes that were left at the end of the search.
      ancestors.length = 0;
    };
  }

};

module.exports = ReactEventTopLevelCallback;
