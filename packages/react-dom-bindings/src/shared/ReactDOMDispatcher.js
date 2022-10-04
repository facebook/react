/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type DispatcherType = {
  [string]: mixed,
};

const Dispatcher: {current: null | DispatcherType} = {
  current: null,
};

export default Dispatcher;
