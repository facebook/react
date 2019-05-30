// @flow

import EventEmitter from 'events';

import type { Wall } from './types';

const BATCH_DURATION = 100;

type Message = {|
  event: string,
  payload: any,
|};

export default class Bridge extends EventEmitter {
  _isShutdown: boolean = false;
  _messageQueue: Array<any> = [];
  _timeoutID: TimeoutID | null = null;
  _wall: Wall;
  _wallUnlisten: Function | null = null;

  constructor(wall: Wall) {
    super();

    this._wall = wall;

    this._wallUnlisten =
      wall.listen((message: Message) => {
        this.emit(message.event, message.payload);
      }) || null;
  }

  send(event: string, payload: any, transferable?: Array<any>) {
    if (this._isShutdown) {
      console.warn(
        `Cannot send message "${event}" through a Bridge that has been shutdown.`
      );
      return;
    }

    // When we receive a message:
    // - we add it to our queue of messages to be sent
    // - if there hasn't been a message recently, we set a timer for 0 ms in
    //   the future, allowing all messages created in the same tick to be sent
    //   together
    // - if there *has* been a message flushed in the last BATCH_DURATION ms
    //   (or we're waiting for our setTimeout-0 to fire), then _timeoutID will
    //   be set, and we'll simply add to the queue and wait for that
    this._messageQueue.push(event, payload, transferable);
    if (!this._timeoutID) {
      this._timeoutID = setTimeout(this._flush, 0);
    }
  }

  shutdown() {
    if (this._isShutdown) {
      console.warn('Bridge was already shutdown.');
      return;
    }

    // Queue the shutdown outgoing message for subscribers.
    this.send('shutdown');

    // Mark this bridge as destroyed, i.e. disable its public API.
    this._isShutdown = true;

    // Disable the API inherited from EventEmitter that can add more listeners and send more messages.
    this.addListener = function() {};
    this.emit = function() {};
    // NOTE: There's also EventEmitter API like `on` and `prependListener` that we didn't add to our Flow type of EventEmitter.

    // Unsubscribe this bridge incoming message listeners to be sure, and so they don't have to do that.
    this.removeAllListeners();

    // Stop accepting and emitting incoming messages from the wall.
    const wallUnlisten = this._wallUnlisten;
    if (wallUnlisten) {
      wallUnlisten();
    }

    // Synchronously flush all queued outgoing messages.
    // At this step the subscribers' code may run in this call stack.
    do {
      this._flush();
    } while (this._messageQueue.length);

    // Make sure once again that there is no dangling timer.
    clearTimeout(this._timeoutID);
    this._timeoutID = null;
  }

  _flush = () => {
    // This method is used after the bridge is marked as destroyed in shutdown sequence,
    // so we do not bail out if the bridge marked as destroyed.
    // It is a private method that the bridge ensures is only called at the right times.

    clearTimeout(this._timeoutID);
    this._timeoutID = null;

    if (this._messageQueue.length) {
      for (let i = 0; i < this._messageQueue.length; i += 3) {
        this._wall.send(
          this._messageQueue[i],
          this._messageQueue[i + 1],
          this._messageQueue[i + 2]
        );
      }
      this._messageQueue.length = 0;

      // Check again for queued messages in BATCH_DURATION ms. This will keep
      // flushing in a loop as long as messages continue to be added. Once no
      // more are, the timer expires.
      this._timeoutID = setTimeout(this._flush, BATCH_DURATION);
    }
  };
}
