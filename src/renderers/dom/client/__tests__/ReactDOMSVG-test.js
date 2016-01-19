/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOMServer;

describe('ReactDOMSVG', function() {

  beforeEach(function() {
    React = require('React');
    ReactDOMServer = require('ReactDOMServer');
  });

  it('creates initial markup for known hyphenated attributes', function() {
    var markup = ReactDOMServer.renderToString(
      <svg clip-path="url(#starlet)" />
    );
    expect(markup).toContain('clip-path="url(#starlet)"');
  });

  it('creates initial markup for camel case attributes', function() {
    var markup = ReactDOMServer.renderToString(
      <svg viewBox="0 0 100 100" />
    );
    expect(markup).toContain('viewBox="0 0 100 100"');
  });

  it('deprecates camel casing of hyphenated attributes', function() {
    spyOn(console, 'error');
    var markup = ReactDOMServer.renderToString(
      <svg clipPath="url(#starlet)" />
    );
    expect(markup).toContain('clip-path="url(#starlet)"');
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain('clipPath');
    expect(console.error.argsForCall[0][0]).toContain('clip-path');
  });

  it('creates initial markup for unknown hyphenated attributes', function() {
    var markup = ReactDOMServer.renderToString(
      <svg the-word="the-bird" />
    );
    expect(markup).toContain('the-word="the-bird"');
  });

  it('creates initial markup for unknown camel case attributes', function() {
    var markup = ReactDOMServer.renderToString(
      <svg theWord="theBird" />
    );
    expect(markup).toContain('theWord="theBird"');
  });

  it('creates initial namespaced markup', function() {
    var markup = ReactDOMServer.renderToString(
      <svg>
        <image xlinkHref="http://i.imgur.com/w7GCRPb.png" />
      </svg>
    );
    expect(markup).toContain('xlink:href="http://i.imgur.com/w7GCRPb.png"');
  });

});
