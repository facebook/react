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
 * Generate a mapping of standard vendor prefixes using the defined style property and event name.
 *
 * @param {string} styleProp
 * @param {string} eventName
 * @returns {object}
 */
function makePrefixMap(styleProp, eventName) {
  var prefixes = {};

  prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
  prefixes['Webkit' + styleProp] = 'webkit' + eventName;
  prefixes['Moz' + styleProp] = 'moz' + eventName;
  prefixes['ms' + styleProp] = 'MS' + eventName;
  prefixes['O' + styleProp] = 'o' + eventName + ' o' + eventName.toLowerCase();

  return prefixes;
}

/**
 * A list of event names to a configurable list of vendor prefixes.
 */
var vendorPrefixes = {
  animationend: makePrefixMap('Animation', 'AnimationEnd'),
  transitionend: makePrefixMap('Transition', 'TransitionEnd'),
};

/**
 * Validation functions to run on the first initial lookup.
 */
var initialValidators = {
  // On some platforms, in particular some releases of Android 4.x,
  // the un-prefixed "animation" and "transition" properties are defined on the
  // style object but the events that fire will still be prefixed, so we need
  // to check if the un-prefixed events are useable, and if not remove them from the map
  animationend: function() {
    if (!('AnimationEvent' in window)) {
      delete vendorPrefixes.animationend.animation;
    }
  },
  // Same as above
  transitionend: function() {
    if (!('TransitionEvent' in window)) {
      delete vendorPrefixes.transitionend.transition;
    }
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
  var validator = initialValidators[eventName];
  var style = document.createElement('div').style;

  if (validator && !validator.checked) {
    validator(style);
    validator.checked = true;
  }

  for (var styleProp in prefixMap) {
    if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) {
      return prefixedEventNames[eventName] = prefixMap[styleProp];
    }
  }

  return prefixedEventNames[eventName] = eventName;
}

module.exports = getVendorPrefixedEventName;
