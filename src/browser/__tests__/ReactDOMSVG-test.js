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

var SVGDOMNamespaces = {
  xlink: 'http://www.w3.org/1999/xlink',
  xml: 'http://www.w3.org/XML/1998/namespace',
  xmlns: 'http://www.w3.org/2000/xmlns/'
};

describe('ReactDOMSVG', function() {
  it("allows a SVG element", function() {
    var element = React.createElement('svg', {xmlnsXlink: 'http://www.w3.org/1999/xlink'});
    var instance = ReactTestUtils.renderIntoDocument(element);
    var svg = React.findDOMNode(instance);
    expect(svg.tagName).toBe('svg');
    var xlink = svg.getAttributeNS(SVGDOMNamespaces.xmlns, 'xlink');
    expect(xlink).toBe('http://www.w3.org/1999/xlink');
  });

  it("allows a SVG element with an image node", function() {
    var instance = ReactTestUtils.renderIntoDocument(
      <svg xmlnsXlink='http://www.w3.org/1999/xlink'>
        <image xlinkHref="http://i.imgur.com/w7GCRPb.png" />
      </svg>
    );
    var svg = React.findDOMNode(instance);
    var image = svg.childNodes[0];
    expect(image.tagName).toBe('image');
    var href = image.getAttributeNS(SVGDOMNamespaces.xlink, 'href');
    expect(href).toBe('http://i.imgur.com/w7GCRPb.png');
  });

  it("allows a SVG element with a link", function() {
    var instance = ReactTestUtils.renderIntoDocument(
      <svg xmlnsXlink='http://www.w3.org/1999/xlink'>
        <g>
            <a 
              xlinkHref="http://facebook.github.io/react/"
              xlinkActuate="onRequest"
              xlinkShow="new"
              xlinkArcrole="http://example.com/iri-arcrole-reference.svg"
              xlinkRole="http://example.com/iri-role-reference.svg"
              xlinkTitle="React"
              xlinkType="simple"
              > 
              <text xmlLang="en-US" xmlSpace="preserve" x="0" y="15" fill="black">React</text>
            </a>
        </g> 
      </svg>
    );
    var svg = React.findDOMNode(instance);
    var link = svg.childNodes[0].childNodes[0];
    expect(link.tagName).toBe('a');
    var href = link.getAttributeNS(SVGDOMNamespaces.xlink, 'href');
    expect(href).toBe('http://facebook.github.io/react/');
    var actuate = link.getAttributeNS(SVGDOMNamespaces.xlink, 'actuate');
    expect(actuate).toBe('onRequest');
    var show = link.getAttributeNS(SVGDOMNamespaces.xlink, 'show');
    expect(show).toBe('new');
    var arcrole = link.getAttributeNS(SVGDOMNamespaces.xlink, 'arcrole');
    expect(arcrole).toBe('http://example.com/iri-arcrole-reference.svg');
    var role = link.getAttributeNS(SVGDOMNamespaces.xlink, 'role');
    expect(role).toBe('http://example.com/iri-role-reference.svg');
    var title = link.getAttributeNS(SVGDOMNamespaces.xlink, 'title');
    expect(title).toBe('React');
    var type = link.getAttributeNS(SVGDOMNamespaces.xlink, 'type');
    expect(type).toBe('simple');
    var text = link.childNodes[0];
    var lang = text.getAttributeNS(SVGDOMNamespaces.xml, 'lang');
    expect(lang).toBe('en-US');
    var space = text.getAttributeNS(SVGDOMNamespaces.xml, 'space');
    expect(space).toBe('preserve');
  });

});