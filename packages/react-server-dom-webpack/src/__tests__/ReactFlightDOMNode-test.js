/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Don't wait before processing work on the server.
// TODO: we can replace this with FlightServer.act().
global.setImmediate = cb => cb();

let clientExports;
let webpackMap;
let webpackModules;
let React;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;
let use;

describe('ReactFlightDOMNode', () => {
  beforeEach(() => {
    jest.resetModules();
    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModules = WebpackMock.webpackModules;
    React = require('react');
    ReactDOMServer = require('react-dom/server.node');
    ReactServerDOMServer = require('react-server-dom-webpack/server.node');
    ReactServerDOMClient = require('react-server-dom-webpack/client.node');
    Stream = require('stream');
    use = React.use;
  });

  function readResult(stream) {
    return new Promise((resolve, reject) => {
      let buffer = '';
      const writable = new Stream.PassThrough();
      writable.setEncoding('utf8');
      writable.on('data', chunk => {
        buffer += chunk;
      });
      writable.on('error', error => {
        reject(error);
      });
      writable.on('end', () => {
        resolve(buffer);
      });
      stream.pipe(writable);
    });
  }

  // @gate enableUseHook
  it('should allow an alternative module mapping to be used for SSR', async () => {
    function ClientComponent() {
      return <span>Client Component</span>;
    }
    // The Client build may not have the same IDs as the Server bundles for the same
    // component.
    const ClientComponentOnTheClient = clientExports(ClientComponent);
    const ClientComponentOnTheServer = clientExports(ClientComponent);

    // In the SSR bundle this module won't exist. We simulate this by deleting it.
    const clientId = webpackMap[ClientComponentOnTheClient.$$id].id;
    delete webpackModules[clientId];

    // Instead, we have to provide a translation from the client meta data to the SSR
    // meta data.
    const ssrMetadata = webpackMap[ClientComponentOnTheServer.$$id];
    const translationMap = {
      [clientId]: {
        '*': ssrMetadata,
      },
    };

    function App() {
      return <ClientComponentOnTheClient />;
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <App />,
      webpackMap,
    );
    const readable = new Stream.PassThrough();
    const response = ReactServerDOMClient.createFromNodeStream(
      readable,
      translationMap,
    );

    stream.pipe(readable);

    function ClientRoot() {
      return use(response);
    }

    const ssrStream = await ReactDOMServer.renderToPipeableStream(
      <ClientRoot />,
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual('<span>Client Component</span>');
  });
});
