/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TransitionEventPlugin
 */

'use strict';

/* eslint no-unused-vars: 0 */

var ExecutionEnvironment = require('ExecutionEnvironment');
var SyntheticTransitionEvent = require('SyntheticTransitionEvent');

var getVendorPrefixedEventName = require('getVendorPrefixedEventName');
var keyOf = require('keyOf');

// Check if the current browser supports transitions.
// We can use the same check as we do for vendor prefixes.
var supportsTransitions = (
  ExecutionEnvironment.canUseDOM &&
  getVendorPrefixedEventName('transitionend') !== ''
);

// Events and their corresponding property names.
var eventTypes = {
  transitionStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionStart: true}),
      captured: keyOf({onTransitionStartCapture: true}),
    },
    dependencies: [],
  },
  transitionEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionEnd: true}),
      captured: keyOf({onTransitionEndCapture: true}),
    },
    dependencies: [],
  },
  transitionCancel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionCancel: true}),
      captured: keyOf({onTransitionCancelCapture: true}),
    },
    dependencies: [],
  },
};

/**
 * Split a style property into an array of values.
 *
 * @param {string} property
 * @returns {string[]}
 */
function splitStyleProperty(property) {
  return property.replace(/\s/g, '').split(',');
}

/**
 * Convert a transition delay or duration in string format (1s, 0.3s)
 * to a valid millisecond float.
 *
 * @param {string} time
 * @returns {number}
 */
function convertTimeToMilliseconds(time) {
  return (!time || time === '0s') ? 0 : parseFloat(time) * 1000;
}

/**
 * Extract a mapping of all transitions from an element.
 * This mapping will contain the property to change, its delay and duration,
 * and the timing function used.
 *
 * @param {HTMLElement} element
 * @returns {object}
 */
function extractElementTransitions(element) {
  var transitions = {};
  var style = window.getComputedStyle(element);
  var props = splitStyleProperty(style.transitionProperty);

  if (!props.length) {
    return transitions;
  }

  var delays = splitStyleProperty(style.transitionDelay);
  var durations = splitStyleProperty(style.transitionDuration);
  var timings = splitStyleProperty(style.transitionTimingFunction);

  props.forEach((prop, i) => {
    transitions[prop] = {
      property: prop,
      delayString: delays[i] || '',
      delay: convertTimeToMilliseconds(delays[i]),
      durationString: durations[i] || '',
      duration: convertTimeToMilliseconds(durations[i]),
      timingFunc: timings[i] || 'ease',
    };
  });

  return transitions;
}

var TransitionEventPlugin = {

  eventTypes: eventTypes,

  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    // Transitions don't require top level events?
    return null;
  },

  didPutListener: function(inst, registrationName, listener) {
    // Possible modify something here?
  },
};

module.exports = TransitionEventPlugin;
