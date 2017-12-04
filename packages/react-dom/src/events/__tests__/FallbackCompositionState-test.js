/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('FallbackCompositionState', () => {
  var FallbackCompositionState;

  var TEXT = 'Hello world';

  beforeEach(() => {
    // TODO: can we express this test with only public API?
    FallbackCompositionState = require('../FallbackCompositionState');
  });

  function getInput() {
    var input = document.createElement('input');
    input.value = TEXT;
    return input;
  }

  function getTextarea() {
    var textarea = document.createElement('textarea');
    textarea.value = TEXT;
    return textarea;
  }

  function getContentEditable() {
    var editable = document.createElement('div');
    var inner = document.createElement('span');
    inner.appendChild(document.createTextNode(TEXT));
    editable.appendChild(inner);
    return editable;
  }

  function assertExtractedData(modifiedValue, expectedData) {
    var input = getInput();
    FallbackCompositionState.initialize(input);
    input.value = modifiedValue;
    expect(FallbackCompositionState.getData()).toBe(expectedData);
    FallbackCompositionState.reset();
  }

  it('extracts value via `getText()`', () => {
    FallbackCompositionState.initialize(getInput());
    expect(FallbackCompositionState.getText()).toBe(TEXT);
    FallbackCompositionState.reset();

    FallbackCompositionState.initialize(getTextarea());
    expect(FallbackCompositionState.getText()).toBe(TEXT);
    FallbackCompositionState.reset();

    FallbackCompositionState.initialize(getContentEditable());
    expect(FallbackCompositionState.getText()).toBe(TEXT);
    FallbackCompositionState.reset();
  });

  describe('Extract fallback data inserted at collapsed cursor', () => {
    it('extracts when inserted at start of text', () => {
      assertExtractedData('XXXHello world', 'XXX');
    });

    it('extracts when inserted within text', () => {
      assertExtractedData('Hello XXXworld', 'XXX');
    });

    it('extracts when inserted at end of text', () => {
      assertExtractedData('Hello worldXXX', 'XXX');
    });
  });

  describe('Extract fallback data for non-collapsed range', () => {
    it('extracts when inserted at start of text', () => {
      assertExtractedData('XXX world', 'XXX');
    });

    it('extracts when inserted within text', () => {
      assertExtractedData('HelXXXrld', 'XXX');
    });

    it('extracts when inserted at end of text', () => {
      assertExtractedData('Hello XXX', 'XXX');
    });
  });
});
