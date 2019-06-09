// @flow

declare module 'events' {
  declare class EventEmitter<Events: Object> {
    addListener<Event: $Keys<Events>>(
      event: Event,
      listener: (...$ElementType<Events, Event>) => any
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

declare var __DEV__: boolean;

declare var jasmine: {|
  getEnv: () => {|
    afterEach: (callback: Function) => void,
    beforeEach: (callback: Function) => void,
  |},
|};
