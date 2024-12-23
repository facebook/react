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

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

let act;
let mocks;
let use;
let Stream;
let React;
let ReactDOMClient;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Suspense;
let ReactServerScheduler;
let reactServerAct;
let ErrorBoundary;

describe('ReactFlightViteDOM', () => {
  beforeEach(() => {
    // For this first reset we are going to load the dom-node version of react-server-dom-turbopack/server
    // This can be thought of as essentially being the React Server Components scope with react-server
    // condition
    jest.resetModules();

    ReactServerScheduler = require('scheduler');
    patchSetImmediate(ReactServerScheduler);
    reactServerAct = require('internal-test-utils').act;

    // Simulate the condition resolution
    jest.mock('react-server-dom-vite/server', () =>
      require('react-server-dom-vite/server.node'),
    );
    jest.mock('react', () => require('react/react.react-server'));

    mocks = require('./utils/mocks');

    ReactServerDOMServer = require('react-server-dom-vite/server');

    // This reset is to load modules for the SSR/Browser scope.
    jest.resetModules();
    __unmockReact();
    act = require('internal-test-utils').act;
    Stream = require('stream');
    React = require('react');
    use = React.use;
    Suspense = React.Suspense;
    ReactDOMClient = require('react-dom/client');
    ReactServerDOMClient = require('react-server-dom-vite/client');

    ErrorBoundary = class extends React.Component {
      state = {hasError: false, error: null};
      static getDerivedStateFromError(error) {
        return {
          hasError: true,
          error,
        };
      }
      render() {
        if (this.state.hasError) {
          return this.props.fallback(this.state.error);
        }
        return this.props.children;
      }
    };
  });

  async function serverAct(callback) {
    let maybePromise;
    await reactServerAct(() => {
      maybePromise = callback();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    });
    return maybePromise;
  }

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
      readable,
      writable,
    };
  }

  it('should resolve HTML using Node streams', async () => {
    function Text({children}) {
      return <span>{children}</span>;
    }
    function HTML() {
      return (
        <div>
          <Text>hello</Text>
          <Text>world</Text>
        </div>
      );
    }

    function App() {
      const model = {
        html: <HTML />,
      };
      return model;
    }

    const clientMock = mocks.mockClient();

    const {writable, readable} = getTestStream();
    const {pipe} = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(<App />, clientMock.manifest),
    );
    pipe(writable);
    const response = ReactServerDOMClient.createFromReadableStream(readable);
    const model = await response;
    expect(model).toEqual({
      html: (
        <div>
          <span>hello</span>
          <span>world</span>
        </div>
      ),
    });
  });

  it('should resolve the root', async () => {
    // Model
    function Text({children}) {
      return <span>{children}</span>;
    }
    function HTML() {
      return (
        <div>
          <Text>hello</Text>
          <Text>world</Text>
        </div>
      );
    }
    function RootModel() {
      return {
        html: <HTML />,
      };
    }

    // View
    function Message({response}) {
      return <section>{use(response).html}</section>;
    }
    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message response={response} />
        </Suspense>
      );
    }

    const clientMock = mocks.mockClient();

    const {writable, readable} = getTestStream();
    const {pipe} = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(
        <RootModel />,
        clientMock.manifest,
      ),
    );
    pipe(writable);
    const response = ReactServerDOMClient.createFromReadableStream(readable);

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe(
      '<section><div><span>hello</span><span>world</span></div></section>',
    );
  });

  it('should unwrap async module references', async () => {
    const Client = function Client({text}) {
      return <>Client: {text}</>;
    };

    const Client2 = function Client2({text}) {
      return text;
    };

    function Print({response}) {
      return <p>{use(response)}</p>;
    }

    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Print response={response} />
        </Suspense>
      );
    }

    const clientMock = mocks.mockClient({
      client: {
        Client,
        Client2,
      },
    });
    const ClientRef = clientMock.clientReferences.Client;
    const ClientRef2 = clientMock.clientReferences.Client2;

    const serverMock = mocks.mockServer({
      client: {
        Client,
        Client2,
      },
    });

    const {writable, readable} = getTestStream();
    const {pipe} = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(
        <ClientRef text={<ClientRef2 text="Module" />} />,
        clientMock.manifest,
      ),
    );
    pipe(writable);
    const response = ReactServerDOMClient.createFromReadableStream(
      readable,
      serverMock.manifest,
    );

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe('<p>Client: Module</p>');
  });
});
