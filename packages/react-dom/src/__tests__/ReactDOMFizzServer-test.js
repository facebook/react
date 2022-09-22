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
let use;
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
    ReactDOMFizzServer = require('react-dom/server');
    Stream = require('stream');
    Suspense = React.Suspense;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.SuspenseList;
      use = React.experimental_use;
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

  function expectErrors(errorsArr, toBeDevArr, toBeProdArr) {
    const mappedErrows = errorsArr.map(({error, errorInfo}) => {
      const stack = errorInfo && errorInfo.componentStack;
      const digest = error.digest;
      if (stack) {
        return [error.message, digest, normalizeCodeLocInfo(stack)];
      } else if (digest) {
        return [error.message, digest];
      }
      return error.message;
    });
    if (__DEV__) {
      expect(mappedErrows).toEqual(toBeDevArr);
    } else {
      expect(mappedErrows).toEqual(toBeProdArr);
    }
  }

  function componentStack(components) {
    return components
      .map(component => `\n    in ${component} (at **)`)
      .join('');
  }

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
    const parent =
      container.nodeName === '#document' ? container.body : container;
    while (fakeBody.firstChild) {
      const node = fakeBody.firstChild;
      if (
        node.nodeName === 'SCRIPT' &&
        (CSPnonce === null || node.getAttribute('nonce') === CSPnonce)
      ) {
        const script = document.createElement('script');
        script.textContent = node.textContent;
        fakeBody.removeChild(node);
        parent.appendChild(script);
      } else {
        parent.appendChild(node);
      }
    }
  }

  async function actIntoEmptyDocument(callback) {
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
    // Test Environment
    const jsdom = new JSDOM(bufferedContent, {
      runScripts: 'dangerously',
    });
    window = jsdom.window;
    document = jsdom.window.document;
    container = document;
    buffer = '';
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

  function AsyncTextWrapped({as, text}) {
    const As = as;
    return <As>{readText(text)}</As>;
  }

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

  it('should client render a boundary if a lazy component rejects', async () => {
    let rejectComponent;
    const LazyComponent = React.lazy(() => {
      return new Promise((resolve, reject) => {
        rejectComponent = reject;
      });
    });

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
    const errors = [];
    window.__INIT__ = function() {
      bootstrapped = true;
      // Attempt to hydrate the content.
      ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
        onRecoverableError(error, errorInfo) {
          errors.push({error, errorInfo});
        },
      });
    };

    const theError = new Error('Test');
    const loggedErrors = [];
    function onError(x) {
      loggedErrors.push(x);
      return 'Hash of (' + x.message + ')';
    }
    const expectedDigest = onError(theError);
    loggedErrors.length = 0;

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
        {
          bootstrapScriptContent: '__INIT__();',
          onError,
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

    await act(async () => {
      rejectComponent(theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We haven't ran the client hydration yet.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    expect(Scheduler).toFlushAndYield([]);
    expectErrors(
      errors,
      [
        [
          theError.message,
          expectedDigest,
          componentStack(['Lazy', 'Suspense', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
      ],
    );

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);

    expect(loggedErrors).toEqual([theError]);
  });

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

  it('should client render a boundary if a lazy element rejects', async () => {
    let rejectElement;
    const element = <Text text="Hello" />;
    const lazyElement = React.lazy(() => {
      return new Promise((resolve, reject) => {
        rejectElement = reject;
      });
    });

    const theError = new Error('Test');
    const loggedErrors = [];
    function onError(x) {
      loggedErrors.push(x);
      return 'hash of (' + x.message + ')';
    }
    const expectedDigest = onError(theError);
    loggedErrors.length = 0;

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
          onError,
        },
      );
      pipe(writable);
    });
    expect(loggedErrors).toEqual([]);

    const errors = [];
    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error, errorInfo) {
        errors.push({error, errorInfo});
      },
    });
    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    expect(loggedErrors).toEqual([]);

    await act(async () => {
      rejectElement(theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We haven't ran the client hydration yet.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    expect(Scheduler).toFlushAndYield([]);

    expectErrors(
      errors,
      [
        [
          theError.message,
          expectedDigest,
          componentStack(['Suspense', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
      ],
    );

    // The client rendered HTML is now in place.
    // expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);

    expect(loggedErrors).toEqual([theError]);
  });

  it('Errors in boundaries should be sent to the client and reported on client render - Error before flushing', async () => {
    function Indirection({level, children}) {
      if (level > 0) {
        return <Indirection level={level - 1}>{children}</Indirection>;
      }
      return children;
    }

    const theError = new Error('uh oh');

    function Erroring({isClient}) {
      if (isClient) {
        return 'Hello World';
      }
      throw theError;
    }

    function App({isClient}) {
      return (
        <div>
          <Suspense fallback={<span>loading...</span>}>
            <Erroring isClient={isClient} />
          </Suspense>
        </div>
      );
    }

    const loggedErrors = [];
    function onError(x) {
      loggedErrors.push(x);
      return 'hash(' + x.message + ')';
    }
    const expectedDigest = onError(theError);
    loggedErrors.length = 0;

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App />,

        {
          onError,
        },
      );
      pipe(writable);
    });
    expect(loggedErrors).toEqual([theError]);

    const errors = [];
    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error, errorInfo) {
        errors.push({error, errorInfo});
      },
    });
    Scheduler.unstable_flushAll();

    expect(getVisibleChildren(container)).toEqual(<div>Hello World</div>);

    expectErrors(
      errors,
      [
        [
          theError.message,
          expectedDigest,
          componentStack(['Erroring', 'Suspense', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
      ],
    );
  });

  it('Errors in boundaries should be sent to the client and reported on client render - Error after flushing', async () => {
    let rejectComponent;
    const LazyComponent = React.lazy(() => {
      return new Promise((resolve, reject) => {
        rejectComponent = reject;
      });
    });

    function App({isClient}) {
      return (
        <div>
          <Suspense fallback={<Text text="Loading..." />}>
            {isClient ? <Text text="Hello" /> : <LazyComponent text="Hello" />}
          </Suspense>
        </div>
      );
    }

    const loggedErrors = [];
    const theError = new Error('uh oh');
    function onError(x) {
      loggedErrors.push(x);
      return 'hash(' + x.message + ')';
    }
    const expectedDigest = onError(theError);
    loggedErrors.length = 0;

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App />,

        {
          onError,
        },
      );
      pipe(writable);
    });
    expect(loggedErrors).toEqual([]);

    const errors = [];
    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error, errorInfo) {
        errors.push({error, errorInfo});
      },
    });
    Scheduler.unstable_flushAll();

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await act(async () => {
      rejectComponent(theError);
    });

    expect(loggedErrors).toEqual([theError]);
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    expect(Scheduler).toFlushAndYield([]);

    expectErrors(
      errors,
      [
        [
          theError.message,
          expectedDigest,
          componentStack(['Lazy', 'Suspense', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
      ],
    );

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
    expect(loggedErrors).toEqual([theError]);
  });

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

    const loggedErrors = [];
    const expectedDigest = 'Hash for Abort';
    function onError(error) {
      loggedErrors.push(error);
      return expectedDigest;
    }

    let controls;
    await act(async () => {
      controls = ReactDOMFizzServer.renderToPipeableStream(<App />, {onError});
      controls.pipe(writable);
    });

    // We're still showing a fallback.

    const errors = [];
    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error, errorInfo) {
        errors.push({error, errorInfo});
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
    expect(Scheduler).toFlushAndYield([]);
    expectErrors(
      errors,
      [
        [
          'The server did not finish this Suspense boundary: The render was aborted by the server without a reason.',
          expectedDigest,
          componentStack(['h1', 'Suspense', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
      ],
    );
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

    const theError = new Error('Test');
    const loggedErrors = [];
    function onError(x) {
      loggedErrors.push(x);
      return `hash of (${x.message})`;
    }
    const expectedDigest = onError(theError);
    loggedErrors.length = 0;

    let controls;
    await act(async () => {
      controls = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,

        {
          onError,
        },
      );
      controls.pipe(writable);
    });

    // We're still showing a fallback.

    const errors = [];
    // Attempt to hydrate the content.
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error, errorInfo) {
        errors.push({error, errorInfo});
      },
    });
    Scheduler.unstable_flushAll();

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual('Loading root...');

    expect(loggedErrors).toEqual([]);

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
    expect(Scheduler).toFlushAndYield([]);
    expectErrors(
      errors,
      [
        [
          theError.message,
          expectedDigest,
          componentStack([
            'AsyncText',
            'h1',
            'Suspense',
            'div',
            'Suspense',
            'App',
          ]),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
      ],
    );

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>Hello</h1>
      </div>,
    );

    expect(loggedErrors).toEqual([theError]);
  });

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

  // @gate enableSuspenseAvoidThisFallbackFizz
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
  });

  // The selector implementation uses the lazy ref initialization pattern

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
  });

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
      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });

      // Because we failed to recover from the error, onRecoverableError
      // shouldn't be called.
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual('Oops!');

      expectErrors(errors, [], []);
    },
  );

  // Disabled because of a WWW late mutations regression.
  // We may want to re-enable this if we figure out why.

  // @gate FIXME
  it('does not recreate the fallback if server errors and hydration suspends', async () => {
    let isClient = false;

    function Child() {
      if (isClient) {
        readText('Yay!');
      } else {
        throw Error('Oops.');
      }
      Scheduler.unstable_yieldValue('Yay!');
      return 'Yay!';
    }

    const fallbackRef = React.createRef();
    function App() {
      return (
        <div>
          <Suspense fallback={<p ref={fallbackRef}>Loading...</p>}>
            <span>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
        onError(error) {
          Scheduler.unstable_yieldValue('[s!] ' + error.message);
        },
      });
      pipe(writable);
    });
    expect(Scheduler).toHaveYielded(['[s!] Oops.']);

    // The server could not complete this boundary, so we'll retry on the client.
    const serverFallback = container.getElementsByTagName('p')[0];
    expect(serverFallback.innerHTML).toBe('Loading...');

    // Hydrate the tree. This will suspend.
    isClient = true;
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue('[c!] ' + error.message);
      },
    });
    // This should not report any errors yet.
    expect(Scheduler).toFlushAndYield([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Loading...</p>
      </div>,
    );

    // Normally, hydrating after server error would force a clean client render.
    // However, it suspended so at best we'd only get the same fallback anyway.
    // We don't want to recreate the same fallback in the DOM again because
    // that's extra work and would restart animations etc. Check we don't do that.
    const clientFallback = container.getElementsByTagName('p')[0];
    expect(serverFallback).toBe(clientFallback);

    // When we're able to fully hydrate, we expect a clean client render.
    await act(async () => {
      resolveText('Yay!');
    });
    expect(Scheduler).toFlushAndYield([
      'Yay!',
      '[c!] The server could not finish this Suspense boundary, ' +
        'likely due to an error during server rendering. ' +
        'Switched to client rendering.',
    ]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Yay!</span>
      </div>,
    );
  });

  // Disabled because of a WWW late mutations regression.
  // We may want to re-enable this if we figure out why.

  // @gate FIXME
  it(
    'does not recreate the fallback if server errors and hydration suspends ' +
      'and root receives a transition',
    async () => {
      let isClient = false;

      function Child({color}) {
        if (isClient) {
          readText('Yay!');
        } else {
          throw Error('Oops.');
        }
        Scheduler.unstable_yieldValue('Yay! (' + color + ')');
        return 'Yay! (' + color + ')';
      }

      const fallbackRef = React.createRef();
      function App({color}) {
        return (
          <div>
            <Suspense fallback={<p ref={fallbackRef}>Loading...</p>}>
              <span>
                <Child color={color} />
              </span>
            </Suspense>
          </div>
        );
      }
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <App color="red" />,
          {
            onError(error) {
              Scheduler.unstable_yieldValue('[s!] ' + error.message);
            },
          },
        );
        pipe(writable);
      });
      expect(Scheduler).toHaveYielded(['[s!] Oops.']);

      // The server could not complete this boundary, so we'll retry on the client.
      const serverFallback = container.getElementsByTagName('p')[0];
      expect(serverFallback.innerHTML).toBe('Loading...');

      // Hydrate the tree. This will suspend.
      isClient = true;
      const root = ReactDOMClient.hydrateRoot(container, <App color="red" />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue('[c!] ' + error.message);
        },
      });
      // This should not report any errors yet.
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <p>Loading...</p>
        </div>,
      );

      // Normally, hydrating after server error would force a clean client render.
      // However, it suspended so at best we'd only get the same fallback anyway.
      // We don't want to recreate the same fallback in the DOM again because
      // that's extra work and would restart animations etc. Check we don't do that.
      const clientFallback = container.getElementsByTagName('p')[0];
      expect(serverFallback).toBe(clientFallback);

      // Transition updates shouldn't recreate the fallback either.
      React.startTransition(() => {
        root.render(<App color="blue" />);
      });
      Scheduler.unstable_flushAll();
      jest.runAllTimers();
      const clientFallback2 = container.getElementsByTagName('p')[0];
      expect(clientFallback2).toBe(serverFallback);

      // When we're able to fully hydrate, we expect a clean client render.
      await act(async () => {
        resolveText('Yay!');
      });
      expect(Scheduler).toFlushAndYield([
        'Yay! (red)',
        '[c!] The server could not finish this Suspense boundary, ' +
          'likely due to an error during server rendering. ' +
          'Switched to client rendering.',
        'Yay! (blue)',
      ]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <span>Yay! (blue)</span>
        </div>,
      );
    },
  );

  // Disabled because of a WWW late mutations regression.
  // We may want to re-enable this if we figure out why.

  // @gate FIXME
  it(
    'recreates the fallback if server errors and hydration suspends but ' +
      'client receives new props',
    async () => {
      let isClient = false;

      function Child() {
        const value = 'Yay!';
        if (isClient) {
          readText(value);
        } else {
          throw Error('Oops.');
        }
        Scheduler.unstable_yieldValue(value);
        return value;
      }

      const fallbackRef = React.createRef();
      function App({fallbackText}) {
        return (
          <div>
            <Suspense fallback={<p ref={fallbackRef}>{fallbackText}</p>}>
              <span>
                <Child />
              </span>
            </Suspense>
          </div>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <App fallbackText="Loading..." />,
          {
            onError(error) {
              Scheduler.unstable_yieldValue('[s!] ' + error.message);
            },
          },
        );
        pipe(writable);
      });
      expect(Scheduler).toHaveYielded(['[s!] Oops.']);

      const serverFallback = container.getElementsByTagName('p')[0];
      expect(serverFallback.innerHTML).toBe('Loading...');

      // Hydrate the tree. This will suspend.
      isClient = true;
      const root = ReactDOMClient.hydrateRoot(
        container,
        <App fallbackText="Loading..." />,
        {
          onRecoverableError(error) {
            Scheduler.unstable_yieldValue('[c!] ' + error.message);
          },
        },
      );
      // This should not report any errors yet.
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <p>Loading...</p>
        </div>,
      );

      // Normally, hydration after server error would force a clean client render.
      // However, that suspended so at best we'd only get a fallback anyway.
      // We don't want to replace a fallback with the same fallback because
      // that's extra work and would restart animations etc. Verify we don't do that.
      const clientFallback1 = container.getElementsByTagName('p')[0];
      expect(serverFallback).toBe(clientFallback1);

      // However, an update may have changed the fallback props. In that case we have to
      // actually force it to re-render on the client and throw away the server one.
      root.render(<App fallbackText="More loading..." />);
      Scheduler.unstable_flushAll();
      jest.runAllTimers();
      expect(Scheduler).toHaveYielded([
        '[c!] The server could not finish this Suspense boundary, ' +
          'likely due to an error during server rendering. ' +
          'Switched to client rendering.',
      ]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <p>More loading...</p>
        </div>,
      );
      // This should be a clean render without reusing DOM.
      const clientFallback2 = container.getElementsByTagName('p')[0];
      expect(clientFallback2).not.toBe(clientFallback1);

      // Verify we can still do a clean content render after.
      await act(async () => {
        resolveText('Yay!');
      });
      expect(Scheduler).toFlushAndYield(['Yay!']);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <span>Yay!</span>
        </div>,
      );
    },
  );

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

  // @gate enableServerContext
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

  it('Supports iterable', async () => {
    const Immutable = require('immutable');

    const mappedJSX = Immutable.fromJS([
      {name: 'a', value: 'a'},
      {name: 'b', value: 'b'},
    ]).map(item => <li key={item.get('value')}>{item.get('name')}</li>);

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <ul>{mappedJSX}</ul>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <ul>
        <li>a</li>
        <li>b</li>
      </ul>,
    );
  });

  it('Supports custom abort reasons with a string', async () => {
    function App() {
      return (
        <div>
          <p>
            <Suspense fallback={'p'}>
              <AsyncText text={'hello'} />
            </Suspense>
          </p>
          <span>
            <Suspense fallback={'span'}>
              <AsyncText text={'world'} />
            </Suspense>
          </span>
        </div>
      );
    }

    let abort;
    const loggedErrors = [];
    await act(async () => {
      const {
        pipe,
        abort: abortImpl,
      } = ReactDOMFizzServer.renderToPipeableStream(<App />, {
        onError(error) {
          // In this test we contrive erroring with strings so we push the error whereas in most
          // other tests we contrive erroring with Errors and push the message.
          loggedErrors.push(error);
          return 'a digest';
        },
      });
      abort = abortImpl;
      pipe(writable);
    });

    expect(loggedErrors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>p</p>
        <span>span</span>
      </div>,
    );

    await act(() => {
      abort('foobar');
    });

    expect(loggedErrors).toEqual(['foobar', 'foobar']);

    const errors = [];
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error, errorInfo) {
        errors.push({error, errorInfo});
      },
    });

    expect(Scheduler).toFlushAndYield([]);

    expectErrors(
      errors,
      [
        [
          'The server did not finish this Suspense boundary: foobar',
          'a digest',
          componentStack(['Suspense', 'p', 'div', 'App']),
        ],
        [
          'The server did not finish this Suspense boundary: foobar',
          'a digest',
          componentStack(['Suspense', 'span', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          'a digest',
        ],
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          'a digest',
        ],
      ],
    );
  });

  it('Supports custom abort reasons with an Error', async () => {
    function App() {
      return (
        <div>
          <p>
            <Suspense fallback={'p'}>
              <AsyncText text={'hello'} />
            </Suspense>
          </p>
          <span>
            <Suspense fallback={'span'}>
              <AsyncText text={'world'} />
            </Suspense>
          </span>
        </div>
      );
    }

    let abort;
    const loggedErrors = [];
    await act(async () => {
      const {
        pipe,
        abort: abortImpl,
      } = ReactDOMFizzServer.renderToPipeableStream(<App />, {
        onError(error) {
          loggedErrors.push(error.message);
          return 'a digest';
        },
      });
      abort = abortImpl;
      pipe(writable);
    });

    expect(loggedErrors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>p</p>
        <span>span</span>
      </div>,
    );

    await act(() => {
      abort(new Error('uh oh'));
    });

    expect(loggedErrors).toEqual(['uh oh', 'uh oh']);

    const errors = [];
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error, errorInfo) {
        errors.push({error, errorInfo});
      },
    });

    expect(Scheduler).toFlushAndYield([]);

    expectErrors(
      errors,
      [
        [
          'The server did not finish this Suspense boundary: uh oh',
          'a digest',
          componentStack(['Suspense', 'p', 'div', 'App']),
        ],
        [
          'The server did not finish this Suspense boundary: uh oh',
          'a digest',
          componentStack(['Suspense', 'span', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          'a digest',
        ],
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          'a digest',
        ],
      ],
    );
  });

  it('warns in dev if you access digest from errorInfo in onRecoverableError', async () => {
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <div>
          <Suspense fallback={'loading...'}>
            <AsyncText text={'hello'} />
          </Suspense>
        </div>,
        {
          onError(error) {
            return 'a digest';
          },
        },
      );
      rejectText('hello');
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(<div>loading...</div>);

    ReactDOMClient.hydrateRoot(
      container,
      <div>
        <Suspense fallback={'loading...'}>hello</Suspense>
      </div>,
      {
        onRecoverableError(error, errorInfo) {
          expect(() => {
            expect(error.digest).toBe('a digest');
            expect(errorInfo.digest).toBe('a digest');
          }).toErrorDev(
            'Warning: You are accessing "digest" from the errorInfo object passed to onRecoverableError.' +
              ' This property is deprecated and will be removed in a future version of React.' +
              ' To access the digest of an Error look for this property on the Error instance itself.',
            {withoutStack: true},
          );
        },
      },
    );
    expect(Scheduler).toFlushWithoutYielding();
  });

  describe('error escaping', () => {
    it('escapes error hash, message, and component stack values in directly flushed errors (html escaping)', async () => {
      window.__outlet = {};

      const dangerousErrorString =
        '"></template></div><script>window.__outlet.message="from error"</script><div><template data-foo="';

      function Erroring() {
        throw new Error(dangerousErrorString);
      }

      // We can't test newline in component stacks because the stack always takes just one line and we end up
      // dropping the first part including the \n character
      Erroring.displayName =
        'DangerousName' +
        dangerousErrorString.replace(
          'message="from error"',
          'stack="from_stack"',
        );

      function App() {
        return (
          <div>
            <Suspense fallback={<div>Loading...</div>}>
              <Erroring />
            </Suspense>
          </div>
        );
      }

      function onError(x) {
        return `dangerous hash ${x.message.replace(
          'message="from error"',
          'hash="from hash"',
        )}`;
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
          onError,
        });
        pipe(writable);
      });
      expect(window.__outlet).toEqual({});
    });

    it('escapes error hash, message, and component stack values in clientRenderInstruction (javascript escaping)', async () => {
      window.__outlet = {};

      const dangerousErrorString =
        '");window.__outlet.message="from error";</script><script>(() => {})("';

      let rejectComponent;
      const SuspensyErroring = React.lazy(() => {
        return new Promise((resolve, reject) => {
          rejectComponent = reject;
        });
      });

      // We can't test newline in component stacks because the stack always takes just one line and we end up
      // dropping the first part including the \n character
      SuspensyErroring.displayName =
        'DangerousName' +
        dangerousErrorString.replace(
          'message="from error"',
          'stack="from_stack"',
        );

      function App() {
        return (
          <div>
            <Suspense fallback={<div>Loading...</div>}>
              <SuspensyErroring />
            </Suspense>
          </div>
        );
      }

      function onError(x) {
        return `dangerous hash ${x.message.replace(
          'message="from error"',
          'hash="from hash"',
        )}`;
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
          onError,
        });
        pipe(writable);
      });

      await act(() => {
        rejectComponent(new Error(dangerousErrorString));
      });
      expect(window.__outlet).toEqual({});
    });

    it('escapes such that attributes cannot be masked', async () => {
      const dangerousErrorString = '" data-msg="bad message" data-foo="';
      const theError = new Error(dangerousErrorString);

      function Erroring({isClient}) {
        if (isClient) return 'Hello';
        throw theError;
      }

      function App({isClient}) {
        return (
          <div>
            <Suspense fallback={<div>Loading...</div>}>
              <Erroring isClient={isClient} />
            </Suspense>
          </div>
        );
      }

      const loggedErrors = [];
      function onError(x) {
        loggedErrors.push(x);
        return x.message.replace('bad message', 'bad hash');
      }
      const expectedDigest = onError(theError);
      loggedErrors.length = 0;

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
          onError,
        });
        pipe(writable);
      });

      expect(loggedErrors).toEqual([theError]);

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
        onRecoverableError(error, errorInfo) {
          errors.push({error, errorInfo});
        },
      });
      expect(Scheduler).toFlushAndYield([]);

      // If escaping were not done we would get a message that says "bad hash"
      expectErrors(
        errors,
        [
          [
            theError.message,
            expectedDigest,
            componentStack(['Erroring', 'Suspense', 'div', 'App']),
          ],
        ],
        [
          [
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
            expectedDigest,
          ],
        ],
      );
    });
  });

  it('accepts an integrity property for bootstrapScripts and bootstrapModules', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>hello world</div>
          </body>
        </html>,
        {
          bootstrapScripts: [
            'foo',
            {
              src: 'bar',
            },
            {
              src: 'baz',
              integrity: 'qux',
            },
          ],
          bootstrapModules: [
            'quux',
            {
              src: 'corge',
            },
            {
              src: 'grault',
              integrity: 'garply',
            },
          ],
        },
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
    expect(
      Array.from(document.getElementsByTagName('script')).map(n => n.outerHTML),
    ).toEqual([
      '<script src="foo" async=""></script>',
      '<script src="bar" async=""></script>',
      '<script src="baz" integrity="qux" async=""></script>',
      '<script type="module" src="quux" async=""></script>',
      '<script type="module" src="corge" async=""></script>',
      '<script type="module" src="grault" integrity="garply" async=""></script>',
    ]);
  });

  describe('bootstrapScriptContent escaping', () => {
    it('the "S" in "</?[Ss]cript" strings are replaced with unicode escaped lowercase s or S depending on case, preserving case sensitivity of nearby characters', async () => {
      window.__test_outlet = '';
      const stringWithScriptsInIt =
        'prescription pre<scription pre<Scription pre</scRipTion pre</ScripTion </script><script><!-- <script> -->';
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
          bootstrapScriptContent:
            'window.__test_outlet = "This should have been replaced";var x = "' +
            stringWithScriptsInIt +
            '";\nwindow.__test_outlet = x;',
        });
        pipe(writable);
      });
      expect(window.__test_outlet).toMatch(stringWithScriptsInIt);
    });

    it('does not escape \\u2028, or \\u2029 characters', async () => {
      // these characters are ignored in engines support https://github.com/tc39/proposal-json-superset
      // in this test with JSDOM the characters are silently dropped and thus don't need to be encoded.
      // if you send these characters to an older browser they could fail so it is a good idea to
      // sanitize JSON input of these characters
      window.__test_outlet = '';
      const el = document.createElement('p');
      el.textContent = '{"one":1,\u2028\u2029"two":2}';
      const stringWithLSAndPSCharacters = el.textContent;
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
          bootstrapScriptContent:
            'let x = ' +
            stringWithLSAndPSCharacters +
            '; window.__test_outlet = x;',
        });
        pipe(writable);
      });
      const outletString = JSON.stringify(window.__test_outlet);
      expect(outletString).toBe(
        stringWithLSAndPSCharacters.replace(/[\u2028\u2029]/g, ''),
      );
    });

    it('does not escape <, >, or & characters', async () => {
      // these characters valid javascript and may be necessary in scripts and won't be interpretted properly
      // escaped outside of a string context within javascript
      window.__test_outlet = null;
      // this boolean expression will be cast to a number due to the bitwise &. we will look for a truthy value (1) below
      const booleanLogicString = '1 < 2 & 3 > 1';
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
          bootstrapScriptContent:
            'let x = ' + booleanLogicString + '; window.__test_outlet = x;',
        });
        pipe(writable);
      });
      expect(window.__test_outlet).toBe(1);
    });
  });

  it('#24384: Suspending should halt hydration warnings and not emit any if hydration completes successfully after unsuspending', async () => {
    const makeApp = () => {
      let resolve, resolved;
      const promise = new Promise(r => {
        resolve = () => {
          resolved = true;
          return r();
        };
      });
      function ComponentThatSuspends() {
        if (!resolved) {
          throw promise;
        }
        return <p>A</p>;
      }

      const App = () => {
        return (
          <div>
            <Suspense fallback={<h1>Loading...</h1>}>
              <ComponentThatSuspends />
              <h2 name="hello">world</h2>
            </Suspense>
          </div>
        );
      };

      return [App, resolve];
    };

    const [ServerApp, serverResolve] = makeApp();
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<ServerApp />);
      pipe(writable);
    });
    await act(() => {
      serverResolve();
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="hello">world</h2>
      </div>,
    );

    const [ClientApp, clientResolve] = makeApp();
    ReactDOMClient.hydrateRoot(container, <ClientApp />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Logged recoverable error: ' + error.message,
        );
      },
    });
    Scheduler.unstable_flushAll();

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="hello">world</h2>
      </div>,
    );

    // Now that the boundary resolves to it's children the hydration completes and discovers that there is a mismatch requiring
    // client-side rendering.
    await clientResolve();
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="hello">world</h2>
      </div>,
    );
  });

  // @gate enableClientRenderFallbackOnTextMismatch
  it('#24384: Suspending should halt hydration warnings but still emit hydration warnings after unsuspending if mismatches are genuine', async () => {
    const makeApp = () => {
      let resolve, resolved;
      const promise = new Promise(r => {
        resolve = () => {
          resolved = true;
          return r();
        };
      });
      function ComponentThatSuspends() {
        if (!resolved) {
          throw promise;
        }
        return <p>A</p>;
      }

      const App = ({text}) => {
        return (
          <div>
            <Suspense fallback={<h1>Loading...</h1>}>
              <ComponentThatSuspends />
              <h2 name={text}>{text}</h2>
            </Suspense>
          </div>
        );
      };

      return [App, resolve];
    };

    const [ServerApp, serverResolve] = makeApp();
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <ServerApp text="initial" />,
      );
      pipe(writable);
    });
    await act(() => {
      serverResolve();
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="initial">initial</h2>
      </div>,
    );

    // The client app is rendered with an intentionally incorrect text. The still Suspended component causes
    // hydration to fail silently (allowing for cache warming but otherwise skipping this boundary) until it
    // resolves.
    const [ClientApp, clientResolve] = makeApp();
    ReactDOMClient.hydrateRoot(container, <ClientApp text="replaced" />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Logged recoverable error: ' + error.message,
        );
      },
    });
    Scheduler.unstable_flushAll();

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="initial">initial</h2>
      </div>,
    );

    // Now that the boundary resolves to it's children the hydration completes and discovers that there is a mismatch requiring
    // client-side rendering.
    await clientResolve();
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);
    }).toErrorDev(
      'Warning: Prop `name` did not match. Server: "initial" Client: "replaced"',
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="replaced">replaced</h2>
      </div>,
    );

    expect(Scheduler).toFlushAndYield([]);
  });

  // @gate enableClientRenderFallbackOnTextMismatch
  it('only warns once on hydration mismatch while within a suspense boundary', async () => {
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      mockError(...args.map(normalizeCodeLocInfo));
    };

    const App = ({text}) => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <h2>{text}</h2>
            <h2>{text}</h2>
            <h2>{text}</h2>
          </Suspense>
        </div>
      );
    };

    try {
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <App text="initial" />,
        );
        pipe(writable);
      });

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h2>initial</h2>
          <h2>initial</h2>
          <h2>initial</h2>
        </div>,
      );

      ReactDOMClient.hydrateRoot(container, <App text="replaced" />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(
            'Logged recoverable error: ' + error.message,
          );
        },
      });
      expect(Scheduler).toFlushAndYield([
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h2>replaced</h2>
          <h2>replaced</h2>
          <h2>replaced</h2>
        </div>,
      );

      expect(Scheduler).toFlushAndYield([]);
      if (__DEV__) {
        expect(mockError.mock.calls.length).toBe(1);
        expect(mockError.mock.calls[0]).toEqual([
          'Warning: Text content did not match. Server: "%s" Client: "%s"%s',
          'initial',
          'replaced',
          '\n' +
            '    in h2 (at **)\n' +
            '    in Suspense (at **)\n' +
            '    in div (at **)\n' +
            '    in App (at **)',
        ]);
      } else {
        expect(mockError.mock.calls.length).toBe(0);
      }
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('supresses hydration warnings when an error occurs within a Suspense boundary', async () => {
    let isClient = false;
    let shouldThrow = true;

    function ThrowUntilOnClient({children}) {
      if (isClient && shouldThrow) {
        throw new Error('uh oh');
      }
      return children;
    }

    function StopThrowingOnClient() {
      if (isClient) {
        shouldThrow = false;
      }
      return null;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ThrowUntilOnClient>
              <h1>one</h1>
            </ThrowUntilOnClient>
            <h2>two</h2>
            <h3>{isClient ? 'five' : 'three'}</h3>
            <StopThrowingOnClient />
          </Suspense>
        </div>
      );
    };

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>one</h1>
        <h2>two</h2>
        <h3>three</h3>
      </div>,
    );

    isClient = true;

    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Logged recoverable error: ' + error.message,
        );
      },
    });
    expect(Scheduler).toFlushAndYield([
      'Logged recoverable error: uh oh',
      'Logged recoverable error: Hydration failed because the initial UI does not match what was rendered on the server.',
      'Logged recoverable error: Hydration failed because the initial UI does not match what was rendered on the server.',
      'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>one</h1>
        <h2>two</h2>
        <h3>five</h3>
      </div>,
    );

    expect(Scheduler).toFlushAndYield([]);
  });

  // @gate __DEV__
  it('does not invokeGuardedCallback for errors after the first hydration error', async () => {
    // We can't use the toErrorDev helper here because this is async.
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      if (args.length > 1) {
        if (typeof args[1] === 'object') {
          mockError(args[0].split('\n')[0]);
          return;
        }
      }
      mockError(...args.map(normalizeCodeLocInfo));
    };
    let isClient = false;
    let shouldThrow = true;

    function ThrowUntilOnClient({children, message}) {
      if (isClient && shouldThrow) {
        Scheduler.unstable_yieldValue('throwing: ' + message);
        throw new Error(message);
      }
      return children;
    }

    function StopThrowingOnClient() {
      if (isClient) {
        shouldThrow = false;
      }
      return null;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ThrowUntilOnClient message="first error">
              <h1>one</h1>
            </ThrowUntilOnClient>
            <ThrowUntilOnClient message="second error">
              <h2>two</h2>
            </ThrowUntilOnClient>
            <ThrowUntilOnClient message="third error">
              <h3>three</h3>
            </ThrowUntilOnClient>
            <StopThrowingOnClient />
          </Suspense>
        </div>
      );
    };

    try {
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );

      isClient = true;

      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(
            'Logged recoverable error: ' + error.message,
          );
        },
      });
      expect(Scheduler).toFlushAndYield([
        'throwing: first error',
        // this repeated first error is the invokeGuardedCallback throw
        'throwing: first error',
        // these are actually thrown during render but no iGC repeat and no queueing as hydration errors
        'throwing: second error',
        'throwing: third error',
        // all hydration errors are still queued
        'Logged recoverable error: first error',
        'Logged recoverable error: second error',
        'Logged recoverable error: third error',
        // other recoverable errors are queued as hydration errors
        'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);
      // These Uncaught error calls are the error reported by the runtime (jsdom here, browser in actual use)
      // when invokeGuardedCallback is used to replay an error in dev using event dispatching in the document
      expect(mockError.mock.calls).toEqual([
        // we only get one because we suppress invokeGuardedCallback after the first one when hydrating in a
        // suspense boundary
        ['Error: Uncaught [Error: first error]'],
      ]);
      mockError.mockClear();

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );

      expect(Scheduler).toFlushAndYield([]);
      expect(mockError.mock.calls).toEqual([]);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('does not invokeGuardedCallback for errors after a preceding fiber suspends', async () => {
    // We can't use the toErrorDev helper here because this is async.
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      if (args.length > 1) {
        if (typeof args[1] === 'object') {
          mockError(args[0].split('\n')[0]);
          return;
        }
      }
      mockError(...args.map(normalizeCodeLocInfo));
    };
    let isClient = false;
    let shouldThrow = true;
    let promise = null;
    let unsuspend = null;
    let isResolved = false;

    function ComponentThatSuspendsOnClient() {
      if (isClient && !isResolved) {
        if (promise === null) {
          promise = new Promise(resolve => {
            unsuspend = () => {
              isResolved = true;
              resolve();
            };
          });
        }
        Scheduler.unstable_yieldValue('suspending');
        throw promise;
      }
      return null;
    }

    function ThrowUntilOnClient({children, message}) {
      if (isClient && shouldThrow) {
        Scheduler.unstable_yieldValue('throwing: ' + message);
        throw new Error(message);
      }
      return children;
    }

    function StopThrowingOnClient() {
      if (isClient) {
        shouldThrow = false;
      }
      return null;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ComponentThatSuspendsOnClient />
            <ThrowUntilOnClient message="first error">
              <h1>one</h1>
            </ThrowUntilOnClient>
            <ThrowUntilOnClient message="second error">
              <h2>two</h2>
            </ThrowUntilOnClient>
            <ThrowUntilOnClient message="third error">
              <h3>three</h3>
            </ThrowUntilOnClient>
            <StopThrowingOnClient />
          </Suspense>
        </div>
      );
    };

    try {
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );

      isClient = true;

      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(
            'Logged recoverable error: ' + error.message,
          );
        },
      });
      expect(Scheduler).toFlushAndYield([
        'suspending',
        'throwing: first error',
        // There is no repeated first error because we already suspended and no
        // invokeGuardedCallback is used if we are in dev
        // or in prod there is just never an invokeGuardedCallback
        'throwing: second error',
        'throwing: third error',
      ]);
      expect(mockError.mock.calls).toEqual([]);

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );
      await unsuspend();
      // Since our client components only throw on the very first render there are no
      // new throws in this pass
      expect(Scheduler).toFlushAndYield([]);

      expect(mockError.mock.calls).toEqual([]);
    } finally {
      console.error = originalConsoleError;
    }
  });

  // @gate __DEV__
  it('suspending after erroring will cause errors previously queued to be silenced until the boundary resolves', async () => {
    // We can't use the toErrorDev helper here because this is async.
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      if (args.length > 1) {
        if (typeof args[1] === 'object') {
          mockError(args[0].split('\n')[0]);
          return;
        }
      }
      mockError(...args.map(normalizeCodeLocInfo));
    };
    let isClient = false;
    let shouldThrow = true;
    let promise = null;
    let unsuspend = null;
    let isResolved = false;

    function ComponentThatSuspendsOnClient() {
      if (isClient && !isResolved) {
        if (promise === null) {
          promise = new Promise(resolve => {
            unsuspend = () => {
              isResolved = true;
              resolve();
            };
          });
        }
        Scheduler.unstable_yieldValue('suspending');
        throw promise;
      }
      return null;
    }

    function ThrowUntilOnClient({children, message}) {
      if (isClient && shouldThrow) {
        Scheduler.unstable_yieldValue('throwing: ' + message);
        throw new Error(message);
      }
      return children;
    }

    function StopThrowingOnClient() {
      if (isClient) {
        shouldThrow = false;
      }
      return null;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ThrowUntilOnClient message="first error">
              <h1>one</h1>
            </ThrowUntilOnClient>
            <ThrowUntilOnClient message="second error">
              <h2>two</h2>
            </ThrowUntilOnClient>
            <ComponentThatSuspendsOnClient />
            <ThrowUntilOnClient message="third error">
              <h3>three</h3>
            </ThrowUntilOnClient>
            <StopThrowingOnClient />
          </Suspense>
        </div>
      );
    };

    try {
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );

      isClient = true;

      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(
            'Logged recoverable error: ' + error.message,
          );
        },
      });
      expect(Scheduler).toFlushAndYield([
        'throwing: first error',
        // duplicate because first error is re-done in invokeGuardedCallback
        'throwing: first error',
        'throwing: second error',
        'suspending',
        'throwing: third error',
      ]);
      // These Uncaught error calls are the error reported by the runtime (jsdom here, browser in actual use)
      // when invokeGuardedCallback is used to replay an error in dev using event dispatching in the document
      expect(mockError.mock.calls).toEqual([
        // we only get one because we suppress invokeGuardedCallback after the first one when hydrating in a
        // suspense boundary
        ['Error: Uncaught [Error: first error]'],
      ]);
      mockError.mockClear();

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );
      await unsuspend();
      // Since our client components only throw on the very first render there are no
      // new throws in this pass
      expect(Scheduler).toFlushAndYield([]);
      expect(mockError.mock.calls).toEqual([]);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('#24578 Hydration errors caused by a suspending component should not become recoverable when nested in an ancestor Suspense that is showing primary content', async () => {
    // this test failed before because hydration errors on the inner boundary were upgraded to recoverable by
    // a codepath of the outer boundary
    function App({isClient}) {
      return (
        <Suspense fallback={'outer'}>
          <Suspense fallback={'inner'}>
            <div>
              {isClient ? <AsyncText text="A" /> : <Text text="A" />}
              <b>B</b>
            </div>
          </Suspense>
        </Suspense>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    const errors = [];
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        errors.push(error.message);
      },
    });

    expect(Scheduler).toFlushAndYield([]);
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        A<b>B</b>
      </div>,
    );

    resolveText('A');
    expect(Scheduler).toFlushAndYield([]);
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        A<b>B</b>
      </div>,
    );
  });

  it('hydration warnings for mismatched text with multiple text nodes caused by suspending should be suppressed', async () => {
    let resolve;
    const Lazy = React.lazy(() => {
      return new Promise(r => {
        resolve = r;
      });
    });

    function App({isClient}) {
      return (
        <div>
          {isClient ? <Lazy /> : <p>lazy</p>}
          <p>some {'text'}</p>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    const errors = [];
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        errors.push(error.message);
      },
    });

    expect(Scheduler).toFlushAndYield([]);
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>lazy</p>
        <p>some {'text'}</p>
      </div>,
    );

    resolve({default: () => <p>lazy</p>});
    expect(Scheduler).toFlushAndYield([]);
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>lazy</p>
        <p>some {'text'}</p>
      </div>,
    );
  });

  // @gate enableFloat
  it('emits html and head start tags (the preamble) before other content if rendered in the shell', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <>
          <title data-baz="baz">a title</title>
          <html data-foo="foo">
            <head data-bar="bar" />
            <body>a body</body>
          </html>
        </>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(document)).toEqual(
      <html data-foo="foo">
        <head data-bar="bar">
          <title data-baz="baz">a title</title>
        </head>
        <body>a body</body>
      </html>,
    );

    // Hydrate the same thing on the client. We expect this to still fail because <title> is not a Resource
    // and is unmatched on hydration
    const errors = [];
    ReactDOMClient.hydrateRoot(
      document,
      <>
        <title data-baz="baz">a title</title>
        <html data-foo="foo">
          <head data-bar="bar" />
          <body>a body</body>
        </html>
      </>,
      {
        onRecoverableError: (err, errInfo) => {
          errors.push(err.message);
        },
      },
    );
    expect(() => {
      try {
        expect(() => {
          expect(Scheduler).toFlushWithoutYielding();
        }).toThrow('Invalid insertion of HTML node in #document node.');
      } catch (e) {
        console.log('e', e);
      }
    }).toErrorDev(
      [
        'Warning: Expected server HTML to contain a matching <title> in <#document>.',
        'Warning: An error occurred during hydration. The server HTML was replaced with client content in <#document>.',
        'Warning: validateDOMNesting(...): <title> cannot appear as a child of <#document>',
      ],
      {withoutStack: 1},
    );
    expect(errors).toEqual([
      'Hydration failed because the initial UI does not match what was rendered on the server.',
      'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
    ]);
    expect(getVisibleChildren(document)).toEqual();
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow('The node to be removed is not a child of this node.');
  });

  // @gate enableFloat
  it('holds back body and html closing tags (the postamble) until all pending tasks are completed', async () => {
    const chunks = [];
    writable.on('data', chunk => {
      chunks.push(chunk);
    });

    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            first
            <Suspense>
              <AsyncText text="second" />
            </Suspense>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>{'first'}</body>
      </html>,
    );

    await act(() => {
      resolveText('second');
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          {'first'}
          {'second'}
        </body>
      </html>,
    );

    expect(chunks.pop()).toEqual('</body></html>');
  });

  // @gate enableFloat
  it('recognizes stylesheet links as attributes during hydration', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <>
          <link rel="stylesheet" href="foo" precedence="default" />
          <html>
            <head>
              <link rel="author" precedence="this is a nonsense prop" />
            </head>
            <body>a body</body>
          </html>
        </>,
      );
      pipe(writable);
    });
    // precedence for stylesheets is mapped to a valid data attribute that is recognized on the client
    // as opting this node into resource semantics. the use of precedence on the author link is just a
    // non standard attribute which React allows but is not given any special treatment.
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="default" />
          <link rel="author" precedence="this is a nonsense prop" />
        </head>
        <body>a body</body>
      </html>,
    );

    // It hydrates successfully
    const root = ReactDOMClient.hydrateRoot(
      document,
      <>
        <link rel="stylesheet" href="foo" precedence="default" />
        <html>
          <head>
            <link rel="author" precedence="this is a nonsense prop" />
          </head>
          <body>a body</body>
        </html>
      </>,
    );
    // We manually capture uncaught errors b/c Jest does not play well with errors thrown in
    // microtasks after the test completes even when it is expecting to fail (e.g. when the gate is false)
    // We need to flush the scheduler at the end even if there was an earlier throw otherwise this test will
    // fail even when failure is expected. This is primarily caused by invokeGuardedCallback replaying commit
    // phase errors which get rethrown in a microtask
    const uncaughtErrors = [];
    try {
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="default" />
            <link rel="author" precedence="this is a nonsense prop" />
          </head>
          <body>a body</body>
        </html>,
      );
    } catch (e) {
      uncaughtErrors.push(e);
    }
    try {
      expect(Scheduler).toFlushWithoutYielding();
    } catch (e) {
      uncaughtErrors.push(e);
    }

    root.render(
      <>
        <link rel="stylesheet" href="foo" precedence="default" data-bar="bar" />
        <html>
          <head />
          <body>a body</body>
        </html>
      </>,
    );
    try {
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="stylesheet"
              href="foo"
              data-rprec="default"
              data-bar="bar"
            />
          </head>
          <body>a body</body>
        </html>,
      );
    } catch (e) {
      uncaughtErrors.push(e);
    }
    try {
      expect(Scheduler).toFlushWithoutYielding();
    } catch (e) {
      uncaughtErrors.push(e);
    }

    if (uncaughtErrors.length > 0) {
      throw uncaughtErrors[0];
    }
  });

  // Temporarily this test is expected to fail everywhere. When we have resource hoisting
  // it should start to pass and we can adjust the gate accordingly
  // @gate false && enableFloat
  it('should insert missing resources during hydration', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <body>foo</body>
        </html>,
      );
      pipe(writable);
    });

    const uncaughtErrors = [];
    ReactDOMClient.hydrateRoot(
      document,
      <>
        <link rel="stylesheet" href="foo" precedence="foo" />
        <html>
          <head />
          <body>foo</body>
        </html>
      </>,
    );
    try {
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" precedence="foo" />
          </head>
          <body>foo</body>
        </html>,
      );
    } catch (e) {
      uncaughtErrors.push(e);
    }

    // need to flush again to get the invoke guarded callback error to throw in microtask
    try {
      expect(Scheduler).toFlushWithoutYielding();
    } catch (e) {
      uncaughtErrors.push(e);
    }

    if (uncaughtErrors.length) {
      throw uncaughtErrors[0];
    }
  });

  // @gate experimental && enableFloat
  it('fail hydration if a suitable resource cannot be found in the DOM for a given location (href)', async () => {
    gate(flags => {
      if (!(__EXPERIMENTAL__ && flags.enableFloat)) {
        throw new Error('bailing out of test');
      }
    });
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>a body</body>
        </html>,
      );
      pipe(writable);
    });

    const errors = [];
    ReactDOMClient.hydrateRoot(
      document,
      <html>
        <head>
          <link rel="stylesheet" href="foo" precedence="low" />
        </head>
        <body>a body</body>
      </html>,
      {
        onRecoverableError(err, errInfo) {
          errors.push(err.message);
        },
      },
    );
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toErrorDev(
      [
        'Warning: A matching Hydratable Resource was not found in the DOM for <link rel="stylesheet" href="foo">',
        'Warning: An error occurred during hydration. The server HTML was replaced with client content in <#document>.',
      ],
      {withoutStack: 1},
    );
    expect(errors).toEqual([
      'Hydration failed because the initial UI does not match what was rendered on the server.',
      'Hydration failed because the initial UI does not match what was rendered on the server.',
      'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
    ]);
  });

  // @gate experimental && enableFloat
  it('should error in dev when rendering more than one resource for a given location (href)', async () => {
    gate(flags => {
      if (!(__EXPERIMENTAL__ && flags.enableFloat)) {
        throw new Error('bailing out of test');
      }
    });
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <>
          <link rel="stylesheet" href="foo" precedence="low" />
          <link rel="stylesheet" href="foo" precedence="high" />
          <html>
            <head />
            <body>a body</body>
          </html>
        </>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="low" />
          <link rel="stylesheet" href="foo" data-rprec="high" />
        </head>
        <body>a body</body>
      </html>,
    );

    const errors = [];
    ReactDOMClient.hydrateRoot(
      document,
      <>
        <html>
          <head>
            <link rel="stylesheet" href="foo" precedence="low" />
            <link rel="stylesheet" href="foo" precedence="high" />
          </head>
          <body>a body</body>
        </html>
      </>,
      {
        onRecoverableError(err, errInfo) {
          errors.push(err.message);
        },
      },
    );
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toErrorDev([
      'Warning: Stylesheet resources need a unique representation in the DOM while hydrating and more than one matching DOM Node was found. To fix, ensure you are only rendering one stylesheet link with an href attribute of "foo"',
      'Warning: Stylesheet resources need a unique representation in the DOM while hydrating and more than one matching DOM Node was found. To fix, ensure you are only rendering one stylesheet link with an href attribute of "foo"',
    ]);
    expect(errors).toEqual([]);
  });

  describe('text separators', () => {
    // To force performWork to start before resolving AsyncText but before piping we need to wait until
    // after scheduleWork which currently uses setImmediate to delay performWork
    function afterImmediate() {
      return new Promise(resolve => {
        setImmediate(resolve);
      });
    }

    it('it only includes separators between adjacent text nodes', async () => {
      function App({name}) {
        return (
          <div>
            hello<b>world, {name}</b>!
          </div>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <App name="Foo" />,
        );
        pipe(writable);
      });

      expect(container.innerHTML).toEqual(
        '<div>hello<b>world, <!-- -->Foo</b>!</div>',
      );
      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App name="Foo" />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          hello<b>world, {'Foo'}</b>!
        </div>,
      );
    });

    it('it does not insert text separators even when adjacent text is in a delayed segment', async () => {
      function App({name}) {
        return (
          <Suspense fallback={'loading...'}>
            <div id="app-div">
              hello
              <b>
                world, <AsyncText text={name} />
              </b>
              !
            </div>
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <App name="Foo" />,
        );
        pipe(writable);
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">hello<b>world, <template id="P:1"></template></b>!</div>',
      );

      await act(() => resolveText('Foo'));

      expect(container.firstElementChild.outerHTML).toEqual(
        '<div id="app-div">hello<b>world, Foo</b>!</div>',
      );
      // there are extra script nodes at the end of container
      expect(container.childNodes.length).toBe(5);
      const div = container.childNodes[1];
      expect(div.childNodes.length).toBe(3);
      const b = div.childNodes[1];
      expect(b.childNodes.length).toBe(2);
      expect(b.childNodes[0]).toMatchInlineSnapshot('world, ');
      expect(b.childNodes[1]).toMatchInlineSnapshot('Foo');

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App name="Foo" />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div id="app-div">
          hello<b>world, {'Foo'}</b>!
        </div>,
      );
    });

    it('it works with multiple adjacent segments', async () => {
      function App() {
        return (
          <Suspense fallback={'loading...'}>
            <div id="app-div">
              h<AsyncText text={'ello'} />
              w<AsyncText text={'orld'} />
            </div>
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">h<template id="P:1"></template>w<template id="P:2"></template></div>',
      );

      await act(() => resolveText('orld'));

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">h<template id="P:1"></template>world</div>',
      );

      await act(() => resolveText('ello'));
      expect(container.firstElementChild.outerHTML).toEqual(
        '<div id="app-div">helloworld</div>',
      );

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App name="Foo" />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div id="app-div">{['h', 'ello', 'w', 'orld']}</div>,
      );
    });

    it('it works when some segments are flushed and others are patched', async () => {
      function App() {
        return (
          <Suspense fallback={'loading...'}>
            <div id="app-div">
              h<AsyncText text={'ello'} />
              w<AsyncText text={'orld'} />
            </div>
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        await afterImmediate();
        await act(() => resolveText('ello'));
        pipe(writable);
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">h<!-- -->ello<!-- -->w<template id="P:1"></template></div>',
      );

      await act(() => resolveText('orld'));

      expect(container.firstElementChild.outerHTML).toEqual(
        '<div id="app-div">h<!-- -->ello<!-- -->world</div>',
      );

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div id="app-div">{['h', 'ello', 'w', 'orld']}</div>,
      );
    });

    it('it does not prepend a text separators if the segment follows a non-Text Node', async () => {
      function App() {
        return (
          <Suspense fallback={'loading...'}>
            <div>
              hello
              <b>
                <AsyncText text={'world'} />
              </b>
            </div>
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        await afterImmediate();
        await act(() => resolveText('world'));
        pipe(writable);
      });

      expect(container.firstElementChild.outerHTML).toEqual(
        '<div>hello<b>world<!-- --></b></div>',
      );

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          hello<b>world</b>
        </div>,
      );
    });

    it('it does not prepend a text separators if the segments first emission is a non-Text Node', async () => {
      function App() {
        return (
          <Suspense fallback={'loading...'}>
            <div>
              hello
              <AsyncTextWrapped as={'b'} text={'world'} />
            </div>
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        await afterImmediate();
        await act(() => resolveText('world'));
        pipe(writable);
      });

      expect(container.firstElementChild.outerHTML).toEqual(
        '<div>hello<b>world</b></div>',
      );

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          hello<b>world</b>
        </div>,
      );
    });

    it('should not insert separators for text inside Suspense boundaries even if they would otherwise be considered text-embedded', async () => {
      function App() {
        return (
          <Suspense fallback={'loading...'}>
            <div id="app-div">
              start
              <Suspense fallback={'[loading first]'}>
                firststart
                <AsyncText text={'first suspended'} />
                firstend
              </Suspense>
              <Suspense fallback={'[loading second]'}>
                secondstart
                <b>
                  <AsyncText text={'second suspended'} />
                </b>
              </Suspense>
              end
            </div>
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        await afterImmediate();
        await act(() => resolveText('world'));
        pipe(writable);
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">start<!--$?--><template id="B:0"></template>[loading first]<!--/$--><!--$?--><template id="B:1"></template>[loading second]<!--/$-->end</div>',
      );

      await act(async () => {
        resolveText('first suspended');
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">start<!--$-->firststartfirst suspendedfirstend<!--/$--><!--$?--><template id="B:1"></template>[loading second]<!--/$-->end</div>',
      );

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div id="app-div">
          {'start'}
          {'firststart'}
          {'first suspended'}
          {'firstend'}
          {'[loading second]'}
          {'end'}
        </div>,
      );

      await act(async () => {
        resolveText('second suspended');
      });

      expect(container.firstElementChild.outerHTML).toEqual(
        '<div id="app-div">start<!--$-->firststartfirst suspendedfirstend<!--/$--><!--$-->secondstart<b>second suspended</b><!--/$-->end</div>',
      );

      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div id="app-div">
          {'start'}
          {'firststart'}
          {'first suspended'}
          {'firstend'}
          {'secondstart'}
          <b>second suspended</b>
          {'end'}
        </div>,
      );
    });

    it('(only) includes extraneous text separators in segments that complete before flushing, followed by nothing or a non-Text node', async () => {
      function App() {
        return (
          <div>
            <Suspense fallback={'text before, nothing after...'}>
              hello
              <AsyncText text="world" />
            </Suspense>
            <Suspense fallback={'nothing before or after...'}>
              <AsyncText text="world" />
            </Suspense>
            <Suspense fallback={'text before, element after...'}>
              hello
              <AsyncText text="world" />
              <br />
            </Suspense>
            <Suspense fallback={'nothing before, element after...'}>
              <AsyncText text="world" />
              <br />
            </Suspense>
          </div>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        await afterImmediate();
        await act(() => resolveText('world'));
        pipe(writable);
      });

      expect(container.innerHTML).toEqual(
        '<div><!--$-->hello<!-- -->world<!-- --><!--/$--><!--$-->world<!-- --><!--/$--><!--$-->hello<!-- -->world<!-- --><br><!--/$--><!--$-->world<!-- --><br><!--/$--></div>',
      );

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          {/* first boundary */}
          {'hello'}
          {'world'}
          {/* second boundary */}
          {'world'}
          {/* third boundary */}
          {'hello'}
          {'world'}
          <br />
          {/* fourth boundary */}
          {'world'}
          <br />
        </div>,
      );
    });
  });

  describe('title children', () => {
    function prepareJSDOMForTitle() {
      // Test Environment
      const jsdom = new JSDOM('<!DOCTYPE html><html><head>\u0000', {
        runScripts: 'dangerously',
      });
      window = jsdom.window;
      document = jsdom.window.document;
      container = document.getElementsByTagName('head')[0];
    }

    it('should accept a single string child', async () => {
      // a Single string child
      function App() {
        return <title>hello</title>;
      }

      prepareJSDOMForTitle();
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(container)).toEqual(<title>hello</title>);

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(<title>hello</title>);
    });

    it('should accept children array of length 1 containing a string', async () => {
      // a Single string child
      function App() {
        return <title>{['hello']}</title>;
      }

      prepareJSDOMForTitle();
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(container)).toEqual(<title>hello</title>);

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(container)).toEqual(<title>hello</title>);
    });

    it('should warn in dev when given an array of length 2 or more', async () => {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        if (args.length > 1) {
          if (typeof args[1] === 'object') {
            mockError(args[0].split('\n')[0]);
            return;
          }
        }
        mockError(...args.map(normalizeCodeLocInfo));
      };

      // a Single string child
      function App() {
        return <title>{['hello1', 'hello2']}</title>;
      }

      try {
        prepareJSDOMForTitle();

        await act(async () => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
          pipe(writable);
        });
        if (__DEV__) {
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A title element received an array with more than 1 element as children. ' +
              'In browsers title Elements can only have Text Nodes as children. If ' +
              'the children being rendered output more than a single text node in aggregate the browser ' +
              'will display markup and comments as text in the title and hydration will likely fail and ' +
              'fall back to client rendering%s',
            '\n' + '    in title (at **)\n' + '    in App (at **)',
          );
        } else {
          expect(mockError).not.toHaveBeenCalled();
        }

        expect(getVisibleChildren(container)).toEqual(
          <title>{'hello1<!-- -->hello2'}</title>,
        );

        const errors = [];
        ReactDOMClient.hydrateRoot(container, <App />, {
          onRecoverableError(error) {
            errors.push(error.message);
          },
        });
        expect(Scheduler).toFlushAndYield([]);
        expect(errors).toEqual(
          [
            gate(flags => flags.enableClientRenderFallbackOnTextMismatch)
              ? 'Text content does not match server-rendered HTML.'
              : null,
            'Hydration failed because the initial UI does not match what was rendered on the server.',
            'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
          ].filter(Boolean),
        );
        expect(getVisibleChildren(container)).toEqual(
          <title>{['hello1', 'hello2']}</title>,
        );
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('should warn in dev if you pass a React Component as a child to <title>', async () => {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        if (args.length > 1) {
          if (typeof args[1] === 'object') {
            mockError(args[0].split('\n')[0]);
            return;
          }
        }
        mockError(...args.map(normalizeCodeLocInfo));
      };

      function IndirectTitle() {
        return 'hello';
      }

      function App() {
        return (
          <title>
            <IndirectTitle />
          </title>
        );
      }

      try {
        prepareJSDOMForTitle();

        await act(async () => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
          pipe(writable);
        });
        if (__DEV__) {
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A title element received a React element for children. ' +
              'In the browser title Elements can only have Text Nodes as children. If ' +
              'the children being rendered output more than a single text node in aggregate the browser ' +
              'will display markup and comments as text in the title and hydration will likely fail and ' +
              'fall back to client rendering%s',
            '\n' + '    in title (at **)\n' + '    in App (at **)',
          );
        } else {
          expect(mockError).not.toHaveBeenCalled();
        }

        expect(getVisibleChildren(container)).toEqual(<title>hello</title>);

        const errors = [];
        ReactDOMClient.hydrateRoot(container, <App />, {
          onRecoverableError(error) {
            errors.push(error.message);
          },
        });
        expect(Scheduler).toFlushAndYield([]);
        expect(errors).toEqual([]);
        expect(getVisibleChildren(container)).toEqual(<title>hello</title>);
      } finally {
        console.error = originalConsoleError;
      }
    });

    // @gate enableUseHook
    it('basic use(promise)', async () => {
      const promiseA = Promise.resolve('A');
      const promiseB = Promise.resolve('B');
      const promiseC = Promise.resolve('C');

      function Async() {
        return use(promiseA) + use(promiseB) + use(promiseC);
      }

      function App() {
        return (
          <Suspense fallback="Loading...">
            <Async />
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });

      // TODO: The `act` implementation in this file doesn't unwrap microtasks
      // automatically. We can't use the same `act` we use for Fiber tests
      // because that relies on the mock Scheduler. Doesn't affect any public
      // API but we might want to fix this for our own internal tests.
      //
      // For now, wait for each promise in sequence.
      await act(async () => {
        await promiseA;
      });
      await act(async () => {
        await promiseB;
      });
      await act(async () => {
        await promiseC;
      });

      expect(getVisibleChildren(container)).toEqual('ABC');

      ReactDOMClient.hydrateRoot(container, <App />);
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual('ABC');
    });

    // @gate enableUseHook
    it('basic use(context)', async () => {
      const ContextA = React.createContext('default');
      const ContextB = React.createContext('B');
      const ServerContext = React.createServerContext(
        'ServerContext',
        'default',
      );
      function Client() {
        return use(ContextA) + use(ContextB);
      }
      function ServerComponent() {
        return use(ServerContext);
      }
      function Server() {
        return (
          <ServerContext.Provider value="C">
            <ServerComponent />
          </ServerContext.Provider>
        );
      }
      function App() {
        return (
          <>
            <ContextA.Provider value="A">
              <Client />
            </ContextA.Provider>
            <Server />
          </>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(container)).toEqual(['AB', 'C']);

      // Hydration uses a different renderer runtime (Fiber instead of Fizz).
      // We reset _currentRenderer here to not trigger a warning about multiple
      // renderers concurrently using these contexts
      ContextA._currentRenderer = null;
      ServerContext._currentRenderer = null;
      ReactDOMClient.hydrateRoot(container, <App />);
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual(['AB', 'C']);
    });

    // @gate enableUseHook
    it('use(promise) in multiple components', async () => {
      const promiseA = Promise.resolve('A');
      const promiseB = Promise.resolve('B');
      const promiseC = Promise.resolve('C');
      const promiseD = Promise.resolve('D');

      function Child({prefix}) {
        return prefix + use(promiseC) + use(promiseD);
      }

      function Parent() {
        return <Child prefix={use(promiseA) + use(promiseB)} />;
      }

      function App() {
        return (
          <Suspense fallback="Loading...">
            <Parent />
          </Suspense>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });

      // TODO: The `act` implementation in this file doesn't unwrap microtasks
      // automatically. We can't use the same `act` we use for Fiber tests
      // because that relies on the mock Scheduler. Doesn't affect any public
      // API but we might want to fix this for our own internal tests.
      //
      // For now, wait for each promise in sequence.
      await act(async () => {
        await promiseA;
      });
      await act(async () => {
        await promiseB;
      });
      await act(async () => {
        await promiseC;
      });
      await act(async () => {
        await promiseD;
      });

      expect(getVisibleChildren(container)).toEqual('ABCD');

      ReactDOMClient.hydrateRoot(container, <App />);
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual('ABCD');
    });

    // @gate enableUseHook
    it('using a rejected promise will throw', async () => {
      const promiseA = Promise.resolve('A');
      const promiseB = Promise.reject(new Error('Oops!'));
      const promiseC = Promise.resolve('C');

      // Jest/Node will raise an unhandled rejected error unless we await this. It
      // works fine in the browser, though.
      await expect(promiseB).rejects.toThrow('Oops!');

      function Async() {
        return use(promiseA) + use(promiseB) + use(promiseC);
      }

      class ErrorBoundary extends React.Component {
        state = {error: null};
        static getDerivedStateFromError(error) {
          return {error};
        }
        render() {
          if (this.state.error) {
            return this.state.error.message;
          }
          return this.props.children;
        }
      }

      function App() {
        return (
          <Suspense fallback="Loading...">
            <ErrorBoundary>
              <Async />
            </ErrorBoundary>
          </Suspense>
        );
      }

      const reportedServerErrors = [];
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
          onError(error) {
            reportedServerErrors.push(error);
          },
        });
        pipe(writable);
      });

      // TODO: The `act` implementation in this file doesn't unwrap microtasks
      // automatically. We can't use the same `act` we use for Fiber tests
      // because that relies on the mock Scheduler. Doesn't affect any public
      // API but we might want to fix this for our own internal tests.
      //
      // For now, wait for each promise in sequence.
      await act(async () => {
        await promiseA;
      });
      await act(async () => {
        await expect(promiseB).rejects.toThrow('Oops!');
      });
      await act(async () => {
        await promiseC;
      });

      expect(getVisibleChildren(container)).toEqual('Loading...');
      expect(reportedServerErrors.length).toBe(1);
      expect(reportedServerErrors[0].message).toBe('Oops!');

      const reportedClientErrors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          reportedClientErrors.push(error);
        },
      });
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual('Oops!');
      expect(reportedClientErrors.length).toBe(1);
      if (__DEV__) {
        expect(reportedClientErrors[0].message).toBe('Oops!');
      } else {
        expect(reportedClientErrors[0].message).toBe(
          'The server could not finish this Suspense boundary, likely due to ' +
            'an error during server rendering. Switched to client rendering.',
        );
      }
    });

    // @gate enableUseHook
    it("use a promise that's already been instrumented and resolved", async () => {
      const thenable = {
        status: 'fulfilled',
        value: 'Hi',
        then() {},
      };

      // This will never suspend because the thenable already resolved
      function App() {
        return use(thenable);
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(container)).toEqual('Hi');

      ReactDOMClient.hydrateRoot(container, <App />);
      expect(Scheduler).toFlushAndYield([]);
      expect(getVisibleChildren(container)).toEqual('Hi');
    });
  });
});
