/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
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
      'ReactDOMServer.renderToNodeStream(): The streaming API is not available ' +
        'in the browser. Use ReactDOMServer.renderToString() instead.',
    );
    expect(() =>
      ReactDOMServerBrowser.renderToStaticNodeStream(<div />),
    ).toThrow(
      'ReactDOMServer.renderToStaticNodeStream(): The streaming API is not available ' +
        'in the browser. Use ReactDOMServer.renderToStaticMarkup() instead.',
    );
  });
});
