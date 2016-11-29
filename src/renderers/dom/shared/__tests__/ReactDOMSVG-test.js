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

  it('creates elements with SVG namespace inside SVG tag during mount', () => {
    var node = document.createElement('div');
    var div, foreignDiv, foreignObject, g, image, image2, p, svg;
    ReactDOM.render(
      <div>
        <svg ref={el => svg = el}>
          <g ref={el => g = el} strokeWidth="5">
            <image ref={el => image = el} xlinkHref="http://i.imgur.com/w7GCRPb.png" />
            <foreignObject ref={el => foreignObject = el}>
              <div ref={el => foreignDiv = el} />
            </foreignObject>
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
    // SVG tagName is case sensitive.
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.tagName).toBe('svg');
    expect(g.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(g.tagName).toBe('g');
    expect(g.getAttribute('stroke-width')).toBe('5');
    expect(image.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(image.tagName).toBe('image');
    expect(
      image.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    ).toBe('http://i.imgur.com/w7GCRPb.png');
    expect(foreignObject.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(foreignObject.tagName).toBe('foreignObject');
    expect(image2.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(image2.tagName).toBe('image');
    expect(
      image2.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    ).toBe('http://i.imgur.com/w7GCRPb.png');
    // DOM tagName is capitalized by browsers.
    expect(p.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(p.tagName).toBe('P');
    expect(div.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(div.tagName).toBe('DIV');
    expect(foreignDiv.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(foreignDiv.tagName).toBe('DIV');
  });

  it('creates elements with SVG namespace inside SVG tag during update', () => {
    var inst, foreignObject, foreignDiv, g, image, svg;

    class App extends React.Component {
      state = {step: 0};
      render() {
        inst = this;
        const {step} = this.state;
        if (step === 0) {
          return null;
        }
        return (
          <g ref={el => g = el} strokeWidth="5">
            <image ref={el => image = el} xlinkHref="http://i.imgur.com/w7GCRPb.png" />
            <foreignObject ref={el => foreignObject = el}>
              <div ref={el => foreignDiv = el} />
            </foreignObject>
          </g>
        );
      }
    }

    var node = document.createElement('div');
    ReactDOM.render(
      <svg ref={el => svg = el}>
        <App />
      </svg>,
      node
    );
    inst.setState({step: 1});

    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.tagName).toBe('svg');
    expect(g.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(g.tagName).toBe('g');
    expect(g.getAttribute('stroke-width')).toBe('5');
    expect(image.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(image.tagName).toBe('image');
    expect(
      image.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    ).toBe('http://i.imgur.com/w7GCRPb.png');
    expect(foreignObject.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(foreignObject.tagName).toBe('foreignObject');
    expect(foreignDiv.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(foreignDiv.tagName).toBe('DIV');
  });

});
