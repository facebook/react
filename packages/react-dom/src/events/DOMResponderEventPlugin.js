/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import createResponderTouchHistoryStore from 'events/createResponderTouchHistoryStore';
import createResponderEventPlugin from 'events/createResponderEventPlugin';

import {
  TOP_MOUSE_DOWN,
  TOP_MOUSE_MOVE,
  TOP_MOUSE_UP,
  TOP_SCROLL,
  TOP_SELECTION_CHANGE,
  TOP_TOUCH_CANCEL,
  TOP_TOUCH_END,
  TOP_TOUCH_MOVE,
  TOP_TOUCH_START,
} from './DOMTopLevelEventTypes';

const TopLevelTypes = {
  topMouseDown: TOP_MOUSE_DOWN,
  topMouseMove: TOP_MOUSE_MOVE,
  topMouseUp: TOP_MOUSE_UP,
  topScroll: TOP_SCROLL,
  topSelectionChange: TOP_SELECTION_CHANGE,
  topTouchCancel: TOP_TOUCH_CANCEL,
  topTouchEnd: TOP_TOUCH_END,
  topTouchMove: TOP_TOUCH_MOVE,
  topTouchStart: TOP_TOUCH_START,
};

export const ResponderTouchHistoryStore = createResponderTouchHistoryStore(
  TopLevelTypes,
);
const DOMResponderEventPlugin = createResponderEventPlugin(
  TopLevelTypes,
  ResponderTouchHistoryStore,
);

const endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END, TOP_MOUSE_UP];
const moveDependencies = [TOP_TOUCH_MOVE, TOP_MOUSE_MOVE];
const startDependencies = [TOP_TOUCH_START, TOP_MOUSE_DOWN];

DOMResponderEventPlugin.eventTypes.responderMove.dependencies = moveDependencies;
DOMResponderEventPlugin.eventTypes.responderEnd.dependencies = endDependencies;
DOMResponderEventPlugin.eventTypes.responderStart.dependencies = startDependencies;
DOMResponderEventPlugin.eventTypes.responderRelease.dependencies = endDependencies;
DOMResponderEventPlugin.eventTypes.responderTerminationRequest.dependencies = [];
DOMResponderEventPlugin.eventTypes.responderGrant.dependencies = [];
DOMResponderEventPlugin.eventTypes.responderReject.dependencies = [];
DOMResponderEventPlugin.eventTypes.responderTerminate.dependencies = [];
DOMResponderEventPlugin.eventTypes.moveShouldSetResponder.dependencies = moveDependencies;
DOMResponderEventPlugin.eventTypes.selectionChangeShouldSetResponder.dependencies = [
  TOP_SELECTION_CHANGE,
];
DOMResponderEventPlugin.eventTypes.scrollShouldSetResponder.dependencies = [
  TOP_SCROLL,
];
DOMResponderEventPlugin.eventTypes.startShouldSetResponder.dependencies = startDependencies;

export default DOMResponderEventPlugin;
