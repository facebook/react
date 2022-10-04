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
global.ReadableStream = require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

let clientExports;
let webpackMap;
let webpackModules;
let act;
let React;
let ReactDOMClient;
let ReactDOMServer;
let ReactServerDOMWriter;
let ReactServerDOMReader;
let Suspense;
let use;

describe('ReactFlightDOMBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    act = require('jest-react').act;
    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModules = WebpackMock.webpackModules;
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server.browser');
    ReactServerDOMWriter = require('react-server-dom-webpack/writer.browser.server');
    ReactServerDOMReader = require('react-server-dom-webpack');
    Suspense = React.Suspense;
    use = React.experimental_use;
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

    const stream = ReactServerDOMWriter.renderToReadableStream(<App />);
    const response = ReactServerDOMReader.createFromReadableStream(stream);
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

    const stream = ReactServerDOMWriter.renderToReadableStream(<App />);
    const response = ReactServerDOMReader.createFromReadableStream(stream);
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

    const stream = ReactServerDOMWriter.renderToReadableStream(
      model,
      webpackMap,
      {
        onError(x) {
          reportedErrors.push(x);
          return __DEV__ ? `a dev digest` : `digest("${x.message}")`;
        },
      },
    );
    const response = ReactServerDOMReader.createFromReadableStream(stream);

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <Suspense fallback={<p>(loading)</p>}>
          <ProfilePage response={response} />
        </Suspense>,
      );
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    // This isn't enough to show anything.
    await act(async () => {
      resolveFriends();
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    // We can now show the details. Sidebar and posts are still loading.
    await act(async () => {
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
    await act(async () => {
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
    await act(async () => {
      resolvePhotos();
    });
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<div>:photos::friends:</div>' +
        '<p>(loading posts)</p>' +
        gamesExpectedValue,
    );

    // Show everything.
    await act(async () => {
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

    const stream = ReactServerDOMWriter.renderToReadableStream(
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

    await act(async () => {});

    expect(flightResponse).toContain('(loading everything)');
    expect(flightResponse).toContain('(loading sidebar)');
    expect(flightResponse).toContain('(loading posts)');
    expect(flightResponse).not.toContain(':friends:');
    expect(flightResponse).not.toContain(':name:');

    await act(async () => {
      resolveFriends();
    });

    expect(flightResponse).toContain(':friends:');

    await act(async () => {
      resolveName();
    });

    expect(flightResponse).toContain(':name:');

    await act(async () => {
      resolvePhotos();
    });

    expect(flightResponse).toContain(':photos:');

    await act(async () => {
      resolvePosts();
    });

    expect(flightResponse).toContain(':posts:');

    // Final pending chunk is written; stream should be closed.
    expect(isDone).toBeTruthy();
  });

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
    const clientId = webpackMap[ClientComponentOnTheClient.filepath]['*'].id;
    delete webpackModules[clientId];

    // Instead, we have to provide a translation from the client meta data to the SSR
    // meta data.
    const ssrMetaData = webpackMap[ClientComponentOnTheServer.filepath]['*'];
    const translationMap = {
      [clientId]: {
        '*': ssrMetaData,
      },
    };

    function App() {
      return <ClientComponentOnTheClient />;
    }

    const stream = ReactServerDOMWriter.renderToReadableStream(
      <App />,
      webpackMap,
    );
    const response = ReactServerDOMReader.createFromReadableStream(stream, {
      moduleMap: translationMap,
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
    const stream = ReactServerDOMWriter.renderToReadableStream(
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
    const response = ReactServerDOMReader.createFromReadableStream(stream);

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    function App({res}) {
      return use(res);
    }

    await act(async () => {
      root.render(
        <ErrorBoundary fallback={errorBoundaryFn}>
          <Suspense fallback={<p>(loading)</p>}>
            <App res={response} />
          </Suspense>
        </ErrorBoundary>,
      );
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    await act(async () => {
      // @TODO this is a hack to work around lack of support for abortSignal.reason in node
      // The abort call itself should set this property but since we are testing in node we
      // set it here manually
      controller.signal.reason = 'for reasons';
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

    const stream = ReactServerDOMWriter.renderToReadableStream(<Server />);
    const response = ReactServerDOMReader.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
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
    const stream = ReactServerDOMWriter.renderToReadableStream(<Server />);
    const response = ReactServerDOMReader.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
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

    const stream = ReactServerDOMWriter.renderToReadableStream(<Parent />);
    const response = ReactServerDOMReader.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
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
    const stream = ReactServerDOMWriter.renderToReadableStream(
      <Server />,
      webpackMap,
      {
        onError(x) {
          reportedErrors.push(x);
          return __DEV__ ? 'a dev digest' : `digest("${x.message}")`;
        },
      },
    );
    const response = ReactServerDOMReader.createFromReadableStream(stream);

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
    await act(async () => {
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

    const stream = ReactServerDOMWriter.renderToReadableStream(<Server />);
    const response = ReactServerDOMReader.createFromReadableStream(stream);

    function Client() {
      return use(response);
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<Client />);
    });
    expect(container.innerHTML).toBe('Hi');
  });
});
