/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {
  BootstrapScriptDescriptor,
  HeadersDescriptor,
} from 'react-dom-bindings/src/server/ReactFizzConfigDOM';
import type {
  PostponedState,
  ErrorInfo,
  PostponeInfo,
} from 'react-server/src/ReactFizzServer';
import type {ImportMap} from '../shared/ReactDOMTypes';

import {Writable, Readable} from 'stream';

import ReactVersion from 'shared/ReactVersion';

import {
  createPrerenderRequest,
  resumeAndPrerenderRequest,
  startWork,
  startFlowing,
  stopFlowing,
  abort,
  getPostponedState,
} from 'react-server/src/ReactFizzServer';

import {
  createResumableState,
  createRenderState,
  resumeRenderState,
  createRootFormatContext,
} from 'react-dom-bindings/src/server/ReactFizzConfigDOM';

import {enablePostpone, enableHalt} from 'shared/ReactFeatureFlags';

import {textEncoder} from 'react-server/src/ReactServerStreamConfigNode';

import {ensureCorrectIsomorphicReactVersion} from '../shared/ensureCorrectIsomorphicReactVersion';
ensureCorrectIsomorphicReactVersion();

type NonceOption =
  | string
  | {
      script?: string,
      style?: string,
    };

type Options = {
  identifierPrefix?: string,
  namespaceURI?: string,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  bootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  progressiveChunkSize?: number,
  signal?: AbortSignal,
  onError?: (error: mixed, errorInfo: ErrorInfo) => ?string,
  onPostpone?: (reason: string, postponeInfo: PostponeInfo) => void,
  unstable_externalRuntimeSrc?: string | BootstrapScriptDescriptor,
  importMap?: ImportMap,
  onHeaders?: (headers: HeadersDescriptor) => void,
  maxHeadersLength?: number,
};

type StaticResult = {
  postponed: null | PostponedState,
  prelude: Readable,
};

function createFakeWritableFromReadableStreamController(
  controller: ReadableStreamController,
): Writable {
  // The current host config expects a Writable so we create
  // a fake writable for now to push into the Readable.
  return ({
    write(chunk: string | Uint8Array) {
      if (typeof chunk === 'string') {
        chunk = textEncoder.encode(chunk);
      }
      controller.enqueue(chunk);
      // in web streams there is no backpressure so we can alwas write more
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
  }: any);
}

function createFakeWritableFromReadable(readable: any): Writable {
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

function prerenderToNodeStream(
  children: ReactNodeList,
  options?: Options,
): Promise<StaticResult> {
  return new Promise((resolve, reject) => {
    const onFatalError = reject;

    function onAllReady() {
      const readable: Readable = new Readable({
        read() {
          startFlowing(request, writable);
        },
      });
      const writable = createFakeWritableFromReadable(readable);

      const result: StaticResult =
        enablePostpone || enableHalt
          ? {
              postponed: getPostponedState(request),
              prelude: readable,
            }
          : ({
              prelude: readable,
            }: any);
      resolve(result);
    }
    const resumableState = createResumableState(
      options ? options.identifierPrefix : undefined,
      options ? options.unstable_externalRuntimeSrc : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
    );
    const request = createPrerenderRequest(
      children,
      resumableState,
      createRenderState(
        resumableState,
        undefined, // nonce is not compatible with prerendered bootstrap scripts
        options ? options.unstable_externalRuntimeSrc : undefined,
        options ? options.importMap : undefined,
        options ? options.onHeaders : undefined,
        options ? options.maxHeadersLength : undefined,
      ),
      createRootFormatContext(options ? options.namespaceURI : undefined),
      options ? options.progressiveChunkSize : undefined,
      options ? options.onError : undefined,
      onAllReady,
      undefined,
      undefined,
      onFatalError,
      options ? options.onPostpone : undefined,
    );
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort(request, (signal: any).reason);
      } else {
        const listener = () => {
          abort(request, (signal: any).reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
    startWork(request);
  });
}

function prerender(
  children: ReactNodeList,
  options?: Omit<Options, 'onHeaders'> & {
    onHeaders?: (headers: Headers) => void,
  },
): Promise<{
  postponed: null | PostponedState,
  prelude: ReadableStream,
}> {
  return new Promise((resolve, reject) => {
    const onFatalError = reject;

    function onAllReady() {
      let writable: Writable;
      const stream = new ReadableStream(
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
        // $FlowFixMe[prop-missing] size() methods are not allowed on byte streams.
        {highWaterMark: 0},
      );

      const result =
        enablePostpone || enableHalt
          ? {
              postponed: getPostponedState(request),
              prelude: stream,
            }
          : ({
              prelude: stream,
            }: any);
      resolve(result);
    }

    const onHeaders = options ? options.onHeaders : undefined;
    let onHeadersImpl;
    if (onHeaders) {
      onHeadersImpl = (headersDescriptor: HeadersDescriptor) => {
        onHeaders(new Headers(headersDescriptor));
      };
    }
    const resources = createResumableState(
      options ? options.identifierPrefix : undefined,
      options ? options.unstable_externalRuntimeSrc : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
    );
    const request = createPrerenderRequest(
      children,
      resources,
      createRenderState(
        resources,
        undefined, // nonce is not compatible with prerendered bootstrap scripts
        options ? options.unstable_externalRuntimeSrc : undefined,
        options ? options.importMap : undefined,
        onHeadersImpl,
        options ? options.maxHeadersLength : undefined,
      ),
      createRootFormatContext(options ? options.namespaceURI : undefined),
      options ? options.progressiveChunkSize : undefined,
      options ? options.onError : undefined,
      onAllReady,
      undefined,
      undefined,
      onFatalError,
      options ? options.onPostpone : undefined,
    );
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort(request, (signal: any).reason);
      } else {
        const listener = () => {
          abort(request, (signal: any).reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
    startWork(request);
  });
}

type ResumeOptions = {
  nonce?: NonceOption,
  signal?: AbortSignal,
  onError?: (error: mixed, errorInfo: ErrorInfo) => ?string,
  onPostpone?: (reason: string, postponeInfo: PostponeInfo) => void,
};

function resumeAndPrerenderToNodeStream(
  children: ReactNodeList,
  postponedState: PostponedState,
  options?: ResumeOptions,
): Promise<StaticResult> {
  return new Promise((resolve, reject) => {
    const onFatalError = reject;

    function onAllReady() {
      const readable: Readable = new Readable({
        read() {
          startFlowing(request, writable);
        },
      });
      const writable = createFakeWritableFromReadable(readable);

      const result = {
        postponed: getPostponedState(request),
        prelude: readable,
      };
      resolve(result);
    }
    const request = resumeAndPrerenderRequest(
      children,
      postponedState,
      resumeRenderState(
        postponedState.resumableState,
        options ? options.nonce : undefined,
      ),
      options ? options.onError : undefined,
      onAllReady,
      undefined,
      undefined,
      onFatalError,
      options ? options.onPostpone : undefined,
    );
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort(request, (signal: any).reason);
      } else {
        const listener = () => {
          abort(request, (signal: any).reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
    startWork(request);
  });
}

function resumeAndPrerender(
  children: ReactNodeList,
  postponedState: PostponedState,
  options?: ResumeOptions,
): Promise<{
  postponed: null | PostponedState,
  prelude: ReadableStream,
}> {
  return new Promise((resolve, reject) => {
    const onFatalError = reject;

    function onAllReady() {
      let writable: Writable;
      const stream = new ReadableStream(
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
        // $FlowFixMe[prop-missing] size() methods are not allowed on byte streams.
        {highWaterMark: 0},
      );

      const result = {
        postponed: getPostponedState(request),
        prelude: stream,
      };
      resolve(result);
    }

    const request = resumeAndPrerenderRequest(
      children,
      postponedState,
      resumeRenderState(
        postponedState.resumableState,
        options ? options.nonce : undefined,
      ),
      options ? options.onError : undefined,
      onAllReady,
      undefined,
      undefined,
      onFatalError,
      options ? options.onPostpone : undefined,
    );
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort(request, (signal: any).reason);
      } else {
        const listener = () => {
          abort(request, (signal: any).reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
    startWork(request);
  });
}

export {
  prerender,
  prerenderToNodeStream,
  resumeAndPrerender,
  resumeAndPrerenderToNodeStream,
  ReactVersion as version,
};
