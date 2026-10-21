/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Differential oracle for Flight consumers. A scenario is a seeded model that
// several render paths consume; their observable results must normalize to
// the same structure. The generator and the normalizer are kept here so that
// every Flight consumer test suite compares the same way.

const REACT_ELEMENT_TYPE = Symbol.for('react.transitional.element');
const REACT_LAZY_TYPE = Symbol.for('react.lazy');
const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');

// mulberry32: deterministic across runs so a failing seed replays exactly.
function createRng(seed) {
  let state = seed >>> 0;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    int(max) {
      return Math.floor(next() * max);
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    chance(probability) {
      return next() < probability;
    },
  };
}

exports.createRng = createRng;

// Pending promises are created during generation and resolved later in rng
// order, so the same seed produces the same resolution order on every path.
function createScheduler(rng) {
  const pending = [];
  return {
    defer(settle) {
      let resolve;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      // Flight attaches handlers lazily; an unobserved rejection would fail
      // the run before the consumer gets to it.
      promise.catch(() => {});
      pending.push(() => settle(resolve, reject));
      return promise;
    },
    hasPending() {
      return pending.length > 0;
    },
    settleOne() {
      const index = rng.int(pending.length);
      const settle = pending[index];
      pending.splice(index, 1);
      settle();
    },
  };
}

exports.createScheduler = createScheduler;

// Generates a model from a grammar of values Flight can carry. `env` provides
// the server React, the client component references and the scheduler.
// Server Components are generated as closures over generated return values so
// that both arms execute the same function bodies.
function generateModel(rng, env, options) {
  const {React, Show, Box, scheduler} = env;
  const maxDepth = options.maxDepth === undefined ? 5 : options.maxDepth;
  const shared = [];
  let componentCount = 0;
  let errorCount = 0;

  function maybeShare(value) {
    if (value !== null && typeof value === 'object' && rng.chance(0.3)) {
      shared.push(value);
    }
    return value;
  }

  function genString() {
    const kind = rng.int(5);
    switch (kind) {
      case 0:
        return '';
      case 1:
        // Leading '$' is the escape prefix on the wire.
        return '$' + rng.int(1000);
      case 2:
        // Large strings are written as separate text rows.
        return 'x'.repeat(1024 + rng.int(512));
      case 3:
        return 'héllo wörld ' + rng.int(100);
      default:
        return 'str' + rng.int(1000);
    }
  }

  function genPrimitive() {
    const kind = rng.int(9);
    switch (kind) {
      case 0:
        return null;
      case 1:
        return undefined;
      case 2:
        return rng.chance(0.5);
      case 3:
        return rng.int(100000) - 50000;
      case 4:
        return rng.pick([NaN, Infinity, -Infinity, -0, 1.5]);
      case 5:
        return BigInt(rng.int(100000));
      default:
        return genString();
    }
  }

  function genData(depth) {
    if (depth <= 0 || rng.chance(0.2)) {
      return genPrimitive();
    }
    if (shared.length > 0 && rng.chance(0.15)) {
      return rng.pick(shared);
    }
    if (options.allowInvalid && rng.chance(0.2)) {
      return genInvalid();
    }
    const kind = rng.int(12);
    switch (kind) {
      case 8:
        return Symbol.for('sym' + rng.int(3));
      case 9:
        return 'str' + rng.int(1000);
      case 10: {
        // A multi-shot iterable that is not an array.
        const items = [genData(depth - 1), genData(depth - 1)];
        return {
          [Symbol.iterator]() {
            return items[Symbol.iterator]();
          },
        };
      }
      case 11:
        return rng.chance(0.5)
          ? new Uint8Array([rng.int(256), rng.int(256)])
          : new Error('value ' + rng.int(100));
      case 0: {
        const length = 1 + rng.int(4);
        const array = [];
        for (let i = 0; i < length; i++) {
          array.push(genData(depth - 1));
        }
        return maybeShare(array);
      }
      case 1:
        return new Date(rng.int(2000000000000));
      case 2: {
        const map = new Map();
        const size = 1 + rng.int(3);
        for (let i = 0; i < size; i++) {
          map.set(genData(depth - 1), genData(depth - 1));
        }
        return maybeShare(map);
      }
      case 3: {
        const set = new Set();
        const size = 1 + rng.int(3);
        for (let i = 0; i < size; i++) {
          set.add(genData(depth - 1));
        }
        return maybeShare(set);
      }
      case 4:
        return genPromise(depth - 1, genData);
      default: {
        const object = {};
        const size = 1 + rng.int(4);
        for (let i = 0; i < size; i++) {
          object['k' + i] = genData(depth - 1);
        }
        return maybeShare(object);
      }
    }
  }

  // Values the serializer rejects. Each arm must report the same error.
  function genInvalid() {
    const kind = rng.int(5);
    switch (kind) {
      case 0:
        return function notAnAction() {};
      case 1:
        return Symbol('local' + rng.int(10));
      case 2:
        return new (class Model {
          constructor() {
            this.field = rng.int(10);
          }
        })();
      case 3: {
        const object = Object.create(null);
        object.field = rng.int(10);
        return object;
      }
      default:
        return {onClick: function handler() {}};
    }
  }

  function genPromise(depth, gen) {
    const kind = rng.int(3);
    if (kind === 0) {
      return Promise.resolve(gen(depth));
    }
    if (kind === 1 && options.allowErrors) {
      const error = new Error('rejected ' + errorCount++);
      return scheduler.defer((resolve, reject) => reject(error));
    }
    const value = gen(depth);
    return scheduler.defer(resolve => resolve(value));
  }

  function genKey() {
    return rng.chance(0.3) ? 'key' + rng.int(5) : null;
  }

  function genChildren(depth) {
    const length = 1 + rng.int(3);
    const children = [];
    for (let i = 0; i < length; i++) {
      children.push(genNode(depth - 1));
    }
    return children;
  }

  const sharedNodes = [];
  function maybeShareNode(node) {
    if (node !== null && typeof node === 'object' && rng.chance(0.3)) {
      sharedNodes.push(node);
    }
    return node;
  }

  function genNode(depth) {
    if (depth <= 0) {
      return rng.chance(0.5) ? genString() : null;
    }
    if (sharedNodes.length > 0 && rng.chance(0.1)) {
      // The same element object in two places, including Server Components.
      return rng.pick(sharedNodes);
    }
    return maybeShareNode(genNodeImpl(depth));
  }

  function genNodeImpl(depth) {
    const kind = rng.int(11);
    switch (kind) {
      case 10:
        // Errors below a boundary stay inside it in the HTML.
        return React.createElement(
          REACT_SUSPENSE_TYPE,
          {key: genKey(), fallback: 'loading ' + rng.int(100)},
          ...genChildren(depth),
        );
      case 0:
      case 1: {
        const props = {};
        if (rng.chance(0.5)) {
          props.className = 'c' + rng.int(5);
        }
        if (rng.chance(0.5)) {
          props['data-x'] = String(genPrimitive());
        }
        props.children = genChildren(depth);
        return React.createElement(
          rng.pick(['div', 'span', 'p']),
          Object.assign({key: genKey()}, props),
        );
      }
      case 2:
        return React.createElement(
          REACT_FRAGMENT_TYPE,
          {key: genKey()},
          ...genChildren(depth),
        );
      case 3:
        return genChildren(depth);
      case 4: {
        // Client Component receiving data props. A single-shot iterator only
        // appears here, never inside a container that could be shared: a
        // shared iterator is exhausted by whichever read comes second.
        let value;
        if (rng.chance(0.15)) {
          const items = [genData(depth - 1), genData(depth - 1)];
          value = items[Symbol.iterator]();
        } else {
          value = genData(depth - 1);
        }
        return React.createElement(Show, {key: genKey(), value});
      }
      case 5: {
        return React.createElement(
          Box,
          {key: genKey(), label: genString()},
          ...genChildren(depth),
        );
      }
      case 6:
      case 7:
      case 8: {
        return genServerComponentElement(depth);
      }
      default:
        return genString();
    }
  }

  function genServerComponentElement(depth) {
    const id = componentCount++;
    const kind = rng.int(5);
    const key = genKey();
    const props = {label: 'c' + id};
    let Component;
    switch (kind) {
      case 0: {
        const output = genNode(depth - 1);
        Component = function Sync() {
          return output;
        };
        break;
      }
      case 1: {
        const output = genNode(depth - 1);
        const promise = scheduler.defer(resolve => resolve(output));
        Component = async function Async() {
          return await promise;
        };
        break;
      }
      case 2: {
        const output = genNode(depth - 1);
        const promise = scheduler.defer(resolve => resolve(output));
        Component = function Using() {
          return React.use(promise);
        };
        break;
      }
      case 3: {
        if (options.allowErrors) {
          const error = new Error('thrown ' + errorCount++);
          if (rng.chance(0.3)) {
            Component = function Throwing() {
              throw error;
            };
          } else {
            const promise = scheduler.defer(resolve => resolve(null));
            Component = async function ThrowingLater() {
              await promise;
              throw error;
            };
          }
        } else {
          const output = genChildren(depth - 1);
          Component = function ReturningArray() {
            return output;
          };
        }
        break;
      }
      default: {
        const output = genNode(depth - 1);
        Component = function Nested(nestedProps) {
          return React.createElement(
            'div',
            {className: nestedProps.label},
            output,
          );
        };
      }
    }
    Object.defineProperty(Component, 'name', {value: 'SC' + id});
    const Counted = function (componentProps) {
      env.onRender();
      return Component(componentProps);
    };
    Object.defineProperty(Counted, 'name', {value: 'SC' + id});
    return React.createElement(Counted, Object.assign({key}, props));
  }

  const kind = options.kind || (rng.chance(0.7) ? 'tree' : 'data');
  const model =
    kind === 'tree'
      ? React.createElement('main', null, genChildren(maxDepth))
      : genData(maxDepth);
  return {model, kind};
}

exports.generateModel = generateModel;

// Resolves lazies and thenables and replaces objects with a comparable
// structure. Values are compared structurally: the wire path copies a shared
// object again when it meets it inside a keyed Server Component, while an
// in-process consumer may hand out the same object, and React treats both the
// same. Whether sharing survives is checked separately.
async function normalize(root, env) {
  const visiting = new Set();

  async function visit(value) {
    if (value === null || typeof value !== 'object') {
      if (typeof value === 'function') {
        return {$$: 'function', name: env.nameOf(value)};
      }
      if (typeof value === 'bigint') {
        return {$$: 'bigint', value: value.toString()};
      }
      if (typeof value === 'number') {
        if (Object.is(value, -0)) {
          return {$$: 'number', value: '-0'};
        }
        if (!Number.isFinite(value)) {
          return {$$: 'number', value: String(value)};
        }
      }
      if (typeof value === 'symbol') {
        return {$$: 'symbol', description: value.description};
      }
      return value;
    }
    if (
      typeof value.next === 'function' &&
      typeof value[Symbol.iterator] === 'function'
    ) {
      // Reading an iterator consumes it; both arms are read once.
      const items = [];
      const iterated = Array.from(value);
      for (let i = 0; i < iterated.length; i++) {
        items.push(await visit(iterated[i]));
      }
      return {$$: 'iterator', items};
    }
    if (value.$$typeof === REACT_LAZY_TYPE) {
      // Whether a value arrives inline or behind a lazy depends on timing,
      // and React renders both the same, so lazies are transparent here.
      let resolved;
      try {
        resolved = await readLazy(value);
      } catch (reason) {
        return {$$: 'lazy-error', value: await visitError(reason)};
      }
      return visit(resolved);
    }
    if (typeof value.then === 'function') {
      let settled;
      try {
        settled = {status: 'fulfilled', value: await value};
      } catch (reason) {
        settled = {status: 'rejected', reason};
      }
      return {
        $$: 'promise',
        status: settled.status,
        value:
          settled.status === 'fulfilled'
            ? await visit(settled.value)
            : await visitError(settled.reason),
      };
    }
    if (value instanceof Date) {
      return {$$: 'date', value: value.toISOString()};
    }
    if (visiting.has(value)) {
      return {$$: 'cycle'};
    }
    visiting.add(value);
    let result;
    if (value.$$typeof === REACT_ELEMENT_TYPE) {
      result = {
        $$: 'element',
        type:
          typeof value.type === 'string'
            ? value.type
            : typeof value.type === 'symbol'
              ? {$$: 'symbol', description: value.type.description}
              : await visit(value.type),
        key: value.key,
        props: await visit(value.props),
      };
    } else if (Array.isArray(value)) {
      result = {$$: 'array', items: []};
      for (let i = 0; i < value.length; i++) {
        result.items.push(await visit(value[i]));
      }
    } else if (value instanceof Map) {
      result = {$$: 'map', entries: []};
      const entries = Array.from(value);
      for (let i = 0; i < entries.length; i++) {
        result.entries.push([
          await visit(entries[i][0]),
          await visit(entries[i][1]),
        ]);
      }
    } else if (value instanceof Set) {
      result = {$$: 'set', items: []};
      const items = Array.from(value);
      for (let i = 0; i < items.length; i++) {
        result.items.push(await visit(items[i]));
      }
    } else if (ArrayBuffer.isView(value)) {
      result = {
        $$: 'view',
        type: value.constructor.name,
        bytes: Array.from(
          new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
        ),
      };
    } else if (value instanceof Error) {
      result = await visitError(value);
    } else {
      result = {$$: 'object', props: {}};
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        result.props[keys[i]] = await visit(value[keys[i]]);
      }
    }
    visiting.delete(value);
    return result;
  }

  async function visitError(error) {
    if (error instanceof Error) {
      return {
        $$: 'error',
        message: error.message,
        digest: error.digest,
      };
    }
    return {$$: 'thrown', value: await visit(error)};
  }

  async function readLazy(lazy) {
    while (true) {
      try {
        return lazy._init(lazy._payload);
      } catch (thrown) {
        if (
          thrown !== null &&
          typeof thrown === 'object' &&
          typeof thrown.then === 'function'
        ) {
          await thrown;
          continue;
        }
        throw thrown;
      }
    }
  }

  return visit(root);
}

exports.normalize = normalize;

// Same shape as `normalize`, for rendering props inside a Client Component
// under Fizz: thenables go through `use`, so a pending value suspends the
// component rather than being awaited here.
function describeProps(root, use) {
  const visiting = new Set();

  function visit(value) {
    if (value === null || typeof value !== 'object') {
      if (typeof value === 'bigint') {
        return {$$: 'bigint', value: value.toString()};
      }
      if (typeof value === 'number') {
        if (Object.is(value, -0)) {
          return {$$: 'number', value: '-0'};
        }
        if (!Number.isFinite(value)) {
          return {$$: 'number', value: String(value)};
        }
      }
      if (typeof value === 'function') {
        return {$$: 'function', name: value.name};
      }
      if (typeof value === 'symbol') {
        return {$$: 'symbol', description: value.description};
      }
      return value;
    }
    if (
      typeof value.next === 'function' &&
      typeof value[Symbol.iterator] === 'function'
    ) {
      return {$$: 'iterator', items: Array.from(value).map(visit)};
    }
    if (value.$$typeof === REACT_LAZY_TYPE) {
      return visit(value._init(value._payload));
    }
    if (typeof value.then === 'function') {
      return {$$: 'promise', value: visit(use(value))};
    }
    if (value instanceof Date) {
      return {$$: 'date', value: value.toISOString()};
    }
    if (value instanceof Error) {
      return {$$: 'error', message: value.message};
    }
    if (visiting.has(value)) {
      return {$$: 'cycle'};
    }
    visiting.add(value);
    let result;
    if (value.$$typeof === REACT_ELEMENT_TYPE) {
      result = {
        $$: 'element',
        type: typeof value.type === 'string' ? value.type : '<component>',
        key: value.key,
        props: visit(value.props),
      };
    } else if (Array.isArray(value)) {
      result = {$$: 'array', items: value.map(visit)};
    } else if (value instanceof Map) {
      const entries = Array.from(value).map(([k, v]) => [visit(k), visit(v)]);
      result = {$$: 'map', entries};
    } else if (value instanceof Set) {
      result = {$$: 'set', items: Array.from(value).map(visit)};
    } else {
      const props = {};
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        props[keys[i]] = visit(value[keys[i]]);
      }
      result = {$$: 'object', props};
    }
    visiting.delete(value);
    return result;
  }

  return JSON.stringify(visit(root), (key, value) =>
    value === undefined ? '$undefined' : value,
  );
}

exports.describeProps = describeProps;
