/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type InternalsType = {
  usingClientEntryPoint: boolean,
  Events: [any, any, any, any, any, any],
  Dispatcher: {
    current: mixed,
  },
};

const Internals: InternalsType = ({
  usingClientEntryPoint: false,
  Events: null,
  Dispatcher: {
    current: null,
  },
}: any);

export default Internals;
