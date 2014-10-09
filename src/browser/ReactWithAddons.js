/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
var ReactUpdates = require('ReactUpdates');

var cx = require('cx');
var cloneWithProps = require('cloneWithProps');
var update = require('update');

React.addons = {
  CSSTransitionGroup: ReactCSSTransitionGroup,
  LinkedStateMixin: LinkedStateMixin,
  PureRenderMixin: ReactComponentWithPureRenderMixin,
  TransitionGroup: ReactTransitionGroup,

  batchedUpdates: ReactUpdates.batchedUpdates,
  classSet: cx,
  cloneWithProps: cloneWithProps,
  update: update
};

if (__DEV__) {
  React.addons.Perf = require('ReactDefaultPerf');
  React.addons.TestUtils = require('ReactTestUtils');
}

module.exports = React;
