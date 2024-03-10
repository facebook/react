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
import type {Busboy} from 'busboy';
import type {Writable} from 'stream';
import type {
  ReactFormState,
  ServerContextJSONValue,
  Thenable,
} from 'shared/ReactTypes';
import type {
  ServerManifest,
  ServerReferenceId,
} from './ReactFlightClientConfigBundlerParcel';

import {
  createRequest,
  startWork,
  startFlowing,
  stopFlowing,
  abort,
} from 'react-server/src/ReactFlightServer';

import {
  createResponse,
  reportGlobalError,
  close,
  resolveField,
  resolveFileInfo,
  resolveFileChunk,
  resolveFileComplete,
  getRoot,
} from 'react-server/src/ReactFlightReplyServer';

import {
  decodeAction as decodeActionImpl,
  decodeFormState as decodeFormStateImpl,
} from 'react-server/src/ReactFlightActionServer';
import {
  preloadModule,
  requireModule,
  resolveServerReference,
} from './ReactFlightClientConfigBundlerParcel';

export {
  createClientReference,
  registerServerReference,
} from './ReactFlightParcelReferences';

function createDrainHandler(destination: Destination, request: Request) {
  return () => startFlowing(request, destination);
}

function createCancelHandler(request: Request, reason: string) {
  return () => {
    stopFlowing(request);
    // eslint-disable-next-line react-internal/prod-error-codes
    abort(request, new Error(reason));
  };
}

type Options = {
  onError?: (error: mixed) => void,
  onPostpone?: (reason: string) => void,
  context?: Array<[string, ServerContextJSONValue]>,
  identifierPrefix?: string,
};

type PipeableStream = {
  abort(reason: mixed): void,
  pipe<T: Writable>(destination: T): T,
};

export function renderToPipeableStream(
  model: ReactClientValue,
  options?: Options,
): PipeableStream {
  const request = createRequest(
    model,
    null,
    options ? options.onError : undefined,
    options ? options.context : undefined,
    options ? options.identifierPrefix : undefined,
    options ? options.onPostpone : undefined,
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

let serverManifest = {};
export function registerServerActions(manifest: ServerManifest) {
  // This function is called by the bundler to register the manifest.
  serverManifest = manifest;
}

export function decodeReplyFromBusboy<T>(busboyStream: Busboy): Thenable<T> {
  const response = createResponse(serverManifest, '');
  let pendingFiles = 0;
  const queuedFields: Array<string> = [];
  busboyStream.on('field', (name, value) => {
    if (pendingFiles > 0) {
      // Because the 'end' event fires two microtasks after the next 'field'
      // we would resolve files and fields out of order. To handle this properly
      // we queue any fields we receive until the previous file is done.
      queuedFields.push(name, value);
    } else {
      resolveField(response, name, value);
    }
  });
  busboyStream.on('file', (name, value, {filename, encoding, mimeType}) => {
    if (encoding.toLowerCase() === 'base64') {
      throw new Error(
        "React doesn't accept base64 encoded file uploads because we don't expect " +
          "form data passed from a browser to ever encode data that way. If that's " +
          'the wrong assumption, we can easily fix it.',
      );
    }
    pendingFiles++;
    const file = resolveFileInfo(response, name, filename, mimeType);
    value.on('data', chunk => {
      resolveFileChunk(response, file, chunk);
    });
    value.on('end', () => {
      resolveFileComplete(response, name, file);
      pendingFiles--;
      if (pendingFiles === 0) {
        // Release any queued fields
        for (let i = 0; i < queuedFields.length; i += 2) {
          resolveField(response, queuedFields[i], queuedFields[i + 1]);
        }
        queuedFields.length = 0;
      }
    });
  });
  busboyStream.on('finish', () => {
    close(response);
  });
  busboyStream.on('error', err => {
    reportGlobalError(
      response,
      // $FlowFixMe[incompatible-call] types Error and mixed are incompatible
      err,
    );
  });
  return getRoot(response);
}

export function decodeReply<T>(body: string | FormData): Thenable<T> {
  if (typeof body === 'string') {
    const form = new FormData();
    form.append('0', body);
    body = form;
  }
  const response = createResponse(serverManifest, '', body);
  const root = getRoot<T>(response);
  close(response);
  return root;
}

export function decodeAction<T>(body: FormData): Promise<() => T> | null {
  return decodeActionImpl(body, serverManifest);
}

export function decodeFormState<S>(
  actionResult: S,
  body: FormData,
): Promise<ReactFormState<S, ServerReferenceId> | null> {
  return decodeFormStateImpl(actionResult, body, serverManifest);
}

export async function loadServerAction<F: (...any[]) => any>(
  id: string,
): Promise<F> {
  const reference = resolveServerReference<any>(serverManifest, id);
  await preloadModule(reference);
  const fn = requireModule(reference);
  if (typeof fn !== 'function') {
    throw new Error('Server actions must be functions');
  }
  return fn;
}