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

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';

import {saveModule} from 'react-noop-renderer/flight-modules';

import ReactFlightServer from 'react-server/flight';

type Destination = Array<Uint8Array>;

const textEncoder = new TextEncoder();

const ReactNoopFlightServer = ReactFlightServer({
  scheduleMicrotask(callback: () => void) {
    callback();
  },
  scheduleWork(callback: () => void) {
    callback();
  },
  beginWriting(destination: Destination): void {},
  writeChunk(destination: Destination, chunk: string): void {
    destination.push(chunk);
  },
  writeChunkAndReturn(destination: Destination, chunk: string): boolean {
    destination.push(chunk);
    return true;
  },
  completeWriting(destination: Destination): void {},
  close(destination: Destination): void {},
  closeWithError(destination: Destination, error: mixed): void {},
  flushBuffered(destination: Destination): void {},
  stringToChunk(content: string): Uint8Array {
    return textEncoder.encode(content);
  },
  stringToPrecomputedChunk(content: string): Uint8Array {
    return textEncoder.encode(content);
  },
  isClientReference(reference: Object): boolean {
    return reference.$$typeof === Symbol.for('react.client.reference');
  },
  isServerReference(reference: Object): boolean {
    return reference.$$typeof === Symbol.for('react.server.reference');
  },
  getClientReferenceKey(reference: Object): Object {
    return reference;
  },
  resolveClientReferenceMetadata(
    config: void,
    reference: {$$typeof: symbol, value: any},
  ) {
    return saveModule(reference.value);
  },
});

type Options = {
  environmentName?: string | (() => string),
  filterStackFrame?: (url: string, functionName: string) => boolean,
  identifierPrefix?: string,
  signal?: AbortSignal,
  onError?: (error: mixed) => void,
  onPostpone?: (reason: string) => void,
};

function render(model: ReactClientValue, options?: Options): Destination {
  const destination: Destination = [];
  const bundlerConfig = undefined;
  const request = ReactNoopFlightServer.createRequest(
    model,
    bundlerConfig,
    options ? options.onError : undefined,
    options ? options.identifierPrefix : undefined,
    options ? options.onPostpone : undefined,
    undefined,
    __DEV__ && options ? options.environmentName : undefined,
    __DEV__ && options ? options.filterStackFrame : undefined,
  );
  const signal = options ? options.signal : undefined;
  if (signal) {
    if (signal.aborted) {
      ReactNoopFlightServer.abort(request, (signal: any).reason);
    } else {
      const listener = () => {
        ReactNoopFlightServer.abort(request, (signal: any).reason);
        signal.removeEventListener('abort', listener);
      };
      signal.addEventListener('abort', listener);
    }
  }
  ReactNoopFlightServer.startWork(request);
  ReactNoopFlightServer.startFlowing(request, destination);
  return destination;
}

export {render};
