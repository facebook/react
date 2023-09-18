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
} from '../test-utils/FizzTestUtils';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

let React;
let ReactDOM;
let ReactDOMFizzServer;
let ReactDOMFizzStatic;
let Suspense;
let container;

describe('ReactDOMFizzStaticBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFizzServer = require('react-dom/server.browser');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzStatic = require('react-dom/static.browser');
    }
    Suspense = React.Suspense;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

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
      `"<link rel="preload" href="init.js" as="script" fetchPriority="low"/><link rel="modulepreload" href="init.mjs" fetchPriority="low"/><div>hello world</div><script>INIT();</script><script src="init.js" async=""></script><script type="module" src="init.mjs" async=""></script>"`,
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
});
