/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactDOMFizzStatic;
let Suspense;

describe('ReactDOMFizzStaticNode', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzStatic = require('react-dom/static');
    }
    Suspense = React.Suspense;
  });

  const theError = new Error('This is an error');
  function Throw() {
    throw theError;
  }
  const theInfinitePromise = new Promise(() => {});
  function InfiniteSuspend() {
    throw theInfinitePromise;
  }

  function readContent(readable) {
    return new Promise((resolve, reject) => {
      let content = '';
      readable.on('data', chunk => {
        content += Buffer.from(chunk).toString('utf8');
      });
      readable.on('error', error => {
        reject(error);
      });
      readable.on('end', () => resolve(content));
    });
  }

  // @gate experimental
  it('should call prerenderToNodeStream', async () => {
    const result = await ReactDOMFizzStatic.prerenderToNodeStream(
      <div>hello world</div>,
    );
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(`"<div>hello world</div>"`);
  });

  // @gate experimental
  it('should emit DOCTYPE at the root of the document', async () => {
    const result = await ReactDOMFizzStatic.prerenderToNodeStream(
      <html>
        <body>hello world</body>
      </html>,
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

  // @gate experimental
  it('should emit bootstrap script src at the end', async () => {
    const result = await ReactDOMFizzStatic.prerenderToNodeStream(
      <div>hello world</div>,
      {
        bootstrapScriptContent: 'INIT();',
        bootstrapScripts: ['init.js'],
        bootstrapModules: ['init.mjs'],
      },
    );
    const prelude = await readContent(result.prelude);
    expect(prelude).toMatchInlineSnapshot(
      `"<link rel="preload" as="script" fetchPriority="low" href="init.js"/><link rel="modulepreload" fetchPriority="low" href="init.mjs"/><div>hello world</div><script id="«R»">INIT();</script><script src="init.js" async=""></script><script type="module" src="init.mjs" async=""></script>"`,
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
    const resultPromise = ReactDOMFizzStatic.prerenderToNodeStream(
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
    expect(prelude).toMatchInlineSnapshot(`"<div><!--$-->Done<!--/$--></div>"`);
  });

  // @gate experimental
  it('should reject the promise when an error is thrown at the root', async () => {
    const reportedErrors = [];
    let caughtError = null;
    try {
      await ReactDOMFizzStatic.prerenderToNodeStream(
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
      await ReactDOMFizzStatic.prerenderToNodeStream(
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
    const result = await ReactDOMFizzStatic.prerenderToNodeStream(
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
    const resultPromise = ReactDOMFizzStatic.prerenderToNodeStream(
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

    expect(errors).toEqual(['This operation was aborted']);
  });

  // @gate experimental
  // @gate !enableHalt
  it('should reject if aborting before the shell is complete and enableHalt is disabled', async () => {
    const errors = [];
    const controller = new AbortController();
    const promise = ReactDOMFizzStatic.prerenderToNodeStream(
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

  // @gate enableHalt
  it('should resolve an empty shell if aborting before the shell is complete', async () => {
    const errors = [];
    const controller = new AbortController();
    const promise = ReactDOMFizzStatic.prerenderToNodeStream(
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
    const streamPromise = ReactDOMFizzStatic.prerenderToNodeStream(
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

  // @gate experimental
  // @gate !enableHalt
  it('should reject if passing an already aborted signal and enableHalt is disabled', async () => {
    const errors = [];
    const controller = new AbortController();
    const theReason = new Error('aborted for reasons');
    controller.abort(theReason);

    const promise = ReactDOMFizzStatic.prerenderToNodeStream(
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

  // @gate enableHalt
  it('should resolve with an empty prelude if passing an already aborted signal', async () => {
    const errors = [];
    const controller = new AbortController();
    const theReason = new Error('aborted for reasons');
    controller.abort(theReason);

    const promise = ReactDOMFizzStatic.prerenderToNodeStream(
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
    const resultPromise = ReactDOMFizzStatic.prerenderToNodeStream(<App />, {
      signal: controller.signal,
      onError(x) {
        errors.push(x);
        return 'a digest';
      },
    });

    await jest.runAllTimers();

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
    const resultPromise = ReactDOMFizzStatic.prerenderToNodeStream(<App />, {
      signal: controller.signal,
      onError(x) {
        errors.push(x.message);
        return 'a digest';
      },
    });

    await jest.runAllTimers();

    controller.abort(new Error('uh oh'));

    await resultPromise;

    expect(errors).toEqual(['uh oh', 'uh oh']);
  });
});
