/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

import type {ReactModel} from 'react-flight/inline-typed';

import ReactFlightClient from 'react-flight';

type Destination = Array<string>;

const ReactNoopFlightClient = ReactFlightClient({
  scheduleWork(callback: () => void) {
    callback();
  },
  beginWriting(destination: Destination): void {},
  writeChunk(destination: Destination, buffer: Uint8Array): void {
    destination.push(JSON.parse(Buffer.from((buffer: any)).toString('utf8')));
  },
  completeWriting(destination: Destination): void {},
  close(destination: Destination): void {},
  flushBuffered(destination: Destination): void {},
  convertStringToBuffer(content: string): Uint8Array {
    return Buffer.from(content, 'utf8');
  },
  formatChunkAsString(type: string, props: Object): string {
    return JSON.stringify({type, props});
  },
  formatChunk(type: string, props: Object): Uint8Array {
    return Buffer.from(JSON.stringify({type, props}), 'utf8');
  },
});

function render(model: ReactModel): Destination {
  let destination: Destination = [];
  let request = ReactNoopFlightClient.createRequest(model, destination);
  ReactNoopFlightClient.startWork(request);
  return destination;
}

export default {
  render,
};
