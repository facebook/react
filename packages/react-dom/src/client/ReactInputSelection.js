/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import containsNode from 'fbjs/lib/containsNode';
import getActiveElement from 'fbjs/lib/getActiveElement';

import * as ReactDOMSelection from './ReactDOMSelection';
import {ELEMENT_NODE} from '../shared/HTMLNodeType';

function isInDocument(node) {
  return (
    node.ownerDocument && containsNode(node.ownerDocument.documentElement, node)
  );
}

function getActiveElementDeep() {
  let win = window;
  let element = getActiveElement();
  while (element instanceof win.HTMLIFrameElement) {
    try {
      win = element.contentDocument.defaultView;
    } catch (e) {
      return element;
    }
    element = getActiveElement(win.document);
  }
  return element;
}

function getElementsWithSelections(acc, win) {
  acc = acc || [];
  win = win || window;
  let doc;
  try {
    doc = win.document;
    if (!doc) {
      return acc;
    }
  } catch (e) {
    return acc;
  }
  let element = getActiveElement(doc);
  // Use getSelection if activeElement is the document body
  if (element === doc.body) {
    if (win.getSelection) {
      const selection = win.getSelection();
      if (selection) {
        const startNode = selection.anchorNode;
        const endNode = selection.focusNode;
        const startOffset = selection.anchorOffset;
        const endOffset = selection.focusOffset;
        if (startNode && startNode.childNodes.length) {
          if (
            startNode.childNodes[startOffset] === endNode.childNodes[endOffset]
          ) {
            element = startNode.childNodes[startOffset];
          }
        } else {
          element = startNode;
        }
      }
    } else if (doc.selection) {
      const range = doc.selection.createRange();
      element = range.parentElement();
    }
  }

  if (hasSelectionCapabilities(element)) {
    acc = acc.concat({
      element: element,
      selectionRange: getSelection(element),
    });
  }

  for (let i = 0; i < win.frames.length; i++) {
    acc = getElementsWithSelections(acc, win.frames[i]);
  }

  return acc;
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

  element.focus();

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
const selectionCapableTypes = [
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
];
export function hasSelectionCapabilities(elem) {
  const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName &&
    ((nodeName === 'input' && selectionCapableTypes.includes(elem.type)) ||
      nodeName === 'textarea' ||
      elem.contentEditable === 'true')
  );
}

export function getSelectionInformation() {
  return {
    activeElement: getActiveElementDeep(),
    elementSelections: getElementsWithSelections(),
  };
}

/**
 * @restoreSelection: If any selection information was potentially lost,
 * restore it. This is useful when performing operations that could remove dom
 * nodes and place them back in, resulting in focus being lost.
 */
export function restoreSelection(priorSelectionInformation) {
  const priorActiveElement = priorSelectionInformation.activeElement;
  const elementSelections = priorSelectionInformation.elementSelections;
  let curActiveElement = getActiveElementDeep();
  const isActiveElementOnlySelection =
    elementSelections.length === 1 &&
    elementSelections[0] === priorActiveElement;
  if (
    !isInDocument(priorActiveElement) ||
    priorActiveElement === priorActiveElement.ownerDocument.body ||
    (isActiveElementOnlySelection && curActiveElement === priorActiveElement)
  ) {
    return;
  }
  elementSelections.forEach(function(selection) {
    const element = selection.element;
    if (
      isInDocument(element) &&
      getActiveElement(element.ownerDocument) !== element
    ) {
      setSelection(element, selection.selectionRange);
      if (element !== priorActiveElement) {
        focusNodePreservingScroll(element);
        curActiveElement = element;
      }
    }
  });

  if (curActiveElement !== priorActiveElement) {
    focusNodePreservingScroll(priorActiveElement);
  }
}

/**
 * @getSelection: Gets the selection bounds of a focused textarea, input or
 * contentEditable node.
 * -@input: Look up selection bounds of this input
 * -@return {start: selectionStart, end: selectionEnd}
 */
export function getSelection(input) {
  let selection;

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
}

/**
 * @setSelection: Sets the selection bounds of a textarea or input and focuses
 * the input.
 * -@input     Set selection bounds of this input or textarea
 * -@offsets   Object of same form that is returned from get*
 */
export function setSelection(input, offsets) {
  let {start, end} = offsets;
  if (end === undefined) {
    end = start;
  }

  if ('selectionStart' in input) {
    input.selectionStart = start;
    input.selectionEnd = Math.min(end, input.value.length);
  } else {
    ReactDOMSelection.setOffsets(input, offsets);
  }
}
