/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactDOMServer;
let ReactDOMServerBrowser;

describe('ReactServerRenderingBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMServer = require('react-dom/server');
    // For extra isolation between what would be two bundles on npm
    jest.resetModuleRegistry();
    ReactDOMServerBrowser = require('react-dom/server.browser');
    // add a Polyfill for ReadableStream API
    const streams = require('web-streams-polyfill/ponyfill');
    global.ReadableStream = streams.ReadableStream;
  });

  it('provides the same top-level API as react-dom/server', () => {
    expect(Object.keys(ReactDOMServerBrowser)).toEqual(
      Object.keys(ReactDOMServer),
    );
  });

  it('returns the same results as react-dom/server', () => {
    class Nice extends React.Component {
      render() {
        return <h2>I am feeling very good today, thanks, how are you?</h2>;
      }
    }
    function Greeting() {
      return (
        <div>
          <h1>How are you?</h1>
          <Nice />
        </div>
      );
    }
    expect(ReactDOMServerBrowser.renderToString(<Greeting />)).toEqual(
      ReactDOMServer.renderToString(<Greeting />),
    );
    expect(ReactDOMServerBrowser.renderToStaticMarkup(<Greeting />)).toEqual(
      ReactDOMServer.renderToStaticMarkup(<Greeting />),
    );
  });

  it('throws meaningfully for server-only APIs', () => {
    expect(() => ReactDOMServerBrowser.renderToNodeStream(<div />)).toThrow(
      'ReactDOMServer.renderToNodeStream(): This streaming API is not available ' +
        'in the browser. Use ReactDOMServer.renderToBrowserStream() instead.',
    );
    expect(() =>
      ReactDOMServerBrowser.renderToStaticNodeStream(<div />),
    ).toThrow(
      'ReactDOMServer.renderToStaticNodeStream(): This streaming API is not available ' +
        'in the browser. Use ReactDOMServer.renderToStaticBrowserStream() instead.',
    );
  });

  describe('renderToBrowserStream', () => {
    it('should generate simple markup', async () => {
      const SuccessfulElement = React.createElement(() => <img />);
      const stream = ReactDOMServerBrowser.renderToBrowserStream(
        SuccessfulElement,
      );
      const reader = stream.getReader();
      const string = (await reader.read()).value;
      expect(string).toMatch(new RegExp('<img data-reactroot=""' + '/>'));
    });

    it('should handle errors correctly', () => {
      const FailingElement = React.createElement(() => {
        throw new Error('An Error');
      });
      const stream = ReactDOMServerBrowser.renderToBrowserStream(
        FailingElement,
      );
      const response = stream.getReader();
      let handleError = false;
      response
        .read()
        .catch(e => {
          handleError = true;
        })
        .finally(() => {
          expect(handleError).toBeTruthy();
        });
    });
  });

  describe('renderToStaticBrowserStream', () => {
    it('should generate simple markup', async () => {
      const SuccessfulElement = React.createElement(() => <img />);
      const stream = ReactDOMServerBrowser.renderToStaticBrowserStream(
        SuccessfulElement,
      );
      const reader = stream.getReader();
      const string = (await reader.read()).value;
      expect(string).toMatch(new RegExp('<img' + '/>'));
    });

    it('should handle errors correctly', () => {
      const FailingElement = React.createElement(() => {
        throw new Error('An Error');
      });
      const stream = ReactDOMServerBrowser.renderToStaticBrowserStream(
        FailingElement,
      );
      const response = stream.getReader();
      let handleError = false;
      response
        .read()
        .catch(e => {
          handleError = true;
        })
        .finally(() => {
          expect(handleError).toBeTruthy();
        });
    });
  });
});
