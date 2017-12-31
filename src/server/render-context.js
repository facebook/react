/* @flow */

import { isUndef } from 'shared/util'

type RenderState = {
  type: 'Element';
  rendered: number;
  total: number;
  endTag: string;
  children: Array<VNode>;
} | {
  type: 'Component';
  prevActive: Component;
} | {
  type: 'ComponentWithCache';
  buffer: Array<string>;
  bufferIndex: number;
  componentBuffer: Array<Set<Class<Component>>>;
  key: string;
};

export class RenderContext {
  userContext: ?Object;
  activeInstance: Component;
  renderStates: Array<RenderState>;
  write: (text: string, next: Function) => void;
  renderNode: (node: VNode, isRoot: boolean, context: RenderContext) => void;
  next: () => void;
  done: (err: ?Error) => void;

  modules: Array<(node: VNode) => ?string>;
  directives: Object;
  isUnaryTag: (tag: string) => boolean;

  cache: any;
  get: ?(key: string, cb: Function) => void;
  has: ?(key: string, cb: Function) => void;

  constructor (options: Object) {
    this.userContext = options.userContext
    this.activeInstance = options.activeInstance
    this.renderStates = []

    this.write = options.write
    this.done = options.done
    this.renderNode = options.renderNode

    this.isUnaryTag = options.isUnaryTag
    this.modules = options.modules
    this.directives = options.directives

    const cache = options.cache
    if (cache && (!cache.get || !cache.set)) {
      throw new Error('renderer cache must implement at least get & set.')
    }
    this.cache = cache
    this.get = cache && normalizeAsync(cache, 'get')
    this.has = cache && normalizeAsync(cache, 'has')

    this.next = this.next.bind(this)
  }

  next () {
    const lastState = this.renderStates[this.renderStates.length - 1]
    if (isUndef(lastState)) {
      return this.done()
    }
    switch (lastState.type) {
      case 'Element':
        const { children, total } = lastState
        const rendered = lastState.rendered++
        if (rendered < total) {
          this.renderNode(children[rendered], false, this)
        } else {
          this.renderStates.pop()
          this.write(lastState.endTag, this.next)
        }
        break
      case 'Component':
        this.renderStates.pop()
        this.activeInstance = lastState.prevActive
        this.next()
        break
      case 'ComponentWithCache':
        this.renderStates.pop()
        const { buffer, bufferIndex, componentBuffer, key } = lastState
        const result = {
          html: buffer[bufferIndex],
          components: componentBuffer[bufferIndex]
        }
        this.cache.set(key, result)
        if (bufferIndex === 0) {
          // this is a top-level cached component,
          // exit caching mode.
          this.write.caching = false
        } else {
          // parent component is also being cached,
          // merge self into parent's result
          buffer[bufferIndex - 1] += result.html
          const prev = componentBuffer[bufferIndex - 1]
          result.components.forEach(c => prev.add(c))
        }
        buffer.length = bufferIndex
        componentBuffer.length = bufferIndex
        this.next()
        break
    }
  }
}

function normalizeAsync (cache, method) {
  const fn = cache[method]
  if (isUndef(fn)) {
    return
  } else if (fn.length > 1) {
    return (key, cb) => fn.call(cache, key, cb)
  } else {
    return (key, cb) => cb(fn.call(cache, key))
  }
}
