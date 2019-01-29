// @flow

import EventEmitter from 'events';

import type { Wall } from './types';

const BATCH_DURATION = 100;

type Message = {|
  event: string,
  payload: any,
|};

export default class Bridge extends EventEmitter {
  _messageQueue: Array<any> = [];
  _time: number | null = null;
  _timeoutID: TimeoutID | null = null;

  wall: Wall;

  constructor(wall: Wall) {
    super();

    this.wall = wall;

    wall.listen((message: Message) => {
      this._emit(message);
    });
  }

  send(event: string, payload: any, transferable?: Array<any>) {
    const time = this._time;

    if (time === null) {
      this.wall.send(event, payload, transferable);
      this._time = Date.now();
    } else {
      this._messageQueue.push(event, payload, transferable);

      const now = Date.now();
      if (now - time > BATCH_DURATION) {
        this._flush();
      } else {
        this._timeoutID = setTimeout(() => this._flush(), BATCH_DURATION);
      }
    }
  }

  log(message: string): void {
    this.send('log', message);
  }

  _flush() {
    while (this._messageQueue.length) {
      this.wall.send.apply(this.wall, this._messageQueue.splice(0, 3));
    }

    if (this._timeoutID !== null) {
      clearTimeout(this._timeoutID);
      this._timeoutID = null;
    }

    this._messageQueue = [];
    this._time = null;
  }

  _emit(message: string | Message) {
    if (typeof message === 'string') {
      this.emit(message);
    } else {
      this.emit(message.event, message.payload);
    }
  }
}
