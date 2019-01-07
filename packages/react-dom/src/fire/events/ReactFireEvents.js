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
} from '../../events/EventListener';
import {
  getEventTarget,
  isEventSupported,
  normalizeEventName,
} from '../ReactFireUtils';
import {DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE} from '../ReactFireDOMConfig';
import {mediaEventTypes, interactiveEvents} from './ReactFireEventTypes';
import {batchedUpdates, interactiveUpdates} from '../ReactFireBatching';
import {
  getClosestFiberFromDOMNode,
  getDOMNodeFromFiber,
} from '../ReactFireInternal';
import {
  dispatchPolyfills,
  listenToPolyfilledEvent,
  polyfilledEvents,
} from './ReactFirePolyfilledEvents';
import {
  BLUR,
  CANCEL,
  CLOSE,
  ERROR,
  FOCUS,
  INVALID,
  LOAD,
  RESET,
  SCROLL,
  SUBMIT,
} from './ReactFireEventTypes';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {isFiberMounted} from 'react-reconciler/reflection';
import {getEventTargetAncestorFibers} from './ReactFireEventTraversal';
import {dispatchSimpleEvent} from './ReactFireSimpleEvents';

export type ProxyContext = {
  ancestors: Array<Fiber>,
  containerDomNode: Element | Document,
  defaultPrevented: false,
  eventName: string,
  eventTarget: Node | Document | Document | void | null,
  fiber: null | Fiber,
  nativeEvent: Event,
};

export type EventData = {
  handler: null | ((e: Event) => void),
  polyfills: Map<any, any>,
};

const topLevelDomNodeEvents: WeakMap<
  Document | Element | Node,
  Map<string, EventData>,
> = new WeakMap();

// TODO: can we stop exporting these?
let eventsEnabled = true;

export function setEventsEnabled(enabled: ?boolean) {
  eventsEnabled = !!enabled;
}

export function isEventsEnabled() {
  return eventsEnabled;
}

export function getDomNodeEventsMap(domNode: Document | Element | Node) {
  let domNodeEventsMap = topLevelDomNodeEvents.get(domNode);

  if (domNodeEventsMap === undefined) {
    domNodeEventsMap = (new Map(): Map<string, EventData>);
    topLevelDomNodeEvents.set(domNode, domNodeEventsMap);
  }
  return domNodeEventsMap;
}

function createEventData(): EventData {
  return {
    handler: null,
    polyfills: new Map(),
  };
}

export function listenTo(eventName: string, domNode: Element | Document) {
  let domNodeEventsMap = getDomNodeEventsMap(domNode);
  let eventWrapper = domNodeEventsMap.get(eventName);

  if (eventWrapper === undefined) {
    switch (eventName) {
      case SCROLL:
        trapCapturedEvent(SCROLL, domNode);
        break;
      case FOCUS:
      case BLUR:
        trapCapturedEvent(FOCUS, domNode);
        trapCapturedEvent(BLUR, domNode);
        domNodeEventsMap.set(FOCUS, createEventData());
        domNodeEventsMap.set(BLUR, createEventData());
        return;
      case CANCEL:
      case CLOSE:
        if (isEventSupported(eventName)) {
          trapCapturedEvent(eventName, domNode);
        }
        break;
      case INVALID:
      case SUBMIT:
      case RESET:
      case LOAD:
      case ERROR:
        // We listen to them on the target DOM elements.
        // Some of them bubble so we don't want them to fire twice.
        break;
      default:
        // By default, listen on the top level to all non-media events.
        // Media events don't bubble so adding the listener wouldn't do anything.
        const isMediaEvent = mediaEventTypes.has(eventName);
        if (!isMediaEvent) {
          trapBubbledEvent(eventName, domNode);
        }
        break;
    }
    domNodeEventsMap.set(eventName, createEventData());
  }
}

export function setEventProp(
  propName: string,
  eventPropValue: any,
  domNode: Document | Element,
) {
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
      eventData = createEventData();
      domNodeEventsMap.set(eventName, eventData);
    }
    eventData.handler = eventPropValue;
  }
}

function trapEvent(
  eventName: string,
  containerDomNode: Document | Element,
  bubbles: boolean,
) {
  const listener = interactiveEvents.has(eventName)
    ? proxyInteractiveListener
    : proxyListener;
  const boundListener = listener.bind(null, eventName, containerDomNode);

  if (bubbles) {
    addEventBubbleListener(containerDomNode, eventName, boundListener);
  } else {
    addEventCaptureListener(containerDomNode, eventName, boundListener);
  }
}

export function trapCapturedEvent(
  eventName: string,
  containerDomNode: Document | Element,
) {
  trapEvent(eventName, containerDomNode, false);
}

export function trapBubbledEvent(
  eventName: string,
  containerDomNode: Document | Element,
) {
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

function proxyInteractiveListener(
  eventName: string,
  containerDomNode: Document | Element,
  event: Event,
) {
  interactiveUpdates(proxyListener, eventName, containerDomNode, event);
}

function createProxyContext(
  containerDomNode: Document | Element,
  nativeEvent: Event,
  eventName: string,
  eventTarget: Element | Node | Document | null | void,
  ancestors: Array<Fiber>,
): ProxyContext {
  return {
    ancestors,
    containerDomNode,
    defaultPrevented: false,
    eventName,
    eventTarget,
    fiber: null,
    nativeEvent,
  };
}

function dispatchEvent(proxyContext: ProxyContext) {
  const {
    ancestors,
    containerDomNode,
    eventName,
    eventTarget,
    nativeEvent,
  } = proxyContext;
  if (ancestors.length === 0) {
    if (eventName === 'mouseout') {
      dispatchPolyfills(
        nativeEvent,
        eventName,
        containerDomNode,
        eventTarget,
        proxyContext,
      );
    }
    return;
  }
  for (let x = 0; x < ancestors.length; x++) {
    const ancestor = ancestors[x];
    const targetDomNode = getDOMNodeFromFiber(ancestor);
    proxyContext.fiber = ancestor;
    dispatchSimpleEvent(eventName, nativeEvent, proxyContext);
    // Then dispatch all polyfilled events (onChange, onBeforeInput etc).
    // Each polyfilled event has as its own event handler that provides the
    // dispatch mechanism to use.
    dispatchPolyfills(
      nativeEvent,
      eventName,
      containerDomNode,
      targetDomNode,
      proxyContext,
    );
  }
}

export function proxyListener(
  eventName: string,
  containerDomNode: Element | Document,
  nativeEvent: Event,
) {
  if (!eventsEnabled) {
    return;
  }
  const eventTarget = getEventTarget(nativeEvent);
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
    nativeEvent,
    eventName,
    eventTarget,
    ancestors,
  );

  batchedUpdates(dispatchEvent, proxyContext);
}

function noop() {}

export function trapClickOnNonInteractiveElement(domNode: HTMLElement) {
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
