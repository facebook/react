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

let clientExports;
let serverExports;
let webpackMap;
let webpackServerMap;
let act;
let React;
let ReactDOM;
let ReactDOMClient;
let ReactDOMFizzServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Suspense;
let use;
let ReactServer;
let ReactServerDOM;

describe('ReactFlightDOMBrowser', () => {
  beforeEach(() => {
    jest.resetModules();

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.browser'),
    );

    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    serverExports = WebpackMock.serverExports;
    webpackMap = WebpackMock.webpackMap;
    webpackServerMap = WebpackMock.webpackServerMap;

    ReactServer = require('react');
    ReactServerDOM = require('react-dom');
    ReactServerDOMServer = require('react-server-dom-webpack/server.browser');

    __unmockReact();
    jest.resetModules();

    act = require('internal-test-utils').act;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMFizzServer = require('react-dom/server.browser');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Suspense = React.Suspense;
    use = React.use;
  });

  function makeDelayedText(Model) {
    let error, _resolve, _reject;
    let promise = new Promise((resolve, reject) => {
      _resolve = () => {
        promise = null;
        resolve();
      };
      _reject = e => {
        error = e;
        promise = null;
        reject(e);
      };
    });
    function DelayedText({children}, data) {
      if (promise) {
        throw promise;
      }
      if (error) {
        throw error;
      }
      return <Model>{children}</Model>;
    }
    return [DelayedText, _resolve, _reject];
  }

  const theInfinitePromise = new Promise(() => {});
  function InfiniteSuspend() {
    throw theInfinitePromise;
  }

  function requireServerRef(ref) {
    let name = '';
    let resolvedModuleData = webpackServerMap[ref];
    if (resolvedModuleData) {
      // The potentially aliased name.
      name = resolvedModuleData.name;
    } else {
      // We didn't find this specific export name but we might have the * export
      // which contains this name as well.
      // TODO: It's unfortunate that we now have to parse this string. We should
      // probably go back to encoding path and name separately on the client reference.
      const idx = ref.lastIndexOf('#');
      if (idx !== -1) {
        name = ref.slice(idx + 1);
        resolvedModuleData = webpackServerMap[ref.slice(0, idx)];
      }
      if (!resolvedModuleData) {
        throw new Error(
          'Could not find the module "' +
            ref +
            '" in the React Client Manifest. ' +
            'This is probably a bug in the React Server Components bundler.',
        );
      }
    }
    const mod = __webpack_require__(resolvedModuleData.id);
    if (name === '*') {
      return mod;
    }
    return mod[name];
  }

  async function callServer(actionId, body) {
    const fn = requireServerRef(actionId);
    const args = await ReactServerDOMServer.decodeReply(body, webpackServerMap);
    return fn.apply(null, args);
  }

  it('should resolve HTML using W3C streams', async () => {
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

    const stream = ReactServerDOMServer.renderToReadableStream(<App />);
    const response = ReactServerDOMClient.createFromReadableStream(stream);
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

  it('should resolve HTML using W3C streams', async () => {
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

    const stream = ReactServerDOMServer.renderToReadableStream(<App />);
    const response = ReactServerDOMClient.createFromReadableStream(stream);
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

  it('should progressively reveal server components', async () => {
    let reportedErrors = [];

    // Client Components

    class ErrorBoundary extends React.Component {
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
    }

    let errorBoundaryFn;
    if (__DEV__) {
      errorBoundaryFn = e => (
        <p>
          {e.message} + {e.digest}
        </p>
      );
    } else {
      errorBoundaryFn = e => {
        expect(e.message).toBe(
          'An error occurred in the Server Components render. The specific message is omitted in production' +
            ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
            ' may provide additional details about the nature of the error.',
        );
        return <p>{e.digest}</p>;
      };
    }

    function MyErrorBoundary({children}) {
      return (
        <ErrorBoundary fallback={errorBoundaryFn}>{children}</ErrorBoundary>
      );
    }

    // Model
    function Text({children}) {
      return children;
    }

    const [Friends, resolveFriends] = makeDelayedText(Text);
    const [Name, resolveName] = makeDelayedText(Text);
    const [Posts, resolvePosts] = makeDelayedText(Text);
    const [Photos, resolvePhotos] = makeDelayedText(Text);
    const [Games, , rejectGames] = makeDelayedText(Text);

    // View
    function ProfileDetails({avatar}) {
      return (
        <div>
          <Name>:name:</Name>
          {avatar}
        </div>
      );
    }
    function ProfileSidebar({friends}) {
      return (
        <div>
          <Photos>:photos:</Photos>
          {friends}
        </div>
      );
    }
    function ProfilePosts({posts}) {
      return <div>{posts}</div>;
    }
    function ProfileGames({games}) {
      return <div>{games}</div>;
    }

    const MyErrorBoundaryClient = clientExports(MyErrorBoundary);

    function ProfileContent() {
      return (
        <>
          <ProfileDetails avatar={<Text>:avatar:</Text>} />
          <Suspense fallback={<p>(loading sidebar)</p>}>
            <ProfileSidebar friends={<Friends>:friends:</Friends>} />
          </Suspense>
          <Suspense fallback={<p>(loading posts)</p>}>
            <ProfilePosts posts={<Posts>:posts:</Posts>} />
          </Suspense>
          <MyErrorBoundaryClient>
            <Suspense fallback={<p>(loading games)</p>}>
              <ProfileGames games={<Games>:games:</Games>} />
            </Suspense>
          </MyErrorBoundaryClient>
        </>
      );
    }

    const model = {
      rootContent: <ProfileContent />,
    };

    function ProfilePage({response}) {
      return use(response).rootContent;
    }

    const stream = ReactServerDOMServer.renderToReadableStream(
      model,
      webpackMap,
      {
        onError(x) {
          reportedErrors.push(x);
          return __DEV__ ? `a dev digest` : `digest("${x.message}")`;
        },
      },
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <Suspense fallback={<p>(loading)</p>}>
          <ProfilePage response={response} />
        </Suspense>,
      );
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    // This isn't enough to show anything.
    await act(() => {
      resolveFriends();
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    // We can now show the details. Sidebar and posts are still loading.
    await act(() => {
      resolveName();
    });
    // Advance time enough to trigger a nested fallback.
    jest.advanceTimersByTime(500);
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<p>(loading sidebar)</p>' +
        '<p>(loading posts)</p>' +
        '<p>(loading games)</p>',
    );

    expect(reportedErrors).toEqual([]);

    const theError = new Error('Game over');
    // Let's *fail* loading games.
    await act(() => {
      rejectGames(theError);
    });

    const gamesExpectedValue = __DEV__
      ? '<p>Game over + a dev digest</p>'
      : '<p>digest("Game over")</p>';

    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<p>(loading sidebar)</p>' +
        '<p>(loading posts)</p>' +
        gamesExpectedValue,
    );

    expect(reportedErrors).toEqual([theError]);
    reportedErrors = [];

    // We can now show the sidebar.
    await act(() => {
      resolvePhotos();
    });
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<div>:photos::friends:</div>' +
        '<p>(loading posts)</p>' +
        gamesExpectedValue,
    );

    // Show everything.
    await act(() => {
      resolvePosts();
    });
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<div>:photos::friends:</div>' +
        '<div>:posts:</div>' +
        gamesExpectedValue,
    );

    expect(reportedErrors).toEqual([]);
  });

  it('should close the stream upon completion when rendering to W3C streams', async () => {
    // Model
    function Text({children}) {
      return children;
    }

    const [Friends, resolveFriends] = makeDelayedText(Text);
    const [Name, resolveName] = makeDelayedText(Text);
    const [Posts, resolvePosts] = makeDelayedText(Text);
    const [Photos, resolvePhotos] = makeDelayedText(Text);

    // View
    function ProfileDetails({avatar}) {
      return (
        <div>
          <Name>:name:</Name>
          {avatar}
        </div>
      );
    }
    function ProfileSidebar({friends}) {
      return (
        <div>
          <Photos>:photos:</Photos>
          {friends}
        </div>
      );
    }
    function ProfilePosts({posts}) {
      return <div>{posts}</div>;
    }

    function ProfileContent() {
      return (
        <Suspense fallback="(loading everything)">
          <ProfileDetails avatar={<Text>:avatar:</Text>} />
          <Suspense fallback={<p>(loading sidebar)</p>}>
            <ProfileSidebar friends={<Friends>:friends:</Friends>} />
          </Suspense>
          <Suspense fallback={<p>(loading posts)</p>}>
            <ProfilePosts posts={<Posts>:posts:</Posts>} />
          </Suspense>
        </Suspense>
      );
    }

    const model = {
      rootContent: <ProfileContent />,
    };

    const stream = ReactServerDOMServer.renderToReadableStream(
      model,
      webpackMap,
    );

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let flightResponse = '';
    let isDone = false;

    reader.read().then(function progress({done, value}) {
      if (done) {
        isDone = true;
        return;
      }

      flightResponse += decoder.decode(value);

      return reader.read().then(progress);
    });

    // Advance time enough to trigger a nested fallback.
    jest.advanceTimersByTime(500);

    await act(() => {});

    expect(flightResponse).toContain('(loading everything)');
    expect(flightResponse).toContain('(loading sidebar)');
    expect(flightResponse).toContain('(loading posts)');
    expect(flightResponse).not.toContain(':friends:');
    expect(flightResponse).not.toContain(':name:');

    await act(() => {
      resolveFriends();
    });

    expect(flightResponse).toContain(':friends:');

    await act(() => {
      resolveName();
    });

    expect(flightResponse).toContain(':name:');

    await act(() => {
      resolvePhotos();
    });

    expect(flightResponse).toContain(':photos:');

    await act(() => {
      resolvePosts();
    });

    expect(flightResponse).toContain(':posts:');

    // Final pending chunk is written; stream should be closed.
    expect(isDone).toBeTruthy();
  });

  it('should be able to complete after aborting and throw the reason client-side', async () => {
    const reportedErrors = [];

    let errorBoundaryFn;
    if (__DEV__) {
      errorBoundaryFn = e => (
        <p>
          {e.message} + {e.digest}
        </p>
      );
    } else {
      errorBoundaryFn = e => {
        expect(e.message).toBe(
          'An error occurred in the Server Components render. The specific message is omitted in production' +
            ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
            ' may provide additional details about the nature of the error.',
        );
        return <p>{e.digest}</p>;
      };
    }

    class ErrorBoundary extends React.Component {
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
    }

    const controller = new AbortController();
    const stream = ReactServerDOMServer.renderToReadableStream(
      <div>
        <InfiniteSuspend />
      </div>,
      webpackMap,
      {
        signal: controller.signal,
        onError(x) {
          const message = typeof x === 'string' ? x : x.message;
          reportedErrors.push(x);
          return __DEV__ ? 'a dev digest' : `digest("${message}")`;
        },
      },
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    function App({res}) {
      return use(res);
    }

    await act(() => {
      root.render(
        <ErrorBoundary fallback={errorBoundaryFn}>
          <Suspense fallback={<p>(loading)</p>}>
            <App res={response} />
          </Suspense>
        </ErrorBoundary>,
      );
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    await act(() => {
      controller.abort('for reasons');
    });
    const expectedValue = __DEV__
      ? '<p>Error: for reasons + a dev digest</p>'
      : '<p>digest("for reasons")</p>';
    expect(container.innerHTML).toBe(expectedValue);

    expect(reportedErrors).toEqual(['for reasons']);
  });

  it('should warn in DEV a child is missing keys', async () => {
    function ParentClient({children}) {
      return children;
    }
    const Parent = clientExports(ParentClient);
    const ParentModule = clientExports({Parent: ParentClient});
    await expect(async () => {
      const stream = ReactServerDOMServer.renderToReadableStream(
        <>
          <Parent>{Array(6).fill(<div>no key</div>)}</Parent>
          <ParentModule.Parent>
            {Array(6).fill(<div>no key</div>)}
          </ParentModule.Parent>
        </>,
        webpackMap,
      );
      await ReactServerDOMClient.createFromReadableStream(stream);
    }).toErrorDev(
      'Each child in a list should have a unique "key" prop. ' +
        'See https://reactjs.org/link/warning-keys for more information.',
    );
  });

  it('basic use(promise)', async () => {
    function Server() {
      return (
        ReactServer.use(Promise.resolve('A')) +
        ReactServer.use(Promise.resolve('B')) +
        ReactServer.use(Promise.resolve('C'))
      );
    }

    const stream = ReactServerDOMServer.renderToReadableStream(<Server />);
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <Suspense fallback="Loading...">
          <Client />
        </Suspense>,
      );
    });
    expect(container.innerHTML).toBe('ABC');
  });

  it('use(promise) in multiple components', async () => {
    function Child({prefix}) {
      return (
        prefix +
        ReactServer.use(Promise.resolve('C')) +
        ReactServer.use(Promise.resolve('D'))
      );
    }

    function Parent() {
      return (
        <Child
          prefix={
            ReactServer.use(Promise.resolve('A')) +
            ReactServer.use(Promise.resolve('B'))
          }
        />
      );
    }

    const stream = ReactServerDOMServer.renderToReadableStream(<Parent />);
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <Suspense fallback="Loading...">
          <Client />
        </Suspense>,
      );
    });
    expect(container.innerHTML).toBe('ABCD');
  });

  it('using a rejected promise will throw', async () => {
    const promiseA = Promise.resolve('A');
    const promiseB = Promise.reject(new Error('Oops!'));
    const promiseC = Promise.resolve('C');

    // Jest/Node will raise an unhandled rejected error unless we await this. It
    // works fine in the browser, though.
    await expect(promiseB).rejects.toThrow('Oops!');

    function Server() {
      return (
        ReactServer.use(promiseA) +
        ReactServer.use(promiseB) +
        ReactServer.use(promiseC)
      );
    }

    const reportedErrors = [];
    const stream = ReactServerDOMServer.renderToReadableStream(
      <Server />,
      webpackMap,
      {
        onError(x) {
          reportedErrors.push(x);
          return __DEV__ ? 'a dev digest' : `digest("${x.message}")`;
        },
      },
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return __DEV__
            ? this.state.error.message + ' + ' + this.state.error.digest
            : this.state.error.digest;
        }
        return this.props.children;
      }
    }

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <ErrorBoundary>
          <Client />
        </ErrorBoundary>,
      );
    });
    expect(container.innerHTML).toBe(
      __DEV__ ? 'Oops! + a dev digest' : 'digest("Oops!")',
    );
    expect(reportedErrors.length).toBe(1);
    expect(reportedErrors[0].message).toBe('Oops!');
  });

  it("use a promise that's already been instrumented and resolved", async () => {
    const thenable = {
      status: 'fulfilled',
      value: 'Hi',
      then() {},
    };

    // This will never suspend because the thenable already resolved
    function Server() {
      return ReactServer.use(thenable);
    }

    const stream = ReactServerDOMServer.renderToReadableStream(<Server />);
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<Client />);
    });
    expect(container.innerHTML).toBe('Hi');
  });

  it('unwraps thenable that fulfills synchronously without suspending', async () => {
    function Server() {
      const thenable = {
        then(resolve) {
          // This thenable immediately resolves, synchronously, without waiting
          // a microtask.
          resolve('Hi');
        },
      };
      try {
        return ReactServer.use(thenable);
      } catch {
        throw new Error(
          '`use` should not suspend because the thenable resolved synchronously.',
        );
      }
    }

    // Because the thenable resolves synchronously, we should be able to finish
    // rendering synchronously, with no fallback.
    const stream = ReactServerDOMServer.renderToReadableStream(<Server />);
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<Client />);
    });
    expect(container.innerHTML).toBe('Hi');
  });

  it('can pass a higher order function by reference from server to client', async () => {
    let actionProxy;

    function Client({action}) {
      actionProxy = action;
      return 'Click Me';
    }

    function greet(transform, text) {
      return 'Hello ' + transform(text);
    }

    function upper(text) {
      return text.toUpperCase();
    }

    const ServerModuleA = serverExports({
      greet,
    });
    const ServerModuleB = serverExports({
      upper,
    });
    const ClientRef = clientExports(Client);

    const boundFn = ServerModuleA.greet.bind(null, ServerModuleB.upper);

    const stream = ReactServerDOMServer.renderToReadableStream(
      <ClientRef action={boundFn} />,
      webpackMap,
    );

    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      async callServer(ref, args) {
        const body = await ReactServerDOMClient.encodeReply(args);
        return callServer(ref, body);
      },
    });

    function App() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });
    expect(container.innerHTML).toBe('Click Me');
    expect(typeof actionProxy).toBe('function');
    expect(actionProxy).not.toBe(boundFn);

    const result = await actionProxy('hi');
    expect(result).toBe('Hello HI');
  });

  it('can call a module split server function', async () => {
    let actionProxy;

    function Client({action}) {
      actionProxy = action;
      return 'Click Me';
    }

    function greet(text) {
      return 'Hello ' + text;
    }

    const ServerModule = serverExports({
      // This gets split into another module
      split: greet,
    });
    const ClientRef = clientExports(Client);

    const stream = ReactServerDOMServer.renderToReadableStream(
      <ClientRef action={ServerModule.split} />,
      webpackMap,
    );

    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      async callServer(ref, args) {
        const body = await ReactServerDOMClient.encodeReply(args);
        return callServer(ref, body);
      },
    });

    function App() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });
    expect(container.innerHTML).toBe('Click Me');
    expect(typeof actionProxy).toBe('function');

    const result = await actionProxy('Split');
    expect(result).toBe('Hello Split');
  });

  it('can pass a server function by importing from client back to server', async () => {
    function greet(transform, text) {
      return 'Hello ' + transform(text);
    }

    function upper(text) {
      return text.toUpperCase();
    }

    const ServerModuleA = serverExports({
      greet,
    });
    const ServerModuleB = serverExports({
      upper,
    });

    let actionProxy;

    // This is a Proxy representing ServerModuleB in the Client bundle.
    const ServerModuleBImportedOnClient = {
      upper: ReactServerDOMClient.createServerReference(
        ServerModuleB.upper.$$id,
        async function (ref, args) {
          const body = await ReactServerDOMClient.encodeReply(args);
          return callServer(ref, body);
        },
      ),
    };

    function Client({action}) {
      // Client side pass a Server Reference into an action.
      actionProxy = text => action(ServerModuleBImportedOnClient.upper, text);
      return 'Click Me';
    }

    const ClientRef = clientExports(Client);

    const stream = ReactServerDOMServer.renderToReadableStream(
      <ClientRef action={ServerModuleA.greet} />,
      webpackMap,
    );

    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      async callServer(ref, args) {
        const body = await ReactServerDOMClient.encodeReply(args);
        return callServer(ref, body);
      },
    });

    function App() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });
    expect(container.innerHTML).toBe('Click Me');

    const result = await actionProxy('hi');
    expect(result).toBe('Hello HI');
  });

  it('can bind arguments to a server reference', async () => {
    let actionProxy;

    function Client({action}) {
      actionProxy = action;
      return 'Click Me';
    }

    const greet = serverExports(function greet(a, b, c) {
      return a + ' ' + b + c;
    });
    const ClientRef = clientExports(Client);

    const stream = ReactServerDOMServer.renderToReadableStream(
      <ClientRef action={greet.bind(null, 'Hello').bind(null, 'World')} />,
      webpackMap,
    );

    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      async callServer(actionId, args) {
        const body = await ReactServerDOMClient.encodeReply(args);
        return callServer(actionId, body);
      },
    });

    function App() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });
    expect(container.innerHTML).toBe('Click Me');
    expect(typeof actionProxy).toBe('function');
    expect(actionProxy).not.toBe(greet);

    const result = await actionProxy('!');
    expect(result).toBe('Hello World!');
  });

  it('propagates server reference errors to the client', async () => {
    let actionProxy;

    function Client({action}) {
      actionProxy = action;
      return 'Click Me';
    }

    async function send(text) {
      return Promise.reject(new Error(`Error for ${text}`));
    }

    const ServerModule = serverExports({send});
    const ClientRef = clientExports(Client);

    const stream = ReactServerDOMServer.renderToReadableStream(
      <ClientRef action={ServerModule.send} />,
      webpackMap,
    );

    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      async callServer(actionId, args) {
        const body = await ReactServerDOMClient.encodeReply(args);
        return ReactServerDOMClient.createFromReadableStream(
          ReactServerDOMServer.renderToReadableStream(
            callServer(actionId, body),
            null,
            {onError: error => 'test-error-digest'},
          ),
        );
      },
    });

    function App() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    if (__DEV__) {
      await expect(actionProxy('test')).rejects.toThrow('Error for test');
    } else {
      let thrownError;

      try {
        await actionProxy('test');
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toEqual(
        new Error(
          'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.',
        ),
      );

      expect(thrownError.digest).toBe('test-error-digest');
    }
  });

  it('supports Float hints before the first await in server components in Fiber', async () => {
    function Component() {
      return <p>hello world</p>;
    }

    const ClientComponent = clientExports(Component);

    async function ServerComponent() {
      ReactServerDOM.preload('before', {as: 'style'});
      await 1;
      ReactServerDOM.preload('after', {as: 'style'});
      return <ClientComponent />;
    }

    const stream = ReactServerDOMServer.renderToReadableStream(
      <ServerComponent />,
      webpackMap,
    );

    let response = null;
    function getResponse() {
      if (response === null) {
        response = ReactServerDOMClient.createFromReadableStream(stream);
      }
      return response;
    }

    function App() {
      return getResponse();
    }

    // pausing to let Flight runtime tick. This is a test only artifact of the fact that
    // we aren't operating separate module graphs for flight and fiber. In a real app
    // each would have their own dispatcher and there would be no cross dispatching.
    await 1;

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });
    expect(document.head.innerHTML).toBe(
      '<link rel="preload" href="before" as="style">',
    );
    expect(container.innerHTML).toBe('<p>hello world</p>');
  });

  it('Does not support Float hints in server components anywhere in Fizz', async () => {
    // In environments that do not support AsyncLocalStorage the Flight client has no ability
    // to scope hint dispatching to a specific Request. In Fiber this isn't a problem because
    // the Browser scope acts like a singleton and we can dispatch away. But in Fizz we need to have
    // a reference to Resources and this is only possible during render unless you support AsyncLocalStorage.
    function Component() {
      return <p>hello world</p>;
    }

    const ClientComponent = clientExports(Component);

    async function ServerComponent() {
      ReactDOM.preload('before', {as: 'style'});
      await 1;
      ReactDOM.preload('after', {as: 'style'});
      return <ClientComponent />;
    }

    const stream = ReactServerDOMServer.renderToReadableStream(
      <ServerComponent />,
      webpackMap,
    );

    let response = null;
    function getResponse() {
      if (response === null) {
        response = ReactServerDOMClient.createFromReadableStream(stream);
      }
      return response;
    }

    function App() {
      return (
        <html>
          <body>{getResponse()}</body>
        </html>
      );
    }

    // pausing to let Flight runtime tick. This is a test only artifact of the fact that
    // we aren't operating separate module graphs for flight and fiber. In a real app
    // each would have their own dispatcher and there would be no cross dispatching.
    await 1;

    let fizzStream;
    await act(async () => {
      fizzStream = await ReactDOMFizzServer.renderToReadableStream(<App />);
    });

    const decoder = new TextDecoder();
    const reader = fizzStream.getReader();
    let content = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        content += decoder.decode();
        break;
      }
      content += decoder.decode(value, {stream: true});
    }

    expect(content).toEqual(
      '<!DOCTYPE html><html><head>' +
        '</head><body><p>hello world</p></body></html>',
    );
  });

  // @gate enablePostpone
  it('supports postpone in Server Components', async () => {
    function Server() {
      React.unstable_postpone('testing postpone');
      return 'Not shown';
    }

    let postponed = null;

    const stream = ReactServerDOMServer.renderToReadableStream(
      <Suspense fallback="Loading...">
        <Server />
      </Suspense>,
      null,
      {
        onPostpone(reason) {
          postponed = reason;
        },
      },
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <div>
          Shell: <Client />
        </div>,
      );
    });
    // We should have reserved the shell already. Which means that the Server
    // Component should've been a lazy component.
    expect(container.innerHTML).toContain('Shell:');
    expect(container.innerHTML).toContain('Loading...');
    expect(container.innerHTML).not.toContain('Not shown');

    expect(postponed).toBe('testing postpone');
  });

  it('should not continue rendering after the reader cancels', async () => {
    let hasLoaded = false;
    let resolve;
    let rendered = false;
    const promise = new Promise(r => (resolve = r));
    function Wait() {
      if (!hasLoaded) {
        throw promise;
      }
      rendered = true;
      return 'Done';
    }
    const errors = [];
    const stream = await ReactServerDOMServer.renderToReadableStream(
      <div>
        <Suspense fallback={<div>Loading</div>}>
          <Wait />
        </Suspense>
      </div>,
      null,
      {
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    expect(rendered).toBe(false);

    const reader = stream.getReader();
    await reader.read();
    await reader.cancel();

    expect(errors).toEqual([
      'The render was aborted by the server without a reason.',
    ]);

    hasLoaded = true;
    resolve();

    await jest.runAllTimers();

    expect(rendered).toBe(false);

    expect(errors).toEqual([
      'The render was aborted by the server without a reason.',
    ]);
  });

  // @gate enablePostpone
  it('postpones when abort passes a postpone signal', async () => {
    const infinitePromise = new Promise(() => {});
    function Server() {
      return infinitePromise;
    }

    let postponed = null;
    let error = null;

    const controller = new AbortController();
    const stream = ReactServerDOMServer.renderToReadableStream(
      <Suspense fallback="Loading...">
        <Server />
      </Suspense>,
      null,
      {
        onError(x) {
          error = x;
        },
        onPostpone(reason) {
          postponed = reason;
        },
        signal: controller.signal,
      },
    );

    try {
      React.unstable_postpone('testing postpone');
    } catch (reason) {
      controller.abort(reason);
    }

    const response = ReactServerDOMClient.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <div>
          Shell: <Client />
        </div>,
      );
    });
    // We should have reserved the shell already. Which means that the Server
    // Component should've been a lazy component.
    expect(container.innerHTML).toContain('Shell:');
    expect(container.innerHTML).toContain('Loading...');
    expect(container.innerHTML).not.toContain('Not shown');

    expect(postponed).toBe('testing postpone');
    expect(error).toBe(null);
  });
});
