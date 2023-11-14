/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableBinaryFlight} from 'shared/ReactFeatureFlags';
import type {Thenable} from 'shared/ReactTypes';
import type {Response as FlightResponse} from 'react-client/src/ReactFlightClient';

import {
  createResponse,
  getRoot,
  reportGlobalError,
  processBinaryChunk,
  close,
} from 'react-client/src/ReactFlightClient';

import type {SSRModuleMap} from './ReactFlightClientConfigFBBundler';

type Options = {
  moduleMap: SSRModuleMap,
};

function createResponseFromOptions(options: void | Options) {
  const moduleMap = options && options.moduleMap;
  if (moduleMap == null) {
    throw new Error('Expected `moduleMap` to be defined.');
  }

  return createResponse(moduleMap, null, undefined, undefined);
}

function processChunk(response: FlightResponse, chunk: string | Uint8Array) {
  if (enableBinaryFlight) {
    if (typeof chunk === 'string') {
      throw new Error(
        '`enableBinaryFlight` flag is enabled, expected a Uint8Array as input, got string.',
      );
    }
  }
  const buffer = typeof chunk !== 'string' ? chunk : encodeString(chunk);

  processBinaryChunk(response, buffer);
}

function encodeString(string: string) {
  const textEncoder = new TextEncoder();
  return textEncoder.encode(string);
}

function startReadingFromStream(
  response: FlightResponse,
  stream: ReadableStream,
): void {
  const reader = stream.getReader();
  function progress({
    done,
    value,
  }: {
    done: boolean,
    value: ?any,
    ...
  }): void | Promise<void> {
    if (done) {
      close(response);
      return;
    }
    const buffer: Uint8Array = (value: any);
    processChunk(response, buffer);
    return reader.read().then(progress).catch(error);
  }
  function error(e: any) {
    reportGlobalError(response, e);
  }
  reader.read().then(progress).catch(error);
}

function createFromReadableStream<T>(
  stream: ReadableStream,
  options?: Options,
): Thenable<T> {
  const response: FlightResponse = createResponseFromOptions(options);
  startReadingFromStream(response, stream);
  return getRoot(response);
}

export {createFromReadableStream};
