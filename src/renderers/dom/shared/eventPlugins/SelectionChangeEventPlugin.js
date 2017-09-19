/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SelectionChangeEventPlugin
 */

'use strict';

var EventPropagators = require('EventPropagators');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactInputSelection = require('ReactInputSelection');
var SyntheticEvent = require('SyntheticEvent');
var {DOCUMENT_NODE} = require('HTMLNodeType');

var shallowEqual = require('fbjs/lib/shallowEqual');

var eventTypes = {
  select: {
    phasedRegistrationNames: {
      bubbled: 'onSelectionChange',
      captured: 'onSelectionChangeCapture',
    },
    dependencies: [
      'topSelectionChange',
    ],
  },
};

var activeElement = null;
var activeElementInst = null;
var lastSelection = null;

// Track whether all listeners exists for this plugin. If none exist, we do
// not extract events. See #3639.
var isListeningToAllDependencies =
  ReactBrowserEventEmitter.isListeningToAllDependencies;

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
  if (
    'selectionStart' in node &&
    ReactInputSelection.hasSelectionCapabilities(node)
  ) {
    return {
      start: node.selectionStart,
      end: node.selectionEnd,
    };
  } else if (window.getSelection) {
    var selection = window.getSelection();
    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset,
    };
  }
}

/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @return {?SyntheticEvent}
 */
function constructSelectionChangeEvent(nativeEvent, nativeEventTarget) {
  // Only fire when selection has actually changed.
  var currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    var syntheticEvent = SyntheticEvent.getPooled(
      eventTypes.select,
      activeElementInst,
      nativeEvent,
      nativeEventTarget,
    );

    syntheticEvent.type = 'select';
    syntheticEvent.target = activeElement;

    EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);

    return syntheticEvent;
  }

  return null;
}

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 */
var SelectionChangeEventPlugin = {
  eventTypes: eventTypes,

  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  ) {
    var doc = nativeEventTarget.window === nativeEventTarget
      ? nativeEventTarget.document
      : nativeEventTarget.nodeType === DOCUMENT_NODE
          ? nativeEventTarget
          : nativeEventTarget.ownerDocument;
    if (!doc || !isListeningToAllDependencies('onSelectionChange', doc)) {
      return null;
    }

    return topLevelType === 'topSelectionChange'
    ? constructSelectionChangeEvent(nativeEvent, nativeEventTarget)
    : null;
  },
};

module.exports = SelectionChangeEventPlugin;
