/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var containsNode = require('fbjs/lib/containsNode');
var focusNode = require('fbjs/lib/focusNode');
var getActiveElement = require('fbjs/lib/getActiveElement');

var ReactDOMSelection = require('./ReactDOMSelection');
var {ELEMENT_NODE} = require('../shared/HTMLNodeType');

function isInDocument(node) {
  return node.ownerDocument && containsNode(node.ownerDocument.documentElement, node);
}

function getFocusedElement() {
  var win = window;
  var focusedElem = getActiveElement();
  while (focusedElem instanceof win.HTMLIFrameElement) {
    try {
      win = focusedElem.contentDocument.defaultView;
    } catch (e) {
      return focusedElem;
    }
    focusedElem = getActiveElement(win.document);
  }
  return focusedElem;
}

function getElementsWithSelections(acc, win) {
  acc = acc || [];
  win = win || window;
  var doc;
  try {
    doc = win.document;
  } catch (e) {
    return acc;
  }
  var element = null;
  if (win.getSelection) {
    var selection = win.getSelection();
    var startNode = selection.anchorNode;
    var endNode = selection.focusNode;
    var startOffset = selection.anchorOffset;
    var endOffset = selection.focusOffset;
    if (startNode && startNode.childNodes.length) {
      if (startNode.childNodes[startOffset] === endNode.childNodes[endOffset]) {
        element = startNode.childNodes[startOffset];
      }
    } else {
      element = startNode;
    }
  } else if (doc.selection) {
    var range = doc.selection.createRange();
    element = range.parentElement();
  }
  if (ReactInputSelection.hasSelectionCapabilities(element)) {
    acc = acc.concat(element);
  }
  return Array.prototype.reduce.call(win.frames, getElementsWithSelections, acc);
}

function focusNodePreservingScroll(element) {
  // Focusing a node can change the scroll position, which is undesirable
  const ancestors = [];
  let ancestor = element;
  while ((ancestor = ancestor.parentNode)) {
    if (ancestor.nodeType === ELEMENT_NODE) {
      ancestors.push({
        element: ancestor,
        left: ancestor.scrollLeft,
        top: ancestor.scrollTop,
      });
    }
  }

  focusNode(element);

  for (let i = 0; i < ancestors.length; i++) {
    const info = ancestors[i];
    info.element.scrollLeft = info.left;
    info.element.scrollTop = info.top;
  }
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {
  hasSelectionCapabilities: function(elem) {
    var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
    return (
      nodeName &&
      ((nodeName === 'input' && elem.type === 'text') ||
        nodeName === 'textarea' ||
        elem.contentEditable === 'true')
    );
  },

  getSelectionInformation: function() {
    var focusedElement = getFocusedElement();
    return {
      focusedElement: focusedElement,
      activeElements: getElementsWithSelections().map(function(element) {
        return {
          element: element,
          selectionRange: ReactInputSelection.hasSelectionCapabilities(element)
            ? ReactInputSelection.getSelection(element)
            : null,
        };
      }),
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function(priorSelectionInformation) {
    priorSelectionInformation.activeElements.forEach(function(activeElement) {
      var element = activeElement.element;
      if (isInDocument(element) &&
          getActiveElement(element.ownerDocument) !== element) {
        if (ReactInputSelection.hasSelectionCapabilities(element)) {
          ReactInputSelection.setSelection(
            element,
            activeElement.selectionRange
          );
          focusNodePreservingScroll(element);
        }
      }
    });

    var curFocusedElement = getFocusedElement();
    var priorFocusedElement = priorSelectionInformation.focusedElement;
    if (curFocusedElement !== priorFocusedElement &&
        isInDocument(priorFocusedElement)) {
      focusNodePreservingScroll(priorFocusedElement);
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a focused textarea, input or
   * contentEditable node.
   * -@input: Look up selection bounds of this input
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function(input) {
    var selection;

    if ('selectionStart' in input) {
      // Modern browser with input or textarea.
      selection = {
        start: input.selectionStart,
        end: input.selectionEnd,
      };
    } else {
      // Content editable or old IE textarea.
      selection = ReactDOMSelection.getOffsets(input);
    }

    return selection || {start: 0, end: 0};
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@offsets   Object of same form that is returned from get*
   */
  setSelection: function(input, offsets) {
    var start = offsets.start;
    var end = offsets.end;
    if (end === undefined) {
      end = start;
    }

    if ('selectionStart' in input) {
      input.selectionStart = start;
      input.selectionEnd = Math.min(end, input.value.length);
    } else {
      ReactDOMSelection.setOffsets(input, offsets);
    }
  },
};

module.exports = ReactInputSelection;
