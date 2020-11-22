/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Polyfills for test environment
global.ReadableStream = require('@mattiasbuelens/web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextDecoder = require('util').TextDecoder;

// Don't wait before processing work on the server.
// TODO: we can replace this with FlightServer.act().
global.setImmediate = cb => cb();

describe('ReactFetchNode', () => {
  let React;
  let ReactDOM;
  let ReactTransportDOMServer;
  let ReactTransportDOMClient;
  let Stream;
  let act;
  let http;
  let fetch;
  let server;
  let serverEndpoint;
  let serverImpl;

  beforeEach(done => {
    jest.resetModules();

    Stream = require('stream');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTransportDOMServer = require('react-transport-dom-webpack/server');
    ReactTransportDOMClient = require('react-transport-dom-webpack');
    act = require('react-dom/test-utils').act;
    fetch = require('react-fetch').fetch;
    http = require('http');

    server = http.createServer((req, res) => {
      serverImpl(req, res);
    });
    serverEndpoint = null;
    server.listen(() => {
      serverEndpoint = `http://localhost:${server.address().port}/`;
      done();
    });
  });

  afterEach(done => {
    server.close(done);
    server = null;
  });

  function getTestStream() {
    const writable = new Stream.PassThrough();
    const readable = new ReadableStream({
      start(controller) {
        writable.on('data', chunk => {
          controller.enqueue(chunk);
        });
        writable.on('end', () => {
          controller.close();
        });
      },
    });
    return {
      writable,
      readable,
    };
  }

  async function getServerOutput(serverTree) {
    const {writable, readable} = getTestStream();
    ReactTransportDOMServer.pipeToNodeWritable(serverTree, writable, {});
    const response = ReactTransportDOMClient.createFromReadableStream(readable);

    const container = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(container);

    function Client() {
      return response.readRoot();
    }

    await act(async () => {
      root.render(
        <React.Suspense fallback={'loading...'}>
          <Client />
        </React.Suspense>,
      );
    });
    while (container.innerHTML === 'loading...') {
      await act(async () => {});
    }
    return container.innerHTML;
  }

  // @gate experimental
  it('can fetch text from a server component', async () => {
    serverImpl = (req, res) => {
      res.write('mango');
      res.end();
    };
    function App() {
      const text = fetch(serverEndpoint).text();
      return <div>{text.toUpperCase()}</div>;
    }
    const output = await getServerOutput(<App />);
    expect(output).toEqual('<div>MANGO</div>');
  });

  // @gate experimental
  it('can fetch json from a server component', async () => {
    serverImpl = (req, res) => {
      res.write(JSON.stringify({name: 'Sema'}));
      res.end();
    };
    function App() {
      const json = fetch(serverEndpoint).json();
      return <div>{json.name.toUpperCase()}</div>;
    }
    const output = await getServerOutput(<App />);
    expect(output).toEqual('<div>SEMA</div>');
  });

  // @gate experimental
  it('provides response status', async () => {
    serverImpl = (req, res) => {
      res.write(JSON.stringify({name: 'Sema'}));
      res.end();
    };
    function App() {
      const response = fetch(serverEndpoint);
      return (
        <div>
          {response.status} {response.statusText} {'' + response.ok}
        </div>
      );
    }
    const output = await getServerOutput(<App />);
    expect(output).toEqual('<div>200 OK true</div>');
  });

  // @gate experimental
  it('handles different paths', async () => {
    serverImpl = (req, res) => {
      switch (req.url) {
        case '/banana':
          res.write('banana');
          break;
        case '/mango':
          res.write('mango');
          break;
        case '/orange':
          res.write('orange');
          break;
      }
      res.end();
    };
    function Banana() {
      return <span>{fetch(serverEndpoint + 'banana').text()}</span>;
    }
    function Mango() {
      return <span>{fetch(serverEndpoint + 'mango').text()}</span>;
    }
    function Orange() {
      return <span>{fetch(serverEndpoint + 'orange').text()}</span>;
    }
    function App() {
      return (
        <div>
          <Banana />
          <Mango />
          <Orange />
          <Mango />
        </div>
      );
    }
    const output = await getServerOutput(<App />);
    expect(output).toEqual(
      '<div>' +
        '<span>banana</span>' +
        '<span>mango</span>' +
        '<span>orange</span>' +
        '<span>mango</span>' +
        '</div>',
    );
  });
});
