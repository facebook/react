import {Inject, Injectable, OpaqueToken} from '@angular/core';

import {BaseException} from '../../facade/exceptions';
import {isPresent} from '../../facade/lang';

import {HammerGesturesPluginCommon} from './hammer_common';

export const HAMMER_GESTURE_CONFIG: OpaqueToken = new OpaqueToken('HammerGestureConfig');

export interface HammerInstance {
  on(eventName: string, callback: Function): void;
  off(eventName: string, callback: Function): void;
}

@Injectable()
export class HammerGestureConfig {
  events: string[] = [];

  overrides: {[key: string]: Object} = {};

  buildHammer(element: HTMLElement): HammerInstance {
    var mc = new Hammer(element);

    mc.get('pinch').set({enable: true});
    mc.get('rotate').set({enable: true});

    for (let eventName in this.overrides) {
      mc.get(eventName).set(this.overrides[eventName]);
    }

    return mc;
  }
}

@Injectable()
export class HammerGesturesPlugin extends HammerGesturesPluginCommon {
  constructor(@Inject(HAMMER_GESTURE_CONFIG) private _config: HammerGestureConfig) { super(); }

  supports(eventName: string): boolean {
    if (!super.supports(eventName) && !this.isCustomEvent(eventName)) return false;

    if (!isPresent((window as any /** TODO #???? */)['Hammer'])) {
      throw new BaseException(`Hammer.js is not loaded, can not bind ${eventName} event`);
    }

    return true;
  }

  addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
    var zone = this.manager.getZone();
    eventName = eventName.toLowerCase();

    return zone.runOutsideAngular(() => {
      // Creating the manager bind events, must be done outside of angular
      var mc = this._config.buildHammer(element);
      var callback = function(eventObj: any /** TODO #???? */) {
        zone.runGuarded(function() { handler(eventObj); });
      };
      mc.on(eventName, callback);
      return () => { mc.off(eventName, callback); };
    });
  }

  isCustomEvent(eventName: string): boolean { return this._config.events.indexOf(eventName) > -1; }
}
