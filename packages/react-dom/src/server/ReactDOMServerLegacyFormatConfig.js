/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FormatContext} from './ReactDOMServerFormatConfig';

import {
  createResponseState as createResponseStateImpl,
  pushTextInstance as pushTextInstanceImpl,
  writeStartCompletedSuspenseBoundary as writeStartCompletedSuspenseBoundaryImpl,
  writeStartClientRenderedSuspenseBoundary as writeStartClientRenderedSuspenseBoundaryImpl,
  writeEndCompletedSuspenseBoundary as writeEndCompletedSuspenseBoundaryImpl,
  writeEndClientRenderedSuspenseBoundary as writeEndClientRenderedSuspenseBoundaryImpl,
  HTML_MODE,
} from './ReactDOMServerFormatConfig';

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

export const isPrimaryRenderer = false;

export type ResponseState = {
  // Keep this in sync with ReactDOMServerFormatConfig
  placeholderPrefix: PrecomputedChunk,
  segmentPrefix: PrecomputedChunk,
  boundaryPrefix: string,
  opaqueIdentifierPrefix: string,
  nextSuspenseID: number,
  nextOpaqueID: number,
  sentCompleteSegmentFunction: boolean,
  sentCompleteBoundaryFunction: boolean,
  sentClientRenderFunction: boolean,
  // This is an extra field for the legacy renderer
  generateStaticMarkup: boolean,
};

export function createResponseState(
  generateStaticMarkup: boolean,
  identifierPrefix: string | void,
): ResponseState {
  const responseState = createResponseStateImpl(identifierPrefix);
  return {
    // Keep this in sync with ReactDOMServerFormatConfig
    placeholderPrefix: responseState.placeholderPrefix,
    segmentPrefix: responseState.segmentPrefix,
    boundaryPrefix: responseState.boundaryPrefix,
    opaqueIdentifierPrefix: responseState.opaqueIdentifierPrefix,
    nextSuspenseID: responseState.nextSuspenseID,
    nextOpaqueID: responseState.nextOpaqueID,
    sentCompleteSegmentFunction: responseState.sentCompleteSegmentFunction,
    sentCompleteBoundaryFunction: responseState.sentCompleteBoundaryFunction,
    sentClientRenderFunction: responseState.sentClientRenderFunction,
    // This is an extra field for the legacy renderer
    generateStaticMarkup,
  };
}

export function createRootFormatContext(): FormatContext {
  return {
    insertionMode: HTML_MODE, // We skip the root mode because we don't want to emit the DOCTYPE in legacy mode.
    selectedValue: null,
  };
}

export type {
  FormatContext,
  SuspenseBoundaryID,
  OpaqueIDType,
} from './ReactDOMServerFormatConfig';

export {
  getChildFormatContext,
  UNINITIALIZED_SUSPENSE_BOUNDARY_ID,
  assignSuspenseBoundaryID,
  makeServerID,
  pushStartInstance,
  pushEndInstance,
  pushStartCompletedSuspenseBoundary,
  pushEndCompletedSuspenseBoundary,
  writeStartSegment,
  writeEndSegment,
  writeCompletedSegmentInstruction,
  writeCompletedBoundaryInstruction,
  writeClientRenderBoundaryInstruction,
  writeStartPendingSuspenseBoundary,
  writeEndPendingSuspenseBoundary,
  writePlaceholder,
} from './ReactDOMServerFormatConfig';

import {stringToChunk} from 'react-server/src/ReactServerStreamConfig';

import escapeTextForBrowser from './escapeTextForBrowser';

export function pushTextInstance(
  target: Array<Chunk | PrecomputedChunk>,
  text: string,
  responseState: ResponseState,
): void {
  if (responseState.generateStaticMarkup) {
    target.push(stringToChunk(escapeTextForBrowser(text)));
  } else {
    pushTextInstanceImpl(target, text, responseState);
  }
}

export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  if (responseState.generateStaticMarkup) {
    // A completed boundary is done and doesn't need a representation in the HTML
    // if we're not going to be hydrating it.
    return true;
  }
  return writeStartCompletedSuspenseBoundaryImpl(destination, responseState);
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  if (responseState.generateStaticMarkup) {
    // A client rendered boundary is done and doesn't need a representation in the HTML
    // since we'll never hydrate it. This is arguably an error in static generation.
    return true;
  }
  return writeStartClientRenderedSuspenseBoundaryImpl(
    destination,
    responseState,
  );
}
export function writeEndCompletedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  if (responseState.generateStaticMarkup) {
    return true;
  }
  return writeEndCompletedSuspenseBoundaryImpl(destination, responseState);
}
export function writeEndClientRenderedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  if (responseState.generateStaticMarkup) {
    return true;
  }
  return writeEndClientRenderedSuspenseBoundaryImpl(destination, responseState);
}
