/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  addEventBubbleListener,
  addEventCaptureListener,
  getEventTarget,
  isEventSupported,
  normalizeEventName,
} from './ReactFireUtils';
import {
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  interactiveEventNames,
} from './ReactFireDOMConfig';
import {mediaEventTypes} from './ReactFireEventTypes';
import {batchedUpdates, interactiveUpdates} from './ReactFireBatching';
import {
  getClosestFiberFromDOMNode,
  getDOMNodeFromFiber,
} from './ReactFireInternal';
import {
  dispatchPolyfills,
  listenToPolyfilledEvent,
  polyfilledEvents,
} from './polyfills/ReactFirePolyfilledEvents';
import {
  BLUR,
  CANCEL,
  CLICK,
  CLOSE,
  DOUBLE_CLICK,
  FOCUS,
  SCROLL,
} from './ReactFireEventTypes';
import {isFiberMounted} from 'react-reconciler/reflection';
import {
  getEventTargetAncestorFibers,
  traverseTwoPhase,
} from './ReactFireEventTraversal';

const topLevelDomNodeEvents = new WeakMap();

// TODO: can we stop exporting these?
export let eventsEnabled = true;

export function setEventsEnabled(enabled: ?boolean) {
  eventsEnabled = !!enabled;
}

export function isEventsEnabled() {
  return eventsEnabled;
}

export function getDomNodeEventsMap(domNode) {
  let domNodeEventsMap = topLevelDomNodeEvents.get(domNode);

  if (domNodeEventsMap === undefined) {
    domNodeEventsMap = new Map();
    topLevelDomNodeEvents.set(domNode, domNodeEventsMap);
  }
  return domNodeEventsMap;
}

export function listenTo(eventName: string, domNode: Element | Document) {
  let domNodeEventsMap = getDomNodeEventsMap(domNode);
  let eventWrapper = domNodeEventsMap.get(eventName);

  if (eventWrapper === undefined) {
    const eventData = {
      handler: null,
      polyfills: new Map(),
    };
    switch (eventName) {
      case SCROLL:
        trapCapturedEvent(SCROLL, domNode);
        break;
      case FOCUS:
      case BLUR:
        trapCapturedEvent(FOCUS, domNode);
        trapCapturedEvent(BLUR, domNode);
        break;
      case CANCEL:
      case CLOSE:
        if (isEventSupported(eventName)) {
          trapCapturedEvent(eventName, domNode);
        }
        break;
      case 'invalid':
      case 'submit':
      case 'reset':
      case 'load':
      case 'error':
        // We listen to them on the target DOM elements.
        // Some of them bubble so we don't want them to fire twice.
        break;
      default:
        // By default, listen on the top level to all non-media events.
        // Media events don't bubble so adding the listener wouldn't do anything.
        const isMediaEvent = mediaEventTypes.indexOf(eventName) !== -1;
        if (!isMediaEvent) {
          trapBubbledEvent(eventName, domNode);
        }
        break;
    }
    domNodeEventsMap.set(eventName, eventData);
  }
}

export function setEventProp(propName, eventPropValue, domNode) {
  const isPolyfilledEvent = polyfilledEvents.hasOwnProperty(propName);
  let eventName;
  if (isPolyfilledEvent) {
    eventName = `${propName}-polyfill`;
  } else {
    eventName = normalizeEventName(propName);
    const isCaptureEvent = propName.endsWith('Capture');
    if (isCaptureEvent) {
      eventName = `${eventName}-capture`;
    }
  }
  const domNodeEventsMap = getDomNodeEventsMap(domNode);
  let eventData = domNodeEventsMap.get(eventName);

  if (eventPropValue === null || eventPropValue === undefined) {
    if (eventData !== undefined) {
      eventData.handler = null;
    }
  } else {
    if (eventData === undefined) {
      eventData = {
        handler: eventPropValue,
        polyfills: new Map(),
      };
      domNodeEventsMap.set(eventName, eventData);
    } else {
      eventData.handler = eventPropValue;
    }
  }
}

function trapEvent(
  eventName: string,
  containerDomNode: Document | Element,
  bubbles: boolean,
) {
  const listener = interactiveEventNames.has(eventName)
    ? proxyInteractiveListener
    : proxyListener;
  const boundListener = listener.bind(null, eventName, containerDomNode);

  if (bubbles) {
    addEventBubbleListener(containerDomNode, eventName, boundListener);
  } else {
    addEventCaptureListener(containerDomNode, eventName, boundListener);
  }
}

export function trapCapturedEvent(eventName, containerDomNode) {
  trapEvent(eventName, containerDomNode, false);
}

export function trapBubbledEvent(eventName, containerDomNode) {
  trapEvent(eventName, containerDomNode, true);
}

export function ensureListeningTo(
  rootContainerElement: Document | Element,
  propName: string,
) {
  const isDocumentOrFragment =
    rootContainerElement.nodeType === DOCUMENT_NODE ||
    rootContainerElement.nodeType === DOCUMENT_FRAGMENT_NODE;
  const doc = isDocumentOrFragment
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
  const isPolyfilledEvent = polyfilledEvents.hasOwnProperty(propName);

  if (isPolyfilledEvent) {
    listenToPolyfilledEvent(doc, propName);
  } else {
    const eventName = normalizeEventName(propName);
    listenTo(eventName, doc);
  }
}

function proxyInteractiveListener(eventName, containerDomNode, event) {
  interactiveUpdates(proxyListener, eventName, containerDomNode, event);
}

function createProxyContext(
  containerDomNode,
  event,
  eventName,
  eventTarget,
  ancestors,
) {
  return {
    ancestors,
    containerDomNode,
    currentTarget: null,
    defaultPrevented: false,
    event,
    eventName,
    eventTarget,
    fiber: null,
    isClickEvent: eventName === CLICK || name === DOUBLE_CLICK,
  };
}

function dispatchEvent(proxyContext) {
  const {ancestors, containerDomNode, eventName, eventTarget} = proxyContext;
  if (ancestors.length === 0) {
    if (eventName === 'mouseout') {
      dispatchPolyfills(containerDomNode, eventTarget, proxyContext);
    }
    return;
  }
  for (let x = 0; x < ancestors.length; x++) {
    const ancestor = ancestors[x];
    const targetDomNode = getDOMNodeFromFiber(ancestor);
    proxyContext.fiber = ancestor;
    // Dispatch run all non-polyfilled events first using two phase traversal
    traverseTwoPhase(proxyContext);
    // Then dispatch all polyfilled events (onChange, onBeforeInput etc).
    // Each polyfilled event has as its own event handler that provides the
    // dispatch mechanism to use.
    dispatchPolyfills(containerDomNode, targetDomNode, proxyContext);
  }
}

export function proxyListener(eventName, containerDomNode, event) {
  if (!eventsEnabled) {
    return;
  }
  const eventTarget = getEventTarget(event);
  let targetFiber = getClosestFiberFromDOMNode(eventTarget);

  if (
    targetFiber !== null &&
    typeof targetFiber.tag === 'number' &&
    !isFiberMounted(targetFiber)
  ) {
    // If we get an event (ex: img onload) before committing that
    // component's mount, ignore it for now (that is, treat it as if it was an
    // event on a non-React tree). We might also consider queueing events and
    // dispatching them after the mount.
    targetFiber = null;
  }
  const ancestors = getEventTargetAncestorFibers(targetFiber);
  const proxyContext = createProxyContext(
    containerDomNode,
    event,
    eventName,
    eventTarget,
    ancestors,
  );

  monkeyPatchNativeEvent(event, proxyContext);
  batchedUpdates(dispatchEvent, proxyContext);
}

function stopPropagation() {
  this.cancelBubble = true;
  if (!this.immediatePropagationStopped) {
    this.stopImmediatePropagation();
  }
}

function monkeyPatchNativeEvent(event, proxyContext) {
  event.stopPropagation = stopPropagation;
  Object.defineProperty(event, 'currentTarget', {
    configurable: true,
    get() {
      return proxyContext.currentTarget;
    },
  });
  event.isDefaultPrevented = () => {
    return event.defaultPrevented || false;
  };
  event.isPropagationStopped = () => {
    return event.cancelBubble;
  };
  event.persist = noop;
  if (patchBrokenFirefoxClick(proxyContext, event)) {
    return;
  }
}

function patchBrokenFirefoxClick(proxyContext, event) {
  if (
    proxyContext.isClickEvent &&
    event.button !== undefined &&
    event.button !== 0
  ) {
    // Firefox incorrectly triggers click event for mid/right mouse buttons.
    // This bug has been active for 12 years.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=184051
    event.stopPropagation();
    return true;
  }
}

function noop() {}

export function trapClickOnNonInteractiveElement(domNode) {
  // Mobile Safari does not fire properly bubble click events on
  // non-interactive elements, which means delegated click listeners do not
  // fire. The workaround for this bug involves attaching an empty click
  // listener on the target node.
  // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  // Just set it using the onclick property so that we don't have to manage any
  // bookkeeping for it. Not sure if we need to clear it when the listener is
  // removed.
  // TODO: Only do this for the relevant Safaris maybe?
  domNode.onclick = noop;
}
