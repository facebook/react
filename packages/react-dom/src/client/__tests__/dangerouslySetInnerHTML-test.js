/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOMClient = require('react-dom/client');

const act = require('internal-test-utils').act;

describe('dangerouslySetInnerHTML', () => {
  describe('when the node has innerHTML property', () => {
    it('sets innerHTML on it', async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <div dangerouslySetInnerHTML={{__html: '<h1>Hello</h1>'}} />,
        );
      });
      expect(container.firstChild.innerHTML).toBe('<h1>Hello</h1>');
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

    // @gate !disableIEWorkarounds
    it('sets innerHTML on it', async () => {
      const html = '<circle></circle>';
      const container = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<g dangerouslySetInnerHTML={{__html: html}} />);
      });
      const circle = container.firstChild.firstChild;
      expect(circle.tagName).toBe('circle');
    });

    // @gate !disableIEWorkarounds
    it('clears previous children', async () => {
      const firstHtml = '<rect></rect>';
      const secondHtml = '<circle></circle>';

      const container = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<g dangerouslySetInnerHTML={{__html: firstHtml}} />);
      });
      const rect = container.firstChild.firstChild;
      expect(rect.tagName).toBe('rect');
      await act(() => {
        root.render(<g dangerouslySetInnerHTML={{__html: secondHtml}} />);
      });
      const circle = container.firstChild.firstChild;
      expect(circle.tagName).toBe('circle');
    });
  });
});
