/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {BlockedChunk, FlightStreamController} from './ReactFlightClient';
import isArray from 'shared/isArray';
import getPrototypeOf from 'shared/getPrototypeOf';
import hasOwnProperty from 'shared/hasOwnProperty';
const ObjectPrototype = Object.prototype;
export const CONSTRUCTION_REFERENCE = 0;
export const CONSTRUCTION_PUBLICATION = 1;

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
  heads: null | WeakMap<Object, ConstructionFact<Listener>>,
  publications: null | WeakMap<Object, Listener>,
  publicationQueue: Array<Listener>,
  draining: boolean,
  waking: number,
  unfinished: number,
};

export function createConstructionState<
  Listener,
>(): ConstructionState<Listener> {
  return {
    fields: new WeakMap(),
    heads: null,
    publications: null,
    publicationQueue: [],
    draining: false,
    waking: 0,
    unfinished: 0,
  };
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

function createConstructionFact<Listener>(): ConstructionFact<Listener> {
  return {
    status: CONSTRUCTION_PENDING,
    value: null,
    listeners: null,
  };
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
  const fact = createConstructionFact<Listener>();
  fields.set(key, fact);
  state.unfinished++;
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

// The caller has checked that this fact is still pending.
function settleConstructionFact<Listener>(
  fact: ConstructionFact<Listener>,
  status: 1 | 2,
  value: any,
): null | Array<Listener> {
  fact.status = status;
  fact.value = value;
  const listeners = fact.listeners;
  fact.listeners = null;
  return listeners;
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
  const listeners = settleConstructionFact(fact, status, value);
  if (status === CONSTRUCTION_INSTALLED) {
    state.unfinished--;
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

export function subscribeConstructionFacts<Listener>(
  waiting: null | Set<ConstructionFact<Listener>>,
  pending: Array<ConstructionFact<Listener>>,
  listener: Listener,
): Set<ConstructionFact<Listener>> {
  if (waiting === null) {
    waiting = new Set();
  }
  for (let i = 0; i < pending.length; i++) {
    const fact = pending[i];
    if (!waiting.has(fact)) {
      waiting.add(fact);
      subscribeConstructionFact(fact, listener);
    }
  }
  return waiting;
}

export function installConstructionHead<Listener>(
  state: ConstructionState<Listener>,
  chunk: Object,
  value: any,
): void {
  let heads = state.heads;
  if (heads === null) {
    heads = state.heads = new WeakMap();
  }
  if (!heads.has(chunk)) {
    const fact = createConstructionFact<Listener>();
    settleConstructionFact(fact, CONSTRUCTION_INSTALLED, value);
    heads.set(chunk, fact);
  }
}

export function getConstructionHead<Listener>(
  state: null | ConstructionState<Listener>,
  chunk: Object,
): void | ConstructionFact<Listener> {
  if (state === null || state.heads === null) {
    return undefined;
  }
  return state.heads.get(chunk);
}

export function readConstructionContents<Listener>(
  state: ConstructionState<Listener>,
  root: any,
  isBoundary: any => boolean,
): null | Array<ConstructionFact<Listener>> {
  if (state.unfinished === 0) {
    return null;
  }
  const todo: Array<any> = [root];
  const seen = new Set<Object>();
  let pending: null | Array<ConstructionFact<Listener>> = null;
  for (let i = 0; i < todo.length; i++) {
    const value = todo[i];
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      seen.has(value) ||
      isBoundary(value)
    ) {
      continue;
    }
    seen.add(value);
    if (value instanceof Set) {
      const iterator = value.values();
      let entry = iterator.next();
      while (!entry.done) {
        todo.push(entry.value);
        entry = iterator.next();
      }
    } else if (value instanceof Map) {
      const iterator = value.entries();
      let entry = iterator.next();
      while (!entry.done) {
        todo.push(entry.value[0], entry.value[1]);
        entry = iterator.next();
      }
    } else if (isArray(value) || getPrototypeOf(value) === ObjectPrototype) {
      const keys = Object.keys(value);
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const fact = getPendingConstructionField(state, value, key);
        if (fact === undefined) {
          const field = Object.getOwnPropertyDescriptor(value, key);
          if (field !== undefined && hasOwnProperty.call(field, 'value')) {
            todo.push(field.value);
          }
        } else {
          if (pending === null) {
            pending = [];
          }
          pending.push(fact);
        }
      }
    }
  }
  return pending;
}
