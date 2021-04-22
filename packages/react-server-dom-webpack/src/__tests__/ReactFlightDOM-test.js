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

let webpackModuleIdx = 0;
let webpackModules = {};
let webpackMap = {};
global.__webpack_require__ = function(id) {
  return webpackModules[id];
};

let act;
let Stream;
let React;
let ReactDOM;
let ReactServerDOMWriter;
let ReactServerDOMReader;

describe('ReactFlightDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    webpackModules = {};
    webpackMap = {};
    act = require('react-dom/test-utils').unstable_concurrentAct;
    Stream = require('stream');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactServerDOMWriter = require('react-server-dom-webpack/writer.node.server');
    ReactServerDOMReader = require('react-server-dom-webpack');
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

    const {writable, readable} = getTestStream();
    ReactServerDOMWriter.pipeToNodeWritable(<App />, writable, webpackMap);
    const response = ReactServerDOMReader.createFromReadableStream(readable);
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

  // @gate experimental
  it('should resolve the root', async () => {
    const {Suspense} = React;

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
      return <section>{response.readRoot().html}</section>;
    }
    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message response={response} />
        </Suspense>
      );
    }

    const {writable, readable} = getTestStream();
    ReactServerDOMWriter.pipeToNodeWritable(
      <RootModel />,
      writable,
      webpackMap,
    );
    const response = ReactServerDOMReader.createFromReadableStream(readable);

    const container = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(container);
    await act(async () => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe(
      '<section><div><span>hello</span><span>world</span></div></section>',
    );
  });

  // @gate experimental
  it('should not get confused by $', async () => {
    const {Suspense} = React;

    // Model
    function RootModel() {
      return {text: '$1'};
    }

    // View
    function Message({response}) {
      return <p>{response.readRoot().text}</p>;
    }
    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message response={response} />
        </Suspense>
      );
    }

    const {writable, readable} = getTestStream();
    ReactServerDOMWriter.pipeToNodeWritable(
      <RootModel />,
      writable,
      webpackMap,
    );
    const response = ReactServerDOMReader.createFromReadableStream(readable);

    const container = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(container);
    await act(async () => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe('<p>$1</p>');
  });

  // @gate experimental
  it('should not get confused by @', async () => {
    const {Suspense} = React;

    // Model
    function RootModel() {
      return {text: '@div'};
    }

    // View
    function Message({response}) {
      return <p>{response.readRoot().text}</p>;
    }
    function App({response}) {
      return (
        <Suspense fallback={<h1>Loading...</h1>}>
          <Message response={response} />
        </Suspense>
      );
    }

    const {writable, readable} = getTestStream();
    ReactServerDOMWriter.pipeToNodeWritable(
      <RootModel />,
      writable,
      webpackMap,
    );
    const response = ReactServerDOMReader.createFromReadableStream(readable);

    const container = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(container);
    await act(async () => {
      root.render(<App response={response} />);
    });
    expect(container.innerHTML).toBe('<p>@div</p>');
  });

  // @gate experimental
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
      function DelayedText({children}, data) {
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

    const [Friends, resolveFriends] = makeDelayedText();
    const [Name, resolveName] = makeDelayedText();
    const [Posts, resolvePosts] = makeDelayedText();
    const [Photos, resolvePhotos] = makeDelayedText();
    const [Games, , rejectGames] = makeDelayedText();

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

    const {writable, readable} = getTestStream();
    ReactServerDOMWriter.pipeToNodeWritable(model, writable, webpackMap, {
      onError(x) {
        reportedErrors.push(x);
      },
    });
    const response = ReactServerDOMReader.createFromReadableStream(readable);

    const container = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(container);
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

  // @gate experimental
  it('should preserve state of client components on refetch', async () => {
    const {Suspense} = React;

    // Client

    function Page({response}) {
      return response.readRoot();
    }

    function Input() {
      return <input />;
    }

    const InputClient = moduleReference(Input);

    // Server

    function App({color}) {
      // Verify both DOM and Client children.
      return (
        <div style={{color}}>
          <input />
          <InputClient />
        </div>
      );
    }

    const container = document.createElement('div');
    const root = ReactDOM.unstable_createRoot(container);

    const stream1 = getTestStream();
    ReactServerDOMWriter.pipeToNodeWritable(
      <App color="red" />,
      stream1.writable,
      webpackMap,
    );
    const response1 = ReactServerDOMReader.createFromReadableStream(
      stream1.readable,
    );
    await act(async () => {
      root.render(
        <Suspense fallback={<p>(loading)</p>}>
          <Page response={response1} />
        </Suspense>,
      );
    });
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe('DIV');
    expect(container.children[0].style.color).toBe('red');

    // Change the DOM state for both inputs.
    const inputA = container.children[0].children[0];
    expect(inputA.tagName).toBe('INPUT');
    inputA.value = 'hello';
    const inputB = container.children[0].children[1];
    expect(inputB.tagName).toBe('INPUT');
    inputB.value = 'goodbye';

    const stream2 = getTestStream();
    ReactServerDOMWriter.pipeToNodeWritable(
      <App color="blue" />,
      stream2.writable,
      webpackMap,
    );
    const response2 = ReactServerDOMReader.createFromReadableStream(
      stream2.readable,
    );
    await act(async () => {
      root.render(
        <Suspense fallback={<p>(loading)</p>}>
          <Page response={response2} />
        </Suspense>,
      );
    });
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe('DIV');
    expect(container.children[0].style.color).toBe('blue');

    // Verify we didn't destroy the DOM for either input.
    expect(inputA === container.children[0].children[0]).toBe(true);
    expect(inputA.tagName).toBe('INPUT');
    expect(inputA.value).toBe('hello');
    expect(inputB === container.children[0].children[1]).toBe(true);
    expect(inputB.tagName).toBe('INPUT');
    expect(inputB.value).toBe('goodbye');
  });
});
