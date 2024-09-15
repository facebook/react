/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Don't wait before processing work on the server.
// TODO: we can replace this with FlightServer.act().
global.setTimeout = cb => cb();

let clientExports;
let turbopackMap;
let turbopackModules;
let React;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let use;

describe('ReactFlightTurbopackDOMEdge', () => {
  beforeEach(() => {
    jest.resetModules();

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-turbopack/server', () =>
      require('react-server-dom-turbopack/server.edge'),
    );

    const TurbopackMock = require('./utils/TurbopackMock');
    clientExports = TurbopackMock.clientExports;
    turbopackMap = TurbopackMock.turbopackMap;
    turbopackModules = TurbopackMock.turbopackModules;

    ReactServerDOMServer = require('react-server-dom-turbopack/server.edge');

    jest.resetModules();
    __unmockReact();

    React = require('react');
    ReactDOMServer = require('react-dom/server.edge');
    ReactServerDOMClient = require('react-server-dom-turbopack/client.edge');
    use = React.use;
  });

  async function readResult(stream) {
    const reader = stream.getReader();
    let result = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return result;
      }
      result += Buffer.from(value).toString('utf8');
    }
  }

  it('should allow an alternative module mapping to be used for SSR', async () => {
    function ClientComponent() {
      return <span>Client Component</span>;
    }
    // The Client build may not have the same IDs as the Server bundles for the same
    // component.
    const ClientComponentOnTheClient = clientExports(ClientComponent);
    const ClientComponentOnTheServer = clientExports(ClientComponent);

    // In the SSR bundle this module won't exist. We simulate this by deleting it.
    const clientId = turbopackMap[ClientComponentOnTheClient.$$id].id;
    delete turbopackModules[clientId];

    // Instead, we have to provide a translation from the client meta data to the SSR
    // meta data.
    const ssrMetadata = turbopackMap[ClientComponentOnTheServer.$$id];
    const translationMap = {
      [clientId]: {
        '*': ssrMetadata,
      },
    };

    function App() {
      return <ClientComponentOnTheClient />;
    }

    const stream = ReactServerDOMServer.renderToReadableStream(
      <App />,
      turbopackMap,
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      ssrManifest: {
        moduleMap: translationMap,
        moduleLoading: null,
      },
    });

    function ClientRoot() {
      return use(response);
    }

    const ssrStream = await ReactDOMServer.renderToReadableStream(
      <ClientRoot />,
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual('<span>Client Component</span>');
  });
});
