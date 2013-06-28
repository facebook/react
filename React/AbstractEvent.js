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
 * @providesModule AbstractEvent
 */

"use strict";

var BrowserEnv = require("./BrowserEnv");
var PooledClass = require("./PooledClass");
var TouchEventUtils = require("./TouchEventUtils");

var throwIf = require("./throwIf");


// Only accessed in __DEV__
var CLONE_TYPE_ERR;
if (true) {
  CLONE_TYPE_ERR =
    'You may only clone instances of AbstractEvent for ' +
    'persistent references. Check yourself.';
}
var MAX_POOL_SIZE = 20;

/**
 * AbstractEvent copy constructor. @see `PooledClass`. Provides a single place
 * to define all cross browser normalization of DOM events. Does not attempt to
 * extend a native event, rather creates a completely new object that has a
 * reference to the nativeEvent through .nativeEvent member. The property .data
 * should hold all data that is extracted from the event in a cross browser
 * manner. Application code should use the data field when possible, not the
 * unreliable native event.
 */
function AbstractEvent(
    abstractEventType,
    abstractTargetID,  // Allows the abstract target to differ from native.
    originatingTopLevelEventType,
    nativeEvent,
    data) {
  this.type = abstractEventType;
  this.abstractTargetID = abstractTargetID || '';
  this.originatingTopLevelEventType = originatingTopLevelEventType;
  this.nativeEvent = nativeEvent;
  this.data = data;
  // TODO: Deprecate storing target - doesn't always make sense for some types
  this.target = nativeEvent && nativeEvent.target;

  /**
   * As a performance optimization, we tag the existing event with the listeners
   * (or listener [singular] if only one). This avoids having to package up an
   * abstract event along with the set of listeners into a wrapping "dispatch"
   * object. No one should ever read this property except event system and
   * plugin/dispatcher code. We also tag the abstract event with a parallel
   * ID array. _dispatchListeners[i] is being dispatched to a DOM node at ID
   * _dispatchIDs[i]. The lengths should never, ever, ever be different.
   */
  this._dispatchListeners = null;
  this._dispatchIDs = null;

  this.isPropagationStopped = false;
}

/** `PooledClass` looks for this. */
AbstractEvent.poolSize = MAX_POOL_SIZE;

/**
 * `PooledClass` looks for `destructor` on each instance it releases. We need to
 * ensure that we remove all references to listeners which could trap large
 * amounts of memory in their closures.
 */
AbstractEvent.prototype.destructor = function() {
  this.target = null;
  this._dispatchListeners = null;
  this._dispatchIDs = null;
};

/**
 * Enhance the `AbstractEvent` class to have pooling abilities. We instruct
 * `PooledClass` that our copy constructor accepts five arguments (this is just
 * a performance optimization). These objects are instantiated frequently.
 */
PooledClass.addPoolingTo(AbstractEvent, PooledClass.fiveArgumentPooler);

AbstractEvent.prototype.stopPropagation = function() {
  this.isPropagationStopped = true;
  if (this.nativeEvent.stopPropagation) {
    this.nativeEvent.stopPropagation();
  }
  // IE8 only understands cancelBubble, not stopPropagation().
  this.nativeEvent.cancelBubble = true;
};

AbstractEvent.prototype.preventDefault = function() {
  AbstractEvent.preventDefaultOnNativeEvent(this.nativeEvent);
};

/**
 * Utility function for preventing default in cross browser manner.
 */
AbstractEvent.preventDefaultOnNativeEvent = function(nativeEvent) {
  if (nativeEvent.preventDefault) {
    nativeEvent.preventDefault();
  } else {
    nativeEvent.returnValue = false;
  }
};

/**
 * @param {Element} target The target element.
 */
AbstractEvent.normalizeScrollDataFromTarget = function(target) {
  return {
    scrollTop: target.scrollTop,
    scrollLeft: target.scrollLeft,
    clientWidth: target.clientWidth,
    clientHeight: target.clientHeight,
    scrollHeight: target.scrollHeight,
    scrollWidth: target.scrollWidth
  };
};

/*
 * There are some normalizations that need to happen for various browsers. In
 * addition to replacing the general event fixing with a framework such as
 * jquery, we need to normalize mouse events here. Code below is mostly borrowed
 * from: jScrollPane/script/jquery.mousewheel.js
 */
AbstractEvent.normalizeMouseWheelData = function(nativeEvent) {
  var delta = 0;
  var deltaX = 0;
  var deltaY = 0;

  /* traditional scroll wheel data */
  if ( nativeEvent.wheelDelta ) { delta = nativeEvent.wheelDelta/120; }
  if ( nativeEvent.detail     ) { delta = -nativeEvent.detail/3; }

  /* Multidimensional scroll (touchpads) with deltas */
  deltaY = delta;

  /* Gecko based browsers */
  if (nativeEvent.axis !== undefined &&
      nativeEvent.axis === nativeEvent.HORIZONTAL_AXIS ) {
    deltaY = 0;
    deltaX = -delta;
  }

  /* Webkit based browsers */
  if (nativeEvent.wheelDeltaY !== undefined ) {
    deltaY = nativeEvent.wheelDeltaY/120;
  }
  if (nativeEvent.wheelDeltaX !== undefined ) {
    deltaX = -nativeEvent.wheelDeltaX/120;
  }

  return { delta: delta, deltaX: deltaX, deltaY: deltaY };
};

/**
 * I <3 Quirksmode.org:
 * http://www.quirksmode.org/js/events_properties.html
 */
AbstractEvent.isNativeClickEventRightClick = function(nativeEvent) {
  return nativeEvent.which ? nativeEvent.which === 3 :
    nativeEvent.button ? nativeEvent.button === 2 :
    false;
};

AbstractEvent.normalizePointerData = function(nativeEvent) {
  return {
    globalX: AbstractEvent.eventPageX(nativeEvent),
    globalY: AbstractEvent.eventPageY(nativeEvent),
    rightMouseButton:
      AbstractEvent.isNativeClickEventRightClick(nativeEvent)
  };
};

AbstractEvent.normalizeDragEventData =
  function(nativeEvent, globalX, globalY, startX, startY) {
    return {
      globalX: globalX,
      globalY: globalY,
      startX: startX,
      startY: startY
    };
  };

/**
 * Warning: It is possible to move your finger on a touch surface, yet not
 * effect the `eventPageX/Y` because the touch had caused a scroll that
 * compensated for your movement. To track movements across the page, prevent
 * default to avoid scrolling, and control scrolling in javascript.
 */

/**
 * Gets the exact position of a touch/mouse event on the page with respect to
 * the document body. The only reason why this method is needed instead of using
 * `TouchEventUtils.extractSingleTouch` is to support IE8-. Mouse events in all
 * browsers except IE8- contain a pageY. IE8 and below require clientY
 * computation:
 *
 * @param {Event} nativeEvent Native event, possibly touch or mouse.
 * @return {number} Coordinate with respect to document body.
 */
AbstractEvent.eventPageY = function(nativeEvent) {
  var singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch.pageY;
  } else if (typeof nativeEvent.pageY !== 'undefined') {
    return nativeEvent.pageY;
  } else {
    return nativeEvent.clientY + BrowserEnv.currentPageScrollTop;
  }
};

/**
 * @see `AbstractEvent.eventPageY`.
 *
 * @param {Event} nativeEvent Native event, possibly touch or mouse.
 * @return {number} Coordinate with respect to document body.
 */
AbstractEvent.eventPageX = function(nativeEvent) {
  var singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch.pageX;
  } else if (typeof nativeEvent.pageX !== 'undefined') {
    return nativeEvent.pageX;
  } else {
    return nativeEvent.clientX + BrowserEnv.currentPageScrollLeft;
  }
};

/**
 * A semantic API around cloning an event for use in another event loop. We
 * clear out all dispatched `AbstractEvent`s after each event loop, adding them
 * back into the pool. This allows a way to hold onto a reference that won't be
 * added back into the pool. Please note that `AbstractEvent.nativeEvent` is
 * *not* cloned and you will run into problems in IE if you assume that it will
 * be! The moral of that story is to always normalize any data you need into the
 * `.data` field. The data field is not cloned either, but there won't be any
 * issues related to use of `.data` in a future event cycle so long as no part
 * of your application mutates it. We don't clone the private fields because
 * your application should never be accessing them.
 *
 * - TODO: In __DEV__ when "releasing" events, don't put them back into the
 *   pool. Instead add ES5 getters on all their fields that throw errors so you
 *   can detect any application that's hanging onto events and reusing them.
 *   In prod - we can put them back into the pool for reuse.
 */
AbstractEvent.persistentCloneOf = function(abstractEvent) {
  if (true) {
    throwIf(!(abstractEvent instanceof AbstractEvent), CLONE_TYPE_ERR);
  }
  return new AbstractEvent(
    abstractEvent.type,
    abstractEvent.abstractTargetID,
    abstractEvent.originatingTopLevelEventType,
    abstractEvent.nativeEvent,
    abstractEvent.data,
    abstractEvent.target
  );
};

module.exports = AbstractEvent;

