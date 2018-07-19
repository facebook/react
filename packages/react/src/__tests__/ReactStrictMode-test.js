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
let ReactDOM;
let ReactDOMServer;

describe('ReactStrictMode', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
  });

  it('should appear in the client component stack', () => {
    function Foo() {
      return <div ariaTypo="" />;
    }

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(
        <React.StrictMode>
          <Foo />
        </React.StrictMode>,
        container,
      );
    }).toWarnDev(
      'Invalid ARIA attribute `ariaTypo`. ' +
        'ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in div (at **)\n' +
        '    in Foo (at **)\n' +
        '    in StrictMode (at **)',
    );
  });

  it('should appear in the SSR component stack', () => {
    function Foo() {
      return <div ariaTypo="" />;
    }

    expect(() => {
      ReactDOMServer.renderToString(
        <React.StrictMode>
          <Foo />
        </React.StrictMode>,
      );
    }).toWarnDev(
      'Invalid ARIA attribute `ariaTypo`. ' +
        'ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in div (at **)\n' +
        '    in Foo (at **)\n' +
        '    in StrictMode (at **)',
    );
  });
});
