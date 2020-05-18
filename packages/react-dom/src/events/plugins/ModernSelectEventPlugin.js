/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {canUseDOM} from 'shared/ExecutionEnvironment';
import SyntheticEvent from 'legacy-events/SyntheticEvent';
import isTextInputElement from '../isTextInputElement';
import shallowEqual from 'shared/shallowEqual';

import {
  TOP_BLUR,
  TOP_CONTEXT_MENU,
  TOP_DRAG_END,
  TOP_FOCUS,
  TOP_KEY_DOWN,
  TOP_KEY_UP,
  TOP_MOUSE_DOWN,
  TOP_MOUSE_UP,
  TOP_SELECTION_CHANGE,
} from '../DOMTopLevelEventTypes';
import getActiveElement from '../../client/getActiveElement';
import {
  getNodeFromInstance,
  getEventListenerMap,
} from '../../client/ReactDOMComponentTree';
import {hasSelectionCapabilities} from '../../client/ReactInputSelection';
import {DOCUMENT_NODE} from '../../shared/HTMLNodeType';
import {
  accumulateTwoPhaseListeners,
  getListenerMapKey,
  capturePhaseEvents,
} from '../DOMModernPluginEventSystem';

const skipSelectionChangeEvent =
  canUseDOM && 'documentMode' in document && document.documentMode <= 11;

const rootTargetDependencies = [
  TOP_BLUR,
  TOP_CONTEXT_MENU,
  TOP_DRAG_END,
  TOP_FOCUS,
  TOP_KEY_DOWN,
  TOP_KEY_UP,
  TOP_MOUSE_DOWN,
  TOP_MOUSE_UP,
];

const eventTypes = {
  select: {
    phasedRegistrationNames: {
      bubbled: 'onSelect',
      captured: 'onSelectCapture',
    },
    dependencies: [...rootTargetDependencies, TOP_SELECTION_CHANGE],
  },
};

let activeElement = null;
let activeElementInst = null;
let lastSelection = null;
let mouseDown = false;

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
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @param {object} nativeEventTarget
 * @return {?SyntheticEvent}
 */
function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
  // Ensure we have the right element, and that the user is not dragging a
  // selection (this matches native `select` event behavior). In HTML5, select
  // fires only on input and textarea thus if there's no focused element we
  // won't dispatch.
  const doc = getEventTargetDocument(nativeEventTarget);

  if (
    mouseDown ||
    activeElement == null ||
    activeElement !== getActiveElement(doc)
  ) {
    return;
  }

  // Only fire when selection has actually changed.
  const currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    const syntheticEvent = SyntheticEvent.getPooled(
      eventTypes.select,
      null,
      nativeEvent,
      nativeEventTarget,
    );

    syntheticEvent.type = 'select';
    syntheticEvent.target = activeElement;

    accumulateTwoPhaseListeners(
      activeElementInst,
      dispatchQueue,
      syntheticEvent,
    );
  }
}

function isListeningToEvents(
  events: Array<string>,
  mountAt: Document | Element,
): boolean {
  const listenerMap = getEventListenerMap(mountAt);
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const capture = capturePhaseEvents.has(event);
    const listenerMapKey = getListenerMapKey(event, capture);
    if (!listenerMap.has(listenerMapKey)) {
      return false;
    }
  }
  return true;
}

function isListeningToEvent(
  registrationName: string,
  mountAt: Document | Element,
): boolean {
  const listenerMap = getEventListenerMap(mountAt);
  const capture = capturePhaseEvents.has(registrationName);
  const listenerMapKey = getListenerMapKey(registrationName, capture);
  return listenerMap.has(listenerMapKey);
}

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
const SelectEventPlugin = {
  eventTypes: eventTypes,

  extractEvents: function(
    dispatchQueue,
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    container,
  ) {
    const doc = getEventTargetDocument(nativeEventTarget);
    // Track whether all listeners exists for this plugin. If none exist, we do
    // not extract events. See #3639.
    if (
      // We only listen to TOP_SELECTION_CHANGE on the document, never the
      // root.
      !isListeningToEvent(TOP_SELECTION_CHANGE, doc) ||
      // If we are handling TOP_SELECTION_CHANGE, then we don't need to
      // check for the other dependencies, as TOP_SELECTION_CHANGE is only
      // event attached from the onChange plugin and we don't expose an
      // onSelectionChange event from React.
      (topLevelType !== TOP_SELECTION_CHANGE &&
        !isListeningToEvents(rootTargetDependencies, container))
    ) {
      return;
    }

    const targetNode = targetInst ? getNodeFromInstance(targetInst) : window;

    switch (topLevelType) {
      // Track the input node that has focus.
      case TOP_FOCUS:
        if (
          isTextInputElement(targetNode) ||
          targetNode.contentEditable === 'true'
        ) {
          activeElement = targetNode;
          activeElementInst = targetInst;
          lastSelection = null;
        }
        break;
      case TOP_BLUR:
        activeElement = null;
        activeElementInst = null;
        lastSelection = null;
        break;
      // Don't fire the event while the user is dragging. This matches the
      // semantics of the native select event.
      case TOP_MOUSE_DOWN:
        mouseDown = true;
        break;
      case TOP_CONTEXT_MENU:
      case TOP_MOUSE_UP:
      case TOP_DRAG_END:
        mouseDown = false;
        constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
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
      case TOP_SELECTION_CHANGE:
        if (skipSelectionChangeEvent) {
          break;
        }
      // falls through
      case TOP_KEY_DOWN:
      case TOP_KEY_UP:
        constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
    }

    return;
  },
};

export default SelectEventPlugin;
