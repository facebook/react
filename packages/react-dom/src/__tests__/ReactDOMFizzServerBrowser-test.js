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
global.AbortController = require('abort-controller');

let React;
let ReactDOMFizzServer;
let Suspense;

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzServer = require('react-dom/server.browser');
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

  // @gate experimental
  it('should call renderToReadableStream', async () => {
    const stream = await ReactDOMFizzServer.renderToReadableStream(
      <div>hello world</div>,
    );
    const result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(`"<div>hello world</div>"`);
  });

  // @gate experimental
  it('should emit DOCTYPE at the root of the document', async () => {
    const stream = await ReactDOMFizzServer.renderToReadableStream(
      <html>
        <body>hello world</body>
      </html>,
    );
    const result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(
      `"<!DOCTYPE html><html><body>hello world</body></html>"`,
    );
  });

  // @gate experimental
  it('should emit bootstrap script src at the end', async () => {
    const stream = await ReactDOMFizzServer.renderToReadableStream(
      <div>hello world</div>,
      {
        bootstrapScriptContent: 'INIT();',
        bootstrapScripts: ['init.js'],
        bootstrapModules: ['init.mjs'],
      },
    );
    const result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(
      `"<div>hello world</div><script>INIT();</script><script src=\\"init.js\\" async=\\"\\"></script><script type=\\"module\\" src=\\"init.mjs\\" async=\\"\\"></script>"`,
    );
  });

  // @gate experimental
  it('emits all HTML as one unit if we wait until the end to start', async () => {
    let hasLoaded = false;
    let resolve;
    const promise = new Promise(r => (resolve = r));
    function Wait() {
      if (!hasLoaded) {
        throw promise;
      }
      return 'Done';
    }
    let isComplete = false;
    const stream = await ReactDOMFizzServer.renderToReadableStream(
      <div>
        <Suspense fallback="Loading">
          <Wait />
        </Suspense>
      </div>,
      {
        onCompleteAll() {
          isComplete = true;
        },
      },
    );
    await jest.runAllTimers();
    expect(isComplete).toBe(false);
    // Resolve the loading.
    hasLoaded = true;
    await resolve();

    await jest.runAllTimers();

    expect(isComplete).toBe(true);

    const result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(
      `"<div><!--$-->Done<!-- --><!--/$--></div>"`,
    );
  });

  // @gate experimental
  it('should reject the promise when an error is thrown at the root', async () => {
    const reportedErrors = [];
    let caughtError = null;
    try {
      await ReactDOMFizzServer.renderToReadableStream(
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
      await ReactDOMFizzServer.renderToReadableStream(
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
    const stream = await ReactDOMFizzServer.renderToReadableStream(
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

    const result = await readResult(stream);
    expect(result).toContain('Loading');
    expect(reportedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should be able to complete by aborting even if the promise never resolves', async () => {
    const controller = new AbortController();
    const stream = await ReactDOMFizzServer.renderToReadableStream(
      <div>
        <Suspense fallback={<div>Loading</div>}>
          <InfiniteSuspend />
        </Suspense>
      </div>,
      {signal: controller.signal},
    );

    controller.abort();

    const result = await readResult(stream);
    expect(result).toContain('Loading');
  });
});
