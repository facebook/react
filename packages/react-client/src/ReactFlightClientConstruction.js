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

export const CONSTRUCTION_PENDING = 0;
export const CONSTRUCTION_INSTALLED = 1;
export const CONSTRUCTION_FAILED = 2;

// An object can be available before the references in its fields resolve.
// A field fact records the result its path readers are waiting for, separately
// from the placeholder currently in the object. Installing the field removes
// its pending entry, so later readers use the property directly. Failed entries
// remain so those readers receive the failure instead of the placeholder.
export type ConstructionFact<Listener> = {
  status: 0 | 1 | 2, // pending, installed, failed
  value: any,
  listeners: null | Array<Listener>,
};

export type ConstructionState<Listener> = {
  fields: WeakMap<Object, Map<string, ConstructionFact<Listener>>>,
};

export function createConstructionState<
  Listener,
>(): ConstructionState<Listener> {
  return {fields: new WeakMap()};
}

// Installed fields are read directly. A pending producer must be waited on,
// and a failed producer must throw instead of exposing its placeholder.
export function getPendingConstructionField<Listener>(
  state: null | ConstructionState<Listener>,
  parentObject: Object,
  key: string,
): void | ConstructionFact<Listener> {
  if (state === null) {
    return undefined;
  }
  const fields = state.fields.get(parentObject);
  const fact = fields === undefined ? undefined : fields.get(key);
  if (fact !== undefined && fact.status === CONSTRUCTION_FAILED) {
    throw fact.value;
  }
  return fact;
}

export function registerConstructionField<Listener>(
  state: ConstructionState<Listener>,
  parentObject: Object,
  key: string,
): ConstructionFact<Listener> {
  let fields = state.fields.get(parentObject);
  if (fields === undefined) {
    fields = new Map();
    state.fields.set(parentObject, fields);
  }
  if (fields.has(key)) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error('Two producers for one model field.');
  }
  const fact: ConstructionFact<Listener> = {
    status: CONSTRUCTION_PENDING,
    value: null,
    listeners: null,
  };
  fields.set(key, fact);
  return fact;
}

export function subscribeConstructionFact<Listener>(
  fact: ConstructionFact<Listener>,
  listener: Listener,
): void {
  if (fact.listeners === null) {
    fact.listeners = [listener];
  } else {
    fact.listeners.push(listener);
  }
}

export function settleConstructionField<Listener>(
  state: ConstructionState<Listener>,
  parentObject: Object,
  key: string,
  fact: ConstructionFact<Listener>,
  status: 1 | 2,
  value: any,
): null | Array<Listener> {
  if (fact.status !== CONSTRUCTION_PENDING) {
    return null;
  }
  fact.status = status;
  fact.value = value;
  const listeners = fact.listeners;
  fact.listeners = null;
  if (status === CONSTRUCTION_INSTALLED) {
    // The producer has installed the value. Later readers can use the field
    // directly instead of going through this fact.
    const fields = state.fields.get(parentObject);
    if (fields !== undefined) {
      fields.delete(key);
      if (fields.size === 0) {
        state.fields.delete(parentObject);
      }
    }
  }
  // Failed assignments remain visible to later selected-path readers.
  return listeners;
}
