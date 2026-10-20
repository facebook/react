/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

// Renders generated value graphs with the real writer, reads them with the
// public client on both hosts, and releases the external events the client is
// waiting on (packets, module loads, Promise resolutions, stream items) one at
// a time in random orders. After each event it checks that every value whose
// inputs have all arrived has been delivered, that nothing was delivered before
// its inputs arrived, that delivered values equal the server's values, and that
// they still do once everything has settled. The expectations come only from
// the source graph and the record of released events, never from rows or
// client chunk state.
//
// The default run is a small sample. FLIGHT_FUZZ_CASES=128 runs the full sweep
// and FLIGHT_FUZZ_SEED=n starts at seed n. A failure prints the graph and the
// event order so it can be replayed from those variables.

let React;
let ReactServer;
let ReactDOMServer;
let Server;
let Client;
let WebpackMock;

const tick = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  // A rejection nobody asked for yet is not an unhandled rejection.
  promise.then(undefined, () => {});
  return {promise, resolve, reject};
}

function random(seed) {
  let state = seed;
  return limit => {
    state = (state + 0x6d2b79f5) | 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) % limit;
  };
}

function shuffle(array, pick) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Macrotasks a due value may take to arrive. The Edge host and Blob reads need
// a timer or I/O turn, so each turn also yields to a timer.
const PATIENCE = 30;

function roundTrip({host, model, packetSizes, yieldBetweenPackets, onError}) {
  const manifest = {
    moduleMap: null,
    serverModuleMap: WebpackMock.webpackServerMap,
    moduleLoading: null,
  };
  const errors = [];
  let queued = [];
  let serverDone = false;
  let closed = false;
  let disposed = false;
  let packet = 0;
  let send;
  let end;
  let abort;
  let root;
  const options = {
    onError(error) {
      if (disposed) {
        return 'cleanup';
      }
      try {
        return onError(error);
      } catch (unexpected) {
        errors.push(unexpected);
        return 'unexpected';
      }
    },
  };
  if (host === 'node') {
    const {PassThrough, Writable} = require('stream');
    const input = new PassThrough();
    root = Client.createFromNodeStream(input, manifest);
    send = bytes => input.write(bytes);
    end = () => input.end();
    const output = new Writable({
      write(bytes, encoding, done) {
        queued.push(Buffer.from(bytes));
        done();
      },
      final(done) {
        serverDone = true;
        done();
      },
    });
    output.on('error', error => {
      if (!disposed) {
        errors.push(error);
      }
    });
    const writer = Server.renderToPipeableStream(
      model,
      WebpackMock.webpackMap,
      options,
    );
    abort = reason => writer.abort(reason);
    writer.pipe(output);
  } else {
    let controller;
    const input = new ReadableStream({start: value => (controller = value)});
    root = Client.createFromReadableStream(input, {
      serverConsumerManifest: manifest,
    });
    send = bytes => controller.enqueue(bytes);
    end = () => controller.close();
    const control = new AbortController();
    const output = Server.renderToReadableStream(
      model,
      WebpackMock.webpackMap,
      {
        ...options,
        signal: control.signal,
      },
    );
    abort = reason => control.abort(reason);
    const reader = output.getReader();
    (async () => {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) {
          serverDone = true;
          return;
        }
        queued.push(Buffer.from(value));
      }
    })().catch(error => {
      if (!disposed) {
        errors.push(error);
      }
    });
  }

  // Forwards what the writer has produced so far, split into packets of
  // varying sizes so that rows straddle packet boundaries.
  async function flush() {
    await tick();
    const bytes = Buffer.concat(queued);
    queued = [];
    for (let offset = 0; offset < bytes.length; ) {
      const size = packetSizes[packet++ % packetSizes.length];
      send(bytes.subarray(offset, offset + size));
      offset += size;
      if (yieldBetweenPackets) {
        await tick();
      }
    }
    await tick();
    if (errors.length) {
      throw errors[0];
    }
  }

  async function drain(predicate, describe) {
    for (let turn = 0; turn < PATIENCE; turn++) {
      await flush();
      if (predicate()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    throw new Error('No progress: ' + describe());
  }

  return {
    root,
    flush,
    drain,
    // The client is left open on purpose. Values must arrive because their
    // inputs did, not because the stream ended.
    finish: () =>
      drain(
        () => serverDone && queued.length === 0,
        () => 'writer completion',
      ),
    close() {
      if (!closed) {
        closed = true;
        end();
      }
    },
    abort,
    async dispose() {
      disposed = true;
      if (!serverDone) {
        abort();
      }
      if (!closed) {
        closed = true;
        end();
      }
      await tick();
    },
  };
}

// A plan is a server-side value graph together with the external events the
// client has to wait for. Values that mean more than their own properties are
// recorded in `kinds`; the events are `services`, released by the test in some
// order. The oracle below reads only `service.released` and `service.error`.
function createPlan(seed) {
  const plan = {
    seed,
    pick: random(seed),
    model: null,
    services: [],
    needs: new Map(),
    kinds: new Map(),
    expectedErrors: new Map(),
    recipe: [],
    rootPromise: null,
    rootModel: null,
    observeProps: () => {},

    // `client` services happen on the client (module loads); the rest are
    // server-side events the writer waits for. A service with `error` fails
    // whatever needs it when it is released.
    service(label, run, {error, client = false} = {}) {
      const service = {label, run, released: false, error, client};
      plan.services.push(service);
      return service;
    },
    need(value, ...services) {
      plan.needs.set(value, [
        ...(plan.needs.get(value) || []),
        ...services.filter(Boolean),
      ]);
    },

    // Outcome state is recorded through native callbacks so that the oracle
    // never reads the writer's or the reader's thenable fields.
    promise(label) {
      const gate = deferred();
      const kind = {
        type: 'promise',
        label,
        state: 'pending',
        value: undefined,
        reason: undefined,
      };
      plan.kinds.set(gate.promise, kind);
      gate.promise.then(
        value => {
          kind.state = 'fulfilled';
          kind.value = value;
        },
        reason => {
          kind.state = 'rejected';
          kind.reason = reason;
        },
      );
      return gate;
    },
    async clientReference(
      value,
      {asynchronous = false, name, evaluationError} = {},
    ) {
      const id = name || 'module-' + plan.kinds.size;
      const load = deferred();
      const evaluate = asynchronous ? deferred() : null;
      let exports = WebpackMock.clientExports(
        evaluate === null ? {value} : evaluate.promise,
        id,
        id + '.js',
        load.promise,
      );
      let evaluateService = null;
      if (evaluate !== null) {
        // Awaiting the proxy marks an async import. Its chunk load and its
        // evaluation then finish in either order.
        exports = await exports;
        evaluateService = plan.service(
          'evaluate ' + id,
          () =>
            evaluationError !== undefined
              ? evaluate.reject(evaluationError)
              : evaluate.resolve({value}),
          {error: evaluationError, client: true},
        );
      }
      const reference = exports.value;
      plan.kinds.set(reference, {type: 'module', value});
      const loadService = plan.service(
        'load ' + id,
        error => (error !== undefined ? load.reject(error) : load.resolve()),
        {client: true},
      );
      if (evaluateService !== null) {
        evaluateService.after = loadService;
      }
      plan.need(reference, loadService, evaluateService);
      return {reference, load, loadService, evaluateService};
    },
    serverFunction(implementation, {bound = [], args = [], label} = {}) {
      const ready = deferred();
      const exported = WebpackMock.serverExports(
        {fn: implementation},
        ready.promise,
      );
      const fn = bound.length ? exported.fn.bind(null, ...bound) : exported.fn;
      const result = implementation(...bound, ...args);
      plan.kinds.set(fn, {type: 'function', bound, args, result});
      const service = plan.service(
        'load ' + (label || 'server function'),
        () => ready.resolve(),
        {client: true},
      );
      plan.need(fn, service);
      return {fn, service};
    },
    clientElement(props, {name} = {}) {
      const id = name || 'component-' + plan.kinds.size;
      const load = deferred();
      const Component = receivedProps => {
        plan.observeProps(element, receivedProps);
        return React.createElement('span', null, id);
      };
      const {Component: Type} = WebpackMock.clientExports(
        {Component},
        id,
        id + '.js',
        load.promise,
      );
      const element = ReactServer.createElement(Type, props);
      plan.kinds.set(element, {
        type: 'element',
        html: '<span>' + id + '</span>',
      });
      plan.need(
        element,
        plan.service('load ' + id, () => load.resolve(), {client: true}),
      );
      return element;
    },
    // A server component whose body renders once `render` is released. A
    // body that throws an Error from `plan.error` fails the element with its
    // digest.
    serverElement(html, render, {label = 'server component', failure} = {}) {
      const gate = deferred();
      async function Body() {
        await gate.promise;
        return render();
      }
      const element = ReactServer.createElement(Body);
      plan.kinds.set(element, {type: 'element', html, failure});
      if (failure !== undefined) {
        plan.expectedErrors.set(failure, plan.kinds.get(failure).digest);
      }
      plan.need(
        element,
        plan.service('render ' + label, () => gate.resolve()),
      );
      return element;
    },
    // A byte stream. Each chunk is enqueued by its own service.
    byteStream(chunks) {
      let controller;
      let produced = 0;
      const stream = new ReadableStream({
        type: 'bytes',
        start: c => (controller = c),
      });
      const steps = [];
      const pump = () => {
        while (produced < chunks.length && steps[produced].released) {
          controller.enqueue(chunks[produced++].slice());
        }
        if (produced === chunks.length) {
          controller.close();
        }
      };
      for (let i = 0; i < chunks.length; i++) {
        steps.push(plan.service('byte chunk ' + i, pump));
      }
      plan.kinds.set(stream, {type: 'bytes', chunks, steps});
      return stream;
    },
    // A stream the client cancels after reading its first item. The writer
    // then enqueues another item, which must be dropped without affecting
    // values the first item shares with the rest of the response.
    canceledStream(items) {
      let controller;
      const stream = new ReadableStream({
        start(c) {
          controller = c;
          controller.enqueue(items[0]);
        },
      });
      plan.service('enqueue after cancellation', () => {
        controller.enqueue({discarded: true});
        controller.close();
      });
      plan.kinds.set(stream, {type: 'canceled', first: items[0]});
      return stream;
    },
    hostElement(type, props, html) {
      const element = ReactServer.createElement(type, props);
      plan.kinds.set(element, {type: 'element', html});
      return element;
    },
    // Items are produced in order: item i is enqueued once the services for
    // items 0..i have all been released. Closing is its own service.
    stream(items, {label = 'stream'} = {}) {
      let controller;
      let produced = 0;
      const stream = new ReadableStream({start: c => (controller = c)});
      const steps = [];
      const pump = () => {
        while (produced < items.length && steps[produced].released) {
          controller.enqueue(items[produced++]);
        }
        if (produced === items.length && steps[items.length].released) {
          controller.close();
        }
      };
      for (let i = 0; i < items.length; i++) {
        steps.push(plan.service(label + ' item ' + i, pump));
      }
      steps.push(plan.service('close ' + label, pump));
      plan.kinds.set(stream, {type: 'stream', items, steps});
      return stream;
    },
    asyncIterable(items, returnValue, {label = 'iterable'} = {}) {
      const gate = deferred();
      const iterable = {
        async *[Symbol.asyncIterator]() {
          await gate.promise;
          for (let i = 0; i < items.length; i++) {
            yield items[i];
          }
          return returnValue;
        },
      };
      const step = plan.service('start ' + label, () => gate.resolve());
      plan.kinds.set(iterable, {type: 'iterable', items, returnValue, step});
      return iterable;
    },
    // The writer copies a sync iterator into an array, so its return value is
    // not transmitted.
    iterator(items) {
      const iterator = items[Symbol.iterator]();
      plan.kinds.set(iterator, {type: 'iterator', items});
      return iterator;
    },
    // An Error value. In DEV the client receives its message, cause and
    // errors; in production only that it is an error. An Error used to reject
    // a Promise is reported to onError and reaches the client as a digest.
    error(message, options) {
      const error = new Error(message, options);
      const digest = 'digest:' + message;
      plan.kinds.set(error, {type: 'error', digest});
      return error;
    },
    reject(gate, error) {
      plan.expectedErrors.set(error, plan.kinds.get(error).digest);
      gate.reject(error);
    },
  };
  return plan;
}

// What a value contains, for the purpose of deciding when it is whole. The
// reader delivers a value once everything reachable from it through objects,
// arrays, Sets, Maps and the bound arguments of a Server Function has arrived
// and loaded. A sync iterator is read while reading the value that holds it,
// so its items count too. Promises, streams, async iterables and elements are
// handles: they are delivered on their own and their insides are owed when
// they are observed, not before. Client references are leaves whose module
// must have loaded.
function contents(plan, value) {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return [];
  }
  const kind = plan.kinds.get(value);
  if (kind !== undefined) {
    switch (kind.type) {
      case 'function':
        return kind.bound;
      case 'iterator':
        return kind.items;
      case 'error':
        return __DEV__
          ? [
              value.cause,
              ...(value instanceof AggregateError ? value.errors : []),
            ]
          : [];
      default:
        return [];
    }
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (value instanceof Set) {
    return Array.from(value);
  }
  if (value instanceof Map) {
    return Array.from(value.entries()).flat();
  }
  if (Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value);
  }
  return [];
}

function isHandle(kind) {
  return (
    kind !== undefined &&
    (kind.type === 'promise' ||
      kind.type === 'element' ||
      kind.type === 'stream' ||
      kind.type === 'bytes' ||
      kind.type === 'canceled' ||
      kind.type === 'iterable')
  );
}

// Every service that `value` or some content of it needs. A handle's own
// needs (an element's component, for instance) gate observing the handle,
// not delivering the value that holds it.
function servicesOf(plan, value) {
  const result = new Set();
  const seen = new Set();
  const todo = [value];
  while (todo.length) {
    const current = todo.pop();
    if (
      current !== null &&
      (typeof current === 'object' || typeof current === 'function')
    ) {
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
    }
    if (isHandle(plan.kinds.get(current))) {
      continue;
    }
    (plan.needs.get(current) || []).forEach(service => result.add(service));
    todo.push(...contents(plan, current));
  }
  return Array.from(result);
}

function allReleased(services) {
  return services.every(service => service.released);
}

// The first failure the client can have seen. A failure is not visible
// before the service it comes after (a module's evaluation after its load).
function firstFailure(services) {
  const failed = services.find(
    service =>
      service.released &&
      service.error !== undefined &&
      (service.after === undefined || service.after.released),
  );
  return failed === undefined ? null : failed.error;
}

// A value is owed once it is whole, or as soon as something it contains has
// failed; a failure does not wait for the value's other inputs.
function owed(services) {
  return allReleased(services) || firstFailure(services) !== null;
}

// Observes a response the way an application would: through `then` callbacks,
// by rendering elements, and by reading streams. Each possible observation is
// a job with a `due` predicate over released services. A job must not be
// delivered before it is due, must be delivered within PATIENCE turns once it
// is, and must deliver a value that matches the source. `recheck` matches the
// delivered values again later to catch mutation after delivery.
function observer(plan, {render}) {
  const jobs = [];
  const failures = [];
  const delivered = [];
  // A received object stands for exactly one source object. Objects and
  // arrays keep their identity across the whole response because the writer
  // refers back to them. Sets, Maps and binary values are written where they
  // occur, and each reference to a Server Function creates its own proxy, so
  // those can arrive as equal copies.
  const sourceOf = new WeakMap();
  const receivedFor = new Map();
  const watched = new WeakSet();
  // An iterator yields once; later matches compare what it yielded.
  const yielded = new WeakMap();
  let pendingAsync = 0;

  function job(kind, source, path, due, expected) {
    const entry = {kind, source, path, due, expected, done: false};
    jobs.push(entry);
    return entry;
  }

  function guard(run) {
    try {
      run();
    } catch (error) {
      failures.push(error);
    }
  }

  function guardAsync(run) {
    pendingAsync++;
    Promise.resolve()
      .then(run)
      .catch(error => failures.push(error))
      .then(() => pendingAsync--);
  }

  function outcomeOf(source) {
    const failure = firstFailure(servicesOf(plan, source));
    return failure === null ? {value: source} : {error: failure};
  }

  function expectError(error, expected) {
    if (expected instanceof Error) {
      expect(error).toBe(expected);
    } else {
      expect(error.digest).toBe(expected.digest);
    }
  }

  function deliver(entry, received, error) {
    guard(() => {
      expect(entry.done).toBe(false);
      if (!entry.due()) {
        throw new Error(
          'Delivered before its inputs arrived: ' +
            entry.path +
            '; not yet released: ' +
            servicesOf(plan, entry.source)
              .filter(service => !service.released)
              .map(service => service.label)
              .join(', '),
        );
      }
      const expected = entry.expected();
      if (expected.error !== undefined) {
        if (error === undefined) {
          throw new Error(entry.path + ': expected a rejection');
        }
        expectError(error, expected.error);
      } else {
        if (error !== undefined) {
          throw new Error(
            entry.path + ': unexpected rejection: ' + error.message,
          );
        }
        match(expected.value, received, entry.path);
        delivered.push({source: expected.value, received, path: entry.path});
      }
      entry.done = true;
    });
  }

  function match(source, received, path, visited = new Set(), fresh = false) {
    try {
      if (
        source === null ||
        (typeof source !== 'object' && typeof source !== 'function')
      ) {
        expect(received).toBe(source);
        return;
      }
      const kind = plan.kinds.get(source);
      if (kind !== undefined && kind.type === 'module') {
        expect(received).toBe(kind.value);
        return;
      }
      expect(
        received !== null &&
          (typeof received === 'object' || typeof received === 'function'),
      ).toBe(true);
      // A Server Function's return value is created by the call; everything
      // below it is the bound arguments, which keep their identity.
      if (!fresh) {
        if (sourceOf.has(received)) {
          expect(sourceOf.get(received)).toBe(source);
        } else {
          sourceOf.set(received, source);
        }
      }
      if (visited.has(received)) {
        return;
      }
      visited.add(received);
      const keepsIdentity =
        !fresh &&
        kind === undefined &&
        (Array.isArray(source) ||
          Object.getPrototypeOf(source) === Object.prototype);
      if (keepsIdentity) {
        if (receivedFor.has(source)) {
          expect(received).toBe(receivedFor.get(source));
        } else {
          receivedFor.set(source, received);
        }
      }
      if (kind !== undefined) {
        matchKind(kind, source, received, path, visited);
      } else if (Array.isArray(source)) {
        expect(Array.isArray(received)).toBe(true);
        expect(received.length).toBe(source.length);
        for (let i = 0; i < source.length; i++) {
          match(source[i], received[i], path + '[' + i + ']', visited);
        }
      } else if (source instanceof Set) {
        expect(received instanceof Set).toBe(true);
        const a = Array.from(source);
        const b = Array.from(received);
        expect(b.length).toBe(a.length);
        for (let i = 0; i < a.length; i++) {
          match(a[i], b[i], path + '.member' + i, visited);
        }
      } else if (source instanceof Map) {
        expect(received instanceof Map).toBe(true);
        const a = Array.from(source);
        const b = Array.from(received);
        expect(b.length).toBe(a.length);
        for (let i = 0; i < a.length; i++) {
          match(a[i][0], b[i][0], path + '.key' + i, visited);
          match(a[i][1], b[i][1], path + '.value' + i, visited);
        }
      } else if (source instanceof Date) {
        expect(received instanceof Date).toBe(true);
        expect(received.getTime()).toBe(source.getTime());
      } else if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
        expect(Object.prototype.toString.call(received)).toBe(
          Object.prototype.toString.call(source),
        );
        const bytes = v =>
          v instanceof ArrayBuffer
            ? Array.from(new Uint8Array(v))
            : Array.from(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
        expect(bytes(received)).toEqual(bytes(source));
      } else if (source instanceof Blob) {
        expect(received instanceof Blob).toBe(true);
        expect(received.type).toBe(source.type);
        expect(received.size).toBe(source.size);
        guardAsync(async () => {
          expect(
            Array.from(new Uint8Array(await received.arrayBuffer())),
          ).toEqual(Array.from(new Uint8Array(await source.arrayBuffer())));
        });
      } else if (source instanceof FormData) {
        expect(received instanceof FormData).toBe(true);
        const a = Array.from(source.entries());
        const b = Array.from(received.entries());
        expect(b.length).toBe(a.length);
        for (let i = 0; i < a.length; i++) {
          expect(b[i][0]).toBe(a[i][0]);
          match(a[i][1], b[i][1], path + '.form' + i, visited);
        }
      } else {
        expect(Object.getPrototypeOf(received)).toBe(Object.prototype);
        const keys = Object.keys(source);
        expect(Object.keys(received)).toEqual(keys);
        for (let i = 0; i < keys.length; i++) {
          match(
            source[keys[i]],
            received[keys[i]],
            path + '.' + keys[i],
            visited,
          );
        }
      }
    } catch (error) {
      throw new Error(path + ': ' + error.message);
    }
  }

  function matchKind(kind, source, received, path, visited) {
    switch (kind.type) {
      case 'function': {
        expect(typeof received).toBe('function');
        match(kind.result, received(...kind.args), path + '()', visited, true);
        return;
      }
      case 'promise': {
        expect(typeof received.then).toBe('function');
        if (watched.has(received)) {
          return;
        }
        watched.add(received);
        const entry = job(
          'outcome',
          source,
          path + '.then',
          () =>
            kind.state === 'rejected' ||
            (kind.state === 'fulfilled' && owed(servicesOf(plan, kind.value))),
          () =>
            kind.state === 'rejected'
              ? {error: plan.kinds.get(kind.reason)}
              : outcomeOf(kind.value),
        );
        received.then(
          value => deliver(entry, value, undefined),
          error => deliver(entry, undefined, error),
        );
        return;
      }
      case 'element': {
        if (watched.has(received)) {
          return;
        }
        watched.add(received);
        const props = source.props;
        const entry = job(
          'render',
          source,
          path + '.render',
          () =>
            firstFailure(servicesOf(plan, props)) !== null ||
            (allReleased(plan.needs.get(source) || []) &&
              allReleased(servicesOf(plan, props))),
          () => {
            if (kind.failure !== undefined) {
              return {error: plan.kinds.get(kind.failure)};
            }
            const failure = firstFailure(servicesOf(plan, props));
            return failure === null ? {value: kind.html} : {error: failure};
          },
        );
        guardAsync(async () => {
          let html;
          let error;
          try {
            html = await render(received);
          } catch (x) {
            error = x;
          }
          deliver(entry, html, error);
        });
        return;
      }
      case 'stream':
      case 'iterable': {
        if (watched.has(received)) {
          return;
        }
        watched.add(received);
        const items = kind.items;
        const producedThrough = i =>
          kind.type === 'stream'
            ? allReleased(kind.steps.slice(0, i + 1))
            : kind.step.released;
        const closed = () =>
          kind.type === 'stream' ? allReleased(kind.steps) : kind.step.released;
        const wholeThrough = i => {
          for (let j = 0; j <= i; j++) {
            if (!owed(servicesOf(plan, items[j]))) {
              return false;
            }
          }
          return true;
        };
        // An item is owed once it and every earlier item have been produced
        // and are whole; a later item never overtakes an earlier one.
        const itemJobs = items.map((item, i) =>
          job(
            'item',
            item,
            path + '.item' + i,
            () => producedThrough(i) && wholeThrough(i),
            () => outcomeOf(item),
          ),
        );
        const endJob = job(
          'end',
          source,
          path + '.end',
          () =>
            closed() &&
            wholeThrough(items.length - 1) &&
            (kind.type === 'stream' ||
              owed(servicesOf(plan, kind.returnValue))),
          () =>
            kind.type === 'stream'
              ? {value: undefined}
              : outcomeOf(kind.returnValue),
        );
        guardAsync(async () => {
          let next;
          if (kind.type === 'stream') {
            const reader = received.getReader();
            next = () => reader.read();
          } else {
            const iterator = received[Symbol.asyncIterator]();
            next = () => iterator.next();
          }
          for (let i = 0; i < items.length; i++) {
            let result;
            try {
              result = await next();
            } catch (error) {
              deliver(itemJobs[i], undefined, error);
              return;
            }
            if (result.done) {
              throw new Error(path + '.item' + i + ': ended early');
            }
            deliver(itemJobs[i], result.value, undefined);
          }
          let last;
          try {
            last = await next();
          } catch (error) {
            deliver(endJob, undefined, error);
            return;
          }
          expect(last.done).toBe(true);
          deliver(endJob, last.value, undefined);
        });
        return;
      }
      case 'bytes': {
        if (watched.has(received)) {
          return;
        }
        watched.add(received);
        const expectedBytes = [].concat(...kind.chunks.map(c => Array.from(c)));
        const entry = job(
          'bytes',
          source,
          path + '.bytes',
          () => allReleased(kind.steps),
          () => ({value: undefined}),
        );
        guardAsync(async () => {
          const reader = received.getReader({mode: 'byob'});
          const got = [];
          for (;;) {
            const {done, value} = await reader.read(
              new Uint8Array(1 + (got.length % 3)),
            );
            if (value) {
              got.push(...value);
            }
            // Only prefixes of the source bytes are ever visible.
            expect(got).toEqual(expectedBytes.slice(0, got.length));
            if (done) {
              break;
            }
          }
          expect(got).toEqual(expectedBytes);
          deliver(entry, undefined, undefined);
        });
        return;
      }
      case 'canceled': {
        if (watched.has(received)) {
          return;
        }
        watched.add(received);
        const entry = job(
          'cancel',
          kind.first,
          path + '.first',
          () => owed(servicesOf(plan, kind.first)),
          () => outcomeOf(kind.first),
        );
        guardAsync(async () => {
          const reader = received.getReader();
          const first = reader.read();
          await reader.cancel('canceled by the test');
          const item = await first;
          expect(item.done).toBe(false);
          deliver(entry, item.value, undefined);
        });
        return;
      }
      case 'iterator': {
        let got = yielded.get(received);
        if (got === undefined) {
          got = [];
          yielded.set(received, got);
          for (;;) {
            const step = received.next();
            if (step.done) {
              expect(step.value).toBe(undefined);
              break;
            }
            got.push(step.value);
          }
        }
        expect(got.length).toBe(kind.items.length);
        for (let i = 0; i < got.length; i++) {
          match(kind.items[i], got[i], path + '.item' + i, visited);
        }
        return;
      }
      case 'error': {
        expect(received instanceof Error).toBe(true);
        if (__DEV__) {
          expect(received.message).toBe(source.message);
          expect('cause' in received).toBe('cause' in source);
          if ('cause' in source) {
            match(source.cause, received.cause, path + '.cause', visited);
          }
          if (source instanceof AggregateError) {
            expect(received instanceof AggregateError).toBe(true);
            match(source.errors, received.errors, path + '.errors', visited);
          }
        }
        return;
      }
      default:
        throw new Error('Unknown kind: ' + kind.type);
    }
  }

  const api = {
    attachRoot(root, source, again) {
      const rootPromise = plan.rootPromise;
      const entry = job(
        'root',
        source,
        'root',
        () =>
          (rootPromise === null ||
            plan.kinds.get(rootPromise).state !== 'pending') &&
          owed(servicesOf(plan, source)),
        () => outcomeOf(source),
      );
      root.then(
        value => {
          deliver(entry, value, undefined);
          if (again) {
            api.attachRoot(root, source, false);
          }
        },
        error => deliver(entry, undefined, error),
      );
    },
    observeProps(source, received) {
      guard(() => {
        match(source.props, received, 'props of ' + source.type.name);
        delivered.push({
          source: source.props,
          received,
          path: 'props of ' + source.type.name,
        });
      });
    },
    healthy() {
      if (failures.length) {
        throw failures[0];
      }
    },
    overdue() {
      api.healthy();
      return jobs.filter(entry => !entry.done && entry.due());
    },
    settled() {
      api.healthy();
      return pendingAsync === 0 && jobs.every(entry => entry.done);
    },
    recheck() {
      const count = delivered.length;
      for (let i = 0; i < count; i++) {
        const {source, received, path} = delivered[i];
        match(source, received, path + ' (after settlement)');
      }
      api.healthy();
    },
  };
  return api;
}

const firstSeed = +(process.env.FLIGHT_FUZZ_SEED || 1);
const sweep = process.env.FLIGHT_FUZZ_CASES !== undefined;
const caseCount = +(process.env.FLIGHT_FUZZ_CASES || 4);
const seeds = Array.from({length: caseCount}, (_, i) => (firstSeed + i) >>> 0);

// When the application starts observing: before any packet arrives, after the
// first flush, after every service has been released, or after EOF.
const demands = ['early', 'late', 'after-services', 'after-eof'];

// A random graph of containers that refer to each other and to client
// references, bound Server Functions, elements and Promises, with every edge
// free to point forward, backward or at its own node. With `rejectModule`, one
// client module fails to load, so the values that contain it must reject and
// the values that do not must still arrive.
async function generateGraph(plan, {rejectModule}) {
  const {pick} = plan;
  const kinds = ['array', 'object', 'set', 'map'];
  const nodes = [];
  const containers = 4 + pick(9);
  for (let i = 0; i < containers; i++) {
    nodes.push({kind: kinds[i < 4 ? i : pick(kinds.length)], items: []});
  }
  const promises = 2 + pick(4);
  for (let i = 0; i < promises; i++) {
    nodes.push({kind: 'promise', value: 0});
  }
  const modules = 2 + pick(3);
  for (let i = 0; i < modules; i++) {
    nodes.push({kind: 'module', value: 'export-' + i, async: pick(3) === 0});
  }
  const bindings = pick(3);
  for (let i = 0; i < bindings; i++) {
    nodes.push({kind: 'bound', items: [pick(containers), pick(containers)]});
  }
  const elements = pick(3);
  for (let i = 0; i < elements; i++) {
    const element = nodes.length;
    nodes.push({kind: 'element', value: pick(containers)});
    nodes.push({kind: 'props', value: element});
  }
  nodes.push({kind: 'scalar', value: 'value'});
  nodes.push({kind: 'scalar', value: 42});
  nodes.push({kind: 'scalar', value: null});
  nodes.push({kind: 'date'});
  nodes.push({kind: 'binary'});
  nodes.push({kind: 'text'});
  for (let i = 0; i < containers; i++) {
    const size = 1 + pick(5);
    for (let j = 0; j < size; j++) {
      const item = pick(nodes.length);
      nodes[i].items.push(
        nodes[i].kind === 'map' ? [pick(nodes.length), item] : item,
      );
    }
  }
  for (let i = 0; i < promises; i++) {
    // A Promise resolves to a container, or adopts the next Promise.
    nodes[containers + i].value =
      i + 1 < promises && pick(3) === 0 ? containers + i + 1 : pick(containers);
  }
  const graph = process.env.FLIGHT_FUZZ_GRAPH
    ? JSON.parse(process.env.FLIGHT_FUZZ_GRAPH)
    : {nodes, roots: [pick(containers), pick(containers)]};
  if (rejectModule && !process.env.FLIGHT_FUZZ_GRAPH) {
    const choose = random(plan.seed ^ 0x85ebca6b);
    graph.nodes[containers + promises + choose(modules)].reject = true;
  }

  const values = [];
  for (let i = 0; i < graph.nodes.length; i++) {
    const node = graph.nodes[i];
    switch (node.kind) {
      case 'array':
        values[i] = [];
        break;
      case 'object':
        values[i] = {};
        break;
      case 'set':
        values[i] = new Set();
        break;
      case 'map':
        values[i] = new Map();
        break;
      case 'scalar':
        values[i] = node.value;
        break;
      case 'date':
        values[i] = new Date(1700000000000 + plan.seed);
        break;
      case 'binary':
        values[i] = new Uint8Array([plan.seed % 256, 10, 255]);
        break;
      case 'text':
        // Long enough for the writer to outline it as its own row.
        values[i] = 'text-' + plan.seed + '🙂'.repeat(400);
        break;
      case 'promise': {
        const gate = plan.promise('v' + i);
        values[i] = gate.promise;
        plan.service('resolve v' + i + ' to v' + node.value, () =>
          gate.resolve(values[node.value]),
        );
        break;
      }
      case 'module': {
        if (node.reject) {
          const id = 'v' + i;
          const load = deferred();
          const exports = WebpackMock.clientExports(
            {value: node.value},
            id,
            id + '.js',
            load.promise,
          );
          const error = new Error('module v' + i + ' failed to load');
          values[i] = exports.value;
          plan.kinds.set(values[i], {type: 'module', value: node.value});
          plan.need(
            values[i],
            plan.service('reject v' + i, () => load.reject(error), {
              error,
              client: true,
            }),
          );
        } else {
          const {reference} = await plan.clientReference(node.value, {
            asynchronous: node.async,
            name: 'v' + i,
          });
          values[i] = reference;
        }
        break;
      }
      default:
        break;
    }
  }
  const read = (...args) => args;
  for (let i = 0; i < graph.nodes.length; i++) {
    const node = graph.nodes[i];
    if (node.kind === 'bound') {
      const bound = node.items.map(index => values[index]);
      values[i] = plan.serverFunction(read, {bound, label: 'v' + i}).fn;
    } else if (node.kind === 'element') {
      values[i] = plan.clientElement(
        {value: values[node.value]},
        {name: 'v' + i},
      );
    }
  }
  for (let i = 0; i < graph.nodes.length; i++) {
    const node = graph.nodes[i];
    if (node.kind === 'props') {
      values[i] = values[node.value].props;
    }
  }
  for (let i = 0; i < graph.nodes.length; i++) {
    const node = graph.nodes[i];
    if (node.kind === 'map') {
      node.items.forEach(([key, item]) =>
        values[i].set(values[key], values[item]),
      );
    } else if (node.kind === 'array') {
      node.items.forEach(item => values[i].push(values[item]));
    } else if (node.kind === 'set') {
      node.items.forEach(item => values[i].add(values[item]));
    } else if (node.kind === 'object') {
      node.items.forEach((item, index) => {
        values[i]['field' + index] = values[item];
      });
    }
  }
  plan.model = {
    entry: values[graph.roots[0]],
    other: values[graph.roots[1]],
    outcomes: values.filter((v, i) => graph.nodes[i].kind === 'promise'),
  };
  plan.recipe.push('Graph: ' + JSON.stringify(graph));
}

// Fixed dependency shapes that random graphs rarely produce. Each returns the
// model; `depth` wraps it in further containers and Promises afterwards so
// that the same shape is exercised from different positions in a response.
const shapes = {
  // An element's props object is referenced again from outside the element.
  async 'shared props'(plan) {
    const {pick} = plan;
    const {reference} = await plan.clientReference('ready');
    const payload = [
      reference,
      {value: reference},
      [reference],
      new Set([reference]),
      new Map([['value', reference]]),
      new Set([{value: reference}]),
    ][pick(6)];
    const data = {};
    const element = plan.clientElement({payload, data});
    data.alias = element.props;
    return {element, props: element.props};
  },
  // A sub-object of an element's props is referenced while a sibling prop
  // is still loading.
  async 'shared props subtree'(plan) {
    const {reference} = await plan.clientReference('ready');
    const {reference: sibling} = await plan.clientReference('sibling');
    const selected = {payload: reference};
    const element = plan.clientElement({selected, sibling});
    return {element, selected: element.props.selected};
  },
  // An element reaches itself through its own props.
  async 'self element'(plan) {
    const {reference} = await plan.clientReference('ready');
    const data = {};
    const element = plan.clientElement({payload: reference, data});
    data.self = element;
    return {element, data};
  },
  async 'collection containing itself'(plan) {
    const {reference} = await plan.clientReference('ready');
    const collection = plan.pick(2) === 0 ? new Set() : new Map();
    if (collection instanceof Set) {
      collection.add(collection);
      collection.add(reference);
    } else {
      collection.set(collection, collection);
      collection.set('value', reference);
    }
    return collection;
  },
  // Two collections contain each other.
  async 'mutual collections'(plan) {
    const {reference} = await plan.clientReference('ready');
    const a = new Set();
    const b = new Map([['a', a]]);
    a.add(b);
    a.add(reference);
    return [a, b];
  },
  // A Server Function is bound to the container that holds it.
  async 'function bound to its container'(plan) {
    const {pick} = plan;
    const {reference} = await plan.clientReference('ready');
    const container = [[], {}, new Set(), new Map()][pick(4)];
    const {fn} = plan.serverFunction(c => c, {bound: [container]});
    if (Array.isArray(container)) {
      container.push(fn, container, reference);
    } else if (container instanceof Set) {
      container.add(fn);
      container.add(container);
      container.add(reference);
    } else if (container instanceof Map) {
      container.set(fn, reference);
      container.set(container, container);
    } else {
      container.fn = fn;
      container.self = container;
      container.value = reference;
    }
    return container;
  },
  // A Server Function is the first place a cyclic region is exposed.
  async 'function exposes a region'(plan) {
    const {pick} = plan;
    const {reference} = await plan.clientReference('ready');
    const region = [[], {}, new Set(), new Map()][pick(4)];
    const {fn} = plan.serverFunction(data => data, {bound: [region]});
    if (Array.isArray(region)) {
      region.push(fn, region, reference);
    } else if (region instanceof Set) {
      region.add(fn);
      region.add(region);
      region.add(reference);
    } else if (region instanceof Map) {
      region.set(fn, reference);
      region.set(region, region);
    } else {
      region.fn = fn;
      region.self = region;
      region.value = reference;
    }
    switch (pick(3)) {
      case 0:
        return fn;
      case 1: {
        const gate = plan.promise('exposure');
        gate.resolve(fn);
        return gate.promise;
      }
      default:
        return plan.stream([fn]);
    }
  },
  // Every kind of value the writer can send, beside a cycle and a loading
  // client reference.
  async 'all value kinds'(plan) {
    const {reference} = await plan.clientReference('ready');
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = (plan.seed * 7 + i) % 256;
    }
    const blob = new Blob([bytes, '🙂'], {type: 'application/octet-stream'});
    const form = new FormData();
    form.append('repeated', 'first');
    form.append('repeated', 'second');
    form.append('file', blob, 'source.bin');
    const atoms = [
      null,
      true,
      -0,
      NaN,
      Infinity,
      -Infinity,
      1234567890123456789n,
      '$escaped\n🙂',
      '🙂'.repeat(1100),
      Symbol.for('flight-fuzz'),
      new Date(1700000000000 + plan.seed),
      buffer,
      new Uint8Array(buffer, 3, 9),
      new Int16Array(buffer, 4, 4),
      new Float32Array([1.5, -2.25]),
      new DataView(buffer, 5, 7),
      new BigInt64Array([42n, -1n]),
      blob,
      form,
      plan.hostElement('span', {title: 'atom'}, '<span title="atom"></span>'),
      reference,
    ];
    const cycle = {atoms};
    cycle.self = cycle;
    atoms.push(cycle);
    return cycle;
  },
  // A server component whose body resolves after the rest of the response.
  async 'server component'(plan) {
    const {reference} = await plan.clientReference('ready');
    const element = plan.serverElement('<i>body</i>', () =>
      ReactServer.createElement('i', null, 'body'),
    );
    return {element, data: {value: reference}};
  },
  // A server component that throws.
  async 'failing server component'(plan) {
    const {reference} = await plan.clientReference('ready');
    const error = plan.error('component failed');
    const element = plan.serverElement(
      undefined,
      () => {
        throw error;
      },
      {failure: error},
    );
    return {element, data: {value: reference}};
  },
  // An async client module whose evaluation fails after its chunk loaded.
  async 'module evaluation failure'(plan) {
    const {reference} = await plan.clientReference('ready', {
      asynchronous: true,
      evaluationError: new Error('evaluation failed'),
    });
    const {reference: other} = await plan.clientReference('other');
    return {broken: {value: reference}, fine: {value: other}};
  },
  // A client module that fails to load after the writer has finished.
  async 'module failing after eof'(plan) {
    const {reference, loadService} = await plan.clientReference('ready');
    const {reference: other} = await plan.clientReference('other');
    const error = new Error('load failed after eof');
    loadService.error = error;
    const load = loadService.run;
    loadService.run = () => load(error);
    plan.afterEof = true;
    return {broken: {value: reference}, fine: {value: other}};
  },
  // Writer gap: a stream item that is an array containing itself is written
  // without a name for its own back-reference.
  async 'streamed array containing itself'(plan) {
    const array = [];
    array.push(array);
    return plan.stream([array]);
  },
  // Writer gap in DEV: a suspended server component element that occurs twice
  // reuses its pending task without a lazy boundary.
  async 'shared server component'(plan) {
    const element = plan.serverElement('<b>shared</b>', () =>
      ReactServer.createElement('b', null, 'shared'),
    );
    return [element, element];
  },
  // A byte stream read with a BYOB reader.
  async 'byte stream'(plan) {
    const {reference} = await plan.clientReference('ready');
    const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])];
    return {bytes: plan.byteStream(chunks), data: {value: reference}};
  },
  // A client that cancels a stream while the writer is still producing.
  async 'canceled stream'(plan) {
    const {reference} = await plan.clientReference('ready');
    const shared = {value: reference};
    return {stream: plan.canceledStream([shared]), shared};
  },
  // Several regions with overlapping cycles, each with a bound function, an
  // element whose props escape, and a Promise resolving to another region.
  async 'joined regions'(plan) {
    const {pick} = plan;
    const regions = Array.from(
      {length: 3 + pick(4)},
      () => [[], {}, new Set(), new Map()][pick(4)],
    );
    const add = (node, key, value) => {
      if (Array.isArray(node)) {
        node.push(value);
      } else if (node instanceof Set) {
        node.add(value);
      } else if (node instanceof Map) {
        node.set(key, value);
      } else {
        node[key] = value;
      }
    };
    const outcomes = regions.map((_, i) => plan.promise('region ' + i));
    const links = regions.map(() => ({}));
    const elements = regions.map((node, i) =>
      plan.clientElement({index: i, data: links[i]}, {name: 'widget-' + i}),
    );
    for (let i = 0; i < regions.length; i++) {
      const node = regions[i];
      const next = regions[(i + 1) % regions.length];
      const {reference} = await plan.clientReference('label-' + i, {
        asynchronous: pick(2) === 0,
      });
      const {fn} = plan.serverFunction(
        (left, right, name) => ({left, right, name}),
        {
          bound: [node, next, reference],
          label: 'action ' + i,
        },
      );
      links[i].node = node;
      links[i].peer = elements[(i + 1) % regions.length].props;
      add(node, 'label', reference);
      add(node, 'next', next);
      add(node, 'branch', regions[pick(regions.length)]);
      add(node, 'action', fn);
      add(node, 'element', elements[i]);
      add(node, 'props', elements[(i + 1) % regions.length].props);
      add(node, 'future', outcomes[(i + 1) % regions.length].promise);
      plan.service('resolve region ' + i, () =>
        outcomes[i].resolve(new Set([node])),
      );
    }
    const futures = outcomes.map(gate => gate.promise);
    const items = regions.map(node => new Set([node]));
    return pick(2) === 0
      ? {regions, futures, stream: plan.stream(items)}
      : {futures, iterable: plan.asyncIterable(items, items[0])};
  },
  // A cyclic collection is first exposed through two separate Promises.
  async 'cycle exposed by promises'(plan) {
    const {reference} = await plan.clientReference('ready');
    const member = {value: reference};
    const set = new Set([member]);
    member.set = set;
    const first = plan.promise('first');
    const second = plan.promise('second');
    plan.service('resolve first', () => first.resolve(member));
    plan.service('resolve second', () => second.resolve(set));
    return [first.promise, second.promise];
  },
  // Two stream items each wait on their own module.
  async 'stream items waiting on modules'(plan) {
    const {reference: first} = await plan.clientReference('first');
    const {reference: second} = await plan.clientReference('second');
    return plan.stream([new Set([first]), new Set([second])]);
  },
  // A sync iterator over values that are still loading.
  async 'iterator field'(plan) {
    const {reference} = await plan.clientReference('ready');
    const shared = {value: reference};
    return {
      shared,
      iterator: plan.iterator([shared, reference]),
    };
  },
  async 'blob beside a cycle'(plan) {
    const {reference} = await plan.clientReference('ready');
    const blob = new Blob([new Uint8Array([1, 2, 3])], {type: 'text/plain'});
    const array = [blob, reference];
    array.push(array);
    return {array, blob};
  },
  // A client module that is loaded after the writer has finished.
  async 'module after eof'(plan) {
    const {reference} = await plan.clientReference('ready', {
      asynchronous: plan.pick(2) === 0,
    });
    const region = {value: reference};
    region.self = region;
    plan.afterEof = true;
    return region;
  },
  // A server-thrown error travels through a Promise and a stream.
  async 'rejected promise'(plan) {
    const error = plan.error('expected failure');
    const gate = plan.promise('failing');
    plan.service('reject', () => plan.reject(gate, error));
    const {reference} = await plan.clientReference('ready');
    return {failing: gate.promise, fine: {value: reference}};
  },
  // An Error value with a cyclic cause (DEV reads causes; production does not).
  async 'error with cyclic cause'(plan) {
    const {reference} = await plan.clientReference('ready');
    const cell = {value: reference};
    const error = plan.error('cyclic cause');
    error.cause = cell;
    cell.back = error;
    return {error, cell};
  },
};

async function generateShape(plan, name, depth) {
  const {pick} = plan;
  let model = await shapes[name](plan);
  plan.recipe.push(name);
  for (let i = 0; i < depth; i++) {
    const inner = model;
    switch (pick(5)) {
      case 0:
        model = [inner, inner];
        plan.recipe.push('wrapped in a shared array');
        break;
      case 1:
        model = {value: inner, sibling: 'sibling'};
        plan.recipe.push('wrapped in an object');
        break;
      case 2:
        model = new Set([inner, 'sibling']);
        plan.recipe.push('wrapped in a Set');
        break;
      case 3:
        model = new Map([
          [inner, 'value'],
          ['value', inner],
        ]);
        plan.recipe.push('wrapped in a Map as key and value');
        break;
      default: {
        const gate = plan.promise('wrapper ' + i);
        model = {value: gate.promise};
        plan.services.unshift({
          label: 'resolve wrapper ' + i,
          run: () => gate.resolve(inner),
          released: false,
        });
        plan.recipe.push('wrapped in a Promise');
      }
    }
  }
  if (depth > 0 && pick(3) === 0) {
    // The root itself is a Promise, observed through native adoption.
    const gate = plan.promise('root');
    plan.rootPromise = gate.promise;
    plan.rootModel = model;
    model = gate.promise;
    plan.services.unshift({
      label: 'resolve the root Promise',
      run: () => gate.resolve(plan.rootModel),
      released: false,
    });
    plan.recipe.push('root is a Promise');
  }
  plan.model = model;
}

describe.each(['node', 'edge'])('ReactFlightReaderFuzz (%s)', host => {
  let input;

  beforeEach(() => {
    jest.resetModules();
    jest.useRealTimers();
    jest.mock('react', () => require('react/react.react-server'));
    jest.doMock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.' + host),
    );
    WebpackMock = require('./utils/WebpackMock');
    Server = require('react-server-dom-webpack/server.' + host);
    ReactServer = require('react');
    jest.resetModules();
    __unmockReact();
    React = require('react');
    Client = require('react-server-dom-webpack/client.' + host);
    ReactDOMServer = require('react-dom/server.edge');
  });

  afterEach(async () => {
    if (input) {
      await input.dispose();
      input = null;
    }
  });

  function render(element) {
    return ReactDOMServer.renderToReadableStream(element, {
      onError() {},
    }).then(stream => new Response(stream).text());
  }

  // Releases the plan's services one at a time. After each one, every value
  // whose inputs are now all available must arrive before the next release;
  // a missed wakeup cannot be rescued by an unrelated later event.
  async function run(plan, demand) {
    const watched = observer(plan, {render});
    plan.observeProps = watched.observeProps;
    const reported = [];
    input = roundTrip({
      host,
      model: plan.model,
      packetSizes: plan.packetSizes,
      yieldBetweenPackets: plan.yieldBetweenPackets,
      onError(error) {
        const digest = plan.expectedErrors.get(error);
        if (digest === undefined) {
          throw error;
        }
        reported.push(error);
        return digest;
      },
    });
    const adopted = plan.rootPromise !== null;
    const source = adopted ? plan.rootModel : plan.model;
    const root = adopted ? Promise.resolve(input.root) : input.root;
    const progress = async stage => {
      let overdue = [];
      await input.drain(
        () => {
          overdue = watched.overdue();
          return overdue.length === 0;
        },
        () =>
          stage +
          ': due ' +
          overdue.map(entry => entry.path).join(', ') +
          '; not yet released: ' +
          plan.services
            .filter(service => !service.released)
            .map(service => service.label)
            .join(', '),
      );
    };
    if (demand === 'early') {
      watched.attachRoot(root, source, true);
    }
    await input.flush();
    if (demand === 'late') {
      watched.attachRoot(root, source, true);
    }
    await progress('after the first packets');
    const release = async service => {
      service.released = true;
      service.run();
      await progress('after ' + service.label);
    };
    let services = plan.services.slice();
    if (plan.afterEof) {
      // The writer finishes, and the client sees EOF, before any client-side
      // service is released. EOF must not cancel work on values whose rows
      // have all arrived.
      for (let i = 0; i < services.length; i++) {
        if (!services[i].client) {
          await release(services[i]);
        }
      }
      await input.finish();
      input.close();
      await input.flush();
      await progress('after EOF');
      services = services.filter(s => s.client);
    }
    for (let i = 0; i < services.length; i++) {
      await release(services[i]);
    }
    await input.finish();
    if (demand === 'after-eof') {
      input.close();
      await tick();
    }
    if (demand === 'after-services' || demand === 'after-eof') {
      watched.attachRoot(root, source, true);
    }
    await progress('after all services');
    await input.drain(
      () => watched.settled(),
      () => 'every outcome, render and stream item',
    );
    expect(new Set(reported)).toEqual(new Set(plan.expectedErrors.keys()));
    watched.recheck();
    // A second observation of the settled response sees the same values.
    watched.attachRoot(root, source, false);
    await input.drain(
      () => watched.settled(),
      () => 'the second root observation',
    );
    watched.recheck();
  }

  async function runCase(family, seed, demand, variant) {
    const plan = createPlan(seed);
    const {pick} = plan;
    if (family === 'graph' || family === 'graph with a failing module') {
      await generateGraph(plan, {
        rejectModule: family !== 'graph',
      });
      // The service order comes from its own generator so that another
      // variant leaves the graph itself unchanged.
      const order = random((seed ^ Math.imul(variant + 1, 0x9e3779b9)) >>> 0);
      shuffle(plan.services, order);
      plan.packetSizes = [1 + order(8), 17 + order(100), 1024 + order(4096)];
      plan.yieldBetweenPackets = order(2) === 0;
    } else {
      await generateShape(plan, family, variant);
      shuffle(plan.services, pick);
      plan.packetSizes = [1 + pick(9), 17 + pick(100), 1024];
      plan.yieldBetweenPackets = seed % 2 === 0;
    }
    if (plan.rootPromise === null) {
      // A service nothing depends on is released last. Nothing may wait for it.
      const unrelated = plan.promise('unrelated');
      plan.model = {model: plan.model, unrelated: unrelated.promise};
      plan.service('resolve an unrelated Promise', () =>
        unrelated.resolve('end'),
      );
    }
    try {
      await run(plan, demand);
    } catch (error) {
      throw new Error(
        'Replay with FLIGHT_FUZZ_SEED=' +
          seed +
          ' FLIGHT_FUZZ_CASES=1 -t "' +
          [family, seed, demand, variant].join(' ') +
          '"\n' +
          plan.recipe.join('\n') +
          '\nServices: ' +
          plan.services.map(service => service.label).join(', ') +
          '\n' +
          error.stack,
      );
    }
  }

  const caseName = (family, seed, demand, variant) =>
    family + ' seed=' + seed + ' demand=' + demand + ' variant=' + variant;

  // Random graphs combine every gap above. They run once the reader completes
  // values by their contents rather than by chunk.
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('generated graphs', () => {
    seeds.forEach(seed => {
      for (let variant = 0; variant < 2; variant++) {
        const demandCount = sweep ? demands.length : 1;
        for (let d = 0; d < demandCount; d++) {
          ['graph', 'graph with a failing module'].forEach(family => {
            // eslint-disable-next-line jest/valid-title
            it(caseName(family, seed, demands[d], variant), () =>
              runCase(family, seed, demands[d], variant),
            );
          });
        }
      }
    });
  });

  // Shapes the writer or the reader does not handle yet. Each entry says what
  // has to change. A failure in any other shape is a regression.
  const cycleGap =
    'the reader resolves a reference cycle by handing one side the other ' +
    'value while it is still being filled in, so a callback can see a ' +
    'placeholder and a shared value can arrive twice';
  const knownGaps = {
    'shared props': cycleGap,
    'shared props subtree': cycleGap,
    'self element': cycleGap,
    'blob beside a cycle': cycleGap,
    'joined regions': cycleGap,
    'iterator field': cycleGap,
    'rejected promise': cycleGap,
    'all value kinds': cycleGap,
    'server component': cycleGap,
    'failing server component': cycleGap,
    'error with cyclic cause': cycleGap,
    'collection containing itself':
      'a Set or Map whose entries refer back to it waits for its own ' +
      'construction',
    'mutual collections':
      'a Set or Map whose entries refer back to it waits for its own ' +
      'construction',
    'function bound to its container':
      'a Server Function bound to arguments that contain it waits for its ' +
      'own result',
    'function exposes a region':
      'a Server Function bound to arguments that contain it waits for its ' +
      'own result',
    'byte stream':
      'the reader enqueues views of its transport buffer, which a BYOB ' +
      'reader cannot take ownership of',
    'canceled stream':
      'the reader keeps enqueueing into a stream the application canceled',
    'streamed array containing itself':
      'the writer emits a streamed array that contains itself without a ' +
      'name for the back-reference',
    'shared server component': __DEV__
      ? 'in DEV the writer reuses a pending server component task without ' +
        'a lazy boundary'
      : null,
  };

  describe('shapes', () => {
    Object.keys(shapes).forEach(name => {
      const test = knownGaps[name] ? it.skip : it;
      const demandCount = sweep ? demands.length : 1;
      for (let d = 0; d < demandCount; d++) {
        test(caseName(name, firstSeed, demands[d], 0), () =>
          runCase(name, firstSeed, demands[d], 0),
        );
      }
      // Random graphs carry the breadth of a sweep; shapes sample it.
      seeds
        .filter((seed, i) => !sweep || i % 4 === 0)
        .forEach(seed => {
          const pick = random(seed);
          const demand = demands[pick(demands.length)];
          const depth = 1 + pick(3);
          test(caseName(name, seed, demand, depth), () =>
            runCase(name, seed, demand, depth),
          );
        });
    });
  });
});
