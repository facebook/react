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
 * @providesModule SelectEventPlugin
 */

"use strict";

var EventConstants = require('EventConstants');
var EventPluginHub = require('EventPluginHub');
var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');
var SyntheticEvent = require('SyntheticEvent');

var getActiveElement = require('getActiveElement');
var isEventSupported = require('isEventSupported');
var keyOf = require('keyOf');
var shallowEqual = require('shallowEqual');

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  select: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSelect: null}),
      captured: keyOf({onSelectCapture: null})
    }
  }
};

var useSelectionChange = false;
var useSelect = false;

if (ExecutionEnvironment.canUseDOM) {
  useSelectionChange = 'onselectionchange' in document;
  useSelect = isEventSupported('select');
}

var activeElement = null;
var activeElementID = null;
var activeNativeEvent = null;
var lastSelection = null;
var mouseDown = false;

/**
 * Get an object which is a unique representation of the current selection.
 *
 * The return value will not be consistent across nodes or browsers, but
 * two identical selections on the same node will return identical objects.
 *
 * @param {DOMElement} node
 * @param {object}
 */
function getSelection(node) {
  if ('selectionStart' in node) {
    return {
      start: node.selectionStart,
      end: node.selectionEnd
    };
  } else if (document.selection) {
    var range = document.selection.createRange();
    return {
      parentElement: range.parentElement(),
      text: range.text,
      top: range.boundingTop,
      left: range.boundingLeft
    };
  } else {
    var selection = window.getSelection();
    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset
    };
  }
}

/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @return {?SyntheticEvent}
 */
function constructSelectEvent(nativeEvent) {
  // Ensure we have the right element, and that the user is not dragging a
  // selection (this matches native `select` event behavior).
  if (mouseDown || activeElement != getActiveElement()) {
    return;
  }

  // Only fire when selection has actually changed.
  var currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    return SyntheticEvent.getPooled(
      eventTypes.select,
      activeElementID,
      nativeEvent
    );
  }
}

/**
 * Handle deferred event. And manually dispatch synthetic events.
 */
function handleDeferredEvent() {
  if (!activeNativeEvent) {
    return;
  }

  var event = constructSelectEvent(activeNativeEvent);
  activeNativeEvent = null;

  if (event) {
    EventPropagators.accumulateTwoPhaseDispatches(event);

    // Enqueue and process the abstract event manually.
    EventPluginHub.enqueueEvents(event);
    EventPluginHub.processEventQueue();
  }
}

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `supportedInputTypes`)
 * - TEXTAREA
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
var SelectEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    switch (topLevelType) {
      case topLevelTypes.topFocus:
        // Track the input node that has focus.
        activeElement = topLevelTarget;
        activeElementID = topLevelTargetID;
        lastSelection = null;
        mouseDown = false;
        break;
      case topLevelTypes.topBlur:
        activeElement = null;
        activeElementID = null;
        lastSelection = null;
        mouseDown = false;
        break;
      case topLevelTypes.topSelectionChange:
        // Chrome and IE fire non-standard event whenever selection is
        // changed (and sometimes when it hasn't).
        var event = constructSelectEvent(nativeEvent);
        if (event) {
          EventPropagators.accumulateTwoPhaseDispatches(event);
          return event;
        }
        break;
      case topLevelTypes.topMouseDown:
        // Don't fire the event while the user is dragging.
        mouseDown = true;
        break;
      case topLevelTypes.topMouseUp:
        mouseDown = false;
        activeNativeEvent = nativeEvent;
        handleDeferredEvent.defer();
        break;
      case topLevelTypes.topKeyDown:
        // For Firefox we check seleciton after each key.
        if (!useSelectionChange) {
          activeNativeEvent = nativeEvent;
          handleDeferredEvent.defer();
        }
        break;
    }
  }
};

module.exports = SelectEventPlugin;
