/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule ReactWithAddons
 */

/**
 * This module exists purely in the open source project, and is meant as a way
 * to create a separate standalone build of React. This build has "addons", or
 * functionality we've built and think might be useful but doesn't have a good
 * place to live inside React core.
 */

"use strict";

var AnalyticsEventPluginFactory = require('AnalyticsEventPluginFactory');
var LinkedStateMixin = require('LinkedStateMixin');
var React = require('React');
var ReactCSSTransitionGroup = require('ReactCSSTransitionGroup');
var ReactInjection = require('ReactInjection');
var ReactTransitionGroup = require('ReactTransitionGroup');
var ResponderEventPlugin = require('ResponderEventPlugin');
var TapEventPlugin = require('TapEventPlugin');

var cx = require('cx');
var cloneWithProps = require('cloneWithProps');

React.addons = {
  LinkedStateMixin: LinkedStateMixin,
  CSSTransitionGroup: ReactCSSTransitionGroup,
  TransitionGroup: ReactTransitionGroup,

  classSet: cx,
  cloneWithProps: cloneWithProps,

  injectTapEventPlugin: function() {
    ReactInjection.EventPluginHub.injectEventPluginsByName({
      TapEventPlugin: TapEventPlugin
    });
  },
  injectResponderPlugin: function() {
    ReactInjection.EventPluginHub.injectEventPluginsByName({
      ResponderEventPlugin: ResponderEventPlugin
    });
  },
  injectAnalyticsEventPlugin: function(cb, interval) {
    ReactInjection.EventPluginHub.injectEventPluginsByName({
      AnalyticsEventPlugin: AnalyticsEventPluginFactory.createAnalyticsPlugin(
        cb,
        interval
      )
    });
  }
};

if (__DEV__) {
  React.addons.TestUtils = require('ReactTestUtils');
}

module.exports = React;
