/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import {
  writeChunk,
  writeChunkAndReturn,
  stringToChunk,
  stringToPrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

export const isPrimaryRenderer = true;

// Every list of children or string is null terminated.
const END_TAG = 0;
// Tree node tags.
const INSTANCE_TAG = 1;
const PLACEHOLDER_TAG = 2;
const SUSPENSE_PENDING_TAG = 3;
const SUSPENSE_COMPLETE_TAG = 4;
const SUSPENSE_CLIENT_RENDER_TAG = 5;
// Command tags.
const SEGMENT_TAG = 1;
const SUSPENSE_UPDATE_TO_COMPLETE_TAG = 2;
const SUSPENSE_UPDATE_TO_CLIENT_RENDER_TAG = 3;

const END = new Uint8Array(1);
END[0] = END_TAG;
const PLACEHOLDER = new Uint8Array(1);
PLACEHOLDER[0] = PLACEHOLDER_TAG;
const INSTANCE = new Uint8Array(1);
INSTANCE[0] = INSTANCE_TAG;
const SUSPENSE_PENDING = new Uint8Array(1);
SUSPENSE_PENDING[0] = SUSPENSE_PENDING_TAG;
const SUSPENSE_COMPLETE = new Uint8Array(1);
SUSPENSE_COMPLETE[0] = SUSPENSE_COMPLETE_TAG;
const SUSPENSE_CLIENT_RENDER = new Uint8Array(1);
SUSPENSE_CLIENT_RENDER[0] = SUSPENSE_CLIENT_RENDER_TAG;

const SEGMENT = new Uint8Array(1);
SEGMENT[0] = SEGMENT_TAG;
const SUSPENSE_UPDATE_TO_COMPLETE = new Uint8Array(1);
SUSPENSE_UPDATE_TO_COMPLETE[0] = SUSPENSE_UPDATE_TO_COMPLETE_TAG;
const SUSPENSE_UPDATE_TO_CLIENT_RENDER = new Uint8Array(1);
SUSPENSE_UPDATE_TO_CLIENT_RENDER[0] = SUSPENSE_UPDATE_TO_CLIENT_RENDER_TAG;

// Per response,
export type ResponseState = {
  nextSuspenseID: number,
};

// Allows us to keep track of what we've already written so we can refer back to it.
export function createResponseState(): ResponseState {
  return {
    nextSuspenseID: 0,
  };
}

// isInAParentText
export type FormatContext = boolean;

export function createRootFormatContext(): FormatContext {
  return false;
}

export function getChildFormatContext(
  parentContext: FormatContext,
  type: string,
  props: Object,
): FormatContext {
  const prevIsInAParentText = parentContext;
  const isInAParentText =
    type === 'AndroidTextInput' || // Android
    type === 'RCTMultilineTextInputView' || // iOS
    type === 'RCTSinglelineTextInputView' || // iOS
    type === 'RCTText' ||
    type === 'RCTVirtualText';

  if (prevIsInAParentText !== isInAParentText) {
    return isInAParentText;
  } else {
    return parentContext;
  }
}

// This object is used to lazily reuse the ID of the first generated node, or assign one.
// This is very specific to DOM where we can't assign an ID to.
export type SuspenseBoundaryID = number;

export const UNINITIALIZED_SUSPENSE_BOUNDARY_ID = -1;

export function assignSuspenseBoundaryID(
  responseState: ResponseState,
): SuspenseBoundaryID {
  return responseState.nextSuspenseID++;
}

export function makeId(
  responseState: ResponseState,
  treeId: string,
  localId: number,
): string {
  throw new Error('Not implemented');
}

const RAW_TEXT = stringToPrecomputedChunk('RCTRawText');

export function pushTextInstance(
  target: Array<Chunk | PrecomputedChunk>,
  text: string,
  responseState: ResponseState,
): void {
  target.push(
    INSTANCE,
    RAW_TEXT, // Type
    END, // Null terminated type string
    // TODO: props { text: text }
    END, // End of children
  );
}

export function pushStartInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
  responseState: ResponseState,
  formatContext: FormatContext,
): ReactNodeList {
  target.push(
    INSTANCE,
    stringToChunk(type),
    END, // Null terminated type string
    // TODO: props
  );
  return props.children;
}

export function pushEndInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
): void {
  target.push(END);
}

export function writeCompletedRoot(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return true;
}

// IDs are formatted as little endian Uint16
function formatID(id: number): Uint8Array {
  if (id > 0xffff) {
    throw new Error(
      'More boundaries or placeholders than we expected to ever emit.',
    );
  }
  const buffer = new Uint8Array(2);
  buffer[0] = (id >>> 8) & 0xff;
  buffer[1] = id & 0xff;
  return buffer;
}

// Structural Nodes

// A placeholder is a node inside a hidden partial tree that can be filled in later, but before
// display. It's never visible to users.
export function writePlaceholder(
  destination: Destination,
  responseState: ResponseState,
  id: number,
): boolean {
  writeChunk(destination, PLACEHOLDER);
  return writeChunkAndReturn(destination, formatID(id));
}

// Suspense boundaries are encoded as comments.
export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, SUSPENSE_COMPLETE);
}

export function pushStartCompletedSuspenseBoundary(
  target: Array<Chunk | PrecomputedChunk>,
): void {
  target.push(SUSPENSE_COMPLETE);
}

export function writeStartPendingSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
  id: SuspenseBoundaryID,
): boolean {
  writeChunk(destination, SUSPENSE_PENDING);
  return writeChunkAndReturn(destination, formatID(id));
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, SUSPENSE_CLIENT_RENDER);
}
export function writeEndCompletedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, END);
}
export function pushEndCompletedSuspenseBoundary(
  target: Array<Chunk | PrecomputedChunk>,
): void {
  target.push(END);
}
export function writeEndPendingSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, END);
}
export function writeEndClientRenderedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, END);
}

export function writeStartSegment(
  destination: Destination,
  responseState: ResponseState,
  formatContext: FormatContext,
  id: number,
): boolean {
  writeChunk(destination, SEGMENT);
  return writeChunkAndReturn(destination, formatID(id));
}
export function writeEndSegment(
  destination: Destination,
  formatContext: FormatContext,
): boolean {
  return writeChunkAndReturn(destination, END);
}

// Instruction Set

export function writeCompletedSegmentInstruction(
  destination: Destination,
  responseState: ResponseState,
  contentSegmentID: number,
): boolean {
  // We don't need to emit this. Instead the client will keep track of pending placeholders.
  // TODO: Returning true here is not correct. Avoid having to call this function at all.
  return true;
}

export function writeCompletedBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
  contentSegmentID: number,
): boolean {
  writeChunk(destination, SUSPENSE_UPDATE_TO_COMPLETE);
  writeChunk(destination, formatID(boundaryID));
  return writeChunkAndReturn(destination, formatID(contentSegmentID));
}

export function writeClientRenderBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
): boolean {
  writeChunk(destination, SUSPENSE_UPDATE_TO_CLIENT_RENDER);
  return writeChunkAndReturn(destination, formatID(boundaryID));
}
