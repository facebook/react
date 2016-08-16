/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactAddonsDOMDependencies
 */

'use strict';

var ReactDOM = require('ReactDOM');
var ReactInstanceMap = require('ReactInstanceMap');

exports.getReactDOM = function() {
  return ReactDOM;
};

exports.getReactInstanceMap = function() {
  return ReactInstanceMap;
};

if (__DEV__) {
  var ReactPerf = require('ReactPerf');
  var ReactTestUtils = require('ReactTestUtils');

  exports.getReactPerf = function() {
    return ReactPerf;
  };

  exports.getReactTestUtils = function() {
    return ReactTestUtils;
  };
}
