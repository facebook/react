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
import type {ClientManifest} from './ReactFlightServerConfigWebpackBundler';
import type {ServerManifest} from 'react-client/src/ReactFlightClientConfig';
import type {Busboy} from 'busboy';
import type {Writable} from 'stream';
import type {Thenable} from 'shared/ReactTypes';

import {Readable} from 'stream';

import {
  createRequest,
  createPrerenderRequest,
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
  decodeAction,
  decodeFormState,
} from 'react-server/src/ReactFlightActionServer';

export {
  registerServerReference,
  registerClientReference,
  createClientModuleProxy,
} from '../ReactFlightWebpackReferences';

import type {TemporaryReferenceSet} from 'react-server/src/ReactFlightServerTemporaryReferences';
import type {FileHandle} from 'react-server/src/ReactFlightReplyServer';

export {createTemporaryReferenceSet} from 'react-server/src/ReactFlightServerTemporaryReferences';

export type {TemporaryReferenceSet};

function createDrainHandler(destination: Destination, request: Request) {
  return () => startFlowing(request, destination);
}

function createCancelHandler(request: Request, reason: string) {
  return () => {
    stopFlowing(request);
    abort(request, new Error(reason));
  };
}

type Options = {
  environmentName?: string | (() => string),
  filterStackFrame?: (url: string, functionName: string) => boolean,
  onError?: (error: mixed) => void,
  onPostpone?: (reason: string) => void,
  identifierPrefix?: string,
  temporaryReferences?: TemporaryReferenceSet,
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
    options ? options.identifierPrefix : undefined,
    options ? options.onPostpone : undefined,
    options ? options.temporaryReferences : undefined,
    __DEV__ && options ? options.environmentName : undefined,
    __DEV__ && options ? options.filterStackFrame : undefined,
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

function createFakeWritable(readable: any): Writable {
  // The current host config expects a Writable so we create
  // a fake writable for now to push into the Readable.
  return ({
    write(chunk) {
      return readable.push(chunk);
    },
    end() {
      readable.push(null);
    },
    destroy(error) {
      readable.destroy(error);
    },
  }: any);
}

type PrerenderOptions = {
  environmentName?: string | (() => string),
  filterStackFrame?: (url: string, functionName: string) => boolean,
  onError?: (error: mixed) => void,
  onPostpone?: (reason: string) => void,
  identifierPrefix?: string,
  temporaryReferences?: TemporaryReferenceSet,
  signal?: AbortSignal,
};

type StaticResult = {
  prelude: Readable,
};

function prerenderToNodeStream(
  model: ReactClientValue,
  webpackMap: ClientManifest,
  options?: PrerenderOptions,
): Promise<StaticResult> {
  return new Promise((resolve, reject) => {
    const onFatalError = reject;
    function onAllReady() {
      const readable: Readable = new Readable({
        read() {
          startFlowing(request, writable);
        },
      });
      const writable = createFakeWritable(readable);
      resolve({prelude: readable});
    }

    const request = createPrerenderRequest(
      model,
      webpackMap,
      onAllReady,
      onFatalError,
      options ? options.onError : undefined,
      options ? options.identifierPrefix : undefined,
      options ? options.onPostpone : undefined,
      options ? options.temporaryReferences : undefined,
      __DEV__ && options ? options.environmentName : undefined,
      __DEV__ && options ? options.filterStackFrame : undefined,
    );
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        const reason = (signal: any).reason;
        abort(request, reason);
      } else {
        const listener = () => {
          const reason = (signal: any).reason;
          abort(request, reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
    startWork(request);
  });
}

type PendingFile = {
  name: string,
  file: FileHandle,
  complete: boolean,
  // Lazily allocated when a text field arrives after this file's 'file'
  // event but before its (deferred) 'end' event. Stored as flat
  // [name1, value1, name2, value2, ...] pairs.
  queuedFields: null | Array<string>,
  next: null | PendingFile,
};

function decodeReplyFromBusboy<T>(
  busboyStream: Busboy,
  webpackMap: ServerManifest,
  options?: {
    temporaryReferences?: TemporaryReferenceSet,
    arraySizeLimit?: number,
  },
): Thenable<T> {
  const response = createResponse(
    webpackMap,
    '',
    options ? options.temporaryReferences : undefined,
    undefined,
    options ? options.arraySizeLimit : undefined,
  );

  // Linked list of pending files in arrival (payload) order. Text fields that
  // arrive while a file is in flight are queued on the tail file's
  // `queuedFields` so they can be resolved together when that file completes.
  // Fields that arrive while the list is empty bypass it and resolve
  // immediately. This makes the backing FormData's insertion order match the
  // payload's entry order.
  let head: null | PendingFile = null;
  let tail: null | PendingFile = null;
  let bodyFinished = false;
  let closed = false;

  function flush() {
    while (head !== null) {
      const current = head;
      if (!current.complete) {
        // This file is still streaming. Hold later files and fields until it
        // completes so the backing FormData reflects payload order.
        return;
      }
      try {
        resolveFileComplete(response, current.name, current.file);
        const queuedFields = current.queuedFields;
        if (queuedFields !== null) {
          for (let i = 0; i < queuedFields.length; i += 2) {
            resolveField(response, queuedFields[i], queuedFields[i + 1]);
          }
        }
      } catch (error) {
        busboyStream.destroy(error);
        return;
      }
      head = current.next;
    }
    tail = null;
    if (bodyFinished && !closed) {
      closed = true;
      close(response);
    }
  }

  busboyStream.on('field', (name, value) => {
    if (tail !== null) {
      // A file is in flight; queue the field on the tail (most recent) pending
      // file so it resolves after that file, preserving payload order.
      if (tail.queuedFields === null) {
        tail.queuedFields = [];
      }
      tail.queuedFields.push(name, value);
    } else {
      try {
        resolveField(response, name, value);
      } catch (error) {
        busboyStream.destroy(error);
      }
    }
  });
  busboyStream.on('file', (name, value, {filename, encoding, mimeType}) => {
    if (encoding.toLowerCase() === 'base64') {
      busboyStream.destroy(
        new Error(
          "React doesn't accept base64 encoded file uploads because we don't expect " +
            "form data passed from a browser to ever encode data that way. If that's " +
            'the wrong assumption, we can easily fix it.',
        ),
      );
      return;
    }
    const file = resolveFileInfo(response, name, filename, mimeType);
    const pendingFile: PendingFile = {
      name,
      file,
      complete: false,
      queuedFields: null,
      next: null,
    };
    if (tail === null) {
      head = pendingFile;
    } else {
      tail.next = pendingFile;
    }
    tail = pendingFile;
    value.on('data', chunk => {
      try {
        resolveFileChunk(response, file, chunk);
      } catch (error) {
        busboyStream.destroy(error);
      }
    });
    value.on('error', error => {
      busboyStream.destroy(error);
    });
    value.on('end', () => {
      pendingFile.complete = true;
      flush();
    });
  });
  busboyStream.on('finish', () => {
    bodyFinished = true;
    flush();
    if (!closed) {
      // Invariant: busboy delays 'finish' until every file's 'end' event has
      // fired, so the flush above should always close the response.
      reportGlobalError(
        response,
        new Error('Reply finished with incomplete file part.'),
      );
    }
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

function decodeReply<T>(
  body: string | FormData,
  webpackMap: ServerManifest,
  options?: {
    temporaryReferences?: TemporaryReferenceSet,
    arraySizeLimit?: number,
  },
): Thenable<T> {
  if (typeof body === 'string') {
    const form = new FormData();
    form.append('0', body);
    body = form;
  }
  const response = createResponse(
    webpackMap,
    '',
    options ? options.temporaryReferences : undefined,
    body,
    options ? options.arraySizeLimit : undefined,
  );
  const root = getRoot<T>(response);
  close(response);
  return root;
}

export {
  renderToPipeableStream,
  prerenderToNodeStream,
  decodeReplyFromBusboy,
  decodeReply,
  decodeAction,
  decodeFormState,
};
