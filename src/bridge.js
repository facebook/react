// @flow

import EventEmitter from 'events';

import type {Wall} from './types';

const BATCH_DURATION = 100;

type Message = {|
  event: string,
  payload: any,
|};

export default class Bridge extends EventEmitter {
  _messageQueue: Array<Message> = [];
  _time: number | null = null;
  _timeoutID: TimeoutID | null = null;

  wall: Wall;

  constructor (wall: Wall) {
    super();

    this.wall = wall;
    wall.listen(messages => {
      if (Array.isArray(messages)) {
        messages.forEach(message => this._emit(message))
      } else {
        this._emit(messages)
      }
    })
  }

  /**
   * Send an event.
   *
   * @param {String} event
   * @param {*} payload
   */

  send (event: string, payload: any) {
    const time = this._time;

    if (time === null) {
      this.wall.send([{ event, payload }])
      this._time = Date.now()
    } else {
      this._messageQueue.push({
        event,
        payload
      })

      const now = Date.now()
      if (now - time > BATCH_DURATION) {
        this._flush()
      } else {
        this._timeoutID = setTimeout(() => this._flush(), BATCH_DURATION)
      }
    }
  }

  /**
   * Log a message to the devtools background page.
   *
   * @param {String} message
   */

  log (message: string): void {
    this.send('log', message)
  }

  _flush () {
    if (this._messageQueue.length) {
      this.wall.send(this._messageQueue)
    }
    if (this._timeoutID !== null) {
      clearTimeout(this._timeoutID)
      this._timeoutID = null;
    }
    this._messageQueue = []
    this._time = null
  }

  _emit (message: string | Message) {
    if (typeof message === 'string') {
      this.emit(message)
    } else {
      this.emit(message.event, message.payload)
    }
  }
}