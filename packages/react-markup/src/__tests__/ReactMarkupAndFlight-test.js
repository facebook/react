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

if (typeof Blob === 'undefined') {
  global.Blob = require('buffer').Blob;
}
if (typeof File === 'undefined' || typeof FormData === 'undefined') {
  global.File = require('undici').File;
  global.FormData = require('undici').FormData;
}

let act;
let React;
let ReactServer;
let ReactMarkup;
let ReactNoop;
let ReactNoopFlightServer;
let ReactNoopFlightClient;

function normalizeCodeLocInfo(str) {
  return (
    str &&
    String(str).replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
      return '\n    in ' + name + ' (at **)';
    })
  );
}

if (!__EXPERIMENTAL__) {
  it('should not be built in stable', () => {
    try {
      require('react-markup');
    } catch (x) {
      return;
    }
    throw new Error('Expected react-markup not to exist in stable.');
  });
} else {
  describe('ReactMarkupAndFlight', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.mock('react', () => require('react/react.react-server'));
      ReactServer = require('react');
      ReactNoopFlightServer = require('react-noop-renderer/flight-server');
      // This stores the state so we need to preserve it
      const flightModules = require('react-noop-renderer/flight-modules');
      if (__EXPERIMENTAL__) {
        jest.resetModules();
        jest.mock('react', () => ReactServer);
        jest.mock('react-markup', () =>
          require('react-markup/react-markup.react-server'),
        );
        ReactMarkup = require('react-markup');
      }
      jest.resetModules();
      __unmockReact();
      jest.mock('react-noop-renderer/flight-modules', () => flightModules);
      React = require('react');
      ReactNoop = require('react-noop-renderer');
      ReactNoopFlightClient = require('react-noop-renderer/flight-client');
      act = require('internal-test-utils').act;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('supports using react-markup', async () => {
      async function Preview() {
        const html =
          await ReactMarkup.experimental_renderToHTML('Hello, Dave!');

        return <pre>{html}</pre>;
      }

      const model = <Preview />;
      const transport = ReactNoopFlightServer.render(model);

      await act(async () => {
        // So it throws here with "Cannot read properties of null (reading 'length')"
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(<pre>Hello, Dave!</pre>);
    });

    it('has a cache if the first renderer is used standalone', async () => {
      let n = 0;
      const uncachedFunction = jest.fn(() => {
        return n++;
      });
      const random = ReactServer.cache(uncachedFunction);

      function Random() {
        return random();
      }

      function App() {
        return (
          <>
            <p>
              RSC A_1: <Random />
            </p>
            <p>
              RSC A_2: <Random />
            </p>
          </>
        );
      }

      const model = <App />;
      const transport = ReactNoopFlightServer.render(model);

      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <p>RSC A_1: 0</p>
          <p>RSC A_2: 0</p>
        </>,
      );
      expect(uncachedFunction).toHaveBeenCalledTimes(1);
    });

    it('has a cache if the second renderer is used standalone', async () => {
      let n = 0;
      const uncachedFunction = jest.fn(() => {
        return n++;
      });
      const random = ReactServer.cache(uncachedFunction);

      function Random() {
        return random();
      }

      function App() {
        return (
          <>
            <p>
              RSC B_1: <Random />
            </p>
            <p>
              RSC B_2: <Random />
            </p>
          </>
        );
      }

      const html = await ReactMarkup.experimental_renderToHTML(
        ReactServer.createElement(App),
      );

      expect(html).toEqual('<p>RSC B_1: 0</p><p>RSC B_2: 0</p>');
      expect(uncachedFunction).toHaveBeenCalledTimes(1);
    });

    it('shares cache between RSC renderers', async () => {
      let n = 0;
      const uncachedFunction = jest.fn(() => {
        return n++;
      });
      const random = ReactServer.cache(uncachedFunction);

      function Random() {
        return random();
      }

      async function Preview() {
        const html = await ReactMarkup.experimental_renderToHTML(<Random />);

        return (
          <>
            <p>
              RSC A: <Random />
            </p>
            <p>RSC B: {html}</p>
          </>
        );
      }

      function App() {
        return (
          <>
            <Preview />
            <Preview />
          </>
        );
      }

      const model = <App />;
      const transport = ReactNoopFlightServer.render(model);

      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <p>RSC A: 0</p>
          <p>RSC B: 0</p>
          <p>RSC A: 0</p>
          <p>RSC B: 0</p>
        </>,
      );
      expect(uncachedFunction).toHaveBeenCalledTimes(1);
    });

    it('shows correct stacks in nested RSC renderers', async () => {
      const thrownError = new Error('hi');

      const caughtNestedRendererErrors = [];
      const ownerStacksDuringParentRendererThrow = [];
      const ownerStacksDuringNestedRendererThrow = [];
      function Throw() {
        if (gate(flags => flags.enableOwnerStacks)) {
          const stack = ReactServer.captureOwnerStack();
          ownerStacksDuringNestedRendererThrow.push(
            normalizeCodeLocInfo(stack),
          );
        }
        throw thrownError;
      }

      function Indirection() {
        return ReactServer.createElement(Throw);
      }

      function App() {
        return ReactServer.createElement(Indirection);
      }

      async function Preview() {
        try {
          await ReactMarkup.experimental_renderToHTML(
            ReactServer.createElement(App),
            {
              onError: (error, errorInfo) => {
                caughtNestedRendererErrors.push({
                  error: error,
                  parentStack: errorInfo.componentStack,
                  ownerStack: gate(flags => flags.enableOwnerStacks)
                    ? ReactServer.captureOwnerStack()
                    : null,
                });
              },
            },
          );
        } catch (error) {
          let stack = '';
          if (gate(flags => flags.enableOwnerStacks)) {
            stack = ReactServer.captureOwnerStack();
            ownerStacksDuringParentRendererThrow.push(
              normalizeCodeLocInfo(stack),
            );
          }

          return 'did error';
        }
      }

      function PreviewApp() {
        return ReactServer.createElement(Preview);
      }

      const model = ReactServer.createElement(PreviewApp);
      const transport = ReactNoopFlightServer.render(model);

      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      expect(caughtNestedRendererErrors).toEqual([
        {
          error: thrownError,
          ownerStack:
            __DEV__ && gate(flags => flags.enableOwnerStacks)
              ? // TODO: Shouldn't this read the same as the one we got during render?
                ''
              : null,
          // TODO: Shouldn't a parent stack exist?
          parentStack: undefined,
        },
      ]);
      expect(ownerStacksDuringParentRendererThrow).toEqual(
        gate(flags => flags.enableOwnerStacks)
          ? [
              __DEV__
                ? // TODO: Should have an owner stack
                  ''
                : null,
            ]
          : [],
      );
      expect(ownerStacksDuringNestedRendererThrow).toEqual(
        gate(flags => flags.enableOwnerStacks)
          ? [
              __DEV__
                ? '\n' +
                  //
                  '    in Indirection (at **)\n' +
                  '    in App (at **)'
                : null,
            ]
          : [],
      );
    });
  });
}
