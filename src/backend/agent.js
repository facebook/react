// @flow

import nullthrows from 'nullthrows';
import EventEmitter from 'events';
import { guid } from './utils';
import { ElementTypeOtherOrUnknown } from 'src/devtools/types';

import type {
  Fiber,
  RendererData,
  RendererID,
  RendererInterface,
} from './types';
import type { Bridge } from '../types';
import type { Element } from 'src/devtools/types';

const debug = (methodName, ...args) => {
  //console.log(`%cAgent %c${methodName}`, 'color: blue; font-weight: bold;', 'font-weight: bold;', ...args);
};

const THROTTLE_BY_MS = 350;

export default class Agent extends EventEmitter {
  _fiberToID: WeakMap<Fiber, string> = new WeakMap();
  _idToElement: Map<string, Element> = new Map();
  _idToFiber: Map<string, Fiber> = new Map();
  _idToRendererData: Map<string, RendererData> = new Map();
  _idToRendererID: Map<string, RendererID> = new Map();
  _isRenderInProgress: boolean = false;
  _rendererInterfaces: { [key: RendererID]: RendererInterface } = {};
  _roots: Set<RendererID> = new Set();

  // Tree updates are debounced to reduce bridge traffic and improve performance.
  // This reduces the potential negative impact that DevTools has on React performance.
  // Eventual consistency is good enough for the Elements tree.
  _lastCrawlTime: number = -THROTTLE_BY_MS;
  _pendingRoots: Set<string> = new Set();
  _pendingRootTimeoutID: TimeoutID | null = null;

  addBridge(bridge: Bridge) {
    // TODO Listen to bridge for things like selection.
    // bridge.on('...'), this...);

    this.addListener('root', id => bridge.send('root', id));
    this.addListener('mount', data => bridge.send('mount', data));
    this.addListener('update', data => bridge.send('update', data));
    this.addListener('unmount', data => bridge.send('unmount', data));
    // TODO Add other methods for e.g. profiling.
  }

  setRendererInterface(
    rendererID: RendererID,
    rendererInterface: RendererInterface
  ) {
    this._rendererInterfaces[rendererID] = rendererInterface;
  }

  _getId(fiber: Fiber): string {
    if (typeof fiber !== 'object' || !fiber) {
      return fiber;
    }
    if (!this._fiberToID.has(fiber)) {
      this._fiberToID.set(fiber, guid());
      this._idToFiber.set(nullthrows(this._fiberToID.get(fiber)), fiber);
    }
    return nullthrows(this._fiberToID.get(fiber));
  }

  _crawl(parent: Element, id: string): void {
    const data: RendererData = ((this._idToRendererData.get(
      id
    ): any): RendererData);
    if (data.type === ElementTypeOtherOrUnknown) {
      data.children.forEach(childFiber => {
        if (childFiber !== null) {
          this._crawl(parent, this._getId(childFiber));
        }
      });
    } else {
      parent.children.push(id);

      this._createOrUpdateElement(id, data);
    }
  }

  _crawlPendingRoots(): void {
    this._pendingRoots.forEach(id => this._crawlRoot(id));
    this._pendingRoots.clear();
    this._lastCrawlTime = performance.now();
  }

  _crawlRoot(id: string): void {
    const data = ((this._idToRendererData.get(id): any): RendererData);

    // TODO: Can we use the effects list on update for a faster path?
    this._createOrUpdateElement(id, data);

    if (!this._roots.has(id)) {
      this._roots.add(id);
      debug('emit("root")', id);
      this.emit('root', id);
    }
  }

  _createOrUpdateElement(id: string, data: RendererData): void {
    const prevElement: ?Element = this._idToElement.get(id);
    const nextElement: Element = {
      id,
      key: data.key,
      displayName: data.displayName,
      children: [],
      type: data.type,
    };

    this._idToElement.set(id, nextElement);

    data.children.forEach(childFiber => {
      if (childFiber !== null) {
        this._crawl(nextElement, this._getId(childFiber));
      }
    });

    if (prevElement == null) {
      debug('emit("mount")', id, nextElement);
      this.emit('mount', nextElement);
    } else if (!areElementsEqual(prevElement, nextElement)) {
      debug('emit("update")', id, nextElement);
      this.emit('update', nextElement);
    }
  }

  _maybeCrawlRoot = () => {
    this._pendingRootTimeoutID = null;
    if (!this._isRenderInProgress) {
      this._crawlPendingRoots();
    }
  };

  onHookMount = ({
    data,
    fiber,
    renderer,
  }: {
    data: RendererData,
    fiber: Fiber,
    renderer: RendererID,
  }) => {
    const id = this._getId(fiber);

    this._idToRendererData.set(id, data);
    this._idToRendererID.set(id, renderer);
  };

  onHookRootCommitted = ({
    data,
    fiber,
    renderer,
  }: {
    data: RendererData,
    fiber: Fiber,
    renderer: RendererID,
  }) => {
    const id = this._getId(fiber);

    this._isRenderInProgress = false;
    this._pendingRoots.add(id);

    const delta = performance.now() - this._lastCrawlTime;
    if (delta >= THROTTLE_BY_MS) {
      this._crawlPendingRoots();
    } else if (this._pendingRootTimeoutID === null) {
      this._pendingRootTimeoutID = setTimeout(
        this._maybeCrawlRoot,
        THROTTLE_BY_MS - delta
      );
    }
  };

  onHookUnmount = ({ fiber }: { fiber: Fiber }) => {
    const id = this._getId(fiber);

    if (this._roots.has(id)) {
      this._roots.delete(id);
      this.emit('rootUnmounted', id);
    }

    if (this._idToElement.has(id)) {
      this._idToElement.delete(id);
      debug('emit("unmount")', id);
      this.emit('unmount', id);
    }

    this._fiberToID.delete(fiber);
    this._idToRendererData.delete(id);
    this._idToRendererID.delete(id);
  };

  onHookUpdate = ({ data, fiber }: { data: RendererData, fiber: Fiber }) => {
    const id = this._getId(fiber);

    this._isRenderInProgress = true;
    this._idToRendererData.set(id, data);
  };
}

function areElementsEqual(
  prevElement: ?Element,
  nextElement: ?Element
): boolean {
  if (!prevElement || !nextElement) {
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
    if (prevElement.children[i] !== nextElement.children[i]) {
      return false;
    }
  }

  return true;
}
