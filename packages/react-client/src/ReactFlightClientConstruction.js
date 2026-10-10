/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {BlockedChunk, FlightStreamController} from './ReactFlightClient';

export type PendingInitializationHandler = {
  parent: null | InitializationHandler,
  chunk: null | BlockedChunk<any>,
  value: any,
  // The controller of a stream whose chunk is blocked on its debug info. Null
  // for every other model.
  reason: null | FlightStreamController,
  deps: number,
  errored: false,
};
export type ErroredInitializationHandler = {
  parent: null | InitializationHandler,
  chunk: null | BlockedChunk<any>,
  value: null,
  // The error the handler was rejected with.
  reason: mixed,
  deps: number,
  errored: true,
};
export type InitializationHandler =
  | PendingInitializationHandler
  | ErroredInitializationHandler;

export function createInitializationHandler(
  parent: null | InitializationHandler,
  deps: number,
): PendingInitializationHandler {
  return {
    parent,
    chunk: null,
    value: null,
    reason: null,
    deps,
    errored: false,
  };
}
