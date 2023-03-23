/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Request,
  ReactClientValue,
} from 'react-server/src/ReactFlightServer';
import type {Destination} from 'react-server/src/ReactServerStreamConfigNode';
import type {ClientManifest} from './ReactFlightServerWebpackBundlerConfig';
import type {ServerManifest} from 'react-client/src/ReactFlightClientHostConfig';
import type {Busboy} from 'busboy';
import type {Writable} from 'stream';
import type {ServerContextJSONValue, Thenable} from 'shared/ReactTypes';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFlightServer';

import {
  createResponse,
  reportGlobalError,
  close,
  resolveField,
  resolveFile,
  resolveFileInfo,
  resolveFileChunk,
  resolveFileComplete,
  getRoot,
} from 'react-server/src/ReactFlightReplyServer';

function createDrainHandler(destination: Destination, request: Request) {
  return () => startFlowing(request, destination);
}

type Options = {
  onError?: (error: mixed) => void,
  context?: Array<[string, ServerContextJSONValue]>,
  identifierPrefix?: string,
};

type PipeableStream = {
  abort(reason: mixed): void,
  pipe<T: Writable>(destination: T): T,
};

function renderToPipeableStream(
  model: ReactClientValue,
  webpackMap: ClientManifest,
  options?: Options,
): PipeableStream {
  const request = createRequest(
    model,
    webpackMap,
    options ? options.onError : undefined,
    options ? options.context : undefined,
    options ? options.identifierPrefix : undefined,
  );
  let hasStartedFlowing = false;
  startWork(request);
  return {
    pipe<T: Writable>(destination: T): T {
      if (hasStartedFlowing) {
        throw new Error(
          'React currently only supports piping to one writable stream.',
        );
      }
      hasStartedFlowing = true;
      startFlowing(request, destination);
      destination.on('drain', createDrainHandler(destination, request));
      return destination;
    },
    abort(reason: mixed) {
      abort(request, reason);
    },
  };
}

function decodeReplyFromBusboy<T>(
  busboyStream: Busboy,
  webpackMap: ServerManifest,
): Thenable<T> {
  const response = createResponse(webpackMap);
  busboyStream.on('field', (name, value) => {
    const id = +name;
    resolveField(response, id, value);
  });
  busboyStream.on('file', (name, value, {filename, encoding, mimeType}) => {
    if (encoding.toLowerCase() === 'base64') {
      throw new Error(
        "React doesn't accept base64 encoded file uploads because we don't expect " +
          "form data passed from a browser to ever encode data that way. If that's " +
          'the wrong assumption, we can easily fix it.',
      );
    }
    const id = +name;
    const file = resolveFileInfo(response, id, filename, mimeType);
    value.on('data', chunk => {
      resolveFileChunk(response, file, chunk);
    });
    value.on('end', () => {
      resolveFileComplete(response, file);
    });
  });
  busboyStream.on('finish', () => {
    close(response);
  });
  busboyStream.on('error', err => {
    reportGlobalError(response, err);
  });
  return getRoot(response);
}

function decodeReply<T>(
  body: string | FormData,
  webpackMap: ServerManifest,
): Thenable<T> {
  const response = createResponse(webpackMap);
  if (typeof body === 'string') {
    resolveField(response, 0, body);
  } else {
    // $FlowFixMe[prop-missing] Flow doesn't know that forEach exists.
    body.forEach((value: string | File, key: string) => {
      const id = +key;
      if (typeof value === 'string') {
        resolveField(response, id, value);
      } else {
        resolveFile(response, id, value);
      }
    });
  }
  close(response);
  return getRoot(response);
}

export {renderToPipeableStream, decodeReplyFromBusboy, decodeReply};
