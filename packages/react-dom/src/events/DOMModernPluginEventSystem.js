/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {PluginModule} from 'legacy-events/PluginModuleType';
import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';
import type {ReactDOMListener} from 'shared/ReactDOMTypes';

import {registrationNameDependencies} from 'legacy-events/EventPluginRegistry';
import {batchedEventUpdates} from 'legacy-events/ReactGenericBatching';
import {executeDispatchesInOrder} from 'legacy-events/EventPluginUtils';
import {plugins} from 'legacy-events/EventPluginRegistry';

import {HostRoot, HostPortal} from 'shared/ReactWorkTags';

import {addTrappedEventListener} from './ReactDOMEventListener';
import getEventTarget from './getEventTarget';
import {getListenerMapForElement} from './DOMEventListenerMap';
import {
  TOP_FOCUS,
  TOP_LOAD,
  TOP_ABORT,
  TOP_CANCEL,
  TOP_INVALID,
  TOP_BLUR,
  TOP_SCROLL,
  TOP_CLOSE,
  TOP_RESET,
  TOP_SUBMIT,
  TOP_CAN_PLAY,
  TOP_CAN_PLAY_THROUGH,
  TOP_DURATION_CHANGE,
  TOP_EMPTIED,
  TOP_ENCRYPTED,
  TOP_ENDED,
  TOP_ERROR,
  TOP_WAITING,
  TOP_VOLUME_CHANGE,
  TOP_TIME_UPDATE,
  TOP_SUSPEND,
  TOP_STALLED,
  TOP_SEEKING,
  TOP_SEEKED,
  TOP_PLAY,
  TOP_PAUSE,
  TOP_LOAD_START,
  TOP_LOADED_DATA,
  TOP_LOADED_METADATA,
  TOP_RATE_CHANGE,
  TOP_PROGRESS,
  TOP_PLAYING,
} from './DOMTopLevelEventTypes';
import {
  getClosestInstanceFromNode,
  getListenersFromTarget,
  initListenersSet,
} from '../client/ReactDOMComponentTree';
import {
  DOCUMENT_NODE,
  COMMENT_NODE,
  ELEMENT_NODE,
} from '../shared/HTMLNodeType';

import {enableLegacyFBPrimerSupport} from 'shared/ReactFeatureFlags';

const capturePhaseEvents = new Set([
  TOP_FOCUS,
  TOP_BLUR,
  TOP_SCROLL,
  TOP_LOAD,
  TOP_ABORT,
  TOP_CANCEL,
  TOP_CLOSE,
  TOP_INVALID,
  TOP_RESET,
  TOP_SUBMIT,
  TOP_ABORT,
  TOP_CAN_PLAY,
  TOP_CAN_PLAY_THROUGH,
  TOP_DURATION_CHANGE,
  TOP_EMPTIED,
  TOP_ENCRYPTED,
  TOP_ENDED,
  TOP_ERROR,
  TOP_LOADED_DATA,
  TOP_LOADED_METADATA,
  TOP_LOAD_START,
  TOP_PAUSE,
  TOP_PLAY,
  TOP_PLAYING,
  TOP_PROGRESS,
  TOP_RATE_CHANGE,
  TOP_SEEKED,
  TOP_SEEKING,
  TOP_STALLED,
  TOP_SUSPEND,
  TOP_TIME_UPDATE,
  TOP_VOLUME_CHANGE,
  TOP_WAITING,
]);

const isArray = Array.isArray;

function dispatchEventsForPlugins(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
  targetContainer: null | EventTarget,
): void {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const syntheticEvents: Array<ReactSyntheticEvent> = [];

  for (let i = 0; i < plugins.length; i++) {
    const possiblePlugin: PluginModule<AnyNativeEvent> = plugins[i];
    if (possiblePlugin !== undefined) {
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer,
      );
      if (isArray(extractedEvents)) {
        // Flow complains about @@iterator being missing in ReactSyntheticEvent,
        // so we cast to avoid the Flow error.
        const arrOfExtractedEvents = ((extractedEvents: any): Array<ReactSyntheticEvent>);
        syntheticEvents.push(...arrOfExtractedEvents);
      } else if (extractedEvents != null) {
        syntheticEvents.push(extractedEvents);
      }
    }
  }
  for (let i = 0; i < syntheticEvents.length; i++) {
    const syntheticEvent = syntheticEvents[i];
    executeDispatchesInOrder(syntheticEvent);
    // Release the event from the pool if needed
    if (!syntheticEvent.isPersistent()) {
      syntheticEvent.constructor.release(syntheticEvent);
    }
  }
}

export function listenToTopLevelEvent(
  topLevelType: DOMTopLevelEventType,
  targetContainer: EventTarget,
  listenerMap: Map<DOMTopLevelEventType | string, null | (any => void)>,
  passive?: boolean,
): void {
  if (!listenerMap.has(topLevelType)) {
    const isCapturePhase = capturePhaseEvents.has(topLevelType);
    const listener = addTrappedEventListener(
      targetContainer,
      topLevelType,
      isCapturePhase,
      false,
      passive,
    );
    listenerMap.set(topLevelType, listener);
  }
}

export function listenToEvent(
  registrationName: string,
  rootContainerElement: Element,
): void {
  const listenerMap = getListenerMapForElement(rootContainerElement);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    listenToTopLevelEvent(dependency, rootContainerElement, listenerMap);
  }
}

const validFBLegacyPrimerRels = new Set([
  'dialog',
  'dialog-post',
  'async',
  'async-post',
  'theater',
  'toggle',
]);

function willDeferLaterForFBLegacyPrimer(nativeEvent: any): boolean {
  let node = nativeEvent.target;
  const type = nativeEvent.type;
  if (type !== 'click') {
    return false;
  }
  while (node !== null) {
    // Primer works by intercepting a click event on an <a> element
    // that has a "rel" attribute that matches one of the valid ones
    // in the Set above. If we intercept this before Primer does, we
    // will need to defer the current event till later and discontinue
    // execution of the current event. To do this we can add a document
    // event listener and continue again later after propagation.
    if (node.tagName === 'A' && validFBLegacyPrimerRels.has(node.rel)) {
      const legacyFBSupport = true;
      const isCapture = nativeEvent.eventPhase === 1;
      addTrappedEventListener(
        null,
        ((type: any): DOMTopLevelEventType),
        isCapture,
        legacyFBSupport,
      );
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function isMatchingRootContainer(
  grandContainer: Element,
  targetContainer: EventTarget,
): boolean {
  return (
    grandContainer === targetContainer ||
    (grandContainer.nodeType === COMMENT_NODE &&
      grandContainer.parentNode === targetContainer)
  );
}

export function isDOMElement(target: EventTarget): boolean {
  const nodeType = ((target: any): Node).nodeType;
  return (nodeType: any) && nodeType === ELEMENT_NODE;
}

export function isDOMDocument(target: EventTarget): boolean {
  const nodeType = ((target: any): Node).nodeType;
  return nodeType === DOCUMENT_NODE;
}

export function dispatchEventForPluginEventSystem(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
  targetContainer: null | EventTarget,
): void {
  let ancestorInst = targetInst;
  if (targetContainer !== null) {
    const possibleTargetContainerNode = ((targetContainer: any): Node);
    // Given the rootContainer can be any EventTarget, if the
    // target is not a valid DOM element then we'll skip this part.
    if (
      possibleTargetContainerNode === window ||
      !isDOMElement(possibleTargetContainerNode)
    ) {
      // TODO: useEvent for document and window
      return;
    }
    // If we detect the FB legacy primer system, we
    // defer the event to the null with a one
    // time event listener so we can defer the event.
    if (
      enableLegacyFBPrimerSupport &&
      willDeferLaterForFBLegacyPrimer(nativeEvent)
    ) {
      return;
    }
    // The below logic attempts to work out if we need to change
    // the target fiber to a different ancestor. We had similar logic
    // in the legacy event system, except the big difference between
    // systems is that the modern event system now has an event listener
    // attached to each React Root and React Portal Root. Together,
    // the DOM nodes representing these roots are the "rootContainer".
    // To figure out which ancestor instance we should use, we traverse
    // up the fiber tree from the target instance and attempt to find
    // root boundaries that match that of our current "rootContainer".
    // If we find that "rootContainer", we find the parent fiber
    // sub-tree for that root and make that our ancestor instance.
    let node = targetInst;

    while (true) {
      if (node === null) {
        return;
      }
      if (node.tag === HostRoot || node.tag === HostPortal) {
        const container = node.stateNode.containerInfo;
        if (isMatchingRootContainer(container, possibleTargetContainerNode)) {
          break;
        }
        if (node.tag === HostPortal) {
          // The target is a portal, but it's not the rootContainer we're looking for.
          // Normally portals handle their own events all the way down to the root.
          // So we should be able to stop now. However, we don't know if this portal
          // was part of *our* root.
          let grandNode = node.return;
          while (grandNode !== null) {
            if (grandNode.tag === HostRoot || grandNode.tag === HostPortal) {
              const grandContainer = grandNode.stateNode.containerInfo;
              if (
                isMatchingRootContainer(
                  grandContainer,
                  possibleTargetContainerNode,
                )
              ) {
                // This is the rootContainer we're looking for and we found it as
                // a parent of the Portal. That means we can ignore it because the
                // Portal will bubble through to us.
                return;
              }
            }
            grandNode = grandNode.return;
          }
        }
        const parentSubtreeInst = getClosestInstanceFromNode(container);
        if (parentSubtreeInst === null) {
          return;
        }
        node = ancestorInst = parentSubtreeInst;
        continue;
      }
      node = node.return;
    }
  }

  batchedEventUpdates(() =>
    dispatchEventsForPlugins(
      topLevelType,
      eventSystemFlags,
      nativeEvent,
      ancestorInst,
      targetContainer,
    ),
  );
}

function getNearestRootOrPortalContainer(instance: Element): Element {
  let node = getClosestInstanceFromNode(instance);
  while (node !== null) {
    const tag = node.tag;
    // Once we encounter a host container or root container
    // we can return their DOM instance.
    if (tag === HostRoot || tag === HostPortal) {
      return node.stateNode.containerInfo;
    }
    node = node.return;
  }
  return instance;
}

export function attachElementListener(listener: ReactDOMListener): void {
  const {event, target} = listener;
  const {passive, type} = event;
  let containerEventTarget = target;
  // If we the target is a managed React element, then we need to
  // find the nearest root/portal contained to attach the event listener
  // to. If it's not managed, i.e. the window, then we just attach
  // the listener to the target.
  if (isDOMElement(target)) {
    const possibleManagedTarget = ((target: any): Element);
    if (getClosestInstanceFromNode(possibleManagedTarget)) {
      containerEventTarget = getNearestRootOrPortalContainer(
        possibleManagedTarget,
      );
    }
  }
  const listenerMap = getListenerMapForElement(containerEventTarget);
  // Add the event listener to the target container (falling back to
  // the target if we didn't find one).
  listenToTopLevelEvent(
    ((type: any): DOMTopLevelEventType),
    containerEventTarget,
    listenerMap,
    passive,
  );
  // Get the internal listeners Set from the target instance.
  let listeners = getListenersFromTarget(target);
  // If we don't have any listeners, then we need to init them.
  if (listeners === null) {
    listeners = new Set();
    initListenersSet(target, listeners);
  }
  // Finally, add our listener to the listeners Set.
  listeners.add(listener);
}

export function detachElementListener(listener: ReactDOMListener): void {
  const {target} = listener;
  // Get the internal listeners Set from the target instance.
  const listeners = getListenersFromTarget(target);
  if (listeners !== null) {
    // Remove out listener from the listeners Set.
    listeners.delete(listener);
  }
}
