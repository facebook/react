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

type Options = {onError?: mixed => ?string};

export function renderToResult(
  model: ReactClientValue,
  options?: Options,
): Result<ReactClientValue> {
  const request = createRequest(model, options ? options.onError : undefined);
  startWork(request);
  return getResult(request);
}

export function renderResultToPipeableStream(
  result: Result<ReactClientValue>,
  turbopackMap: ClientManifest,
  options?: Options,
): PipeableStream {
  const input = createInput(result);
  return renderToPipeableStream(
    input,
    turbopackMap,
    options ? options.onError : undefined,
  );
}
