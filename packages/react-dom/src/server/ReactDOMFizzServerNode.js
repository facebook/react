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
  PostponedState,
  ErrorInfo,
} from 'react-server/src/ReactFizzServer';
import type { ReactNodeList, ReactFormState } from 'shared/ReactTypes';
import type { Writable } from 'stream';
import type {
  BootstrapScriptDescriptor,
  HeadersDescriptor,
} from 'react-dom-bindings/src/server/ReactFizzConfigDOM';
import type { Destination } from 'react-server/src/ReactServerStreamConfigNode';
import type { ImportMap } from '../shared/ReactDOMTypes';

import ReactVersion from 'shared/ReactVersion';

import {
  createRequest,
  resumeRequest,
  startWork,
  startFlowing,
  stopFlowing,
  abort,
  prepareForStartFlowingIfBeforeAllReady,
} from 'react-server/src/ReactFizzServer';

import {
  createResumableState,
  createRenderState,
  resumeRenderState,
  createRootFormatContext,
} from 'react-dom-bindings/src/server/ReactFizzConfigDOM';

import { textEncoder } from 'react-server/src/ReactServerStreamConfigNode';

import { ensureCorrectIsomorphicReactVersion } from '../shared/ensureCorrectIsomorphicReactVersion';
ensureCorrectIsomorphicReactVersion();

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

type NonceOption =
  | string
  | {
    script?: string,
    style?: string,
  };

type Options = {
  identifierPrefix?: string,
  namespaceURI?: string,
  nonce?: NonceOption,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  bootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  progressiveChunkSize?: number,
  onShellReady?: () => void,
  onShellError?: (error: mixed) => void,
  onAllReady?: () => void,
  onError?: (error: mixed, errorInfo: ErrorInfo) => ?string,
  unstable_externalRuntimeSrc?: string | BootstrapScriptDescriptor,
  importMap?: ImportMap,
  formState?: ReactFormState<any, any> | null,
  onHeaders?: (headers: HeadersDescriptor) => void,
  maxHeadersLength?: number,
};

type ResumeOptions = {
  nonce?: NonceOption,
  onShellReady?: () => void,
  onShellError?: (error: mixed) => void,
  onAllReady?: () => void,
  onError?: (error: mixed, errorInfo: ErrorInfo) => ?string,
};

type PipeableStream = {
  // Cancel any pending I/O and put anything remaining into
  // client rendered mode.
  abort(reason: mixed): void,
  pipe<T: Writable>(destination: T): T,
};

function createRequestImpl(children: ReactNodeList, options: void | Options) {
  const resumableState = createResumableState(
    options ? options.identifierPrefix : undefined,
    options ? options.unstable_externalRuntimeSrc : undefined,
    options ? options.bootstrapScriptContent : undefined,
    options ? options.bootstrapScripts : undefined,
    options ? options.bootstrapModules : undefined,
  );
  return createRequest(
    children,
    resumableState,
    createRenderState(
      resumableState,
      options ? options.nonce : undefined,
      options ? options.unstable_externalRuntimeSrc : undefined,
      options ? options.importMap : undefined,
      options ? options.onHeaders : undefined,
      options ? options.maxHeadersLength : undefined,
    ),
    createRootFormatContext(options ? options.namespaceURI : undefined),
    options ? options.progressiveChunkSize : undefined,
    options ? options.onError : undefined,
    options ? options.onAllReady : undefined,
    options ? options.onShellReady : undefined,
    options ? options.onShellError : undefined,
    undefined,
    options ? options.formState : undefined,
  );
}

function renderToPipeableStream(
  children: ReactNodeList,
  options?: Options,
): PipeableStream {
  const request = createRequestImpl(children, options);
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
      prepareForStartFlowingIfBeforeAllReady(request);
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

function createFakeWritableFromReadableStreamController(
  controller: ReadableStreamController,
): Writable {
  return {
    write(chunk: string | Uint8Array) {
      if (typeof chunk === 'string') {
        chunk = textEncoder.encode(chunk);
      }
      controller.enqueue(chunk);
      return true;
    },
    end() {
      controller.close();
    },
    destroy(error) {
      if (typeof controller.error === 'function') {
        controller.error(error);
      } else {
        controller.close();
      }
    },
  } as any;
}

type ReactDOMServerReadableStream = ReadableStream & {
  allReady: Promise<void>,
};

type WebStreamsOptions = Omit<
  Options,
  'onShellReady' | 'onShellError' | 'onAllReady' | 'onHeaders',
> & { signal: AbortSignal, onHeaders?: (headers: Headers) => void };

// FIXED: Added missing identifier 'renderToReadableStream'
export function renderToReadableStream(
  children: ReactNodeList,
  options?: WebStreamsOptions,
): Promise<ReactDOMServerReadableStream> {
  return new Promise((resolve, reject) => {
    let onFatalError;
    let onAllReady;
    let abortListener = null;

    const allReady = new Promise<void>((res, rej) => {
      onAllReady = res;
      onFatalError = rej;
    });

    function onShellReady() {
      let writable: Writable;
      const stream: ReactDOMServerReadableStream = new ReadableStream(
        {
          type: 'bytes',
          start: (controller): ?Promise<void> => {
            writable =
              createFakeWritableFromReadableStreamController(controller);
          },
          pull: (controller): ?Promise<void> => {
            startFlowing(request, writable);
          },
          cancel: (reason): ?Promise<void> => {
            stopFlowing(request);
            abort(request, reason);
          },
        },
        { highWaterMark: 0 },
      ) as any;
      stream.allReady = allReady;
      resolve(stream);
    }
    
    function onShellError(error: mixed) {
      if (options && options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
      allReady.catch(() => { });
      reject(error);
    }

    const wrappedOnAllReady = () => {
      if (options && options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
      if (typeof onAllReady === 'function') onAllReady();
    };

    const wrappedOnFatalError = (error: mixed) => {
      if (options && options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
      if (typeof onFatalError === 'function') onFatalError(error);
    };

    const onHeaders = options ? options.onHeaders : undefined;
    let onHeadersImpl;
    if (onHeaders) {
      onHeadersImpl = (headersDescriptor: HeadersDescriptor) => {
        onHeaders(new Headers(headersDescriptor));
      };
    }

    const resumableState = createResumableState(
      options ? options.identifierPrefix : undefined,
      options ? options.unstable_externalRuntimeSrc : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
    );
    const request = createRequest(
      children,
      resumableState,
      createRenderState(
        resumableState,
        options ? options.nonce : undefined,
        options ? options.unstable_externalRuntimeSrc : undefined,
        options ? options.importMap : undefined,
        onHeadersImpl,
        options ? options.maxHeadersLength : undefined,
      ),
      createRootFormatContext(options ? options.namespaceURI : undefined),
      options ? options.progressiveChunkSize : undefined,
      options ? options.onError : undefined,
      wrappedOnAllReady,
      onShellReady,
      onShellError,
      wrappedOnFatalError,
      options ? options.formState : undefined,
    );
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort(request, (signal as any).reason);
      } else {
        abortListener = () => {
          abort(request, (signal as any).reason);
          if (abortListener) signal.removeEventListener('abort', abortListener);
        };
        signal.addEventListener('abort', abortListener);
      }
    }
    startWork(request);
  });
}

function resumeRequestImpl(
  children: ReactNodeList,
  postponedState: PostponedState,
  options: void | ResumeOptions,
) {
  return resumeRequest(
    children,
    postponedState,
    resumeRenderState(
      postponedState.resumableState,
      options ? options.nonce : undefined,
    ),
    options ? options.onError : undefined,
    options ? options.onAllReady : undefined,
    options ? options.onShellReady : undefined,
    options ? options.onShellError : undefined,
    undefined,
  );
}

function resumeToPipeableStream(
  children: ReactNodeList,
  postponedState: PostponedState,
  options?: ResumeOptions,
): PipeableStream {
  const request = resumeRequestImpl(children, postponedState, options);
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

type WebStreamsResumeOptions = Omit<
  Options,
  'onShellReady' | 'onShellError' | 'onAllReady',
> & { signal: AbortSignal };

// FIXED: Implemented fixed resume function with memory leak protection
export function resume(
  children: ReactNodeList,
  postponedState: PostponedState,
  options?: WebStreamsResumeOptions,
): Promise<ReactDOMServerReadableStream> {
  return new Promise((resolve, reject) => {
    let onFatalError;
    let onAllReady;
    let abortListener = null;

    const allReady = new Promise<void>((res, rej) => {
      onAllReady = res;
      onFatalError = rej;
    });

    function onShellReady() {
      let writable: Writable;
      const stream: ReactDOMServerReadableStream = new ReadableStream(
        {
          type: 'bytes',
          start: (controller): ?Promise<void> => {
            writable =
              createFakeWritableFromReadableStreamController(controller);
          },
          pull: (controller): ?Promise<void> => {
            startFlowing(request, writable);
          },
          cancel: (reason): ?Promise<void> => {
            stopFlowing(request);
            abort(request, reason);
          },
        },
        { highWaterMark: 0 },
      ) as any;
      stream.allReady = allReady;
      resolve(stream);
    }

    function onShellError(error: any) {
      if (options && options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
      allReady.catch(() => { });
      reject(error);
    }

    const wrappedOnAllReady = () => {
      if (options && options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
      if (typeof onAllReady === 'function') onAllReady();
    };

    const wrappedOnFatalError = (error: mixed) => {
      if (options && options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
      if (typeof onFatalError === 'function') onFatalError(error);
    };

    const request = resumeRequest(
      children,
      postponedState,
      resumeRenderState(
        postponedState.resumableState,
        options ? options.nonce : undefined,
      ),
      options ? options.onError : undefined,
      wrappedOnAllReady,
      onShellReady,
      onShellError,
      wrappedOnFatalError,
    );

    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort(request, (signal as any).reason);
      } else {
        abortListener = () => {
          abort(request, (signal as any).reason);
          if (abortListener) signal.removeEventListener('abort', abortListener);
        };
        signal.addEventListener('abort', abortListener);
      }
    }

    startWork(request);
  });
}

export {
  renderToPipeableStream,
  resumeToPipeableStream,
  ReactVersion as version,
};