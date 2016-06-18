import {NgZone} from '@angular/core/src/zone/ng_zone';
import {expect} from '@angular/core/testing';
import {UiArguments} from '@angular/platform-browser/src/web_workers/shared/client_message_broker';
import {ClientMessageBroker, ClientMessageBrokerFactory_} from '@angular/platform-browser/src/web_workers/shared/client_message_broker';
import {MessageBus, MessageBusSink, MessageBusSource} from '@angular/platform-browser/src/web_workers/shared/message_bus';

import {PromiseWrapper} from '../../../src/facade/async';
import {ListWrapper, StringMapWrapper} from '../../../src/facade/collection';
import {BaseException, WrappedException} from '../../../src/facade/exceptions';
import {Type, isPresent} from '../../../src/facade/lang';
import {SpyMessageBroker} from '../worker/spies';

import {MockEventEmitter} from './mock_event_emitter';

var __unused: Promise<any>;  // avoid unused import when Promise union types are erased

/**
 * Returns two MessageBus instances that are attached to each other.
 * Such that whatever goes into one's sink comes out the others source.
 */
export function createPairedMessageBuses(): PairedMessageBuses {
  var firstChannels: {[key: string]: MockEventEmitter<any>} = {};
  var workerMessageBusSink = new MockMessageBusSink(firstChannels);
  var uiMessageBusSource = new MockMessageBusSource(firstChannels);

  var secondChannels: {[key: string]: MockEventEmitter<any>} = {};
  var uiMessageBusSink = new MockMessageBusSink(secondChannels);
  var workerMessageBusSource = new MockMessageBusSource(secondChannels);

  return new PairedMessageBuses(
      new MockMessageBus(uiMessageBusSink, uiMessageBusSource),
      new MockMessageBus(workerMessageBusSink, workerMessageBusSource));
}

/**
 * Spies on the given {@link SpyMessageBroker} and expects a call with the given methodName
 * andvalues.
 * If a handler is provided it will be called to handle the request.
 * Only intended to be called on a given broker instance once.
 */
export function expectBrokerCall(
    broker: SpyMessageBroker, methodName: string, vals?: Array<any>,
    handler?: (..._: any[]) => Promise<any>| void): void {
  broker.spy('runOnService').andCallFake((args: UiArguments, returnType: Type) => {
    expect(args.method).toEqual(methodName);
    if (isPresent(vals)) {
      expect(args.args.length).toEqual(vals.length);
      ListWrapper.forEachWithIndex(vals, (v, i) => {expect(v).toEqual(args.args[i].value)});
    }
    var promise: any /** TODO #9100 */ = null;
    if (isPresent(handler)) {
      let givenValues = args.args.map((arg) => {arg.value});
      if (givenValues.length > 0) {
        promise = handler(givenValues);
      } else {
        promise = handler();
      }
    }
    if (promise == null) {
      promise = PromiseWrapper.wrap(() => {});
    }
    return promise;
  });
}

export class PairedMessageBuses {
  constructor(public ui: MessageBus, public worker: MessageBus) {}
}

export class MockMessageBusSource implements MessageBusSource {
  constructor(private _channels: {[key: string]: MockEventEmitter<any>}) {}

  initChannel(channel: string, runInZone = true) {
    if (!StringMapWrapper.contains(this._channels, channel)) {
      this._channels[channel] = new MockEventEmitter();
    }
  }

  from(channel: string): MockEventEmitter<any> {
    if (!StringMapWrapper.contains(this._channels, channel)) {
      throw new BaseException(`${channel} is not set up. Did you forget to call initChannel?`);
    }
    return this._channels[channel];
  }

  attachToZone(zone: NgZone) {}
}

export class MockMessageBusSink implements MessageBusSink {
  constructor(private _channels: {[key: string]: MockEventEmitter<any>}) {}

  initChannel(channel: string, runInZone = true) {
    if (!StringMapWrapper.contains(this._channels, channel)) {
      this._channels[channel] = new MockEventEmitter();
    }
  }

  to(channel: string): MockEventEmitter<any> {
    if (!StringMapWrapper.contains(this._channels, channel)) {
      this._channels[channel] = new MockEventEmitter();
    }
    return this._channels[channel];
  }

  attachToZone(zone: NgZone) {}
}

/**
 * Mock implementation of the {@link MessageBus} for tests.
 * Runs syncronously, and does not support running within the zone.
 */
export class MockMessageBus extends MessageBus {
  constructor(public sink: MockMessageBusSink, public source: MockMessageBusSource) { super(); }

  initChannel(channel: string, runInZone = true) {
    this.sink.initChannel(channel, runInZone);
    this.source.initChannel(channel, runInZone);
  }

  to(channel: string): MockEventEmitter<any> { return this.sink.to(channel); }

  from(channel: string): MockEventEmitter<any> { return this.source.from(channel); }

  attachToZone(zone: NgZone) {}
}

export class MockMessageBrokerFactory extends ClientMessageBrokerFactory_ {
  constructor(private _messageBroker: ClientMessageBroker) { super(null, null); }
  createMessageBroker(channel: string, runInZone = true) { return this._messageBroker; }
}
