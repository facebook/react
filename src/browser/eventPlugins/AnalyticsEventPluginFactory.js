/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AnalyticsEventPluginFactory
 *
 * This module provides a factory method to create the AnalyticsEventPlugin that
 * can be used to track the usage of React components that are of interest to
 * the user.
 *
 * In order to enable a component for analytics tracking, you need to specify
 * two additional attributes to the component when you describe the structure of
 * your component in the render() method:
 *
 * 1. 'data-analytics-id': This represents a unique ID that the analytics module
 *     will use to identify this component in all the analytics data. Note that
 *     this is independent of the ref or the DOM id of the element. Over the
 *     lifetime of the product, even if the component id or ref needs to be
 *     changed, as long as you can ensure the analytics ID doesnt change, the
 *     historical data can be correlated. Also note that React does NOT do
 *     anything to guarantee or enforce uniqueness of this ID. If its not unique
 *     the analytics data reported will be incorrect.
 *
 * 2. 'data-analytics-events': This is a comma separated list of DOM events that
 *     you want analytics on. React currently supports tracking only on a
 *     distinct set of events (See topLevelTypesToAnalyticsEvent).
 *     If the list contains an event that React does not recognize for analytics
 *     tracking, in __DEV__, an error will be thrown. Note that it is case
 *     sensitive and space sensitive.
 *
 * By default the AnalyticsEventPlugin is NOT enabled in React. To use it, you
 * need to create the plugin using the factory method and add it to the list of
 * Plugins maintained in the EventPluginHub before your component is rendered.
 * As creation parameters you can specify two arguments:
 *
 * 1. callback: This is a required parameter. In __DEV__, an error will be
 *    thrown if this param is missing. The callback will be called with the
 *    analyticsData as an argument. The analyticsData will contain one property
 *    per every React component, identified by its data-analytics-id. The value
 *    of this property will be an object containing properties corresponding to
 *    each of the comma separated events specified in data-analytics-events.
 *
 *    For example, if you have:
 *    <Button ...
 *      data-analytics-id="createButton"
 *      data-analytics-events="click"
 *    />
 *    and
 *    <TextBox ...
 *      data-analytics-id="disclaimerBox"
 *      data-analytics-events="focus,scroll"
 *    />
 *    analyticsData will be something like:
 *    '{"createButton":{"click":50}, "disclaimerBox":{"focus":15, "scroll":5}}'
 *
 *    DO NOT mutate the data that you get in the callback. Mutating it will lead
 *    to errors and unstable behavior.
 *
 *    The React component will be included for analytics as long as some user
 *    interaction has happened with that component. If no user interaction has
 *    happened with any of the components tracked for analytics, the callback
 *    will not be called.
 *
 * 2. interval (in milliseconds): This is an optional parameter to specify the
 *    interval at which the callback needs to be called. It needs to be greater
 *    than the 2 minutes (which is the default value if this parameter is not
 *    specified or a value less than 2 minutes is specified)
 *
 * Please refer to the unit tests AnalyticsEventPlugin-test.js for details on
 * usage.
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var emptyFunction = require('emptyFunction');
var invariant = require('invariant');
var topLevelTypes = require('EventConstants').topLevelTypes;

var ANALYTICS_ID = 'data-analytics-id';
var ANALYTICS_EVENTS = 'data-analytics-events';
var DEFAULT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

var analyticsData = {};

// List of topLevel event types that React supports for analytics tracking
var topLevelTypesToAnalyticsEvent = {
  topClick:       'click',
  topDoubleClick: 'doubleClick',
  wheel:          'wheel',
  topTouchStart:  'touchStart',
  topTouchEnd:    'touchEnd',
  topTouchMove:   'touchMove',
  topTouchCancel: 'touchCancel',
  topKeyUp:       'keyUp',
  topKeyPress:    'keyPress',
  topKeyDown:     'keyDown',
  topFocus:       'focus',
  topBlur:        'blur',
  topScroll:      'scroll',
  topChange:      'change'
};

if (__DEV__) {
  var analyticsEventNameToTopLevelType = {
    'click':        topLevelTypes.topClick,
    'doubleClick':  topLevelTypes.topDoubleClick,
    'wheel':        topLevelTypes.wheel,
    'touchStart':   topLevelTypes.topTouchStart,
    'touchEnd':     topLevelTypes.topTouchEnd,
    'touchMove':    topLevelTypes.topTouchMove,
    'touchCancel':  topLevelTypes.topTouchCancel,
    'keyUp':        topLevelTypes.topKeyUp,
    'keyPress':     topLevelTypes.topKeyPress,
    'keyDown':      topLevelTypes.topKeyDown,
    'focus':        topLevelTypes.topFocus,
    'blur':         topLevelTypes.topBlur,
    'scroll':       topLevelTypes.topScroll,
    'change':       topLevelTypes.topChange
  };
}

/**
 * This plugin does not really extract any synthetic events. Rather it just
 * looks at the top-level event and bumps up counters as appropriate
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {DOMEventTarget} topLevelTarget The listening component root node.
 * @param {string} topLevelTargetID ID of `topLevelTarget`.
 * @param {object} nativeEvent Native browser event.
 * @return {*} An accumulation of synthetic events.
 * @see {EventPluginHub.extractEvents}
 */
function extractEvents(
    topLevelType,
    topLevelTarget,
    topLevelTargetID,
    nativeEvent) {
  var currentEvent = topLevelTypesToAnalyticsEvent[topLevelType];
  if (!currentEvent || !topLevelTarget || !topLevelTarget.attributes) {
    return null;
  }

  var analyticsID = topLevelTarget.getAttribute(ANALYTICS_ID);
  var analyticsEventsStr = topLevelTarget.getAttribute(ANALYTICS_EVENTS);
  if (!analyticsID || !analyticsEventsStr) {
    return null;
  }

  var analyticsEventsArr = analyticsEventsStr.split(",");
  if (!analyticsData.hasOwnProperty(analyticsID)) {
    initAnalyticsDataForID(analyticsID, analyticsEventsArr);
  }

  if (analyticsEventsArr.indexOf(currentEvent) !== -1) {
    analyticsData[analyticsID][currentEvent]++;
  }

  return null;
}

/**
 * Initialize the analytics data for a specific element identified by the
 * analyticsID - Create an entry in the analyticsData object for the element and
 * initialize all counters for that element to 0.
 */
function initAnalyticsDataForID(analyticsID, analyticsEventsArr) {
  analyticsData[analyticsID] = {};
  analyticsEventsArr.forEach(function(analyticsEvent) {
    if (__DEV__) {
      invariant(
        analyticsEventNameToTopLevelType[analyticsEvent],
        'Invalid analyticsEvent:%s for analyticsID:%s',
        analyticsEvent,
        analyticsID
      );
    }
    analyticsData[analyticsID][analyticsEvent] = 0;
  });
}

/**
 * Returns the analytics event plugin given the callback that needs to be
 * invoked for reporting analytics and the interval at which the callback needs
 * to be invoked. This interval has to be atleast DEFAULT_INTERVAL_MS.
 */
var createAnalyticsPlugin = function(cb, interval) {
  invariant(
    ExecutionEnvironment.canUseDOM,
    'createAnalyticsPlugin(...): The DOM is not supported in the execution ' +
    'environment.'
  );

  if (__DEV__) {
    invariant(cb, 'createAnalyticsPlugin(...): You must provide a callback.');
  }
  cb = cb || emptyFunction;

  setInterval(
    function() {
      if (Object.keys(analyticsData).length) {
        // Invoke the callback with a clone of analyticsData, otherwise our
        // analyticsData will be dirtied by user changes
        cb(analyticsData);
      }
    },
    interval > DEFAULT_INTERVAL_MS ? interval : DEFAULT_INTERVAL_MS
  );

  return {extractEvents: extractEvents};
};

var AnalyticsEventPluginFactory = {
  createAnalyticsPlugin: createAnalyticsPlugin
};

module.exports = AnalyticsEventPluginFactory;
