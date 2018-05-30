/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');
const ReactInputSelection = require('../client/ReactInputSelection');

describe('ReactInputSelection', () => {
  const textValue = 'the text contents';
  const createAndMountElement = (type, props, children) => {
    const element = React.createElement(type, props, children);
    const instance = ReactTestUtils.renderIntoDocument(element);
    return ReactDOM.findDOMNode(instance);
  };
  const makeGetSelection = (win = window) => () => ({
    anchorNode: win.document.activeElement,
    focusNode: win.document.activeElement,
    anchorOffset:
      win.document.activeElement && win.document.activeElement.selectionStart,
    focusOffset:
      win.document.activeElement && win.document.activeElement.selectionEnd,
  });

  describe('hasSelectionCapabilities', () => {
    it('returns true for textareas', () => {
      const textarea = document.createElement('textarea');
      expect(ReactInputSelection.hasSelectionCapabilities(textarea)).toBe(true);
    });

    it('returns true for inputs that can support text selection ranges', () => {
      [
        'date',
        'datetime-local',
        'email',
        'month',
        'number',
        'password',
        'search',
        'tel',
        'text',
        'time',
        'url',
        'week',
      ].forEach(type => {
        const input = document.createElement('input');
        input.type = type;
        expect(ReactInputSelection.hasSelectionCapabilities(input)).toBe(true);
      });

      const inputReadOnly = document.createElement('input');
      inputReadOnly.readOnly = 'true';
      expect(ReactInputSelection.hasSelectionCapabilities(inputReadOnly)).toBe(
        true,
      );
    });

    it('returns false for non-text-selectable inputs', () => {
      [
        'button',
        'checkbox',
        'color',
        'file',
        'hidden',
        'image',
        'radio',
        'range',
        'reset',
        'submit',
      ].forEach(type => {
        const input = document.createElement('input');
        input.type = type;
        expect(ReactInputSelection.hasSelectionCapabilities(input)).toBe(false);
      });
    });

    it('returns true for contentEditable elements', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      const body = document.createElement('body');
      body.contentEditable = 'true';
      const input = document.createElement('input');
      input.contentEditable = 'true';
      const select = document.createElement('select');
      select.contentEditable = 'true';

      expect(ReactInputSelection.hasSelectionCapabilities(div)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(body)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(input)).toBe(true);
      expect(ReactInputSelection.hasSelectionCapabilities(select)).toBe(true);
    });

    it('returns false for any other type of HTMLElement', () => {
      const select = document.createElement('select');
      const iframe = document.createElement('iframe');

      expect(ReactInputSelection.hasSelectionCapabilities(select)).toBe(false);
      expect(ReactInputSelection.hasSelectionCapabilities(iframe)).toBe(false);
    });
  });

  describe('getSelection', () => {
    it('gets selection offsets from a textarea or input', () => {
      const input = createAndMountElement('input', {defaultValue: textValue});
      input.setSelectionRange(6, 11);
      expect(ReactInputSelection.getSelection(input)).toEqual({
        start: 6,
        end: 11,
      });

      const textarea = createAndMountElement('textarea', {
        defaultValue: textValue,
      });
      textarea.setSelectionRange(6, 11);
      expect(ReactInputSelection.getSelection(textarea)).toEqual({
        start: 6,
        end: 11,
      });
    });

    it('gets selection offsets from a contentEditable element', () => {
      const node = createAndMountElement('div', null, textValue);
      node.selectionStart = 6;
      node.selectionEnd = 11;
      expect(ReactInputSelection.getSelection(node)).toEqual({
        start: 6,
        end: 11,
      });
    });

    it('gets selection offsets as start: 0, end: 0 if no selection', () => {
      const node = createAndMountElement('select');
      expect(ReactInputSelection.getSelection(node)).toEqual({
        start: 0,
        end: 0,
      });
    });

    it('gets selection on inputs in iframes', () => {
      const iframe = document.createElement('iframe');
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
      const input = createAndMountElement('input', {defaultValue: textValue});
      ReactInputSelection.setSelection(input, {start: 1, end: 10});
      expect(input.selectionStart).toEqual(1);
      expect(input.selectionEnd).toEqual(10);

      const textarea = createAndMountElement('textarea', {
        defaultValue: textValue,
      });
      ReactInputSelection.setSelection(textarea, {start: 1, end: 10});
      expect(textarea.selectionStart).toEqual(1);
      expect(textarea.selectionEnd).toEqual(10);
    });

    it('sets selection on inputs in iframes', () => {
      const iframe = document.createElement('iframe');
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
      // Mock window getSelection if needed
      const originalGetSelection = window.getSelection;
      window.getSelection = window.getSelection || makeGetSelection(window);
      const input = document.createElement('input');
      input.value = textValue;
      document.body.appendChild(input);
      input.focus();
      input.selectionStart = 1;
      input.selectionEnd = 10;
      const selectionInfo = ReactInputSelection.getSelectionInformation();
      expect(selectionInfo.activeElement).toBe(input);
      expect(selectionInfo.elementSelections[0].element).toBe(input);
      expect(selectionInfo.elementSelections[0].selectionRange).toEqual({
        start: 1,
        end: 10,
      });
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
      window.getSelection = originalGetSelection;
    });

    it('gets and restores selection for inputs in an iframe that get remounted', () => {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframeDoc.defaultView;
      // Mock window and iframe getSelection if needed
      const originalGetSelection = window.getSelection;
      const originalIframeGetSelection = iframeWin.getSelection;
      window.getSelection = window.getSelection || makeGetSelection(window);
      iframeWin.getSelection =
        iframeWin.getSelection || makeGetSelection(iframeWin);

      const input = document.createElement('input');
      input.value = textValue;
      iframeDoc.body.appendChild(input);
      input.focus();
      input.selectionStart = 1;
      input.selectionEnd = 10;
      const selectionInfo = ReactInputSelection.getSelectionInformation();
      expect(selectionInfo.activeElement === input).toBe(true);
      expect(selectionInfo.elementSelections[0].selectionRange).toEqual({
        start: 1,
        end: 10,
      });
      expect(document.activeElement).toBe(iframe);
      expect(iframeDoc.activeElement).toBe(input);

      input.setSelectionRange(0, 0);
      iframeDoc.body.removeChild(input);
      expect(iframeDoc.activeElement).not.toBe(input);
      expect(input.selectionStart).not.toBe(1);
      expect(input.selectionEnd).not.toBe(10);
      iframeDoc.body.appendChild(input);
      ReactInputSelection.restoreSelection(selectionInfo);
      expect(iframeDoc.activeElement).toBe(input);
      expect(input.selectionStart).toBe(1);
      expect(input.selectionEnd).toBe(10);

      document.body.removeChild(iframe);
      window.getSelection = originalGetSelection;
      iframeWin.getSelection = originalIframeGetSelection;
    });
  });
});
