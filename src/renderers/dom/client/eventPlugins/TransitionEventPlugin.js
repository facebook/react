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

var EventConstants = require('EventConstants');
var EventListener = require('EventListener');
var EventPluginHub = require('EventPluginHub');
var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactUpdates = require('ReactUpdates');
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
    eventName: getVendorPrefixedEventName('transitionstart', true),
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionStart: true}),
      captured: keyOf({onTransitionStartCapture: true}),
    },
    dependencies: [],
  },
  fakeTransitionEnd: {
    eventName: getVendorPrefixedEventName('transitionend', true),
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionEnd: true}),
      captured: keyOf({onTransitionEndCapture: true}),
    },
    dependencies: [],
  },
  fakeTransitionCancel: {
    eventName: getVendorPrefixedEventName('transitioncancel', true),
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
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/transition
 */
function extractReactElementTransitions(transition) {
  var transitions = {};

  if (transition === 'initial' || transition === 'none' || transition === 'inherit') {
    return transitions; // TODO inherit?
  }

  // TODO handle functions like cubic-bezier()
  transition.split(',').forEach(trans => {
    var transParts = trans.trim().split(' ');
    var prop = transParts[0];
    var duration = transParts[1];
    var delay = '0s';
    var timing = 'ease';

    if (transParts[2]) {
      if (transParts[2].match(/[\.\d]+m?s/)) {
        delay = transParts[2];
      } else {
        timing = transParts[2];
        delay = transParts[3];
      }
    }

    transitions[prop] = {
      property: prop,
      delayString: delay || '',
      delay: convertTimeToMilliseconds(delay),
      durationString: duration || '',
      duration: convertTimeToMilliseconds(duration),
      timingFunc: timing,
    };
  });

  return transitions;
}

/**
 * Generate a function that monitors for changes on an element's style object.
 * If a property has changed, emit the "start -> end / cancel" cycle.
 *
 * @param {object} monitorConfig
 * @param {function} oldOnChange
 * @returns {function}
 */
function monitorStyleChanges(monitorConfig, oldOnChange) {
  return function(cssText) {
    oldOnChange.apply(oldOnChange, arguments);

    cssText.split(';').forEach(cssDecl => {
      if (!cssDecl) {
        return;
      }

      var cssDeclParts = cssDecl.trim().split(':', 2);
      var prop = cssDeclParts[0].trim();
      var shorthandProp = (prop.indexOf('-') >= 0) ? prop.split('-')[0] : prop; // background-color -> background
      var value = cssDeclParts[1].trim();

      // Determine if we are monitoring this specific prop for transition changes
      var transitionConfig = monitorConfig.transitions[prop] || monitorConfig.transitions[shorthandProp];

      if (!transitionConfig) {
        return;
      }

      // TODO this doesn't work?
      // Compare the new style to the current style
      // If they are different, start the transition event cycle
      //if (monitorConfig.currentStyle[prop] && value !== monitorConfig.currentStyle[prop]) {
      //  monitorConfig.previousStyle[prop] = monitorConfig.currentStyle[prop];
      //  monitorConfig.currentStyle[prop] = value;

      startEventCycle(monitorConfig, transitionConfig, prop, value);
      //}

      // Make sure the cached instance is updated
      monitoredElements[monitorConfig.id] = monitorConfig;
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
    },
  };

  // Override the built-in style onChange event
  // TODO Does this work correctly and consistently?
  style._onChange = monitorStyleChanges(config, style._onChange);

  return config;
}

/**
 * Create a `SyntheticTransitionEvent` based on the browsers DOM `TransitionEvent`.
 *
 * @parma {object} dispatchConfig
 * @param {string} type
 * @param {ReactDOMComponent} inst
 * @returns {SyntheticTransitionEvent}
 */
function createSyntheticEvent(dispatchConfig, type, inst) {
  var event = new SyntheticTransitionEvent.TransitionEvent(type);
  event.target = event.currentTarget = ReactDOMComponentTree.getNodeFromInstance(inst);

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
    transitionConfig.startTime = Date.now();
    dispatchEvent(eventTypes.fakeTransitionStart, transitionConfig, monitorConfig.instance, propName);

    // Fire the end event after the start
    monitorConfig.timers.end[propName] = setTimeout(function() {
      transitionConfig.endTime = Date.now();
      dispatchEvent(eventTypes.fakeTransitionEnd, transitionConfig, monitorConfig.instance, propName);
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
  var isRunning = !!monitorConfig.timers.end[propName];

  // Clear previous timers
  clearTimeout(monitorConfig.timers.start[propName]);
  clearTimeout(monitorConfig.timers.end[propName]);
  monitorConfig.timers.start[propName] = null;
  monitorConfig.timers.end[propName] = null;

  // Fire the cancel event if applicable
  if (isRunning) {
    transitionConfig.endTime = Date.now();
    dispatchEvent(eventTypes.fakeTransitionCancel, transitionConfig, monitorConfig.instance, propName);
  }
}

/**
 * Reset all "start" and "end" events and fire "cancel" events.
 *
 * @param {object} monitorConfig
 */
function cancelAllEvents(monitorConfig) {
  for (var propName in monitorConfig.transitions) {
    cancelEventCycle(monitorConfig, monitorConfig.transitions[propName], propName);
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
  var event = createSyntheticEvent(dispatchConfig, dispatchConfig.eventName, inst);
  event.propertyName = event.nativeEvent.propertyName = propName;

  if (transitionConfig.endTime && transitionConfig.startTime) {
    event.elapsedTime = event.nativeEvent.elapsedTime = (transitionConfig.endTime - transitionConfig.startTime) / 1000; // Needs to be in seconds
  }

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

  /**
   * Remove the monitoring.
   *
   * @param {ReactDOMComponent} inst
   */
  willDeleteListener: function(inst) {
    delete monitoredElements[inst._rootNodeID];
  },
};

module.exports = TransitionEventPlugin;
