/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactServerContext} from 'shared/ReactTypes';

export const ContextRegistry: {
  [globalName: string]: ReactServerContext<any>,
} = {};
