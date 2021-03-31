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
  stringToChunk,
  stringToPrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import invariant from 'shared/invariant';

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

export function createSuspenseBoundaryID(
  responseState: ResponseState,
): SuspenseBoundaryID {
  // TODO: This is not deterministic since it's created during render.
  return responseState.nextSuspenseID++;
}

const RAW_TEXT = stringToPrecomputedChunk('RCTRawText');

export function pushEmpty(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): void {
  // This is not used since we don't need to assign any IDs.
}

export function pushTextInstance(
  target: Array<Chunk | PrecomputedChunk>,
  text: string,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
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
  assignID: null | SuspenseBoundaryID,
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

// IDs are formatted as little endian Uint16
function formatID(id: number): Uint8Array {
  if (id > 0xffff) {
    invariant(
      false,
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
  return writeChunk(destination, formatID(id));
}

// Suspense boundaries are encoded as comments.
export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  writeChunk(destination, SUSPENSE_COMPLETE);
  return writeChunk(destination, formatID(id));
}
export function writeStartPendingSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  writeChunk(destination, SUSPENSE_PENDING);
  return writeChunk(destination, formatID(id));
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  writeChunk(destination, SUSPENSE_CLIENT_RENDER);
  return writeChunk(destination, formatID(id));
}
export function writeEndSuspenseBoundary(destination: Destination): boolean {
  return writeChunk(destination, END);
}

export function writeStartSegment(
  destination: Destination,
  responseState: ResponseState,
  formatContext: FormatContext,
  id: number,
): boolean {
  writeChunk(destination, SEGMENT);
  return writeChunk(destination, formatID(id));
}
export function writeEndSegment(
  destination: Destination,
  formatContext: FormatContext,
): boolean {
  return writeChunk(destination, END);
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
  return writeChunk(destination, formatID(contentSegmentID));
}

export function writeClientRenderBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
): boolean {
  writeChunk(destination, SUSPENSE_UPDATE_TO_CLIENT_RENDER);
  return writeChunk(destination, formatID(boundaryID));
}
