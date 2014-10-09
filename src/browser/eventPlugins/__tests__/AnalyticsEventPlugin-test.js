/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var mocks = require('mocks');

describe('AnalyticsEventPlugin', function() {
  var AnalyticsEventPluginFactory;
  var EventPluginHub;
  var EventPluginRegistry;
  var React;
  var ReactBrowserEventEmitter;
  var ReactTestUtils;

  var DefaultEventPluginOrder;
  var EnterLeaveEventPlugin;
  var ChangeEventPlugin;
  var ReactInstanceHandles;
  var SimpleEventPlugin;

  beforeEach(function() {
    AnalyticsEventPluginFactory = require('AnalyticsEventPluginFactory');
    EventPluginHub = require('EventPluginHub');
    EventPluginRegistry = require('EventPluginRegistry');
    React = require('React');
    ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
    ReactTestUtils = require('ReactTestUtils');

    EventPluginRegistry._resetEventPlugins();

    // Re-inject default events system after resetting.
    DefaultEventPluginOrder = require('DefaultEventPluginOrder');
    EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
    ChangeEventPlugin = require('ChangeEventPlugin');
    ReactInstanceHandles = require('ReactInstanceHandles');
    SimpleEventPlugin = require('SimpleEventPlugin');

    EventPluginHub.injection.injectEventPluginOrder(DefaultEventPluginOrder);
    EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

    EventPluginHub.injection.injectEventPluginsByName({
      'SimpleEventPlugin': SimpleEventPlugin,
      'EnterLeaveEventPlugin': EnterLeaveEventPlugin,
      'ChangeEventPlugin': ChangeEventPlugin
    });

  });

  it('should count events correctly', function() {
    var numClickEvents = 5;
    var numDoubleClickEvents = 7;
    var TEST_ANALYTICS_ID = 'test_analytics_id';
    var TestValidEvents = React.createClass({
      render: function() {
        return (
          <div ref="testDiv"
            data-analytics-id={TEST_ANALYTICS_ID}
            data-analytics-events='click,doubleClick'>
            Test
          </div>
        );
      }
    });
    var renderedComponent =
      ReactTestUtils.renderIntoDocument(<TestValidEvents />);

    var cb = mocks.getMockFunction().mockImplementation(
      function(analyticsData) {
        expect(Object.keys(analyticsData).length).toBe(1);
        expect(Object.keys(analyticsData[TEST_ANALYTICS_ID]).length).toBe(2);
        expect(analyticsData[TEST_ANALYTICS_ID].click).toBe(numClickEvents);
        expect(analyticsData[TEST_ANALYTICS_ID].doubleClick).toBe(
          numDoubleClickEvents
        );
      }
    );

    EventPluginHub.injection.injectEventPluginsByName({
      AnalyticsEventPlugin:
        AnalyticsEventPluginFactory.createAnalyticsPlugin(cb)
    });

    // Simulate some clicks
    for (var i = 0; i < numClickEvents; i++) {
      ReactTestUtils.SimulateNative.click(renderedComponent.refs.testDiv);
    }
    // Simulate some double clicks
    for (i = 0; i < numDoubleClickEvents; i++) {
      ReactTestUtils.SimulateNative.doubleClick(renderedComponent.refs.testDiv);
    }
    // Simulate some other events not being tracked for analytics
    ReactTestUtils.SimulateNative.focus(renderedComponent.refs.testDiv);

    window.mockRunTimersOnce();
    expect(cb).toBeCalled();
  });

  it('error non no callback', function() {
    expect(function() {
      AnalyticsEventPluginFactory.createAnalyticsPlugin(null);
    }).toThrow();
  });

  it('error on invalid analytics events', function() {
    var TestInvalidEvents = React.createClass({
      render: function() {
        return (
          <div ref="testDiv"
            data-analytics-id='test_invalid_events'
            data-analytics-events='click,123'>
            Test
          </div>
        );
      }
    });
    var renderedComponent =
      ReactTestUtils.renderIntoDocument(<TestInvalidEvents />);

    var cb = mocks.getMockFunction();

    EventPluginHub.injection.injectEventPluginsByName({
      AnalyticsEventPlugin: AnalyticsEventPluginFactory.createAnalyticsPlugin(
        cb
      )
    });

    var error = false;
    try {
      ReactTestUtils.SimulateNative.click(renderedComponent.refs.testDiv);
    } catch(e) {
      error = true;
    }

    expect(error).toBe(true);
  });
});
