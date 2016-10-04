/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactInputSelection', () => {
  var React;
  var ReactDOM;
  var ReactTestUtils;
  var ReactInputSelection;
  var textValue = 'the text contents';
  var createAndMountElement = (type, props, children) => {
    var element = React.createElement(type, props, children);
    var instance = ReactTestUtils.renderIntoDocument(element);
    return ReactDOM.findDOMNode(instance);
  };

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
    ReactInputSelection = require('ReactInputSelection');
  });

  describe('hasSelectionCapabilities', () => {
    it('returns true for textareas', () => {
      var textarea = document.createElement('textarea');
      expect(ReactInputSelection.hasSelectionCapabilities(textarea)).toBe(true);
    });

    it('returns true for text inputs', () => {
      var inputText = document.createElement('input');
      var inputReadOnly = document.createElement('input');
      inputReadOnly.readOnly = 'true';
      var inputNumber = document.createElement('input');
      inputNumber.type = 'number';
      var inputEmail = document.createElement('input');
      inputEmail.type = 'email';
      var inputPassword = document.createElement('input');
      inputPassword.type = 'password';
      var inputHidden = document.createElement('input');
      inputHidden.type = 'hidden';

      expect(ReactInputSelection.hasSelectionCapabilities(inputText)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(inputReadOnly)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(inputNumber)).toBe(false);
      expect(ReactInputSelection.hasSelectionCapabilities(inputEmail)).toBe(false);
      expect(ReactInputSelection.hasSelectionCapabilities(inputPassword)).toBe(false);
      expect(ReactInputSelection.hasSelectionCapabilities(inputHidden)).toBe(false);
    });

    it('returns true for contentEditable elements', () => {
      var div = document.createElement('div');
      div.contentEditable = 'true';
      var body = document.createElement('body');
      body.contentEditable = 'true';
      var input = document.createElement('input');
      input.contentEditable = 'true';
      var select = document.createElement('select');
      select.contentEditable = 'true';

      expect(ReactInputSelection.hasSelectionCapabilities(div)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(body)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(input)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(select)).toBe(true);
    });

    it('returns false for any other type of HTMLElement', () => {
      var select = document.createElement('select');
      var iframe = document.createElement('iframe');

      expect(ReactInputSelection.hasSelectionCapabilities(select)).toBe(false);
      expect(ReactInputSelection.hasSelectionCapabilities(iframe)).toBe(false);
    });
  });

  describe('getSelection', () => {
    it('gets selection offsets from a textarea or input', () => {
      var input = createAndMountElement('input', {defaultValue: textValue});
      input.setSelectionRange(6, 11);
      expect(ReactInputSelection.getSelection(input)).toEqual({start: 6, end: 11});

      var textarea = createAndMountElement('textarea', {defaultValue: textValue});
      textarea.setSelectionRange(6, 11);
      expect(ReactInputSelection.getSelection(textarea)).toEqual({start: 6, end: 11});
    });

    it('gets selection offsets from a contentEditable element', () => {
      var node = createAndMountElement('div', null, textValue);
      node.selectionStart = 6;
      node.selectionEnd = 11;
      expect(ReactInputSelection.getSelection(node)).toEqual({start: 6, end: 11});
    });

    it('gets selection offsets as start: 0, end: 0 if no selection', () => {
      var node = createAndMountElement('select');
      expect(ReactInputSelection.getSelection(node)).toEqual({start: 0, end: 0});
    });

    it('gets selection on inputs in iframes', () => {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const input = document.createElement('input');
      input.value = textValue;
      iframe.contentDocument.body.appendChild(input);
      input.select();
      expect(input.selectionStart).toEqual(0);
      expect(input.selectionEnd).toEqual(textValue.length);

      document.body.removeChild(iframe);
    });
  });

  describe('setSelection', () => {
    it('sets selection offsets on textareas and inputs', () => {
      var input = createAndMountElement('input', {defaultValue: textValue});
      ReactInputSelection.setSelection(input, {start: 1, end: 10});
      expect(input.selectionStart).toEqual(1);
      expect(input.selectionEnd).toEqual(10);

      var textarea = createAndMountElement('textarea', {defaultValue: textValue});
      ReactInputSelection.setSelection(textarea, {start: 1, end: 10});
      expect(textarea.selectionStart).toEqual(1);
      expect(textarea.selectionEnd).toEqual(10);
    });

    it('sets selection on inputs in iframes', () => {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const input = document.createElement('input');
      input.value = textValue;
      iframe.contentDocument.body.appendChild(input);
      ReactInputSelection.setSelection(input, {start: 1, end: 10});
      expect(input.selectionStart).toEqual(1);
      expect(input.selectionEnd).toEqual(10);

      document.body.removeChild(iframe);
    });
  });

  describe('getSelectionInformation/restoreSelection', () => {
    it('gets and restores selection for inputs that get remounted', () => {
      var input = document.createElement('input');
      input.value = textValue;
      document.body.appendChild(input);
      input.focus();
      input.selectionStart = 1;
      input.selectionEnd = 10;
      var selectionInfo = ReactInputSelection.getSelectionInformation();
      expect(selectionInfo.focusedElem).toBe(input);
      expect(selectionInfo.selectionRange).toEqual({start: 1, end: 10});
      expect(document.activeElement).toBe(input);
      input.setSelectionRange(0, 0);
      document.body.removeChild(input);
      expect(document.activeElement).not.toBe(input);
      expect(input.selectionStart).not.toBe(1);
      expect(input.selectionEnd).not.toBe(10);
      document.body.appendChild(input);
      ReactInputSelection.restoreSelection(selectionInfo);
      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(1);
      expect(input.selectionEnd).toBe(10);

      document.body.removeChild(input);
    });
  });
});
