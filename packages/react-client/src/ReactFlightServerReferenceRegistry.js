/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

type ServerReferenceId = any;

export const knownServerReferences: WeakMap<
  Function,
  {id: ServerReferenceId, bound: null | Thenable<Array<any>>},
> = new WeakMap();
