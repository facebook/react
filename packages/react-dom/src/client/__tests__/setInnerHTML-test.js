/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

describe('dangerouslySetInnerHTML', () => {
  describe('when the node has innerHTML property', () => {
    it('sets innerHTML on it', () => {
      const container = document.createElement('div');
      const component = ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: '<h1>Hello</h1>'}} />,
        container,
      );
      expect(component.innerHTML).toBe('<h1>Hello</h1>');
    });
  });

  describe('when the node does not have an innerHTML property', () => {
    let node;
    beforeEach(() => {
      // Create a mock node that looks like an g in IE (without innerHTML)
      node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      spyOn(node, 'appendChild').and.callThrough();
      spyOn(node, 'removeChild').and.callThrough();
    });

    it('sets innerHTML on it', () => {
      const html = '<circle></circle>';

      ReactDOM.render(<g dangerouslySetInnerHTML={{__html: html}} />, node);

      expect(node.appendChild.calls.argsFor(0)[0].innerHTML).toBe(
        '<circle></circle>',
      );
    });

    it('clears previous children', () => {
      const firstHtml = '<rect></rect>';
      const secondHtml = '<circle></circle>';

      let component = ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: firstHtml}} />,
        node,
      );
      ReactDOM.unmountComponentAtNode(
        ReactDOM.findDOMNode(component).parentNode,
      );
      component = ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: secondHtml}} />,
        node,
      );

      expect(node.removeChild.calls.argsFor(0)[0].innerHTML).toBe(
        '<rect></rect>',
      );
      expect(node.appendChild.calls.argsFor(1)[0].innerHTML).toBe(
        '<circle></circle>',
      );
    });
  });
});
