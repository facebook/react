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
let ReactServerDOMClient;
let Stream;
let serverAct;
let FlightOracle;

const SEEDS = 40;

describe('ReactFlightDOMResult', () => {
  beforeEach(() => {
    jest.resetModules();

    patchSetImmediate();
    serverAct = require('internal-test-utils').serverAct;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      jest.requireActual('react-server-dom-webpack/server.node'),
    );
    ReactServer = require('react');
    FlightReactDOM = require('react-dom');
    ReactServerDOMServer = require('react-server-dom-webpack/server');

    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModuleLoading = WebpackMock.moduleLoading;

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
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

  // Client Components shared by every generated scenario. `Show` renders a
  // description of its props so the HTML reflects the data it received;
  // `Box` renders children passed through a Client Component.
  function createClientComponents() {
    const {describeProps} = FlightOracle;
    function Show({value}) {
      return React.createElement('pre', null, describeProps(value, React.use));
    }
    function Box({label, children}) {
      return React.createElement('section', {'data-label': label}, children);
    }
    const ShowReference = clientExports(Show);
    const BoxReference = clientExports(Box);
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
    const components = createClientComponents();
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
    const readable = new Stream.PassThrough({objectMode: true});
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
    const readable = new Stream.PassThrough({objectMode: true});
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
    const readable = new Stream.PassThrough({objectMode: true});
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
    const errors = [];
    let result;
    try {
      result = await serverAct(() =>
        ReactDOMFizzStatic.prerender(React.createElement(Root), {
          onError(error) {
            errors.push({message: error.message, digest: error.digest});
          },
        }),
      );
    } catch (error) {
      // No boundary caught a rejected root; the shell itself failed.
      return {
        shellError: {message: error.message, digest: error.digest},
        errors,
      };
    }
    const reader = result.prelude.getReader();
    let html = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        // DEV error boundaries carry stacks whose frames depend on which
        // render path threw.
        return {html: html.replace(/ data-c?stck="[^"]*"/g, ''), errors};
      }
      html += Buffer.from(value).toString('utf8');
    }
  }

  async function observe(scenario, {response}) {
    const value = await FlightOracle.normalize(response, scenario.components);
    const html = scenario.kind === 'tree' ? await renderHTML(response) : null;
    return {value, html};
  }

  it('normalizes generated scenarios the same way across independent renders', async () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
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

    const readable = new Stream.PassThrough({objectMode: true});
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
    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {});
      const viaResult = await observe(b, await readResultStream(b));
      expect(viaResult).toEqual(direct);
    }
  });

  it('reads a Result in process the same as rendering the model directly', async () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {});
      const inProcess = await observe(b, await readResultDirect(b));
      expect(inProcess).toEqual(direct);
    }
  });

  it('reads a Result with errors in process the same as rendering the model directly', async () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {allowErrors: true});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {allowErrors: true});
      const inProcess = await observe(b, await readResultDirect(b));
      expect(inProcess).toEqual(direct);
    }
  });

  it('serves both consumers of one Result without rendering a component twice', async () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
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
    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {allowInvalid: true});
      const directErrors = [];
      await observe(a, await readDirect(a, directErrors));
      const b = createScenario(seed, {allowInvalid: true});
      const inProcessErrors = [];
      await observe(b, await readResultDirect(b, inProcessErrors));
      expect(firstLines(inProcessErrors)).toEqual(firstLines(directErrors));
    }
  });

  it('hands pure data to the in-process consumer by identity', async () => {
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

  it('serializes a Result with errors the same as rendering the model directly', async () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {allowErrors: true});
      const direct = await observe(a, await readDirect(a));
      const b = createScenario(seed, {allowErrors: true});
      const viaResult = await observe(b, await readResultStream(b));
      expect(viaResult).toEqual(direct);
    }
  });
});
