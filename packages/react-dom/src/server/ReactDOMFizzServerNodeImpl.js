/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Request} from 'react-server/src/ReactFizzServer';
import type {ReactNodeList} from 'shared/ReactTypes';
import type {Writable} from 'stream';
import type {BootstrapScriptDescriptor} from 'react-dom-bindings/src/server/ReactDOMServerFormatConfig';
import type {Destination} from 'react-server/src/ReactServerStreamConfigNode';

import ReactVersion from 'shared/ReactVersion';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFizzServer';

import {
  createResponseState,
  createRootFormatContext,
  createRootBoundaryID,
} from 'react-dom-bindings/src/server/ReactDOMServerFormatConfig';

function createDrainHandler(destination: Destination, request: Request) {
  return () => startFlowing(request, destination);
}

function createAbortHandler(request: Request, reason: string) {
  // eslint-disable-next-line react-internal/prod-error-codes
  return () => abort(request, new Error(reason));
}

type PipeableStream = {
  // Cancel any pending I/O and put anything remaining into
  // client rendered mode.
  abort(reason: mixed): void,
  pipe<T: Writable>(destination: T): T,
};

type ToPipeableOptions = {
  identifierPrefix?: string,
  namespaceURI?: string,
  nonce?: string,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  bootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  progressiveChunkSize?: number,
  onShellReady?: () => void,
  onShellError?: (error: mixed) => void,
  onAllReady?: () => void,
  onError?: (error: mixed) => ?string,
  unstable_externalRuntimeSrc?: string | BootstrapScriptDescriptor,
};

function renderToPipeableStream(
  children: ReactNodeList,
  options?: ToPipeableOptions,
): PipeableStream {
  const request = createRequest(
    children,
    undefined, // fallback
    createResponseState(
      options ? options.identifierPrefix : undefined,
      options ? options.nonce : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
      undefined, // fallbackBootstrapScriptContent
      undefined, // fallbackBootstrapScripts
      undefined, // fallbackBootstrapModules
      options ? options.unstable_externalRuntimeSrc : undefined,
      undefined, // documentEmbedding
    ),
    createRootFormatContext(options ? options.namespaceURI : undefined),
    options ? options.progressiveChunkSize : undefined,
    options ? options.onError : undefined,
    options ? options.onAllReady : undefined,
    options ? options.onShellReady : undefined,
    options ? options.onShellError : undefined,
    undefined, // onFatalError
    undefined, // rootBoundaryID
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
        createAbortHandler(
          request,
          'The destination stream errored while writing data.',
        ),
      );
      destination.on(
        'close',
        createAbortHandler(request, 'The destination stream closed early.'),
      );
      return destination;
    },
    abort(reason: mixed) {
      abort(request, reason);
    },
  };
}

type IntoContainerOptions = {
  identifierPrefix?: string,
  namespaceURI?: string,
  nonce?: string,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  bootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  fallbackBootstrapScriptContent?: string,
  fallbackBootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  fallbackBootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  progressiveChunkSize?: number,
  onAllReady?: () => void,
  onError?: (error: mixed) => ?string,
  unstable_externalRuntimeSrc?: string | BootstrapScriptDescriptor,
};

function renderIntoContainerAsPipeableStream(
  children: ReactNodeList,
  containerID: string,
  options?: IntoContainerOptions,
): PipeableStream {
  const request = createRequest(
    children,
    undefined, // fallback
    createResponseState(
      options ? options.identifierPrefix : undefined,
      options ? options.nonce : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
      options ? options.fallbackBootstrapScriptContent : undefined,
      options ? options.fallbackBootstrapScripts : undefined,
      options ? options.fallbackBootstrapModules : undefined,
      options ? options.unstable_externalRuntimeSrc : undefined,
      undefined, // documentEmbedding
    ),
    createRootFormatContext(options ? options.namespaceURI : undefined),
    options ? options.progressiveChunkSize : undefined,
    options ? options.onError : undefined,
    options ? options.onAllReady : undefined,
    undefined, // onShellReady
    undefined, // onShellError
    undefined, // onFatalError
    createRootBoundaryID(containerID),
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
        createAbortHandler(
          request,
          'The destination stream errored while writing data.',
        ),
      );
      destination.on(
        'close',
        createAbortHandler(request, 'The destination stream closed early.'),
      );
      return destination;
    },
    abort(reason: mixed) {
      abort(request, reason);
    },
  };
}

type IntoDocumentOptions = {
  identifierPrefix?: string,
  namespaceURI?: string,
  nonce?: string,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  bootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  fallbackBootstrapScriptContent?: string,
  fallbackBootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  fallbackBootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  progressiveChunkSize?: number,
  onAllReady?: () => void,
  onError?: (error: mixed) => ?string,
  unstable_externalRuntimeSrc?: string | BootstrapScriptDescriptor,
};

function renderDocumentAsPipeableStream(
  children: ReactNodeList,
  fallback?: ReactNodeList,
  options?: IntoDocumentOptions,
): PipeableStream {
  const request = createRequest(
    children,
    fallback ? fallback : null,
    createResponseState(
      options ? options.identifierPrefix : undefined,
      options ? options.nonce : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
      options ? options.fallbackBootstrapScriptContent : undefined,
      options ? options.fallbackBootstrapScripts : undefined,
      options ? options.fallbackBootstrapModules : undefined,
      options ? options.unstable_externalRuntimeSrc : undefined,
      true, // documentEmbedding
    ),
    createRootFormatContext(options ? options.namespaceURI : undefined),
    options ? options.progressiveChunkSize : undefined,
    options ? options.onError : undefined,
    options ? options.onAllReady : undefined,
    undefined, // onShellReady
    undefined, // onShellError
    undefined, // onFatalError
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
        createAbortHandler(
          request,
          'The destination stream errored while writing data.',
        ),
      );
      destination.on(
        'close',
        createAbortHandler(request, 'The destination stream closed early.'),
      );
      return destination;
    },
    abort(reason: mixed) {
      abort(request, reason);
    },
  };
}

export {
  renderToPipeableStream,
  renderIntoContainerAsPipeableStream,
  renderDocumentAsPipeableStream,
  ReactVersion as version,
};
