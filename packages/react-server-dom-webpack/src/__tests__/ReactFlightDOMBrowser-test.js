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
let ReactDOMClient;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Suspense;
let use;

describe('ReactFlightDOMBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    act = require('internal-test-utils').act;
    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    serverExports = WebpackMock.serverExports;
    webpackMap = WebpackMock.webpackMap;
    webpackServerMap = WebpackMock.webpackServerMap;
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactServerDOMServer = require('react-server-dom-webpack/server.browser');
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
    const metaData = webpackServerMap[ref];
    const mod = __webpack_require__(metaData.id);
    if (metaData.name === '*') {
      return mod;
    }
    return mod[metaData.name];
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

  // @gate enableUseHook
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

  // @gate enableUseHook
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

  // @gate enableUseHook
  it('basic use(promise)', async () => {
    function Server() {
      return (
        use(Promise.resolve('A')) +
        use(Promise.resolve('B')) +
        use(Promise.resolve('C'))
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

  // @gate enableUseHook
  it('basic use(context)', async () => {
    const ContextA = React.createServerContext('ContextA', '');
    const ContextB = React.createServerContext('ContextB', 'B');

    function ServerComponent() {
      return use(ContextA) + use(ContextB);
    }
    function Server() {
      return (
        <ContextA.Provider value="A">
          <ServerComponent />
        </ContextA.Provider>
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
      // Client uses a different renderer.
      // We reset _currentRenderer here to not trigger a warning about multiple
      // renderers concurrently using this context
      ContextA._currentRenderer = null;
      root.render(<Client />);
    });
    expect(container.innerHTML).toBe('AB');
  });

  // @gate enableUseHook
  it('use(promise) in multiple components', async () => {
    function Child({prefix}) {
      return prefix + use(Promise.resolve('C')) + use(Promise.resolve('D'));
    }

    function Parent() {
      return (
        <Child prefix={use(Promise.resolve('A')) + use(Promise.resolve('B'))} />
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

  // @gate enableUseHook
  it('using a rejected promise will throw', async () => {
    const promiseA = Promise.resolve('A');
    const promiseB = Promise.reject(new Error('Oops!'));
    const promiseC = Promise.resolve('C');

    // Jest/Node will raise an unhandled rejected error unless we await this. It
    // works fine in the browser, though.
    await expect(promiseB).rejects.toThrow('Oops!');

    function Server() {
      return use(promiseA) + use(promiseB) + use(promiseC);
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

  // @gate enableUseHook
  it("use a promise that's already been instrumented and resolved", async () => {
    const thenable = {
      status: 'fulfilled',
      value: 'Hi',
      then() {},
    };

    // This will never suspend because the thenable already resolved
    function Server() {
      return use(thenable);
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

  // @gate enableUseHook
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
        return use(thenable);
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
      <ClientRef action={greet.bind(null, 'Hello', 'World')} />,
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
});
