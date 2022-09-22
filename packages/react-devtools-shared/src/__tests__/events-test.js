/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('events', () => {
  let dispatcher;

  beforeEach(() => {
    const EventEmitter = require('../events').default;

    dispatcher = new EventEmitter();
  });

  // @reactVersion >=16
  it('can dispatch an event with no listeners', () => {
    dispatcher.emit('event', 123);
  });

  // @reactVersion >=16
  it('handles a listener being attached multiple times', () => {
    const callback = jest.fn();

    dispatcher.addListener('event', callback);
    dispatcher.addListener('event', callback);

    dispatcher.emit('event', 123);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(123);
  });

  // @reactVersion >=16
  it('notifies all attached listeners of events', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();

    dispatcher.addListener('event', callback1);
    dispatcher.addListener('event', callback2);
    dispatcher.addListener('other-event', callback3);
    dispatcher.emit('event', 123);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith(123);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(123);
    expect(callback3).not.toHaveBeenCalled();
  });

  // @reactVersion >= 16.0
  it('calls later listeners before re-throwing if an earlier one throws', () => {
    const callbackThatThrows = jest.fn(() => {
      throw Error('expected');
    });
    const callback = jest.fn();

    dispatcher.addListener('event', callbackThatThrows);
    dispatcher.addListener('event', callback);

    expect(() => {
      dispatcher.emit('event', 123);
    }).toThrow('expected');

    expect(callbackThatThrows).toHaveBeenCalledTimes(1);
    expect(callbackThatThrows).toHaveBeenCalledWith(123);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(123);
  });

  // @reactVersion >= 16.0
  it('removes attached listeners', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    dispatcher.addListener('event', callback1);
    dispatcher.addListener('other-event', callback2);
    dispatcher.removeListener('event', callback1);
    dispatcher.emit('event', 123);
    expect(callback1).not.toHaveBeenCalled();
    dispatcher.emit('other-event', 123);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(123);
  });

  // @reactVersion >= 16.0
  it('removes all listeners', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();

    dispatcher.addListener('event', callback1);
    dispatcher.addListener('event', callback2);
    dispatcher.addListener('other-event', callback3);
    dispatcher.removeAllListeners();
    dispatcher.emit('event', 123);
    dispatcher.emit('other-event', 123);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
    expect(callback3).not.toHaveBeenCalled();
  });

  // @reactVersion >= 16.0
  it('should call the initial listeners even if others are added or removed during a dispatch', () => {
    const callback1 = jest.fn(() => {
      dispatcher.removeListener('event', callback2);
      dispatcher.addListener('event', callback3);
    });
    const callback2 = jest.fn();
    const callback3 = jest.fn();

    dispatcher.addListener('event', callback1);
    dispatcher.addListener('event', callback2);

    dispatcher.emit('event', 123);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith(123);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(123);
    expect(callback3).not.toHaveBeenCalled();

    dispatcher.emit('event', 456);
    expect(callback1).toHaveBeenCalledTimes(2);
    expect(callback1).toHaveBeenCalledWith(456);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledWith(456);
  });
});
