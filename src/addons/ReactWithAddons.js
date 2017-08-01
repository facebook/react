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
var ReactAddonsDOMDependencies = require('ReactAddonsDOMDependencies');
var ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');
var ReactCSSTransitionGroup = require('ReactCSSTransitionGroup');
var ReactFragment = require('ReactFragment');
var ReactTransitionGroup = require('ReactTransitionGroup');

var lowPriorityWarning = require('lowPriorityWarning');
var shallowCompare = require('shallowCompare');
var update = require('update');

const reactAddonValues = {
  CSSTransitionGroup: ReactCSSTransitionGroup,
  LinkedStateMixin: LinkedStateMixin,
  PureRenderMixin: ReactComponentWithPureRenderMixin,
  TransitionGroup: ReactTransitionGroup,

  createFragment: ReactFragment.create,
  shallowCompare: shallowCompare,
  update: update,
};

if (__DEV__) {
  // Because React.addons is deprecated
  // we will wrap each add-on with a getter that warns.
  React.addons = {};

  const addonsDeprecationMessages = {
    CSSTransitionGroup: 'React.addons.CSSTransitionGroup has moved. ' +
      'Use react-transition-group/CSSTransitionGroup instead. ' +
      'Version 1.1.3 provides a drop-in replacement. ' +
      '(https://github.com/reactjs/react-transition-group)' +
      'See https://facebook.github.io/react/blog/#discontinuing-' +
      'support-for-react-addons for more details.',
    LinkedStateMixin: 'React.addons.LinkedStateMixin is deprecated. ' +
      'Explicitly set the value and onChange handler instead. ',
    PureRenderMixin: 'React.addons.PureRenderMixin is deprecated. ' +
      'Use React.PureComponent instead. ' +
      '(https://facebook.github.io/react/docs/react-api.html' +
      '#react.purecomponent)',
    TransitionGroup: 'React.addons.TransitionGroup has moved. ' +
      'Use react-transition-group/TransitionGroup instead. ' +
      'Version 1.1.3 provides a drop-in replacement. ' +
      '(https://github.com/reactjs/react-transition-group)',
    createFragment: 'React.addons.createFragment is deprecated. ' +
      'React 16 will have first-class support for fragments, at which ' +
      "point this package won't be necessary. " +
      'We recommend using arrays of keyed elements instead.',
    shallowCompare: 'React.addons.shallowCompare is no longer supported. ' +
      'Use React.PureComponent instead. ' +
      '(https://facebook.github.io/react/docs/react-api.html' +
      '#react.purecomponent)',
    update: 'React.addons.update is no longer supported. ' +
      'Use immutability-helper instead. ' +
      'Version 2.2.2 provides a drop-in replacement. ' +
      '(https://github.com/kolodny/immutability-helper)',
    TestUtils: 'React.addons.TestUtils has moved. ' +
      'Use react-dom/test-utils instead. ' +
      'See (https://facebook.github.io/react/blog/#react-test-utils) ' +
      'for more details.',
  };

  Object.keys(reactAddonValues).forEach(key => {
    const value = React.addons[key];
    const warningMessage = addonsDeprecationMessages[key];

    Object.defineProperty(React.addons, key, {
      enumerable: true,
      get: function() {
        lowPriorityWarning(false, warningMessage);
        return value;
      },
    });
  });

  // For the UMD build we get these lazily from the global since they're tied
  // to the DOM renderer and it hasn't loaded yet.
  Object.defineProperty(React.addons, 'Perf', {
    enumerable: true,
    get: function() {
      // We are not logging a deprecation notice about 'Perf' because
      // there is not really anything to do before the 16.0 release.
      // People will need to use the Chrome devtools or other tools for perf.
      // monitoring after React 16.0.
      return ReactAddonsDOMDependencies.getReactPerf();
    },
  });
  Object.defineProperty(React.addons, 'TestUtils', {
    enumerable: true,
    get: function() {
      lowPriorityWarning(false, addonsDeprecationMessages['TestUtils']);
      return ReactAddonsDOMDependencies.getReactTestUtils();
    },
  });
} else {
  // Don't bother to wrap with getters that warn outside of development.
  React.addons = reactAddonValues;
}

module.exports = React;
