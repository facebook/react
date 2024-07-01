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
  });
});
