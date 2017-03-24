/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestUtils
 */

'use strict';

function getTestUtils() {
  const ReactDOM = require('ReactDOM-fb');
  return ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactTestUtils;
}

const TestUtils = {...getTestUtils()};

if (__DEV__) {
  // Lasciate ogni speranza, voi ch'entrate.
  //
  // Some www tests currently rely on require('ReactTestUtils') acting as a lazy
  // require for the whole ReactDOM implementation. However this is no longer
  // the case with flat bundles since the implementation doesn't get transformed
  // by www lazy requires. As a result, if test calls jest.resetModuleRegistry()
  // in beforeEach(), Enzyme's ReactDOM reference will be stale and won't be
  // able to share any global state (such as current owner) with the newly reset
  // React singleton that would be used in classes inside the test cases.
  // To work around it, I'm making any TestUtils method call proxy to the latest
  // ReactDOM implementation. There might be a better way to do it but my brain
  // is fried. If you have ideas, please change it to something more reasonable.
  //
  // https://fburl.com/jgn0nh70
  Object.keys(TestUtils).forEach(key => {
    Object.defineProperty(TestUtils, key, {
      get() {
        return getTestUtils()[key];
      },
    });
  })
  Object.keys(TestUtils.Simulate).forEach(key => {
    Object.defineProperty(TestUtils.Simulate, key, {
      get() {
        return getTestUtils().Simulate[key];
      },
    });
  });
  Object.keys(TestUtils.SimulateNative).forEach(key => {
    Object.defineProperty(TestUtils.SimulateNative, key, {
      get() {
        return getTestUtils().SimulateNative[key];
      },
    });
  });
}

module.exports = TestUtils;
