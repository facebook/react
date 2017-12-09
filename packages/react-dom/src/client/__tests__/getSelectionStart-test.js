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

describe('getSelectionText', () => {
  describe('when the node is a text area', () => {
    it('has a value for selectionStart', () => {
      const container = document.createElement('div');
      ReactDOM.render(<textarea />, container);

      expect(container.firstChild.selectionStart).not.toBeUndefined();
    });
  });

  describe('when the node is an input', () => {
    it('has a value for selectionStart', () => {
      const container = document.createElement('div');
      ReactDOM.render(<input />, container);

      expect(container.firstChild.selectionStart).not.toBeUndefined();
    });
  });

  describe('when the node is a content editable div', () => {
    it('has an undefined value for selectionStart', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div />, container);
      container.firstChild.contentEditable = true;

      expect(container.firstChild.contentEditable).toBeTruthy();
      expect(container.firstChild.selectionStart).toBeUndefined();
    });
  });
});
