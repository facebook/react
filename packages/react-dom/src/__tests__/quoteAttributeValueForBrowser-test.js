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

describe('quoteAttributeValueForBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');

    ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment');
    ExecutionEnvironment.canUseDOM = false;
    ReactDOMServer = require('react-dom/server');

    var DOMProperty = require('../shared/DOMProperty');
    ROOT_ATTRIBUTE_NAME = DOMProperty.ROOT_ATTRIBUTE_NAME;
  });

  it('ampersand is escaped inside attributes', () => {
    var response = ReactDOMServer.renderToString(<img data-attr="&" />);
    expect(response).toMatch(
      new RegExp(
        '<img data-attr="&amp;" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>',
      ),
    );
  });

  it('double quote is escaped inside attributes', () => {
    var response = ReactDOMServer.renderToString(<img data-attr={'"'} />);
    expect(response).toMatch(
      new RegExp(
        '<img data-attr="&quot;" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>',
      ),
    );
  });

  it('single quote is escaped inside attributes', () => {
    var response = ReactDOMServer.renderToString(<img data-attr="'" />);
    expect(response).toMatch(
      new RegExp(
        '<img data-attr="&#x27;" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>',
      ),
    );
  });

  it('greater than entity is escaped inside attributes', () => {
    var response = ReactDOMServer.renderToString(<img data-attr=">" />);
    expect(response).toMatch(
      new RegExp('<img data-attr="&gt;" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>'),
    );
  });

  it('lower than entity is escaped inside attributes', () => {
    var response = ReactDOMServer.renderToString(<img data-attr="<" />);
    expect(response).toMatch(
      new RegExp('<img data-attr="&lt;" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>'),
    );
  });

  it('number is escaped to string inside attributes', () => {
    var response = ReactDOMServer.renderToString(<img data-attr={42} />);
    expect(response).toMatch(
      new RegExp('<img data-attr="42" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>'),
    );
  });

  it('object is passed to a string inside attributes', () => {
    var sampleObject = {
      toString: function() {
        return 'ponys';
      },
    };

    var response = ReactDOMServer.renderToString(
      <img data-attr={sampleObject} />,
    );
    expect(response).toMatch(
      new RegExp(
        '<img data-attr="ponys" ' + ROOT_ATTRIBUTE_NAME + '=""' + '/>',
      ),
    );
  });

  it('script tag is escaped inside attributes', () => {
    var response = ReactDOMServer.renderToString(
      <img data-attr={'<script type=\'\' src=""></script>'} />,
    );
    expect(response).toMatch(
      new RegExp(
        '<img data-attr="&lt;script type=&#x27;&#x27; src=&quot;&quot;&gt;&lt;/script&gt;" ' +
          ROOT_ATTRIBUTE_NAME +
          '=""/>',
      ),
    );
  });
});
