import {PlatformLocation, UrlChangeListener} from '@angular/common';
import {Injectable} from '@angular/core';

import {EventEmitter, ObservableWrapper, PromiseWrapper} from '../../facade/async';
import {StringMapWrapper} from '../../facade/collection';
import {BaseException} from '../../facade/exceptions';
import {StringWrapper} from '../../facade/lang';
import {ClientMessageBroker, ClientMessageBrokerFactory, FnArg, UiArguments} from '../shared/client_message_broker';
import {MessageBus} from '../shared/message_bus';
import {ROUTER_CHANNEL} from '../shared/messaging_api';
import {LocationType} from '../shared/serialized_types';
import {PRIMITIVE, Serializer} from '../shared/serializer';

import {deserializeGenericEvent} from './event_deserializer';

@Injectable()
export class WebWorkerPlatformLocation extends PlatformLocation {
  private _broker: ClientMessageBroker;
  private _popStateListeners: Array<Function> = [];
  private _hashChangeListeners: Array<Function> = [];
  private _location: LocationType = null;
  private _channelSource: EventEmitter<Object>;

  constructor(
      brokerFactory: ClientMessageBrokerFactory, bus: MessageBus, private _serializer: Serializer) {
    super();
    this._broker = brokerFactory.createMessageBroker(ROUTER_CHANNEL);

    this._channelSource = bus.from(ROUTER_CHANNEL);
    ObservableWrapper.subscribe(this._channelSource, (msg: {[key: string]: any}) => {
      var listeners: Array<Function> = null;
      if (StringMapWrapper.contains(msg, 'event')) {
        let type: string = msg['event']['type'];
        if (StringWrapper.equals(type, 'popstate')) {
          listeners = this._popStateListeners;
        } else if (StringWrapper.equals(type, 'hashchange')) {
          listeners = this._hashChangeListeners;
        }

        if (listeners !== null) {
          let e = deserializeGenericEvent(msg['event']);
          // There was a popState or hashChange event, so the location object thas been updated
          this._location = this._serializer.deserialize(msg['location'], LocationType);
          listeners.forEach((fn: Function) => fn(e));
        }
      }
    });
  }

  /** @internal **/
  init(): Promise<boolean> {
    var args: UiArguments = new UiArguments('getLocation');

    var locationPromise: Promise<LocationType> = this._broker.runOnService(args, LocationType);
    return PromiseWrapper.then(
        locationPromise, (val: LocationType):
                             boolean => {
                               this._location = val;
                               return true;
                             },
        (err): boolean => { throw new BaseException(err); });
  }

  getBaseHrefFromDOM(): string {
    throw new BaseException(
        'Attempt to get base href from DOM from WebWorker. You must either provide a value for the APP_BASE_HREF token through DI or use the hash location strategy.');
  }

  onPopState(fn: UrlChangeListener): void { this._popStateListeners.push(fn); }

  onHashChange(fn: UrlChangeListener): void { this._hashChangeListeners.push(fn); }

  get pathname(): string {
    if (this._location === null) {
      return null;
    }

    return this._location.pathname;
  }

  get search(): string {
    if (this._location === null) {
      return null;
    }

    return this._location.search;
  }

  get hash(): string {
    if (this._location === null) {
      return null;
    }

    return this._location.hash;
  }

  set pathname(newPath: string) {
    if (this._location === null) {
      throw new BaseException('Attempt to set pathname before value is obtained from UI');
    }

    this._location.pathname = newPath;

    var fnArgs = [new FnArg(newPath, PRIMITIVE)];
    var args = new UiArguments('setPathname', fnArgs);
    this._broker.runOnService(args, null);
  }

  pushState(state: any, title: string, url: string): void {
    var fnArgs =
        [new FnArg(state, PRIMITIVE), new FnArg(title, PRIMITIVE), new FnArg(url, PRIMITIVE)];
    var args = new UiArguments('pushState', fnArgs);
    this._broker.runOnService(args, null);
  }

  replaceState(state: any, title: string, url: string): void {
    var fnArgs =
        [new FnArg(state, PRIMITIVE), new FnArg(title, PRIMITIVE), new FnArg(url, PRIMITIVE)];
    var args = new UiArguments('replaceState', fnArgs);
    this._broker.runOnService(args, null);
  }

  forward(): void {
    var args = new UiArguments('forward');
    this._broker.runOnService(args, null);
  }

  back(): void {
    var args = new UiArguments('back');
    this._broker.runOnService(args, null);
  }
}
