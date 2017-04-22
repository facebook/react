/*!
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var expect = global.expect;

var numExpectations = 0;

global.expect = function() {
  numExpectations += 1;
  return expect.apply(this, arguments);
};

beforeEach(() => numExpectations = 0);

jasmine.currentEnv_.addReporter({
  specDone: spec => {
    console.log(
      `EQUIVALENCE: ${spec.description}, ` +
        `status: ${spec.status}, ` +
        `numExpectations: ${numExpectations}`
    );
  },
});
