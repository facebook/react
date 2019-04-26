// @flow

declare module 'events' {
  declare class EventEmitter {
    addListener: (type: string, fn: Function) => void;
    emit: (type: string, data: any) => void;
    removeListener: (type: string, fn: Function) => void;
    removeAllListeners: (type?: string) => void;
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
