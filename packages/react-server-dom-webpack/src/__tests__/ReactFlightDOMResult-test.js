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

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

let clientExports;
let webpackMap;
let webpackModuleLoading;
let React;
let ReactDOMServer;
let ReactDOMFizzStatic;
let FlightReactDOM;
let ReactServer;
let ReactServerDOMServer;
let ReactServerDOMStaticServer;
let ReactServerDOMClient;
let Stream;
let serverAct;
let FlightOracle;

// RESULT_SEEDS=first-last runs a different range, e.g. to hunt or replay.
const SEED_RANGE = (process.env.RESULT_SEEDS || '1-40').split('-').map(Number);
const FIRST_SEED = SEED_RANGE[0];
const SEEDS = SEED_RANGE[1];
// Each scenario test renders every seed a few times over.
jest.setTimeout(process.env.RESULT_SEEDS ? 30 * 60 * 1000 : 60 * 1000);

describe('ReactFlightDOMResult', () => {
  let stackTraceLimit;
  beforeEach(() => {
    // Fizz escapes an error's stack into the HTML in DEV; a deep generated
    // tree produces one long enough to trip the test loop guard.
    stackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 20;
    jest.resetModules();

    patchSetImmediate();
    serverAct = require('internal-test-utils').serverAct;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      jest.requireActual('react-server-dom-webpack/server.node'),
    );
    jest.mock('react-server-dom-webpack/static', () =>
      jest.requireActual('react-server-dom-webpack/static.node'),
    );
    ReactServer = require('react');
    FlightReactDOM = require('react-dom');
    ReactServerDOMServer = require('react-server-dom-webpack/server');
    ReactServerDOMStaticServer = require('react-server-dom-webpack/static');

    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModuleLoading = WebpackMock.moduleLoading;

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.unmock('react-server-dom-webpack/static');
    jest.mock('react-server-dom-webpack/client', () =>
      jest.requireActual('react-server-dom-webpack/client.node'),
    );

    React = require('react');
    ReactDOMServer = require('react-dom/server.node');
    ReactDOMFizzStatic = require('react-dom/static');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Stream = require('stream');
    FlightOracle = require('./utils/FlightOracle');
  });

  afterEach(() => {
    Error.stackTraceLimit = stackTraceLimit;
  });

  let moduleCount = 0;

  // Client Components shared by every generated scenario. `Show` renders a
  // description of its props so the HTML reflects the data it received;
  // `Box` renders children passed through a Client Component. A module
  // listed in `late` loads its chunk when the scheduler settles it, so the
  // consumers have to wait for it, as they do on a server's first request.
  function createClientComponents(scheduler, late) {
    const {describeProps} = FlightOracle;
    function Show({value}) {
      // Capped: the test loop guard trips on escaping a longer text.
      return React.createElement(
        'pre',
        null,
        describeProps(value, React.use).slice(0, 3000),
      );
    }
    function Box({label, children}) {
      return React.createElement('section', {'data-label': label}, children);
    }
    function exportModule(Component, name) {
      if (late === undefined || late.indexOf(name) === -1) {
        return clientExports(Component);
      }
      const chunkId = name + '-' + moduleCount++;
      return clientExports(
        Component,
        chunkId,
        chunkId + '.js',
        scheduler.defer(resolve => resolve()),
      );
    }
    const ShowReference = exportModule(Show, 'Show');
    const BoxReference = exportModule(Box, 'Box');
    // The SSR bundle loads the same module the server referenced.
    const moduleMap = {};
    const references = [ShowReference, BoxReference];
    for (let i = 0; i < references.length; i++) {
      const metadata = webpackMap[references[i].$$id];
      moduleMap[metadata.id] = {'*': metadata};
    }
    return {
      Show: ShowReference,
      Box: BoxReference,
      serverConsumerManifest: {moduleMap, moduleLoading: webpackModuleLoading},
      nameOf(fn) {
        if (fn === Show) return 'Show';
        if (fn === Box) return 'Box';
        return fn.name;
      },
    };
  }

  function createScenario(seed, options) {
    const rng = FlightOracle.createRng(seed);
    const scheduler = FlightOracle.createScheduler(rng);
    const late = ['Show', 'Box'].filter(() => rng.int(2) === 1);
    const components = createClientComponents(scheduler, late);
    const counts = {renders: 0};
    const {model, kind} = FlightOracle.generateModel(
      rng,
      {
        React: ReactServer,
        Show: components.Show,
        Box: components.Box,
        scheduler,
        onRender() {
          counts.renders++;
        },
      },
      options,
    );
    return {model, kind, scheduler, components, counts};
  }

  async function settleAll(scheduler) {
    while (scheduler.hasPending()) {
      await serverAct(() => {
        scheduler.settleOne();
      });
    }
  }

  function onError(error) {
    return 'digest(' + (error && error.message) + ')';
  }

  // The serializer's messages describe where the value sat, with detail a
  // consumer that never serialized cannot reproduce; the first line is the
  // error itself.
  function firstLines(errors) {
    return errors.map(error => String(error.message).split('\n')[0]).sort();
  }

  async function readDirect(scenario, reported) {
    const readable = new Stream.PassThrough();
    await serverAct(() => {
      ReactServerDOMServer.renderToPipeableStream(scenario.model, webpackMap, {
        onError(error) {
          if (reported) reported.push(error);
          return onError(error);
        },
      }).pipe(readable);
    });
    const response = ReactServerDOMClient.createFromNodeStream(
      readable,
      scenario.components.serverConsumerManifest,
    );
    await settleAll(scenario.scheduler);
    await serverAct(() => {});
    // Boxed so that awaiting this function does not adopt the thenable.
    return {response};
  }

  // Serializes a Result to the wire instead of rendering the model directly.
  async function readResultStream(scenario) {
    const readable = new Stream.PassThrough();
    await serverAct(() => {
      const result = ReactServerDOMServer.renderToResult(scenario.model, {
        onError,
      });
      ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
        readable,
      );
    });
    const response = ReactServerDOMClient.createFromNodeStream(
      readable,
      scenario.components.serverConsumerManifest,
    );
    await settleAll(scenario.scheduler);
    await serverAct(() => {});
    return {response};
  }

  // Reads a Result in process, the way the HTML renderer consumes it.
  async function readResultDirect(scenario, reported) {
    let response;
    await serverAct(() => {
      const result = ReactServerDOMServer.renderToResult(scenario.model, {
        onError(error) {
          if (reported) reported.push(error);
          return onError(error);
        },
      });
      response = ReactServerDOMClient.createFromResult(result, {
        clientManifest: webpackMap,
        serverConsumerManifest: scenario.components.serverConsumerManifest,
      });
    });
    await settleAll(scenario.scheduler);
    await serverAct(() => {});
    return {response};
  }

  // Both consumers on one Result, the way a page render uses it: the HTML
  // renderer reads it in process while the hydration data is serialized.
  async function readResultBoth(scenario) {
    let inProcess;
    const readable = new Stream.PassThrough();
    await serverAct(() => {
      const result = ReactServerDOMServer.renderToResult(scenario.model, {
        onError,
      });
      inProcess = ReactServerDOMClient.createFromResult(result, {
        clientManifest: webpackMap,
        serverConsumerManifest: scenario.components.serverConsumerManifest,
      });
      ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
        readable,
      );
    });
    const stream = ReactServerDOMClient.createFromNodeStream(
      readable,
      scenario.components.serverConsumerManifest,
    );
    await settleAll(scenario.scheduler);
    await serverAct(() => {});
    return {inProcess, stream};
  }

  async function renderHTML(response) {
    function Root() {
      return React.use(response);
    }
    // Fizz reports one error per boundary, the first it meets; with two
    // erroring children, which one that is follows render order, and so
    // whether a child was lazy. Only the HTML is compared, without the
    // message and stack it carries in DEV.
    let result;
    try {
      result = await serverAct(() =>
        ReactDOMFizzStatic.prerender(React.createElement(Root), {
          onError() {},
        }),
      );
    } catch (error) {
      // No boundary caught a rejected root; the shell itself failed. With
      // two erroring children, which error reaches the shell first follows
      // render order as above.
      return {shellError: true};
    }
    const reader = result.prelude.getReader();
    let html = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        // DEV error boundaries carry stacks whose frames depend on which
        // render path threw. Fizz separates a text node from a following
        // lazy node with a comment, and whether a node is lazy or inline
        // depends on timing, as it does between two wire renders.
        return {
          html: html
            .replace(/ data-(msg|c?stck)="[^"]*"/g, '')
            .replace(/<!-- -->/g, ''),
        };
      }
      html += Buffer.from(value).toString('utf8');
    }
  }

  async function observe(scenario, {response}) {
    const value = await FlightOracle.normalize(response, scenario.components);
    const html = scenario.kind === 'tree' ? await renderHTML(response) : null;
    return {value, html};
  }

  // RESULT_DUMP=seed prints a generated model and its wire, to debug a seed.
  if (process.env.RESULT_DUMP) {
    it('dumps a scenario', async () => {
      const a = createScenario(+process.env.RESULT_DUMP, {
        allowErrors: process.env.RESULT_DUMP_ERRORS === '1',
      });
      const readable = new Stream.PassThrough();
      let wire = '';
      readable.on('data', c => (wire += c.toString('utf8')));
      await serverAct(() => {
        ReactServerDOMServer.renderToPipeableStream(a.model, webpackMap, {
          onError,
        }).pipe(readable);
      });
      await settleAll(a.scheduler);
      await serverAct(() => {});
      process.stdout.write(
        'MODEL\n' + FlightOracle.describeModel(a.model) + '\nWIRE\n' + wire,
      );
    });
  }

  it('normalizes generated scenarios the same way across independent renders', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {});
      const first = await observe(a, await readDirect(a));
      const b = createScenario(seed, {});
      const second = await observe(b, await readDirect(b));
      expect(second).toEqual(first);
    }
  });

  it('runs a Server Component once when serializing a Result that expanded it', async () => {
    let calls = 0;
    const settled = Promise.resolve('data');
    function Inner() {
      calls++;
      return ReactServer.use(settled);
    }
    const element = <Inner />;
    const result = ReactServerDOMServer.renderToResult({
      a: element,
      b: element,
    });
    // A consumer expanded the element before the stream started; the stream
    // must read that expansion instead of rendering again. use() replays the
    // component once after the promise settles, as it does in any renderer.
    const expansion = result.expand(element);
    expect(expansion).not.toBe(null);
    await serverAct(() => {});
    expect(calls).toBe(2);

    const readable = new Stream.PassThrough();
    await serverAct(() => {
      ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
        readable,
      );
    });
    const response = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: null,
    });
    const model = await response;
    expect(model.a).toBe('data');
    expect(model.b).toBe('data');
    expect(calls).toBe(2);
  });

  it('serializes a Result the same as rendering the model directly', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {});
      const viaResult = await observe(b, await readResultStream(b));
      expect(viaResult).toEqual(direct);
    }
  });

  async function prerenderToResponse(model, components, reported) {
    let prelude;
    await serverAct(async () => {
      const prerendered =
        await ReactServerDOMStaticServer.prerenderToNodeStream(
          model,
          webpackMap,
          {
            onError(error) {
              if (reported) reported.push(error);
              return onError(error);
            },
          },
        );
      prelude = prerendered.prelude;
    });
    const response = ReactServerDOMClient.createFromNodeStream(
      prelude,
      components.serverConsumerManifest,
    );
    await serverAct(() => {});
    return {response};
  }

  it('prerenders a Result the same as prerendering the model directly', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {});
      await settleAll(a.scheduler);
      const direct = await observe(
        a,
        await prerenderToResponse(a.model, a.components),
      );
      const b = createScenario(seed, {});
      await settleAll(b.scheduler);
      const result = ReactServerDOMServer.renderToResult(b.model, {onError});
      const viaResult = await observe(
        b,
        await prerenderToResponse(result, b.components),
      );
      expect(viaResult).toEqual(direct);
    }
  });

  it('aborting a prerender of a Result halts its stream and nothing else', async () => {
    const components = createClientComponents();
    let resolveGreeting;
    const greeting = new Promise(resolve => {
      resolveGreeting = resolve;
    });
    async function Greeting() {
      return ReactServer.createElement(components.Box, null, await greeting);
    }
    const errors = [];
    const controller = new AbortController();
    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(Greeting, null),
      {
        onError(error) {
          errors.push(error.message);
        },
      },
    );
    const inProcess = ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    const {pending} = await serverAct(() => ({
      pending: ReactServerDOMStaticServer.prerenderToNodeStream(
        result,
        webpackMap,
        {signal: controller.signal},
      ),
    }));
    await serverAct(() => controller.abort('boom'));
    const {prelude} = await pending;
    expect(errors).toEqual([]);

    // The prelude leaves the pending component unresolved; the Result and
    // its in-process consumer go on and get it when it settles.
    const stream = ReactServerDOMClient.createFromNodeStream(
      prelude,
      components.serverConsumerManifest,
    );
    const html = renderHTML(stream);
    await serverAct(() => resolveGreeting('hello'));
    expect(await renderHTML(inProcess)).toEqual({
      html: '<section>hello</section>',
    });
    expect(await html).toEqual({shellError: true});
  });

  it('reads a Result in process the same as rendering the model directly', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {});
      const inProcess = await observe(b, await readResultDirect(b));
      expect(inProcess).toEqual(direct);
    }
  });

  it('reads a Result with errors in process the same as rendering the model directly', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {allowErrors: true});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {allowErrors: true});
      const inProcess = await observe(b, await readResultDirect(b));
      expect(inProcess).toEqual(direct);
    }
  });

  it('serves both consumers of one Result without rendering a component twice', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {allowErrors: seed % 2 === 0});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {allowErrors: seed % 2 === 0});
      const alone = await observe(b, await readResultDirect(b));
      expect(alone).toEqual(direct);
      const c = createScenario(seed, {allowErrors: seed % 2 === 0});
      const {inProcess, stream} = await readResultBoth(c);
      expect(await observe(c, {response: inProcess})).toEqual(direct);
      expect(await observe(c, {response: stream})).toEqual(direct);
      // use() replays a component after its promise settles, so the count is
      // not the number of components; it is the same as with one consumer.
      expect(c.counts.renders).toBe(b.counts.renders);
    }
  });

  it('rejects the values the wire rejects, reporting the same errors', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      // Shallow, so the message describing an invalid value's parent stays
      // under the test environment's loop iteration cap when Fizz escapes it.
      const a = createScenario(seed, {allowInvalid: true, maxDepth: 3});
      const directErrors = [];
      await observe(a, await readDirect(a, directErrors));
      const b = createScenario(seed, {allowInvalid: true, maxDepth: 3});
      const inProcessErrors = [];
      await observe(b, await readResultDirect(b, inProcessErrors));
      expect(firstLines(inProcessErrors)).toEqual(firstLines(directErrors));
    }
  });

  // Encoding a form action suspends while bound arguments are serialized.
  async function encodeFormActionOf(fn) {
    while (true) {
      try {
        const encoded = fn.$$FORM_ACTION('p');
        return {
          name: encoded.name,
          method: encoded.method,
          // Field order follows when each bound argument resolved.
          data:
            encoded.data === null
              ? null
              : Array.from(encoded.data.entries()).sort(),
        };
      } catch (thrown) {
        if (thrown && typeof thrown.then === 'function') {
          await thrown;
          continue;
        }
        throw thrown;
      }
    }
  }

  it('reads Server References as the same callable proxies the wire gives', async () => {
    const components = createClientComponents();
    const save = ReactServerDOMServer.registerServerReference(
      function save(a, b) {
        return a + b;
      },
      'actions',
      'save',
    );
    const bound = save.bind(null, {prefix: 'x', when: new Date(0)});
    const model = {
      element: ReactServer.createElement(components.Show, {
        value: {save, bound},
      }),
    };

    const scenario = {
      model,
      kind: 'data',
      scheduler: FlightOracle.createScheduler(FlightOracle.createRng(1)),
      components,
    };
    const direct = (await (await readDirect(scenario)).response).element.props
      .value;
    const inProcess = (await (await readResultDirect(scenario)).response)
      .element.props.value;

    const names = ['save', 'bound'];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      expect(typeof inProcess[name]).toBe('function');
      expect(await encodeFormActionOf(inProcess[name])).toEqual(
        await encodeFormActionOf(direct[name]),
      );
    }
    // Calling a Server Function during the HTML render is an error there too.
    expect(() => inProcess.save()).toThrow(
      'Server Functions cannot be called during initial render.',
    );
  });

  it('aborting a Result errors what is still pending in every consumer', async () => {
    const components = createClientComponents();
    const errors = [];
    const never = new Promise(() => {});
    let cacheSignal;
    function Done() {
      cacheSignal = ReactServer.cacheSignal();
      return 'done';
    }
    async function Pending() {
      await never;
      return 'never';
    }
    const controller = new AbortController();
    const result = ReactServerDOMServer.renderToResult(
      {
        done: ReactServer.createElement(Done, null),
        pending: ReactServer.createElement(Pending, null),
        later: ReactServer.createElement(Pending, {key: 'later'}),
      },
      {
        onError(error) {
          errors.push(error.message);
          return 'digest(' + error.message + ')';
        },
        signal: controller.signal,
      },
    );
    // One consumer has started reading, the other is the hydration stream.
    const inProcess = ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    const readable = new Stream.PassThrough();
    await serverAct(() => {
      ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
        readable,
      );
    });
    const stream = ReactServerDOMClient.createFromNodeStream(
      readable,
      components.serverConsumerManifest,
    );
    const root = await inProcess;
    expect(root.done).toBe('done');
    expect(cacheSignal.aborted).toBe(false);

    await serverAct(() => controller.abort(new Error('gone')));

    expect(cacheSignal.aborted).toBe(true);
    // The abort is reported once, and both consumers see it on the pending
    // slot with the same digest while the finished one stays readable.
    expect(errors).toEqual(['gone']);
    let caught;
    try {
      root.pending._init(root.pending._payload);
    } catch (error) {
      caught = error;
    }
    expect(caught.digest).toBe('digest(gone)');
    expect(caught.message).toBe(
      __DEV__
        ? 'gone'
        : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.',
    );
    const streamed = await stream;
    expect(streamed.done).toBe('done');
    let streamedError;
    try {
      streamed.pending._init(streamed.pending._payload);
    } catch (error) {
      streamedError = error;
    }
    expect(streamedError.digest).toBe('digest(gone)');
    // An element first read after the abort errors the same way.
    const afterAbort = result.expand(
      ReactServer.createElement(Pending, {key: 'new'}),
    );
    expect(afterAbort.status).toBe(2);
    expect(afterAbort.digest).toBe('digest(gone)');
    expect(errors).toEqual(['gone']);
  });

  it('aborting a Result reaches a consumer subscribed after the hydration stream', async () => {
    const components = createClientComponents();
    const controller = new AbortController();
    const result = ReactServerDOMServer.renderToResult(
      {promise: new Promise(() => {})},
      {onError: () => 'digest', signal: controller.signal},
    );
    // The stream subscribes to the abort first. Aborting it detaches it
    // while the listeners run, which must not skip the next one.
    const readable = new Stream.PassThrough();
    await serverAct(() => {
      ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
        readable,
      );
    });
    const root = await ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    expect(root.promise.status).toBe('pending');
    await serverAct(() => controller.abort(new Error('gone')));
    expect(root.promise.status).toBe('rejected');
    expect(root.promise.reason.digest).toBe('digest');
  });

  it('hands plain data to the in-process consumer by identity', async () => {
    const components = createClientComponents();
    const data = {items: [1, 2, {deep: new Map([['k', new Date(0)]])}]};
    let resolveLater;
    const later = new Promise(resolve => {
      resolveLater = resolve;
    });
    function Keyed() {
      return ReactServer.createElement(components.Show, {value: data});
    }
    async function Async() {
      await later;
      return ReactServer.createElement(components.Show, {value: data});
    }
    const model = {
      data,
      direct: ReactServer.createElement(components.Show, {value: data}),
      keyed: ReactServer.createElement(Keyed, {key: 'k'}),
      async: ReactServer.createElement(Async, null),
    };
    const result = ReactServerDOMServer.renderToResult(model);
    const response = ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    const root = await response;
    expect(root.data).toBe(data);
    expect(root.direct.props.value).toBe(data);
    // Under a keyed Server Component the wire path would copy; in process the
    // same object is shared.
    expect(root.keyed.props.value).toBe(data);
    expect(root.keyed.key).toBe('k');
    await serverAct(() => resolveLater());
    const asyncElement = root.async._init(root.async._payload);
    expect(asyncElement.props.value).toBe(data);
  });

  it('reads cyclic data the way the wire does', async () => {
    const components = createClientComponents();
    const pure = {name: 'pure', list: []};
    pure.list.push(pure);
    pure.self = pure;
    const map = new Map();
    map.set('me', map);
    // Holds an element, so the consumer gets a copy; the cycle must point at
    // that copy, not the server object.
    const copied = {icon: ReactServer.createElement(components.Box, null)};
    copied.ring = [copied, new Set([copied])];
    const model = {
      pure,
      map,
      copied,
      element: ReactServer.createElement(components.Show, {value: copied}),
    };
    const result = ReactServerDOMServer.renderToResult(model);
    const response = ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    const root = await response;
    // A cycle closes on the consumer's value, which is a copy as on the wire.
    expect(root.pure.name).toBe('pure');
    expect(root.pure.self).toBe(root.pure);
    expect(root.pure.list[0]).toBe(root.pure);
    expect(root.map.get('me')).toBe(root.map);
    expect(root.copied).not.toBe(copied);
    // A client element's type is a lazy that requires the module on read.
    const iconType = root.copied.icon.type;
    expect(components.nameOf(iconType._init(iconType._payload))).toBe('Box');
    expect(root.copied.ring[0]).toBe(root.copied);
    expect(Array.from(root.copied.ring[1])[0]).toBe(root.copied);
    expect(root.element.props.value).toBe(root.copied);
  });

  it('settles the root with the output of a pending root Server Component', async () => {
    let resolveLater;
    const later = new Promise(resolve => {
      resolveLater = resolve;
    });
    async function Outer() {
      await later;
      return ReactServer.createElement(Inner, null);
    }
    async function Inner() {
      await later;
      return ReactServer.createElement('p', null, 'done');
    }
    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(Outer, null),
    );
    const response = ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: {moduleMap: {}, moduleLoading: null},
    });
    expect(response.status).toBe('pending');
    await serverAct(() => resolveLater());
    const root = await response;
    expect(root.type).toBe('p');
    expect(root.props.children).toBe('done');
  });

  // Renders HTML the way a framework does: the consumer is created from
  // inside a component during the Fizz render.
  async function renderHTMLFromWithinFizz(getResponse) {
    let response = null;
    function Root() {
      if (response === null) {
        response = getResponse();
      }
      return React.use(response);
    }
    const output = new Stream.PassThrough();
    let html = '';
    output.setEncoding('utf8');
    output.on('data', chunk => {
      html += chunk;
    });
    const done = new Promise(resolve => output.on('end', resolve));
    await serverAct(() => {
      const {pipe} = ReactDOMServer.renderToPipeableStream(
        React.createElement(Root),
        {
          onAllReady() {
            pipe(output);
          },
        },
      );
    });
    await done;
    return html;
  }

  it('dispatches hints into the renderer consuming the Result', async () => {
    const components = createClientComponents();
    let resolveLater;
    const later = new Promise(resolve => {
      resolveLater = resolve;
    });
    async function Page() {
      FlightReactDOM.preload('/before.css', {as: 'style'});
      await later;
      FlightReactDOM.preload('/after.css', {as: 'style'});
      return ReactServer.createElement(components.Box, {label: 'page'}, 'hi');
    }

    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(Page, null),
    );
    const htmlPromise = renderHTMLFromWithinFizz(() =>
      ReactServerDOMClient.createFromResult(result, {
        clientManifest: webpackMap,
        serverConsumerManifest: components.serverConsumerManifest,
      }),
    );
    await serverAct(() => resolveLater());
    const html = await htmlPromise;
    expect(html).toContain('<link rel="preload" href="/before.css" as="style"');
    expect(html).toContain('<link rel="preload" href="/after.css" as="style"');
    expect(html).toContain('<section data-label="page">hi</section>');
  });

  it('resolves a lazy element type the way the serializer does', async () => {
    const components = createClientComponents();
    let resolveLater;
    const later = new Promise(resolve => {
      resolveLater = resolve;
    });
    // A Flight client in the server layer hands out lazies for module
    // references; the serializer resolves such a type before emitting.
    const LazyClient = ReactServer.lazy(() =>
      Promise.resolve({default: components.Box}),
    );
    const LateClient = ReactServer.lazy(() =>
      later.then(() => ({default: components.Box})),
    );
    const LazyServer = ReactServer.lazy(() =>
      Promise.resolve({
        default: function Server({children}) {
          return ReactServer.createElement('section', null, children);
        },
      }),
    );
    // Initialize the first lazy up front so it is already resolved when read.
    try {
      LazyClient._init(LazyClient._payload);
    } catch (x) {
      await x;
    }
    const model = {
      client: ReactServer.createElement(LazyClient, null, 'a'),
      late: ReactServer.createElement(LateClient, null, 'b'),
      server: ReactServer.createElement(LazyServer, null, 'c'),
    };
    const result = ReactServerDOMServer.renderToResult(model, {onError});
    const root = await ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    const clientType = root.client.type;
    expect(components.nameOf(clientType._init(clientType._payload))).toBe(
      'Box',
    );
    expect(root.late.$$typeof).toBe(Symbol.for('react.lazy'));
    await serverAct(() => resolveLater());
    await serverAct(() => {});
    const late = root.late._init(root.late._payload);
    expect(components.nameOf(late.type._init(late.type._payload))).toBe('Box');
    const server = root.server._init(root.server._payload);
    expect(server.type).toBe('section');
    expect(await renderHTML(Promise.resolve(root.server))).toEqual({
      html: '<section>c</section>',
    });
  });

  it('finishes a half-read object after waiting on a module inside it', async () => {
    const components = createClientComponents();
    let loadChunk;
    const chunk = new Promise(resolve => {
      loadChunk = resolve;
    });
    function Slow() {
      return 'slow';
    }
    const SlowReference = clientExports(Slow, 'slow-chunk', 'slow.js', chunk);
    const metadata = webpackMap[SlowReference.$$id];
    components.serverConsumerManifest.moduleMap[metadata.id] = {'*': metadata};
    // The element before the reference changes for the consumer, so the
    // object is being copied when the reference waits on its chunk.
    const model = {
      tree: ReactServer.createElement(components.Box, null, 'x'),
      G: [SlowReference, null],
      last: 'b',
    };
    const result = ReactServerDOMServer.renderToResult(model, {onError});
    const rootPromise = ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    await serverAct(() => loadChunk());
    const root = await rootPromise;
    expect(root.G[0]).toBe(Slow);
    expect(root.G[1]).toBe(null);
    expect(root.last).toBe('b');
    expect(await renderHTML(Promise.resolve(root.tree))).toEqual({
      html: '<section>x</section>',
    });
  });

  it('reports the error of a stream read in process once, with its digest', async () => {
    const errors = [];
    async function* items() {
      yield 'first';
      throw new Error('broken');
    }
    const result = ReactServerDOMServer.renderToResult(
      {items: items()},
      {
        onError(error) {
          errors.push(error.message);
          return 'digest(' + error.message + ')';
        },
      },
    );
    const root = await ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: {moduleMap: {}, moduleLoading: null},
    });
    const iterator = root.items[Symbol.asyncIterator]();
    expect((await iterator.next()).value).toBe('first');
    let caught;
    try {
      await iterator.next();
    } catch (error) {
      caught = error;
    }
    expect(caught.digest).toBe('digest(broken)');
    expect(caught.message).toBe(
      __DEV__
        ? 'broken'
        : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.',
    );
    // The hydration stream reports the same error through the same digest.
    const readable = new Stream.PassThrough();
    await serverAct(() => {
      ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
        readable,
      );
    });
    const streamed = await ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: null,
    });
    const streamedIterator = streamed.items[Symbol.asyncIterator]();
    await streamedIterator.next();
    await expect(streamedIterator.next()).rejects.toMatchObject({
      digest: 'digest(broken)',
    });
    expect(errors).toEqual(['broken']);
  });

  it('keys the items of a streamed fragment like their rows on the wire', async () => {
    const components = createClientComponents();
    async function* items() {
      yield ReactServer.createElement('p', {key: 'a'}, 'a');
      yield ReactServer.createElement('p', {key: 'b'}, 'b');
    }
    // A keyless Server Component renders in an implicit slot; a keyed one
    // wraps the stream in a fragment carrying its key.
    function Implicit() {
      return items();
    }
    function Keyed() {
      return items();
    }
    const model = {
      implicit: ReactServer.createElement(Implicit, null),
      keyed: ReactServer.createElement(Keyed, {key: 'k'}),
    };
    const root = await ReactServerDOMClient.createFromResult(
      ReactServerDOMServer.renderToResult(model, {onError}),
      {
        clientManifest: webpackMap,
        serverConsumerManifest: components.serverConsumerManifest,
      },
    );
    async function readAll(iterable) {
      const read = [];
      const iterator = iterable[Symbol.asyncIterator]();
      while (true) {
        const entry = await iterator.next();
        if (entry.done) {
          return read;
        }
        read.push(entry.value);
      }
    }
    const implicit = await readAll(root.implicit);
    expect(implicit.map(item => item[0].key)).toEqual(['a', 'b']);
    expect(root.keyed.type).toBe(Symbol.for('react.fragment'));
    expect(root.keyed.key).toBe('k');
    const keyed = await readAll(root.keyed.props.children);
    expect(keyed.map(item => item.key)).toEqual(['a', 'b']);
  });

  it('reads an async iterable with the key context of each position', async () => {
    const iterable = {
      async *[Symbol.asyncIterator]() {
        yield ReactServer.createElement('p', {key: 'a'}, 'a');
      },
    };
    function Implicit() {
      return iterable;
    }
    const model = [iterable, ReactServer.createElement(Implicit, null)];
    const root = await ReactServerDOMClient.createFromResult(
      ReactServerDOMServer.renderToResult(model, {onError}),
      {
        clientManifest: webpackMap,
        serverConsumerManifest: {moduleMap: {}, moduleLoading: null},
      },
    );
    const plain = await root[0][Symbol.asyncIterator]().next();
    expect(plain.value.key).toBe('a');
    // The one iteration the Result records serves both positions.
    const implicit = await root[1][Symbol.asyncIterator]().next();
    expect(implicit.value[0].key).toBe('a');
  });

  it('reads a Client Reference module proxy wherever it appears', async () => {
    const components = createClientComponents();
    // Bundlers hand out a proxy whose get trap throws for Symbol keys, so a
    // reference must be recognized before any probe for an iterator.
    const model = {
      inNode: [components.Show, components.Box],
      inData: {component: components.Show},
      element: ReactServer.createElement(components.Show, {
        value: components.Box,
      }),
    };
    const result = ReactServerDOMServer.renderToResult(model, {onError});
    const root = await ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    expect(components.nameOf(root.inNode[0])).toBe('Show');
    expect(components.nameOf(root.inNode[1])).toBe('Box');
    expect(components.nameOf(root.inData.component)).toBe('Show');
    expect(components.nameOf(root.element.props.value)).toBe('Box');
  });

  it('requires a client module when the renderer first reads the element, not before', async () => {
    const components = createClientComponents();
    const required = [];
    const originalRequire = global.__webpack_require__;
    global.__webpack_require__ = id => {
      required.push(id);
      return originalRequire(id);
    };
    let resolveLater;
    const later = new Promise(resolve => {
      resolveLater = resolve;
    });
    async function Late() {
      await later;
      return ReactServer.createElement(components.Box, null, 'late');
    }
    try {
      const model = {
        now: ReactServer.createElement(components.Show, {value: 1}),
        late: ReactServer.createElement(Late, null),
      };
      const result = ReactServerDOMServer.renderToResult(model, {onError});
      const root = await ReactServerDOMClient.createFromResult(result, {
        clientManifest: webpackMap,
        serverConsumerManifest: components.serverConsumerManifest,
      });
      // Reading the tree resolves no module.
      expect(required).toEqual([]);
      const nowType = root.now.type;
      expect(components.nameOf(nowType._init(nowType._payload))).toBe('Show');
      expect(required.length).toBe(1);
      // A subtree that settles while nothing renders it loads nothing.
      await serverAct(() => resolveLater());
      await serverAct(() => {});
      expect(required.length).toBe(1);
      const late = root.late._init(root.late._payload);
      const lateType = late.type;
      expect(components.nameOf(lateType._init(lateType._payload))).toBe('Box');
      expect(required.length).toBe(2);
    } finally {
      global.__webpack_require__ = originalRequire;
    }
  });

  it('resolves a lazy node that settles after the in-process consumer read it', async () => {
    const components = createClientComponents();
    let resolveLater;
    const later = new Promise(resolve => {
      resolveLater = resolve;
    });
    // A lazy in node position, as the Flight client hands out for a row
    // that has not arrived, which is what a cached payload parsed in the
    // server layer holds.
    const lazy = ReactServer.lazy(() =>
      later.then(() => ({
        default: ReactServer.createElement('p', null, 'arrived'),
      })),
    );
    const model = {
      boundary: ReactServer.createElement(
        ReactServer.Suspense,
        {fallback: 'loading'},
        lazy,
      ),
      // The same lazy read a second time, through the memo.
      again: lazy,
    };
    const result = ReactServerDOMServer.renderToResult(model, {onError});
    const root = await ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    const pending = root.boundary.props.children;
    expect(pending.$$typeof).toBe(Symbol.for('react.lazy'));
    expect(() => pending._init(pending._payload)).toThrow();
    await serverAct(() => resolveLater());
    await serverAct(() => {});
    // Settles to the element, not to a lazy for itself.
    const settled = pending._init(pending._payload);
    expect(settled.type).toBe('p');
    expect(settled.props.children).toBe('arrived');
    expect(await renderHTML(Promise.resolve(root.boundary))).toEqual({
      html: '<!--$--><p>arrived</p><!--/$-->',
    });
  });

  it('reports a Server Component that throws a primitive once across consumers', async () => {
    const components = createClientComponents();
    const reported = [];
    function ThrowsUndefined() {
      throw undefined; // eslint-disable-line no-throw-literal
    }
    function ThrowsString() {
      throw 'plain string'; // eslint-disable-line no-throw-literal
    }
    const result = ReactServerDOMServer.renderToResult(
      {
        a: ReactServer.createElement(ThrowsUndefined, null),
        b: ReactServer.createElement(ThrowsString, null),
      },
      {
        onError(error) {
          reported.push(error);
          return 'digest:' + String(error);
        },
      },
    );
    const root = await ReactServerDOMClient.createFromResult(result, {
      clientManifest: webpackMap,
      serverConsumerManifest: components.serverConsumerManifest,
    });
    const readable = new Stream.PassThrough();
    await serverAct(() => {
      ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
        readable,
      );
    });
    const streamed = await ReactServerDOMClient.createFromNodeStream(
      readable,
      components.serverConsumerManifest,
    );
    expect(reported).toEqual([undefined, 'plain string']);
    function digestOf(lazy) {
      try {
        lazy._init(lazy._payload);
      } catch (error) {
        return error.digest;
      }
      return undefined;
    }
    expect(digestOf(root.a)).toBe('digest:undefined');
    expect(digestOf(root.b)).toBe('digest:plain string');
    expect(digestOf(streamed.a)).toBe('digest:undefined');
    expect(digestOf(streamed.b)).toBe('digest:plain string');
  });

  it('serializes a Result with errors the same as rendering the model directly', async () => {
    for (let seed = FIRST_SEED; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {allowErrors: true});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {allowErrors: true});
      const viaResult = await observe(b, await readResultStream(b));
      expect(viaResult).toEqual(direct);
    }
  });
});
