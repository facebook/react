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
global.setImmediate = cb => cb();

let act;
let use;
let clientExports;
let moduleMap;
let React;
let ReactDOMClient;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Suspense;
let registerClientReference;

class Destination {
  #buffer = '';
  #controller = null;
  constructor() {
    const self = this;
    this.stream = new ReadableStream({
      start(controller) {
        self.#controller = controller;
      },
    });
  }
  write(chunk) {
    this.#buffer += chunk;
  }
  beginWriting() {}
  completeWriting() {}
  flushBuffered() {
    if (!this.#controller) {
      throw new Error('Expected a controller.');
    }
    this.#controller.enqueue(this.#buffer);
    this.#buffer = '';
  }
  close() {}
  onError() {}
}

describe('ReactFlightDOM for FB', () => {
  beforeEach(() => {
    // For this first reset we are going to load the dom-node version of react-server-dom-turbopack/server
    // This can be thought of as essentially being the React Server Components scope with react-server
    // condition
    jest.resetModules();
    registerClientReference =
      require('../ReactFlightReferencesFB').registerClientReference;

    jest.mock('react', () => require('react/src/ReactSharedSubsetFB'));

    jest.mock('shared/ReactFeatureFlags', () => {
      jest.mock(
        'ReactFeatureFlags',
        () => jest.requireActual('shared/forks/ReactFeatureFlags.www-dynamic'),
        {virtual: true},
      );
      return jest.requireActual('shared/forks/ReactFeatureFlags.www');
    });

    clientExports = value => {
      registerClientReference(value, value.name);
      return value;
    };

    moduleMap = {
      resolveClientReference(metadata) {
        throw new Error('Do not expect to load client components.');
      },
    };

    ReactServerDOMServer = require('../ReactFlightDOMServerFB');
    ReactServerDOMServer.setConfig({
      byteLength: str => Buffer.byteLength(str),
    });

    // This reset is to load modules for the SSR/Browser scope.
    jest.resetModules();
    __unmockReact();
    act = require('internal-test-utils').act;
    React = require('react');
    use = React.use;
    Suspense = React.Suspense;
    ReactDOMClient = require('react-dom/client');
    ReactServerDOMClient = require('../ReactFlightDOMClientFB');
  });

  it('should resolve HTML with renderToDestination', async () => {
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
    const destination = new Destination();
    ReactServerDOMServer.renderToDestination(destination, <App />);
    const response = ReactServerDOMClient.createFromReadableStream(
      destination.stream,
      {
        moduleMap,
      },
    );
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

    const destination = new Destination();
    ReactServerDOMServer.renderToDestination(destination, <RootModel />);
    const response = ReactServerDOMClient.createFromReadableStream(
      destination.stream,
      {
        moduleMap,
      },
    );

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe(
      '<section><div><span>hello</span><span>world</span></div></section>',
    );
  });

  it('should not get confused by $', async () => {
    // Model
    function RootModel() {
      return {text: '$1'};
    }

    // View
    function Message({response}) {
      return <p>{use(response).text}</p>;
    }
    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message response={response} />
        </Suspense>
      );
    }
    const destination = new Destination();
    ReactServerDOMServer.renderToDestination(destination, <RootModel />);
    const response = ReactServerDOMClient.createFromReadableStream(
      destination.stream,
      {
        moduleMap,
      },
    );

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe('<p>$1</p>');
  });

  it('should not get confused by @', async () => {
    // Model
    function RootModel() {
      return {text: '@div'};
    }

    // View
    function Message({response}) {
      return <p>{use(response).text}</p>;
    }
    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message response={response} />
        </Suspense>
      );
    }
    const destination = new Destination();
    ReactServerDOMServer.renderToDestination(destination, <RootModel />);
    const response = ReactServerDOMClient.createFromReadableStream(
      destination.stream,
      {
        moduleMap,
      },
    );

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe('<p>@div</p>');
  });

  it('should be able to render a client component', async () => {
    const Component = function ({greeting}) {
      return greeting + ' World';
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

    const ClientComponent = clientExports(Component);

    const destination = new Destination();
    ReactServerDOMServer.renderToDestination(
      destination,
      <ClientComponent greeting={'Hello'} />,
      moduleMap,
    );
    const response = ReactServerDOMClient.createFromReadableStream(
      destination.stream,
      {
        moduleMap: {
          resolveClientReference(metadata) {
            return {
              getModuleId() {
                return metadata.moduleId;
              },
              load() {
                return Promise.resolve(Component);
              },
            };
          },
        },
      },
    );

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe('<p>Hello World</p>');
  });

  it('should render long strings', async () => {
    // Model
    const longString = 'Lorem Ipsum ❤️ '.repeat(100);

    function RootModel() {
      return {text: longString};
    }

    // View
    function Message({response}) {
      return <p>{use(response).text}</p>;
    }
    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message response={response} />
        </Suspense>
      );
    }
    const destination = new Destination();
    ReactServerDOMServer.renderToDestination(destination, <RootModel />);
    const response = ReactServerDOMClient.createFromReadableStream(
      destination.stream,
      {
        moduleMap,
      },
    );

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe('<p>' + longString + '</p>');
  });

  // TODO: `registerClientComponent` need to be able to support this
  it.skip('throws when accessing a member below the client exports', () => {
    const ClientModule = clientExports({
      Component: {deep: 'thing'},
    });
    function dotting() {
      return ClientModule.Component.deep;
    }
    expect(dotting).toThrowError(
      'Cannot access Component.deep on the server. ' +
        'You cannot dot into a client module from a server component. ' +
        'You can only pass the imported name through.',
    );
  });
});
