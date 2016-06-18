import {Injectable, NgZone} from '@angular/core';

import {isPresent, StringWrapper,} from '../../facade/lang';
import {StringMapWrapper, ListWrapper} from '../../facade/collection';

import {getDOM} from '../dom_adapter';
import {EventManagerPlugin} from './event_manager';


var modifierKeys = ['alt', 'control', 'meta', 'shift'];
var modifierKeyGetters: {[key: string]: (event: KeyboardEvent) => boolean} = {
  'alt': (event: KeyboardEvent) => event.altKey,
  'control': (event: KeyboardEvent) => event.ctrlKey,
  'meta': (event: KeyboardEvent) => event.metaKey,
  'shift': (event: KeyboardEvent) => event.shiftKey
};

@Injectable()
export class KeyEventsPlugin extends EventManagerPlugin {
  constructor() { super(); }

  supports(eventName: string): boolean {
    return isPresent(KeyEventsPlugin.parseEventName(eventName));
  }

  addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
    var parsedEvent = KeyEventsPlugin.parseEventName(eventName);

    var outsideHandler = KeyEventsPlugin.eventCallback(
        element, StringMapWrapper.get(parsedEvent, 'fullKey'), handler, this.manager.getZone());

    return this.manager.getZone().runOutsideAngular(() => {
      return getDOM().onAndCancel(
          element, StringMapWrapper.get(parsedEvent, 'domEventName'), outsideHandler);
    });
  }

  static parseEventName(eventName: string): {[key: string]: string} {
    var parts: string[] = eventName.toLowerCase().split('.');

    var domEventName = parts.shift();
    if ((parts.length === 0) ||
        !(StringWrapper.equals(domEventName, 'keydown') ||
          StringWrapper.equals(domEventName, 'keyup'))) {
      return null;
    }

    var key = KeyEventsPlugin._normalizeKey(parts.pop());

    var fullKey = '';
    modifierKeys.forEach(modifierName => {
      if (ListWrapper.contains(parts, modifierName)) {
        ListWrapper.remove(parts, modifierName);
        fullKey += modifierName + '.';
      }
    });
    fullKey += key;

    if (parts.length != 0 || key.length === 0) {
      // returning null instead of throwing to let another plugin process the event
      return null;
    }
    var result = StringMapWrapper.create();
    StringMapWrapper.set(result, 'domEventName', domEventName);
    StringMapWrapper.set(result, 'fullKey', fullKey);
    return result;
  }

  static getEventFullKey(event: KeyboardEvent): string {
    var fullKey = '';
    var key = getDOM().getEventKey(event);
    key = key.toLowerCase();
    if (StringWrapper.equals(key, ' ')) {
      key = 'space';  // for readability
    } else if (StringWrapper.equals(key, '.')) {
      key = 'dot';  // because '.' is used as a separator in event names
    }
    modifierKeys.forEach(modifierName => {
      if (modifierName != key) {
        var modifierGetter = StringMapWrapper.get(modifierKeyGetters, modifierName);
        if (modifierGetter(event)) {
          fullKey += modifierName + '.';
        }
      }
    });
    fullKey += key;
    return fullKey;
  }

  static eventCallback(element: HTMLElement, fullKey: any, handler: Function, zone: NgZone):
      Function {
    return (event: any /** TODO #9100 */) => {
      if (StringWrapper.equals(KeyEventsPlugin.getEventFullKey(event), fullKey)) {
        zone.runGuarded(() => handler(event));
      }
    };
  }

  /** @internal */
  static _normalizeKey(keyName: string): string {
    // TODO: switch to a StringMap if the mapping grows too much
    switch (keyName) {
      case 'esc':
        return 'escape';
      default:
        return keyName;
    }
  }
}
