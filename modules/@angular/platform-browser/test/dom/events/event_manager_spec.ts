import {describe, ddescribe, it, iit, xit, xdescribe, expect, beforeEach,} from '@angular/core/testing/testing_internal';
import {DomEventsPlugin} from '@angular/platform-browser/src/dom/events/dom_events';
import {NgZone} from '@angular/core/src/zone/ng_zone';
import {ListWrapper, Map} from '../../../src/facade/collection';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {EventManager, EventManagerPlugin} from '@angular/platform-browser/src/dom/events/event_manager';
import {el} from '../../../testing/browser_util';

export function main() {
  var domEventPlugin: any /** TODO #9100 */;

  describe('EventManager', () => {

    beforeEach(() => { domEventPlugin = new DomEventsPlugin(); });

    it('should delegate event bindings to plugins that are passed in from the most generic one to the most specific one',
       () => {
         var element = el('<div></div>');
         var handler = (e: any /** TODO #9100 */) => e;
         var plugin = new FakeEventManagerPlugin(['click']);
         var manager = new EventManager([domEventPlugin, plugin], new FakeNgZone());
         manager.addEventListener(element, 'click', handler);
         expect(plugin._eventHandler.get('click')).toBe(handler);
       });

    it('should delegate event bindings to the first plugin supporting the event', () => {
      var element = el('<div></div>');
      var clickHandler = (e: any /** TODO #9100 */) => e;
      var dblClickHandler = (e: any /** TODO #9100 */) => e;
      var plugin1 = new FakeEventManagerPlugin(['dblclick']);
      var plugin2 = new FakeEventManagerPlugin(['click', 'dblclick']);
      var manager = new EventManager([plugin2, plugin1], new FakeNgZone());
      manager.addEventListener(element, 'click', clickHandler);
      manager.addEventListener(element, 'dblclick', dblClickHandler);
      expect(plugin1._eventHandler.has('click')).toBe(false);
      expect(plugin2._eventHandler.get('click')).toBe(clickHandler);
      expect(plugin2._eventHandler.has('dblclick')).toBe(false);
      expect(plugin1._eventHandler.get('dblclick')).toBe(dblClickHandler);
    });

    it('should throw when no plugin can handle the event', () => {
      var element = el('<div></div>');
      var plugin = new FakeEventManagerPlugin(['dblclick']);
      var manager = new EventManager([plugin], new FakeNgZone());
      expect(() => manager.addEventListener(element, 'click', null))
          .toThrowError('No event manager plugin found for event click');
    });

    it('events are caught when fired from a child', () => {
      var element = el('<div><div></div></div>');
      // Workaround for https://bugs.webkit.org/show_bug.cgi?id=122755
      getDOM().appendChild(getDOM().defaultDoc().body, element);

      var child = getDOM().firstChild(element);
      var dispatchedEvent = getDOM().createMouseEvent('click');
      var receivedEvent: any /** TODO #9100 */ = null;
      var handler = (e: any /** TODO #9100 */) => { receivedEvent = e; };
      var manager = new EventManager([domEventPlugin], new FakeNgZone());
      manager.addEventListener(element, 'click', handler);
      getDOM().dispatchEvent(child, dispatchedEvent);

      expect(receivedEvent).toBe(dispatchedEvent);
    });

    it('should add and remove global event listeners', () => {
      var element = el('<div><div></div></div>');
      getDOM().appendChild(getDOM().defaultDoc().body, element);
      var dispatchedEvent = getDOM().createMouseEvent('click');
      var receivedEvent: any /** TODO #9100 */ = null;
      var handler = (e: any /** TODO #9100 */) => { receivedEvent = e; };
      var manager = new EventManager([domEventPlugin], new FakeNgZone());

      var remover = manager.addGlobalEventListener('document', 'click', handler);
      getDOM().dispatchEvent(element, dispatchedEvent);
      expect(receivedEvent).toBe(dispatchedEvent);

      receivedEvent = null;
      remover();
      getDOM().dispatchEvent(element, dispatchedEvent);
      expect(receivedEvent).toBe(null);
    });
  });
}

class FakeEventManagerPlugin extends EventManagerPlugin {
  _eventHandler = new Map<string, Function>();
  constructor(public _supports: string[]) { super(); }

  supports(eventName: string): boolean { return ListWrapper.contains(this._supports, eventName); }

  addEventListener(element: any /** TODO #9100 */, eventName: string, handler: Function) {
    this._eventHandler.set(eventName, handler);
    return () => { this._eventHandler.delete(eventName); };
  }
}

class FakeNgZone extends NgZone {
  constructor() { super({enableLongStackTrace: false}); }
  run(fn: any /** TODO #9100 */) { fn(); }

  runOutsideAngular(fn: any /** TODO #9100 */) { return fn(); }
}
