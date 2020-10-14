/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var LinkedStateMixin = require('./LinkedStateMixin');
var React = require('./React');
var ReactAddonsDOMDependencies = require('./ReactAddonsDOMDependencies');
var ReactComponentWithPureRenderMixin = require('./ReactComponentWithPureRenderMixin');
var ReactCSSTransitionGroup = require('./ReactCSSTransitionGroup');
var ReactFragment = require('./ReactFragment');
var ReactTransitionGroup = require('./ReactTransitionGroup');

var shallowCompare = require('./shallowCompare');
var update = require('./update');

React.addons = {
  CSSTransitionGroup: ReactCSSTransitionGroup,
  LinkedStateMixin: LinkedStateMixin,
  PureRenderMixin: ReactComponentWithPureRenderMixin,
  TransitionGroup: ReactTransitionGroup,

  createFragment: ReactFragment.create,
  shallowCompare: shallowCompare,
  update: update
};

if (process.env.NODE_ENV !== 'production') {
  // For the UMD build we get these lazily from the global since they're tied
  // to the DOM renderer and it hasn't loaded yet.
  Object.defineProperty(React.addons, 'Perf', {
    enumerable: true,
    get: function () {
      return ReactAddonsDOMDependencies.getReactPerf();
    }
  });
  Object.defineProperty(React.addons, 'TestUtils', {
    enumerable: true,
    get: function () {
      return ReactAddonsDOMDependencies.getReactTestUtils();
    }
  });
}

module.exports = React;