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
    // Disabled. JSDOM doesn't seem to remove nodes when using appendChild to
    // move existing nodes.
    xit('sets innerHTML on it', () => {
      // Create a mock node that looks like an SVG in IE (without innerHTML)
      var node = {
        namespaceURI: Namespaces.svg,
        appendChild: jasmine.createSpy(),
      };

      var html = '<circle></circle><rect></rect>';
      setInnerHTML(node, html);

      expect(node.appendChild.calls.argsFor(0)[0].outerHTML).toBe(
        '<circle></circle>',
      );
      expect(node.appendChild.calls.argsFor(1)[0].outerHTML).toBe(
        '<rect></rect>',
      );
    });
  });
});
