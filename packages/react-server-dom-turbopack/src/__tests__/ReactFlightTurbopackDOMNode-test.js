/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

let clientExports;
let turbopackMap;
let turbopackModules;
let turbopackModuleLoading;
let React;
let ReactDOMServer;
let ReactServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;
let use;
let serverAct;

const streamOptions = {
  objectMode: true,
};

describe('ReactFlightTurbopackDOMNode', () => {
  beforeEach(() => {
    jest.resetModules();

    patchSetImmediate();
    serverAct = require('internal-test-utils').serverAct;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-turbopack/server', () =>
      require('react-server-dom-turbopack/server.node'),
    );
    ReactServer = require('react');
    ReactServerDOMServer = require('react-server-dom-turbopack/server');

    const TurbopackMock = require('./utils/TurbopackMock');
    clientExports = TurbopackMock.clientExports;
    turbopackMap = TurbopackMock.turbopackMap;
    turbopackModules = TurbopackMock.turbopackModules;
    turbopackModuleLoading = TurbopackMock.moduleLoading;

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-turbopack/server');
    jest.mock('react-server-dom-turbopack/client', () =>
      require('react-server-dom-turbopack/client.node'),
    );

    React = require('react');
    ReactDOMServer = require('react-dom/server.node');
    ReactServerDOMClient = require('react-server-dom-turbopack/client');
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

  function normalizeCodeLocInfo(str) {
    return (
      str &&
      str.replace(/^ +(?:at|in) ([\S]+)[^\n]*/gm, function (m, name) {
        return '    in ' + name + (/\d/.test(m) ? ' (at **)' : '');
      })
    );
  }

  it('should allow an alternative module mapping to be used for SSR', async () => {
    function ClientComponent() {
      return <span>Client Component</span>;
    }
    // The Client build may not have the same IDs as the Server bundles for the same
    // component.
    const ClientComponentOnTheClient = clientExports(
      ClientComponent,
      'path/to/chunk.js',
    );
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

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(<App />, turbopackMap),
    );
    const readable = new Stream.PassThrough();

    stream.pipe(readable);

    let response;
    function ClientRoot() {
      if (!response) {
        response = ReactServerDOMClient.createFromNodeStream(readable, {
          moduleMap: translationMap,
          moduleLoading: turbopackModuleLoading,
        });
      }
      return use(response);
    }

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(<ClientRoot />),
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual(
      '<script src="/prefix/path/to/chunk.js" async=""></script><span>Client Component</span>',
    );
  });

  // @gate __DEV__
  it('can transport debug info through a separate debug channel', async () => {
    function Thrower() {
      throw new Error('ssr-throw');
    }

    const ClientComponentOnTheClient = clientExports(
      Thrower,
      123,
      'path/to/chunk.js',
    );

    const ClientComponentOnTheServer = clientExports(Thrower);

    function App() {
      return ReactServer.createElement(
        ReactServer.Suspense,
        null,
        ReactServer.createElement(ClientComponentOnTheClient, null),
      );
    }

    const debugReadable = new Stream.PassThrough(streamOptions);

    const rscStream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(
        ReactServer.createElement(App, null),
        turbopackMap,
        {
          debugChannel: new Stream.Writable({
            write(chunk, encoding, callback) {
              debugReadable.write(chunk, encoding);
              callback();
            },
          }),
        },
      ),
    );

    const readable = new Stream.PassThrough(streamOptions);

    rscStream.pipe(readable);

    function ClientRoot({response}) {
      return use(response);
    }

    const serverConsumerManifest = {
      moduleMap: {
        [turbopackMap[ClientComponentOnTheClient.$$id].id]: {
          '*': turbopackMap[ClientComponentOnTheServer.$$id],
        },
      },
      moduleLoading: null,
    };

    const response = ReactServerDOMClient.createFromNodeStream(
      readable,
      serverConsumerManifest,
      {debugChannel: debugReadable},
    );

    let ownerStack;

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(
        <ClientRoot response={response} />,
        {
          onError(err, errorInfo) {
            ownerStack = React.captureOwnerStack
              ? React.captureOwnerStack()
              : null;
          },
        },
      ),
    );

    const result = await readResult(ssrStream);

    expect(normalizeCodeLocInfo(ownerStack)).toBe('\n    in App (at **)');

    expect(result).toContain(
      'Switched to client rendering because the server rendering errored:\n\nssr-throw',
    );
  });
});
