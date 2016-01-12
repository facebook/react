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

var CSSProperty = require('CSSProperty');
var EventPluginHub = require('EventPluginHub');
var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactUpdates = require('ReactUpdates');
var SyntheticTransitionEvent = require('SyntheticTransitionEvent');
var TransitionUtils = require('TransitionUtils');

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
    eventName: getVendorPrefixedEventName('transitionstart', true),
    phasedRegistrationNames: {
      bubbled: keyOf({ onTransitionStart: true }),
      captured: keyOf({ onTransitionStartCapture: true }),
    },
    dependencies: [],
  },
  fakeTransitionEnd: {
    eventName: getVendorPrefixedEventName('transitionend', true),
    phasedRegistrationNames: {
      bubbled: keyOf({ onTransitionEnd: true }),
      captured: keyOf({ onTransitionEndCapture: true }),
    },
    dependencies: [],
  },
  fakeTransitionCancel: {
    eventName: getVendorPrefixedEventName('transitioncancel', true),
    phasedRegistrationNames: {
      bubbled: keyOf({ onTransitionCancel: true }),
      captured: keyOf({ onTransitionCancelCapture: true }),
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

  return (time.indexOf('ms') >= 0) ? parseFloat(time) : parseFloat(time) * 1000;
}

/**
 * Extract a mapping of all transitions from a DOM element's style.
 * This mapping will contain the property to change, its delay and duration,
 * and the timing function used.
 *
 * @param {CSSStyleDeclaration} style
 * @returns {object}
 */
function extractTransitionConfig(style) {
  var props = splitStyleProperty(style.transitionProperty);

  if (!props.length) {
    return null;
  }

  var transitions = {};
  var delays = splitStyleProperty(style.transitionDelay);
  var durations = splitStyleProperty(style.transitionDuration);
  var shorthand = CSSProperty.shorthandPropertyExpansions;
  var properties = [];

  props.forEach(function(prop, i) {
    var propNames = shorthand[prop] ? Object.keys(shorthand[prop]) : [prop];

    properties = properties.concat(propNames);

    transitions[prop] = {
      properties: propNames,
      delay: convertTimeToMilliseconds(delays[i]),
      duration: convertTimeToMilliseconds(durations[i]),
    };
  });

  transitions.properties = properties;

  return transitions;
}

/**
 * Extract a mapping of all transitions from a DOM element's style.
 * This mapping will contain the property to change, its delay and duration,
 * and the timing function used.
 *
 * @param {CSSStyleDeclaration} style
 * @param {string[]} properties
 * @returns {object}
 */
function extractStylesToMonitor(style, properties) {
  var styles = {};

  properties.forEach(propName => styles[propName] = style[propName]);

  return styles;
}

/**
 * This function is triggered anytime the instance component has updated.
 * It allows us to hook into the update lifecycle and determine whether styles have actually changed.
 *
 * @param {ReactDOMComponent} inst
 */
function validateStyleChanges(inst) {
  // TODO BUT CANT :[
  // startEventCycle();
}

/**
 * Prepare an element for monitoring by extracting relevant information.
 *
 * @param {ReactDOMComponent} inst
 */
function monitorTransitions(inst) {
  if (monitoredElements[inst._rootNodeID]) {
    return;
  }

  var node = ReactDOMComponentTree.getNodeFromInstance(inst);
  var style = getComputedStyle(node);
  var transitions = extractTransitionConfig(style);

  // If no transitions found, we don't need to monitor
  if (transitions === null) {
    return;
  }

  // Monitor for instance changes
  TransitionUtils.monitorUpdate(inst, validateStyleChanges);

  // Cache the configuration
  monitoredElements[inst._rootNodeID] = {
    inst: inst,
    node: node,
    styles: extractStylesToMonitor(style, transitions.properties),
    className: node.className,
    transitions: transitions,
    timers: {
      start: {},
      end: {},
    },
  };
}

/**
 * Create a `SyntheticTransitionEvent` based on the browsers DOM `TransitionEvent`.
 *
 * @parma {object} dispatchConfig
 * @param {string} type
 * @param {ReactDOMComponent} inst
 * @param {string} propName
 * @returns {SyntheticTransitionEvent}
 */
function createSyntheticEvent(dispatchConfig, type, inst, propName) {
  var event = new SyntheticTransitionEvent.TransitionEvent(type);

  event.target = event.currentTarget = ReactDOMComponentTree.getNodeFromInstance(inst);
  event.propertyName = propName;

  return new SyntheticTransitionEvent(dispatchConfig, inst, event, event.target);
}

/**
 * Start the transition event cycle by setting timers for the "start" and "end" events.
 * Once these timers execute, they will dispatch an event to React's internal event system.
 *
 * @param {object} monitorConfig
 * @param {object} transitionConfig
 * @param {string} propName
 * @param {string} value
 */
function startEventCycle(monitorConfig, transitionConfig, propName, value) {
  // If a display none occurs, we must cancel all events
  if (propName === 'display' && value === 'none') {
    cancelAllEvents(monitorConfig);
    return;
  }

  // Clear previous timers and trigger "cancel" event if necessary
  cancelEventCycle(monitorConfig, transitionConfig, propName);

  // Fire the start event
  monitorConfig.timers.start[propName] = setTimeout(function() {
    dispatchEvent(eventTypes.fakeTransitionStart, transitionConfig, monitorConfig.inst, propName);

    // Fire the end event after the start
    monitorConfig.timers.end[propName] = setTimeout(function() {
      dispatchEvent(eventTypes.fakeTransitionEnd, transitionConfig, monitorConfig.inst, propName);
    }, transitionConfig.duration || 0);

  }, transitionConfig.delay || 0);
}

/**
 * Reset the "start" and "end" event timers for a single property, and trigger a "cancel" event if applicable.
 *
 * @param {object} monitorConfig
 * @param {object} transitionConfig
 * @param {string} propName
 */
function cancelEventCycle(monitorConfig, transitionConfig, propName) {
  var timers = monitorConfig.timers;
  var isRunning = !!timers.end[propName];

  // Clear previous timers
  clearTimeout(timers.start[propName]);
  clearTimeout(timers.end[propName]);

  // Remove timer references
  delete timers.start[propName];
  delete timers.end[propName];

  // Fire the cancel event if applicable
  if (isRunning) {
    dispatchEvent(eventTypes.fakeTransitionCancel, transitionConfig, monitorConfig.inst, propName);
  }
}

/**
 * Reset all "start" and "end" events and fire "cancel" events.
 *
 * @param {object} monitorConfig
 */
function cancelAllEvents(monitorConfig) {
  var transitions = monitorConfig.transitions;

  for (var propName in transitions) {
    if (transitions.hasOwnProperty(propName)) {
      cancelEventCycle(monitorConfig, transitions[propName], propName);
    }
  }
}

/**
 * Create a synthetic event and dispatch it to React's event system.
 *
 * @param {object} dispatchConfig
 * @param {object} transitionConfig
 * @param {ReactDOMComponent} inst
 * @param {string} propName
 */
function dispatchEvent(dispatchConfig, transitionConfig, inst, propName) {
  var event = createSyntheticEvent(dispatchConfig, dispatchConfig.eventName, inst, propName);

  // Try and calculate the elapsed time
  if (dispatchConfig === eventTypes.fakeTransitionStart) {
    transitionConfig.startTime = Date.now();
  } else {
    transitionConfig.endTime = Date.now();
  }

  if (transitionConfig.startTime && transitionConfig.endTime) {
    event.elapsedTime = (transitionConfig.endTime - transitionConfig.startTime) / 1000; // Seconds
    event.nativeEvent.elapsedTime = event.elapsedTime;
  }

  // Dispatch the event to React
  if (dispatchConfig.phasedRegistrationNames) {
    EventPropagators.accumulateTwoPhaseDispatches(event);
  } else {
    EventPropagators.accumulateDirectDispatches(event);
  }

  ReactUpdates.batchedUpdates(function() {
    EventPluginHub.enqueueEvents(event);
    EventPluginHub.processEventQueue(true);
  });
}

var TransitionEventPlugin = {

  eventTypes: eventTypes,

  /**
   * Transitions don't require top level events.
   */
  extractEvents: function() {
    return null;
  },

  /**
   * Once our fake listeners have been registered, we can instantiate the real
   * "start", "end", and "cancel" events, by extracting the data and listeners we require.
   *
   * @param {ReactDOMComponent} inst
   */
  didPutListener: function(inst) {
    if (supportsTransitions) {
      monitorTransitions(inst);
    }
  },

  /**
   * Remove the monitoring.
   *
   * @param {ReactDOMComponent} inst
   */
  willDeleteListener: function(inst) {
    if (supportsTransitions) {
      TransitionUtils.unmonitorUpdate(inst, validateStyleChanges);
      delete monitoredElements[inst._rootNodeID];
    }
  },
};

module.exports = TransitionEventPlugin;
