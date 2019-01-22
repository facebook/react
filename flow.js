// @flow

declare module 'events' {
  declare class EventEmitter {
    addListener: (type: string, fn: Function) => void;
    emit: (type: string, data: any) => void;
    removeListener: (type: string, fn: Function) => void;
  }

  declare export default typeof EventEmitter;
}
