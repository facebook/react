/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightResultServer';
import type {Result} from 'shared/ReactFlightResult';
import type {PipeableStream} from './ReactFlightDOMResultSerializationServerNode';
import type {ClientManifest} from './ReactFlightServerConfigTurbopackBundler';
import {
  createRequest,
  getResult,
  startWork,
} from 'react-server/src/ReactFlightResultServer';
import {createInput} from 'react-server/src/ReactFlightResultSerialization';
import {renderToPipeableStream} from './ReactFlightDOMResultSerializationServerNode';

export function renderToResult(
  model: ReactClientValue,
  options?: mixed,
): Result<ReactClientValue> {
  if (options !== undefined) {
    throw new Error('Not implemented.');
  }
  const request = createRequest(model);
  startWork(request);
  return getResult(request);
}

export function renderResultToPipeableStream(
  result: Result<ReactClientValue>,
  turbopackMap: ClientManifest,
  options?: mixed,
): PipeableStream {
  if (options !== undefined) {
    throw new Error('Not implemented.');
  }
  const input = createInput(result);
  return renderToPipeableStream(input, turbopackMap);
}
