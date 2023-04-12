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
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
global.Headers = require('node-fetch').Headers;
global.Request = require('node-fetch').Request;
global.Response = require('node-fetch').Response;
// Patch for Edge environments for global scope
global.AsyncLocalStorage = require('async_hooks').AsyncLocalStorage;

// Don't wait before processing work on the server.
// TODO: we can replace this with FlightServer.act().
global.setTimeout = cb => cb();

let fetchCount = 0;
async function fetchMock(resource, options) {
  fetchCount++;
  const request = new Request(resource, options);
  return new Response(
    request.method +
      ' ' +
      request.url +
      ' ' +
      JSON.stringify(Array.from(request.headers.entries())),
  );
}

let React;
let ReactServerDOMServer;
let ReactServerDOMClient;
let use;

describe('ReactFetch', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchCount = 0;
    global.fetch = fetchMock;

    if (gate(flags => !flags.www)) {
      jest.mock('react', () => require('react/react.shared-subset'));
    }

    React = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server.edge');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    use = React.use;
  });

  async function render(Component) {
    const stream = ReactServerDOMServer.renderToReadableStream(<Component />);
    return ReactServerDOMClient.createFromReadableStream(stream);
  }

  // @gate enableFetchInstrumentation && enableCache
  it('can dedupe fetches separately in interleaved renders', async () => {
    async function getData() {
      const r1 = await fetch('hi');
      const t1 = await r1.text();
      const r2 = await fetch('hi');
      const t2 = await r2.text();
      return t1 + ' ' + t2;
    }
    function Component() {
      return use(getData());
    }
    const render1 = render(Component);
    const render2 = render(Component);
    expect(await render1).toMatchInlineSnapshot(`"GET hi [] GET hi []"`);
    expect(await render2).toMatchInlineSnapshot(`"GET hi [] GET hi []"`);
    expect(fetchCount).toBe(2);
  });
});
