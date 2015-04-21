/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

/*jslint evil: true */

'use strict';

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');

describe('ReactDOMSVG', function() {
  it("allows a SVG element", function() {
    var element = React.createElement('svg', {xmlnsXlink: 'http://www.w3.org/1999/xlink'});
    var instance = ReactTestUtils.renderIntoDocument(element);
    var result = React.findDOMNode(instance);
    expect(result.tagName).toBe('svg');
    expect(result.getAttribute('xmlns:xlink')).toBe('http://www.w3.org/1999/xlink');
  });
  
  it("allows a SVG element with an image node", function() {
    var instance = ReactTestUtils.renderIntoDocument(
      <svg xmlnsXlink='http://www.w3.org/1999/xlink'>
        <image xlinkHref="http://i.imgur.com/w7GCRPb.png" />
      </svg>
    );
    var svg = React.findDOMNode(instance);
    expect(svg.tagName).toBe('svg');
    expect(svg.getAttribute('xmlns:xlink')).toBe('http://www.w3.org/1999/xlink');
    var image = svg.childNodes[0];
    expect(image.tagName).toBe('image');
    expect(image.getAttribute('xlink:href')).toBe('http://i.imgur.com/w7GCRPb.png');
  });

});
 
