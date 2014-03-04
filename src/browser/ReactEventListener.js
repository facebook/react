/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule ReactEventListener
 * @typechecks static-only
 */

"use strict";

var EventListener = require('EventListener');
var PooledClass = require('PooledClass');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactMount = require('ReactMount');

var getEventTarget = require('getEventTarget');
var getUnboundedScrollPosition = require('getUnboundedScrollPosition');
var mixInto = require('mixInto');

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
function TopLevelCallbackBookKeeping() {
  this.ancestors = [];
}
mixInto(TopLevelCallbackBookKeeping, {
  destructor: function() {
    this.ancestors.length = 0;
  }
});
PooledClass.addPoolingTo(TopLevelCallbackBookKeeping);

function topLevelCallbackImpl(bookKeeping, cb, nativeEvent) {
  var topLevelTarget = ReactMount.getFirstReactDOM(
    getEventTarget(nativeEvent)
  ) || window;

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  var ancestor = topLevelTarget;
  while (ancestor) {
    bookKeeping.ancestors.push(ancestor);
    ancestor = findParent(ancestor);
  }

  for (var i = 0, l = bookKeeping.ancestors.length; i < l; i++) {
    topLevelTarget = bookKeeping.ancestors[i];
    var topLevelTargetID = ReactMount.getID(topLevelTarget) || '';
    cb(
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );
  }
}

function topLevelCallback(cb, nativeEvent) {
  if (!ReactEventListener._enabled) {
    return;
  }

  var bookKeeping = TopLevelCallbackBookKeeping.getPooled();
  try {
    topLevelCallbackImpl(bookKeeping, cb, nativeEvent);
  } finally {
    TopLevelCallbackBookKeeping.release(bookKeeping);
  }
}

function scrollValueMonitor(cb) {
  var scrollPosition = getUnboundedScrollPosition(window);
  cb(scrollPosition);
}

var ReactEventListener = {
  _enabled: true,

  setEnabled: function(enabled) {
    ReactEventListener._enabled = !!enabled;
  },

  isEnabled: function() {
    return ReactEventListener._enabled;
  },

  /**
   * Traps top-level events by using event bubbling.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {DOMEventTarget} element Element on which to attach listener.
   * @internal
   */
  trapBubbledEvent: function(handlerBaseName, element, cb) {
    EventListener.listen(
      element,
      handlerBaseName,
      topLevelCallback.bind(null, cb)
    );
  },

  /**
   * Traps a top-level event by using event capturing.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {DOMEventTarget} element Element on which to attach listener.
   * @internal
   */
  trapCapturedEvent: function(handlerBaseName, element, cb) {
    EventListener.capture(
      element,
      handlerBaseName,
      topLevelCallback.bind(null, cb)
    );
  },

  monitorScrollValue: function(refresh) {
    var callback = scrollValueMonitor.bind(null, refresh);
    EventListener.listen(window, 'scroll', callback);
    EventListener.listen(window, 'resize', callback);
  }
};

module.exports = ReactEventListener;