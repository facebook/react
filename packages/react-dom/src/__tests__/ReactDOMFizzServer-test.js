/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let JSDOM;
let Stream;
let Scheduler;
let React;
let ReactDOMClient;
let ReactDOMFizzServer;
let Suspense;
let SuspenseList;
let useSyncExternalStore;
let useSyncExternalStoreWithSelector;
let PropTypes;
let textCache;
let window;
let document;
let writable;
let CSPnonce = null;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    Scheduler = require('scheduler');
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzServer = require('react-dom/server');
    }
    Stream = require('stream');
    Suspense = React.Suspense;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.SuspenseList;
    }

    PropTypes = require('prop-types');

    if (gate(flags => flags.source)) {
      // The `with-selector` module composes the main `use-sync-external-store`
      // entrypoint. In the compiled artifacts, this is resolved to the `shim`
      // implementation by our build config, but when running the tests against
      // the source files, we need to tell Jest how to resolve it. Because this
      // is a source module, this mock has no affect on the build tests.
      jest.mock('use-sync-external-store/src/useSyncExternalStore', () =>
        jest.requireActual('react'),
      );
    }
    useSyncExternalStore = React.useSyncExternalStore;
    useSyncExternalStoreWithSelector = require('use-sync-external-store/with-selector')
      .useSyncExternalStoreWithSelector;

    textCache = new Map();

    // Test Environment
    const jsdom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body><div id="container">',
      {
        runScripts: 'dangerously',
      },
    );
    window = jsdom.window;
    document = jsdom.window.document;
    container = document.getElementById('container');

    buffer = '';
    hasErrored = false;

    writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    writable.on('data', chunk => {
      buffer += chunk;
    });
    writable.on('error', error => {
      hasErrored = true;
      fatalError = error;
    });
  });

  async function act(callback) {
    await callback();
    // Await one turn around the event loop.
    // This assumes that we'll flush everything we have so far.
    await new Promise(resolve => {
      setImmediate(resolve);
    });
    if (hasErrored) {
      throw fatalError;
    }
    // JSDOM doesn't support stream HTML parser so we need to give it a proper fragment.
    // We also want to execute any scripts that are embedded.
    // We assume that we have now received a proper fragment of HTML.
    const bufferedContent = buffer;
    buffer = '';
    const fakeBody = document.createElement('body');
    fakeBody.innerHTML = bufferedContent;
    while (fakeBody.firstChild) {
      const node = fakeBody.firstChild;
      if (
        node.nodeName === 'SCRIPT' &&
        (CSPnonce === null || node.getAttribute('nonce') === CSPnonce)
      ) {
        const script = document.createElement('script');
        script.textContent = node.textContent;
        fakeBody.removeChild(node);
        container.appendChild(script);
      } else {
        container.appendChild(node);
      }
    }
  }

  function getVisibleChildren(element) {
    const children = [];
    let node = element.firstChild;
    while (node) {
      if (node.nodeType === 1) {
        if (
          node.tagName !== 'SCRIPT' &&
          node.tagName !== 'TEMPLATE' &&
          node.tagName !== 'template' &&
          !node.hasAttribute('hidden') &&
          !node.hasAttribute('aria-hidden')
        ) {
          const props = {};
          const attributes = node.attributes;
          for (let i = 0; i < attributes.length; i++) {
            if (
              attributes[i].name === 'id' &&
              attributes[i].value.includes(':')
            ) {
              // We assume this is a React added ID that's a non-visual implementation detail.
              continue;
            }
            props[attributes[i].name] = attributes[i].value;
          }
          props.children = getVisibleChildren(node);
          children.push(React.createElement(node.tagName.toLowerCase(), props));
        }
      } else if (node.nodeType === 3) {
        children.push(node.data);
      }
      node = node.nextSibling;
    }
    return children.length === 0
      ? undefined
      : children.length === 1
      ? children[0]
      : children;
  }

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function rejectText(text, error) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'rejected',
        value: error,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'rejected';
      record.value = error;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    return text;
  }

  function AsyncText({text}) {
    return readText(text);
  }

  // @gate experimental
  it('should asynchronously load a lazy component', async () => {
    let resolveA;
    const LazyA = React.lazy(() => {
      return new Promise(r => {
        resolveA = r;
      });
    });

    let resolveB;
    const LazyB = React.lazy(() => {
      return new Promise(r => {
        resolveB = r;
      });
    });

    function TextWithPunctuation({text, punctuation}) {
      return <Text text={text + punctuation} />;
    }
    // This tests that default props of the inner element is resolved.
    TextWithPunctuation.defaultProps = {
      punctuation: '!',
    };

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <div>
          <div>
            <Suspense fallback={<Text text="Loading..." />}>
              <LazyA text="Hello" />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<Text text="Loading..." />}>
              <LazyB text="world" />
            </Suspense>
          </div>
        </div>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>Loading...</div>
        <div>Loading...</div>
      </div>,
    );
    await act(async () => {
      resolveA({default: Text});
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>Hello</div>
        <div>Loading...</div>
      </div>,
    );
    await act(async () => {
      resolveB({default: TextWithPunctuation});
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>Hello</div>
        <div>world!</div>
      </div>,
    );
  });

  // @gate experimental
  it('#23331: does not warn about hydration mismatches if something suspended in an earlier sibling', async () => {
    const makeApp = () => {
      let resolve;
      const imports = new Promise(r => {
        resolve = () => r({default: () => <span id="async">async</span>});
      });
      const Lazy = React.lazy(() => imports);

      const App = () => (
        <div>
          <Suspense fallback={<span>Loading...</span>}>
            <Lazy />
            <span id="after">after</span>
          </Suspense>
        </div>
      );

      return [App, resolve];
    };

    // Server-side
    const [App, resolve] = makeApp();
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading...</span>
      </div>,
    );
    await act(async () => {
      resolve();
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span id="async">async</span>
        <span id="after">after</span>
      </div>,
    );

    // Client-side
    const [HydrateApp, hydrateResolve] = makeApp();
    await act(async () => {
      ReactDOMClient.hydrateRoot(container, <HydrateApp />);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span id="async">async</span>
        <span id="after">after</span>
      </div>,
    );

    await act(async () => {
      hydrateResolve();
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span id="async">async</span>
        <span id="after">after</span>
      </div>,
    );
  });

  // @gate experimental
  it('should support nonce scripts', async () => {
    CSPnonce = 'R4nd0m';
    try {
      let resolve;
      const Lazy = React.lazy(() => {
        return new Promise(r => {
          resolve = r;
        });
      });

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <div>
            <Suspense fallback={<Text text="Loading..." />}>
              <Lazy text="Hello" />
            </Suspense>
          </div>,
          {nonce: 'R4nd0m'},
        );
        pipe(writable);
      });
      expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);
      await act(async () => {
        resolve({default: Text});
      });
      expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
    } finally {
      CSPnonce = null;
    }
  });

  // @gate experimental
  it('should client render a boundary if a lazy component rejects', async () => {
    let rejectComponent;
    const LazyComponent = React.lazy(() => {
      return new Promise((resolve, reject) => {
        rejectComponent = reject;
      });
    });

    const loggedErrors = [];

    function App({isClient}) {
      return (
        <div>
          <Suspense fallback={<Text text="Loading..." />}>
            {isClient ? <Text text="Hello" /> : <LazyComponent text="Hello" />}
          </Suspense>
        </div>
      );
    }

    let bootstrapped = false;
    window.__INIT__ = function() {
      bootstrapped = true;
      // Attempt to hydrate the content.
      ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(error.message);
        },
      });
    };

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
        {
          bootstrapScriptContent: '__INIT__();',
          onError(x) {
            loggedErrors.push(x);
          },
        },
      );
      pipe(writable);
    });
    expect(loggedErrors).toEqual([]);
    expect(bootstrapped).toBe(true);

    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    expect(loggedErrors).toEqual([]);

    const theError = new Error('Test');
    await act(async () => {
      rejectComponent(theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We haven't ran the client hydration yet.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    expect(Scheduler).toFlushAndYield([
      'The server could not finish this Suspense boundary, likely due to ' +
        'an error during server rendering. Switched to client rendering.',
    ]);

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);

    expect(loggedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should asynchronously load a lazy element', async () => {
    let resolveElement;
    const lazyElement = React.lazy(() => {
      return new Promise(r => {
        resolveElement = r;
      });
    });

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <div>
          <Suspense fallback={<Text text="Loading..." />}>
            {lazyElement}
          </Suspense>
        </div>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);
    // Because there is no content inside the Suspense boundary that could've
    // been written, we expect to not see any additional partial data flushed
    // yet.
    expect(container.firstChild.nextSibling).toBe(null);
    await act(async () => {
      resolveElement({default: <Text text="Hello" />});
    });
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  // @gate experimental
  it('should client render a boundary if a lazy element rejects', async () => {
    let rejectElement;
    const element = <Text text="Hello" />;
    const lazyElement = React.lazy(() => {
      return new Promise((resolve, reject) => {
        rejectElement = reject;
      });
    });

    const loggedErrors = [];

    function App({isClient}) {
      return (
        <div>
          <Suspense fallback={<Text text="Loading..." />}>
            {isClient ? element : lazyElement}
          </Suspense>
        </div>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,

        {
          onError(x) {
            loggedErrors.push(x);
          },
        },
      );
      pipe(writable);
    });
    expect(loggedErrors).toEqual([]);

    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    expect(loggedErrors).toEqual([]);

    const theError = new Error('Test');
    await act(async () => {
      rejectElement(theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We haven't ran the client hydration yet.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    expect(Scheduler).toFlushAndYield([
      'The server could not finish this Suspense boundary, likely due to ' +
        'an error during server rendering. Switched to client rendering.',
    ]);

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);

    expect(loggedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should asynchronously load the suspense boundary', async () => {
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <div>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="Hello World" />
          </Suspense>
        </div>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);
    await act(async () => {
      resolveText('Hello World');
    });
    expect(getVisibleChildren(container)).toEqual(<div>Hello World</div>);
  });

  // @gate experimental
  it('waits for pending content to come in from the server and then hydrates it', async () => {
    const ref = React.createRef();

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <h1 ref={ref}>
              <AsyncText text="Hello" />
            </h1>
          </Suspense>
        </div>
      );
    }

    let bootstrapped = false;
    window.__INIT__ = function() {
      bootstrapped = true;
      // Attempt to hydrate the content.
      ReactDOMClient.hydrateRoot(container, <App />);
    };

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
        bootstrapScriptContent: '__INIT__();',
      });
      pipe(writable);
    });

    // We're still showing a fallback.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // We already bootstrapped.
    expect(bootstrapped).toBe(true);

    // Attempt to hydrate the content.
    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // The server now updates the content in place in the fallback.
    await act(async () => {
      resolveText('Hello');
    });

    // The final HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>Hello</h1>
      </div>,
    );
    const h1 = container.getElementsByTagName('h1')[0];

    // But it is not yet hydrated.
    expect(ref.current).toBe(null);

    Scheduler.unstable_flushAll();

    // Now it's hydrated.
    expect(ref.current).toBe(h1);
  });

  // @gate experimental
  it('handles an error on the client if the server ends up erroring', async () => {
    const ref = React.createRef();

    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <b ref={ref}>{this.state.error.message}</b>;
        }
        return this.props.children;
      }
    }

    function App() {
      return (
        <ErrorBoundary>
          <div>
            <Suspense fallback="Loading...">
              <span ref={ref}>
                <AsyncText text="This Errors" />
              </span>
            </Suspense>
          </div>
        </ErrorBoundary>
      );
    }

    const loggedErrors = [];

    // We originally suspend the boundary and start streaming the loading state.
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App />,

        {
          onError(x) {
            loggedErrors.push(x);
          },
        },
      );
      pipe(writable);
    });

    // We're still showing a fallback.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    expect(loggedErrors).toEqual([]);

    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App />);
    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    const theError = new Error('Error Message');
    await act(async () => {
      rejectText('This Errors', theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // The server errored, but we still haven't hydrated. We don't know if the
    // client will succeed yet, so we still show the loading state.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);
    expect(ref.current).toBe(null);

    // Flush the hydration.
    Scheduler.unstable_flushAll();

    // Hydrating should've generated an error and replaced the suspense boundary.
    expect(getVisibleChildren(container)).toEqual(<b>Error Message</b>);

    const b = container.getElementsByTagName('b')[0];
    expect(ref.current).toBe(b);
  });

  // @gate enableSuspenseList
  // @gate experimental
  it('shows inserted items before pending in a SuspenseList as fallbacks while hydrating', async () => {
    const ref = React.createRef();

    // These are hoisted to avoid them from rerendering.
    const a = (
      <Suspense fallback="Loading A">
        <span ref={ref}>
          <AsyncText text="A" />
        </span>
      </Suspense>
    );
    const b = (
      <Suspense fallback="Loading B">
        <span>
          <Text text="B" />
        </span>
      </Suspense>
    );

    function App({showMore}) {
      return (
        <SuspenseList revealOrder="forwards">
          {a}
          {b}
          {showMore ? (
            <Suspense fallback="Loading C">
              <span>C</span>
            </Suspense>
          ) : null}
        </SuspenseList>
      );
    }

    // We originally suspend the boundary and start streaming the loading state.
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App showMore={false} />,
      );
      pipe(writable);
    });

    const root = ReactDOMClient.hydrateRoot(
      container,
      <App showMore={false} />,
    );
    Scheduler.unstable_flushAll();

    // We're not hydrated yet.
    expect(ref.current).toBe(null);
    expect(getVisibleChildren(container)).toEqual([
      'Loading A',
      // TODO: This is incorrect. It should be "Loading B" but Fizz SuspenseList
      // isn't implemented fully yet.
      <span>B</span>,
    ]);

    // Add more rows before we've hydrated the first two.
    root.render(<App showMore={true} />);
    Scheduler.unstable_flushAll();

    // We're not hydrated yet.
    expect(ref.current).toBe(null);

    // We haven't resolved yet.
    expect(getVisibleChildren(container)).toEqual([
      'Loading A',
      // TODO: This is incorrect. It should be "Loading B" but Fizz SuspenseList
      // isn't implemented fully yet.
      <span>B</span>,
      'Loading C',
    ]);

    await act(async () => {
      await resolveText('A');
    });

    Scheduler.unstable_flushAll();

    expect(getVisibleChildren(container)).toEqual([
      <span>A</span>,
      <span>B</span>,
      <span>C</span>,
    ]);

    const span = container.getElementsByTagName('span')[0];
    expect(ref.current).toBe(span);
  });

  // @gate experimental
  it('client renders a boundary if it does not resolve before aborting', async () => {
    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <h1>
              <AsyncText text="Hello" />
            </h1>
          </Suspense>
        </div>
      );
    }

    let controls;
    await act(async () => {
      controls = ReactDOMFizzServer.renderToPipeableStream(<App />);
      controls.pipe(writable);
    });

    // We're still showing a fallback.

    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // We abort the server response.
    await act(async () => {
      controls.abort();
    });

    // We still can't render it on the client.
    expect(Scheduler).toFlushAndYield([
      'The server could not finish this Suspense boundary, likely due to an ' +
        'error during server rendering. Switched to client rendering.',
    ]);
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // We now resolve it on the client.
    resolveText('Hello');

    Scheduler.unstable_flushAll();

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>Hello</h1>
      </div>,
    );
  });

  // @gate experimental
  it('should allow for two containers to be written to the same document', async () => {
    // We create two passthrough streams for each container to write into.
    // Notably we don't implement a end() call for these. Because we don't want to
    // close the underlying stream just because one of the streams is done. Instead
    // we manually close when both are done.
    const writableA = new Stream.Writable();
    writableA._write = (chunk, encoding, next) => {
      writable.write(chunk, encoding, next);
    };
    const writableB = new Stream.Writable();
    writableB._write = (chunk, encoding, next) => {
      writable.write(chunk, encoding, next);
    };

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        // We use two nested boundaries to flush out coverage of an old reentrancy bug.
        <Suspense fallback="Loading...">
          <Suspense fallback={<Text text="Loading A..." />}>
            <>
              <Text text="This will show A: " />
              <div>
                <AsyncText text="A" />
              </div>
            </>
          </Suspense>
        </Suspense>,
        {
          identifierPrefix: 'A_',
          onShellReady() {
            writableA.write('<div id="container-A">');
            pipe(writableA);
            writableA.write('</div>');
          },
        },
      );
    });

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <Suspense fallback={<Text text="Loading B..." />}>
          <Text text="This will show B: " />
          <div>
            <AsyncText text="B" />
          </div>
        </Suspense>,
        {
          identifierPrefix: 'B_',
          onShellReady() {
            writableB.write('<div id="container-B">');
            pipe(writableB);
            writableB.write('</div>');
          },
        },
      );
    });

    expect(getVisibleChildren(container)).toEqual([
      <div id="container-A">Loading A...</div>,
      <div id="container-B">Loading B...</div>,
    ]);

    await act(async () => {
      resolveText('B');
    });

    expect(getVisibleChildren(container)).toEqual([
      <div id="container-A">Loading A...</div>,
      <div id="container-B">
        This will show B: <div>B</div>
      </div>,
    ]);

    await act(async () => {
      resolveText('A');
    });

    // We're done writing both streams now.
    writable.end();

    expect(getVisibleChildren(container)).toEqual([
      <div id="container-A">
        This will show A: <div>A</div>
      </div>,
      <div id="container-B">
        This will show B: <div>B</div>
      </div>,
    ]);
  });

  // @gate experimental
  it('can resolve async content in esoteric parents', async () => {
    function AsyncOption({text}) {
      return <option>{readText(text)}</option>;
    }

    function AsyncCol({className}) {
      return <col className={readText(className)} />;
    }

    function AsyncPath({id}) {
      return <path id={readText(id)} />;
    }

    function AsyncMi({id}) {
      return <mi id={readText(id)} />;
    }

    function App() {
      return (
        <div>
          <select>
            <Suspense fallback="Loading...">
              <AsyncOption text="Hello" />
            </Suspense>
          </select>
          <Suspense fallback="Loading...">
            <table>
              <colgroup>
                <AsyncCol className="World" />
              </colgroup>
            </table>
            <svg>
              <g>
                <AsyncPath id="my-path" />
              </g>
            </svg>
            <math>
              <AsyncMi id="my-mi" />
            </math>
          </Suspense>
        </div>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <select>Loading...</select>Loading...
      </div>,
    );

    await act(async () => {
      resolveText('Hello');
    });

    await act(async () => {
      resolveText('World');
    });

    await act(async () => {
      resolveText('my-path');
      resolveText('my-mi');
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <select>
          <option>Hello</option>
        </select>
        <table>
          <colgroup>
            <col class="World" />
          </colgroup>
        </table>
        <svg>
          <g>
            <path id="my-path" />
          </g>
        </svg>
        <math>
          <mi id="my-mi" />
        </math>
      </div>,
    );

    expect(container.querySelector('#my-path').namespaceURI).toBe(
      'http://www.w3.org/2000/svg',
    );
    expect(container.querySelector('#my-mi').namespaceURI).toBe(
      'http://www.w3.org/1998/Math/MathML',
    );
  });

  // @gate experimental
  it('can resolve async content in table parents', async () => {
    function AsyncTableBody({className, children}) {
      return <tbody className={readText(className)}>{children}</tbody>;
    }

    function AsyncTableRow({className, children}) {
      return <tr className={readText(className)}>{children}</tr>;
    }

    function AsyncTableCell({text}) {
      return <td>{readText(text)}</td>;
    }

    function App() {
      return (
        <table>
          <Suspense
            fallback={
              <tbody>
                <tr>
                  <td>Loading...</td>
                </tr>
              </tbody>
            }>
            <AsyncTableBody className="A">
              <AsyncTableRow className="B">
                <AsyncTableCell text="C" />
              </AsyncTableRow>
            </AsyncTableBody>
          </Suspense>
        </table>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <table>
        <tbody>
          <tr>
            <td>Loading...</td>
          </tr>
        </tbody>
      </table>,
    );

    await act(async () => {
      resolveText('A');
    });

    await act(async () => {
      resolveText('B');
    });

    await act(async () => {
      resolveText('C');
    });

    expect(getVisibleChildren(container)).toEqual(
      <table>
        <tbody class="A">
          <tr class="B">
            <td>C</td>
          </tr>
        </tbody>
      </table>,
    );
  });

  // @gate experimental
  it('can stream into an SVG container', async () => {
    function AsyncPath({id}) {
      return <path id={readText(id)} />;
    }

    function App() {
      return (
        <g>
          <Suspense fallback={<text>Loading...</text>}>
            <AsyncPath id="my-path" />
          </Suspense>
        </g>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App />,

        {
          namespaceURI: 'http://www.w3.org/2000/svg',
          onShellReady() {
            writable.write('<svg>');
            pipe(writable);
            writable.write('</svg>');
          },
        },
      );
    });

    expect(getVisibleChildren(container)).toEqual(
      <svg>
        <g>
          <text>Loading...</text>
        </g>
      </svg>,
    );

    await act(async () => {
      resolveText('my-path');
    });

    expect(getVisibleChildren(container)).toEqual(
      <svg>
        <g>
          <path id="my-path" />
        </g>
      </svg>,
    );

    expect(container.querySelector('#my-path').namespaceURI).toBe(
      'http://www.w3.org/2000/svg',
    );
  });

  function normalizeCodeLocInfo(str) {
    return (
      str &&
      str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function(m, name) {
        return '\n    in ' + name + ' (at **)';
      })
    );
  }

  // @gate experimental
  it('should include a component stack across suspended boundaries', async () => {
    function B() {
      const children = [readText('Hello'), readText('World')];
      // Intentionally trigger a key warning here.
      return (
        <div>
          {children.map(t => (
            <span>{t}</span>
          ))}
        </div>
      );
    }
    function C() {
      return (
        <inCorrectTag>
          <Text text="Loading" />
        </inCorrectTag>
      );
    }
    function A() {
      return (
        <div>
          <Suspense fallback={<C />}>
            <B />
          </Suspense>
        </div>
      );
    }

    // We can't use the toErrorDev helper here because this is an async act.
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      mockError(...args.map(normalizeCodeLocInfo));
    };

    try {
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<A />);
        pipe(writable);
      });

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <incorrecttag>Loading</incorrecttag>
        </div>,
      );

      if (__DEV__) {
        expect(mockError).toHaveBeenCalledWith(
          'Warning: <%s /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.%s',
          'inCorrectTag',
          '\n' +
            '    in inCorrectTag (at **)\n' +
            '    in C (at **)\n' +
            '    in Suspense (at **)\n' +
            '    in div (at **)\n' +
            '    in A (at **)',
        );
        mockError.mockClear();
      } else {
        expect(mockError).not.toHaveBeenCalled();
      }

      await act(async () => {
        resolveText('Hello');
        resolveText('World');
      });

      if (__DEV__) {
        expect(mockError).toHaveBeenCalledWith(
          'Warning: Each child in a list should have a unique "key" prop.%s%s' +
            ' See https://reactjs.org/link/warning-keys for more information.%s',
          '\n\nCheck the top-level render call using <div>.',
          '',
          '\n' +
            '    in span (at **)\n' +
            '    in B (at **)\n' +
            '    in Suspense (at **)\n' +
            '    in div (at **)\n' +
            '    in A (at **)',
        );
      } else {
        expect(mockError).not.toHaveBeenCalled();
      }

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>
            <span>Hello</span>
            <span>World</span>
          </div>
        </div>,
      );
    } finally {
      console.error = originalConsoleError;
    }
  });

  // @gate experimental
  it('should can suspend in a class component with legacy context', async () => {
    class TestProvider extends React.Component {
      static childContextTypes = {
        test: PropTypes.string,
      };
      state = {ctxToSet: null};
      static getDerivedStateFromProps(props, state) {
        return {ctxToSet: props.ctx};
      }
      getChildContext() {
        return {
          test: this.state.ctxToSet,
        };
      }
      render() {
        return this.props.children;
      }
    }

    class TestConsumer extends React.Component {
      static contextTypes = {
        test: PropTypes.string,
      };
      render() {
        const child = (
          <b>
            <Text text={this.context.test} />
          </b>
        );
        if (this.props.prefix) {
          return [readText(this.props.prefix), child];
        }
        return child;
      }
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <TestProvider ctx="A">
          <div>
            <Suspense fallback={[<Text text="Loading: " />, <TestConsumer />]}>
              <TestProvider ctx="B">
                <TestConsumer prefix="Hello: " />
              </TestProvider>
              <TestConsumer />
            </Suspense>
          </div>
        </TestProvider>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        Loading: <b>A</b>
      </div>,
    );
    await act(async () => {
      resolveText('Hello: ');
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        Hello: <b>B</b>
        <b>A</b>
      </div>,
    );
  });

  // @gate experimental
  it('should resume the context from where it left off', async () => {
    const ContextA = React.createContext('A0');
    const ContextB = React.createContext('B0');

    function PrintA() {
      return (
        <ContextA.Consumer>{value => <Text text={value} />}</ContextA.Consumer>
      );
    }

    class PrintB extends React.Component {
      static contextType = ContextB;
      render() {
        return <Text text={this.context} />;
      }
    }

    function AsyncParent({text, children}) {
      return (
        <>
          <AsyncText text={text} />
          <b>{children}</b>
        </>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <div>
          <PrintA />
          <div>
            <ContextA.Provider value="A0.1">
              <Suspense fallback={<Text text="Loading..." />}>
                <AsyncParent text="Child:">
                  <PrintA />
                </AsyncParent>
                <PrintB />
              </Suspense>
            </ContextA.Provider>
          </div>
          <PrintA />
        </div>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        A0<div>Loading...</div>A0
      </div>,
    );
    await act(async () => {
      resolveText('Child:');
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        A0
        <div>
          Child:<b>A0.1</b>B0
        </div>
        A0
      </div>,
    );
  });

  // @gate experimental
  it('should recover the outer context when an error happens inside a provider', async () => {
    const ContextA = React.createContext('A0');
    const ContextB = React.createContext('B0');

    function PrintA() {
      return (
        <ContextA.Consumer>{value => <Text text={value} />}</ContextA.Consumer>
      );
    }

    class PrintB extends React.Component {
      static contextType = ContextB;
      render() {
        return <Text text={this.context} />;
      }
    }

    function Throws() {
      const value = React.useContext(ContextA);
      throw new Error(value);
    }

    const loggedErrors = [];
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <div>
          <PrintA />
          <div>
            <ContextA.Provider value="A0.1">
              <Suspense
                fallback={
                  <b>
                    <Text text="Loading..." />
                  </b>
                }>
                <ContextA.Provider value="A0.1.1">
                  <Throws />
                </ContextA.Provider>
              </Suspense>
              <PrintB />
            </ContextA.Provider>
          </div>
          <PrintA />
        </div>,

        {
          onError(x) {
            loggedErrors.push(x);
          },
        },
      );
      pipe(writable);
    });
    expect(loggedErrors.length).toBe(1);
    expect(loggedErrors[0].message).toEqual('A0.1.1');
    expect(getVisibleChildren(container)).toEqual(
      <div>
        A0
        <div>
          <b>Loading...</b>B0
        </div>
        A0
      </div>,
    );
  });

  // @gate experimental
  it('client renders a boundary if it errors before finishing the fallback', async () => {
    function App({isClient}) {
      return (
        <Suspense fallback="Loading root...">
          <div>
            <Suspense fallback={<AsyncText text="Loading..." />}>
              <h1>
                {isClient ? <Text text="Hello" /> : <AsyncText text="Hello" />}
              </h1>
            </Suspense>
          </div>
        </Suspense>
      );
    }

    const loggedErrors = [];
    let controls;
    await act(async () => {
      controls = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,

        {
          onError(x) {
            loggedErrors.push(x);
          },
        },
      );
      controls.pipe(writable);
    });

    // We're still showing a fallback.

    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual('Loading root...');

    expect(loggedErrors).toEqual([]);

    const theError = new Error('Test');
    // Error the content, but we don't have a fallback yet.
    await act(async () => {
      rejectText('Hello', theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We still can't render it on the client because we haven't unblocked the parent.
    Scheduler.unstable_flushAll();
    expect(getVisibleChildren(container)).toEqual('Loading root...');

    // Unblock the loading state
    await act(async () => {
      resolveText('Loading...');
    });

    // Now we're able to show the inner boundary.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // That will let us client render it instead.
    expect(Scheduler).toFlushAndYield([
      'The server could not finish this Suspense boundary, likely due to ' +
        'an error during server rendering. Switched to client rendering.',
    ]);

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>Hello</h1>
      </div>,
    );

    expect(loggedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should be able to abort the fallback if the main content finishes first', async () => {
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <Suspense fallback={<Text text="Loading Outer" />}>
          <div>
            <Suspense
              fallback={
                <div>
                  <AsyncText text="Loading" />
                  Inner
                </div>
              }>
              <AsyncText text="Hello" />
            </Suspense>
          </div>
        </Suspense>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual('Loading Outer');
    // We should have received a partial segment containing the a partial of the fallback.
    expect(container.innerHTML).toContain('Inner');
    await act(async () => {
      resolveText('Hello');
    });
    // We should've been able to display the content without waiting for the rest of the fallback.
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  // @gate experimental && enableSuspenseAvoidThisFallbackFizz
  it('should respect unstable_avoidThisFallback', async () => {
    const resolved = {
      0: false,
      1: false,
    };
    const promiseRes = {};
    const promises = {
      0: new Promise(res => {
        promiseRes[0] = () => {
          resolved[0] = true;
          res();
        };
      }),
      1: new Promise(res => {
        promiseRes[1] = () => {
          resolved[1] = true;
          res();
        };
      }),
    };

    const InnerComponent = ({isClient, depth}) => {
      if (isClient) {
        // Resuspend after re-rendering on client to check that fallback shows on client
        throw new Promise(() => {});
      }
      if (!resolved[depth]) {
        throw promises[depth];
      }
      return (
        <div>
          <Text text={`resolved ${depth}`} />
        </div>
      );
    };

    function App({isClient}) {
      return (
        <div>
          <Text text="Non Suspense Content" />
          <Suspense
            fallback={
              <span>
                <Text text="Avoided Fallback" />
              </span>
            }
            unstable_avoidThisFallback={true}>
            <InnerComponent isClient={isClient} depth={0} />
            <div>
              <Suspense fallback={<Text text="Fallback" />}>
                <Suspense
                  fallback={
                    <span>
                      <Text text="Avoided Fallback2" />
                    </span>
                  }
                  unstable_avoidThisFallback={true}>
                  <InnerComponent isClient={isClient} depth={1} />
                </Suspense>
              </Suspense>
            </div>
          </Suspense>
        </div>
      );
    }

    await jest.runAllTimers();

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });

    // Nothing is output since root has a suspense with avoidedThisFallback that hasn't resolved
    expect(getVisibleChildren(container)).toEqual(undefined);
    expect(container.innerHTML).not.toContain('Avoided Fallback');

    // resolve first suspense component with avoidThisFallback
    await act(async () => {
      promiseRes[0]();
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        Non Suspense Content
        <div>resolved 0</div>
        <div>Fallback</div>
      </div>,
    );

    expect(container.innerHTML).not.toContain('Avoided Fallback2');

    await act(async () => {
      promiseRes[1]();
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        Non Suspense Content
        <div>resolved 0</div>
        <div>
          <div>resolved 1</div>
        </div>
      </div>,
    );

    let root;
    await act(async () => {
      root = ReactDOMClient.hydrateRoot(container, <App isClient={false} />);
      Scheduler.unstable_flushAll();
      await jest.runAllTimers();
    });

    // No change after hydration
    expect(getVisibleChildren(container)).toEqual(
      <div>
        Non Suspense Content
        <div>resolved 0</div>
        <div>
          <div>resolved 1</div>
        </div>
      </div>,
    );

    await act(async () => {
      // Trigger update by changing isClient to true
      root.render(<App isClient={true} />);
      Scheduler.unstable_flushAll();
      await jest.runAllTimers();
    });

    // Now that we've resuspended at the root we show the root fallback
    expect(getVisibleChildren(container)).toEqual(
      <div>
        Non Suspense Content
        <div style="display: none;">resolved 0</div>
        <div style="display: none;">
          <div>resolved 1</div>
        </div>
        <span>Avoided Fallback</span>
      </div>,
    );
  });

  // @gate experimental
  it('calls getServerSnapshot instead of getSnapshot', async () => {
    const ref = React.createRef();

    function getServerSnapshot() {
      return 'server';
    }

    function getClientSnapshot() {
      return 'client';
    }

    function subscribe() {
      return () => {};
    }

    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      return text;
    }

    function App() {
      const value = useSyncExternalStore(
        subscribe,
        getClientSnapshot,
        getServerSnapshot,
      );
      return (
        <div ref={ref}>
          <Child text={value} />
        </div>
      );
    }

    const loggedErrors = [];
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <Suspense fallback="Loading...">
          <App />
        </Suspense>,
        {
          onError(x) {
            loggedErrors.push(x);
          },
        },
      );
      pipe(writable);
    });
    expect(Scheduler).toHaveYielded(['server']);

    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Log recoverable error: ' + error.message,
        );
      },
    });

    if (gate(flags => flags.enableClientRenderFallbackOnHydrationMismatch)) {
      expect(() => {
        // The first paint switches to client rendering due to mismatch
        expect(Scheduler).toFlushUntilNextPaint([
          'client',
          'Log recoverable error: Hydration failed because the initial ' +
            'UI does not match what was rendered on the server.',
          'Log recoverable error: There was an error while hydrating. ' +
            'Because the error happened outside of a Suspense boundary, the ' +
            'entire root will switch to client rendering.',
        ]);
      }).toErrorDev(
        [
          'Warning: An error occurred during hydration. The server HTML was replaced with client content in <div>.',
          'Warning: Expected server HTML to contain a matching <div> in <div>.\n' +
            '    in div (at **)\n' +
            '    in App (at **)',
        ],
        {withoutStack: 1},
      );
      expect(getVisibleChildren(container)).toEqual(<div>client</div>);
    } else {
      const serverRenderedDiv = container.getElementsByTagName('div')[0];
      // The first paint uses the server snapshot
      expect(Scheduler).toFlushUntilNextPaint(['server']);
      expect(getVisibleChildren(container)).toEqual(<div>server</div>);
      // Hydration succeeded
      expect(ref.current).toEqual(serverRenderedDiv);

      // Asynchronously we detect that the store has changed on the client,
      // and patch up the inconsistency
      expect(Scheduler).toFlushUntilNextPaint(['client']);
      expect(getVisibleChildren(container)).toEqual(<div>client</div>);
      expect(ref.current).toEqual(serverRenderedDiv);
    }
  });

  // The selector implementation uses the lazy ref initialization pattern
  // @gate experimental
  it('calls getServerSnapshot instead of getSnapshot (with selector and isEqual)', async () => {
    // Same as previous test, but with a selector that returns a complex object
    // that is memoized with a custom `isEqual` function.
    const ref = React.createRef();
    function getServerSnapshot() {
      return {env: 'server', other: 'unrelated'};
    }
    function getClientSnapshot() {
      return {env: 'client', other: 'unrelated'};
    }
    function selector({env}) {
      return {env};
    }
    function isEqual(a, b) {
      return a.env === b.env;
    }
    function subscribe() {
      return () => {};
    }
    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      return text;
    }
    function App() {
      const {env} = useSyncExternalStoreWithSelector(
        subscribe,
        getClientSnapshot,
        getServerSnapshot,
        selector,
        isEqual,
      );
      return (
        <div ref={ref}>
          <Child text={env} />
        </div>
      );
    }
    const loggedErrors = [];
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <Suspense fallback="Loading...">
          <App />
        </Suspense>,
        {
          onError(x) {
            loggedErrors.push(x);
          },
        },
      );
      pipe(writable);
    });
    expect(Scheduler).toHaveYielded(['server']);

    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Log recoverable error: ' + error.message,
        );
      },
    });

    if (gate(flags => flags.enableClientRenderFallbackOnHydrationMismatch)) {
      // The first paint uses the client due to mismatch forcing client render
      expect(() => {
        // The first paint switches to client rendering due to mismatch
        expect(Scheduler).toFlushUntilNextPaint([
          'client',
          'Log recoverable error: Hydration failed because the initial ' +
            'UI does not match what was rendered on the server.',
          'Log recoverable error: There was an error while hydrating. ' +
            'Because the error happened outside of a Suspense boundary, the ' +
            'entire root will switch to client rendering.',
        ]);
      }).toErrorDev(
        [
          'Warning: An error occurred during hydration. The server HTML was replaced with client content',
          'Warning: Expected server HTML to contain a matching <div> in <div>.\n' +
            '    in div (at **)\n' +
            '    in App (at **)',
        ],
        {withoutStack: 1},
      );
      expect(getVisibleChildren(container)).toEqual(<div>client</div>);
    } else {
      const serverRenderedDiv = container.getElementsByTagName('div')[0];

      // The first paint uses the server snapshot
      expect(Scheduler).toFlushUntilNextPaint(['server']);
      expect(getVisibleChildren(container)).toEqual(<div>server</div>);
      // Hydration succeeded
      expect(ref.current).toEqual(serverRenderedDiv);

      // Asynchronously we detect that the store has changed on the client,
      // and patch up the inconsistency
      expect(Scheduler).toFlushUntilNextPaint(['client']);
      expect(getVisibleChildren(container)).toEqual(<div>client</div>);
      expect(ref.current).toEqual(serverRenderedDiv);
    }
  });

  // @gate experimental
  it(
    'errors during hydration in the shell force a client render at the ' +
      'root, and during the client render it recovers',
    async () => {
      let isClient = false;

      function subscribe() {
        return () => {};
      }
      function getClientSnapshot() {
        return 'Yay!';
      }

      // At the time of writing, the only API that exposes whether it's currently
      // hydrating is the `getServerSnapshot` API, so I'm using that here to
      // simulate an error during hydration.
      function getServerSnapshot() {
        if (isClient) {
          throw new Error('Hydration error');
        }
        return 'Yay!';
      }

      function Child() {
        const value = useSyncExternalStore(
          subscribe,
          getClientSnapshot,
          getServerSnapshot,
        );
        Scheduler.unstable_yieldValue(value);
        return value;
      }

      const spanRef = React.createRef();

      function App() {
        return (
          <span ref={spanRef}>
            <Child />
          </span>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(Scheduler).toHaveYielded(['Yay!']);

      const span = container.getElementsByTagName('span')[0];

      // Hydrate the tree. Child will throw during hydration, but not when it
      // falls back to client rendering.
      isClient = true;
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(error.message);
        },
      });

      // An error logged but instead of surfacing it to the UI, we switched
      // to client rendering.
      expect(() => {
        expect(Scheduler).toFlushAndYield([
          'Yay!',
          'Hydration error',
          'There was an error while hydrating. Because the error happened ' +
            'outside of a Suspense boundary, the entire root will switch ' +
            'to client rendering.',
        ]);
      }).toErrorDev(
        'An error occurred during hydration. The server HTML was replaced',
        {withoutStack: true},
      );
      expect(getVisibleChildren(container)).toEqual(<span>Yay!</span>);

      // The node that's inside the boundary that errored during hydration was
      // not hydrated.
      expect(spanRef.current).not.toBe(span);
    },
  );

  // @gate experimental
  it(
    'errors during hydration force a client render at the nearest Suspense ' +
      'boundary, and during the client render it recovers',
    async () => {
      let isClient = false;

      function subscribe() {
        return () => {};
      }
      function getClientSnapshot() {
        return 'Yay!';
      }

      // At the time of writing, the only API that exposes whether it's currently
      // hydrating is the `getServerSnapshot` API, so I'm using that here to
      // simulate an error during hydration.
      function getServerSnapshot() {
        if (isClient) {
          throw new Error('Hydration error');
        }
        return 'Yay!';
      }

      function Child() {
        const value = useSyncExternalStore(
          subscribe,
          getClientSnapshot,
          getServerSnapshot,
        );
        Scheduler.unstable_yieldValue(value);
        return value;
      }

      const span1Ref = React.createRef();
      const span2Ref = React.createRef();
      const span3Ref = React.createRef();

      function App() {
        return (
          <div>
            <span ref={span1Ref} />
            <Suspense fallback="Loading...">
              <span ref={span2Ref}>
                <Child />
              </span>
            </Suspense>
            <span ref={span3Ref} />
          </div>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(Scheduler).toHaveYielded(['Yay!']);

      const [span1, span2, span3] = container.getElementsByTagName('span');

      // Hydrate the tree. Child will throw during hydration, but not when it
      // falls back to client rendering.
      isClient = true;
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(error.message);
        },
      });

      // An error logged but instead of surfacing it to the UI, we switched
      // to client rendering.
      expect(Scheduler).toFlushAndYield([
        'Yay!',
        'Hydration error',
        'There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <span />
          <span>Yay!</span>
          <span />
        </div>,
      );

      // The node that's inside the boundary that errored during hydration was
      // not hydrated.
      expect(span2Ref.current).not.toBe(span2);

      // But the nodes outside the boundary were.
      expect(span1Ref.current).toBe(span1);
      expect(span3Ref.current).toBe(span3);
    },
  );

  // @gate experimental
  it(
    'errors during hydration force a client render at the nearest Suspense ' +
      'boundary, and during the client render it fails again',
    async () => {
      // Similar to previous test, but the client render errors, too. We should
      // be able to capture it with an error boundary.

      let isClient = false;

      class ErrorBoundary extends React.Component {
        state = {error: null};
        static getDerivedStateFromError(error) {
          return {error};
        }
        render() {
          if (this.state.error !== null) {
            return this.state.error.message;
          }
          return this.props.children;
        }
      }

      function Child() {
        if (isClient) {
          throw new Error('Oops!');
        }
        Scheduler.unstable_yieldValue('Yay!');
        return 'Yay!';
      }

      const span1Ref = React.createRef();
      const span2Ref = React.createRef();
      const span3Ref = React.createRef();

      function App() {
        return (
          <ErrorBoundary>
            <span ref={span1Ref} />
            <Suspense fallback="Loading...">
              <span ref={span2Ref}>
                <Child />
              </span>
            </Suspense>
            <span ref={span3Ref} />
          </ErrorBoundary>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(Scheduler).toHaveYielded(['Yay!']);

      // Hydrate the tree. Child will throw during render.
      isClient = true;
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(
            'Log recoverable error: ' + error.message,
          );
        },
      });

      // Because we failed to recover from the error, onRecoverableError
      // shouldn't be called.
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual('Oops!');
    },
  );

  // @gate experimental
  it(
    'errors during hydration force a client render at the nearest Suspense ' +
      'boundary, and during the client render it recovers, then a deeper ' +
      'child suspends',
    async () => {
      let isClient = false;

      function subscribe() {
        return () => {};
      }
      function getClientSnapshot() {
        return 'Yay!';
      }

      // At the time of writing, the only API that exposes whether it's currently
      // hydrating is the `getServerSnapshot` API, so I'm using that here to
      // simulate an error during hydration.
      function getServerSnapshot() {
        if (isClient) {
          throw new Error('Hydration error');
        }
        return 'Yay!';
      }

      function Child() {
        const value = useSyncExternalStore(
          subscribe,
          getClientSnapshot,
          getServerSnapshot,
        );
        if (isClient) {
          readText(value);
        }
        Scheduler.unstable_yieldValue(value);
        return value;
      }

      const span1Ref = React.createRef();
      const span2Ref = React.createRef();
      const span3Ref = React.createRef();

      function App() {
        return (
          <div>
            <span ref={span1Ref} />
            <Suspense fallback="Loading...">
              <span ref={span2Ref}>
                <Child />
              </span>
            </Suspense>
            <span ref={span3Ref} />
          </div>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(Scheduler).toHaveYielded(['Yay!']);

      const [span1, span2, span3] = container.getElementsByTagName('span');

      // Hydrate the tree. Child will throw during hydration, but not when it
      // falls back to client rendering.
      isClient = true;
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(error.message);
        },
      });

      // An error logged but instead of surfacing it to the UI, we switched
      // to client rendering.
      expect(Scheduler).toFlushAndYield([
        'Hydration error',
        'There was an error while hydrating this Suspense boundary. Switched ' +
          'to client rendering.',
      ]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <span />
          Loading...
          <span />
        </div>,
      );

      await act(async () => {
        resolveText('Yay!');
      });
      expect(Scheduler).toFlushAndYield(['Yay!']);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <span />
          <span>Yay!</span>
          <span />
        </div>,
      );

      // The node that's inside the boundary that errored during hydration was
      // not hydrated.
      expect(span2Ref.current).not.toBe(span2);

      // But the nodes outside the boundary were.
      expect(span1Ref.current).toBe(span1);
      expect(span3Ref.current).toBe(span3);
    },
  );

  it('logs regular (non-hydration) errors when the UI recovers', async () => {
    let shouldThrow = true;

    function A() {
      if (shouldThrow) {
        Scheduler.unstable_yieldValue('Oops!');
        throw new Error('Oops!');
      }
      Scheduler.unstable_yieldValue('A');
      return 'A';
    }

    function B() {
      Scheduler.unstable_yieldValue('B');
      return 'B';
    }

    function App() {
      return (
        <>
          <A />
          <B />
        </>
      );
    }

    const root = ReactDOMClient.createRoot(container, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Logged a recoverable error: ' + error.message,
        );
      },
    });
    React.startTransition(() => {
      root.render(<App />);
    });

    // Partially render A, but yield before the render has finished
    expect(Scheduler).toFlushAndYieldThrough(['Oops!', 'Oops!']);

    // React will try rendering again synchronously. During the retry, A will
    // not throw. This simulates a concurrent data race that is fixed by
    // blocking the main thread.
    shouldThrow = false;
    expect(Scheduler).toFlushAndYield([
      // Finish initial render attempt
      'B',

      // Render again, synchronously
      'A',
      'B',

      // Log the error
      'Logged a recoverable error: Oops!',
    ]);

    // UI looks normal
    expect(container.textContent).toEqual('AB');
  });

  // @gate experimental
  it('logs multiple hydration errors in the same render', async () => {
    let isClient = false;

    function subscribe() {
      return () => {};
    }
    function getClientSnapshot() {
      return 'Yay!';
    }
    function getServerSnapshot() {
      if (isClient) {
        throw new Error('Hydration error');
      }
      return 'Yay!';
    }

    function Child({label}) {
      // This will throw during client hydration. Only reason to use
      // useSyncExternalStore in this test is because getServerSnapshot has the
      // ability to observe whether we're hydrating.
      useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
      Scheduler.unstable_yieldValue(label);
      return label;
    }

    function App() {
      return (
        <>
          <Suspense fallback="Loading...">
            <Child label="A" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child label="B" />
          </Suspense>
        </>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(Scheduler).toHaveYielded(['A', 'B']);

    // Hydrate the tree. Child will throw during hydration, but not when it
    // falls back to client rendering.
    isClient = true;
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Logged recoverable error: ' + error.message,
        );
      },
    });

    expect(Scheduler).toFlushAndYield([
      'A',
      'B',

      'Logged recoverable error: Hydration error',
      'Logged recoverable error: There was an error while hydrating this ' +
        'Suspense boundary. Switched to client rendering.',

      'Logged recoverable error: Hydration error',
      'Logged recoverable error: There was an error while hydrating this ' +
        'Suspense boundary. Switched to client rendering.',
    ]);
  });

  // @gate enableServerContext && experimental
  it('supports ServerContext', async () => {
    let ServerContext;
    function inlineLazyServerContextInitialization() {
      if (!ServerContext) {
        ServerContext = React.createServerContext('ServerContext', 'default');
      }
      return ServerContext;
    }

    function Foo() {
      inlineLazyServerContextInitialization();
      return (
        <>
          <ServerContext.Provider value="hi this is server outer">
            <ServerContext.Provider value="hi this is server">
              <Bar />
            </ServerContext.Provider>
            <ServerContext.Provider value="hi this is server2">
              <Bar />
            </ServerContext.Provider>
            <Bar />
          </ServerContext.Provider>
          <ServerContext.Provider value="hi this is server outer2">
            <Bar />
          </ServerContext.Provider>
          <Bar />
        </>
      );
    }
    function Bar() {
      const context = React.useContext(inlineLazyServerContextInitialization());
      return <span>{context}</span>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual([
      <span>hi this is server</span>,
      <span>hi this is server2</span>,
      <span>hi this is server outer</span>,
      <span>hi this is server outer2</span>,
      <span>default</span>,
    ]);
  });
});
