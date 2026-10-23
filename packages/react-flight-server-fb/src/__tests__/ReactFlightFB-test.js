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

const {Writable} = require('stream');

const unsupportedMessage =
  'Server-reference decoding is not supported by the FB Flight bundler.';
const serverReferenceIds = [
  '',
  'UnknownModule#action',
  'FlightServerAction',
  'FlightServerAction#default',
  'FlightServerAction#action',
  'FlightServerAction#constructor',
  'FlightServerAction#__proto__',
  'child_process#exec',
];

let ReactFlightServer;
let bundlerConfig;
let mockModuleEvaluation;
let mockClientComponent;

function replyBody(id) {
  const body = new FormData();
  body.set('0', '"$h1"');
  body.set('1', JSON.stringify({id, bound: null}));
  return body;
}

function expectNoModuleWork() {
  expect(bundlerConfig.preloadModule).not.toHaveBeenCalled();
  expect(bundlerConfig.requireModule).not.toHaveBeenCalled();
  expect(mockModuleEvaluation).not.toHaveBeenCalled();
}

async function renderFlight(model) {
  const chunks = [];
  const destination = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });
  const finished = new Promise((resolve, reject) => {
    destination.on('finish', resolve);
    destination.on('error', reject);
  });
  const {serverAct} = require('internal-test-utils');
  await serverAct(async () => {
    ReactFlightServer.renderToPipeableStream(model).pipe(destination);
  });
  await finished;
  return Buffer.concat(chunks);
}

function loadFlightClient() {
  jest.resetModules();
  __unmockReact();
  return require('react-flight-server-fb/client.browser');
}

describe('ReactFlightFB', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.dontMock('shared/ExecutionEnvironment');
    mockModuleEvaluation = jest.fn();
    mockClientComponent = jest.fn(() => 'client');

    jest.doMock(
      'FlightServerAction',
      () => {
        mockModuleEvaluation();
        return {action: () => 'action'};
      },
      {virtual: true},
    );
    // This ID is only test data. Never load or invoke the real Node builtin.
    jest.doMock('child_process', () => {
      mockModuleEvaluation();
      return {exec: jest.fn()};
    });
    jest.doMock(
      'FlightClientComponent',
      () => ({
        __esModule: true,
        default: mockClientComponent,
        named: mockClientComponent,
      }),
      {virtual: true},
    );
    jest.doMock(
      'react-flight-server-fb/src/client/ReactFlightClientConfigBundlerFB',
      () => {
        const config = jest.requireActual(
          'react-flight-server-fb/src/client/ReactFlightClientConfigBundlerFB',
        );
        return {
          ...config,
          preloadModule: jest.fn(config.preloadModule),
          requireModule: jest.fn(config.requireModule),
        };
      },
    );
    jest.mock('react', () => require('react/react.react-server'));
    require('react-flight-server-fb/src/server/react-flight-dom-server.node');
    ReactFlightServer = require('react-flight-server-fb/src/server/ReactFlightDOMServerNode');
    bundlerConfig = require('react-flight-server-fb/src/client/ReactFlightClientConfigBundlerFB');
  });

  it.each(serverReferenceIds)(
    'rejects reply server reference %s before loading modules',
    async id => {
      await expect(
        Promise.resolve(ReactFlightServer.decodeReply(replyBody(id))),
      ).rejects.toThrow(unsupportedMessage);
      expectNoModuleWork();
    },
  );

  // @gate enableFlightObjectReferences
  it('rejects object server references before loading modules', async () => {
    const body = new FormData();
    body.set('0', '"$H1"');
    body.set('1', JSON.stringify({id: 'FlightServerAction'}));
    await expect(
      Promise.resolve(ReactFlightServer.decodeReply(body)),
    ).rejects.toThrow(unsupportedMessage);
    expectNoModuleWork();
  });

  it.each(serverReferenceIds)(
    'rejects form action %s before loading modules',
    id => {
      const body = new FormData();
      body.set('$ACTION_ID_' + id, '');
      expect(() => ReactFlightServer.decodeAction(body, null)).toThrow(
        unsupportedMessage,
      );
      expectNoModuleWork();
    },
  );

  it('rejects bound form actions before loading modules', () => {
    const body = new FormData();
    body.set('$ACTION_REF_0', '');
    body.set(
      '$ACTION_0:0',
      JSON.stringify({id: 'FlightServerAction#action', bound: ['bound']}),
    );
    expect(() => ReactFlightServer.decodeAction(body, null)).toThrow(
      unsupportedMessage,
    );
    expectNoModuleWork();
  });

  it('rejects server references nested in form-state metadata', () => {
    const body = new FormData();
    body.set('$ACTION_KEY', 'key');
    body.set('$ACTION_REF_0', '');
    body.set(
      '$ACTION_0:0',
      JSON.stringify({id: 'FlightServerAction#action', bound: ['$h1']}),
    );
    body.set(
      '$ACTION_0:1',
      JSON.stringify({id: 'child_process#exec', bound: null}),
    );
    expect(() =>
      ReactFlightServer.decodeFormState('result', body, null),
    ).toThrow(unsupportedMessage);
    expectNoModuleWork();
  });

  it('rejects multipart reply server references before loading modules', async () => {
    const busboy = require('busboy');
    const boundary = 'flight-boundary';
    const parser = busboy({
      headers: {'content-type': 'multipart/form-data; boundary=' + boundary},
    });
    const reply = ReactFlightServer.decodeReplyFromBusboy(parser);
    parser.end(
      '--' +
        boundary +
        '\r\nContent-Disposition: form-data; name="0"\r\n\r\n"$h1"\r\n' +
        '--' +
        boundary +
        '\r\nContent-Disposition: form-data; name="1"\r\n\r\n' +
        JSON.stringify({id: 'FlightServerAction#action', bound: null}) +
        '\r\n--' +
        boundary +
        '--\r\n',
    );
    await expect(Promise.resolve(reply)).rejects.toThrow(unsupportedMessage);
    expectNoModuleWork();
  });

  it('still decodes replies without server references', async () => {
    const value = {message: 'hello', values: [1, null, true]};
    await expect(
      Promise.resolve(ReactFlightServer.decodeReply(JSON.stringify(value))),
    ).resolves.toEqual(value);
    expectNoModuleWork();
  });

  it.each(['named', 'default'])(
    'still loads %s client references on the server',
    exportName => {
      const metadata = {
        $$typeof: Symbol.for('react.client.reference'),
        $$id: 'FlightClientComponent#' + exportName,
        $$hblp: null,
      };
      const reference = bundlerConfig.resolveClientReference(null, metadata);
      expect(reference).toBe(metadata);
      expect(bundlerConfig.preloadModule(reference)).toBe(null);
      expect(bundlerConfig.requireModule(reference)).toBe(mockClientComponent);
    },
  );

  it('still loads browser client references asynchronously', async () => {
    jest.resetModules();
    jest.doMock('shared/ExecutionEnvironment', () => ({canUseDOM: true}));
    const modulePromise = Promise.resolve(mockClientComponent);
    const resource = {
      getModuleIfRequireable: () => null,
      load: () => modulePromise,
    };
    jest.doMock('JSResource', () => () => resource, {virtual: true});
    const config = require('react-flight-server-fb/src/client/ReactFlightClientConfigBundlerFB');
    const reference = config.resolveClientReference(null, {
      $$typeof: Symbol.for('react.client.reference'),
      $$id: 'FlightClientComponent',
      $$hblp: null,
    });
    expect(config.preloadModule(reference)).toBe(modulePromise);
    await modulePromise;
    expect(config.requireModule(reference)).toBe(mockClientComponent);
    expect(() =>
      config.resolveServerReference(null, 'FlightServerAction#action'),
    ).toThrow(unsupportedMessage);
  });

  it('still serializes client references and bound server actions as browser proxies', async () => {
    const action = ReactFlightServer.registerServerReference(
      () => 'server result',
      'FlightServerAction#action',
    );
    // This is the enumerable metadata emitted by the FB "use client" transform.
    const client = {
      $$typeof: Symbol.for('react.client.reference'),
      $$id: 'FlightClientComponent#named',
      $$hblp: null,
    };
    const wire = await renderFlight({
      client,
      action,
      bound: action.bind(null, 'bound'),
    });
    const ReactFlightClient = loadFlightClient();
    const callServer = jest.fn(async (id, args) => ({id, args}));
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(wire));
        controller.close();
      },
    });
    const decoded = await ReactFlightClient.createFromReadableStream(stream, {
      callServer,
    });
    expect(decoded.client).toBe(mockClientComponent);
    await expect(decoded.action('argument')).resolves.toEqual({
      id: 'FlightServerAction#action',
      args: ['argument'],
    });
    await expect(decoded.bound('argument')).resolves.toEqual({
      id: 'FlightServerAction#action',
      args: ['bound', 'argument'],
    });
    expect(mockModuleEvaluation).not.toHaveBeenCalled();
  });
});
