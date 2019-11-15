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

let act;
let Stream;
let React;
let ReactDOM;
let ReactFlightDOMServer;
let ReactFlightDOMClient;

describe('ReactFlightDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    act = require('react-dom/test-utils').act;
    Stream = require('stream');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactFlightDOMServer = require('react-flight-dom-webpack/server');
    ReactFlightDOMClient = require('react-flight-dom-webpack');
  });

  function getTestStream() {
    let writable = new Stream.PassThrough();
    let readable = new ReadableStream({
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
      let model = {
        html: <HTML />,
      };
      return model;
    }

    let {writable, readable} = getTestStream();
    ReactFlightDOMServer.pipeToNodeWritable(<App />, writable);
    let result = ReactFlightDOMClient.readFromReadableStream(readable);
    await waitForSuspense(() => {
      expect(result.model).toEqual({
        html: '<div><span>hello</span><span>world</span></div>',
      });
    });
  });

  it.experimental('should resolve the root', async () => {
    let {Suspense} = React;

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
    function Message({result}) {
      return <p dangerouslySetInnerHTML={{__html: result.model.html}} />;
    }
    function App({result}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message result={result} />
        </Suspense>
      );
    }

    let {writable, readable} = getTestStream();
    ReactFlightDOMServer.pipeToNodeWritable(<RootModel />, writable);
    let result = ReactFlightDOMClient.readFromReadableStream(readable);

    let container = document.createElement('div');
    let root = ReactDOM.createRoot(container);
    await act(async () => {
      root.render(<App result={result} />);
    });
    expect(container.innerHTML).toBe(
      '<p><div><span>hello</span><span>world</span></div></p>',
    );
  });

  it.experimental('should not get confused by $', async () => {
    let {Suspense} = React;

    // Model
    function RootModel() {
      return {text: '$1'};
    }

    // View
    function Message({result}) {
      return <p>{result.model.text}</p>;
    }
    function App({result}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message result={result} />
        </Suspense>
      );
    }

    let {writable, readable} = getTestStream();
    ReactFlightDOMServer.pipeToNodeWritable(<RootModel />, writable);
    let result = ReactFlightDOMClient.readFromReadableStream(readable);

    let container = document.createElement('div');
    let root = ReactDOM.createRoot(container);
    await act(async () => {
      root.render(<App result={result} />);
    });
    expect(container.innerHTML).toBe('<p>$1</p>');
  });

  it.experimental('should progressively reveal chunks', async () => {
    let {Suspense} = React;

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

    // Model
    function Text({children}) {
      return children;
    }
    function makeDelayedText() {
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
      function DelayedText({children}) {
        if (promise) {
          throw promise;
        }
        if (error) {
          throw error;
        }
        return <Text>{children}</Text>;
      }
      return [DelayedText, _resolve, _reject];
    }

    const [FriendsModel, resolveFriendsModel] = makeDelayedText();
    const [NameModel, resolveNameModel] = makeDelayedText();
    const [PostsModel, resolvePostsModel] = makeDelayedText();
    const [PhotosModel, resolvePhotosModel] = makeDelayedText();
    const [GamesModel, , rejectGamesModel] = makeDelayedText();
    function ProfileMore() {
      return {
        avatar: <Text>:avatar:</Text>,
        friends: <FriendsModel>:friends:</FriendsModel>,
        posts: <PostsModel>:posts:</PostsModel>,
        games: <GamesModel>:games:</GamesModel>,
      };
    }
    function ProfileModel() {
      return {
        photos: <PhotosModel>:photos:</PhotosModel>,
        name: <NameModel>:name:</NameModel>,
        more: <ProfileMore />,
      };
    }

    // View
    function ProfileDetails({result}) {
      return (
        <div>
          {result.model.name}
          {result.model.more.avatar}
        </div>
      );
    }
    function ProfileSidebar({result}) {
      return (
        <div>
          {result.model.photos}
          {result.model.more.friends}
        </div>
      );
    }
    function ProfilePosts({result}) {
      return <div>{result.model.more.posts}</div>;
    }
    function ProfileGames({result}) {
      return <div>{result.model.more.games}</div>;
    }
    function ProfilePage({result}) {
      return (
        <>
          <Suspense fallback={<p>(loading)</p>}>
            <ProfileDetails result={result} />
            <Suspense fallback={<p>(loading sidebar)</p>}>
              <ProfileSidebar result={result} />
            </Suspense>
            <Suspense fallback={<p>(loading posts)</p>}>
              <ProfilePosts result={result} />
            </Suspense>
            <ErrorBoundary fallback={e => <p>{e.message}</p>}>
              <Suspense fallback={<p>(loading games)</p>}>
                <ProfileGames result={result} />
              </Suspense>
            </ErrorBoundary>
          </Suspense>
        </>
      );
    }

    let {writable, readable} = getTestStream();
    ReactFlightDOMServer.pipeToNodeWritable(<ProfileModel />, writable);
    let result = ReactFlightDOMClient.readFromReadableStream(readable);

    let container = document.createElement('div');
    let root = ReactDOM.createRoot(container);
    await act(async () => {
      root.render(<ProfilePage result={result} />);
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    // This isn't enough to show anything.
    await act(async () => {
      resolveFriendsModel();
    });
    expect(container.innerHTML).toBe('<p>(loading)</p>');

    // We can now show the details. Sidebar and posts are still loading.
    await act(async () => {
      resolveNameModel();
    });
    // Advance time enough to trigger a nested fallback.
    jest.advanceTimersByTime(500);
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<p>(loading sidebar)</p>' +
        '<p>(loading posts)</p>' +
        '<p>(loading games)</p>',
    );

    // Let's *fail* loading games.
    await act(async () => {
      rejectGamesModel(new Error('Game over'));
    });
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<p>(loading sidebar)</p>' +
        '<p>(loading posts)</p>' +
        '<p>Game over</p>', // TODO: should not have message in prod.
    );

    // We can now show the sidebar.
    await act(async () => {
      resolvePhotosModel();
    });
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<div>:photos::friends:</div>' +
        '<p>(loading posts)</p>' +
        '<p>Game over</p>', // TODO: should not have message in prod.
    );

    // Show everything.
    await act(async () => {
      resolvePostsModel();
    });
    expect(container.innerHTML).toBe(
      '<div>:name::avatar:</div>' +
        '<div>:photos::friends:</div>' +
        '<div>:posts:</div>' +
        '<p>Game over</p>', // TODO: should not have message in prod.
    );
  });
});
