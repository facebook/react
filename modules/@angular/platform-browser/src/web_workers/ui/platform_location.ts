import {UrlChangeListener} from '@angular/common';
import {Injectable} from '@angular/core';

import {BrowserPlatformLocation} from '../../browser/location/browser_platform_location';
import {EventEmitter, ObservableWrapper, PromiseWrapper} from '../../facade/async';
import {FunctionWrapper} from '../../facade/lang';
import {MessageBus} from '../shared/message_bus';
import {ROUTER_CHANNEL} from '../shared/messaging_api';
import {LocationType} from '../shared/serialized_types';
import {PRIMITIVE, Serializer} from '../shared/serializer';
import {ServiceMessageBroker, ServiceMessageBrokerFactory} from '../shared/service_message_broker';

@Injectable()
export class MessageBasedPlatformLocation {
  private _channelSink: EventEmitter<Object>;
  private _broker: ServiceMessageBroker;

  constructor(
      private _brokerFactory: ServiceMessageBrokerFactory,
      private _platformLocation: BrowserPlatformLocation, bus: MessageBus,
      private _serializer: Serializer) {
    this._platformLocation.onPopState(
        <UrlChangeListener>FunctionWrapper.bind(this._sendUrlChangeEvent, this));
    this._platformLocation.onHashChange(
        <UrlChangeListener>FunctionWrapper.bind(this._sendUrlChangeEvent, this));
    this._broker = this._brokerFactory.createMessageBroker(ROUTER_CHANNEL);
    this._channelSink = bus.to(ROUTER_CHANNEL);
  }

  start(): void {
    this._broker.registerMethod(
        'getLocation', null, FunctionWrapper.bind(this._getLocation, this), LocationType);
    this._broker.registerMethod(
        'setPathname', [PRIMITIVE], FunctionWrapper.bind(this._setPathname, this));
    this._broker.registerMethod(
        'pushState', [PRIMITIVE, PRIMITIVE, PRIMITIVE],
        FunctionWrapper.bind(this._platformLocation.pushState, this._platformLocation));
    this._broker.registerMethod(
        'replaceState', [PRIMITIVE, PRIMITIVE, PRIMITIVE],
        FunctionWrapper.bind(this._platformLocation.replaceState, this._platformLocation));
    this._broker.registerMethod(
        'forward', null,
        FunctionWrapper.bind(this._platformLocation.forward, this._platformLocation));
    this._broker.registerMethod(
        'back', null, FunctionWrapper.bind(this._platformLocation.back, this._platformLocation));
  }

  private _getLocation(): Promise<Location> {
    return PromiseWrapper.resolve(this._platformLocation.location);
  }


  private _sendUrlChangeEvent(e: Event): void {
    let loc = this._serializer.serialize(this._platformLocation.location, LocationType);
    let serializedEvent = {'type': e.type};
    ObservableWrapper.callEmit(this._channelSink, {'event': serializedEvent, 'location': loc});
  }

  private _setPathname(pathname: string): void { this._platformLocation.pathname = pathname; }
}
