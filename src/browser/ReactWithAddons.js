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

var LinkedStateMixin = require('LinkedStateMixin');
var React = require('React');
var ReactComponentWithPureRenderMixin =
  require('ReactComponentWithPureRenderMixin');
var ReactCSSTransitionGroup = require('ReactCSSTransitionGroup');
var ReactTransitionGroup = require('ReactTransitionGroup');

var cx = require('cx');
var cloneWithProps = require('cloneWithProps');
var update = require('update');

React.addons = {
  CSSTransitionGroup: ReactCSSTransitionGroup,
  LinkedStateMixin: LinkedStateMixin,
  PureRenderMixin: ReactComponentWithPureRenderMixin,
  TransitionGroup: ReactTransitionGroup,

  classSet: cx,
  cloneWithProps: cloneWithProps,
  update: update
};

if (__DEV__) {
  React.addons.Perf = require('ReactDefaultPerf');
  React.addons.TestUtils = require('ReactTestUtils');
}

module.exports = React;

