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

'use strict';

function getReactDOM() {
  var ReactWithAddonsUMDEntry = require('ReactWithAddonsUMDEntry');
  // This is injected by the ReactDOM UMD build:
  return ReactWithAddonsUMDEntry.__SECRET_INJECTED_REACT_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
}

exports.getReactDOM = getReactDOM;

if (__DEV__) {
  exports.getReactPerf = function() {
    return getReactDOM().__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactPerf;
  };

  exports.getReactTestUtils = function() {
    return getReactDOM().__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactTestUtils;
  };
}
