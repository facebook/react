/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file is an intermediate layer to translate between Flight
// calls to stream output over a binary stream.

/*
FLIGHT PROTOCOL GRAMMAR

Response
- RowSequence

RowSequence
- Row RowSequence
- Row

Row
- "J" RowID JSONData
- "M" RowID JSONModuleData
- "H" RowID HTMLData
- "B" RowID BlobData
- "U" RowID URLData
- "E" RowID ErrorData

RowID
- HexDigits ":"

HexDigits
- HexDigit HexDigits
- HexDigit

HexDigit
- 0-F

URLData
- (UTF8 encoded URL) "\n"

ErrorData
- (UTF8 encoded JSON: {message: "...", stack: "..."}) "\n"

JSONData
- (UTF8 encoded JSON) "\n"
  - String values that begin with $ are escaped with a "$" prefix.
  - References to other rows are encoding as JSONReference strings.

JSONReference
- "$" HexDigits

HTMLData
- ByteSize (UTF8 encoded HTML)

BlobData
- ByteSize (Binary Data)

ByteSize
- (unsigned 32-bit integer)
*/

// TODO: Implement HTMLData, BlobData and URLData.

import type {
  Request,
  ReactClientValue,
} from 'react-server/src/ReactFlightServer';

import {stringToChunk} from './ReactServerStreamConfig';

import type {Chunk} from './ReactServerStreamConfig';

export type {Destination, Chunk} from './ReactServerStreamConfig';

export {
  supportsRequestStorage,
  requestStorage,
} from './ReactServerStreamConfig';

const stringify = JSON.stringify;

function serializeRowHeader(tag: string, id: number) {
  return id.toString(16) + ':' + tag;
}

export function processErrorChunkProd(
  request: Request,
  id: number,
  digest: string,
): Chunk {
  if (__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'processErrorChunkProd should never be called while in development mode. Use processErrorChunkDev instead. This is a bug in React.',
    );
  }

  const errorInfo: any = {digest};
  const row = serializeRowHeader('E', id) + stringify(errorInfo) + '\n';
  return stringToChunk(row);
}

export function processErrorChunkDev(
  request: Request,
  id: number,
  digest: string,
  message: string,
  stack: string,
): Chunk {
  if (!__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'processErrorChunkDev should never be called while in production mode. Use processErrorChunkProd instead. This is a bug in React.',
    );
  }

  const errorInfo: any = {digest, message, stack};
  const row = serializeRowHeader('E', id) + stringify(errorInfo) + '\n';
  return stringToChunk(row);
}

export function processModelChunk(
  request: Request,
  id: number,
  model: ReactClientValue,
): Chunk {
  // $FlowFixMe[incompatible-type] stringify can return null
  const json: string = stringify(model, request.toJSON);
  const row = id.toString(16) + ':' + json + '\n';
  return stringToChunk(row);
}

export function processReferenceChunk(
  request: Request,
  id: number,
  reference: string,
): Chunk {
  const json = stringify(reference);
  const row = id.toString(16) + ':' + json + '\n';
  return stringToChunk(row);
}

export function processImportChunk(
  request: Request,
  id: number,
  clientReferenceMetadata: ReactClientValue,
): Chunk {
  // $FlowFixMe[incompatible-type] stringify can return null
  const json: string = stringify(clientReferenceMetadata);
  const row = serializeRowHeader('I', id) + json + '\n';
  return stringToChunk(row);
}

export {
  scheduleWork,
  flushBuffered,
  beginWriting,
  writeChunk,
  writeChunkAndReturn,
  completeWriting,
  close,
  closeWithError,
} from './ReactServerStreamConfig';
