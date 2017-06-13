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
