/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostDispatcher} from './ReactDOMDispatcher';

type InternalsType = {
  usingClientEntryPoint: boolean,
  Events: [any, any, any, any, any, any],
  Dispatcher: {
    current: null | HostDispatcher,
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
