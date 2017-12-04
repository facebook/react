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
    let innerHTMLDescriptor;

    // In some versions of IE (TODO: which ones?) SVG nodes don't have
    // innerHTML. To simulate this, we will take it off the Element prototype
    // and put it onto the HTMLDivElement prototype. We expect that the logic
    // checks for existence of innerHTML on SVG, and if one doesn't exist, falls
    // back to using appendChild and removeChild.

    beforeEach(() => {
      innerHTMLDescriptor = Object.getOwnPropertyDescriptor(
        Element.prototype,
        'innerHTML',
      );
      delete Element.prototype.innerHTML;
      Object.defineProperty(
        HTMLDivElement.prototype,
        'innerHTML',
        innerHTMLDescriptor,
      );
    });

    afterEach(() => {
      delete HTMLDivElement.prototype.innerHTML;
      Object.defineProperty(
        Element.prototype,
        'innerHTML',
        innerHTMLDescriptor,
      );
    });

    it('sets innerHTML on it', () => {
      const html = '<circle></circle>';
      const container = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: html}} />,
        container,
      );
      const circle = container.firstChild.firstChild;
      expect(circle.tagName).toBe('circle');
    });

    it('clears previous children', () => {
      const firstHtml = '<rect></rect>';
      const secondHtml = '<circle></circle>';

      const container = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: firstHtml}} />,
        container,
      );
      const rect = container.firstChild.firstChild;
      expect(rect.tagName).toBe('rect');
      ReactDOM.render(
        <g dangerouslySetInnerHTML={{__html: secondHtml}} />,
        container,
      );
      const circle = container.firstChild.firstChild;
      expect(circle.tagName).toBe('circle');
    });
  });
});
