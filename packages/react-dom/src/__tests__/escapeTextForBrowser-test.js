/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMServer;

describe('escapeTextForBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMServer = require('react-dom/server');
  });

  it('ampersand is escaped when passed as text content', () => {
    const response = ReactDOMServer.renderToString(<span>{'&'}</span>);
    expect(response).toMatch('<span data-reactroot="">&amp;</span>');
  });

  it('double quote is escaped when passed as text content', () => {
    const response = ReactDOMServer.renderToString(<span>{'"'}</span>);
    expect(response).toMatch('<span data-reactroot="">&quot;</span>');
  });

  it('single quote is escaped when passed as text content', () => {
    const response = ReactDOMServer.renderToString(<span>{"'"}</span>);
    expect(response).toMatch('<span data-reactroot="">&#x27;</span>');
  });

  it('greater than entity is escaped when passed as text content', () => {
    const response = ReactDOMServer.renderToString(<span>{'>'}</span>);
    expect(response).toMatch('<span data-reactroot="">&gt;</span>');
  });

  it('lower than entity is escaped when passed as text content', () => {
    const response = ReactDOMServer.renderToString(<span>{'<'}</span>);
    expect(response).toMatch('<span data-reactroot="">&lt;</span>');
  });

  it('number is correctly passed as text content', () => {
    const response = ReactDOMServer.renderToString(<span>{42}</span>);
    expect(response).toMatch('<span data-reactroot="">42</span>');
  });

  it('number is escaped to string when passed as text content', () => {
    const response = ReactDOMServer.renderToString(<img data-attr={42} />);
    expect(response).toMatch('<img data-attr="42" data-reactroot=""/>');
  });

  it('escape text content representing a script tag', () => {
    const response = ReactDOMServer.renderToString(
      <span>{'<script type=\'\' src=""></script>'}</span>,
    );
    expect(response).toMatch(
      '<span data-reactroot="">&lt;script type=&#x27;&#x27; ' +
        'src=&quot;&quot;&gt;&lt;/script&gt;</span>',
    );
  });
});
