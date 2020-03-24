/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default class EventEmitter<Events: Object> {
  listenersMap: Map<string, Set<Function>> = new Map();

  addListener<Event: $Keys<Events>>(
    event: Event,
    listener: (...$ElementType<Events, Event>) => any,
  ): void {
    let listeners = this.listenersMap.get(event);
    if (listeners === undefined) {
      listeners = new Set();

      this.listenersMap.set(event, listeners);
    }

    listeners.add(listener);
  }

  emit<Event: $Keys<Events>>(
    event: Event,
    ...args: $ElementType<Events, Event>
  ): void {
    const listeners = this.listenersMap.get(event);
    if (listeners !== undefined) {
      let didThrow = false;
      let caughtError = null;

      listeners.forEach(listener => {
        try {
          listener.apply(null, args);
        } catch (error) {
          if (caughtError === null) {
            didThrow = true;
            caughtError = error;
          }
        }
      });

      if (didThrow) {
        throw caughtError;
      }
    }
  }

  removeAllListeners(event?: $Keys<Events>): void {
    if (event != null) {
      this.listenersMap.delete(event);
    } else {
      this.listenersMap.clear();
    }
  }

  removeListener(event: $Keys<Events>, listener: Function): void {
    const listeners = this.listenersMap.get(event);
    if (listeners !== undefined) {
      listeners.delete(listener);
    }
  }
}
