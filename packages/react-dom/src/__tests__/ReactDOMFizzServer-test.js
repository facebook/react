/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment ./scripts/jest/ReactDOMServerIntegrationEnvironment
 */

'use strict';
import {
  insertNodesAndExecuteScripts,
  mergeOptions,
  stripExternalRuntimeInNodes,
  withLoadingReadyState,
  getVisibleChildren,
} from '../test-utils/FizzTestUtils';

let JSDOM;
let Stream;
let Scheduler;
let React;
let ReactDOM;
let ReactDOMClient;
let ReactDOMFizzServer;
let ReactDOMFizzStatic;
let Suspense;
let SuspenseList;
let useSyncExternalStore;
let useSyncExternalStoreWithSelector;
let use;
let useFormState;
let PropTypes;
let textCache;
let writable;
let CSPnonce = null;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;
let renderOptions;
let waitFor;
let waitForAll;
let assertLog;
let waitForPaint;
let clientAct;
let streamingContainer;

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;

    const jsdom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body><div id="container">',
      {
        runScripts: 'dangerously',
      },
    );
    // We mock matchMedia. for simplicity it only matches 'all' or '' and misses everything else
    Object.defineProperty(jsdom.window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === 'all' || query === '',
        media: query,
      })),
    });
    streamingContainer = null;
    global.window = jsdom.window;
    global.document = global.window.document;
    global.navigator = global.window.navigator;
    global.Node = global.window.Node;
    global.addEventListener = global.window.addEventListener;
    global.MutationObserver = global.window.MutationObserver;
    container = document.getElementById('container');

    Scheduler = require('scheduler');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMFizzServer = require('react-dom/server');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzStatic = require('react-dom/static');
    }
    Stream = require('stream');
    Suspense = React.Suspense;
    use = React.use;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.unstable_SuspenseList;
    }
    useFormState = ReactDOM.useFormState;

    PropTypes = require('prop-types');

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    waitFor = InternalTestUtils.waitFor;
    waitForPaint = InternalTestUtils.waitForPaint;
    assertLog = InternalTestUtils.assertLog;
    clientAct = InternalTestUtils.act;

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
    useSyncExternalStoreWithSelector =
      require('use-sync-external-store/with-selector').useSyncExternalStoreWithSelector;

    textCache = new Map();

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

    renderOptions = {};
    if (gate(flags => flags.enableFizzExternalRuntime)) {
      renderOptions.unstable_externalRuntimeSrc =
        'react-dom-bindings/src/server/ReactDOMServerExternalRuntime.js';
    }
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

  const bodyStartMatch = /<body(?:>| .*?>)/;
  const headStartMatch = /<head(?:>| .*?>)/;

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
    let bufferedContent = buffer;
    buffer = '';

    if (!bufferedContent) {
      return;
    }

    await withLoadingReadyState(async () => {
      const bodyMatch = bufferedContent.match(bodyStartMatch);
      const headMatch = bufferedContent.match(headStartMatch);

      if (streamingContainer === null) {
        // This is the first streamed content. We decide here where to insert it. If we get <html>, <head>, or <body>
        // we abandon the pre-built document and start from scratch. If we get anything else we assume it goes into the
        // container. This is not really production behavior because you can't correctly stream into a deep div effectively
        // but it's pragmatic for tests.

        if (
          bufferedContent.startsWith('<head>') ||
          bufferedContent.startsWith('<head ') ||
          bufferedContent.startsWith('<body>') ||
          bufferedContent.startsWith('<body ')
        ) {
          // wrap in doctype to normalize the parsing process
          bufferedContent = '<!DOCTYPE html><html>' + bufferedContent;
        } else if (
          bufferedContent.startsWith('<html>') ||
          bufferedContent.startsWith('<html ')
        ) {
          throw new Error(
            'Recieved <html> without a <!DOCTYPE html> which is almost certainly a bug in React',
          );
        }

        if (bufferedContent.startsWith('<!DOCTYPE html>')) {
          // we can just use the whole document
          const tempDom = new JSDOM(bufferedContent);

          // Wipe existing head and body content
          document.head.innerHTML = '';
          document.body.innerHTML = '';

          // Copy the <html> attributes over
          const tempHtmlNode = tempDom.window.document.documentElement;
          for (let i = 0; i < tempHtmlNode.attributes.length; i++) {
            const attr = tempHtmlNode.attributes[i];
            document.documentElement.setAttribute(attr.name, attr.value);
          }

          if (headMatch) {
            // We parsed a head open tag. we need to copy head attributes and insert future
            // content into <head>
            streamingContainer = document.head;
            const tempHeadNode = tempDom.window.document.head;
            for (let i = 0; i < tempHeadNode.attributes.length; i++) {
              const attr = tempHeadNode.attributes[i];
              document.head.setAttribute(attr.name, attr.value);
            }
            const source = document.createElement('head');
            source.innerHTML = tempHeadNode.innerHTML;
            await insertNodesAndExecuteScripts(source, document.head, CSPnonce);
          }

          if (bodyMatch) {
            // We parsed a body open tag. we need to copy head attributes and insert future
            // content into <body>
            streamingContainer = document.body;
            const tempBodyNode = tempDom.window.document.body;
            for (let i = 0; i < tempBodyNode.attributes.length; i++) {
              const attr = tempBodyNode.attributes[i];
              document.body.setAttribute(attr.name, attr.value);
            }
            const source = document.createElement('body');
            source.innerHTML = tempBodyNode.innerHTML;
            await insertNodesAndExecuteScripts(source, document.body, CSPnonce);
          }

          if (!headMatch && !bodyMatch) {
            throw new Error('expected <head> or <body> after <html>');
          }
        } else {
          // we assume we are streaming into the default container'
          streamingContainer = container;
          const div = document.createElement('div');
          div.innerHTML = bufferedContent;
          await insertNodesAndExecuteScripts(div, container, CSPnonce);
        }
      } else if (streamingContainer === document.head) {
        bufferedContent = '<!DOCTYPE html><html><head>' + bufferedContent;
        const tempDom = new JSDOM(bufferedContent);

        const tempHeadNode = tempDom.window.document.head;
        const source = document.createElement('head');
        source.innerHTML = tempHeadNode.innerHTML;
        await insertNodesAndExecuteScripts(source, document.head, CSPnonce);

        if (bodyMatch) {
          streamingContainer = document.body;

          const tempBodyNode = tempDom.window.document.body;
          for (let i = 0; i < tempBodyNode.attributes.length; i++) {
            const attr = tempBodyNode.attributes[i];
            document.body.setAttribute(attr.name, attr.value);
          }
          const bodySource = document.createElement('body');
          bodySource.innerHTML = tempBodyNode.innerHTML;
          await insertNodesAndExecuteScripts(
            bodySource,
            document.body,
            CSPnonce,
          );
        }
      } else {
        const div = document.createElement('div');
        div.innerHTML = bufferedContent;
        await insertNodesAndExecuteScripts(div, streamingContainer, CSPnonce);
      }
    }, document);
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
  function renderToPipeableStream(jsx, options) {
    // Merge options with renderOptions, which may contain featureFlag specific behavior
    return ReactDOMFizzServer.renderToPipeableStream(
      jsx,
      mergeOptions(options, renderOptions),
    );
  }

  it('should asynchronously load a lazy component', async () => {
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

    try {
      await act(() => {
        const {pipe} = renderToPipeableStream(
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
      await act(() => {
        resolveA({default: Text});
      });
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>Hello</div>
          <div>Loading...</div>
        </div>,
      );
      await act(() => {
        resolveB({default: TextWithPunctuation});
      });
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>Hello</div>
          <div>world!</div>
        </div>,
      );

      if (__DEV__) {
        expect(mockError).toHaveBeenCalledWith(
          'Warning: %s: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.%s',
          'TextWithPunctuation',
          '\n    in TextWithPunctuation (at **)\n' +
            '    in Lazy (at **)\n' +
            '    in Suspense (at **)\n' +
            '    in div (at **)\n' +
            '    in div (at **)',
        );
      } else {
        expect(mockError).not.toHaveBeenCalled();
      }
    } finally {
      console.error = originalConsoleError;
    }
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
    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading...</span>
      </div>,
    );
    await act(() => {
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
    await act(() => {
      ReactDOMClient.hydrateRoot(container, <HydrateApp />);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span id="async">async</span>
        <span id="after">after</span>
      </div>,
    );

    await act(() => {
      hydrateResolve();
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span id="async">async</span>
        <span id="after">after</span>
      </div>,
    );
  });

  it('should support nonce for bootstrap and runtime scripts', async () => {
    CSPnonce = 'R4nd0m';
    try {
      let resolve;
      const Lazy = React.lazy(() => {
        return new Promise(r => {
          resolve = r;
        });
      });

      await act(() => {
        const {pipe} = renderToPipeableStream(
          <div>
            <Suspense fallback={<Text text="Loading..." />}>
              <Lazy text="Hello" />
            </Suspense>
          </div>,
          {
            nonce: 'R4nd0m',
            bootstrapScriptContent: 'function noop(){}',
            bootstrapScripts: [
              'init.js',
              {src: 'init2.js', integrity: 'init2hash'},
            ],
            bootstrapModules: [
              'init.mjs',
              {src: 'init2.mjs', integrity: 'init2hash'},
            ],
          },
        );
        pipe(writable);
      });

      expect(getVisibleChildren(container)).toEqual([
        <link
          rel="preload"
          fetchpriority="low"
          href="init.js"
          as="script"
          nonce={CSPnonce}
        />,
        <link
          rel="preload"
          fetchpriority="low"
          href="init2.js"
          as="script"
          nonce={CSPnonce}
          integrity="init2hash"
        />,
        <link
          rel="modulepreload"
          fetchpriority="low"
          href="init.mjs"
          nonce={CSPnonce}
        />,
        <link
          rel="modulepreload"
          fetchpriority="low"
          href="init2.mjs"
          nonce={CSPnonce}
          integrity="init2hash"
        />,
        <div>Loading...</div>,
      ]);

      // check that there are 6 scripts with a matching nonce:
      // The runtime script, an inline bootstrap script, two bootstrap scripts and two bootstrap modules
      expect(
        Array.from(container.getElementsByTagName('script')).filter(
          node => node.getAttribute('nonce') === CSPnonce,
        ).length,
      ).toEqual(6);

      await act(() => {
        resolve({default: Text});
      });
      expect(getVisibleChildren(container)).toEqual([
        <link
          rel="preload"
          fetchpriority="low"
          href="init.js"
          as="script"
          nonce={CSPnonce}
        />,
        <link
          rel="preload"
          fetchpriority="low"
          href="init2.js"
          as="script"
          nonce={CSPnonce}
          integrity="init2hash"
        />,
        <link
          rel="modulepreload"
          fetchpriority="low"
          href="init.mjs"
          nonce={CSPnonce}
        />,
        <link
          rel="modulepreload"
          fetchpriority="low"
          href="init2.mjs"
          nonce={CSPnonce}
          integrity="init2hash"
        />,
        <div>Hello</div>,
      ]);
    } finally {
      CSPnonce = null;
    }
  });

  it('should not automatically add nonce to rendered scripts', async () => {
    CSPnonce = 'R4nd0m';
    try {
      await act(async () => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <script nonce={CSPnonce}>{'try { foo() } catch (e) {} ;'}</script>
              <script nonce={CSPnonce} src="foo" async={true} />
              <script src="bar" />
              <script src="baz" integrity="qux" async={true} />
              <script type="module" src="quux" async={true} />
              <script type="module" src="corge" async={true} />
              <script
                type="module"
                src="grault"
                integrity="garply"
                async={true}
              />
            </body>
          </html>,
          {
            nonce: CSPnonce,
          },
        );
        pipe(writable);
      });

      expect(
        stripExternalRuntimeInNodes(
          document.getElementsByTagName('script'),
          renderOptions.unstable_externalRuntimeSrc,
        ).map(n => n.outerHTML),
      ).toEqual([
        `<script nonce="${CSPnonce}" src="foo" async=""></script>`,
        `<script src="baz" integrity="qux" async=""></script>`,
        `<script type="module" src="quux" async=""></script>`,
        `<script type="module" src="corge" async=""></script>`,
        `<script type="module" src="grault" integrity="garply" async=""></script>`,
        `<script nonce="${CSPnonce}">try { foo() } catch (e) {} ;</script>`,
        `<script src="bar"></script>`,
      ]);
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
    window.__INIT__ = function () {
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
    function onError(x, errorInfo) {
      loggedErrors.push(x);
      return 'Hash of (' + x.message + ')';
    }
    const expectedDigest = onError(theError);
    loggedErrors.length = 0;

    await act(() => {
      const {pipe} = renderToPipeableStream(<App isClient={false} />, {
        bootstrapScriptContent: '__INIT__();',
        onError,
      });
      pipe(writable);
    });
    expect(loggedErrors).toEqual([]);
    expect(bootstrapped).toBe(true);

    await waitForAll([]);

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    expect(loggedErrors).toEqual([]);

    await act(() => {
      rejectComponent(theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We haven't ran the client hydration yet.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    await waitForAll([]);
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    expect(
      stripExternalRuntimeInNodes(
        container.childNodes,
        renderOptions.unstable_externalRuntimeSrc,
      ).length,
    ).toBe(1);
    await act(() => {
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
    function onError(x, errorInfo) {
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await waitForAll([]);

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    expect(loggedErrors).toEqual([]);

    await act(() => {
      rejectElement(theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We haven't ran the client hydration yet.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    await waitForAll([]);

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
            <Indirection level={2}>
              <Erroring isClient={isClient} />
            </Indirection>
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await waitForAll([]);

    expect(getVisibleChildren(container)).toEqual(<div>Hello World</div>);

    expectErrors(
      errors,
      [
        [
          theError.message,
          expectedDigest,
          componentStack([
            'Erroring',
            'Indirection',
            'Indirection',
            'Indirection',
            'Suspense',
            'div',
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await waitForAll([]);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await act(() => {
      rejectComponent(theError);
    });

    expect(loggedErrors).toEqual([theError]);
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Now we can client render it instead.
    await waitForAll([]);

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
    await act(() => {
      const {pipe} = renderToPipeableStream(
        <div>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="Hello World" />
          </Suspense>
        </div>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);
    await act(() => {
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
    window.__INIT__ = function () {
      bootstrapped = true;
      // Attempt to hydrate the content.
      ReactDOMClient.hydrateRoot(container, <App />);
    };

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />, {
        bootstrapScriptContent: '__INIT__();',
      });
      pipe(writable);
    });

    // We're still showing a fallback.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // We already bootstrapped.
    expect(bootstrapped).toBe(true);

    // Attempt to hydrate the content.
    await waitForAll([]);

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // The server now updates the content in place in the fallback.
    await act(() => {
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

    await waitForAll([]);

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
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await waitForAll([]);

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    const theError = new Error('Error Message');
    await act(() => {
      rejectText('This Errors', theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // The server errored, but we still haven't hydrated. We don't know if the
    // client will succeed yet, so we still show the loading state.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);
    expect(ref.current).toBe(null);

    // Flush the hydration.
    await waitForAll([]);

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
    await act(() => {
      const {pipe} = renderToPipeableStream(<App showMore={false} />);
      pipe(writable);
    });

    const root = ReactDOMClient.hydrateRoot(
      container,
      <App showMore={false} />,
    );
    await waitForAll([]);

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
    await waitForAll([]);

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

    await waitForAll([]);

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
          <main>
            <Suspense fallback="loading...">
              <AsyncText text="World" />
            </Suspense>
          </main>
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
    await act(() => {
      controls = renderToPipeableStream(<App />, {onError});
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
    await waitForAll([]);

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        Loading...<main>loading...</main>
      </div>,
    );

    // We abort the server response.
    await act(() => {
      controls.abort();
    });

    // We still can't render it on the client.
    await waitForAll([]);
    expectErrors(
      errors,
      [
        [
          'The server did not finish this Suspense boundary: The render was aborted by the server without a reason.',
          expectedDigest,
          // We get the stack of the task when it was aborted which is why we see `h1`
          componentStack(['h1', 'Suspense', 'div', 'App']),
        ],
        [
          'The server did not finish this Suspense boundary: The render was aborted by the server without a reason.',
          expectedDigest,
          componentStack(['Suspense', 'main', 'div', 'App']),
        ],
      ],
      [
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
        [
          'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          expectedDigest,
        ],
      ],
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        Loading...<main>loading...</main>
      </div>,
    );

    // We now resolve it on the client.
    await clientAct(() => {
      resolveText('Hello');
      resolveText('World');
    });
    assertLog([]);

    // The client rendered HTML is now in place.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>Hello</h1>
        <main>World</main>
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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

    await act(() => {
      resolveText('B');
    });

    expect(getVisibleChildren(container)).toEqual([
      <div id="container-A">Loading A...</div>,
      <div id="container-B">
        This will show B: <div>B</div>
      </div>,
    ]);

    await act(() => {
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

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <select>Loading...</select>Loading...
      </div>,
    );

    await act(() => {
      resolveText('Hello');
    });

    await act(() => {
      resolveText('World');
    });

    await act(() => {
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

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
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

    await act(() => {
      resolveText('A');
    });

    await act(() => {
      resolveText('B');
    });

    await act(() => {
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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

    await act(() => {
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
      String(str).replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
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
      await act(() => {
        const {pipe} = renderToPipeableStream(<A />);
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

      await act(() => {
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

  // @gate !disableLegacyContext
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await act(() => {
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

    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await act(() => {
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
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await act(() => {
      controls = renderToPipeableStream(
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
    await waitForAll([]);

    // We're still loading because we're waiting for the server to stream more content.
    expect(getVisibleChildren(container)).toEqual('Loading root...');

    expect(loggedErrors).toEqual([]);

    // Error the content, but we don't have a fallback yet.
    await act(() => {
      rejectText('Hello', theError);
    });

    expect(loggedErrors).toEqual([theError]);

    // We still can't render it on the client because we haven't unblocked the parent.
    await waitForAll([]);
    expect(getVisibleChildren(container)).toEqual('Loading root...');

    // Unblock the loading state
    await act(() => {
      resolveText('Loading...');
    });

    // Now we're able to show the inner boundary.
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // That will let us client render it instead.
    await waitForAll([]);
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
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await act(() => {
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

    await act(() => {
      const {pipe} = renderToPipeableStream(<App isClient={false} />);
      pipe(writable);
    });

    // Nothing is output since root has a suspense with avoidedThisFallback that hasn't resolved
    expect(getVisibleChildren(container)).toEqual(undefined);
    expect(container.innerHTML).not.toContain('Avoided Fallback');

    // resolve first suspense component with avoidThisFallback
    await act(() => {
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

    await act(() => {
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
      await waitForAll([]);
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
      await waitForAll([]);
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
      Scheduler.log(text);
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
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    assertLog(['server']);

    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.log('Log recoverable error: ' + error.message);
      },
    });

    await expect(async () => {
      // The first paint switches to client rendering due to mismatch
      await waitForPaint([
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
      Scheduler.log(text);
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
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    assertLog(['server']);

    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.log('Log recoverable error: ' + error.message);
      },
    });

    // The first paint uses the client due to mismatch forcing client render
    await expect(async () => {
      // The first paint switches to client rendering due to mismatch
      await waitForPaint([
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
        Scheduler.log(value);
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      assertLog(['Yay!']);

      const span = container.getElementsByTagName('span')[0];

      // Hydrate the tree. Child will throw during hydration, but not when it
      // falls back to client rendering.
      isClient = true;
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.log(error.message);
        },
      });

      // An error logged but instead of surfacing it to the UI, we switched
      // to client rendering.
      await expect(async () => {
        await waitForAll([
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

  it('can hydrate uSES in StrictMode with different client and server snapshot (sync)', async () => {
    function subscribe() {
      return () => {};
    }
    function getClientSnapshot() {
      return 'Yay!';
    }
    function getServerSnapshot() {
      return 'Nay!';
    }

    function App() {
      const value = useSyncExternalStore(
        subscribe,
        getClientSnapshot,
        getServerSnapshot,
      );
      Scheduler.log(value);

      return value;
    }

    const element = (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    await act(async () => {
      const {pipe} = renderToPipeableStream(element);
      pipe(writable);
    });

    assertLog(['Nay!']);
    expect(getVisibleChildren(container)).toEqual('Nay!');

    await clientAct(() => {
      ReactDOM.flushSync(() => {
        ReactDOMClient.hydrateRoot(container, element);
      });
    });

    expect(getVisibleChildren(container)).toEqual('Yay!');
    assertLog(['Nay!', 'Yay!']);
  });

  it('can hydrate uSES in StrictMode with different client and server snapshot (concurrent)', async () => {
    function subscribe() {
      return () => {};
    }
    function getClientSnapshot() {
      return 'Yay!';
    }
    function getServerSnapshot() {
      return 'Nay!';
    }

    function App() {
      const value = useSyncExternalStore(
        subscribe,
        getClientSnapshot,
        getServerSnapshot,
      );
      Scheduler.log(value);

      return value;
    }

    const element = (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    await act(async () => {
      const {pipe} = renderToPipeableStream(element);
      pipe(writable);
    });

    assertLog(['Nay!']);
    expect(getVisibleChildren(container)).toEqual('Nay!');

    await clientAct(() => {
      React.startTransition(() => {
        ReactDOMClient.hydrateRoot(container, element);
      });
    });

    expect(getVisibleChildren(container)).toEqual('Yay!');
    assertLog(['Nay!', 'Yay!']);
  });

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
        Scheduler.log(value);
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      assertLog(['Yay!']);

      const [span1, span2, span3] = container.getElementsByTagName('span');

      // Hydrate the tree. Child will throw during hydration, but not when it
      // falls back to client rendering.
      isClient = true;
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.log(error.message);
        },
      });

      // An error logged but instead of surfacing it to the UI, we switched
      // to client rendering.
      await waitForAll([
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
        Scheduler.log('Yay!');
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      assertLog(['Yay!']);

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
      await waitForAll([]);
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
      Scheduler.log('Yay!');
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
    await act(() => {
      const {pipe} = renderToPipeableStream(<App />, {
        onError(error) {
          Scheduler.log('[s!] ' + error.message);
        },
      });
      pipe(writable);
    });
    assertLog(['[s!] Oops.']);

    // The server could not complete this boundary, so we'll retry on the client.
    const serverFallback = container.getElementsByTagName('p')[0];
    expect(serverFallback.innerHTML).toBe('Loading...');

    // Hydrate the tree. This will suspend.
    isClient = true;
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.log('[c!] ' + error.message);
      },
    });
    // This should not report any errors yet.
    await waitForAll([]);
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
    await act(() => {
      resolveText('Yay!');
    });
    await waitForAll([
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
        Scheduler.log('Yay! (' + color + ')');
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
      await act(() => {
        const {pipe} = renderToPipeableStream(<App color="red" />, {
          onError(error) {
            Scheduler.log('[s!] ' + error.message);
          },
        });
        pipe(writable);
      });
      assertLog(['[s!] Oops.']);

      // The server could not complete this boundary, so we'll retry on the client.
      const serverFallback = container.getElementsByTagName('p')[0];
      expect(serverFallback.innerHTML).toBe('Loading...');

      // Hydrate the tree. This will suspend.
      isClient = true;
      const root = ReactDOMClient.hydrateRoot(container, <App color="red" />, {
        onRecoverableError(error) {
          Scheduler.log('[c!] ' + error.message);
        },
      });
      // This should not report any errors yet.
      await waitForAll([]);
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
      await waitForAll([]);
      jest.runAllTimers();
      const clientFallback2 = container.getElementsByTagName('p')[0];
      expect(clientFallback2).toBe(serverFallback);

      // When we're able to fully hydrate, we expect a clean client render.
      await act(() => {
        resolveText('Yay!');
      });
      await waitForAll([
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
        Scheduler.log(value);
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

      await act(() => {
        const {pipe} = renderToPipeableStream(
          <App fallbackText="Loading..." />,
          {
            onError(error) {
              Scheduler.log('[s!] ' + error.message);
            },
          },
        );
        pipe(writable);
      });
      assertLog(['[s!] Oops.']);

      const serverFallback = container.getElementsByTagName('p')[0];
      expect(serverFallback.innerHTML).toBe('Loading...');

      // Hydrate the tree. This will suspend.
      isClient = true;
      const root = ReactDOMClient.hydrateRoot(
        container,
        <App fallbackText="Loading..." />,
        {
          onRecoverableError(error) {
            Scheduler.log('[c!] ' + error.message);
          },
        },
      );
      // This should not report any errors yet.
      await waitForAll([]);
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
      await waitForAll([]);
      jest.runAllTimers();
      assertLog([
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
      await act(() => {
        resolveText('Yay!');
      });
      await waitForAll(['Yay!']);
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
        Scheduler.log(value);
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      assertLog(['Yay!']);

      const [span1, span2, span3] = container.getElementsByTagName('span');

      // Hydrate the tree. Child will throw during hydration, but not when it
      // falls back to client rendering.
      isClient = true;
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.log(error.message);
        },
      });

      // An error logged but instead of surfacing it to the UI, we switched
      // to client rendering.
      await waitForAll([
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

      await clientAct(() => {
        resolveText('Yay!');
      });
      assertLog(['Yay!']);
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
        Scheduler.log('Oops!');
        throw new Error('Oops!');
      }
      Scheduler.log('A');
      return 'A';
    }

    function B() {
      Scheduler.log('B');
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
        Scheduler.log('Logged a recoverable error: ' + error.message);
      },
    });
    React.startTransition(() => {
      root.render(<App />);
    });

    // Partially render A, but yield before the render has finished
    await waitFor(['Oops!', 'Oops!']);

    // React will try rendering again synchronously. During the retry, A will
    // not throw. This simulates a concurrent data race that is fixed by
    // blocking the main thread.
    shouldThrow = false;
    await waitForAll([
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
      Scheduler.log(label);
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

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    assertLog(['A', 'B']);

    // Hydrate the tree. Child will throw during hydration, but not when it
    // falls back to client rendering.
    isClient = true;
    ReactDOMClient.hydrateRoot(container, <App />, {
      onRecoverableError(error) {
        Scheduler.log('Logged recoverable error: ' + error.message);
      },
    });

    await waitForAll([
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

  it('Supports iterable', async () => {
    const Immutable = require('immutable');

    const mappedJSX = Immutable.fromJS([
      {name: 'a', value: 'a'},
      {name: 'b', value: 'b'},
    ]).map(item => <li key={item.get('value')}>{item.get('name')}</li>);

    await act(() => {
      const {pipe} = renderToPipeableStream(<ul>{mappedJSX}</ul>);
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
    await act(() => {
      const {pipe, abort: abortImpl} = renderToPipeableStream(<App />, {
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

    await waitForAll([]);

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
    await act(() => {
      const {pipe, abort: abortImpl} = renderToPipeableStream(<App />, {
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

    await waitForAll([]);

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
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
    await waitForAll([]);
  });

  it('takes an importMap option which emits an "importmap" script in the head', async () => {
    const importMap = {
      foo: './path/to/foo.js',
    };
    await act(() => {
      renderToPipeableStream(
        <html>
          <head>
            <script async={true} src="foo" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
        {
          importMap,
        },
      ).pipe(writable);
    });

    expect(document.head.innerHTML).toBe(
      '<script type="importmap">' +
        JSON.stringify(importMap) +
        '</script><script async="" src="foo"></script>',
    );
  });

  // bugfix: https://github.com/facebook/react/issues/27286 affecting enableCustomElementPropertySupport flag
  it('can render custom elements with children on ther server', async () => {
    await act(() => {
      renderToPipeableStream(
        <html>
          <body>
            <my-element>
              <div>foo</div>
            </my-element>
          </body>
        </html>,
      ).pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <my-element>
            <div>foo</div>
          </my-element>
        </body>
      </html>,
    );
  });

  // https://github.com/facebook/react/issues/27540
  // This test is not actually asserting much because there is possibly a bug in the closeing logic for the
  // Node implementation of Fizz. The close leads to an abort which sets the destination to null before the Float
  // method has an opportunity to schedule a write. We should fix this probably and once we do this test will start
  // to fail if the underyling issue of writing after stream completion isn't fixed
  it('does not try to write to the stream after it has been closed', async () => {
    async function preloadLate() {
      await 1;
      ReactDOM.preconnect('foo');
    }

    function Preload() {
      preloadLate();
      return null;
    }

    function App() {
      return (
        <html>
          <body>
            <main>hello</main>
            <Preload />
          </body>
        </html>
      );
    }
    await act(() => {
      renderToPipeableStream(<App />).pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <main>hello</main>
        </body>
      </html>,
    );
  });

  it('provides headers after initial work if onHeaders option used', async () => {
    let headers = null;
    function onHeaders(x) {
      headers = x;
    }

    function Preloads() {
      ReactDOM.preload('font2', {as: 'font'});
      ReactDOM.preload('imagepre2', {as: 'image', fetchPriority: 'high'});
      ReactDOM.preconnect('pre2', {crossOrigin: 'use-credentials'});
      ReactDOM.prefetchDNS('dns2');
    }

    function Blocked() {
      readText('blocked');
      return (
        <>
          <Preloads />
          <img src="image2" />
        </>
      );
    }

    function App() {
      ReactDOM.preload('font', {as: 'font'});
      ReactDOM.preload('imagepre', {as: 'image', fetchPriority: 'high'});
      ReactDOM.preconnect('pre', {crossOrigin: 'use-credentials'});
      ReactDOM.prefetchDNS('dns');
      return (
        <html>
          <body>
            <img src="image" />
            <Blocked />
          </body>
        </html>
      );
    }

    await act(() => {
      renderToPipeableStream(<App />, {onHeaders});
    });

    expect(headers).toEqual({
      Link: `
<pre>; rel=preconnect; crossorigin="use-credentials",
 <dns>; rel=dns-prefetch,
 <font>; rel=preload; as="font"; crossorigin="",
 <imagepre>; rel=preload; as="image"; fetchpriority="high",
 <image>; rel=preload; as="image"
`
        .replaceAll('\n', '')
        .trim(),
    });
  });

  it('encodes img srcset and sizes into preload header params', async () => {
    let headers = null;
    function onHeaders(x) {
      headers = x;
    }

    function App() {
      ReactDOM.preload('presrc', {
        as: 'image',
        fetchPriority: 'high',
        imageSrcSet: 'presrcset',
        imageSizes: 'presizes',
      });
      return (
        <html>
          <body>
            <img src="src" srcSet="srcset" sizes="sizes" />
          </body>
        </html>
      );
    }

    await act(() => {
      renderToPipeableStream(<App />, {onHeaders});
    });

    expect(headers).toEqual({
      Link: `
<presrc>; rel=preload; as="image"; fetchpriority="high"; imagesrcset="presrcset"; imagesizes="presizes",
 <src>; rel=preload; as="image"; imagesrcset="srcset"; imagesizes="sizes"
`
        .replaceAll('\n', '')
        .trim(),
    });
  });

  it('emits nothing for headers if you pipe before work begins', async () => {
    let headers = null;
    function onHeaders(x) {
      headers = x;
    }

    function App() {
      ReactDOM.preload('presrc', {
        as: 'image',
        fetchPriority: 'high',
        imageSrcSet: 'presrcset',
        imageSizes: 'presizes',
      });
      return (
        <html>
          <body>
            <img src="src" srcSet="srcset" sizes="sizes" />
          </body>
        </html>
      );
    }

    await act(() => {
      renderToPipeableStream(<App />, {onHeaders}).pipe(writable);
    });

    expect(headers).toEqual({});
  });

  it('stops accumulating new headers once the maxHeadersLength limit is satisifed', async () => {
    let headers = null;
    function onHeaders(x) {
      headers = x;
    }

    function App() {
      ReactDOM.preconnect('foo');
      ReactDOM.preconnect('bar');
      ReactDOM.preconnect('baz');
      return (
        <html>
          <body>hello</body>
        </html>
      );
    }

    await act(() => {
      renderToPipeableStream(<App />, {onHeaders, maxHeadersLength: 44});
    });

    expect(headers).toEqual({
      Link: `
<foo>; rel=preconnect,
 <bar>; rel=preconnect
`
        .replaceAll('\n', '')
        .trim(),
    });
  });

  it('logs an error if onHeaders throws but continues the render', async () => {
    const errors = [];
    function onError(error) {
      errors.push(error.message);
    }

    function onHeaders(x) {
      throw new Error('bad onHeaders');
    }

    let pipe;
    await act(() => {
      ({pipe} = renderToPipeableStream(<div>hello</div>, {onHeaders, onError}));
    });

    expect(errors).toEqual(['bad onHeaders']);

    await act(() => {
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>hello</div>);
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />, {
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />, {
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />, {
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
      await waitForAll([]);

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
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
        <head>
          <link rel="preload" fetchpriority="low" href="foo" as="script" />
          <link rel="preload" fetchpriority="low" href="bar" as="script" />
          <link
            rel="preload"
            fetchpriority="low"
            href="baz"
            as="script"
            integrity="qux"
          />
          <link rel="modulepreload" fetchpriority="low" href="quux" />
          <link rel="modulepreload" fetchpriority="low" href="corge" />
          <link
            rel="modulepreload"
            fetchpriority="low"
            href="grault"
            integrity="garply"
          />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
    expect(
      stripExternalRuntimeInNodes(
        document.getElementsByTagName('script'),
        renderOptions.unstable_externalRuntimeSrc,
      ).map(n => n.outerHTML),
    ).toEqual([
      '<script src="foo" async=""></script>',
      '<script src="bar" async=""></script>',
      '<script src="baz" integrity="qux" async=""></script>',
      '<script type="module" src="quux" async=""></script>',
      '<script type="module" src="corge" async=""></script>',
      '<script type="module" src="grault" integrity="garply" async=""></script>',
    ]);
  });

  it('accepts a crossOrigin property for bootstrapScripts and bootstrapModules', async () => {
    await act(() => {
      const {pipe} = renderToPipeableStream(
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
              crossOrigin: '',
            },
            {
              src: 'qux',
              crossOrigin: 'defaults-to-empty',
            },
          ],
          bootstrapModules: [
            'quux',
            {
              src: 'corge',
            },
            {
              src: 'grault',
              crossOrigin: 'use-credentials',
            },
          ],
        },
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="preload" fetchpriority="low" href="foo" as="script" />
          <link rel="preload" fetchpriority="low" href="bar" as="script" />
          <link
            rel="preload"
            fetchpriority="low"
            href="baz"
            as="script"
            crossorigin=""
          />
          <link
            rel="preload"
            fetchpriority="low"
            href="qux"
            as="script"
            crossorigin=""
          />
          <link rel="modulepreload" fetchpriority="low" href="quux" />
          <link rel="modulepreload" fetchpriority="low" href="corge" />
          <link
            rel="modulepreload"
            fetchpriority="low"
            href="grault"
            crossorigin="use-credentials"
          />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
    expect(
      stripExternalRuntimeInNodes(
        document.getElementsByTagName('script'),
        renderOptions.unstable_externalRuntimeSrc,
      ).map(n => n.outerHTML),
    ).toEqual([
      '<script src="foo" async=""></script>',
      '<script src="bar" async=""></script>',
      '<script src="baz" crossorigin="" async=""></script>',
      '<script src="qux" crossorigin="" async=""></script>',
      '<script type="module" src="quux" async=""></script>',
      '<script type="module" src="corge" async=""></script>',
      '<script type="module" src="grault" crossorigin="use-credentials" async=""></script>',
    ]);
  });

  describe('bootstrapScriptContent and importMap escaping', () => {
    it('the "S" in "</?[Ss]cript" strings are replaced with unicode escaped lowercase s or S depending on case, preserving case sensitivity of nearby characters', async () => {
      window.__test_outlet = '';
      const stringWithScriptsInIt =
        'prescription pre<scription pre<Scription pre</scRipTion pre</ScripTion </script><script><!-- <script> -->';
      await act(() => {
        const {pipe} = renderToPipeableStream(<div />, {
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
      await act(() => {
        const {pipe} = renderToPipeableStream(<div />, {
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
      await act(() => {
        const {pipe} = renderToPipeableStream(<div />, {
          bootstrapScriptContent:
            'let x = ' + booleanLogicString + '; window.__test_outlet = x;',
        });
        pipe(writable);
      });
      expect(window.__test_outlet).toBe(1);
    });

    it('escapes </[sS]cirpt> in importMaps', async () => {
      window.__test_outlet_key = '';
      window.__test_outlet_value = '';
      const jsonWithScriptsInIt = {
        "keypos</script><script>window.__test_outlet_key = 'pwned'</script><script>":
          'value',
        key: "valuepos</script><script>window.__test_outlet_value = 'pwned'</script><script>",
      };
      await act(() => {
        const {pipe} = renderToPipeableStream(<div />, {
          importMap: jsonWithScriptsInIt,
        });
        pipe(writable);
      });
      expect(window.__test_outlet_key).toBe('');
      expect(window.__test_outlet_value).toBe('');
    });
  });

  // @gate enableFizzExternalRuntime
  it('supports option to load runtime as an external script', async () => {
    await act(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head />
          <body>
            <Suspense fallback={'loading...'}>
              <AsyncText text="Hello" />
            </Suspense>
          </body>
        </html>,
        {
          unstable_externalRuntimeSrc: 'src-of-external-runtime',
        },
      );
      pipe(writable);
    });

    // We want the external runtime to be sent in <head> so the script can be
    // fetched and executed as early as possible. For SSR pages using Suspense,
    // this script execution would be render blocking.
    expect(
      Array.from(document.head.getElementsByTagName('script')).map(
        n => n.outerHTML,
      ),
    ).toEqual(['<script src="src-of-external-runtime" async=""></script>']);

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>loading...</body>
      </html>,
    );
  });

  // @gate enableFizzExternalRuntime
  it('does not send script tags for SSR instructions when using the external runtime', async () => {
    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <div>
              <AsyncText text="Hello" />
            </div>
          </Suspense>
        </div>
      );
    }
    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    await act(() => {
      resolveText('Hello');
    });

    // The only script elements sent should be from unstable_externalRuntimeSrc
    expect(document.getElementsByTagName('script').length).toEqual(1);
  });

  it('does not send the external runtime for static pages', async () => {
    await act(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head />
          <body>
            <p>hello world!</p>
          </body>
        </html>,
      );
      pipe(writable);
    });

    // no scripts should be sent
    expect(document.getElementsByTagName('script').length).toEqual(0);

    // the html should be as-is
    expect(document.documentElement.innerHTML).toEqual(
      '<head></head><body><p>hello world!</p></body>',
    );
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
    await act(() => {
      const {pipe} = renderToPipeableStream(<ServerApp />);
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
        Scheduler.log('Logged recoverable error: ' + error.message);
      },
    });
    await waitForAll([]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="hello">world</h2>
      </div>,
    );

    // Now that the boundary resolves to it's children the hydration completes and discovers that there is a mismatch requiring
    // client-side rendering.
    await clientResolve();
    await waitForAll([]);
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
    await act(() => {
      const {pipe} = renderToPipeableStream(<ServerApp text="initial" />);
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
        Scheduler.log('Logged recoverable error: ' + error.message);
      },
    });
    await waitForAll([]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="initial">initial</h2>
      </div>,
    );

    // Now that the boundary resolves to it's children the hydration completes and discovers that there is a mismatch requiring
    // client-side rendering.
    await clientResolve();
    await expect(async () => {
      await waitForAll([
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);
    }).toErrorDev(
      'Warning: Text content did not match. Server: "initial" Client: "replaced',
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="replaced">replaced</h2>
      </div>,
    );

    await waitForAll([]);
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
      await act(() => {
        const {pipe} = renderToPipeableStream(<App text="initial" />);
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
          Scheduler.log('Logged recoverable error: ' + error.message);
        },
      });
      await waitForAll([
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

      await waitForAll([]);
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

    function ThrowWhenHydrating({children}) {
      // This is a trick to only throw if we're hydrating, because
      // useSyncExternalStore calls getServerSnapshot instead of the regular
      // getSnapshot in that case.
      useSyncExternalStore(
        () => {},
        t => t,
        () => {
          if (isClient) {
            throw new Error('uh oh');
          }
        },
      );
      return children;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ThrowWhenHydrating>
              <h1>one</h1>
            </ThrowWhenHydrating>
            <h2>two</h2>
            <h3>{isClient ? 'five' : 'three'}</h3>
          </Suspense>
        </div>
      );
    };

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
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
        Scheduler.log('Logged recoverable error: ' + error.message);
      },
    });
    await waitForAll([
      'Logged recoverable error: uh oh',
      'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <h1>one</h1>
        <h2>two</h2>
        <h3>five</h3>
      </div>,
    );

    await waitForAll([]);
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

    function ThrowWhenHydrating({children, message}) {
      // This is a trick to only throw if we're hydrating, because
      // useSyncExternalStore calls getServerSnapshot instead of the regular
      // getSnapshot in that case.
      useSyncExternalStore(
        () => {},
        t => t,
        () => {
          if (isClient) {
            Scheduler.log('throwing: ' + message);
            throw new Error(message);
          }
        },
      );
      return children;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ThrowWhenHydrating message="first error">
              <h1>one</h1>
            </ThrowWhenHydrating>
            <ThrowWhenHydrating message="second error">
              <h2>two</h2>
            </ThrowWhenHydrating>
            <ThrowWhenHydrating message="third error">
              <h3>three</h3>
            </ThrowWhenHydrating>
          </Suspense>
        </div>
      );
    };

    try {
      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
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
          Scheduler.log('Logged recoverable error: ' + error.message);
        },
      });
      await waitForAll([
        'throwing: first error',
        // this repeated first error is the invokeGuardedCallback throw
        'throwing: first error',

        // onRecoverableError because the UI recovered without surfacing the
        // error to the user.
        'Logged recoverable error: first error',
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

      await waitForAll([]);
      expect(mockError.mock.calls).toEqual([]);
    } finally {
      console.error = originalConsoleError;
    }
  });

  // @gate __DEV__
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
        Scheduler.log('suspending');
        throw promise;
      }
      return null;
    }

    function ThrowWhenHydrating({children, message}) {
      // This is a trick to only throw if we're hydrating, because
      // useSyncExternalStore calls getServerSnapshot instead of the regular
      // getSnapshot in that case.
      useSyncExternalStore(
        () => {},
        t => t,
        () => {
          if (isClient) {
            Scheduler.log('throwing: ' + message);
            throw new Error(message);
          }
        },
      );
      return children;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ComponentThatSuspendsOnClient />
            <ThrowWhenHydrating message="first error">
              <h1>one</h1>
            </ThrowWhenHydrating>
            <ThrowWhenHydrating message="second error">
              <h2>two</h2>
            </ThrowWhenHydrating>
            <ThrowWhenHydrating message="third error">
              <h3>three</h3>
            </ThrowWhenHydrating>
          </Suspense>
        </div>
      );
    };

    try {
      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
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
          Scheduler.log('Logged recoverable error: ' + error.message);
        },
      });
      await waitForAll(['suspending']);
      expect(mockError.mock.calls).toEqual([]);

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );
      await unsuspend();
      await waitForAll([
        'throwing: first error',
        'throwing: first error',
        'Logged recoverable error: first error',
        'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );
    } finally {
      console.error = originalConsoleError;
    }
  });

  // @gate __DEV__
  it('(outdated behavior) suspending after erroring will cause errors previously queued to be silenced until the boundary resolves', async () => {
    // NOTE: This test was originally written to test a scenario that doesn't happen
    // anymore. If something errors during hydration, we immediately unwind the
    // stack and revert to client rendering. I've kept the test around just to
    // demonstrate what actually happens in this sequence of events.

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
        Scheduler.log('suspending');
        throw promise;
      }
      return null;
    }

    function ThrowWhenHydrating({children, message}) {
      // This is a trick to only throw if we're hydrating, because
      // useSyncExternalStore calls getServerSnapshot instead of the regular
      // getSnapshot in that case.
      useSyncExternalStore(
        () => {},
        t => t,
        () => {
          if (isClient) {
            Scheduler.log('throwing: ' + message);
            throw new Error(message);
          }
        },
      );
      return children;
    }

    const App = () => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <ThrowWhenHydrating message="first error">
              <h1>one</h1>
            </ThrowWhenHydrating>
            <ThrowWhenHydrating message="second error">
              <h2>two</h2>
            </ThrowWhenHydrating>
            <ComponentThatSuspendsOnClient />
            <ThrowWhenHydrating message="third error">
              <h3>three</h3>
            </ThrowWhenHydrating>
          </Suspense>
        </div>
      );
    };

    try {
      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
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
          Scheduler.log('Logged recoverable error: ' + error.message);
        },
      });
      await waitForAll([
        'throwing: first error',
        // duplicate because first error is re-done in invokeGuardedCallback
        'throwing: first error',
        'suspending',
        'Logged recoverable error: first error',
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
          <h1>Loading...</h1>
        </div>,
      );
      await clientAct(() => unsuspend());
      // Since our client components only throw on the very first render there are no
      // new throws in this pass
      assertLog([]);
      expect(mockError.mock.calls).toEqual([]);

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h1>one</h1>
          <h2>two</h2>
          <h3>three</h3>
        </div>,
      );
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
    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });

    const errors = [];
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        errors.push(error.message);
      },
    });

    await waitForAll([]);
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        A<b>B</b>
      </div>,
    );

    resolveText('A');
    await waitForAll([]);
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
    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });

    const errors = [];
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        errors.push(error.message);
      },
    });

    await waitForAll([]);
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>lazy</p>
        <p>some {'text'}</p>
      </div>,
    );

    resolve({default: () => <p>lazy</p>});
    await waitForAll([]);
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>lazy</p>
        <p>some {'text'}</p>
      </div>,
    );
  });

  // @gate enableFloat
  it('can emit the preamble even if the head renders asynchronously', async () => {
    function AsyncNoOutput() {
      readText('nooutput');
      return null;
    }
    function AsyncHead() {
      readText('head');
      return (
        <head data-foo="foo">
          <title>a title</title>
        </head>
      );
    }
    function AsyncBody() {
      readText('body');
      return (
        <body data-bar="bar">
          <link rel="preload" as="style" href="foo" />
          hello
        </body>
      );
    }
    await act(() => {
      const {pipe} = renderToPipeableStream(
        <html data-html="html">
          <AsyncNoOutput />
          <AsyncHead />
          <AsyncBody />
        </html>,
      );
      pipe(writable);
    });
    await act(() => {
      resolveText('body');
    });
    await act(() => {
      resolveText('nooutput');
    });
    await act(() => {
      resolveText('head');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html data-html="html">
        <head data-foo="foo">
          <link rel="preload" as="style" href="foo" />
          <title>a title</title>
        </head>
        <body data-bar="bar">hello</body>
      </html>,
    );
  });

  // @gate enableFloat
  it('holds back body and html closing tags (the postamble) until all pending tasks are completed', async () => {
    const chunks = [];
    writable.on('data', chunk => {
      chunks.push(chunk);
    });

    await act(() => {
      const {pipe} = renderToPipeableStream(
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App name="Foo" />);
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
      await waitForAll([]);
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App name="Foo" />);
        pipe(writable);
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">hello<b>world, <template id="P:1"></template></b>!</div>',
      );

      await act(() => resolveText('Foo'));

      const div = stripExternalRuntimeInNodes(
        container.children,
        renderOptions.unstable_externalRuntimeSrc,
      )[0];
      expect(div.outerHTML).toEqual(
        '<div id="app-div">hello<b>world, Foo</b>!</div>',
      );

      // there may be either:
      //  - an external runtime script and deleted nodes with data attributes
      //  - extra script nodes containing fizz instructions at the end of container
      expect(
        Array.from(container.childNodes).filter(e => e.tagName !== 'SCRIPT')
          .length,
      ).toBe(3);

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
      await waitForAll([]);
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

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
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
      expect(
        stripExternalRuntimeInNodes(
          container.children,
          renderOptions.unstable_externalRuntimeSrc,
        )[0].outerHTML,
      ).toEqual('<div id="app-div">helloworld</div>');

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App name="Foo" />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      await waitForAll([]);
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
        const {pipe} = renderToPipeableStream(<App />);
        await afterImmediate();
        await act(() => resolveText('ello'));
        pipe(writable);
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">h<!-- -->ello<!-- -->w<template id="P:1"></template></div>',
      );

      await act(() => resolveText('orld'));

      expect(
        stripExternalRuntimeInNodes(
          container.children,
          renderOptions.unstable_externalRuntimeSrc,
        )[0].outerHTML,
      ).toEqual('<div id="app-div">h<!-- -->ello<!-- -->world</div>');

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      await waitForAll([]);
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
        const {pipe} = renderToPipeableStream(<App />);
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
      await waitForAll([]);
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
        const {pipe} = renderToPipeableStream(<App />);
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
      await waitForAll([]);
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
        const {pipe} = renderToPipeableStream(<App />);
        await afterImmediate();
        await act(() => resolveText('world'));
        pipe(writable);
      });

      expect(document.getElementById('app-div').outerHTML).toEqual(
        '<div id="app-div">start<!--$?--><template id="B:0"></template>[loading first]<!--/$--><!--$?--><template id="B:1"></template>[loading second]<!--/$-->end</div>',
      );

      await act(() => {
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
      await waitForAll([]);
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

      await act(() => {
        resolveText('second suspended');
      });

      expect(
        stripExternalRuntimeInNodes(
          container.children,
          renderOptions.unstable_externalRuntimeSrc,
        )[0].outerHTML,
      ).toEqual(
        '<div id="app-div">start<!--$-->firststartfirst suspendedfirstend<!--/$--><!--$-->secondstart<b>second suspended</b><!--/$-->end</div>',
      );

      await waitForAll([]);
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
        const {pipe} = renderToPipeableStream(<App />);
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
      await waitForAll([]);
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
    it('should accept a single string child', async () => {
      // a Single string child
      function App() {
        return (
          <head>
            <title>hello</title>
          </head>
        );
      }

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(document.head)).toEqual(<title>hello</title>);

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      await waitForAll([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(document.head)).toEqual(<title>hello</title>);
    });

    it('should accept children array of length 1 containing a string', async () => {
      // a Single string child
      function App() {
        return (
          <head>
            <title>{['hello']}</title>
          </head>
        );
      }

      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(document.head)).toEqual(<title>hello</title>);

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      await waitForAll([]);
      expect(errors).toEqual([]);
      expect(getVisibleChildren(document.head)).toEqual(<title>hello</title>);
    });

    it('should warn in dev when given an array of length 2 or more', async () => {
      function App() {
        return (
          <head>
            <title>{['hello1', 'hello2']}</title>
          </head>
        );
      }

      await expect(async () => {
        await act(() => {
          const {pipe} = renderToPipeableStream(<App />);
          pipe(writable);
        });
      }).toErrorDev([
        'React expects the `children` prop of <title> tags to be a string, number, or object with a novel `toString` method but found an Array with length 2 instead. Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert `children` of <title> tags to a single string value which is why Arrays of length greater than 1 are not supported. When using JSX it can be commong to combine text nodes and value nodes. For example: <title>hello {nameOfUser}</title>. While not immediately apparent, `children` in this case is an Array with length 2. If your `children` prop is using this form try rewriting it using a template string: <title>{`hello ${nameOfUser}`}</title>.',
      ]);

      if (gate(flags => flags.enableFloat)) {
        expect(getVisibleChildren(document.head)).toEqual(<title />);
      } else {
        expect(getVisibleChildren(document.head)).toEqual(
          <title>{'hello1<!-- -->hello2'}</title>,
        );
      }

      const errors = [];
      ReactDOMClient.hydrateRoot(document.head, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      await waitForAll([]);
      if (gate(flags => flags.enableFloat)) {
        expect(errors).toEqual([]);
        // with float, the title doesn't render on the client or on the server
        expect(getVisibleChildren(document.head)).toEqual(<title />);
      } else {
        expect(errors).toEqual(
          [
            gate(flags => flags.enableClientRenderFallbackOnTextMismatch)
              ? 'Text content does not match server-rendered HTML.'
              : null,
            'Hydration failed because the initial UI does not match what was rendered on the server.',
            'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
          ].filter(Boolean),
        );
        expect(getVisibleChildren(document.head)).toEqual(
          <title>{['hello1', 'hello2']}</title>,
        );
      }
    });

    it('should warn in dev if you pass a React Component as a child to <title>', async () => {
      function IndirectTitle() {
        return 'hello';
      }

      function App() {
        return (
          <head>
            <title>
              <IndirectTitle />
            </title>
          </head>
        );
      }

      if (gate(flags => flags.enableFloat)) {
        await expect(async () => {
          await act(() => {
            const {pipe} = renderToPipeableStream(<App />);
            pipe(writable);
          });
        }).toErrorDev([
          'React expects the `children` prop of <title> tags to be a string, number, or object with a novel `toString` method but found an object that appears to be a React element which never implements a suitable `toString` method. Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert children of <title> tags to a single string value which is why rendering React elements is not supported. If the `children` of <title> is a React Component try moving the <title> tag into that component. If the `children` of <title> is some HTML markup change it to be Text only to be valid HTML.',
        ]);
      } else {
        await expect(async () => {
          await act(() => {
            const {pipe} = renderToPipeableStream(<App />);
            pipe(writable);
          });
        }).toErrorDev([
          'A title element received a React element for children. In the browser title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering',
        ]);
      }

      if (gate(flags => flags.enableFloat)) {
        // object titles are toStringed when float is on
        expect(getVisibleChildren(document.head)).toEqual(
          <title>{'[object Object]'}</title>,
        );
      } else {
        expect(getVisibleChildren(document.head)).toEqual(<title>hello</title>);
      }

      const errors = [];
      ReactDOMClient.hydrateRoot(document.head, <App />, {
        onRecoverableError(error) {
          errors.push(error.message);
        },
      });
      await waitForAll([]);
      expect(errors).toEqual([]);
      if (gate(flags => flags.enableFloat)) {
        // object titles are toStringed when float is on
        expect(getVisibleChildren(document.head)).toEqual(
          <title>{'[object Object]'}</title>,
        );
      } else {
        expect(getVisibleChildren(document.head)).toEqual(<title>hello</title>);
      }
    });
  });

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

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
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
    await waitForAll([]);
    expect(getVisibleChildren(container)).toEqual('ABC');
  });

  it('basic use(context)', async () => {
    const ContextA = React.createContext('default');
    const ContextB = React.createContext('B');
    function Client() {
      return use(ContextA) + use(ContextB);
    }
    function App() {
      return (
        <>
          <ContextA.Provider value="A">
            <Client />
          </ContextA.Provider>
        </>
      );
    }

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual('AB');

    // Hydration uses a different renderer runtime (Fiber instead of Fizz).
    // We reset _currentRenderer here to not trigger a warning about multiple
    // renderers concurrently using these contexts
    ContextA._currentRenderer = null;
    ReactDOMClient.hydrateRoot(container, <App />);
    await waitForAll([]);
    expect(getVisibleChildren(container)).toEqual('AB');
  });

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

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
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
    await waitForAll([]);
    expect(getVisibleChildren(container)).toEqual('ABCD');
  });

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
    await act(() => {
      const {pipe} = renderToPipeableStream(<App />, {
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
    await waitForAll([]);
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

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual('Hi');

    ReactDOMClient.hydrateRoot(container, <App />);
    await waitForAll([]);
    expect(getVisibleChildren(container)).toEqual('Hi');
  });

  it('unwraps thenable that fulfills synchronously without suspending', async () => {
    function App() {
      const thenable = {
        then(resolve) {
          // This thenable immediately resolves, synchronously, without waiting
          // a microtask.
          resolve('Hi');
        },
      };
      try {
        return <Text text={use(thenable)} />;
      } catch {
        throw new Error(
          '`use` should not suspend because the thenable resolved synchronously.',
        );
      }
    }
    // Because the thenable resolves synchronously, we should be able to finish
    // rendering synchronously, with no fallback.
    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual('Hi');
  });

  it('promise as node', async () => {
    const promise = Promise.resolve('Hi');
    await act(async () => {
      const {pipe} = renderToPipeableStream(promise);
      pipe(writable);
    });

    // TODO: The `act` implementation in this file doesn't unwrap microtasks
    // automatically. We can't use the same `act` we use for Fiber tests
    // because that relies on the mock Scheduler. Doesn't affect any public
    // API but we might want to fix this for our own internal tests.
    await act(async () => {
      await promise;
    });

    expect(getVisibleChildren(container)).toEqual('Hi');
  });

  it('context as node', async () => {
    const Context = React.createContext('Hi');
    await act(async () => {
      const {pipe} = renderToPipeableStream(Context);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual('Hi');
  });

  it('recursive Usable as node', async () => {
    const Context = React.createContext('Hi');
    const promiseForContext = Promise.resolve(Context);
    await act(async () => {
      const {pipe} = renderToPipeableStream(promiseForContext);
      pipe(writable);
    });

    // TODO: The `act` implementation in this file doesn't unwrap microtasks
    // automatically. We can't use the same `act` we use for Fiber tests
    // because that relies on the mock Scheduler. Doesn't affect any public
    // API but we might want to fix this for our own internal tests.
    await act(async () => {
      await promiseForContext;
    });

    expect(getVisibleChildren(container)).toEqual('Hi');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  it('useFormState hydrates without a mismatch', async () => {
    // This is testing an implementation detail: useFormState emits comment
    // nodes into the SSR stream, so this checks that they are handled correctly
    // during hydration.

    async function action(state) {
      return state;
    }

    const childRef = React.createRef(null);
    function Form() {
      const [state] = useFormState(action, 0);
      const text = `Child: ${state}`;
      return (
        <div id="child" ref={childRef}>
          {text}
        </div>
      );
    }

    function App() {
      return (
        <div>
          <div>
            <Form />
          </div>
          <span>Sibling</span>
        </div>
      );
    }

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>
          <div id="child">Child: 0</div>
        </div>
        <span>Sibling</span>
      </div>,
    );
    const child = document.getElementById('child');

    // Confirm that it hydrates correctly
    await clientAct(() => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(childRef.current).toBe(child);
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  it("useFormState hydrates without a mismatch if there's a render phase update", async () => {
    async function action(state) {
      return state;
    }

    const childRef = React.createRef(null);
    function Form() {
      const [localState, setLocalState] = React.useState(0);
      if (localState < 3) {
        setLocalState(localState + 1);
      }

      // Because of the render phase update above, this component is evaluated
      // multiple times (even during SSR), but it should only emit a single
      // marker per useFormState instance.
      const [formState] = useFormState(action, 0);
      const text = `${readText('Child')}:${formState}:${localState}`;
      return (
        <div id="child" ref={childRef}>
          {text}
        </div>
      );
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Form />
          </Suspense>
          <span>Sibling</span>
        </div>
      );
    }

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        Loading...<span>Sibling</span>
      </div>,
    );

    await act(() => resolveText('Child'));
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div id="child">Child:0:3</div>
        <span>Sibling</span>
      </div>,
    );
    const child = document.getElementById('child');

    // Confirm that it hydrates correctly
    await clientAct(() => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(childRef.current).toBe(child);
  });

  describe('useEffectEvent', () => {
    // @gate enableUseEffectEventHook
    it('can server render a component with useEffectEvent', async () => {
      const ref = React.createRef();
      function App() {
        const [count, setCount] = React.useState(0);
        const onClick = React.experimental_useEffectEvent(() => {
          setCount(c => c + 1);
        });
        return (
          <button ref={ref} onClick={() => onClick()}>
            {count}
          </button>
        );
      }
      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(container)).toEqual(<button>0</button>);

      ReactDOMClient.hydrateRoot(container, <App />);
      await waitForAll([]);
      expect(getVisibleChildren(container)).toEqual(<button>0</button>);

      ref.current.dispatchEvent(
        new window.MouseEvent('click', {bubbles: true}),
      );
      await jest.runAllTimers();
      expect(getVisibleChildren(container)).toEqual(<button>1</button>);
    });

    // @gate enableUseEffectEventHook
    it('throws if useEffectEvent is called during a server render', async () => {
      const logs = [];
      function App() {
        const onRender = React.experimental_useEffectEvent(() => {
          logs.push('rendered');
        });
        onRender();
        return <p>Hello</p>;
      }

      const reportedServerErrors = [];
      let caughtError;
      try {
        await act(() => {
          const {pipe} = renderToPipeableStream(<App />, {
            onError(e) {
              reportedServerErrors.push(e);
            },
          });
          pipe(writable);
        });
      } catch (err) {
        caughtError = err;
      }
      expect(logs).toEqual([]);
      expect(caughtError.message).toContain(
        "A function wrapped in useEffectEvent can't be called during rendering.",
      );
      expect(reportedServerErrors).toEqual([caughtError]);
    });

    // @gate enableUseEffectEventHook
    it('does not guarantee useEffectEvent return values during server rendering are distinct', async () => {
      function App() {
        const onClick1 = React.experimental_useEffectEvent(() => {});
        const onClick2 = React.experimental_useEffectEvent(() => {});
        if (onClick1 === onClick2) {
          return <div />;
        } else {
          return <span />;
        }
      }
      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(container)).toEqual(<div />);

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          errors.push(error);
        },
      });
      await expect(async () => {
        await waitForAll([]);
      }).toErrorDev(
        [
          'Expected server HTML to contain a matching <span> in <div>',
          'An error occurred during hydration',
        ],
        {withoutStack: 1},
      );
      expect(errors.length).toEqual(2);
      expect(getVisibleChildren(container)).toEqual(<span />);
    });
  });

  it('can render scripts with simple children', async () => {
    await act(async () => {
      const {pipe} = renderToPipeableStream(
        <html>
          <body>
            <script>{'try { foo() } catch (e) {} ;'}</script>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(document.documentElement.outerHTML).toEqual(
      '<html><head></head><body><script>try { foo() } catch (e) {} ;</script></body></html>',
    );
  });

  // @gate enableFloat
  it('warns if script has complex children', async () => {
    function MyScript() {
      return 'bar();';
    }
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      mockError(...args.map(normalizeCodeLocInfo));
    };

    try {
      await act(async () => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <script>{2}</script>
              <script>
                {[
                  'try { foo() } catch (e) {} ;',
                  'try { bar() } catch (e) {} ;',
                ]}
              </script>
              <script>
                <MyScript />
              </script>
            </body>
          </html>,
        );
        pipe(writable);
      });

      if (__DEV__) {
        expect(mockError.mock.calls.length).toBe(3);
        expect(mockError.mock.calls[0]).toEqual([
          'Warning: A script element was rendered with %s. If script element has children it must be a single string. Consider using dangerouslySetInnerHTML or passing a plain string as children.%s',
          'a number for children',
          componentStack(['script', 'body', 'html']),
        ]);
        expect(mockError.mock.calls[1]).toEqual([
          'Warning: A script element was rendered with %s. If script element has children it must be a single string. Consider using dangerouslySetInnerHTML or passing a plain string as children.%s',
          'an array for children',
          componentStack(['script', 'body', 'html']),
        ]);
        expect(mockError.mock.calls[2]).toEqual([
          'Warning: A script element was rendered with %s. If script element has children it must be a single string. Consider using dangerouslySetInnerHTML or passing a plain string as children.%s',
          'something unexpected for children',
          componentStack(['script', 'body', 'html']),
        ]);
      } else {
        expect(mockError.mock.calls.length).toBe(0);
      }
    } finally {
      console.error = originalConsoleError;
    }
  });

  // @gate enablePostpone
  it('client renders postponed boundaries without erroring', async () => {
    function Postponed({isClient}) {
      if (!isClient) {
        React.unstable_postpone('testing postpone');
      }
      return 'client only';
    }

    function App({isClient}) {
      return (
        <div>
          <Suspense fallback={'loading...'}>
            <Postponed isClient={isClient} />
          </Suspense>
        </div>
      );
    }

    const errors = [];

    await act(() => {
      const {pipe} = renderToPipeableStream(<App isClient={false} />, {
        onError(error) {
          errors.push(error.message);
        },
      });
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>loading...</div>);

    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        errors.push(error.message);
      },
    });
    await waitForAll([]);
    // Postponing should not be logged as a recoverable error since it's intentional.
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(<div>client only</div>);
  });

  // @gate enablePostpone
  it('errors if trying to postpone outside a Suspense boundary', async () => {
    function Postponed() {
      React.unstable_postpone('testing postpone');
      return 'client only';
    }

    function App() {
      return (
        <div>
          <Postponed />
        </div>
      );
    }

    const errors = [];
    const fatalErrors = [];
    const postponed = [];
    let written = false;

    const testWritable = new Stream.Writable();
    testWritable._write = (chunk, encoding, next) => {
      written = true;
    };

    await act(() => {
      const {pipe} = renderToPipeableStream(<App />, {
        onPostpone(reason) {
          postponed.push(reason);
        },
        onError(error) {
          errors.push(error.message);
        },
        onShellError(error) {
          fatalErrors.push(error.message);
        },
      });
      pipe(testWritable);
    });

    expect(written).toBe(false);
    // Postponing is not logged as an error but as a postponed reason.
    expect(errors).toEqual([]);
    expect(postponed).toEqual(['testing postpone']);
    // However, it does error the shell.
    expect(fatalErrors).toEqual(['testing postpone']);
  });

  // @gate enablePostpone
  it('can postpone in a fallback', async () => {
    function Postponed({isClient}) {
      if (!isClient) {
        React.unstable_postpone('testing postpone');
      }
      return 'loading...';
    }

    const lazyText = React.lazy(async () => {
      await 0; // causes the fallback to start work
      return {default: 'Hello'};
    });

    function App({isClient}) {
      return (
        <div>
          <Suspense fallback="Outer">
            <Suspense fallback={<Postponed isClient={isClient} />}>
              {lazyText}
            </Suspense>
          </Suspense>
        </div>
      );
    }

    const errors = [];

    await act(() => {
      const {pipe} = renderToPipeableStream(<App isClient={false} />, {
        onError(error) {
          errors.push(error.message);
        },
      });
      pipe(writable);
    });

    // TODO: This should actually be fully resolved because the value could eventually
    // resolve on the server even though the fallback couldn't so we should have been
    // able to render it.
    expect(getVisibleChildren(container)).toEqual(<div>Outer</div>);

    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        errors.push(error.message);
      },
    });
    await waitForAll([]);
    // Postponing should not be logged as a recoverable error since it's intentional.
    expect(errors).toEqual([]);
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  it(
    'a transition that flows into a dehydrated boundary should not suspend ' +
      'if the boundary is showing a fallback',
    async () => {
      let setSearch;
      function App() {
        const [search, _setSearch] = React.useState('initial query');
        setSearch = _setSearch;
        return (
          <div>
            <div>{search}</div>
            <div>
              <Suspense fallback="Loading...">
                <AsyncText text="Async" />
              </Suspense>
            </div>
          </div>
        );
      }

      // Render the initial HTML, which is showing a fallback.
      await act(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });

      // Start hydrating.
      await clientAct(() => {
        ReactDOMClient.hydrateRoot(container, <App />);
      });
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>initial query</div>
          <div>Loading...</div>
        </div>,
      );

      // Before the HTML has streamed in, update the query. The part outside
      // the fallback should be allowed to finish.
      await clientAct(() => {
        React.startTransition(() => setSearch('updated query'));
      });
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>updated query</div>
          <div>Loading...</div>
        </div>,
      );
    },
  );

  // @gate enablePostpone
  it('supports postponing in prerender and resuming later', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Postpone />
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await act(() => {
      resumed.pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  // @gate enablePostpone
  it('client renders a component if it errors during resuming', async () => {
    let prerendering = true;
    let ssr = true;
    function PostponeAndError() {
      if (prerendering) {
        React.unstable_postpone();
      }
      if (ssr) {
        throw new Error('server error');
      }
      return 'Hello';
    }

    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    const lazyPostponeAndError = React.lazy(async () => {
      return {default: <PostponeAndError />};
    });

    function ReplayError() {
      if (prerendering) {
        return <Postpone />;
      }
      if (ssr) {
        throw new Error('replay error');
      }
      return 'Hello';
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading1">
            <PostponeAndError />
          </Suspense>
          <Suspense fallback="Loading2">
            <Postpone />
            <Suspense fallback="Loading3">{lazyPostponeAndError}</Suspense>
          </Suspense>
          <Suspense fallback="Loading4">
            <ReplayError />
          </Suspense>
        </div>
      );
    }

    const prerenderErrors = [];
    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(
      <App />,
      {
        onError(x) {
          prerenderErrors.push(x.message);
        },
      },
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const ssrErrors = [];

    const resumed = ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        onError(x) {
          ssrErrors.push(x.message);
        },
      },
    );

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Loading1'}
        {'Loading2'}
        {'Loading4'}
      </div>,
    );

    await act(() => {
      resumed.pipe(writable);
    });

    expect(prerenderErrors).toEqual([]);

    expect(ssrErrors).toEqual(['server error', 'server error', 'replay error']);

    // Still loading...
    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Loading1'}
        {'Hello'}
        {'Loading3'}
        {'Loading4'}
      </div>,
    );

    const recoverableErrors = [];

    ssr = false;

    await clientAct(() => {
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(x) {
          recoverableErrors.push(x.message);
        },
      });
    });

    expect(recoverableErrors).toEqual(
      __DEV__
        ? ['server error', 'replay error', 'server error']
        : [
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          ],
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Hello'}
        {'Hello'}
        {'Hello'}
        {'Hello'}
      </div>,
    );
  });

  // @gate enablePostpone
  it('client renders a component if we abort before resuming', async () => {
    let prerendering = true;
    let ssr = true;
    const promise = new Promise(() => {});
    function PostponeAndSuspend() {
      if (prerendering) {
        React.unstable_postpone();
      }
      if (ssr) {
        React.use(promise);
      }
      return 'Hello';
    }

    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function DelayedBoundary() {
      if (!prerendering && ssr) {
        // We delay discovery of the boundary so we can abort before finding it.
        React.use(promise);
      }
      return (
        <Suspense fallback="Loading3">
          <Postpone />
        </Suspense>
      );
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading1">
            <PostponeAndSuspend />
          </Suspense>
          <Suspense fallback="Loading2">
            <Postpone />
          </Suspense>
          <Suspense fallback="Not used">
            <DelayedBoundary />
          </Suspense>
        </div>
      );
    }

    const prerenderErrors = [];
    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(
      <App />,
      {
        onError(x) {
          prerenderErrors.push(x.message);
        },
      },
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const ssrErrors = [];

    const resumed = ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        onError(x) {
          ssrErrors.push(x.message);
        },
      },
    );

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Loading1'}
        {'Loading2'}
        {'Loading3'}
      </div>,
    );

    await act(() => {
      resumed.pipe(writable);
    });

    const recoverableErrors = [];

    ssr = false;

    await clientAct(() => {
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(x) {
          recoverableErrors.push(x.message);
        },
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(prerenderErrors).toEqual([]);
    expect(ssrErrors).toEqual([]);

    // Still loading...
    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Loading1'}
        {'Hello'}
        {'Loading3'}
      </div>,
    );

    await clientAct(async () => {
      await act(() => {
        resumed.abort(new Error('aborted'));
      });
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Hello'}
        {'Hello'}
        {'Hello'}
      </div>,
    );

    expect(prerenderErrors).toEqual([]);
    expect(ssrErrors).toEqual(['aborted', 'aborted']);
    expect(recoverableErrors).toEqual(
      __DEV__
        ? [
            'The server did not finish this Suspense boundary: aborted',
            'The server did not finish this Suspense boundary: aborted',
          ]
        : [
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          ],
    );
  });

  // @gate enablePostpone
  it('client renders remaining boundaries below the error in shell', async () => {
    let prerendering = true;
    let ssr = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function ReplayError({children}) {
      if (!prerendering && ssr) {
        throw new Error('replay error');
      }
      return children;
    }

    function App() {
      return (
        <div>
          <div>
            <Suspense fallback="Loading1">
              <Postpone />
            </Suspense>
            <ReplayError>
              <Suspense fallback="Loading2">
                <Postpone />
              </Suspense>
            </ReplayError>
            <Suspense fallback="Loading3">
              <Postpone />
            </Suspense>
          </div>
          <Suspense fallback="Not used">
            <div>
              <Suspense fallback="Loading4">
                <Postpone />
              </Suspense>
            </div>
          </Suspense>
          <Suspense fallback="Loading5">
            <Postpone />
            <ReplayError>
              <Suspense fallback="Loading6">
                <Postpone />
              </Suspense>
            </ReplayError>
          </Suspense>
        </div>
      );
    }

    const prerenderErrors = [];
    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(
      <App />,
      {
        onError(x) {
          prerenderErrors.push(x.message);
        },
      },
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const ssrErrors = [];

    const resumed = ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        onError(x) {
          ssrErrors.push(x.message);
        },
      },
    );

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>
          {'Loading1'}
          {'Loading2'}
          {'Loading3'}
        </div>
        <div>{'Loading4'}</div>
        {'Loading5'}
      </div>,
    );

    await act(() => {
      resumed.pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>
          {'Hello' /* This was matched and completed before the error */}
          {
            'Loading2' /* This will be client rendered because its parent errored during replay */
          }
          {
            'Hello' /* This should be renderable since we matched which previous sibling errored */
          }
        </div>
        <div>
          {
            'Hello' /* This should be able to resume because it's in a different parent. */
          }
        </div>
        {'Hello'}
        {'Loading6' /* The parent could resolve even if the child didn't */}
      </div>,
    );

    const recoverableErrors = [];

    ssr = false;

    await clientAct(() => {
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(x) {
          recoverableErrors.push(x.message);
        },
      });
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>
          {'Hello'}
          {'Hello'}
          {'Hello'}
        </div>
        <div>{'Hello'}</div>
        {'Hello'}
        {'Hello'}
      </div>,
    );

    // We should've logged once for each boundary that this affected.
    expect(prerenderErrors).toEqual([]);
    expect(ssrErrors).toEqual([
      // This error triggered in two replay components.
      'replay error',
      'replay error',
    ]);
    expect(recoverableErrors).toEqual(
      // It surfaced in two different suspense boundaries.
      __DEV__
        ? [
            'The server did not finish this Suspense boundary: replay error',
            'The server did not finish this Suspense boundary: replay error',
          ]
        : [
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          ],
    );
  });

  // @gate enablePostpone
  it('can client render a boundary after having already postponed', async () => {
    let prerendering = true;
    let ssr = true;

    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function ServerError() {
      if (ssr) {
        throw new Error('server error');
      }
      return 'World';
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading1">
            <Postpone />
            <ServerError />
          </Suspense>
          <Suspense fallback="Loading2">
            <Postpone />
          </Suspense>
        </div>
      );
    }

    const prerenderErrors = [];
    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(
      <App />,
      {
        onError(x) {
          prerenderErrors.push(x.message);
        },
      },
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const ssrErrors = [];

    const resumed = ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        onError(x) {
          ssrErrors.push(x.message);
        },
      },
    );

    const windowErrors = [];
    function globalError(e) {
      windowErrors.push(e.message);
    }
    window.addEventListener('error', globalError);

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    expect(windowErrors).toEqual([]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Loading1'}
        {'Loading2'}
      </div>,
    );

    await act(() => {
      resumed.pipe(writable);
    });

    expect(prerenderErrors).toEqual(['server error']);

    // Since this errored, we shouldn't have to replay it.
    expect(ssrErrors).toEqual([]);

    expect(windowErrors).toEqual([]);

    // Still loading...
    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Loading1'}
        {'Hello'}
      </div>,
    );

    const recoverableErrors = [];

    ssr = false;

    await clientAct(() => {
      ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(x) {
          recoverableErrors.push(x.message);
        },
      });
    });

    expect(recoverableErrors).toEqual(
      __DEV__
        ? ['server error']
        : [
            'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
          ],
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Hello'}
        {'World'}
        {'Hello'}
      </div>,
    );

    expect(windowErrors).toEqual([]);

    window.removeEventListener('error', globalError);
  });

  // @gate enablePostpone
  it('can postpone in fallback', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    let resolve;
    const promise = new Promise(r => (resolve = r));

    function PostponeAndDelay() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return React.use(promise);
    }

    const Lazy = React.lazy(async () => {
      await 0;
      return {default: Postpone};
    });

    function App() {
      return (
        <div>
          <Suspense fallback="Outer">
            <Suspense fallback={<Postpone />}>
              <PostponeAndDelay /> World
            </Suspense>
            <Suspense fallback={<Postpone />}>
              <Lazy />
            </Suspense>
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    const resumed = await ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    expect(getVisibleChildren(container)).toEqual(<div>Outer</div>);

    // Read what we've completed so far
    await act(() => {
      resumed.pipe(writable);
    });

    // Should have now resolved the postponed loading state, but not the promise
    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Hello'}
        {'Hello'}
      </div>,
    );

    // Resolve the final promise
    await act(() => {
      resolve('Hi');
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Hi'}
        {' World'}
        {'Hello'}
      </div>,
    );
  });

  // @gate enablePostpone
  it('can discover new suspense boundaries in the resume', async () => {
    let prerendering = true;
    let resolveA;
    const promiseA = new Promise(r => (resolveA = r));
    let resolveB;
    const promiseB = new Promise(r => (resolveB = r));

    function WaitA() {
      return React.use(promiseA);
    }
    function WaitB() {
      return React.use(promiseB);
    }
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return (
        <span>
          <Suspense fallback="Loading again...">
            <WaitA />
          </Suspense>
          <WaitB />
        </span>
      );
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <p>
              <Postpone />
            </p>
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    const resumed = await ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Read what we've completed so far
    await act(() => {
      resumed.pipe(writable);
    });

    // Still blocked
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Resolve the first promise, this unblocks the inner boundary
    await act(() => {
      resolveA('Hello');
    });

    // Still blocked
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    // Resolve the second promise, this unblocks the outer boundary
    await act(() => {
      resolveB('World');
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>
          <span>
            {'Hello'}
            {'World'}
          </span>
        </p>
      </div>,
    );
  });

  // @gate enablePostpone
  it('does not call onError when you abort with a postpone instance during prerender', async () => {
    const promise = new Promise(r => {});

    function Wait() {
      return React.use(promise);
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <p>
              <span>
                <Suspense fallback="Loading again...">
                  <Wait />
                </Suspense>
              </span>
            </p>
            <p>
              <span>
                <Suspense fallback="Loading again too...">
                  <Wait />
                </Suspense>
              </span>
            </p>
          </Suspense>
        </div>
      );
    }

    let postponeInstance;
    try {
      React.unstable_postpone('manufactured');
    } catch (p) {
      postponeInstance = p;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const errors = [];
    function onError(error) {
      errors.push(error);
    }
    const postpones = [];
    function onPostpone(reason) {
      postpones.push(reason);
    }
    let pendingPrerender;
    await act(() => {
      pendingPrerender = ReactDOMFizzStatic.prerenderToNodeStream(<App />, {
        signal,
        onError,
        onPostpone,
      });
    });
    controller.abort(postponeInstance);

    const prerendered = await pendingPrerender;

    expect(prerendered.postponed).toBe(null);
    expect(errors).toEqual([]);
    expect(postpones).toEqual(['manufactured', 'manufactured']);

    await act(() => {
      prerendered.prelude.pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>
          <span>Loading again...</span>
        </p>
        <p>
          <span>Loading again too...</span>
        </p>
      </div>,
    );
  });

  // @gate enablePostpone
  it('does not call onError when you abort with a postpone instance during resume', async () => {
    let prerendering = true;
    const promise = new Promise(r => {});

    function Wait() {
      return React.use(promise);
    }
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return (
        <span>
          <Suspense fallback="Loading again...">
            <Wait />
          </Suspense>
        </span>
      );
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <p>
              <Postpone />
            </p>
            <p>
              <Postpone />
            </p>
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    let postponeInstance;
    try {
      React.unstable_postpone('manufactured');
    } catch (p) {
      postponeInstance = p;
    }

    const errors = [];
    function onError(error) {
      errors.push(error);
    }
    const postpones = [];
    function onPostpone(reason) {
      postpones.push(reason);
    }

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        onError,
        onPostpone,
      },
    );

    await act(() => {
      resumed.pipe(writable);
    });
    await act(() => {
      resumed.abort(postponeInstance);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>
          <span>Loading again...</span>
        </p>
        <p>
          <span>Loading again...</span>
        </p>
      </div>,
    );

    expect(errors).toEqual([]);
    expect(postpones).toEqual(['manufactured', 'manufactured']);
  });

  // @gate enablePostpone
  it('does not call onError when you abort with a postpone instance during a render', async () => {
    const promise = new Promise(r => {});

    function Wait() {
      return React.use(promise);
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <p>
              <span>
                <Suspense fallback="Loading again...">
                  <Wait />
                </Suspense>
              </span>
            </p>
            <p>
              <span>
                <Suspense fallback="Loading again...">
                  <Wait />
                </Suspense>
              </span>
            </p>
          </Suspense>
        </div>
      );
    }

    const errors = [];
    function onError(error) {
      errors.push(error);
    }
    const postpones = [];
    function onPostpone(reason) {
      postpones.push(reason);
    }
    const result = await renderToPipeableStream(<App />, {onError, onPostpone});
    await act(() => {
      result.pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>
          <span>Loading again...</span>
        </p>
        <p>
          <span>Loading again...</span>
        </p>
      </div>,
    );

    let postponeInstance;
    try {
      React.unstable_postpone('manufactured');
    } catch (p) {
      postponeInstance = p;
    }
    await act(() => {
      result.abort(postponeInstance);
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>
          <span>Loading again...</span>
        </p>
        <p>
          <span>Loading again...</span>
        </p>
      </div>,
    );

    expect(errors).toEqual([]);
    expect(postpones).toEqual(['manufactured', 'manufactured']);
  });

  // @gate enablePostpone
  it('fatally errors if you abort with a postpone in the shell during resume', async () => {
    let prerendering = true;
    const promise = new Promise(r => {});

    function Wait() {
      return React.use(promise);
    }
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return (
        <span>
          <Suspense fallback="Loading again...">
            <Wait />
          </Suspense>
        </span>
      );
    }

    function PostponeInShell() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return <span>in shell</span>;
    }

    function App() {
      return (
        <div>
          <PostponeInShell />
          <Suspense fallback="Loading...">
            <p>
              <Postpone />
            </p>
            <p>
              <Postpone />
            </p>
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerenderToNodeStream(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    // Create a separate stream so it doesn't close the writable. I.e. simple concat.
    const preludeWritable = new Stream.PassThrough();
    preludeWritable.setEncoding('utf8');
    preludeWritable.on('data', chunk => {
      writable.write(chunk);
    });

    await act(() => {
      prerendered.prelude.pipe(preludeWritable);
    });

    expect(getVisibleChildren(container)).toEqual(undefined);

    let postponeInstance;
    try {
      React.unstable_postpone('manufactured');
    } catch (p) {
      postponeInstance = p;
    }

    const errors = [];
    function onError(error) {
      errors.push(error);
    }
    const shellErrors = [];
    function onShellError(error) {
      shellErrors.push(error);
    }
    const postpones = [];
    function onPostpone(reason) {
      postpones.push(reason);
    }

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resumeToPipeableStream(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        onError,
        onShellError,
        onPostpone,
      },
    );
    await act(() => {
      resumed.abort(postponeInstance);
    });
    expect(errors).toEqual([
      new Error(
        'The render was aborted with postpone when the shell is incomplete. Reason: manufactured',
      ),
    ]);
    expect(shellErrors).toEqual([
      new Error(
        'The render was aborted with postpone when the shell is incomplete. Reason: manufactured',
      ),
    ]);
    expect(postpones).toEqual([]);
  });

  // @gate enablePostpone
  it('fatally errors if you abort with a postpone in the shell during render', async () => {
    const promise = new Promise(r => {});

    function Wait() {
      return React.use(promise);
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <p>
              <span>
                <Suspense fallback="Loading again...">
                  <Wait />
                </Suspense>
              </span>
            </p>
            <p>
              <span>
                <Suspense fallback="Loading again...">
                  <Wait />
                </Suspense>
              </span>
            </p>
          </Suspense>
        </div>
      );
    }

    const errors = [];
    function onError(error) {
      errors.push(error);
    }
    const shellErrors = [];
    function onShellError(error) {
      shellErrors.push(error);
    }
    const postpones = [];
    function onPostpone(reason) {
      postpones.push(reason);
    }
    const result = await renderToPipeableStream(<App />, {
      onError,
      onShellError,
      onPostpone,
    });

    let postponeInstance;
    try {
      React.unstable_postpone('manufactured');
    } catch (p) {
      postponeInstance = p;
    }
    await act(() => {
      result.abort(postponeInstance);
    });

    expect(getVisibleChildren(container)).toEqual(undefined);

    expect(errors).toEqual([
      new Error(
        'The render was aborted with postpone when the shell is incomplete. Reason: manufactured',
      ),
    ]);
    expect(shellErrors).toEqual([
      new Error(
        'The render was aborted with postpone when the shell is incomplete. Reason: manufactured',
      ),
    ]);
    expect(postpones).toEqual([]);
  });
});
