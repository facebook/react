/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInputSelection
 */

"use strict";

// It is not safe to read the document.activeElement property in IE if there's
// nothing focused.
function getActiveElement() {
  try {
    return document.activeElement;
  } catch (e) {
  }
}

function isInDocument(node) {
  return document.documentElement.contains(node);
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {

  hasSelectionCapabilities: function(elem) {
    return elem && (
      (elem.nodeName === 'INPUT' && elem.type === 'text') ||
      elem.nodeName === 'TEXTAREA' ||
      elem.contentEditable === 'true'
    );
  },

  getSelectionInformation: function() {
    var focusedElem = getActiveElement();
    return {
      focusedElem: focusedElem,
      selectionRange:
          ReactInputSelection.hasSelectionCapabilities(focusedElem) ?
          ReactInputSelection.getSelection(focusedElem) :
          null
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function(priorSelectionInformation) {
    var curFocusedElem = getActiveElement();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem &&
        isInDocument(priorFocusedElem)) {
      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
        ReactInputSelection.setSelection(
          priorFocusedElem,
          priorSelectionRange
        );
      }
      priorFocusedElem.focus();
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a textarea or input.
   * -@input: Look up selection bounds of this input or textarea
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function(input) {
    var range;
    if (input.contentEditable === 'true' && window.getSelection) {
      range = window.getSelection().getRangeAt(0);
      var commonAncestor = range.commonAncestorContainer;
      if (commonAncestor && commonAncestor.nodeType === 3) {
        commonAncestor = commonAncestor.parentNode;
      }
      if (commonAncestor !== input) {
        return {start: 0, end: 0};
      } else {
        return {start: range.startOffset, end: range.endOffset};
      }
    }

    if (!document.selection) {
      // Mozilla, Safari, etc.
      return {start: input.selectionStart, end: input.selectionEnd};
    }

    range = document.selection.createRange();
    if (range.parentElement() !== input) {
      // There can only be one selection per document in IE, so if the
      // containing element of the document's selection isn't our text field,
      // our text field must have no selection.
      return {start: 0, end: 0};
    }

    var length = input.value.length;

    if (input.nodeName === 'INPUT') {
      return {
        start: -range.moveStart('character', -length),
        end: -range.moveEnd('character', -length)
      };
    } else {
      var range2 = range.duplicate();
      range2.moveToElementText(input);
      range2.setEndPoint('StartToEnd', range);
      var end = length - range2.text.length;
      range2.setEndPoint('StartToStart', range);
      return {
        start: length - range2.text.length,
        end:   end
      };
    }
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@rangeObj Object of same form that is returned from get*
   */
  setSelection: function(input, rangeObj) {
    var range;
    var start = rangeObj.start;
    var end = rangeObj.end;
    if (typeof end === 'undefined') {
      end = start;
    }
    if (document.selection) {
      // IE is inconsistent about character offsets when it comes to carriage
      // returns, so we need to manually take them into account
      if (input.tagName === 'TEXTAREA') {
        var cr_before =
          (input.value.slice(0, start).match(/\r/g) || []).length;
        var cr_inside =
          (input.value.slice(start, end).match(/\r/g) || []).length;
        start -= cr_before;
        end -= cr_before + cr_inside;
      }
      range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', start);
      range.moveEnd('character', end - start);
      range.select();
    } else {
      if (input.contentEditable === 'true') {
        if (input.childNodes.length === 1) {
          range = document.createRange();
          range.setStart(input.childNodes[0], start);
          range.setEnd(input.childNodes[0], end);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else {
        input.selectionStart = start;
        input.selectionEnd = Math.min(end, input.value.length);
        input.focus();
      }
    }
  }

};

module.exports = ReactInputSelection;
