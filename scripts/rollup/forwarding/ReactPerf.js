/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPerf
 */

'use strict';

// There is a cyclical dependency between ReactGK and
// this module. Add an indirection to delay it.
// We will remove this anyway.

function getReactPerf() {
  const {
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  } = require('ReactDOM');
  return __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactPerf;
}

const LazyReactPerf = {
  getLastMeasurements(...args) {
    return getReactPerf().getLastMeasurements(...args);
  },
  getExclusive(...args) {
    return getReactPerf().getExclusive(...args);
  },
  getInclusive(...args) {
    return getReactPerf().getInclusive(...args);
  },
  getWasted(...args) {
    return getReactPerf().getWasted(...args);
  },
  getOperations(...args) {
    return getReactPerf().getOperations(...args);
  },
  printExclusive(...args) {
    return getReactPerf().printExclusive(...args);
  },
  printInclusive(...args) {
    return getReactPerf().printInclusive(...args);
  },
  printWasted(...args) {
    return getReactPerf().printWasted(...args);
  },
  printOperations(...args) {
    return getReactPerf().printOperations(...args);
  },
  start() {
    return getReactPerf().start();
  },
  stop() {
    return getReactPerf().stop();
  },
  isRunning(...args) {
    return getReactPerf().isRunning(...args);
  },
  printDOM(...args) {
    return getReactPerf().printDOM(...args);
  },
  getMeasurementsSummaryMap(...args) {
    return getReactPerf().getMeasurementsSummaryMap(...args);
  },
};

module.exports = LazyReactPerf;
