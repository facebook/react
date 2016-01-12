/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DirectElementEventPlugin
 */

'use strict';

var EventListener = require('EventListener');
var ReactDOMComponentTree = require('ReactDOMComponentTree');

var getVendorPrefixedEventName = require('getVendorPrefixedEventName');
var keyOf = require('keyOf');

var eventTypes = {
  animationStart: {
    eventName: getVendorPrefixedEventName('animationstart'),
    phasedRegistrationNames: {
      bubbled: keyOf({ onAnimationStart: true }),
      captured: keyOf({ onAnimationStartCapture: true }),
    },
    dependencies: [],
  },
  animationEnd: {
    eventName: getVendorPrefixedEventName('animationend'),
    phasedRegistrationNames: {
      bubbled: keyOf({ onAnimationEnd: true }),
      captured: keyOf({ onAnimationEndCapture: true }),
    },
    dependencies: [],
  },
  animationIteration: {
    eventName: getVendorPrefixedEventName('animationiteration'),
    phasedRegistrationNames: {
      bubbled: keyOf({ onAnimationIteration: true }),
      captured: keyOf({ onAnimationIterationCapture: true }),
    },
    dependencies: [],
  },
  transitionEnd: {
    eventName: getVendorPrefixedEventName('transitionend'),
    phasedRegistrationNames: {
      bubbled: keyOf({ onTransitionEnd: true }),
      captured: keyOf({ onTransitionEndCapture: true }),
    },
    dependencies: [],
  },
};

var boundListeners = {};

var DirectElementEventPlugin = {

  eventTypes: eventTypes,

  /**
   * These events don't require top level events.
   */
  extractEvents: function() {
    return null;
  },

  /**
   * Attach the listener onto the native DOM element and keep a reference to the detach method.
   *
   * @param {ReactDOMComponent} inst
   * @param {string} registrationName
   * @param {function} listener
   */
  didPutListener: function(inst, registrationName, listener) {
    var id = inst._rootNodeID;
    var isCapture = registrationName.substr(-7) === 'Capture';
    var eventType = registrationName.charAt(2).toLowerCase() +
      registrationName.substring(3, isCapture ? registrationName.length - 7 : registrationName.length);
    var dispatchConfig = eventTypes[eventType];

    if (!dispatchConfig || !dispatchConfig.eventName) {
      return;  
    }

    boundListeners[id] = boundListeners[id] || {};
    boundListeners[id][registrationName] = EventListener[isCapture ? 'capture' : 'listen'](
      ReactDOMComponentTree.getNodeFromInstance(inst),
      dispatchConfig.eventName,
      listener
    );
  },

  /**
   * Remove the listener from the native DOM element.
   *
   * @param {ReactDOMComponent} inst
   * @param {string} registrationName
   */
  willDeleteListener: function(inst, registrationName) {
    var id = inst._rootNodeID;
    var listener = boundListeners[id] ? boundListeners[id][registrationName] : null;

    if (!listener) {
      return;
    }

    listener.remove();

    delete boundListeners[id][registrationName];
  },
};

module.exports = DirectElementEventPlugin;
