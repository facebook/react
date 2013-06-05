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
 * @providesModule NormalizedEventListener
 */

"use strict";

var EventListener = require('EventListener');

/**
 * @param {?Event} eventParam Event parameter from an attached listener.
 * @return {EventTarget} Normalized event target.
 * @private
 */
function normalizedTarget(eventParam) {
  var event = eventParam || window.event;
  var eventTarget = event.target || event.srcElement || window;
  // Safari may fire events on text nodes (Node.TEXT_NODE is 3)
  // @see http://www.quirksmode.org/js/events_properties.html
  var textNodeNormalizedTarget =
    (eventTarget.nodeType === 3) ? eventTarget.parentNode : eventTarget;
  return textNodeNormalizedTarget;
}

function createNormalizedCallback(cb) {
  return function(nativeEvent) {
    cb(nativeEvent, normalizedTarget(nativeEvent));
  };
}

var NormalizedEventListener = {

  /**
   * Listens to bubbled events on a DOM node.
   *
   * NOTE: The listener will be invoked with a normalized event object.
   *
   * @param {DOMElement} el DOM element to register listener on.
   * @param {string} handlerBaseName Event name, e.g. "click".
   * @param {function} cb Callback function.
   * @public
   */
  listen: function(el, handlerBaseName, cb) {
    EventListener.listen(el, handlerBaseName, createNormalizedCallback(cb));
  },

  /**
   * Listens to captured events on a DOM node.
   *
   * NOTE: The listener will be invoked with a normalized event object.
   *
   * @param {DOMElement} el DOM element to register listener on.
   * @param {string} handlerBaseName Event name, e.g. "click".
   * @param {function} cb Callback function.
   * @public
   */
  capture: function(el, handlerBaseName, cb) {
    EventListener.capture(el, handlerBaseName, createNormalizedCallback(cb));
  }

};

module.exports = NormalizedEventListener;
