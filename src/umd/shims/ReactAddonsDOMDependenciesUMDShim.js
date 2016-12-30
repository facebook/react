/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactAddonsDOMDependenciesUMDShim
 */

/* globals ReactDOM */

'use strict';

exports.getReactDOM = function() {
  return ReactDOM;
};

exports.getReactInstanceMap = function() {
  return ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactInstanceMap;
};

if (__DEV__) {
  exports.getReactPerf = function() {
    return ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactPerf;
  };

  exports.getReactTestUtils = function() {
    return ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactTestUtils;
  };
}
