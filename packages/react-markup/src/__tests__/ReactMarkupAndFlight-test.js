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

    it('shares cache between RSC renderers', async () => {
      let n = 0;
      const random = ReactServer.cache(() => n++);

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

      const model = <Preview />;
      const transport = ReactNoopFlightServer.render(model);

      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <p>RSC A: 0</p>
          <p>RSC B: 0</p>
        </>,
      );
    });

    it('shows correct stacks in nested RSC renderers', async () => {
      const thrownError = new Error('hi');
      function Throw() {
        throw thrownError;
      }

      const caughtErrors = [];
      async function Preview() {
        try {
          await ReactMarkup.experimental_renderToHTML(<Throw />, {
            onError: (error, errorInfo) => {
              caughtErrors.push({
                error: error,
                parentStack: errorInfo.componentStack,
                ownerStack: React.captureOwnerStack
                  ? React.captureOwnerStack()
                  : null,
              });
            },
          });
        } catch (error) {
          return 'did error';
        }
      }

      const model = <Preview />;
      const transport = ReactNoopFlightServer.render(model);

      await act(async () => {
        ReactNoop.render(await ReactNoopFlightClient.read(transport));
      });

      expect(ReactNoop).toMatchRenderedOutput('did error');
      expect(caughtErrors).toEqual([
        {
          error: thrownError,
          // FIXME: This is not the correct stack
          ownerStack: null,
          parentStack: undefined,
        },
      ]);
    });
  });
}
