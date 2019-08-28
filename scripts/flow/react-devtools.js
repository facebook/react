/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare module 'events' {
  declare class EventEmitter<Events: Object> {
    addListener<Event: $Keys<Events>>(
      event: Event,
      listener: (...$ElementType<Events, Event>) => any,
    ): void;
    emit: <Event: $Keys<Events>>(
      event: Event,
      ...$ElementType<Events, Event>
    ) => void;
    removeListener(event: $Keys<Events>, listener: Function): void;
    removeAllListeners(event?: $Keys<Events>): void;
  }

  declare export default typeof EventEmitter;
}
