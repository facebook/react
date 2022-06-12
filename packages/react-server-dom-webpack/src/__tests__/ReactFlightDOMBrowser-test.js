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

let webpackModuleIdx = 0;
let webpackModules = {};
let webpackMap = {};
global.__webpack_require__ = function(id) {
  return webpackModules[id];
};

let act;
let React;
let ReactDOMClient;
let ReactDOMServer;
let ReactServerDOMWriter;
let ReactServerDOMReader;

describe('ReactFlightDOMBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    webpackModules = {};
    webpackMap = {};
    act = require('jest-react').act;
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server.browser');
    ReactServerDOMWriter = require('react-server-dom-webpack/writer.browser.server');
    ReactServerDOMReader = require('react-server-dom-webpack');
  });

  function moduleReference(moduleExport) {
    const idx = webpackModuleIdx++;
    webpackModules[idx] = {
      d: moduleExport,
    };
    webpackMap['path/' + idx] = {
      default: {
        id: '' + idx,
        chunks: [],
        name: 'd',
      },
    };
    const MODULE_TAG = Symbol.for('react.module.reference');
    return {$$typeof: MODULE_TAG, filepath: 'path/' + idx, name: 'default'};
  }

  async function waitForSuspense(fn) {
    while (true) {
      try {
        return fn();
      } catch (promise) {
        if (typeof promise.then === 'function') {
          await promise;
        } else {
          throw promise;
        }
      }
    }
  }

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
    await waitForSuspense(() => {
      const model = response.readRoot();
      expect(model).toEqual({
        html: (
          <div>
            <span>hello</span>
            <span>world</span>
          </div>
        ),
      });
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
    await waitForSuspense(() => {
      const model = response.readRoot();
      expect(model).toEqual({
        html: (
          <div>
            <span>hello</span>
            <span>world</span>
          </div>
        ),
      });
    });
  });

  it('should progressively reveal server components', async () => {
    let reportedErrors = [];
    const {Suspense} = React;

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

    function MyErrorBoundary({children}) {
      return (
        <ErrorBoundary fallback={e => <p>{e.message}</p>}>
          {children}
        </ErrorBoundary>
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

    const MyErrorBoundaryClient = moduleReference(MyErrorBoundary);

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
      return response.readRoot().rootContent;
    }

    const stream = ReactServerDOMWriter.renderToReadableStream(
      model,
      webpackMap,
      {
        onError(x) {
          reportedErrors.push(x);
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
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<p>(loading sidebar)</p>' +
        '<p>(loading posts)</p>' +
        '<p>Game over</p>', // TODO: should not have message in prod.
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
        '<p>Game over</p>', // TODO: should not have message in prod.
    );

    // Show everything.
    await act(async () => {
      resolvePosts();
    });
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<div>:photos::friends:</div>' +
        '<div>:posts:</div>' +
        '<p>Game over</p>', // TODO: should not have message in prod.
    );

    expect(reportedErrors).toEqual([]);
  });

  it('should close the stream upon completion when rendering to W3C streams', async () => {
    const {Suspense} = React;

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

  it('should allow an alternative module mapping to be used for SSR', async () => {
    function ClientComponent() {
      return <span>Client Component</span>;
    }
    // The Client build may not have the same IDs as the Server bundles for the same
    // component.
    const ClientComponentOnTheClient = moduleReference(ClientComponent);
    const ClientComponentOnTheServer = moduleReference(ClientComponent);

    // In the SSR bundle this module won't exist. We simulate this by deleting it.
    const clientId = webpackMap[ClientComponentOnTheClient.filepath].default.id;
    delete webpackModules[clientId];

    // Instead, we have to provide a translation from the client meta data to the SSR
    // meta data.
    const ssrMetaData = webpackMap[ClientComponentOnTheServer.filepath].default;
    const translationMap = {
      [clientId]: {
        d: ssrMetaData,
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
      return response.readRoot();
    }

    const ssrStream = await ReactDOMServer.renderToReadableStream(
      <ClientRoot />,
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual('<span>Client Component</span>');
  });
});
