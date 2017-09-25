/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOMServer;

describe('ReactDOMSVG', () => {
  beforeEach(() => {
    React = require('React');
    ReactDOMServer = require('ReactDOMServer');
  });

  it('creates initial namespaced markup', () => {
    var markup = ReactDOMServer.renderToString(
      <svg>
        <image xlinkHref="http://i.imgur.com/w7GCRPb.png" />
      </svg>,
    );
    expect(markup).toContain('xlink:href="http://i.imgur.com/w7GCRPb.png"');
  });
});
