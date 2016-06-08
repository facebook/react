/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var setInnerHTML = require('setInnerHTML');

describe('setInnerHTML', function() {
  describe('when the node has innerHTML property', () => {
    it('sets innerHTML on it', function() {
      var node = document.createElement('div');
      var html = '<h1>hello</h1>';
      setInnerHTML(node, html);
      expect(node.innerHTML).toBe(html);
    });
  });

  // SVGElements on IE don't have innerHTML
  describe('when the node does not innerHTML property', () => {
    it('sets innerHTML on it', function() {
      // Create a mock node that lacks innerHTML
      var node = { appendChild: jasmine.createSpy() };

      var html = '<circle></circle><rect></rect>';
      setInnerHTML(node, html);

      expect(node.appendChild.calls.argsFor(0)[0].outerHTML).toBe('<circle></circle>');
      expect(node.appendChild.calls.argsFor(1)[0].outerHTML).toBe('<rect></rect>');
    });
  });
});
