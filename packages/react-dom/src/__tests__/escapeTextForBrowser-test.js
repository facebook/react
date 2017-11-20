/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var ExecutionEnvironment;
var React;
var ReactDOMServer;

var ROOT_ATTRIBUTE_NAME;

describe('escapeTextForBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');

    ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment');
    ExecutionEnvironment.canUseDOM = false;
    ReactDOMServer = require('react-dom/server');

    var DOMProperty = require('../shared/DOMProperty');
    ROOT_ATTRIBUTE_NAME = DOMProperty.ROOT_ATTRIBUTE_NAME;
  });

  it('ampersand is escaped when passed as text content', () => {
    var response = ReactDOMServer.renderToString(<span>{'&'}</span>);
    expect(response).toMatch(
      new RegExp('<span ' + ROOT_ATTRIBUTE_NAME + '="">&amp;</span>'),
    );
  });

  it('double quote is escaped when passed as text content', () => {
    var response = ReactDOMServer.renderToString(<span>{'"'}</span>);
    expect(response).toMatch(
      new RegExp('<span ' + ROOT_ATTRIBUTE_NAME + '="">&quot;</span>'),
    );
  });

  it('single quote is escaped when passed as text content', () => {
    var response = ReactDOMServer.renderToString(<span>{"'"}</span>);
    expect(response).toMatch(
      new RegExp('<span ' + ROOT_ATTRIBUTE_NAME + '="">&#x27;</span>'),
    );
  });

  it('greater than entity is escaped when passed as text content', () => {
    var response = ReactDOMServer.renderToString(<span>{'>'}</span>);
    expect(response).toMatch(
      new RegExp('<span ' + ROOT_ATTRIBUTE_NAME + '="">&gt;</span>'),
    );
  });

  it('lower than entity is escaped when passed as text content', () => {
    var response = ReactDOMServer.renderToString(<span>{'<'}</span>);
    expect(response).toMatch(
      new RegExp('<span ' + ROOT_ATTRIBUTE_NAME + '="">&lt;</span>'),
    );
  });

  it('number is correctly passed as text content', () => {
    var response = ReactDOMServer.renderToString(<span>{42}</span>);
    expect(response).toMatch(
      new RegExp('<span ' + ROOT_ATTRIBUTE_NAME + '="">42</span>'),
    );
  });

  it('number is escaped to string when passed as text content', () => {
    var response = ReactDOMServer.renderToString(<img data-attr={42} />);
    expect(response).toMatch(
      new RegExp('<img data-attr="42" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>'),
    );
  });

  it('escape text content representing a script tag', () => {
    var response = ReactDOMServer.renderToString(
      <span>{'<script type=\'\' src=""></script>'}</span>,
    );
    expect(response).toMatch(
      new RegExp(
        '<span ' +
          ROOT_ATTRIBUTE_NAME +
          '="">&lt;script type=&#x27;&#x27; src=&quot;&quot;&gt;&lt;/script&gt;</span>',
      ),
    );
  });
});
