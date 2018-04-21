/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ResponderEventPlugin from 'events/ResponderEventPlugin';

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

const endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END, TOP_MOUSE_UP];
const moveDependencies = [TOP_TOUCH_MOVE, TOP_MOUSE_MOVE];
const startDependencies = [TOP_TOUCH_START, TOP_MOUSE_DOWN];

ResponderEventPlugin.eventTypes.responderMove.dependencies = moveDependencies;
ResponderEventPlugin.eventTypes.responderEnd.dependencies = endDependencies;
ResponderEventPlugin.eventTypes.responderStart.dependencies = startDependencies;
ResponderEventPlugin.eventTypes.responderRelease.dependencies = endDependencies;
ResponderEventPlugin.eventTypes.responderTerminationRequest.dependencies = [];
ResponderEventPlugin.eventTypes.responderGrant.dependencies = [];
ResponderEventPlugin.eventTypes.responderReject.dependencies = [];
ResponderEventPlugin.eventTypes.responderTerminate.dependencies = [];
ResponderEventPlugin.eventTypes.moveShouldSetResponder.dependencies = moveDependencies;
ResponderEventPlugin.eventTypes.selectionChangeShouldSetResponder.dependencies = [TOP_SELECTION_CHANGE];
ResponderEventPlugin.eventTypes.scrollShouldSetResponder.dependencies = [TOP_SCROLL];
ResponderEventPlugin.eventTypes.startShouldSetResponder.dependencies = startDependencies;

ResponderEventPlugin.injection.injectTopLevelTypes({
  topMouseDown: TOP_MOUSE_DOWN,
  topMouseMove: TOP_MOUSE_MOVE,
  topMouseUp: TOP_MOUSE_UP,
  topScroll: TOP_SCROLL,
  topSelectionChange: TOP_SELECTION_CHANGE,
  topTouchCancel: TOP_TOUCH_CANCEL,
  topTouchEnd: TOP_TOUCH_END,
  topTouchMove: TOP_TOUCH_MOVE,
  topTouchStart: TOP_TOUCH_START,
});

export default ResponderEventPlugin;
