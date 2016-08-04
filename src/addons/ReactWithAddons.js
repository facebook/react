/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactWithAddons
 */

'use strict';

var LinkedStateMixin = require('LinkedStateMixin');
var React = require('React');
var ReactComponentWithPureRenderMixin =
  require('ReactComponentWithPureRenderMixin');
var ReactCSSTransitionGroup = require('ReactCSSTransitionGroup');
var ReactFragment = require('ReactFragment');
var ReactTransitionGroup = require('ReactTransitionGroup');

var shallowCompare = require('shallowCompare');
var update = require('update');

React.addons = {
  CSSTransitionGroup: ReactCSSTransitionGroup,
  LinkedStateMixin: LinkedStateMixin,
  PureRenderMixin: ReactComponentWithPureRenderMixin,
  TransitionGroup: ReactTransitionGroup,

  createFragment: ReactFragment.create,
  shallowCompare: shallowCompare,
  update: update,
};

if (__DEV__) {
  // We need to lazily require these modules for the browser build since they
  // will depend on DOM internals which hasn't loaded yet.
  Object.defineProperty(React.addons, 'Perf', {
    enumerable: true,
    get: function() {
      return require('ReactPerf');
    },
  });
  Object.defineProperty(React.addons, 'TestUtils', {
    enumerable: true,
    get: function() {
      return require('ReactTestUtils');
    },
  });
}

module.exports = React;
