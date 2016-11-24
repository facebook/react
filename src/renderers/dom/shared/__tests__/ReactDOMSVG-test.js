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
var ReactDOM;
var ReactDOMServer;

describe('ReactDOMSVG', () => {

  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMServer = require('ReactDOMServer');
  });

  it('creates initial namespaced markup', () => {
    var markup = ReactDOMServer.renderToString(
      <svg>
        <image xlinkHref="http://i.imgur.com/w7GCRPb.png" />
      </svg>
    );
    expect(markup).toContain('xlink:href="http://i.imgur.com/w7GCRPb.png"');
  });

  it('creates elements with svg namespace inside svg tag', () => {
    var node = document.createElement('div');
    var div, foreignDiv, g, image, image2, p;
    ReactDOM.render(
      <div>
        <svg>
          <g ref={el => g = el} strokeWidth="5">
            <image ref={el => image = el} xlinkHref="http://i.imgur.com/w7GCRPb.png" />
            <foreignobject>
              <div ref={el => foreignDiv = el} />
            </foreignobject>
          </g>
        </svg>
        <p ref={el => p = el}>
          <svg>
            <image ref={el => image2 = el} xlinkHref="http://i.imgur.com/w7GCRPb.png" />
          </svg>
        </p>
        <div ref={el => div = el} />
      </div>,
      node
    );
    expect(g.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(g.getAttribute('stroke-width')).toBe('5');
    expect(image.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(
      image.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    ).toBe('http://i.imgur.com/w7GCRPb.png');
    expect(image2.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(
      image2.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    ).toBe('http://i.imgur.com/w7GCRPb.png');
    expect(p.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(div.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(foreignDiv.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
  });

});
