/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactServerContext} from 'shared/ReactTypes';

import {REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED} from 'shared/ReactSymbols';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {createServerContext} from 'react';

const ContextRegistry = ReactSharedInternals.ContextRegistry;

export function getOrCreateServerContext(
  globalName: string,
): ReactServerContext<any> {
  if (!ContextRegistry[globalName]) {
    ContextRegistry[globalName] = createServerContext(
      globalName,
      // $FlowFixMe[incompatible-call] function signature doesn't reflect the symbol value
      REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,
    );
  }
  return ContextRegistry[globalName];
}
