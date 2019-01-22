// @flow

import nullthrows from 'nullthrows';
import EventEmitter from 'events';
import {guid} from './utils';
import {ElementTypeOtherOrUnknown} from 'src/devtools/types';

import type {Fiber, RendererData, RendererID, RendererInterface} from './types';
import type {Bridge} from '../types';
import type {Element} from 'src/devtools/types';

export default class Agent extends EventEmitter {
  fiberToID: WeakMap<Fiber, string> = new WeakMap();
  idToElement: Map<string, Element> = new Map();
  idToFiber: Map<string, Fiber> = new Map();
  idToRendererData: Map<string, RendererData> = new Map();
  idToRendererID: Map<string, RendererID> = new Map();
  rendererInterfaces: {[key: RendererID]: RendererInterface} = {};
  roots: Set<RendererID> = new Set();

  addBridge(bridge: Bridge) {
    // TODO Listen to bridge for things like selection.
    // bridge.on('...'), this...);

    this.addListener('root', id => bridge.send('root', id));
    this.addListener('mount', data => bridge.send('mount', data));
    this.addListener('update', data => bridge.send('update', data));
    this.addListener('unmount', data => bridge.send('unmount', data));
    // TODO Add other methods for e.g. profiling.
  }

  setRendererInterface(rendererID: RendererID, rendererInterface: RendererInterface) {
    this.rendererInterfaces[rendererID] = rendererInterface;
  }

  _getId(fiber: Fiber): string {
    if (typeof fiber !== 'object' || !fiber) {
      return fiber;
    }
    if (!this.fiberToID.has(fiber)) {
      this.fiberToID.set(fiber, guid());
      this.idToFiber.set(
        nullthrows(this.fiberToID.get(fiber)),
        fiber
      );
    }
    return nullthrows(this.fiberToID.get(fiber));
  }

  _crawl(parent: Element, id: string): void {
    const data: RendererData = ((this.idToRendererData.get(id): any): RendererData);
    if (data.type === ElementTypeOtherOrUnknown) {
      data.children.forEach(childFiber => {
        if (childFiber !== null) {
          this._crawl(parent, this._getId(childFiber))
        }
      });
    } else {
      parent.children.push(id);

      this._createOrUpdateElement(id, data);
    }
  }

  _createOrUpdateElement(id: string, data: RendererData): void {
    const prevElement: ?Element = this.idToElement.get(id);
    const nextElement: Element = {
      id,
      key: data.key,
      displayName: data.displayName,
      children: [],
      type: data.type,
    };

    this.idToElement.set(id, nextElement);

    data.children.forEach(childFiber => {
      if (childFiber !== null) {
        this._crawl(nextElement, this._getId(childFiber))
      }
    });

    if (prevElement == null) {
console.log('%cAgent%c emit("mount")', 'color: blue; font-weight: bold;', 'font-weight: bold;', id, nextElement)
      this.emit('mount', nextElement);
    } else if (!areElementsEqual(prevElement, nextElement)) {
console.log('%cAgent%c emit("update")', 'color: blue; font-weight: bold;', 'font-weight: bold;', id, nextElement)
      this.emit('update', nextElement);
    }
  }

  onHookMount = ({data, fiber, renderer}: {data: RendererData, fiber: Fiber, renderer: RendererID}) => {
    const id = this._getId(fiber);

    this.idToRendererData.set(id, data);
    this.idToRendererID.set(id, renderer);
  };

  onHookRootCommitted = ({data, fiber, renderer}: {data: RendererData, fiber: Fiber, renderer: RendererID}) => {
    const id = this._getId(fiber);
console.log('%cAgent%c onHookRootCommitted()', 'color: blue; font-weight: bold;', 'font-weight: bold;', id);

    this._createOrUpdateElement(id, data);

    if (!this.roots.has(id)) {
      this.roots.add(id);

      this.emit('root', id);
    }
  };

  onHookUnmount = ({fiber}: {fiber: Fiber}) => {
    const id = this._getId(fiber);

    if (this.roots.has(id)) {
      this.roots.delete(id);
      this.emit('rootUnmounted', id);
    }

    if (this.idToElement.has(id)) {
      this.idToElement.delete(id);
console.log('%cAgent%c emit("unmount")', 'color: blue; font-weight: bold;', 'font-weight: bold;', id)
      this.emit('unmount', id);
    }

    this.fiberToID.delete(fiber);
    this.idToRendererData.delete(id);
    this.idToRendererID.delete(id);
  };

  onHookUpdate = ({data, fiber}: {data: RendererData, fiber: Fiber}) => {
    const id = this._getId(fiber);

    this.idToRendererData.set(id, data);
  };
}

function areElementsEqual(prevElement: ?Element, nextElement: ?Element): boolean {
  if (!prevElement  || !nextElement) {
    return false;
  }

  if (
    prevElement.key !== nextElement.key ||
    prevElement.displayName !== nextElement.displayName ||
    prevElement.children.length !== nextElement.children.length ||
    prevElement.type !== nextElement.type
  ) { 
    return false;
  }

  for (let i = 0; i < prevElement.children.length; i++) {
    if  (prevElement.children[i] !== nextElement.children[i])  {
      return false;
    }
  }

  return true;
}
