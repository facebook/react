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

import {patchMessageChannel} from '../../../../scripts/jest/patchMessageChannel';

import {
  getVisibleChildren,
  insertNodesAndExecuteScripts,
} from '../test-utils/FizzTestUtils';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

let JSDOM;
let React;
let ReactDOM;
let ReactDOMFizzServer;
let ReactDOMFizzStatic;
let Suspense;
let SuspenseList;
let container;
let Scheduler;
let act;

describe('ReactDOMFizzStaticBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;

    // We need the mocked version of setTimeout inside the document.
    window.setTimeout = setTimeout;

    Scheduler = require('scheduler');
    patchMessageChannel(Scheduler);
    act = require('internal-test-utils').act;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFizzServer = require('react-dom/server.browser');
    ReactDOMFizzStatic = require('react-dom/static.browser');
    Suspense = React.Suspense;
    SuspenseList = React.unstable_SuspenseList;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (typeof global.window.__restoreGlobalScope === 'function') {
      global.window.__restoreGlobalScope();
    }
    document.body.removeChild(container);
  });

  async function serverAct(callback) {
    let maybePromise;
    await act(() => {
      maybePromise = callback();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    });
    return maybePromise;
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
    jest.runAllTimers();
  }

  async function readIntoNewDocument(stream) {
    const content = await readContent(stream);
    const jsdom = new JSDOM(
      // The Fizz runtime assumes requestAnimationFrame exists so we need to polyfill it.
      '<script>window.requestAnimationFrame = setTimeout;</script>' + content,
      {
        runScripts: 'dangerously',
      },
    );
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalNavigator = global.navigator;
    const originalNode = global.Node;
    const originalAddEventListener = global.addEventListener;
    const originalMutationObserver = global.MutationObserver;
    global.window = jsdom.window;
    global.document = global.window.document;
    global.navigator = global.window.navigator;
    global.Node = global.window.Node;
    global.addEventListener = global.window.addEventListener;
    global.MutationObserver = global.window.MutationObserver;
    global.window.__restoreGlobalScope = () => {
      global.window = originalWindow;
      global.document = originalDocument;
      global.navigator = originalNavigator;
      global.Node = originalNode;
      global.addEventListener = originalAddEventListener;
      global.MutationObserver = originalMutationObserver;
    };
  }

  async function readIntoCurrentDocument(stream) {
    const content = await readContent(stream);
    const temp = document.createElement('div');
    temp.innerHTML = content;
    await insertNodesAndExecuteScripts(temp, document.body, null);
    jest.runAllTimers();
  }

  it('should call prerender', async () => {
    const result = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<div>hello world</div>),
    );
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(`"<div>hello world</div>"`);
  });

  it('should emit DOCTYPE at the root of the document', async () => {
    const result = await serverAct(() =>
      ReactDOMFizzStatic.prerender(
        <html>
          <body>hello world</body>
        </html>,
      ),
    );
    const prelude = await readContent(result.prelude);
    if (gate(flags => flags.enableFizzBlockingRender)) {
      expect(prelude).toMatchInlineSnapshot(
        `"<!DOCTYPE html><html><head><link rel="expect" href="#«R»" blocking="render"/></head><body>hello world<template id="«R»"></template></body></html>"`,
      );
    } else {
      expect(prelude).toMatchInlineSnapshot(
        `"<!DOCTYPE html><html><head></head><body>hello world</body></html>"`,
      );
    }
  });

  it('should emit bootstrap script src at the end', async () => {
    const result = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<div>hello world</div>, {
        bootstrapScriptContent: 'INIT();',
        bootstrapScripts: ['init.js'],
        bootstrapModules: ['init.mjs'],
      }),
    );
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(
      `"<link rel="preload" as="script" fetchPriority="low" href="init.js"/><link rel="modulepreload" fetchPriority="low" href="init.mjs"/><div>hello world</div><script id="«R»">INIT();</script><script src="init.js" async=""></script><script type="module" src="init.mjs" async=""></script>"`,
    );
  });

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
    const resultPromise = serverAct(() =>
      ReactDOMFizzStatic.prerender(
        <div>
          <Suspense fallback="Loading">
            <Wait />
          </Suspense>
        </div>,
      ),
    );

    await jest.runAllTimers();

    // Resolve the loading.
    hasLoaded = true;
    await resolve();

    const result = await resultPromise;
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(`"<div><!--$-->Done<!--/$--></div>"`);
  });

  it('should reject the promise when an error is thrown at the root', async () => {
    const reportedErrors = [];
    let caughtError = null;
    try {
      await serverAct(() =>
        ReactDOMFizzStatic.prerender(
          <div>
            <Throw />
          </div>,
          {
            onError(x) {
              reportedErrors.push(x);
            },
          },
        ),
      );
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBe(theError);
    expect(reportedErrors).toEqual([theError]);
  });

  it('should reject the promise when an error is thrown inside a fallback', async () => {
    const reportedErrors = [];
    let caughtError = null;
    try {
      await serverAct(() =>
        ReactDOMFizzStatic.prerender(
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
        ),
      );
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBe(theError);
    expect(reportedErrors).toEqual([theError]);
  });

  it('should not error the stream when an error is thrown inside suspense boundary', async () => {
    const reportedErrors = [];
    const result = await serverAct(() =>
      ReactDOMFizzStatic.prerender(
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
      ),
    );

    const prelude = await readContent(result.prelude);
    expect(prelude).toContain('Loading');
    expect(reportedErrors).toEqual([theError]);
  });

  it('should be able to complete by aborting even if the promise never resolves', async () => {
    const errors = [];
    const controller = new AbortController();
    let resultPromise;
    await serverAct(() => {
      resultPromise = ReactDOMFizzStatic.prerender(
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
    });

    controller.abort();

    const result = await resultPromise;

    const prelude = await readContent(result.prelude);
    expect(prelude).toContain('Loading');

    expect(errors).toEqual(['This operation was aborted']);
  });

  // @gate !enableHalt
  it('should reject if aborting before the shell is complete and enableHalt is disabled', async () => {
    const errors = [];
    const controller = new AbortController();
    const promise = serverAct(() =>
      ReactDOMFizzStatic.prerender(
        <div>
          <InfiniteSuspend />
        </div>,
        {
          signal: controller.signal,
          onError(x) {
            errors.push(x.message);
          },
        },
      ),
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

  // @gate enableHalt
  it('should resolve an empty prelude if aborting before the shell is complete', async () => {
    const errors = [];
    const controller = new AbortController();
    const promise = serverAct(() =>
      ReactDOMFizzStatic.prerender(
        <div>
          <InfiniteSuspend />
        </div>,
        {
          signal: controller.signal,
          onError(x) {
            errors.push(x.message);
          },
        },
      ),
    );

    await jest.runAllTimers();

    const theReason = new Error('aborted for reasons');
    controller.abort(theReason);

    let rejected = false;
    let prelude;
    try {
      ({prelude} = await promise);
    } catch (error) {
      rejected = true;
    }
    expect(rejected).toBe(false);
    expect(errors).toEqual(['aborted for reasons']);
    const content = await readContent(prelude);
    expect(content).toBe('');
  });

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
    const streamPromise = serverAct(() =>
      ReactDOMFizzStatic.prerender(
        <div>
          <App />
        </div>,
        {
          signal: controller.signal,
          onError(x) {
            errors.push(x.message);
          },
        },
      ),
    );

    if (gate(flags => flags.enableHalt)) {
      const {prelude} = await streamPromise;
      const content = await readContent(prelude);
      expect(errors).toEqual(['This operation was aborted']);
      expect(content).toBe('');
    } else {
      let caughtError = null;
      try {
        await streamPromise;
      } catch (error) {
        caughtError = error;
      }
      expect(caughtError.message).toBe('This operation was aborted');
      expect(errors).toEqual(['This operation was aborted']);
    }
  });

  // @gate !enableHalt
  it('should reject if passing an already aborted signal and enableHalt is disabled', async () => {
    const errors = [];
    const controller = new AbortController();
    const theReason = new Error('aborted for reasons');
    controller.abort(theReason);

    const promise = serverAct(() =>
      ReactDOMFizzStatic.prerender(
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
      ),
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

  // @gate enableHalt
  it('should resolve an empty prelude if passing an already aborted signal', async () => {
    const errors = [];
    const controller = new AbortController();
    const theReason = new Error('aborted for reasons');
    controller.abort(theReason);

    const promise = serverAct(() =>
      ReactDOMFizzStatic.prerender(
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
      ),
    );

    // Technically we could still continue rendering the shell but currently the
    // semantics mean that we also abort any pending CPU work.
    let didThrow = false;
    let prelude;
    try {
      ({prelude} = await promise);
    } catch (error) {
      didThrow = true;
    }
    expect(didThrow).toBe(false);
    expect(errors).toEqual(['aborted for reasons']);
    const content = await readContent(prelude);
    expect(content).toBe('');
  });

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
    let resultPromise;
    await serverAct(() => {
      resultPromise = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError(x) {
          errors.push(x);
          return 'a digest';
        },
      });
    });

    controller.abort('foobar');

    await resultPromise;

    expect(errors).toEqual(['foobar', 'foobar']);
  });

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
    let resultPromise;
    await serverAct(() => {
      resultPromise = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
          return 'a digest';
        },
      });
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />, {
        bootstrapScripts: ['init.js'],
      }),
    );
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
    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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
    jest.runAllTimers();

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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    // TODO: This should actually be null because we should've been able to fully
    // resolve the render on the server eventually, even though the fallback postponed.
    // So we should not need to resume.
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Outer</div>);

    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual([
      <div>Loading...</div>,
      <div>Loading...</div>,
    ]);

    prerendering = false;

    const errors = [];
    const resumed = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
        {
          onError(x) {
            errors.push(x.message);
          },
        },
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual(<div>Loading...</div>);

    prerendering = false;

    const controller = new AbortController();

    const errors = [];

    const resumedPromise = serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
        {
          signal: controller.signal,
          onError(x) {
            errors.push(x);
          },
        },
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    prerendering = false;

    const resumedPromise = serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    expect(await readContent(prerendered.prelude)).toBe('');

    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
    );

    expect(await readContent(content)).toBe(
      '<!DOCTYPE html><html lang="en"><head>' +
        '<link rel="stylesheet" href="my-style" data-precedence="high"/>' +
        (gate(flags => flags.enableFizzBlockingRender)
          ? '<link rel="expect" href="#«R»" blocking="render"/>'
          : '') +
        '</head>' +
        '<body>Hello' +
        (gate(flags => flags.enableFizzBlockingRender)
          ? '<template id="«R»"></template>'
          : '') +
        '</body></html>',
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    expect(await readContent(prerendered.prelude)).toBe('');

    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
    );

    expect(await readContent(content)).toBe(
      '<!DOCTYPE html><html lang="en"><head>' +
        '<link rel="stylesheet" href="my-style" data-precedence="high"/>' +
        '<link rel="expect" href="#«R»" blocking="render"/></head>' +
        '<body>Hello<template id="«R»"></template></body></html>',
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

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    expect(await readContent(prerendered.prelude)).toBe('');

    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
    );

    expect(await readContent(content)).toBe(
      '<!DOCTYPE html><html><head>' +
        '<link rel="stylesheet" href="my-style" data-precedence="high"/>' +
        '<link rel="expect" href="#«R»" blocking="render"/></head>' +
        '<body><div>Hello</div><template id="«R»"></template></body></html>',
    );
  });

  // @gate enablePostpone
  it('does not emit preloads during resume for Resources preloaded through onHeaders', async () => {
    let prerendering = true;

    let hasLoaded = false;
    let resolve;
    const promise = new Promise(r => (resolve = r));
    function WaitIfResuming({children}) {
      if (!prerendering && !hasLoaded) {
        throw promise;
      }
      return children;
    }

    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return null;
    }

    let headers;
    function onHeaders(x) {
      headers = x;
    }

    function App() {
      ReactDOM.preload('image', {as: 'image', fetchPriority: 'high'});
      return (
        <html>
          <body>
            hello
            <Suspense fallback={null}>
              <WaitIfResuming>
                world
                <link rel="stylesheet" href="style" precedence="default" />
              </WaitIfResuming>
            </Suspense>
            <Postpone />
          </body>
        </html>
      );
    }

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />, {
        onHeaders,
      }),
    );
    expect(prerendered.postponed).not.toBe(null);

    prerendering = false;

    expect(await readContent(prerendered.prelude)).toBe('');
    expect(headers).toEqual(
      new Headers({
        Link: `
<image>; rel=preload; as="image"; fetchpriority="high",
 <style>; rel=preload; as="style"
`
          .replaceAll('\n', '')
          .trim(),
      }),
    );

    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
    );

    const decoder = new TextDecoder();
    const reader = content.getReader();
    let {value, done} = await reader.read();
    let result = decoder.decode(value, {stream: true});

    expect(result).toBe(
      '<!DOCTYPE html><html><head><link rel="expect" href="#«R»" blocking="render"/></head>' +
        '<body>hello<!--$?--><template id="B:1"></template><!--/$--><script id="«R»">requestAnimationFrame(function(){$RT=performance.now()});</script>',
    );

    await 1;
    hasLoaded = true;
    await serverAct(resolve);

    while (true) {
      ({value, done} = await reader.read());
      if (done) {
        result += decoder.decode(value);
        break;
      }
      result += decoder.decode(value, {stream: true});
    }

    // We are mostly just trying to assert that no preload for our stylesheet was emitted
    // prior to sending the segment the stylesheet was for. This test is asserting this
    // because the boundary complete instruction is sent when we are writing the
    const instructionIndex = result.indexOf('$RX');
    expect(instructionIndex > -1).toBe(true);
    const slice = result.slice(0, instructionIndex + '$RX'.length);

    expect(slice).toBe(
      '<!DOCTYPE html><html><head><link rel="expect" href="#«R»" blocking="render"/></head>' +
        '<body>hello<!--$?--><template id="B:1"></template><!--/$--><script id="«R»">requestAnimationFrame(function(){$RT=performance.now()});</script>' +
        '<div hidden id="S:1">world<!-- --></div><script>$RX',
    );
  });

  it('logs an error if onHeaders throws but continues the prerender', async () => {
    const errors = [];
    function onError(error) {
      errors.push(error.message);
    }

    function onHeaders(x) {
      throw new Error('bad onHeaders');
    }

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<div>hello</div>, {
        onHeaders,
        onError,
      }),
    );
    expect(prerendered.postponed).toBe(
      gate(flags => flags.enableHalt || flags.enablePostpone)
        ? null
        : undefined,
    );
    expect(errors).toEqual(['bad onHeaders']);

    await readIntoContainer(prerendered.prelude);
    expect(getVisibleChildren(container)).toEqual(<div>hello</div>);
  });

  // @gate enablePostpone
  it('does not bootstrap again in a resume if it bootstraps', async () => {
    let prerendering = true;

    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return null;
    }

    function App() {
      return (
        <html>
          <body>
            <Suspense fallback="loading...">
              <Postpone />
              hello
            </Suspense>
          </body>
        </html>
      );
    }

    let inits = 0;
    jest.mock(
      'init.js',
      () => {
        inits++;
      },
      {virtual: true},
    );

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />, {
        bootstrapScripts: ['init.js'],
      }),
    );

    const postponedSerializedState = JSON.stringify(prerendered.postponed);

    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual([
      <link rel="preload" href="init.js" fetchpriority="low" as="script" />,
      'loading...',
    ]);

    expect(inits).toBe(1);

    jest.resetModules();
    jest.mock(
      'init.js',
      () => {
        inits++;
      },
      {virtual: true},
    );

    prerendering = false;

    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(<App />, JSON.parse(postponedSerializedState)),
    );

    await readIntoContainer(content);

    expect(inits).toBe(1);

    expect(getVisibleChildren(container)).toEqual([
      <link rel="preload" href="init.js" fetchpriority="low" as="script" />,
      'hello',
    ]);
  });

  // @gate enablePostpone
  it('can render a deep list of single components where one postpones', async () => {
    let isPrerendering = true;
    function Outer({children}) {
      return children;
    }

    function Middle({children}) {
      return children;
    }

    function Inner() {
      if (isPrerendering) {
        React.unstable_postpone();
      }
      return 'hello';
    }

    function App() {
      return (
        <div>
          <Suspense fallback="loading...">
            <Outer>
              <Middle>
                <Inner />
              </Middle>
            </Outer>
          </Suspense>
        </div>
      );
    }

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    const postponedState = JSON.stringify(prerendered.postponed);

    await readIntoContainer(prerendered.prelude);
    expect(getVisibleChildren(container)).toEqual(<div>loading...</div>);

    isPrerendering = false;

    const dynamic = await serverAct(() =>
      ReactDOMFizzServer.resume(<App />, JSON.parse(postponedState)),
    );

    await readIntoContainer(dynamic);
    expect(getVisibleChildren(container)).toEqual(<div>hello</div>);
  });

  // @gate enableHalt
  it('can resume render of a prerender', async () => {
    const errors = [];

    let resolveA;
    const promiseA = new Promise(r => (resolveA = r));
    let resolveB;
    const promiseB = new Promise(r => (resolveB = r));

    async function ComponentA() {
      await promiseA;
      return (
        <Suspense fallback="Loading B">
          <ComponentB />
        </Suspense>
      );
    }

    async function ComponentB() {
      await promiseB;
      return 'Hello';
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading A">
            <ComponentA />
          </Suspense>
        </div>
      );
    }

    const controller = new AbortController();
    let pendingResult;
    await serverAct(async () => {
      pendingResult = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      });
    });

    controller.abort();
    const prerendered = await pendingResult;
    const postponedState = JSON.stringify(prerendered.postponed);

    await readIntoContainer(prerendered.prelude);
    expect(getVisibleChildren(container)).toEqual(<div>Loading A</div>);

    await resolveA();

    expect(prerendered.postponed).not.toBe(null);

    const controller2 = new AbortController();
    await serverAct(async () => {
      pendingResult = ReactDOMFizzStatic.resumeAndPrerender(
        <App />,
        JSON.parse(postponedState),
        {
          signal: controller2.signal,
          onError(x) {
            errors.push(x.message);
          },
        },
      );
    });

    controller2.abort();

    const prerendered2 = await pendingResult;
    const postponedState2 = JSON.stringify(prerendered2.postponed);

    await readIntoContainer(prerendered2.prelude);
    expect(getVisibleChildren(container)).toEqual(<div>Loading B</div>);

    await resolveB();

    const dynamic = await serverAct(() =>
      ReactDOMFizzServer.resume(<App />, JSON.parse(postponedState2)),
    );

    await readIntoContainer(dynamic);
    expect(getVisibleChildren(container)).toEqual(<div>Hello</div>);
  });

  // @gate enableHalt
  it('can prerender a preamble', async () => {
    const errors = [];

    let resolveA;
    const promiseA = new Promise(r => (resolveA = r));
    let resolveB;
    const promiseB = new Promise(r => (resolveB = r));

    async function ComponentA() {
      await promiseA;
      return (
        <Suspense fallback="Loading B">
          <ComponentB />
        </Suspense>
      );
    }

    async function ComponentB() {
      await promiseB;
      return 'Hello';
    }

    function App() {
      return (
        <Suspense>
          <html data-x="">
            <body data-x="">
              <Suspense fallback="Loading A">
                <ComponentA />
              </Suspense>
            </body>
          </html>
        </Suspense>
      );
    }

    const controller = new AbortController();
    let pendingResult;
    await serverAct(async () => {
      pendingResult = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      });
    });

    controller.abort();

    const prerendered = await pendingResult;
    const postponedState = JSON.stringify(prerendered.postponed);

    await readIntoNewDocument(prerendered.prelude);
    expect(getVisibleChildren(document)).toEqual(
      <html data-x="">
        <head />
        <body data-x="">Loading A</body>
      </html>,
    );

    await resolveA();

    expect(prerendered.postponed).not.toBe(null);

    const controller2 = new AbortController();
    await serverAct(async () => {
      pendingResult = ReactDOMFizzStatic.resumeAndPrerender(
        <App />,
        JSON.parse(postponedState),
        {
          signal: controller2.signal,
          onError(x) {
            errors.push(x.message);
          },
        },
      );
    });

    controller2.abort();

    const prerendered2 = await pendingResult;
    const postponedState2 = JSON.stringify(prerendered2.postponed);

    await readIntoCurrentDocument(prerendered2.prelude);
    expect(getVisibleChildren(document)).toEqual(
      <html data-x="">
        <head />
        <body data-x="">Loading B</body>
      </html>,
    );

    await resolveB();

    const dynamic = await serverAct(() =>
      ReactDOMFizzServer.resume(<App />, JSON.parse(postponedState2)),
    );

    await readIntoCurrentDocument(dynamic);
    expect(getVisibleChildren(document)).toEqual(
      <html data-x="">
        <head />
        <body data-x="">Hello</body>
      </html>,
    );
  });

  it('can suspend inside <head> tag', async () => {
    const promise = new Promise(() => {});

    function App() {
      return (
        <html>
          <head>
            <Suspense fallback={<meta itemProp="" content="fallback" />}>
              <Metadata />
            </Suspense>
          </head>
          <body>
            <div>hello</div>
          </body>
        </html>
      );
    }

    function Metadata() {
      React.use(promise);
      return <meta itemProp="" content="primary" />;
    }

    const controller = new AbortController();
    let pendingResult;
    const errors = [];
    await serverAct(() => {
      pendingResult = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError: e => {
          errors.push(e.message);
        },
      });
    });

    controller.abort(new Error('boom'));

    const prerendered = await pendingResult;

    await readIntoNewDocument(prerendered.prelude);
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <meta itemprop="" content="fallback" />
        </head>
        <body>
          <div>hello</div>
        </body>
      </html>,
    );

    expect(errors).toEqual(['boom']);
  });

  // @gate enableHalt
  it('will render fallback Document when erroring a boundary above the body', async () => {
    let isPrerendering = true;
    const promise = new Promise(() => {});

    function Boom() {
      if (isPrerendering) {
        React.use(promise);
      }
      throw new Error('Boom!');
    }

    function App() {
      return (
        <Suspense
          fallback={
            <html data-error-html="">
              <body data-error-body="">
                <span>hello error</span>
              </body>
            </html>
          }>
          <html data-content-html="">
            <body data-content-body="">
              <Boom />
              <span>hello world</span>
            </body>
          </html>
        </Suspense>
      );
    }

    const controller = new AbortController();
    let pendingResult;
    const errors = [];
    await serverAct(() => {
      pendingResult = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError: e => {
          errors.push(e.message);
        },
      });
    });

    controller.abort();

    const prerendered = await pendingResult;

    expect(errors).toEqual(['This operation was aborted']);
    const content = await readContent(prerendered.prelude);
    expect(content).toBe('');

    isPrerendering = false;
    const postponedState = JSON.stringify(prerendered.postponed);

    const resumeErrors = [];
    const dynamic = await serverAct(() =>
      ReactDOMFizzServer.resume(<App />, JSON.parse(postponedState), {
        onError: e => {
          resumeErrors.push(e.message);
        },
      }),
    );

    expect(resumeErrors).toEqual(['Boom!']);
    await readIntoNewDocument(dynamic);

    expect(getVisibleChildren(document)).toEqual(
      <html data-error-html="">
        <head />
        <body data-error-body="">
          <span>hello error</span>
        </body>
      </html>,
    );
  });

  // @gate enableHalt
  it('can omit a preamble with an empty shell if no preamble is ready when prerendering finishes', async () => {
    const errors = [];

    let resolveA;
    const promiseA = new Promise(r => (resolveA = r));
    let resolveB;
    const promiseB = new Promise(r => (resolveB = r));

    async function ComponentA() {
      await promiseA;
      return (
        <Suspense fallback="Loading B">
          <ComponentB />
        </Suspense>
      );
    }

    async function ComponentB() {
      await promiseB;
      return 'Hello';
    }

    function App() {
      return (
        <Suspense>
          <html data-x="">
            <body data-x="">
              <ComponentA />
            </body>
          </html>
        </Suspense>
      );
    }

    const controller = new AbortController();
    let pendingResult;
    await serverAct(async () => {
      pendingResult = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      });
    });

    controller.abort();

    const prerendered = await pendingResult;
    const postponedState = JSON.stringify(prerendered.postponed);

    const content = await readContent(prerendered.prelude);
    expect(content).toBe('');

    await resolveA();

    expect(prerendered.postponed).not.toBe(null);

    const controller2 = new AbortController();
    await serverAct(async () => {
      pendingResult = ReactDOMFizzStatic.resumeAndPrerender(
        <App />,
        JSON.parse(postponedState),
        {
          signal: controller2.signal,
          onError(x) {
            errors.push(x.message);
          },
        },
      );
    });

    controller2.abort();

    const prerendered2 = await pendingResult;
    const postponedState2 = JSON.stringify(prerendered2.postponed);

    await readIntoNewDocument(prerendered2.prelude);
    expect(getVisibleChildren(document)).toEqual(
      <html data-x="">
        <head />
        <body data-x="">Loading B</body>
      </html>,
    );

    await resolveB();

    const dynamic = await serverAct(() =>
      ReactDOMFizzServer.resume(<App />, JSON.parse(postponedState2)),
    );

    await readIntoCurrentDocument(dynamic);
    expect(getVisibleChildren(document)).toEqual(
      <html data-x="">
        <head />
        <body data-x="">Hello</body>
      </html>,
    );
  });

  // @gate enableHalt && enableSuspenseList
  it('can resume a partially prerendered SuspenseList', async () => {
    const errors = [];

    let resolveA;
    const promiseA = new Promise(r => (resolveA = r));
    let resolveB;
    const promiseB = new Promise(r => (resolveB = r));

    async function ComponentA() {
      await promiseA;
      return 'A';
    }

    async function ComponentB() {
      await promiseB;
      return 'B';
    }

    function App() {
      return (
        <div>
          <SuspenseList revealOrder="forwards">
            <Suspense fallback="Loading A">
              <ComponentA />
            </Suspense>
            <Suspense fallback="Loading B">
              <ComponentB />
            </Suspense>
            <Suspense fallback="Loading C">C</Suspense>
          </SuspenseList>
        </div>
      );
    }

    const controller = new AbortController();
    let pendingResult;
    await serverAct(async () => {
      pendingResult = ReactDOMFizzStatic.prerender(<App />, {
        signal: controller.signal,
        onError(x) {
          errors.push(x.message);
        },
      });
    });

    controller.abort();
    const prerendered = await pendingResult;
    const postponedState = JSON.stringify(prerendered.postponed);

    await readIntoContainer(prerendered.prelude);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'Loading A'}
        {'Loading B'}
        {'C' /* TODO: This should not be resolved. */}
      </div>,
    );

    expect(prerendered.postponed).not.toBe(null);

    await resolveA();
    await resolveB();

    const dynamic = await serverAct(() =>
      ReactDOMFizzServer.resume(<App />, JSON.parse(postponedState)),
    );

    await readIntoContainer(dynamic);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        {'A'}
        {'B'}
        {'C'}
      </div>,
    );
  });
});
