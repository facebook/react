/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Writable} from 'stream';
import {textEncoder} from 'react-server/src/ReactServerStreamConfigNode';
import type {TemporaryReferenceSet} from 'react-server/src/ReactFlightServerTemporaryReferences';
import type {ClientManifest} from './ReactFlightServerConfigWebpackBundler';
import type {
  Input,
  Request,
} from 'react-server/src/ReactFlightResultSerializationServer';
import {
  createRequest,
  startWork,
  startFlowing,
  stopFlowing,
  abort,
  attachAbortSignal,
} from 'react-server/src/ReactFlightResultSerializationServer';

export type PipeableStream = {
  pipe<T: Writable>(destination: T): T,
  abort(reason: mixed): void,
};

function createDrainHandler(destination: Writable, request: Request) {
  return () => startFlowing(request, destination);
}

function createCancelHandler(request: Request, reason: string) {
  return () => {
    stopFlowing(request);
    abort(request, new Error(reason));
  };
}

export function renderToPipeableStream(
  input: Input,
  webpackMap: ClientManifest,
  onError?: mixed => ?string,
  signal?: AbortSignal,
  temporaryReferences?: TemporaryReferenceSet,
  environmentName?: string | (() => string),
  filterStackFrame?: (url: string, functionName: string) => boolean,
): PipeableStream {
  const request = createRequest(
    input,
    webpackMap,
    onError,
    temporaryReferences,
    __DEV__ ? environmentName : undefined,
    __DEV__ ? filterStackFrame : undefined,
  );
  let hasStartedFlowing = false;
  startWork(request);
  if (signal !== undefined) {
    attachAbortSignal(request, signal);
  }
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
      destination.on(
        'error',
        createCancelHandler(
          request,
          'The destination stream errored while writing data.',
        ),
      );
      destination.on(
        'close',
        createCancelHandler(request, 'The destination stream closed early.'),
      );
      return destination;
    },
    abort(reason: mixed) {
      abort(request, reason);
    },
  };
}

export type ReadableStreamOptions = {
  onError?: mixed => ?string,
  signal?: AbortSignal,
  temporaryReferences?: TemporaryReferenceSet,
  environmentName?: string | (() => string),
  filterStackFrame?: (url: string, functionName: string) => boolean,
};

function createFakeWritableFromReadableStreamController(
  controller: ReadableStreamController,
): Writable {
  // The current host config expects a Writable so we create
  // a fake writable for now to push into the Readable.
  return {
    write(chunk: string | Uint8Array) {
      if (typeof chunk === 'string') {
        chunk = textEncoder.encode(chunk);
      }
      controller.enqueue(chunk);
      // in web streams there is no backpressure so we can always write more
      return true;
    },
    end() {
      controller.close();
    },
    destroy(error) {
      // $FlowFixMe[method-unbinding]
      if (typeof controller.error === 'function') {
        // $FlowFixMe[incompatible-call]: This is an Error object or the destination accepts other types.
        controller.error(error);
      } else {
        controller.close();
      }
    },
  } as any;
}

export function renderToReadableStream(
  input: Input,
  webpackMap: ClientManifest,
  options?: ReadableStreamOptions,
): ReadableStream {
  const request = createRequest(
    input,
    webpackMap,
    options ? options.onError : undefined,
    options ? options.temporaryReferences : undefined,
    __DEV__ && options ? options.environmentName : undefined,
    __DEV__ && options ? options.filterStackFrame : undefined,
  );
  if (options && options.signal) {
    attachAbortSignal(request, options.signal);
  }
  let writable: Writable;
  const stream = new ReadableStream(
    {
      type: 'bytes',
      start: (controller): ?Promise<void> => {
        writable = createFakeWritableFromReadableStreamController(controller);
        startWork(request);
      },
      pull: (controller): ?Promise<void> => {
        startFlowing(request, writable);
      },
      cancel: (reason): ?Promise<void> => {
        stopFlowing(request);
        abort(request, reason);
      },
    },
    // $FlowFixMe[prop-missing] size() methods are not allowed on byte streams.
    // $FlowFixMe[incompatible-type]
    {highWaterMark: 0},
  );
  return stream;
}
