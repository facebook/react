/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {
  getVisibleChildren,
  insertNodesAndExecuteScripts,
  withLoadingReadyState,
} from '../test-utils/FizzTestUtils';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

let JSDOM;
let Scheduler;
let React;
let ReactDOM;
let ReactDOMFizzServer;
let ReactDOMFizzStatic;
let Suspense;
let container;
let textCache;
let assertLog;

let hasErrored;
let fatalError;
let buffer;
let streamingContainer;
let CSPnonce;
let waitForMicrotasks;

describe('ReactDOMFizzStaticBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    Scheduler = require('scheduler');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFizzServer = require('react-dom/server.browser');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzStatic = require('react-dom/static.browser');
    }
    Suspense = React.Suspense;
    assertLog = require('internal-test-utils').assertLog;
    waitForMicrotasks = require('internal-test-utils').waitForMicrotasks;
    container = document.createElement('div');
    document.body.appendChild(container);
    textCache = new Map();

    hasErrored = false;
    buffer = '';
    streamingContainer = null;
    CSPnonce = null;
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const bodyStartMatch = /<body(?:>| .*?>)/;
  const headStartMatch = /<head(?:>| .*?>)/;

  // TODO: Move to FizzTestUtils?
  async function act(callback) {
    await callback();
    // Await one turn around the event loop.
    // This assumes that we'll flush everything we have so far.
    await waitForMicrotasks();

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

  const theError = new Error('This is an error');
  function Throw() {
    throw theError;
  }
  const theInfinitePromise = new Promise(() => {});
  function InfiniteSuspend() {
    throw theInfinitePromise;
  }

  function concat(streamA, streamB) {
    const readerA = streamA.getReader();
    const readerB = streamB.getReader();
    return new ReadableStream({
      start(controller) {
        function readA() {
          readerA.read().then(({done, value}) => {
            if (done) {
              readB();
              return;
            }
            controller.enqueue(value);
            readA();
          });
        }
        function readB() {
          readerB.read().then(({done, value}) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            readB();
          });
        }
        readA();
      },
    });
  }

  async function readContent(stream) {
    const reader = stream.getReader();
    let content = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return content;
      }
      content += Buffer.from(value).toString('utf8');
    }
  }

  function readContentIntoBuffer(stream) {
    // Reads the stream into a buffer that is inserted into the container
    // by `act`, to simulate receiving a streaming HTML response. Unlike
    // readIntoContainer, it immediately returns — it does not block until the
    // stream is finished.
    const reader = stream.getReader();
    async function go() {
      while (true) {
        try {
          const {done, value} = await reader.read();
          if (done) {
            return null;
          }
          buffer += Buffer.from(value).toString('utf8');
        } catch (error) {
          hasErrored = true;
          fatalError = error;
          return null;
        }
      }
    }
    go();
  }

  async function readIntoContainer(stream) {
    const reader = stream.getReader();
    let result = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      result += Buffer.from(value).toString('utf8');
    }
    const temp = document.createElement('div');
    temp.innerHTML = result;
    await insertNodesAndExecuteScripts(temp, container, null);
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

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.log(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);
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

  // @gate experimental
  it('should call prerender', async () => {
    const result = await ReactDOMFizzStatic.prerender(<div>hello world</div>);
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(`"<div>hello world</div>"`);
  });

  // @gate experimental
  it('should emit DOCTYPE at the root of the document', async () => {
    const result = await ReactDOMFizzStatic.prerender(
      <html>
        <body>hello world</body>
      </html>,
    );
    const prelude = await readContent(result.prelude);
    if (gate(flags => flags.enableFloat)) {
      expect(prelude).toMatchInlineSnapshot(
        `"<!DOCTYPE html><html><head></head><body>hello world</body></html>"`,
      );
    } else {
      expect(prelude).toMatchInlineSnapshot(
        `"<!DOCTYPE html><html><body>hello world</body></html>"`,
      );
    }
  });

  // @gate experimental
  it('should emit bootstrap script src at the end', async () => {
    const result = await ReactDOMFizzStatic.prerender(<div>hello world</div>, {
      bootstrapScriptContent: 'INIT();',
      bootstrapScripts: ['init.js'],
      bootstrapModules: ['init.mjs'],
    });
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(
      `"<link rel="preload" as="script" fetchPriority="low" href="init.js"/><link rel="modulepreload" fetchPriority="low" href="init.mjs"/><div>hello world</div><script>INIT();</script><script src="init.js" async=""></script><script type="module" src="init.mjs" async=""></script>"`,
    );
  });

  // @gate experimental
  it('emits all HTML as one unit', async () => {
    let hasLoaded = false;
    let resolve;
    const promise = new Promise(r => (resolve = r));
    function Wait() {
      if (!hasLoaded) {
        throw promise;
      }
      return 'Done';
    }
    const resultPromise = ReactDOMFizzStatic.prerender(
      <div>
        <Suspense fallback="Loading">
          <Wait />
        </Suspense>
      </div>,
    );

    await jest.runAllTimers();

    // Resolve the loading.
    hasLoaded = true;
    await resolve();

    const result = await resultPromise;
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(
      `"<div><!--$-->Done<!-- --><!--/$--></div>"`,
    );
  });

  // @gate experimental
  it('should reject the promise when an error is thrown at the root', async () => {
    const reportedErrors = [];
    let caughtError = null;
    try {
      await ReactDOMFizzStatic.prerender(
        <div>
          <Throw />
        </div>,
        {
          onError(x) {
            reportedErrors.push(x);
          },
        },
      );
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBe(theError);
    expect(reportedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should reject the promise when an error is thrown inside a fallback', async () => {
    const reportedErrors = [];
    let caughtError = null;
    try {
      await ReactDOMFizzStatic.prerender(
        <div>
          <Suspense fallback={<Throw />}>
            <InfiniteSuspend />
          </Suspense>
        </div>,
        {
          onError(x) {
            reportedErrors.push(x);
          },
        },
      );
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBe(theError);
    expect(reportedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should not error the stream when an error is thrown inside suspense boundary', async () => {
    const reportedErrors = [];
    const result = await ReactDOMFizzStatic.prerender(
      <div>
        <Suspense fallback={<div>Loading</div>}>
          <Throw />
        </Suspense>
      </div>,
      {
        onError(x) {
          reportedErrors.push(x);
        },
      },
    );

    const prelude = await readContent(result.prelude);
    expect(prelude).toContain('Loading');
    expect(reportedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should be able to complete by aborting even if the promise never resolves', async () => {
    const errors = [];
    const controller = new AbortController();
    const resultPromise = ReactDOMFizzStatic.prerender(
      <div>
        <Suspense fallback={<div>Loading</div>}>
          <InfiniteSuspend />
        </Suspense>
      </div>,
      {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    await jest.runAllTimers();

    controller.abort();

    const result = await resultPromise;

    const prelude = await readContent(result.prelude);
    expect(prelude).toContain('Loading');

    expect(errors).toEqual(['The operation was aborted.']);
  });

  // @gate experimental
  it('should reject if aborting before the shell is complete', async () => {
    const errors = [];
    const controller = new AbortController();
    const promise = ReactDOMFizzStatic.prerender(
      <div>
        <InfiniteSuspend />
      </div>,
      {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    await jest.runAllTimers();

    const theReason = new Error('aborted for reasons');
    controller.abort(theReason);

    let caughtError = null;
    try {
      await promise;
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBe(theReason);
    expect(errors).toEqual(['aborted for reasons']);
  });

  // @gate experimental
  it('should be able to abort before something suspends', async () => {
    const errors = [];
    const controller = new AbortController();
    function App() {
      controller.abort();
      return (
        <Suspense fallback={<div>Loading</div>}>
          <InfiniteSuspend />
        </Suspense>
      );
    }
    const streamPromise = ReactDOMFizzStatic.prerender(
      <div>
        <App />
      </div>,
      {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    let caughtError = null;
    try {
      await streamPromise;
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError.message).toBe('The operation was aborted.');
    expect(errors).toEqual(['The operation was aborted.']);
  });

  // @gate experimental
  it('should reject if passing an already aborted signal', async () => {
    const errors = [];
    const controller = new AbortController();
    const theReason = new Error('aborted for reasons');
    controller.abort(theReason);

    const promise = ReactDOMFizzStatic.prerender(
      <div>
        <Suspense fallback={<div>Loading</div>}>
          <InfiniteSuspend />
        </Suspense>
      </div>,
      {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    // Technically we could still continue rendering the shell but currently the
    // semantics mean that we also abort any pending CPU work.
    let caughtError = null;
    try {
      await promise;
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBe(theReason);
    expect(errors).toEqual(['aborted for reasons']);
  });

  // @gate experimental
  it('supports custom abort reasons with a string', async () => {
    const promise = new Promise(r => {});
    function Wait() {
      throw promise;
    }
    function App() {
      return (
        <div>
          <p>
            <Suspense fallback={'p'}>
              <Wait />
            </Suspense>
          </p>
          <span>
            <Suspense fallback={'span'}>
              <Wait />
            </Suspense>
          </span>
        </div>
      );
    }

    const errors = [];
    const controller = new AbortController();
    const resultPromise = ReactDOMFizzStatic.prerender(<App />, {
      signal: controller.signal,
      onError(x) {
        errors.push(x);
        return 'a digest';
      },
    });

    controller.abort('foobar');

    await resultPromise;

    expect(errors).toEqual(['foobar', 'foobar']);
  });

  // @gate experimental
  it('supports custom abort reasons with an Error', async () => {
    const promise = new Promise(r => {});
    function Wait() {
      throw promise;
    }
    function App() {
      return (
        <div>
          <p>
            <Suspense fallback={'p'}>
              <Wait />
            </Suspense>
          </p>
          <span>
            <Suspense fallback={'span'}>
              <Wait />
            </Suspense>
          </span>
        </div>
      );
    }

    const errors = [];
    const controller = new AbortController();
    const resultPromise = ReactDOMFizzStatic.prerender(<App />, {
      signal: controller.signal,
      onError(x) {
        errors.push(x.message);
        return 'a digest';
      },
    });

    controller.abort(new Error('uh oh'));

    await resultPromise;

    expect(errors).toEqual(['uh oh', 'uh oh']);
  });

  // @gate enablePostpone
  it('supports postponing in prerender and resuming later', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return ['Hello', 'World'];
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

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(
      <div>{['Hello', 'World']}</div>,
    );
  });

  // @gate enablePostpone
  it('supports postponing in prerender and resuming with a prefix', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'World';
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            Hello
            <Postpone />
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(
      <div>{['Hello', 'World']}</div>,
    );
  });

  // @gate enablePostpone
  it('supports postponing in lazy in prerender and resuming later', async () => {
    let prerendering = true;
    const Hole = React.lazy(async () => {
      React.unstable_postpone();
    });

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            Hi
            {prerendering ? Hole : 'Hello'}
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Hi'}
        {'Hello'}
      </div>,
    );
  });

  // @gate enablePostpone
  it('supports postponing in a nested array', async () => {
    let prerendering = true;
    const Hole = React.lazy(async () => {
      React.unstable_postpone();
    });
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
            Hi
            {[<Postpone key="key" />, prerendering ? Hole : 'World']}
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(
      <div>{['Hi', 'Hello', 'World']}</div>,
    );
  });

  // @gate enablePostpone
  it('supports postponing in lazy as a direct child', async () => {
    let prerendering = true;
    const Hole = React.lazy(async () => {
      React.unstable_postpone();
    });
    function Postpone() {
      return prerendering ? Hole : 'Hello';
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Postpone key="key" />
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  // @gate enablePostpone
  it('only emits end tags once when resuming', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function App() {
      return (
        <html>
          <body>
            <Suspense fallback="Loading...">
              <Postpone />
            </Suspense>
          </body>
        </html>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const content = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    const html = await readContent(concat(prerendered.prelude, content));
    const htmlEndTags = /<\/html\s*>/gi;
    const bodyEndTags = /<\/body\s*>/gi;
    expect(Array.from(html.matchAll(htmlEndTags)).length).toBe(1);
    expect(Array.from(html.matchAll(bodyEndTags)).length).toBe(1);
  });

  // @gate enablePostpone
  it('can prerender various hoistables and deduped resources', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return (
        <>
          <link rel="stylesheet" href="my-style2" precedence="low" />
          <link rel="stylesheet" href="my-style1" precedence="high" />
          <style precedence="high" href="my-style3">
            style
          </style>
          <img src="my-img" />
        </>
      );
    }

    function App() {
      ReactDOM.preconnect('example.com');
      ReactDOM.preload('my-font', {as: 'font', type: 'font/woff2'});
      ReactDOM.preload('my-style0', {as: 'style'});
      // This should transfer the props in to the style that loads later.
      ReactDOM.preload('my-style2', {
        as: 'style',
        crossOrigin: 'use-credentials',
      });
      return (
        <div>
          <Suspense fallback="Loading...">
            <link rel="stylesheet" href="my-style1" precedence="high" />
            <img src="my-img" />
            <Postpone />
          </Suspense>
          <title>Hello World</title>
        </div>
      );
    }

    let calledInit = false;
    jest.mock(
      'init.js',
      () => {
        calledInit = true;
      },
      {virtual: true},
    );

    const prerendered = await ReactDOMFizzStatic.prerender(<App />, {
      bootstrapScripts: ['init.js'],
    });
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual([
      <link href="example.com" rel="preconnect" />,
      <link
        as="font"
        crossorigin=""
        href="my-font"
        rel="preload"
        type="font/woff2"
      />,
      <link as="image" href="my-img" rel="preload" />,
      <link data-precedence="high" href="my-style1" rel="stylesheet" />,
      <link as="script" fetchpriority="low" href="init.js" rel="preload" />,
      <link as="style" href="my-style0" rel="preload" />,
      <link
        as="style"
        crossorigin="use-credentials"
        href="my-style2"
        rel="preload"
      />,
      <title>Hello World</title>,
      <div>Loading...</div>,
    ]);

    prerendering = false;
    const content = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(content);

    expect(calledInit).toBe(true);

    // Dispatch load event to injected stylesheet
    const link = document.querySelector(
      'link[rel="stylesheet"][href="my-style2"]',
    );
    const event = document.createEvent('Events');
    event.initEvent('load', true, true);
    link.dispatchEvent(event);

    // Wait for the instruction microtasks to flush.
    await 0;
    await 0;

    expect(getVisibleChildren(container)).toEqual([
      <link href="example.com" rel="preconnect" />,
      <link
        as="font"
        crossorigin=""
        href="my-font"
        rel="preload"
        type="font/woff2"
      />,
      <link as="image" href="my-img" rel="preload" />,
      <link data-precedence="high" href="my-style1" rel="stylesheet" />,
      <style data-href="my-style3" data-precedence="high">
        style
      </style>,
      <link
        crossorigin="use-credentials"
        data-precedence="low"
        href="my-style2"
        rel="stylesheet"
      />,
      <link as="script" fetchpriority="low" href="init.js" rel="preload" />,
      <link as="style" href="my-style0" rel="preload" />,
      <link
        as="style"
        crossorigin="use-credentials"
        href="my-style2"
        rel="preload"
      />,
      <title>Hello World</title>,
      <div>
        <img src="my-img" />
        <img src="my-img" />
      </div>,
    ]);
  });

  // @gate enablePostpone
  it('can postpone a boundary after it has already been added', async () => {
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
            <Suspense fallback="Loading...">
              <Postpone />
            </Suspense>
            <Postpone />
            <Postpone />
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(
      <div>{['Hello', 'Hello', 'Hello']}</div>,
    );
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

    const Lazy = React.lazy(async () => {
      await 0;
      return {default: Postpone};
    });

    function App() {
      return (
        <div>
          <Suspense fallback="Outer">
            <Suspense fallback={<Postpone />}>
              <Postpone /> World
            </Suspense>
            <Suspense fallback={<Postpone />}>
              <Lazy />
            </Suspense>
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Outer</div>);

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Hello'}
        {' World'}
        {'Hello'}
      </div>,
    );
  });

  // @gate enablePostpone
  it('can postpone in fallback without postponing the tree', async () => {
    function Postpone() {
      React.unstable_postpone();
    }

    const lazyText = React.lazy(async () => {
      await 0; // causes the fallback to start work
      return {default: 'Hello'};
    });

    function App() {
      return (
        <div>
          <Suspense fallback="Outer">
            <Suspense fallback={<Postpone />}>{lazyText}</Suspense>
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    // TODO: This should actually be null because we should've been able to fully
    // resolve the render on the server eventually, even though the fallback postponed.
    // So we should not need to resume.
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Outer</div>);

    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await readIntoContainer(resumed);

    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  // @gate enablePostpone
  it('errors if the replay does not line up', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function Wrapper({children}) {
      return children;
    }

    const lazySpan = React.lazy(async () => {
      await 0;
      return {default: <span />};
    });

    function App() {
      const children = (
        <Suspense fallback="Loading...">
          <Postpone />
        </Suspense>
      );
      return (
        <>
          <div>{prerendering ? <Wrapper>{children}</Wrapper> : children}</div>
          <div>
            {prerendering ? (
              <Suspense fallback="Loading...">
                <div>
                  <Postpone />
                </div>
              </Suspense>
            ) : (
              lazySpan
            )}
          </div>
        </>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual([
      <div>Loading...</div>,
      <div>Loading...</div>,
    ]);

    prerendering = false;

    const errors = [];
    const resumed = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    expect(errors).toEqual([
      'Expected the resume to render <Wrapper> in this slot but instead it rendered <Suspense>. ' +
        "The tree doesn't match so React will fallback to client rendering.",
      'Expected the resume to render <Suspense> in this slot but instead it rendered <span>. ' +
        "The tree doesn't match so React will fallback to client rendering.",
    ]);

    // TODO: Test the component stack but we don't expose it to the server yet.

    await readIntoContainer(resumed);

    // Client rendered
    expect(getVisibleChildren(container)).toEqual([
      <div>Loading...</div>,
      <div>Loading...</div>,
    ]);
  });

  // @gate enablePostpone
  it('can abort the resume', async () => {
    let prerendering = true;
    const infinitePromise = new Promise(() => {});
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function App() {
      if (!prerendering) {
        React.use(infinitePromise);
      }
      return (
        <div>
          <Suspense fallback="Loading...">
            <Postpone />
          </Suspense>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    prerendering = false;

    const controller = new AbortController();

    const errors = [];

    const resumedPromise = ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
      {
        signal: controller.signal,
        onError(x) {
          errors.push(x);
        },
      },
    );

    controller.abort('abort');

    const resumed = await resumedPromise;
    await resumed.allReady;

    expect(errors).toEqual(['abort']);

    await readIntoContainer(resumed);

    // Client rendered
    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);
  });

  // @gate enablePostpone
  it('can suspend in a replayed component several layers deep', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    let resolve;
    const promise = new Promise(r => (resolve = r));
    function Delay({children}) {
      if (!prerendering) {
        React.use(promise);
      }
      return children;
    }

    // This wrapper will cause us to do one destructive render past this.
    function Outer({children}) {
      return children;
    }

    function App() {
      return (
        <div>
          <Outer>
            <Delay>
              <Suspense fallback="Loading...">
                <Postpone />
              </Suspense>
            </Delay>
          </Outer>
        </div>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    prerendering = false;

    const resumedPromise = ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    await jest.runAllTimers();

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    await resolve();

    await readIntoContainer(await resumedPromise);

    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  // @gate enablePostpone
  it('emits an empty prelude and resumes at the root if we postpone in the shell', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    function App() {
      return (
        <html lang="en">
          <body>
            <link rel="stylesheet" href="my-style" precedence="high" />
            <Postpone />
          </body>
        </html>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    expect(await readContent(prerendered.prelude)).toBe('');

    const content = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    expect(await readContent(content)).toBe(
      '<!DOCTYPE html><html lang="en"><head>' +
        '<link rel="stylesheet" href="my-style" data-precedence="high"/>' +
        '</head><body>Hello</body></html>',
    );
  });

  // @gate enablePostpone
  it('emits an empty prelude if we have not rendered html or head tags yet', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return (
        <html lang="en">
          <body>Hello</body>
        </html>
      );
    }

    function App() {
      return (
        <>
          <link rel="stylesheet" href="my-style" precedence="high" />
          <Postpone />
        </>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    expect(await readContent(prerendered.prelude)).toBe('');

    const content = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    expect(await readContent(content)).toBe(
      '<!DOCTYPE html><html lang="en"><head>' +
        '<link rel="stylesheet" href="my-style" data-precedence="high"/>' +
        '</head><body>Hello</body></html>',
    );
  });

  // @gate enablePostpone
  it('emits an empty prelude if a postpone in a promise in the shell', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return 'Hello';
    }

    const Lazy = React.lazy(async () => {
      await 0;
      return {default: Postpone};
    });

    function App() {
      return (
        <html>
          <link rel="stylesheet" href="my-style" precedence="high" />
          <body>
            <div>
              <Lazy />
            </div>
          </body>
        </html>
      );
    }

    const prerendered = await ReactDOMFizzStatic.prerender(<App />);
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    expect(await readContent(prerendered.prelude)).toBe('');

    const content = await ReactDOMFizzServer.resume(
      <App />,
      JSON.parse(JSON.stringify(prerendered.postponed)),
    );

    expect(await readContent(content)).toBe(
      '<!DOCTYPE html><html><head>' +
        '<link rel="stylesheet" href="my-style" data-precedence="high"/>' +
        '</head><body><div>Hello</div></body></html>',
    );
  });

  // @gate enablePostpone
  it(
    'during a resume, loading prerendered data from cache should not block ' +
      'sibling Suspense trees from rendering in parallel',
    async () => {
      let prerendering = true;

      function DynamicText({text}) {
        if (prerendering) {
          React.unstable_postpone();
        }
        Scheduler.log(text);
        return text;
      }

      function readTextAndLog(text) {
        readText(text);
        Scheduler.log(text);
        return text;
      }

      function Toolbar() {
        // This read is in the parent path of Toolbar content, so during the
        // resume it will run again. During the resume, it should be cached, but
        // reading from the cache may be async so it could still suspend,
        // creating a waterfall. Because it's cached, it's no big deal, but
        // regardless it shouldn't block unrelated siblings (MainContent)
        // from rendering.
        const toolbarText = readTextAndLog('Toolbar shell');

        return (
          <div>
            {toolbarText}
            <div>
              <Suspense fallback="Loading dynamic toolbar content...">
                <DynamicText text="Toolbar content" />
              </Suspense>
            </div>
          </div>
        );
      }

      function App() {
        // Note that Toolbar and MainContent are in two completely separate
        // Suspense trees. One should not block the other.
        return (
          <div>
            <Suspense fallback="Loading static toolbar shell...">
              <Toolbar />
            </Suspense>
            <div>
              <Suspense fallback="Loading dynamic main content...">
                <DynamicText text="Main content" />
              </Suspense>
            </div>
          </div>
        );
      }

      resolveText('Toolbar shell');
      const prerendered = await ReactDOMFizzStatic.prerender(<App />);
      expect(prerendered.postponed).not.toBe(null);
      // The static content rendered, but none of the dynamic content did
      // because it was postponed.
      assertLog(['Toolbar shell']);

      prerendering = false;
      // Reset the Suspense cache before starting the resume.
      textCache = new Map();

      // Resume rendering the dynamic content. The Toolbar shell is visible
      // immediately because it was prerendered.
      await act(async () => readContentIntoBuffer(prerendered.prelude));
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>
            Toolbar shell
            <div>Loading dynamic toolbar content...</div>
          </div>
          <div>Loading dynamic main content...</div>
        </div>,
      );

      // FIXME: This is where the test fails — the `resume` call never resolves
      // because it's blocked by the Toolbar shell suspending, despite the fact
      // that the toolbar is wrapped in a Suspense boundary. The net effect is
      // that the dynamic main content is blocked longer than it should be, even
      // though it's in a sibling Suspense tree.
      // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

      // Start rendering the dynamic content.
      const resumed = await ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      );

      // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      // I wrote the rest of the test assertions below based on my best
      // understanding of what the behavior should be, though it might be slightly
      // off since I wasn't able to actually run it.

      await act(async () => {
        readContentIntoBuffer(resumed);
      });
      assertLog([
        // Because it's in the parent path, the Toolbar shell will be replayed.
        // It should load quickly because it's cached, but reading from the
        // cache may itself be async, so it may suspend again, which is what
        // we're simulating here.
        'Suspend! [Toolbar shell]',

        // The toolbar content is blocked by the toolbar shell, but since the
        // main content is in an unrelated sibling Suspense tree, we can render
        // that immediately.
        'Main content',
      ]);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>
            Toolbar shell
            <div>Loading dynamic toolbar content...</div>
          </div>
          <div>Main content</div>
        </div>,
      );

      // Finish loading the Toolbar shell from cache. This unblocks the dynamic
      // toolbar content.
      await act(() => resolveText('Toolbar shell'));
      assertLog(['Toolbar shell', 'Toolbar content']);
      expect(getVisibleChildren(container)).toEqual(
        <div>
          <div>
            Toolbar shell
            <div>Toolbar content</div>
          </div>
          <div>Main content</div>
        </div>,
      );
    },
  );
});
