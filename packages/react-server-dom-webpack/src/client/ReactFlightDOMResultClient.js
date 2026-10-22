/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';
import type {Result} from 'shared/ReactFlightResult';

import {
  createResponse,
  getRoot,
} from 'react-client/src/ReactFlightResultClient';

import {isClientReference} from '../ReactFlightWebpackReferences';

export type Options = {
  onError?: (error: mixed) => ?string,
};

export function createFromResult<T>(
  result: Result<T>,
  options?: Options,
): Thenable<T> {
  const response = createResponse(
    result,
    {isClientReference},
    options ? options.onError : undefined,
  );
  return getRoot(response);
}
