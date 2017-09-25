/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactAddonsDOMDependencies
 */

'use strict';

var ReactDOM = require('ReactDOM');

exports.getReactDOM = function() {
  return ReactDOM;
};

if (__DEV__) {
  var ReactPerf;
  var ReactTestUtils;

  exports.getReactPerf = function() {
    if (!ReactPerf) {
      ReactPerf = require('ReactPerf');
    }
    return ReactPerf;
  };

  exports.getReactTestUtils = function() {
    if (!ReactTestUtils) {
      ReactTestUtils = require('ReactTestUtils');
    }
    return ReactTestUtils;
  };
}
