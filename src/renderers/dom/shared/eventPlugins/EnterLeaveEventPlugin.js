/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EnterLeaveEventPlugin
 * @flow
 */

'use strict';

const containsNode = require('fbjs/lib/containsNode');
const ReactTreeTraversal = require('ReactTreeTraversal');
const EventPluginHub = require('EventPluginHub');
const ReactDOMComponentTree = require('ReactDOMComponentTree');
const SyntheticMouseEvent = require('SyntheticMouseEvent');
const accumulateInto = require('accumulateInto');

import type {TopLevelTypes} from 'BrowserEventConstants';
import type {ReactInstance} from 'ReactInstanceType';
import type {DispatchConfig} from 'ReactSyntheticEventType';
import type {EventTypes, PluginModule} from 'PluginModuleType';

function isAncestorOfNode(outerInst, innerNode) {
  return (
    !innerNode ||
    ReactTreeTraversal.isAncestor(
      outerInst,
      ReactDOMComponentTree.getInstanceFromNode(innerNode),
    )
  );
}

function accumulateDispatches(inst, event) {
  if (!inst || !event) {
    return;
  }

  const listener = EventPluginHub.getListener(
    inst,
    event.dispatchConfig.registrationName,
  );
  const node = ReactDOMComponentTree.getNodeFromInstance(inst);

  const isTarget = event._targetInst === inst;
  const isTargetAncestor = isTarget || !containsNode(node, event.target);
  const isRelatedAncestor = isAncestorOfNode(inst, event.relatedTarget);

  if (listener && !isRelatedAncestor && isTargetAncestor) {
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listener,
    );
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}

function accumulateSinglePhaseDispatches(event) {
  if (event && event.dispatchConfig.registrationName) {
    ReactTreeTraversal.traverse(event._targetInst, accumulateDispatches, event);
  }
}

const eventTypes: EventTypes = {};
const topLevelEventsToDispatchConfig: {[key: TopLevelTypes]: DispatchConfig} = {
};
['mouseEnter', 'mouseLeave'].forEach(event => {
  let capitalizedEvent = event[0].toUpperCase() + event.slice(1);
  let onEvent = 'on' + capitalizedEvent;
  let topEvent = 'top' + capitalizedEvent;

  let type = {
    registrationName: onEvent,
    dependencies: [topEvent],
  };
  eventTypes[event] = type;
  topLevelEventsToDispatchConfig[topEvent] = type;
});

let EnterLeaveEventPlugin: PluginModule<MouseEvent> = {
  eventTypes,

  extractEvents(
    topLevelType: TopLevelTypes,
    targetInst: ReactInstance,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ): null | SyntheticMouseEvent {
    let event;
    const dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];

    if (!dispatchConfig) {
      return null;
    }

    const related = nativeEvent.relatedTarget;
    if (isAncestorOfNode(targetInst, related)) {
      return null;
    }

    event = SyntheticMouseEvent.getPooled(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );

    accumulateSinglePhaseDispatches(event);

    return event;
  },
};

module.exports = EnterLeaveEventPlugin;
