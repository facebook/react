/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher as DispatcherType} from 'react-reconciler/src/ReactInternalTypes';
import type {Destination} from './ReactServerStreamConfig';
import type {ReactNodeList} from 'shared/ReactTypes';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
} from './ReactServerStreamConfig';
import {formatChunk} from './ReactServerFormatConfig';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';
import ReactSharedInternals from 'shared/ReactSharedInternals';

import invariant from 'shared/invariant';

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

type Segment = {
  id: number,
  node: ReactNodeList,
  ping: () => void,
};

type Request = {
  destination: Destination,
  nextChunkId: number,
  pendingChunks: number,
  pingedSegments: Array<Segment>,
  completedChunks: Array<Uint8Array>,
  flowing: boolean,
};

export function createRequest(
  children: ReactNodeList,
  destination: Destination,
): Request {
  const pingedSegments = [];
  const request = {
    destination,
    nextChunkId: 0,
    pendingChunks: 0,
    pingedSegments: pingedSegments,
    completedChunks: [],
    flowing: false,
  };
  request.pendingChunks++;
  const rootSegment = createSegment(request, children);
  pingedSegments.push(rootSegment);
  return request;
}

function pingSegment(request: Request, segment: Segment): void {
  const pingedSegments = request.pingedSegments;
  pingedSegments.push(segment);
  if (pingedSegments.length === 1) {
    scheduleWork(() => performWork(request));
  }
}

function createSegment(request: Request, node: ReactNodeList): Segment {
  const id = request.nextChunkId++;
  const segment = {
    id,
    node,
    ping: () => pingSegment(request, segment),
  };
  return segment;
}

function reportError(request: Request, error: mixed): void {
  // TODO: Report errors on the server.
}

function renderNode(request: Request, node: ReactNodeList): void {
  if (
    typeof node !== 'object' ||
    !node ||
    (node: any).$$typeof !== REACT_ELEMENT_TYPE
  ) {
    throw new Error('Not yet implemented node type.');
  }
  const element: React$Element<any> = (node: any);
  const type = element.type;
  const props = element.props;
  if (typeof type === 'function') {
    try {
      const result = type(props);
      renderNode(result);
    } catch (x) {
      if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
        // Something suspended, we'll need to create a new segment and resolve it later.
        request.pendingChunks++;
        const newSegment = createSegment(request, node);
        const ping = newSegment.ping;
        x.then(ping, ping);
        // TODO: Emit place holder
      } else {
        reportError(request, x);
        // TODO: Emit client render signal
      }
    }
  } else if (typeof type === 'string') {
    request.completedChunks.push(formatChunk(type, props));
  } else {
    throw new Error('Not yet implemented element type.');
  }
}

function retrySegment(request: Request, segment: Segment): void {
  try {
    let node = segment.node;
    while (
      typeof node === 'object' &&
      node !== null &&
      (node: any).$$typeof === REACT_ELEMENT_TYPE &&
      typeof node.type === 'function'
    ) {
      // Attempt to render the server component.
      // Doing this here lets us reuse this same segment if the next component
      // also suspends.
      const element: React$Element<any> = (node: any);
      segment.node = node;
      // TODO: Classes and legacy context etc.
      node = element.type(element.props);
    }

    renderNode(request, node);
  } catch (x) {
    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      // Something suspended again, let's pick it back up later.
      const ping = segment.ping;
      x.then(ping, ping);
      return;
    } else {
      // This errored, we need to serialize this error to the
      reportError(request, x);
      // TODO: Emit client render signal
    }
  }
}

function performWork(request: Request): void {
  const prevDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = Dispatcher;

  const pingedSegments = request.pingedSegments;
  request.pingedSegments = [];
  for (let i = 0; i < pingedSegments.length; i++) {
    const segment = pingedSegments[i];
    retrySegment(request, segment);
  }
  if (request.flowing) {
    flushCompletedChunks(request);
  }

  ReactCurrentDispatcher.current = prevDispatcher;
}

let reentrant = false;
function flushCompletedChunks(request: Request): void {
  if (reentrant) {
    return;
  }
  reentrant = true;
  const destination = request.destination;
  beginWriting(destination);
  try {
    // We emit module chunks first in the stream so that
    // they can be preloaded as early as possible.
    const completedChunks = request.completedChunks;
    let i = 0;
    for (; i < completedChunks.length; i++) {
      request.pendingChunks--;
      const chunk = completedChunks[i];
      if (!writeChunk(destination, chunk)) {
        request.flowing = false;
        i++;
        break;
      }
    }
    completedChunks.splice(0, i);
  } finally {
    reentrant = false;
    completeWriting(destination);
  }
  flushBuffered(destination);
  if (request.pendingChunks === 0) {
    // We're done.
    close(destination);
  }
}

export function startWork(request: Request): void {
  request.flowing = true;
  scheduleWork(() => performWork(request));
}

export function startFlowing(request: Request): void {
  request.flowing = false;
  flushCompletedChunks(request);
}

function notYetImplemented(): void {
  throw new Error('Not yet implemented.');
}

function unsupportedRefresh() {
  invariant(false, 'Cache cannot be refreshed during server rendering.');
}

function unsupportedStartTransition() {
  invariant(false, 'startTransition cannot be called during server rendering.');
}

function noop(): void {}

const Dispatcher: DispatcherType = {
  useMemo<T>(nextCreate: () => T): T {
    return nextCreate();
  },
  useCallback<T>(callback: T): T {
    return callback;
  },
  useDebugValue(): void {},
  useDeferredValue<T>(value: T): T {
    return value;
  },
  useTransition(): [(callback: () => void) => void, boolean] {
    return [unsupportedStartTransition, false];
  },
  getCacheForType<T>(resourceType: () => T): T {
    throw new Error('Not yet implemented. Should mark as client rendered.');
  },
  readContext: (notYetImplemented: any),
  useContext: (notYetImplemented: any),
  useReducer: (notYetImplemented: any),
  useRef: (notYetImplemented: any),
  useState: (notYetImplemented: any),
  useLayoutEffect: noop,
  // useImperativeHandle is not run in the server environment
  useImperativeHandle: noop,
  // Effects are not run in the server environment.
  useEffect: noop,
  useOpaqueIdentifier: (notYetImplemented: any),
  useMutableSource: (notYetImplemented: any),
  useCacheRefresh(): <T>(?() => T, ?T) => void {
    return unsupportedRefresh;
  },
};
