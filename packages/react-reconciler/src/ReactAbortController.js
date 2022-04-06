/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableCache} from 'shared/ReactFeatureFlags';

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

const signals: Map<
  AbortControllerShim,
  AbortSignalShim,
> = (new PossiblyWeakMap(): any);

const abortedFlags: Map<
  AbortSignalShim,
  boolean,
> = (new PossiblyWeakMap(): any);

type Listener = {
  listener: any => void,
  next: Listener | null,
};

const listenersMap: Map<
  AbortSignalShim,
  Map<string, Listener>,
> = (new PossiblyWeakMap(): any);

function getListeners(target): Map<string, Listener> {
  const listeners = listenersMap.get(target);
  if (listeners == null) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'Listeners should already be registered. This is a bug in React.',
    );
  }
  return listeners;
}

class AbortSignalShim {
  constructor() {
    listenersMap.set(this, new Map());
  }
  get aborted() {
    return !!abortedFlags.get(this);
  }

  addEventListener(type, listener) {
    const listeners = getListeners(this);
    let node = listeners.get(type);

    const newNode = {listener, next: null};
    if (node === undefined) {
      listeners.set(type, newNode);
      return;
    }

    let prev = null;
    while (node != null) {
      prev = node;
      node = node.next;
    }
    if (prev != null) {
      prev.next = newNode;
    }
  }

  removeEventListener(eventName, listener) {
    const listeners = getListeners(this);
    let node = listeners.get(eventName);

    let prev = null;
    while (node != null) {
      if (node.listener === listener) {
        if (prev !== null) {
          prev.next = node.next;
        } else if (node.next !== null) {
          listeners.set(eventName, node.next);
        } else {
          listeners.delete(eventName);
        }
        return;
      }

      prev = node;
      node = node.next;
    }
  }

  dispatchEvent(event) {
    const listeners = getListeners(this);
    let node = listeners.get(event.type);
    while (node != null) {
      node.listener(event);
      node = node.next;
    }
  }
}

class AbortControllerShim {
  constructor() {
    const signal = new AbortSignalShim();
    abortedFlags.set(signal, false);
    signals.set(this, signal);
  }

  get signal() {
    return signals.get(this);
  }

  abort() {
    const signal = signals.get(this);
    if (signal == null) {
      // eslint-disable-next-line react-internal/prod-error-codes
      throw new Error(
        'Aborted signal was not registered. This is a bug in React.',
      );
    }
    if (abortedFlags.get(signal) !== false) {
      return;
    }
    abortedFlags.set(signal, true);
    signal.dispatchEvent({type: 'abort'});
  }
}

// In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.
export default enableCache
  ? typeof AbortController !== 'undefined'
    ? AbortController
    : (AbortControllerShim: AbortController)
  : (null: any);
