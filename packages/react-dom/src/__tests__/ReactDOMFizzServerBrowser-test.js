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
let ReactDOMClient;
let ReactDOMFizzServer;
let Suspense;
let Scheduler;
let JSDOM;
let document;
let container;

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
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

  describe('renderToReadableStream', () => {
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

    // @gate experimental
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
            <Wait /> />
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

    // @gate experimental
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

    // @gate experimental
    it('Supports custom abort reasons with a string', async () => {
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

    // @gate experimental
    it('Supports custom abort reasons with an Error', async () => {
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

  describe('renderToString', () => {
    beforeEach(() => {
      JSDOM = require('jsdom').JSDOM;

      // Test Environment
      const jsdom = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><div id="container">',
        {
          runScripts: 'dangerously',
        },
      );
      document = jsdom.window.document;
      container = document.getElementById('container');
    });

    // @gate experimental
    it('refers users to apis that support Suspense when somethign suspends', () => {
      function App({isClient}) {
        return (
          <div>
            <Suspense fallback={'fallback'}>
              {isClient ? 'resolved' : <InfiniteSuspend />}
            </Suspense>
          </div>
        );
      }
      container.innerHTML = ReactDOMFizzServer.renderToString(
        <App isClient={false} />,
      );

      const errors = [];
      ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
        onRecoverableError(error, errorInfo) {
          errors.push(error.message);
        },
      });

      expect(Scheduler).toFlushAndYield([]);
      expect(errors.length).toBe(1);
      if (__DEV__) {
        expect(errors[0]).toBe(
          'The server did not finish this Suspense boundary: The server used "renderToString" which does not support Suspense. If you intended for this Suspense boundary to render the fallback content on the server consider throwing an Error somewhere within the Suspense boundary. If you intended to have the server wait for the suspended component please switch to "renderToReadableStream" which supports Suspense on the server',
        );
      } else {
        expect(errors[0]).toBe(
          'The server could not finish this Suspense boundary, likely due to ' +
            'an error during server rendering. Switched to client rendering.',
        );
      }
    });
  });
});
