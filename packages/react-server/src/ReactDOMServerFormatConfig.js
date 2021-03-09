/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Destination} from 'react-server/src/ReactServerStreamConfig';

import {
  writeChunk,
  convertStringToBuffer,
} from 'react-server/src/ReactServerStreamConfig';

// This object is used to lazily reuse the ID of the first generated node, or assign one.
// This is very specific to DOM where we can't assign an ID to.
export type SuspenseBoundaryID = {
  id: null | string,
};

export function createSuspenseBoundaryID(): SuspenseBoundaryID {
  return {id: null};
}

export function formatChunkAsString(type: string, props: Object): string {
  let str = '<' + type + '>';
  if (typeof props.children === 'string') {
    str += props.children;
  }
  str += '</' + type + '>';
  return str;
}

export function formatChunk(type: string, props: Object): Uint8Array {
  return convertStringToBuffer(formatChunkAsString(type, props));
}

// Structural Nodes

// A placeholder is a node inside a hidden partial tree that can be filled in later, but before
// display. It's never visible to users.
const placeholder1 = convertStringToBuffer('<span id="');
const placeholder2 = convertStringToBuffer('P:');
const placeholder3 = convertStringToBuffer('"></span>');
export function writePlaceholder(
  destination: Destination,
  id: number,
): boolean {
  // TODO: This needs to be contextually aware and switch tag since not all parents allow for spans like
  // <select> or <tbody>. E.g. suspending a component that renders a table row.
  writeChunk(destination, placeholder1);
  // TODO: Use the identifierPrefix option to make the prefix configurable.
  writeChunk(destination, placeholder2);
  const formattedID = convertStringToBuffer(id.toString(16));
  writeChunk(destination, formattedID);
  return writeChunk(destination, placeholder3);
}

// Suspense boundaries are encoded as comments.
const startCompletedSuspenseBoundary = convertStringToBuffer('<!--$-->');
const startPendingSuspenseBoundary = convertStringToBuffer('<!--$?-->');
const startClientRenderedSuspenseBoundary = convertStringToBuffer('<!--$!-->');
const endSuspenseBoundary = convertStringToBuffer('<!--/$-->');

export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startCompletedSuspenseBoundary);
}
export function writeStartPendingSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startPendingSuspenseBoundary);
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startClientRenderedSuspenseBoundary);
}
export function writeEndSuspenseBoundary(destination: Destination): boolean {
  return writeChunk(destination, endSuspenseBoundary);
}

const startSegment = convertStringToBuffer('<div hidden id="');
const startSegment2 = convertStringToBuffer('S:');
const startSegment3 = convertStringToBuffer('">');
const endSegment = convertStringToBuffer('"></div>');
export function writeStartSegment(
  destination: Destination,
  id: number,
): boolean {
  // TODO: What happens with special children like <tr> if they're inserted in a div? Maybe needs contextually aware containers.
  writeChunk(destination, startSegment);
  // TODO: Use the identifierPrefix option to make the prefix configurable.
  writeChunk(destination, startSegment2);
  const formattedID = convertStringToBuffer(id.toString(16));
  return writeChunk(destination, startSegment3);
}
export function writeEndSegment(destination: Destination): boolean {
  return writeChunk(destination, endSegment);
}
