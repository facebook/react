import {Inject, Injectable, NgZone, OpaqueToken} from '@angular/core';

import {ListWrapper} from '../../facade/collection';
import {BaseException} from '../../facade/exceptions';


export const EVENT_MANAGER_PLUGINS: OpaqueToken = new OpaqueToken('EventManagerPlugins');

@Injectable()
export class EventManager {
  private _plugins: EventManagerPlugin[];

  constructor(@Inject(EVENT_MANAGER_PLUGINS) plugins: EventManagerPlugin[], private _zone: NgZone) {
    plugins.forEach(p => p.manager = this);
    this._plugins = ListWrapper.reversed(plugins);
  }

  addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
    var plugin = this._findPluginFor(eventName);
    return plugin.addEventListener(element, eventName, handler);
  }

  addGlobalEventListener(target: string, eventName: string, handler: Function): Function {
    var plugin = this._findPluginFor(eventName);
    return plugin.addGlobalEventListener(target, eventName, handler);
  }

  getZone(): NgZone { return this._zone; }

  /** @internal */
  _findPluginFor(eventName: string): EventManagerPlugin {
    var plugins = this._plugins;
    for (var i = 0; i < plugins.length; i++) {
      var plugin = plugins[i];
      if (plugin.supports(eventName)) {
        return plugin;
      }
    }
    throw new BaseException(`No event manager plugin found for event ${eventName}`);
  }
}

export class EventManagerPlugin {
  manager: EventManager;

  // That is equivalent to having supporting $event.target
  supports(eventName: string): boolean { return false; }

  addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
    throw 'not implemented';
  }

  addGlobalEventListener(element: string, eventName: string, handler: Function): Function {
    throw 'not implemented';
  }
}
