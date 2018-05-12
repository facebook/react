/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMMeta', () => {
  let React;
  let ReactDOM;
  let ReactDOMServer;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
  });

  it('should render charSet', () => {
    const container = document.createElement('head');
    const node = ReactDOM.render(<meta charSet="utf-8" />, container);
    expect(node.getAttribute('charset')).toBe('utf-8');
  });

  it('should render charSet for SSR', () => {
    const markup = ReactDOMServer.renderToString(<meta charSet="utf-8" />);
    expect(markup).toBe('<meta charset="utf-8" data-reactroot=""/>');
  });
});
