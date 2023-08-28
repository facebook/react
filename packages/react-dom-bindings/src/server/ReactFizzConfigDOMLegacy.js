/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ResumableState, BoundaryResources} from './ReactFizzConfigDOM';

import {
  createRenderState as createRenderStateImpl,
  pushTextInstance as pushTextInstanceImpl,
  pushSegmentFinale as pushSegmentFinaleImpl,
  writeStartCompletedSuspenseBoundary as writeStartCompletedSuspenseBoundaryImpl,
  writeStartClientRenderedSuspenseBoundary as writeStartClientRenderedSuspenseBoundaryImpl,
  writeEndCompletedSuspenseBoundary as writeEndCompletedSuspenseBoundaryImpl,
  writeEndClientRenderedSuspenseBoundary as writeEndClientRenderedSuspenseBoundaryImpl,
} from './ReactFizzConfigDOM';

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import type {FormStatus} from '../shared/ReactDOMFormActions';

import {NotPending} from '../shared/ReactDOMFormActions';

export const isPrimaryRenderer = false;

export type RenderState = {
  // Keep this in sync with ReactFizzConfigDOM
  placeholderPrefix: PrecomputedChunk,
  segmentPrefix: PrecomputedChunk,
  boundaryPrefix: string,
  startInlineScript: PrecomputedChunk,
  htmlChunks: null | Array<Chunk | PrecomputedChunk>,
  headChunks: null | Array<Chunk | PrecomputedChunk>,
  charsetChunks: Array<Chunk | PrecomputedChunk>,
  preconnectChunks: Array<Chunk | PrecomputedChunk>,
  importMapChunks: Array<Chunk | PrecomputedChunk>,
  preloadChunks: Array<Chunk | PrecomputedChunk>,
  hoistableChunks: Array<Chunk | PrecomputedChunk>,
  boundaryResources: ?BoundaryResources,
  stylesToHoist: boolean,
  // This is an extra field for the legacy renderer
  generateStaticMarkup: boolean,
};

export function createRenderState(
  resumableState: ResumableState,
  nonce: string | void,
  generateStaticMarkup: boolean,
): RenderState {
  const renderState = createRenderStateImpl(resumableState, nonce);
  return {
    // Keep this in sync with ReactFizzConfigDOM
    placeholderPrefix: renderState.placeholderPrefix,
    segmentPrefix: renderState.segmentPrefix,
    boundaryPrefix: renderState.boundaryPrefix,
    startInlineScript: renderState.startInlineScript,
    htmlChunks: renderState.htmlChunks,
    headChunks: renderState.headChunks,
    charsetChunks: renderState.charsetChunks,
    preconnectChunks: renderState.preconnectChunks,
    importMapChunks: renderState.importMapChunks,
    preloadChunks: renderState.preloadChunks,
    hoistableChunks: renderState.hoistableChunks,
    boundaryResources: renderState.boundaryResources,
    stylesToHoist: renderState.stylesToHoist,

    // This is an extra field for the legacy renderer
    generateStaticMarkup,
  };
}

import {
  stringToChunk,
  stringToPrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

// this chunk is empty on purpose because we do not want to emit the DOCTYPE in legacy mode
export const doctypeChunk: PrecomputedChunk = stringToPrecomputedChunk('');

export type {
  ResumableState,
  BoundaryResources,
  FormatContext,
  SuspenseBoundaryID,
} from './ReactFizzConfigDOM';

export {
  getChildFormatContext,
  UNINITIALIZED_SUSPENSE_BOUNDARY_ID,
  assignSuspenseBoundaryID,
  makeId,
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
  writeResourcesForBoundary,
  writePlaceholder,
  writeCompletedRoot,
  createRootFormatContext,
  createResumableState,
  createBoundaryResources,
  writePreamble,
  writeHoistables,
  writePostamble,
  hoistResources,
  setCurrentlyRenderingBoundaryResourcesTarget,
  prepareHostDispatcher,
} from './ReactFizzConfigDOM';

import escapeTextForBrowser from './escapeTextForBrowser';

export function pushTextInstance(
  target: Array<Chunk | PrecomputedChunk>,
  text: string,
  renderState: RenderState,
  textEmbedded: boolean,
): boolean {
  if (renderState.generateStaticMarkup) {
    target.push(stringToChunk(escapeTextForBrowser(text)));
    return false;
  } else {
    return pushTextInstanceImpl(target, text, renderState, textEmbedded);
  }
}

export function pushSegmentFinale(
  target: Array<Chunk | PrecomputedChunk>,
  renderState: RenderState,
  lastPushedText: boolean,
  textEmbedded: boolean,
): void {
  if (renderState.generateStaticMarkup) {
    return;
  } else {
    return pushSegmentFinaleImpl(
      target,
      renderState,
      lastPushedText,
      textEmbedded,
    );
  }
}

export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
): boolean {
  if (renderState.generateStaticMarkup) {
    // A completed boundary is done and doesn't need a representation in the HTML
    // if we're not going to be hydrating it.
    return true;
  }
  return writeStartCompletedSuspenseBoundaryImpl(destination, renderState);
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
  // flushing these error arguments are not currently supported in this legacy streaming format.
  errorDigest: ?string,
  errorMessage: ?string,
  errorComponentStack: ?string,
): boolean {
  if (renderState.generateStaticMarkup) {
    // A client rendered boundary is done and doesn't need a representation in the HTML
    // since we'll never hydrate it. This is arguably an error in static generation.
    return true;
  }
  return writeStartClientRenderedSuspenseBoundaryImpl(
    destination,
    renderState,
    errorDigest,
    errorMessage,
    errorComponentStack,
  );
}
export function writeEndCompletedSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
): boolean {
  if (renderState.generateStaticMarkup) {
    return true;
  }
  return writeEndCompletedSuspenseBoundaryImpl(destination, renderState);
}
export function writeEndClientRenderedSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
): boolean {
  if (renderState.generateStaticMarkup) {
    return true;
  }
  return writeEndClientRenderedSuspenseBoundaryImpl(destination, renderState);
}

export type TransitionStatus = FormStatus;
export const NotPendingTransition: TransitionStatus = NotPending;
