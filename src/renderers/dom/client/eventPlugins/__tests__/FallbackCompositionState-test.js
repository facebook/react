/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('FallbackCompositionState', function() {
  var FallbackCompositionState;

  var TEXT = 'Hello world';

  beforeEach(function() {
    FallbackCompositionState = require('FallbackCompositionState');
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
    var composition = FallbackCompositionState.getPooled(input);
    input.value = modifiedValue;
    expect(composition.getData()).toBe(expectedData);
    FallbackCompositionState.release(composition);
  }

  it('extracts value via `getText()`', function() {
    var composition = FallbackCompositionState.getPooled(getInput());
    expect(composition.getText()).toBe(TEXT);
    FallbackCompositionState.release(composition);

    composition = FallbackCompositionState.getPooled(getTextarea());
    expect(composition.getText()).toBe(TEXT);
    FallbackCompositionState.release(composition);

    composition = FallbackCompositionState.getPooled(getContentEditable());
    expect(composition.getText()).toBe(TEXT);
    FallbackCompositionState.release(composition);
  });

  describe('Extract fallback data inserted at collapsed cursor', function() {
    it('extracts when inserted at start of text', function() {
      assertExtractedData('XXXHello world', 'XXX');
    });

    it('extracts when inserted within text', function() {
      assertExtractedData('Hello XXXworld', 'XXX');
    });

    it('extracts when inserted at end of text', function() {
      assertExtractedData('Hello worldXXX', 'XXX');
    });
  });

  describe('Extract fallback data for non-collapsed range', function() {
    it('extracts when inserted at start of text', function() {
      assertExtractedData('XXX world', 'XXX');
    });

    it('extracts when inserted within text', function() {
      assertExtractedData('HelXXXrld', 'XXX');
    });

    it('extracts when inserted at end of text', function() {
      assertExtractedData('Hello XXX', 'XXX');
    });
  });
});
