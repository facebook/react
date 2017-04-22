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

const emptyFunction = require('fbjs/lib/emptyFunction');
const {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} = require('ReactDOM-fb');

// TODO: remove this whole module when we delete Stack
const ReactPerfFiberShim = {
  getLastMeasurements: emptyFunction,
  getExclusive: emptyFunction,
  getInclusive: emptyFunction,
  getWasted: emptyFunction,
  getOperations: emptyFunction,
  printExclusive: emptyFunction,
  printInclusive: emptyFunction,
  printWasted: emptyFunction,
  printOperations: emptyFunction,
  start: emptyFunction,
  stop: emptyFunction,
  isRunning: emptyFunction,
  printDOM: emptyFunction,
  getMeasurementsSummaryMap: emptyFunction,
};

module.exports = __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactPerf ||
  ReactPerfFiberShim;
