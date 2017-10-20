/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// TODO: can we express this test with only public API?
var setInnerHTML = require('setInnerHTML');
var Namespaces = require('DOMNamespaces').Namespaces;

describe('setInnerHTML', () => {
  describe('when the node has innerHTML property', () => {
    it('sets innerHTML on it', () => {
      var node = document.createElement('div');
      var html = '<h1>hello</h1>';
      setInnerHTML(node, html);
      expect(node.innerHTML).toBe(html);
    });
  });

  describe('when the node does not have an innerHTML property', () => {
    var node;
    var nodeProxy;
    beforeEach(() => {
      // Create a mock node that looks like an SVG in IE (without innerHTML)
      node = document.createElementNS(Namespaces.svg, 'svg');

      nodeProxy = new Proxy(node, {
        has: (target, prop) => {
          return prop === 'innerHTML' ? false : prop in target;
        },
      });

      spyOn(node, 'appendChild').and.callThrough();
      spyOn(node, 'removeChild').and.callThrough();
    });

    it('sets innerHTML on it', () => {
      var html = '<circle></circle><rect></rect>';
      setInnerHTML(nodeProxy, html);

      expect(node.appendChild.calls.argsFor(0)[0].outerHTML).toBe(
        '<circle></circle>',
      );
      expect(node.appendChild.calls.argsFor(1)[0].outerHTML).toBe(
        '<rect></rect>',
      );
    });

    it('clears previous children', () => {
      var firstHtml = '<rect></rect>';
      var secondHtml = '<circle></circle>';
      setInnerHTML(nodeProxy, firstHtml);

      setInnerHTML(nodeProxy, secondHtml);

      expect(node.removeChild.calls.argsFor(0)[0].outerHTML).toBe(
        '<rect></rect>',
      );
      expect(node.innerHTML).toBe('<circle></circle>');
    });
  });
});
