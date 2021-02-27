/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var ReactDOM = require('react-dom/lib/ReactDOM');

exports.getReactDOM = function () {
  return ReactDOM;
};

if (process.env.NODE_ENV !== 'production') {
  var ReactPerf;
  var ReactTestUtils;

  exports.getReactPerf = function () {
    if (!ReactPerf) {
      ReactPerf = require('react-dom/lib/ReactPerf');
    }
    return ReactPerf;
  };

  exports.getReactTestUtils = function () {
    if (!ReactTestUtils) {
      ReactTestUtils = require('react-dom/lib/ReactTestUtils');
    }
    return ReactTestUtils;
  };
}