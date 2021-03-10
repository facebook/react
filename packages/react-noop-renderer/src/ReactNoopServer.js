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

import ReactFizzServer from 'react-server';

type Instance = {|
  type: string,
  children: Array<Instance | TextInstance | SuspenseInstance>,
  prop: any,
  hidden: boolean,
|};

type TextInstance = {|
  text: string,
  hidden: boolean,
|};

type SuspenseInstance = {|
  state: 'pending' | 'complete' | 'client-render',
  children: Array<Instance | TextInstance | SuspenseInstance>,
|};

type Placeholder = {
  parent: Instance | SuspenseInstance,
  index: number,
};

type Segment = {
  children: null | Instance | TextInstance | SuspenseInstance,
};

type Destination = {
  root: null | Instance | TextInstance | SuspenseInstance,
  placeholders: Map<number, Placeholder>,
  segments: Map<number, Segment>,
  stack: Array<Segment | Instance | SuspenseInstance>,
};

const POP = Buffer.from('/', 'utf8');

const ReactNoopServer = ReactFizzServer({
  scheduleWork(callback: () => void) {
    callback();
  },
  beginWriting(destination: Destination): void {},
  writeChunk(destination: Destination, buffer: Uint8Array): void {
    const stack = destination.stack;
    if (buffer === POP) {
      stack.pop();
      return;
    }
    // We assume one chunk is one instance.
    const instance = JSON.parse(Buffer.from((buffer: any)).toString('utf8'));
    if (stack.length === 0) {
      destination.root = instance;
    } else {
      const parent = stack[stack.length - 1];
      parent.children.push(instance);
    }
    stack.push(instance);
  },
  completeWriting(destination: Destination): void {},
  close(destination: Destination): void {},
  flushBuffered(destination: Destination): void {},

  createResponseState(): null {
    return null;
  },
  createSuspenseBoundaryID(): SuspenseInstance {
    // The ID is a pointer to the boundary itself.
    return {state: 'pending', children: []};
  },

  pushTextInstance(target: Array<Uint8Array>, text: string): void {
    const textInstance: TextInstance = {
      text,
      hidden: false,
    };
    target.push(Buffer.from(JSON.stringify(textInstance), 'utf8'), POP);
  },
  pushStartInstance(
    target: Array<Uint8Array>,
    type: string,
    props: Object,
  ): void {
    const instance: Instance = {
      type: type,
      children: [],
      prop: props.prop,
      hidden: false,
    };
    target.push(Buffer.from(JSON.stringify(instance), 'utf8'));
  },

  pushEndInstance(
    target: Array<Uint8Array>,
    type: string,
    props: Object,
  ): void {
    target.push(POP);
  },

  writePlaceholder(destination: Destination, id: number): boolean {
    const parent = destination.stack[destination.stack.length - 1];
    destination.placeholders.set(id, {
      parent: parent,
      index: parent.children.length,
    });
  },

  writeStartCompletedSuspenseBoundary(
    destination: Destination,
    suspenseInstance: SuspenseInstance,
  ): boolean {
    suspenseInstance.state = 'complete';
    const parent = destination.stack[destination.stack.length - 1];
    parent.children.push(suspenseInstance);
    destination.stack.push(suspenseInstance);
  },
  writeStartPendingSuspenseBoundary(
    destination: Destination,
    suspenseInstance: SuspenseInstance,
  ): boolean {
    suspenseInstance.state = 'pending';
    const parent = destination.stack[destination.stack.length - 1];
    parent.children.push(suspenseInstance);
    destination.stack.push(suspenseInstance);
  },
  writeStartClientRenderedSuspenseBoundary(
    destination: Destination,
    suspenseInstance: SuspenseInstance,
  ): boolean {
    suspenseInstance.state = 'client-render';
    const parent = destination.stack[destination.stack.length - 1];
    parent.children.push(suspenseInstance);
    destination.stack.push(suspenseInstance);
  },
  writeEndSuspenseBoundary(destination: Destination): boolean {
    destination.stack.pop();
  },

  writeStartSegment(destination: Destination, id: number): boolean {
    const segment = {
      children: [],
    };
    destination.segments.set(id, segment);
    if (destination.stack.length > 0) {
      throw new Error('Segments are only expected at the root of the stack.');
    }
    destination.stack.push(segment);
  },
  writeEndSegment(destination: Destination): boolean {
    destination.stack.pop();
  },

  writeCompletedSegmentInstruction(
    destination: Destination,
    responseState: ResponseState,
    contentSegmentID: number,
  ): boolean {
    const segment = destination.segments.get(contentSegmentID);
    if (!segment) {
      throw new Error('Missing segment.');
    }
    const placeholder = destination.placeholders.get(contentSegmentID);
    if (!placeholder) {
      throw new Error('Missing placeholder.');
    }
    placeholder.parent.children.splice(
      placeholder.index,
      0,
      ...segment.children,
    );
  },

  writeCompletedBoundaryInstruction(
    destination: Destination,
    responseState: ResponseState,
    boundary: SuspenseInstance,
    contentSegmentID: number,
  ): boolean {
    const segment = destination.segments.get(contentSegmentID);
    if (!segment) {
      throw new Error('Missing segment.');
    }
    boundary.children = segment.children;
    boundary.state = 'complete';
  },

  writeClientRenderBoundaryInstruction(
    destination: Destination,
    responseState: ResponseState,
    boundary: SuspenseInstance,
  ): boolean {
    boundary.status = 'client-render';
  },
});

function render(children: React$Element<any>): Destination {
  const destination: Destination = {
    root: null,
    placeholders: new Map(),
    segments: new Map(),
    stack: [],
  };
  const request = ReactNoopServer.createRequest(children, destination);
  ReactNoopServer.startWork(request);
  return destination;
}

export {render};
