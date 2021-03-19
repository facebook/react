/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher as DispatcherType} from 'react-reconciler/src/ReactInternalTypes';
import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from './ReactServerStreamConfig';
import type {ReactNodeList} from 'shared/ReactTypes';
import type {
  SuspenseBoundaryID,
  ResponseState,
} from './ReactServerFormatConfig';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
  closeWithError,
} from './ReactServerStreamConfig';
import {
  writePlaceholder,
  writeStartCompletedSuspenseBoundary,
  writeStartPendingSuspenseBoundary,
  writeStartClientRenderedSuspenseBoundary,
  writeEndSuspenseBoundary,
  writeStartSegment,
  writeEndSegment,
  writeClientRenderBoundaryInstruction,
  writeCompletedBoundaryInstruction,
  writeCompletedSegmentInstruction,
  pushEmpty,
  pushTextInstance,
  pushStartInstance,
  pushEndInstance,
  createSuspenseBoundaryID,
  createResponseState,
} from './ReactServerFormatConfig';
import {REACT_ELEMENT_TYPE, REACT_SUSPENSE_TYPE} from 'shared/ReactSymbols';
import ReactSharedInternals from 'shared/ReactSharedInternals';

import invariant from 'shared/invariant';

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

type SuspenseBoundary = {
  +id: SuspenseBoundaryID,
  rootSegmentID: number,
  forceClientRender: boolean, // if it errors or infinitely suspends
  parentFlushed: boolean,
  pendingWork: number, // when it reaches zero we can show this boundary's content
  completedSegments: Array<Segment>, // completed but not yet flushed segments.
  byteSize: number, // used to determine whether to inline children boundaries.
  fallbackAbortableWork: Set<SuspendedWork>, // used to cancel work on the fallback if the boundary completes or gets canceled.
};

type SuspendedWork = {
  node: ReactNodeList,
  ping: () => void,
  blockedBoundary: Root | SuspenseBoundary,
  blockedSegment: Segment, // the segment we'll write to
  abortSet: Set<SuspendedWork>, // the abortable set that this work belongs to
  assignID: null | SuspenseBoundaryID, // id to assign to the content
};

const PENDING = 0;
const COMPLETED = 1;
const FLUSHED = 2;
const ABORTED = 3;
const ERRORED = 4;

type Root = null;

type Segment = {
  status: 0 | 1 | 2 | 3 | 4,
  parentFlushed: boolean, // typically a segment will be flushed by its parent, except if its parent was already flushed
  id: number, // starts as 0 and is lazily assigned if the parent flushes early
  +index: number, // the index within the parent's chunks or 0 at the root
  +chunks: Array<Chunk | PrecomputedChunk>,
  +children: Array<Segment>,
  // If this segment represents a fallback, this is the content that will replace that fallback.
  +boundary: null | SuspenseBoundary,
};

const BUFFERING = 0;
const FLOWING = 1;
const CLOSED = 2;

type Request = {
  +destination: Destination,
  +responseState: ResponseState,
  +maxBoundarySize: number,
  status: 0 | 1 | 2,
  nextSegmentId: number,
  allPendingWork: number, // when it reaches zero, we can close the connection.
  pendingRootWork: number, // when this reaches zero, we've finished at least the root boundary.
  completedRootSegment: null | Segment, // Completed but not yet flushed root segments.
  abortableWork: Set<SuspendedWork>,
  pingedWork: Array<SuspendedWork>,
  // Queues to flush in order of priority
  clientRenderedBoundaries: Array<SuspenseBoundary>, // Errored or client rendered but not yet flushed.
  completedBoundaries: Array<SuspenseBoundary>, // Completed but not yet fully flushed boundaries to show.
  partialBoundaries: Array<SuspenseBoundary>, // Partially completed boundaries that can flush its segments early.
};

export function createRequest(
  children: ReactNodeList,
  destination: Destination,
): Request {
  const pingedWork = [];
  const abortSet: Set<SuspendedWork> = new Set();
  const request = {
    destination,
    responseState: createResponseState(),
    maxBoundarySize: 1024,
    status: BUFFERING,
    nextSegmentId: 0,
    allPendingWork: 0,
    pendingRootWork: 0,
    completedRootSegment: null,
    abortableWork: abortSet,
    pingedWork: pingedWork,
    clientRenderedBoundaries: [],
    completedBoundaries: [],
    partialBoundaries: [],
  };
  // This segment represents the root fallback.
  const rootSegment = createPendingSegment(request, 0, null);
  // There is no parent so conceptually, we're unblocked to flush this segment.
  rootSegment.parentFlushed = true;
  const rootWork = createSuspendedWork(
    request,
    children,
    null,
    rootSegment,
    abortSet,
    null,
  );
  pingedWork.push(rootWork);
  return request;
}

function pingSuspendedWork(request: Request, work: SuspendedWork): void {
  const pingedWork = request.pingedWork;
  pingedWork.push(work);
  if (pingedWork.length === 1) {
    scheduleWork(() => performWork(request));
  }
}

function createSuspenseBoundary(
  request: Request,
  fallbackAbortableWork: Set<SuspendedWork>,
): SuspenseBoundary {
  return {
    id: createSuspenseBoundaryID(request.responseState),
    rootSegmentID: -1,
    parentFlushed: false,
    pendingWork: 0,
    forceClientRender: false,
    completedSegments: [],
    byteSize: 0,
    fallbackAbortableWork,
  };
}

function createSuspendedWork(
  request: Request,
  node: ReactNodeList,
  blockedBoundary: Root | SuspenseBoundary,
  blockedSegment: Segment,
  abortSet: Set<SuspendedWork>,
  assignID: null | SuspenseBoundaryID,
): SuspendedWork {
  request.allPendingWork++;
  if (blockedBoundary === null) {
    request.pendingRootWork++;
  } else {
    blockedBoundary.pendingWork++;
  }
  const work = {
    node,
    ping: () => pingSuspendedWork(request, work),
    blockedBoundary,
    blockedSegment,
    abortSet,
    assignID,
  };
  abortSet.add(work);
  return work;
}

function createPendingSegment(
  request: Request,
  index: number,
  boundary: null | SuspenseBoundary,
): Segment {
  return {
    status: PENDING,
    id: -1, // lazily assigned later
    index,
    parentFlushed: false,
    chunks: [],
    children: [],
    boundary,
  };
}

function reportError(request: Request, error: mixed): void {
  // TODO: Report errors on the server.
}

function fatalError(request: Request, error: mixed): void {
  // This is called outside error handling code such as if the root errors outside
  // a suspense boundary or if the root suspense boundary's fallback errors.
  // It's also called if React itself or its host configs errors.
  request.status = CLOSED;
  closeWithError(request.destination, error);
}

function renderNode(
  request: Request,
  parentBoundary: Root | SuspenseBoundary,
  segment: Segment,
  node: ReactNodeList,
  abortSet: Set<SuspendedWork>,
  assignID: null | SuspenseBoundaryID,
): void {
  if (typeof node === 'string') {
    pushTextInstance(segment.chunks, node, request.responseState, assignID);
    return;
  }

  if (Array.isArray(node)) {
    if (node.length > 0) {
      // Only the first node gets assigned an ID.
      renderNode(request, parentBoundary, segment, node[0], abortSet, assignID);
      for (let i = 1; i < node.length; i++) {
        renderNode(request, parentBoundary, segment, node[i], abortSet, null);
      }
    } else {
      pushEmpty(segment.chunks, request.responseState, assignID);
    }
    return;
  }

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
      renderNode(request, parentBoundary, segment, result, abortSet, assignID);
    } catch (x) {
      if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
        // Something suspended, we'll need to create a new segment and resolve it later.
        const insertionIndex = segment.chunks.length;
        const newSegment = createPendingSegment(request, insertionIndex, null);
        segment.children.push(newSegment);
        const suspendedWork = createSuspendedWork(
          request,
          node,
          parentBoundary,
          newSegment,
          abortSet,
          assignID,
        );
        const ping = suspendedWork.ping;
        x.then(ping, ping);
        // TODO: Emit place holder
      } else {
        // We can rethrow to terminate the rest of this tree.
        throw x;
      }
    }
  } else if (typeof type === 'string') {
    pushStartInstance(
      segment.chunks,
      type,
      props,
      request.responseState,
      assignID,
    );
    renderNode(
      request,
      parentBoundary,
      segment,
      props.children,
      abortSet,
      null,
    );
    pushEndInstance(segment.chunks, type, props);
  } else if (type === REACT_SUSPENSE_TYPE) {
    // We need to push an "empty" thing here to identify the parent suspense boundary.
    pushEmpty(segment.chunks, request.responseState, assignID);
    // Each time we enter a suspense boundary, we split out into a new segment for
    // the fallback so that we can later replace that segment with the content.
    // This also lets us split out the main content even if it doesn't suspend,
    // in case it ends up generating a large subtree of content.
    const fallback: ReactNodeList = props.fallback;
    const content: ReactNodeList = props.children;

    const fallbackAbortSet: Set<SuspendedWork> = new Set();
    const newBoundary = createSuspenseBoundary(request, fallbackAbortSet);

    const insertionIndex = segment.chunks.length;
    // The children of the boundary segment is actually the fallback.
    const boundarySegment = createPendingSegment(
      request,
      insertionIndex,
      newBoundary,
    );
    segment.children.push(boundarySegment);

    // We create suspended work for the fallback because we don't want to actually work
    // on it yet in case we finish the main content, so we queue for later.
    const suspendedFallbackWork = createSuspendedWork(
      request,
      fallback,
      parentBoundary,
      boundarySegment,
      fallbackAbortSet,
      newBoundary.id, // This is the ID we want to give this fallback so we can replace it later.
    );
    // TODO: This should be queued at a separate lower priority queue so that we only work
    // on preparing fallbacks if we don't have any more main content to work on.
    request.pingedWork.push(suspendedFallbackWork);

    // This segment is the actual child content. We can start rendering that immediately.
    const contentRootSegment = createPendingSegment(request, 0, null);
    // We mark the root segment as having its parent flushed. It's not really flushed but there is
    // no parent segment so there's nothing to wait on.
    contentRootSegment.parentFlushed = true;
    // TODO: Currently this is running synchronously. We could instead schedule this to pingedWork.
    // I suspect that there might be some efficiency benefits from not creating the suspended work
    // and instead just using the stack if possible. Particularly when we add contexts.
    const contentWork = createSuspendedWork(
      request,
      content,
      newBoundary,
      contentRootSegment,
      abortSet,
      null,
    );
    retryWork(request, contentWork);
  } else {
    throw new Error('Not yet implemented element type.');
  }
}

function erroredWork(
  request: Request,
  boundary: Root | SuspenseBoundary,
  segment: Segment,
  error: mixed,
) {
  request.allPendingWork--;
  if (boundary !== null) {
    boundary.pendingWork--;
  }

  // Report the error to a global handler.
  reportError(request, error);
  if (boundary === null) {
    fatalError(request, error);
  } else if (!boundary.forceClientRender) {
    boundary.forceClientRender = true;

    // Regardless of what happens next, this boundary won't be displayed,
    // so we can flush it, if the parent already flushed.
    if (boundary.parentFlushed) {
      // We don't have a preference where in the queue this goes since it's likely
      // to error on the client anyway. However, intentionally client-rendered
      // boundaries should be flushed earlier so that they can start on the client.
      // We reuse the same queue for errors.
      request.clientRenderedBoundaries.push(boundary);
    }
  }
}

function abortWorkSoft(suspendedWork: SuspendedWork): void {
  // This aborts work without aborting the parent boundary that it blocks.
  // It's used for when we didn't need this work to complete the tree.
  // If work was needed, then it should use abortWork instead.
  const request: Request = this;
  const boundary = suspendedWork.blockedBoundary;
  const segment = suspendedWork.blockedSegment;
  segment.status = ABORTED;
  finishedWork(request, boundary, segment);
}

function abortWork(suspendedWork: SuspendedWork): void {
  // This aborts the work and aborts the parent that it blocks, putting it into
  // client rendered mode.
  const request: Request = this;
  const boundary = suspendedWork.blockedBoundary;
  const segment = suspendedWork.blockedSegment;
  segment.status = ABORTED;

  request.allPendingWork--;
  if (boundary === null) {
    // We didn't complete the root so we have nothing to show. We can close
    // the request;
    if (request.status !== CLOSED) {
      request.status = CLOSED;
      close(request.destination);
    }
  } else {
    boundary.pendingWork--;

    // If this boundary was still pending then we haven't already cancelled its fallbacks.
    // We'll need to abort the fallbacks, which will also error that parent boundary.
    boundary.fallbackAbortableWork.forEach(abortWork, request);
    boundary.fallbackAbortableWork.clear();

    if (!boundary.forceClientRender) {
      boundary.forceClientRender = true;
      if (boundary.parentFlushed) {
        request.clientRenderedBoundaries.push(boundary);
      }
    }
  }
}

function finishedWork(
  request: Request,
  boundary: Root | SuspenseBoundary,
  segment: Segment,
) {
  request.allPendingWork--;

  if (boundary === null) {
    request.pendingRootWork--;
    if (segment.parentFlushed) {
      invariant(
        request.completedRootSegment === null,
        'There can only be one root segment. This is a bug in React.',
      );
      request.completedRootSegment = segment;
    }
    return;
  }

  boundary.pendingWork--;
  if (boundary.forceClientRender) {
    // This already errored.
    return;
  }
  if (boundary.pendingWork === 0) {
    // This must have been the last segment we were waiting on. This boundary is now complete.
    // We can now cancel any pending work on the fallback since we won't need to show it anymore.
    boundary.fallbackAbortableWork.forEach(abortWorkSoft, request);
    boundary.fallbackAbortableWork.clear();
    if (segment.parentFlushed) {
      // Our parent segment already flushed, so we need to schedule this segment to be emitted.
      boundary.completedSegments.push(segment);
    }
    if (boundary.parentFlushed) {
      // The segment might be part of a segment that didn't flush yet, but if the boundary's
      // parent flushed, we need to schedule the boundary to be emitted.
      request.completedBoundaries.push(boundary);
    }
  } else {
    if (segment.parentFlushed) {
      // Our parent already flushed, so we need to schedule this segment to be emitted.
      const completedSegments = boundary.completedSegments;
      completedSegments.push(segment);
      if (completedSegments.length === 1) {
        // This is the first time since we last flushed that we completed anything.
        // We can schedule this boundary to emit its partially completed segments early
        // in case the parent has already been flushed.
        if (boundary.parentFlushed) {
          request.partialBoundaries.push(boundary);
        }
      }
    }
  }
}

function retryWork(request: Request, work: SuspendedWork): void {
  const segment = work.blockedSegment;
  if (segment.status !== PENDING) {
    // We completed this by other means before we had a chance to retry it.
    return;
  }
  const boundary = work.blockedBoundary;
  const abortSet = work.abortSet;
  try {
    let node = work.node;
    while (
      typeof node === 'object' &&
      node !== null &&
      (node: any).$$typeof === REACT_ELEMENT_TYPE &&
      typeof node.type === 'function'
    ) {
      // Doing this here lets us reuse this same Segment if the next component
      // also suspends.
      const element: React$Element<any> = (node: any);
      work.node = node;
      // TODO: Classes and legacy context etc.
      node = element.type(element.props);
    }

    renderNode(request, boundary, segment, node, abortSet, work.assignID);

    abortSet.delete(work);
    segment.status = COMPLETED;
    finishedWork(request, boundary, segment);
  } catch (x) {
    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      // Something suspended again, let's pick it back up later.
      const ping = work.ping;
      x.then(ping, ping);
    } else {
      abortSet.delete(work);
      segment.status = ERRORED;
      erroredWork(request, boundary, segment, x);
    }
  }
}

function performWork(request: Request): void {
  if (request.status === CLOSED) {
    return;
  }
  const prevDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = Dispatcher;

  try {
    const pingedWork = request.pingedWork;
    let i;
    for (i = 0; i < pingedWork.length; i++) {
      const work = pingedWork[i];
      retryWork(request, work);
    }
    pingedWork.splice(0, i);
    if (request.status === FLOWING) {
      flushCompletedQueues(request);
    }
  } catch (error) {
    fatalError(request, error);
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher;
  }
}

function flushSubtree(
  request: Request,
  destination: Destination,
  segment: Segment,
): boolean {
  segment.parentFlushed = true;
  switch (segment.status) {
    case PENDING: {
      // We're emitting a placeholder for this segment to be filled in later.
      // Therefore we'll need to assign it an ID - to refer to it by.
      const segmentID = (segment.id = request.nextSegmentId++);
      return writePlaceholder(destination, segmentID);
    }
    case COMPLETED: {
      segment.status = FLUSHED;
      let r = true;
      const chunks = segment.chunks;
      let chunkIdx = 0;
      const children = segment.children;
      for (let childIdx = 0; childIdx < children.length; childIdx++) {
        const nextChild = children[childIdx];
        // Write all the chunks up until the next child.
        for (; chunkIdx < nextChild.index; chunkIdx++) {
          writeChunk(destination, chunks[chunkIdx]);
        }
        r = flushSegment(request, destination, nextChild);
      }
      // Finally just write all the remaining chunks
      for (; chunkIdx < chunks.length; chunkIdx++) {
        r = writeChunk(destination, chunks[chunkIdx]);
      }
      return r;
    }
    default: {
      invariant(
        false,
        'Errored or already flushed boundaries should not be flushed again. This is a bug in React.',
      );
    }
  }
}

function flushSegment(
  request: Request,
  destination,
  segment: Segment,
): boolean {
  const boundary = segment.boundary;
  if (boundary === null) {
    // Not a suspense boundary.
    return flushSubtree(request, destination, segment);
  }
  boundary.parentFlushed = true;
  // This segment is a Suspense boundary. We need to decide whether to
  // emit the content or the fallback now.
  if (boundary.forceClientRender) {
    // Emit a client rendered suspense boundary wrapper.
    // We never queue the inner boundary so we'll never emit its content or partial segments.

    writeStartClientRenderedSuspenseBoundary(destination, boundary.id);

    // Flush the fallback.
    flushSubtree(request, destination, segment);

    return writeEndSuspenseBoundary(destination);
  } else if (boundary.pendingWork > 0) {
    // This boundary is still loading. Emit a pending suspense boundary wrapper.

    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;
    if (boundary.completedSegments.length > 0) {
      // If this is at least partially complete, we can queue it to be partially emmitted early.
      request.partialBoundaries.push(boundary);
    }

    writeStartPendingSuspenseBoundary(destination, boundary.id);

    // Flush the fallback.
    flushSubtree(request, destination, segment);

    return writeEndSuspenseBoundary(destination);
  } else if (boundary.byteSize > request.maxBoundarySize) {
    // This boundary is large and will be emitted separately so that we can progressively show
    // other content. We add it to the queue during the flush because we have to ensure that
    // the parent flushes first so that there's something to inject it into.
    // We also have to make sure that it's emitted into the queue in a deterministic slot.
    // I.e. we can't insert it here when it completes.

    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;

    request.completedBoundaries.push(boundary);
    // Emit a pending rendered suspense boundary wrapper.
    writeStartPendingSuspenseBoundary(destination, boundary.id);

    // Flush the fallback.
    flushSubtree(request, destination, segment);

    return writeEndSuspenseBoundary(destination);
  } else {
    // We can inline this boundary's content as a complete boundary.

    writeStartCompletedSuspenseBoundary(destination, boundary.id);

    const completedSegments = boundary.completedSegments;
    invariant(
      completedSegments.length === 1,
      'A previously unvisited boundary must have exactly one root segment. This is a bug in React.',
    );
    const contentSegment = completedSegments[0];
    flushSegment(request, destination, contentSegment);

    return writeEndSuspenseBoundary(destination);
  }
}

function flushClientRenderedBoundary(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
): boolean {
  return writeClientRenderBoundaryInstruction(
    destination,
    request.responseState,
    boundary.id,
  );
}

function flushSegmentContainer(
  request: Request,
  destination: Destination,
  segment: Segment,
): boolean {
  writeStartSegment(destination, segment.id);
  flushSegment(request, destination, segment);
  return writeEndSegment(destination);
}

function flushCompletedBoundary(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
): boolean {
  const completedSegments = boundary.completedSegments;
  let i = 0;
  for (; i < completedSegments.length; i++) {
    const segment = completedSegments[i];
    flushPartiallyCompletedSegment(request, destination, boundary, segment);
  }
  completedSegments.length = 0;

  return writeCompletedBoundaryInstruction(
    destination,
    request.responseState,
    boundary.id,
    boundary.rootSegmentID,
  );
}

function flushPartialBoundary(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
): boolean {
  const completedSegments = boundary.completedSegments;
  let i = 0;
  for (; i < completedSegments.length; i++) {
    const segment = completedSegments[i];
    if (
      !flushPartiallyCompletedSegment(request, destination, boundary, segment)
    ) {
      i++;
      completedSegments.splice(0, i);
      // Only write as much as the buffer wants. Something higher priority
      // might want to write later.
      return false;
    }
  }
  completedSegments.splice(0, i);
  return true;
}

function flushPartiallyCompletedSegment(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
  segment: Segment,
): boolean {
  if (segment.status === FLUSHED) {
    // We've already flushed this inline.
    return true;
  }

  const segmentID = segment.id;
  if (segmentID === -1) {
    // This segment wasn't previously referred to. This happens at the root of
    // a boundary. We make kind of a leap here and assume this is the root.
    const rootSegmentID = (segment.id = boundary.rootSegmentID);
    invariant(
      rootSegmentID !== -1,
      'A root segment ID must have been assigned by now. This is a bug in React.',
    );
    return flushSegmentContainer(request, destination, segment);
  } else {
    flushSegmentContainer(request, destination, segment);
    return writeCompletedSegmentInstruction(
      destination,
      request.responseState,
      segmentID,
    );
  }
}

let reentrant = false;
function flushCompletedQueues(request: Request): void {
  if (reentrant) {
    return;
  }
  reentrant = true;

  const destination = request.destination;
  beginWriting(destination);
  try {
    // The structure of this is to go through each queue one by one and write
    // until the sink tells us to stop. When we should stop, we still finish writing
    // that item fully and then yield. At that point we remove the already completed
    // items up until the point we completed them.

    // TODO: Emit preloading.

    // TODO: It's kind of unfortunate to keep checking this array after we've already
    // emitted the root.
    const completedRootSegment = request.completedRootSegment;
    if (completedRootSegment !== null && request.pendingRootWork === 0) {
      flushSegment(request, destination, completedRootSegment);
      request.completedRootSegment = null;
    }

    // We emit client rendering instructions for already emitted boundaries first.
    // This is so that we can signal to the client to start client rendering them as
    // soon as possible.
    const clientRenderedBoundaries = request.clientRenderedBoundaries;
    let i;
    for (i = 0; i < clientRenderedBoundaries.length; i++) {
      const boundary = clientRenderedBoundaries[i];
      if (!flushClientRenderedBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        clientRenderedBoundaries.splice(0, i);
        return;
      }
    }
    clientRenderedBoundaries.splice(0, i);

    // Next we emit any complete boundaries. It's better to favor boundaries
    // that are completely done since we can actually show them, than it is to emit
    // any individual segments from a partially complete boundary.
    const completedBoundaries = request.completedBoundaries;
    for (i = 0; i < completedBoundaries.length; i++) {
      const boundary = completedBoundaries[i];
      if (!flushCompletedBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        completedBoundaries.splice(0, i);
        return;
      }
    }
    completedBoundaries.splice(0, i);

    // Allow anything written so far to flush to the underlying sink before
    // we continue with lower priorities.
    completeWriting(destination);
    beginWriting(destination);

    // TODO: Here we'll emit data used by hydration.

    // Next we emit any segments of any boundaries that are partially complete
    // but not deeply complete.
    const partialBoundaries = request.partialBoundaries;
    for (i = 0; i < partialBoundaries.length; i++) {
      const boundary = partialBoundaries[i];
      if (!flushPartialBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        partialBoundaries.splice(0, i);
        return;
      }
    }
    partialBoundaries.splice(0, i);

    // Next we check the completed boundaries again. This may have had
    // boundaries added to it in case they were too larged to be inlined.
    // New ones might be added in this loop.
    const largeBoundaries = request.completedBoundaries;
    for (i = 0; i < largeBoundaries.length; i++) {
      const boundary = largeBoundaries[i];
      if (!flushCompletedBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        largeBoundaries.splice(0, i);
        return;
      }
    }
    largeBoundaries.splice(0, i);
  } finally {
    reentrant = false;
    completeWriting(destination);
    flushBuffered(destination);
    if (
      request.allPendingWork === 0 &&
      request.pingedWork.length === 0 &&
      request.clientRenderedBoundaries.length === 0 &&
      request.completedBoundaries.length === 0
      // We don't need to check any partially completed segments because
      // either they have pending work or they're complete.
    ) {
      if (__DEV__) {
        if (request.abortableWork.size !== 0) {
          console.error(
            'There was still abortable work at the root when we closed. This is a bug in React.',
          );
        }
      }
      // We're done.
      close(destination);
    }
  }
}

// TODO: Expose a way to abort further processing, without closing the connection from the outside.
// This would put all waiting boundaries into client-only mode.

export function startWork(request: Request): void {
  scheduleWork(() => performWork(request));
}

export function startFlowing(request: Request): void {
  if (request.status === CLOSED) {
    return;
  }
  request.status = FLOWING;
  try {
    flushCompletedQueues(request);
  } catch (error) {
    fatalError(request, error);
  }
}

// This is called to early terminate a request. It puts all pending boundaries in client rendered state.
export function abort(request: Request): void {
  try {
    const abortableWork = request.abortableWork;
    abortableWork.forEach(abortWork, request);
    abortableWork.clear();
    if (request.status === FLOWING) {
      flushCompletedQueues(request);
    }
  } catch (error) {
    fatalError(request, error);
  }
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
