/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  BLUR,
  CONTEXT_MENU,
  DRAG_END,
  FOCUS,
  KEY_DOWN,
  KEY_UP,
  MOUSE_DOWN,
  MOUSE_UP,
  SELECTION_CHANGE,
} from '../ReactFireEventTypes';
import {getActiveElement, isTextInputElement} from '../../ReactFireUtils';
import {DOCUMENT_NODE} from '../../ReactFireDOMConfig';
import {hasSelectionCapabilities} from '../../ReactFireSelection';
import {traverseTwoPhase} from '../ReactFireEventTraversal';
import {
  getPooledSyntheticEvent,
  SyntheticEvent,
} from '../synthetic/ReactFireSyntheticEvent';

import {canUseDOM} from 'shared/ExecutionEnvironment';
import shallowEqual from 'shared/shallowEqual';

const skipSelectionChangeEvent =
  canUseDOM && 'documentMode' in document && document.documentMode <= 11;

let activeElement = null;
let lastSelection = null;
let mouseDown = false;

/**
 * Get document associated with the event target.
 *
 * @param {object} nativeEventTarget
 * @return {Document}
 */
function getEventTargetDocument(eventTarget) {
  return eventTarget.window === eventTarget
    ? eventTarget.document
    : eventTarget.nodeType === DOCUMENT_NODE
      ? eventTarget
      : eventTarget.ownerDocument;
}

/**
 * Get an object which is a unique representation of the current selection.
 *
 * The return value will not be consistent across nodes or browsers, but
 * two identical selections on the same node will return identical objects.
 *
 * @param {DOMElement} node
 * @return {object}
 */
function getSelection(node) {
  if ('selectionStart' in node && hasSelectionCapabilities(node)) {
    return {
      start: node.selectionStart,
      end: node.selectionEnd,
    };
  } else {
    const win =
      (node.ownerDocument && node.ownerDocument.defaultView) || window;
    const selection = win.getSelection();
    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset,
    };
  }
}

function constructSelectEvent(nativeEvent, eventTarget, proxyContext) {
  // Ensure we have the right element, and that the user is not dragging a
  // selection (this matches native `select` event behavior). In HTML5, select
  // fires only on input and textarea thus if there's no focused element we
  // won't dispatch.
  const doc = getEventTargetDocument(eventTarget);

  if (
    mouseDown ||
    activeElement == null ||
    activeElement !== getActiveElement(doc)
  ) {
    return null;
  }

  // Only fire when selection has actually changed.
  const currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    const syntheticEvent = getPooledSyntheticEvent(
      SyntheticEvent,
      nativeEvent,
      proxyContext,
    );

    syntheticEvent.type = 'select';
    syntheticEvent.target = activeElement;
    traverseTwoPhase(syntheticEvent, proxyContext);
  }
}

function polyfilledEventListener(
  eventName,
  nativeEvent,
  eventTarget,
  proxyContext,
): void {
  switch (eventName) {
    // Track the input node that has focus.
    case FOCUS:
      if (
        isTextInputElement(eventTarget) ||
        eventTarget.contentEditable === 'true'
      ) {
        activeElement = eventTarget;
        lastSelection = null;
      }
      break;
    case BLUR:
      activeElement = null;
      lastSelection = null;
      break;
    // Don't fire the event while the user is dragging. This matches the
    // semantics of the native select event.
    case MOUSE_DOWN:
      mouseDown = true;
      break;
    case CONTEXT_MENU:
    case MOUSE_UP:
    case DRAG_END:
      mouseDown = false;
      constructSelectEvent(nativeEvent, eventTarget, proxyContext);
      break;
    // Chrome and IE fire non-standard event when selection is changed (and
    // sometimes when it hasn't). IE's event fires out of order with respect
    // to key and input events on deletion, so we discard it.
    //
    // Firefox doesn't support selectionchange, so check selection status
    // after each key entry. The selection changes after keydown and before
    // keyup, but we check on keydown as well in the case of holding down a
    // key, when multiple keydown events are fired but only one keyup is.
    // This is also our approach for IE handling, for the reason above.
    case SELECTION_CHANGE:
      if (skipSelectionChangeEvent) {
        break;
      }
    // falls through
    case KEY_DOWN:
    case KEY_UP:
      constructSelectEvent(nativeEvent, eventTarget, proxyContext);
  }
}

const dependencies = [
  BLUR,
  CONTEXT_MENU,
  DRAG_END,
  FOCUS,
  KEY_DOWN,
  KEY_UP,
  MOUSE_DOWN,
  MOUSE_UP,
  SELECTION_CHANGE,
];

export const onSelectInputHeuristics = [dependencies, polyfilledEventListener];
