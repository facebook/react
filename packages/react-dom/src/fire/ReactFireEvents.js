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
} from '../events/EventListener';
import {
  getEventCharCode,
  getEventTarget,
  isEventSupported,
  normalizeEventName,
} from './ReactFireUtils';
import {DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE} from './ReactFireDOMConfig';
import {
  mediaEventTypes,
  interactiveEvents,
  nonInteractiveEvents,
  KEY_DOWN,
  KEY_UP,
} from './ReactFireEventTypes';
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
  ERROR,
  FOCUS,
  INVALID,
  KEY_PRESS,
  LOAD,
  RESET,
  SCROLL,
  SUBMIT,
  normalizeKey,
  translateToKey,
} from './ReactFireEventTypes';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {isFiberMounted} from 'react-reconciler/reflection';
import {
  getEventTargetAncestorFibers,
  traverseTwoPhase,
} from './ReactFireEventTraversal';

export type ProxyContext = {
  ancestors: Array<Fiber>,
  containerDomNode: Element | Document,
  currentTarget: Element | null | Node,
  defaultPrevented: false,
  event: Event,
  eventName: string,
  eventTarget: Node | Document | Document | void | null,
  fiber: null | Fiber,
};

export type EventData = {
  handler: null | ((e: Event) => void),
  polyfills: Map<any, any>,
};

const topLevelDomNodeEvents: WeakMap<
  Document | Element | Node,
  Map<string, EventData>,
> = new WeakMap();

const returnsFalse = () => false;
export const returnsTrue = () => true;

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
  event: Event,
  eventName: string,
  eventTarget: Element | Node | Document | null | void,
  ancestors: Array<Fiber>,
): ProxyContext {
  return {
    ancestors,
    containerDomNode,
    currentTarget: null,
    defaultPrevented: false,
    event,
    eventName,
    eventTarget,
    fiber: null,
  };
}

function dispatchSimpleEvent(eventName, proxyContext) {
  if (
    !nonInteractiveEvents.has(eventName) &&
    !interactiveEvents.has(eventName) &&
    !mediaEventTypes.has(eventName)
  ) {
    return null;
  }
  const event = proxyContext.event;
  if (eventName === KEY_PRESS) {
    if (getEventCharCode(event) === 0) {
      return null;
    }
  } else if (eventName === CLICK) {
    // Firefox creates a click event on right mouse clicks. This removes the
    // unwanted click events.
    if ((event: any).button === 2) {
      return null;
    }
  }
  traverseTwoPhase(proxyContext);
}

function dispatchEvent(proxyContext: ProxyContext) {
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
    dispatchSimpleEvent(eventName, proxyContext);
    // Then dispatch all polyfilled events (onChange, onBeforeInput etc).
    // Each polyfilled event has as its own event handler that provides the
    // dispatch mechanism to use.
    dispatchPolyfills(containerDomNode, targetDomNode, proxyContext);
  }
}

export function startEventPropagation(proxtContent: ProxyContext) {
  (proxtContent.event: any).isPropagationStopped = returnsFalse;
}

export function proxyListener(
  eventName: string,
  containerDomNode: Element | Document,
  event: Event,
) {
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

  monkeyPatchNativeEvent(eventName, event, proxyContext);
  batchedUpdates(dispatchEvent, proxyContext);
}

function monkeyPathNativeKeyboardEvent(eventName: string, event: Event) {
  const originalKey = (event: any).key;
  // $FlowFixMe: Flow complains we do not have value, we don't need it
  Object.defineProperty(event, 'key', {
    configurable: true,
    get() {
      if (originalKey) {
        // Normalize inconsistent values reported by browsers due to
        // implementations of a working draft specification.
    
        // FireFox implements `key` but returns `MozPrintableKey` for all
        // printable characters (normalized to `Unidentified`), ignore it.
        const key = normalizeKey[originalKey] || originalKey;
        if (key !== 'Unidentified') {
          return key;
        }
      }
      // Browser does not implement `key`, polyfill as much of it as we can.
      if (eventName === KEY_PRESS) {
        const charCode = getEventCharCode(event);

        // The enter-key is technically both printable and non-printable and can
        // thus be captured by `keypress`, no other non-printable key should.
        return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
      }
      if (eventName === KEY_DOWN || eventName === KEY_UP) {
        // While user keyboard layout determines the actual meaning of each
        // `keyCode` value, almost all function keys have a universal value.
        return translateToKey[(event: any).keyCode] || 'Unidentified';
      }
      return '';
    },
  });
}

function monkeyPatchNativeEvent(
  eventName: string,
  event: Event,
  proxyContext: ProxyContext,
) {
  const nativeStopPropagation = event.stopPropagation;
  (event: any).stopPropagation = () => {
    (event: any).isPropagationStopped = returnsTrue;
    nativeStopPropagation.call(event);
  };
  const nativePreventDefault = event.preventDefault;
  (event: any).preventDefault = () => {
    (event: any).isDefaultPrevented = returnsTrue;
    nativePreventDefault.call(event);
  };
  // $FlowFixMe: Flow complains we do not have value, we don't need it
  Object.defineProperty(event, 'currentTarget', {
    configurable: true,
    get() {
      return proxyContext.currentTarget;
    },
  });
  (event: any).isDefaultPrevented = () => {
    return event.defaultPrevented || false;
  };
  (event: any).isDefaultPrevented = returnsFalse;
  (event: any).persist = noop;
  (event: any).nativeEvent = event;
  if (
    eventName === KEY_PRESS ||
    eventName === KEY_DOWN ||
    eventName === KEY_UP
  ) {
    monkeyPathNativeKeyboardEvent(eventName, event);
  }
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
