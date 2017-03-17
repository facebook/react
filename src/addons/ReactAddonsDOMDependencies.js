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

var ReactDOM = require('react-dom');

exports.getReactDOM = function() {
  return ReactDOM;
};

if (__DEV__) {
  var ReactPerf;
  var ReactTestUtils;

  exports.getReactPerf = function() {
    if (!ReactPerf) {
      ReactPerf = require('react-dom/lib/ReactPerf');
    }
    return ReactPerf;
  };

  exports.getReactTestUtils = function() {
    if (!ReactTestUtils) {
      ReactTestUtils = require('react-dom/lib/ReactTestUtils');
    }
    return ReactTestUtils;
  };
}
