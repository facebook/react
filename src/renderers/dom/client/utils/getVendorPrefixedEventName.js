/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getVendorPrefixedEventName
 */

'use strict';

/**
 * A list of event names to a configurable list of vendor prefixes.
 */
var vendorPrefixes = {
  animationend: {
    // On some platforms, in particular some releases of Android 4.x,
    // the un-prefixed "animation" and "transition" properties are defined on the
    // style object but the events that fire will still be prefixed, so we need
    // to check if the un-prefixed events are useable, and if not remove them
    // from the map
    preCheck: function() {
      if (!('AnimationEvent' in window)) {
        delete vendorPrefixes.animationend.animation;
      }
    },
    animation: 'animationend',
    WebkitAnimation: 'webkitAnimationEnd',
    MozAnimation: 'mozAnimationEnd',
    msAnimation: 'MSAnimationEnd',
    OAnimation: 'oAnimationEnd oanimationend',
  },

  transitionend: {
    // Same as above
    preCheck: function() {
      if (!('TransitionEvent' in window)) {
        delete vendorPrefixes.transitionend.transition;
      }
    },
    transition: 'transitionend',
    WebkitTransition: 'webkitTransitionEnd',
    MozTransition: 'mozTransitionEnd',
    msTransition: 'MSTransitionEnd',
    OTransition: 'oTransitionEnd otransitionend',
  },
};

/**
 * Event names that have already been detected and prefixed (if applicable).
 */
var prefixedEventNames = {};

/**
 * Attempts to determine the correct vendor prefixed event name.
 *
 * @param {string} eventName
 * @returns {string}
 */
function getVendorPrefixedEventName(eventName) {
  if (prefixedEventNames[eventName]) {
    return prefixedEventNames[eventName];

  } else if (!vendorPrefixes[eventName]) {
    return eventName;
  }

  var prefixMap = vendorPrefixes[eventName];
  var style = document.createElement('div').style;

  if (typeof prefixMap.preCheck === 'function') {
    prefixMap.preCheck(style);
  }

  for (var styleProp in prefixMap) {
    if (styleProp !== 'preCheck' && prefixMap.hasOwnProperty(styleProp) && styleProp in style) {
      prefixedEventNames[eventName] = prefixMap[styleProp];

      return prefixedEventNames[eventName];
    }
  }

  return '';
}

module.exports = getVendorPrefixedEventName;
