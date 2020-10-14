/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var ReactDOM;

function getReactDOM() {
  if (!ReactDOM) {
    // This is safe to use because current module only exists in the addons build:
    var ReactWithAddonsUMDEntry = require('./ReactWithAddonsUMDEntry');
    // This is injected by the ReactDOM UMD build:
    ReactDOM = ReactWithAddonsUMDEntry.__SECRET_INJECTED_REACT_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  }
  return ReactDOM;
}

exports.getReactDOM = getReactDOM;

if (process.env.NODE_ENV !== 'production') {
  exports.getReactPerf = function () {
    return getReactDOM().__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactPerf;
  };

  exports.getReactTestUtils = function () {
    return getReactDOM().__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactTestUtils;
  };
}