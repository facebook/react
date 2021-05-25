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
      ReactDOMFizzServer = require('react-dom/unstable-fizz.browser');
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
    const stream = ReactDOMFizzServer.renderToReadableStream(
      <div>hello world</div>,
    );
    const result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(`"<div>hello world</div>"`);
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
    const stream = ReactDOMFizzServer.renderToReadableStream(
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
  it('should error the stream when an error is thrown at the root', async () => {
    const reportedErrors = [];
    const stream = ReactDOMFizzServer.renderToReadableStream(
      <div>
        <Throw />
      </div>,
      {
        onError(x) {
          reportedErrors.push(x);
        },
      },
    );

    let caughtError = null;
    let result = '';
    try {
      result = await readResult(stream);
    } catch (x) {
      caughtError = x;
    }
    expect(caughtError).toBe(theError);
    expect(result).toBe('');
    expect(reportedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should error the stream when an error is thrown inside a fallback', async () => {
    const reportedErrors = [];
    const stream = ReactDOMFizzServer.renderToReadableStream(
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

    let caughtError = null;
    let result = '';
    try {
      result = await readResult(stream);
    } catch (x) {
      caughtError = x;
    }
    expect(caughtError).toBe(theError);
    expect(result).toBe('');
    expect(reportedErrors).toEqual([theError]);
  });

  // @gate experimental
  it('should not error the stream when an error is thrown inside suspense boundary', async () => {
    const reportedErrors = [];
    const stream = ReactDOMFizzServer.renderToReadableStream(
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
    const stream = ReactDOMFizzServer.renderToReadableStream(
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
