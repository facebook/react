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
      const node = ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: '<h1>Hello</h1>'}} />,
        container,
      );
      expect(node.innerHTML).toBe('<h1>Hello</h1>');
    });
  });

  describe('when the node does not have an innerHTML property', () => {
    let container;
    beforeEach(() => {
      // Create a mock container that looks like a svg in IE (without innerHTML)
      container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      spyOn(container, 'appendChild').and.callThrough();
      spyOn(container, 'removeChild').and.callThrough();
    });

    it('sets innerHTML on it', () => {
      const html = '<circle></circle>';

      ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: html}} />,
        container,
      );

      expect(container.appendChild.calls.argsFor(0)[0].innerHTML).toBe(
        '<circle></circle>',
      );
    });

    it('clears previous children', () => {
      const firstHtml = '<rect></rect>';
      const secondHtml = '<circle></circle>';

      ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: firstHtml}} />,
        container,
      );
      ReactDOM.unmountComponentAtNode(container);
      ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: secondHtml}} />,
        container,
      );

      expect(container.removeChild.calls.argsFor(0)[0].innerHTML).toBe(
        '<rect></rect>',
      );
      expect(container.appendChild.calls.argsFor(1)[0].innerHTML).toBe(
        '<circle></circle>',
      );
    });
  });
});
