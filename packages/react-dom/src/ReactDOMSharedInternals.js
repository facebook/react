/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { HostDispatcher } = require('./ReactDOMDispatcher');

const InternalsType = {
  usingClientEntryPoint: false,
  Events: [null, null, null, null, null, null],
  Dispatcher: {
    current: null,
  },
};

const Internals = {
  ...InternalsType,
  Dispatcher: {
    current: null,
  },
};

module.exports = Internals;
