/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createResponseState as createResponseStateImpl} from './ReactDOMServerFormatConfig';

import type {PrecomputedChunk} from 'react-server/src/ReactServerStreamConfig';

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

export type {
  FormatContext,
  SuspenseBoundaryID,
  OpaqueIDType,
} from './ReactDOMServerFormatConfig';

export {
  createRootFormatContext,
  getChildFormatContext,
  createSuspenseBoundaryID,
  makeServerID,
  pushEmpty,
  pushTextInstance,
  pushStartInstance,
  pushEndInstance,
  writePlaceholder,
  writeStartCompletedSuspenseBoundary,
  writeStartPendingSuspenseBoundary,
  writeStartClientRenderedSuspenseBoundary,
  writeEndSuspenseBoundary,
  writeStartSegment,
  writeEndSegment,
  writeCompletedSegmentInstruction,
  writeCompletedBoundaryInstruction,
  writeClientRenderBoundaryInstruction,
} from './ReactDOMServerFormatConfig';
