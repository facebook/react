/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

import type {FindSourceMapURLCallback} from 'react-client/flight';

import {readModule} from 'react-noop-renderer/flight-modules';

import ReactFlightClient from 'react-client/flight';

type Source = Array<Uint8Array>;

const decoderOptions = {stream: true};

const {createResponse, createStreamState, processBinaryChunk, getRoot, close} =
  ReactFlightClient({
    createStringDecoder() {
      return new TextDecoder();
    },
    readPartialStringChunk(decoder: TextDecoder, buffer: Uint8Array): string {
      return decoder.decode(buffer, decoderOptions);
    },
    readFinalStringChunk(decoder: TextDecoder, buffer: Uint8Array): string {
      return decoder.decode(buffer);
    },
    resolveClientReference(bundlerConfig: null, idx: string) {
      return idx;
    },
    prepareDestinationForModule(moduleLoading: null, metadata: string) {},
    preloadModule(idx: string) {},
    requireModule(idx: string) {
      return readModule(idx);
    },
    parseModel(response: Response, json) {
      return JSON.parse(json, response._fromJSON);
    },
    bindToConsole(methodName, args, badgeName) {
      return Function.prototype.bind.apply(
        // eslint-disable-next-line react-internal/no-production-logging
        console[methodName],
        [console].concat(args),
      );
    },
    checkEvalAvailabilityOnceDev,
  });

type ReadOptions = {|
  findSourceMapURL?: FindSourceMapURLCallback,
  debugChannel?: {onMessage: (message: string) => void},
  close?: boolean,
|};

function read<T>(source: Source, options: ReadOptions): Thenable<T> {
  const response = createResponse(
    source,
    null,
    null,
    undefined,
    undefined,
    undefined,
    undefined,
    options !== undefined ? options.findSourceMapURL : undefined,
    true,
    undefined,
    __DEV__ && options !== undefined && options.debugChannel !== undefined
      ? options.debugChannel.onMessage
      : undefined,
  );
  const streamState = createStreamState(response, source);
  for (let i = 0; i < source.length; i++) {
    processBinaryChunk(response, streamState, source[i], 0);
  }
  if (options !== undefined && options.close) {
    close(response);
  }
  return getRoot(response);
}

let hasConfirmedEval = false;
function checkEvalAvailabilityOnceDev(): void {
  if (__DEV__) {
    if (!hasConfirmedEval) {
      hasConfirmedEval = true;
      try {
        // eslint-disable-next-line no-eval
        (0, eval)('null');
      } catch {
        console.error(
          'eval() is not supported in this environment. ' +
            'React requires eval() in development mode for various debugging features ' +
            'like reconstructing callstacks from a different environment.\n' +
            'React will never use eval() in production mode',
        );
      }
    }
  } else {
    throw new Error(
      'checkEvalAvailabilityOnceDev should never be called in production mode. This is a bug in React.',
    );
  }
}

export {read};
