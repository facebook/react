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

let React;
let ReactDOMFizzServer;
let Suspense;

describe('ReactDOMFizzServerBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMFizzServer = require('react-dom/server.browser');
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

  it('should call renderToReadableStream', async () => {
    const stream = await ReactDOMFizzServer.renderToReadableStream(
      <div>hello world</div>,
    );
    const result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(`"<div>hello world</div>"`);
  });

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
    );

    stream.allReady.then(() => (isComplete = true));

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

  it('should be able to complete by aborting even if the promise never resolves', async () => {
    const errors = [];
    const controller = new AbortController();
    const stream = await ReactDOMFizzServer.renderToReadableStream(
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

    controller.abort();

    const result = await readResult(stream);
    expect(result).toContain('Loading');

    expect(errors).toEqual([
      'The render was aborted by the server without a reason.',
    ]);
  });

  it('should reject if aborting before the shell is complete', async () => {
    const errors = [];
    const controller = new AbortController();
    const promise = ReactDOMFizzServer.renderToReadableStream(
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
    // @TODO this is a hack to work around lack of support for abortSignal.reason in node
    // The abort call itself should set this property but since we are testing in node we
    // set it here manually
    controller.signal.reason = theReason;
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
    const streamPromise = ReactDOMFizzServer.renderToReadableStream(
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
    expect(caughtError.message).toBe(
      'The render was aborted by the server without a reason.',
    );
    expect(errors).toEqual([
      'The render was aborted by the server without a reason.',
    ]);
  });

  it('should reject if passing an already aborted signal', async () => {
    const errors = [];
    const controller = new AbortController();
    const theReason = new Error('aborted for reasons');
    // @TODO this is a hack to work around lack of support for abortSignal.reason in node
    // The abort call itself should set this property but since we are testing in node we
    // set it here manually
    controller.signal.reason = theReason;
    controller.abort(theReason);

    const promise = ReactDOMFizzServer.renderToReadableStream(
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

  it('should not continue rendering after the reader cancels', async () => {
    let hasLoaded = false;
    let resolve;
    let isComplete = false;
    let rendered = false;
    const promise = new Promise(r => (resolve = r));
    function Wait() {
      if (!hasLoaded) {
        throw promise;
      }
      rendered = true;
      return 'Done';
    }
    const errors = [];
    const stream = await ReactDOMFizzServer.renderToReadableStream(
      <div>
        <Suspense fallback={<div>Loading</div>}>
          <Wait />
        </Suspense>
      </div>,
      {
        onError(x) {
          errors.push(x.message);
        },
      },
    );

    stream.allReady.then(() => (isComplete = true));

    expect(rendered).toBe(false);
    expect(isComplete).toBe(false);

    const reader = stream.getReader();
    reader.cancel();

    expect(errors).toEqual([
      'The render was aborted by the server without a reason.',
    ]);

    hasLoaded = true;
    resolve();

    await jest.runAllTimers();

    expect(rendered).toBe(false);
    expect(isComplete).toBe(true);
  });

  it('should stream large contents that might overlow individual buffers', async () => {
    const str492 = `(492) This string is intentionally 492 bytes long because we want to make sure we process chunks that will overflow buffer boundaries. It will repeat to fill out the bytes required (inclusive of this prompt):: foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux q :: total count (492)`;
    const str2049 = `(2049) This string is intentionally 2049 bytes long because we want to make sure we process chunks that will overflow buffer boundaries. It will repeat to fill out the bytes required (inclusive of this prompt):: foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy thud foo bar qux quux corge grault garply waldo fred plugh xyzzy  :: total count (2049)`;

    // this specific layout is somewhat contrived to exercise the landing on
    // an exact view boundary. it's not critical to test this edge case but
    // since we are setting up a test in general for larger chunks I contrived it
    // as such for now. I don't think it needs to be maintained if in the future
    // the view sizes change or become dynamic becasue of the use of byobRequest
    let stream;
    stream = await ReactDOMFizzServer.renderToReadableStream(
      <>
        <div>
          <span>{''}</span>
        </div>
        <div>{str492}</div>
        <div>{str492}</div>
      </>,
    );

    let result;
    result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(
      `"<div><span></span></div><div>${str492}</div><div>${str492}</div>"`,
    );

    // this size 2049 was chosen to be a couple base 2 orders larger than the current view
    // size. if the size changes in the future hopefully this will still exercise
    // a chunk that is too large for the view size.
    stream = await ReactDOMFizzServer.renderToReadableStream(
      <>
        <div>{str2049}</div>
      </>,
    );

    result = await readResult(stream);
    expect(result).toMatchInlineSnapshot(`"<div>${str2049}</div>"`);
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
    await ReactDOMFizzServer.renderToReadableStream(<App />, {
      signal: controller.signal,
      onError(x) {
        errors.push(x);
        return 'a digest';
      },
    });

    // @TODO this is a hack to work around lack of support for abortSignal.reason in node
    // The abort call itself should set this property but since we are testing in node we
    // set it here manually
    controller.signal.reason = 'foobar';
    controller.abort('foobar');

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
    await ReactDOMFizzServer.renderToReadableStream(<App />, {
      signal: controller.signal,
      onError(x) {
        errors.push(x.message);
        return 'a digest';
      },
    });

    // @TODO this is a hack to work around lack of support for abortSignal.reason in node
    // The abort call itself should set this property but since we are testing in node we
    // set it here manually
    controller.signal.reason = new Error('uh oh');
    controller.abort(new Error('uh oh'));

    expect(errors).toEqual(['uh oh', 'uh oh']);
  });
});
