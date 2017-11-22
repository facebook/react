/*!
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var expect = global.expect;

var numExpectations = 0;

global.expect = function() {
  numExpectations += 1;
  return expect.apply(this, arguments);
};

global.spyOnDev = function(...args) {
  if (__DEV__) {
    return spyOn(...args);
  }
};

beforeEach(() => (numExpectations = 0));

jasmine.currentEnv_.addReporter({
  specDone: spec => {
    console.log(
      `EQUIVALENCE: ${spec.description}, ` +
        `status: ${spec.status}, ` +
        `numExpectations: ${numExpectations}`
    );
  },
});
