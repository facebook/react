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
var ReactDOMComponentTree = require('ReactDOMComponentTree');
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
  fakeTransitionStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionStart: true}),
      captured: keyOf({onTransitionStartCapture: true}),
    },
    dependencies: [],
  },
  fakeTransitionEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionEnd: true}),
      captured: keyOf({onTransitionEndCapture: true}),
    },
    dependencies: [],
  },
  fakeTransitionCancel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionCancel: true}),
      captured: keyOf({onTransitionCancelCapture: true}),
    },
    dependencies: [],
  },
};

// Collection of elements and their transitions to monitor
var monitoredElements = {};

/**
 * Split a style property into an array of values.
 *
 * @param {string} property
 * @returns {string[]}
 */
function splitStyleProperty(property) {
  return property ? property.replace(/\s/g, '').split(',') : [];
}

/**
 * Convert a transition delay or duration in string format (1s, 0.3s, 100ms)
 * to a valid millisecond float.
 *
 * @param {string} time
 * @returns {number}
 */
function convertTimeToMilliseconds(time) {
  if (!time || time === '0s' || time === '0ms') {
    return 0;
  }

  if (time.indexOf('ms') >= 0) {
    return parseFloat(time);
  }

  return parseFloat(time) * 1000;
}

/**
 * Extract a mapping of all transitions from a DOM element's style.
 * This mapping will contain the property to change, its delay and duration,
 * and the timing function used.
 *
 * @param {object} style
 * @returns {object}
 */
function extractDOMElementTransitions(style) {
  var transitions = {};
  var props = splitStyleProperty(style.transitionProperty || style['transition-property']);

  if (!props.length) {
    return transitions;
  }

  var delays = splitStyleProperty(style.transitionDelay || style['transition-delay']);
  var durations = splitStyleProperty(style.transitionDuration || style['transition-duration']);
  var timings = splitStyleProperty(style.transitionTimingFunction || style['transition-timing-function']);

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

/**
 * Extract a mapping of all transitions from a React element's style.
 * This mapping will contain the property to change, its delay and duration,
 * and the timing function used.
 *
 * @param {string} transition
 * @returns {object}
 */
function extractReactElementTransitions(transition) {
  var transitions = {};

  transition.split(',').forEach(trans => {
    var transParts = trans.trim().split(' '); // TODO handle functions like cubic-bezier()
    var prop = transParts[0];
    var delay = transParts[1]; // TODO, how is delay defined when all combined?
    var duration = transParts[1];
    var timing = transParts[2];

    transitions[prop] = {
      property: prop,
      delayString: delay || '',
      delay: convertTimeToMilliseconds(delay),
      durationString: duration || '',
      duration: convertTimeToMilliseconds(duration),
      timingFunc: timing || 'ease',
    };
  });

  return transitions;
}

/**
 * Generate a function that monitors for changes on an element's style object.
 * If a property has changed, emit the "start -> end / cancel" cycle.
 *
 * @param {object} config
 * @param {function} oldOnChange
 * @returns {function}
 */
function monitorStyleChanges(config, oldOnChange) {
  return function(cssText) {
    oldOnChange.apply(oldOnChange, arguments);

    cssText.split(';').forEach(cssDecl => {
      if (!cssDecl) {
        return;
      }

      var cssDeclParts = cssDecl.trim().split(':', 2);
      var prop = cssDeclParts[0].trim();
      var groupProp = (prop.indexOf('-') >= 0) ? prop.split('-')[0] : prop; // background-color -> background
      var value = cssDeclParts[1].trim();

      // Determine if we are monitoring this specific prop for transition changes
      var transitionConfig = config.transitions[prop] || config.transitions[groupProp];

      if (!transitionConfig) {
        return;
      }

      // Compare it to the current style
      // If they are different, start the transition event cycle
      if (config.currentStyle[prop] && value !== config.currentStyle[prop]) {
        config.previousStyle[prop] = config.currentStyle[prop];
        config.currentStyle[prop] = value;

        emitStartEvent(config, transitionConfig, prop, value);
      }

      // Make sure the cached instance is updated
      monitoredElements[config.id] = config;
    });
  };
}

/**
 * Prepare an element for style monitoring by extract relevant information.
 *
 * @param {ReactDOMComponent} inst
 * @returns {object}
 */
function prepareElementMonitoring(inst) {
  var id = inst._rootNodeID;

  if (monitoredElements[id]) {
    return monitoredElements[id];
  }

  var node = ReactDOMComponentTree.getNodeFromInstance(inst);
  var style = node.style;
  var config = {
    id: id,
    instance: inst,
    element: node,
    style: style,
    previousStyle: style._values,
    currentStyle: style._values,
    transitions: style.transition ?
      extractReactElementTransitions(style.transition) :
      extractDOMElementTransitions(style._values || window.getComputedStyle(node)),
    listeners: {},
    // 1 timer per CSS property
    timers: {
      start: {},
      end: {},
      cancel: {},
    },
  };

  // Override the built-in style onChange event
  style._onChange = monitorStyleChanges(config, style._onChange);

  return config;
}

/**
 * Starts the transition event cycle.
 *
 * @param {object} config
 * @param {object} transitionConfig
 * @param {string} prop
 * @param {string} value
 */
function emitStartEvent(config, transitionConfig, prop, value) {
  var startListener = config.listeners.start;
  var endListener = config.listeners.end;
  var cancelListener = config.listeners.cancel;

  // TODO - Replace with reacts built-in events
  // This is merely for testing right now
  clearTimeout(config.timers.start[prop]);
  clearTimeout(config.timers.end[prop]);

  config.timers.start[prop] = setTimeout(function() {
    var startTime = Date.now();
    console.log('TRANSITIONSTART', startTime);

    // Trigger the bound client listener
    if (startListener) {
      startListener.apply(startListener, arguments);
    }

    // Start the timer for the end event
    config.timers.end[prop] = setTimeout(function() {
      var endTime = Date.now();
      console.log('TRANSITIONEND', endTime, endTime - startTime);

      // Trigger the bound client listener
      if (endListener) {
        endListener.apply(endListener, arguments);
      }
    }, transitionConfig.duration || 0);
  }, transitionConfig.delay || 0);
}

var TransitionEventPlugin = {

  eventTypes: eventTypes,

  /**
   * Transitions don't require top level events.
   */
  extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    return null;
  },

  /**
   * Once our fake listeners have been registered, we can instantiate the real
   * "start", "end", and "cancel" events, by extracting the data and listeners we require.
   * We can then add "onpropertychange" events that monitor the changes to an elements
   * style, and then trigger our real events accordingly.
   *
   * @param {ReactDOMComponent} inst
   * @param {string} registrationName
   * @param {function} listener
   */
  didPutListener: function(inst, registrationName, listener) {
    var monitorInst = prepareElementMonitoring(inst);

    if (registrationName === 'onTransitionStart') {
      monitorInst.listeners.start = listener;

    } else if (registrationName === 'onTransitionEnd') {
      monitorInst.listeners.end = listener;

    } else if (registrationName === 'onTransitionCancel') {
      monitorInst.listeners.cancel = listener;
    }

    monitoredElements[inst._rootNodeID] = monitorInst;
  },
};

module.exports = TransitionEventPlugin;
