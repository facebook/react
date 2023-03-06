/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';
import type {DOMEventName} from '../events/DOMEventNames';
import type {Fiber, FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {
  BoundingRect,
  IntersectionObserverOptions,
  ObserveVisibleRectsCallback,
} from 'react-reconciler/src/ReactTestSelectors';
import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {AncestorInfoDev} from './validateDOMNesting';

import {
  precacheFiberNode,
  updateFiberProps,
  getClosestInstanceFromNode,
  getFiberFromScopeInstance,
  getInstanceFromNode as getInstanceFromNodeDOMTree,
  isContainerMarkedAsRoot,
  detachDeletedInstance,
  isMarkedResource,
  markNodeAsResource,
} from './ReactDOMComponentTree';
export {detachDeletedInstance};
import {hasRole} from './DOMAccessibilityRoles';
import {
  createHTMLElement,
  createSVGElement,
  createMathElement,
  createTextNode,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  trapClickOnNonInteractiveElement,
  checkForUnmatchedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
  getOwnerDocumentFromRootContainer,
} from './ReactDOMComponent';
import {getSelectionInformation, restoreSelection} from './ReactInputSelection';
import setTextContent from './setTextContent';
import {validateDOMNesting, updatedAncestorInfoDev} from './validateDOMNesting';
import {
  isEnabled as ReactBrowserEventEmitterIsEnabled,
  setEnabled as ReactBrowserEventEmitterSetEnabled,
  getEventPriority,
} from '../events/ReactDOMEventListener';
import {
  getChildNamespace,
  SVG_NAMESPACE,
  MATH_NAMESPACE,
  HTML_NAMESPACE,
} from '../shared/DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';
import dangerousStyleValue from '../shared/dangerousStyleValue';

import {retryIfBlockedOn} from '../events/ReactDOMEventReplaying';

import {
  enableCreateEventHandleAPI,
  enableScopeAPI,
  enableFloat,
  enableHostSingletons,
} from 'shared/ReactFeatureFlags';
import {
  HostComponent,
  HostHoistable,
  HostText,
  HostSingleton,
} from 'react-reconciler/src/ReactWorkTags';
import {listenToAllSupportedEvents} from '../events/DOMPluginEventSystem';

import {DefaultEventPriority} from 'react-reconciler/src/ReactEventPriorities';

// TODO: Remove this deep import when we delete the legacy root API
import {ConcurrentMode, NoMode} from 'react-reconciler/src/ReactTypeOfMode';

import {
  prepareToRenderResources,
  cleanupAfterRenderResources,
} from './ReactDOMFloatClient';
import {validateLinkPropsForStyleResource} from '../shared/ReactDOMResourceValidation';

export type Type = string;
export type Props = {
  autoFocus?: boolean,
  children?: mixed,
  disabled?: boolean,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
  dangerouslySetInnerHTML?: mixed,
  style?: {display?: string, ...},
  bottom?: null | number,
  left?: null | number,
  right?: null | number,
  top?: null | number,
  ...
};
type RawProps = {
  [string]: mixed,
};
export type EventTargetChildElement = {
  type: string,
  props: null | {
    style?: {
      position?: string,
      zIndex?: number,
      bottom?: string,
      left?: string,
      right?: string,
      top?: string,
      ...
    },
    ...
  },
  ...
};
export type Container =
  | interface extends Element {_reactRootContainer?: FiberRoot}
  | interface extends Document {_reactRootContainer?: FiberRoot}
  | interface extends DocumentFragment {_reactRootContainer?: FiberRoot};
export type Instance = Element;
export type TextInstance = Text;
export type {HoistableRoot} from './ReactDOMFloatClient';
export interface SuspenseInstance extends Comment {
  _reactRetry?: () => void;
}
export type HydratableInstance = Instance | TextInstance | SuspenseInstance;
export type PublicInstance = Element | Text;
type HostContextDev = {
  namespace: HostContextProd,
  ancestorInfo: AncestorInfoDev,
};
type HostContextProd = string;
export type HostContext = HostContextDev | HostContextProd;
export type UpdatePayload = Array<mixed>;
export type ChildSet = void; // Unused
export type TimeoutHandle = TimeoutID;
export type NoTimeout = -1;
export type RendererInspectionConfig = $ReadOnly<{}>;

type SelectionInformation = {
  focusedElem: null | HTMLElement,
  selectionRange: mixed,
};

const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';

const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';

const STYLE = 'style';

let eventsEnabled: ?boolean = null;
let selectionInformation: null | SelectionInformation = null;

export * from 'react-reconciler/src/ReactFiberHostConfigWithNoPersistence';

export function getRootHostContext(
  rootContainerInstance: Container,
): HostContext {
  let type;
  let namespace: HostContextProd;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
      const root = (rootContainerInstance: any).documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
      break;
    }
    default: {
      const container: any =
        nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
      namespace = getChildNamespace(ownNamespace, type);
      break;
    }
  }
  if (__DEV__) {
    const validatedTag = type.toLowerCase();
    const ancestorInfo = updatedAncestorInfoDev(null, validatedTag);
    return {namespace, ancestorInfo};
  }
  return namespace;
}

export function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
): HostContext {
  if (__DEV__) {
    const parentHostContextDev = ((parentHostContext: any): HostContextDev);
    const namespace = getChildNamespace(parentHostContextDev.namespace, type);
    const ancestorInfo = updatedAncestorInfoDev(
      parentHostContextDev.ancestorInfo,
      type,
    );
    return {namespace, ancestorInfo};
  }
  const parentNamespace = ((parentHostContext: any): HostContextProd);
  return getChildNamespace(parentNamespace, type);
}

export function getPublicInstance(instance: Instance): Instance {
  return instance;
}

export function prepareForCommit(containerInfo: Container): Object | null {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation();
  let activeInstance = null;
  if (enableCreateEventHandleAPI) {
    const focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      activeInstance = getClosestInstanceFromNode(focusedElem);
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}

export function beforeActiveInstanceBlur(internalInstanceHandle: Object): void {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchBeforeDetachedBlur(
      (selectionInformation: any).focusedElem,
      internalInstanceHandle,
    );
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function afterActiveInstanceBlur(): void {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchAfterDetachedBlur((selectionInformation: any).focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function resetAfterCommit(containerInfo: Container): void {
  restoreSelection(selectionInformation);
  ReactBrowserEventEmitterSetEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
}

export function createHoistableInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  internalInstanceHandle: Object,
): Instance {
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );
  const domElement: Instance = createHTMLElement(type, props, ownerDocument);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  setInitialProperties(domElement, type, props);
  markNodeAsResource(domElement);
  return domElement;
}

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): Instance {
  let namespace;
  if (__DEV__) {
    // TODO: take namespace into account when validating.
    const hostContextDev: HostContextDev = (hostContext: any);
    validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    if (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    ) {
      const string = '' + props.children;
      const ownAncestorInfo = updatedAncestorInfoDev(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
    namespace = hostContextDev.namespace;
  } else {
    const hostContextProd: HostContextProd = (hostContext: any);
    namespace = hostContextProd;
  }

  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );

  let domElement: Instance;
  create: switch (namespace) {
    case SVG_NAMESPACE:
      domElement = createSVGElement(type, ownerDocument);
      break;
    case MATH_NAMESPACE:
      domElement = createMathElement(type, ownerDocument);
      break;
    case HTML_NAMESPACE:
      switch (type) {
        case 'svg':
          domElement = createSVGElement(type, ownerDocument);
          break create;
        case 'math':
          domElement = createMathElement(type, ownerDocument);
          break create;
      }
    // eslint-disable-next-line no-fallthrough
    default:
      domElement = createHTMLElement(type, props, ownerDocument);
  }
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}

export function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props,
  hostContext: HostContext,
): boolean {
  setInitialProperties(domElement, type, props);
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
    case 'img':
      return true;
    default:
      return false;
  }
}

export function prepareUpdate(
  domElement: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  hostContext: HostContext,
): null | Array<mixed> {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    if (
      typeof newProps.children !== typeof oldProps.children &&
      (typeof newProps.children === 'string' ||
        typeof newProps.children === 'number')
    ) {
      const string = '' + newProps.children;
      const ownAncestorInfo = updatedAncestorInfoDev(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
  }
  return diffProperties(domElement, type, oldProps, newProps);
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === 'textarea' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function createTextInstance(
  text: string,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): TextInstance {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    validateDOMNesting(null, text, hostContextDev.ancestorInfo);
  }
  const textNode: TextInstance = createTextNode(text, rootContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

export function getCurrentEventPriority(): EventPriority {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}

export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout: any =
  typeof setTimeout === 'function' ? setTimeout : (undefined: any);
export const cancelTimeout: any =
  typeof clearTimeout === 'function' ? clearTimeout : (undefined: any);
export const noTimeout = -1;
const localPromise = typeof Promise === 'function' ? Promise : undefined;
const localRequestAnimationFrame =
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : scheduleTimeout;

export function getInstanceFromNode(node: HTMLElement): null | Object {
  return getClosestInstanceFromNode(node) || null;
}

export function preparePortalMount(portalInstance: Instance): void {
  listenToAllSupportedEvents(portalInstance);
}

export function prepareScopeUpdate(
  scopeInstance: ReactScopeInstance,
  internalInstanceHandle: Object,
): void {
  if (enableScopeAPI) {
    precacheFiberNode(internalInstanceHandle, scopeInstance);
  }
}

export function getInstanceFromScope(
  scopeInstance: ReactScopeInstance,
): null | Object {
  if (enableScopeAPI) {
    return getFiberFromScopeInstance(scopeInstance);
  }
  return null;
}

// -------------------
//     Microtasks
// -------------------
export const supportsMicrotasks = true;
export const scheduleMicrotask: any =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof localPromise !== 'undefined'
    ? callback =>
        localPromise.resolve(null).then(callback).catch(handleErrorInNextTick)
    : scheduleTimeout; // TODO: Determine the best fallback here.

function handleErrorInNextTick(error: any) {
  setTimeout(() => {
    throw error;
  });
}

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function commitMount(
  domElement: Instance,
  type: string,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      if (newProps.autoFocus) {
        ((domElement: any):
          | HTMLButtonElement
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement).focus();
      }
      return;
    case 'img': {
      if ((newProps: any).src) {
        ((domElement: any): HTMLImageElement).src = (newProps: any).src;
      }
      return;
    }
  }
}

export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
}

export function resetTextContent(domElement: Instance): void {
  setTextContent(domElement, '');
}

export function commitTextUpdate(
  textInstance: TextInstance,
  oldText: string,
  newText: string,
): void {
  textInstance.nodeValue = newText;
}

export function appendChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}

export function appendChildToContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = (container.parentNode: any);
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
  // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918
  const reactRootContainer = container._reactRootContainer;
  if (
    (reactRootContainer === null || reactRootContainer === undefined) &&
    parentNode.onclick === null
  ) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(((parentNode: any): HTMLElement));
  }
}

export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance,
): void {
  parentInstance.insertBefore(child, beforeChild);
}

export function insertInContainerBefore(
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

function createEvent(type: DOMEventName, bubbles: boolean): Event {
  const event = document.createEvent('Event');
  event.initEvent(((type: any): string), bubbles, false);
  return event;
}

function dispatchBeforeDetachedBlur(
  target: HTMLElement,
  internalInstanceHandle: Object,
): void {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('beforeblur', true);
    // Dispatch "beforeblur" directly on the target,
    // so it gets picked up by the event system and
    // can propagate through the React internal tree.
    // $FlowFixMe: internal field
    event._detachedInterceptFiber = internalInstanceHandle;
    target.dispatchEvent(event);
  }
}

function dispatchAfterDetachedBlur(target: HTMLElement): void {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('afterblur', false);
    // So we know what was detached, make the relatedTarget the
    // detached target on the "afterblur" event.
    (event: any).relatedTarget = target;
    // Dispatch the event on the document.
    document.dispatchEvent(event);
  }
}

export function removeChild(
  parentInstance: Instance,
  child: Instance | TextInstance | SuspenseInstance,
): void {
  parentInstance.removeChild(child);
}

export function removeChildFromContainer(
  container: Container,
  child: Instance | TextInstance | SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).removeChild(child);
  } else {
    container.removeChild(child);
  }
}

export function clearSuspenseBoundary(
  parentInstance: Instance,
  suspenseInstance: SuspenseInstance,
): void {
  let node: Node = suspenseInstance;
  // Delete all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  do {
    const nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && nextNode.nodeType === COMMENT_NODE) {
      const data = ((nextNode: any).data: string);
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          parentInstance.removeChild(nextNode);
          // Retry if any event replaying was blocked on this.
          retryIfBlockedOn(suspenseInstance);
          return;
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA
      ) {
        depth++;
      }
    }
    // $FlowFixMe[incompatible-type] we bail out when we get a null
    node = nextNode;
  } while (node);
  // TODO: Warn, we didn't find the end comment boundary.
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

export function clearSuspenseBoundaryFromContainer(
  container: Container,
  suspenseInstance: SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    clearSuspenseBoundary((container.parentNode: any), suspenseInstance);
  } else if (container.nodeType === ELEMENT_NODE) {
    clearSuspenseBoundary((container: any), suspenseInstance);
  } else {
    // Document nodes should never contain suspense boundaries.
  }
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function hideInstance(instance: Instance): void {
  // TODO: Does this work for all element types? What about MathML? Should we
  // pass host context to this method?
  instance = ((instance: any): HTMLElement);
  const style = instance.style;
  // $FlowFixMe[method-unbinding]
  if (typeof style.setProperty === 'function') {
    style.setProperty('display', 'none', 'important');
  } else {
    style.display = 'none';
  }
}

export function hideTextInstance(textInstance: TextInstance): void {
  textInstance.nodeValue = '';
}

export function unhideInstance(instance: Instance, props: Props): void {
  instance = ((instance: any): HTMLElement);
  const styleProp = props[STYLE];
  const display =
    styleProp !== undefined &&
    styleProp !== null &&
    styleProp.hasOwnProperty('display')
      ? styleProp.display
      : null;
  instance.style.display = dangerousStyleValue('display', display);
}

export function unhideTextInstance(
  textInstance: TextInstance,
  text: string,
): void {
  textInstance.nodeValue = text;
}

export function clearContainer(container: Container): void {
  if (enableHostSingletons) {
    const nodeType = container.nodeType;
    if (nodeType === DOCUMENT_NODE) {
      clearContainerSparingly(container);
    } else if (nodeType === ELEMENT_NODE) {
      switch (container.nodeName) {
        case 'HEAD':
        case 'HTML':
        case 'BODY':
          clearContainerSparingly(container);
          return;
        default: {
          container.textContent = '';
        }
      }
    }
  } else {
    if (container.nodeType === ELEMENT_NODE) {
      // We have refined the container to Element type
      const element: Element = (container: any);
      element.textContent = '';
    } else if (container.nodeType === DOCUMENT_NODE) {
      // We have refined the container to Document type
      const doc: Document = (container: any);
      if (doc.documentElement) {
        doc.removeChild(doc.documentElement);
      }
    }
  }
}

function clearContainerSparingly(container: Node) {
  let node;
  let nextNode: ?Node = container.firstChild;
  if (nextNode && nextNode.nodeType === DOCUMENT_TYPE_NODE) {
    nextNode = nextNode.nextSibling;
  }
  while (nextNode) {
    node = nextNode;
    nextNode = nextNode.nextSibling;
    switch (node.nodeName) {
      case 'HTML':
      case 'HEAD':
      case 'BODY': {
        const element: Element = (node: any);
        clearContainerSparingly(element);
        // If these singleton instances had previously been rendered with React they
        // may still hold on to references to the previous fiber tree. We detatch them
        // prospectively to reset them to a baseline starting state since we cannot create
        // new instances.
        detachDeletedInstance(element);
        continue;
      }
      case 'STYLE': {
        continue;
      }
      case 'LINK': {
        if (((node: any): HTMLLinkElement).rel.toLowerCase() === 'stylesheet') {
          continue;
        }
      }
    }
    container.removeChild(node);
  }
  return;
}

// Making this so we can eventually move all of the instance caching to the commit phase.
// Currently this is only used to associate fiber and props to instances for hydrating
// HostSingletons. The reason we need it here is we only want to make this binding on commit
// because only one fiber can own the instance at a time and render can fail/restart
export function bindInstance(
  instance: Instance,
  props: Props,
  internalInstanceHandle: mixed,
) {
  precacheFiberNode((internalInstanceHandle: any), instance);
  updateFiberProps(instance, props);
}

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

// With Resources, some HostComponent types will never be server rendered and need to be
// inserted without breaking hydration
export function isHydratableType(type: string, props: Props): boolean {
  if (enableFloat) {
    if (type === 'script') {
      const {async, onLoad, onError} = (props: any);
      return !(async && (onLoad || onError));
    }
    return true;
  } else {
    return true;
  }
}
export function isHydratableText(text: string): boolean {
  return text !== '';
}

export function shouldSkipHydratableForInstance(
  instance: HydratableInstance,
  type: string,
  props: Props,
): boolean {
  if (instance.nodeType !== ELEMENT_NODE) {
    // This is a suspense boundary or Text node.
    // Suspense Boundaries are never expected to be injected by 3rd parties. If we see one it should be matched
    // and this is a hydration error.
    // Text Nodes are also not expected to be injected by 3rd parties. This is less of a guarantee for <body>
    // but it seems reasonable and conservative to reject this as a hydration error as well
    return false;
  } else if (
    instance.nodeName.toLowerCase() !== type.toLowerCase() ||
    isMarkedResource(instance)
  ) {
    // We are either about to
    return true;
  } else {
    // We have an Element with the right type.
    const element: Element = (instance: any);
    const anyProps = (props: any);

    // We are going to try to exclude it if we can definitely identify it as a hoisted Node or if
    // we can guess that the node is likely hoisted or was inserted by a 3rd party script or browser extension
    // using high entropy attributes for certain types. This technique will fail for strange insertions like
    // extension prepending <div> in the <body> but that already breaks before and that is an edge case.
    switch (type) {
      // case 'title':
      //We assume all titles are matchable. You should only have one in the Document, at least in a hoistable scope
      // and if you are a HostComponent with type title we must either be in an <svg> context or this title must have an `itemProp` prop.
      case 'meta': {
        // The only way to opt out of hoisting meta tags is to give it an itemprop attribute. We assume there will be
        // not 3rd party meta tags that are prepended, accepting the cases where this isn't true because meta tags
        // are usually only functional for SSR so even in a rare case where we did bind to an injected tag the runtime
        // implications are minimal
        if (!element.hasAttribute('itemprop')) {
          // This is a Hoistable
          return true;
        }
        break;
      }
      case 'link': {
        // Links come in many forms and we do expect 3rd parties to inject them into <head> / <body>. We exclude known resources
        // and then use high-entroy attributes like href which are almost always used and almost always unique to filter out unlikely
        // matches.
        const rel = element.getAttribute('rel');
        if (rel === 'stylesheet' && element.hasAttribute('data-precedence')) {
          // This is a stylesheet resource
          return true;
        } else if (
          rel !== anyProps.rel ||
          element.getAttribute('href') !==
            (anyProps.href == null ? null : anyProps.href) ||
          element.getAttribute('crossorigin') !==
            (anyProps.crossOrigin == null ? null : anyProps.crossOrigin) ||
          element.getAttribute('title') !==
            (anyProps.title == null ? null : anyProps.title)
        ) {
          // rel + href should usually be enough to uniquely identify a link however crossOrigin can vary for rel preconnect
          // and title could vary for rel alternate
          return true;
        }
        break;
      }
      case 'style': {
        // Styles are hard to match correctly. We can exclude known resources but otherwise we accept the fact that a non-hoisted style tags
        // in <head> or <body> are likely never going to be unmounted given their position in the document and the fact they likely hold global styles
        if (element.hasAttribute('data-precedence')) {
          // This is a style resource
          return true;
        }
        break;
      }
      case 'script': {
        // Scripts are a little tricky, we exclude known resources and then similar to links try to use high-entropy attributes
        // to reject poor matches. One challenge with scripts are inline scripts. We don't attempt to check text content which could
        // in theory lead to a hydration error later if a 3rd party injected an inline script before the React rendered nodes.
        // Falling back to client rendering if this happens should be seemless though so we will try this hueristic and revisit later
        // if we learn it is problematic
        const srcAttr = element.getAttribute('src');
        if (
          srcAttr &&
          element.hasAttribute('async') &&
          !element.hasAttribute('itemprop')
        ) {
          // This is an async script resource
          return true;
        } else if (
          srcAttr !== (anyProps.src == null ? null : anyProps.src) ||
          element.getAttribute('type') !==
            (anyProps.type == null ? null : anyProps.type) ||
          element.getAttribute('crossorigin') !==
            (anyProps.crossOrigin == null ? null : anyProps.crossOrigin)
        ) {
          // This script is for a different src
          return true;
        }
        break;
      }
    }
    // We have excluded the most likely cases of mismatch between hoistable tags, 3rd party script inserted tags,
    // and browser extension inserted tags. While it is possible this is not the right match it is a decent hueristic
    // that should work in the vast majority of cases.
    return false;
  }
}

export function shouldSkipHydratableForTextInstance(
  instance: HydratableInstance,
): boolean {
  return instance.nodeType === ELEMENT_NODE;
}

export function shouldSkipHydratableForSuspenseInstance(
  instance: HydratableInstance,
): boolean {
  return instance.nodeType === ELEMENT_NODE;
}

export function canHydrateInstance(
  instance: HydratableInstance,
  type: string,
  props: Props,
): null | Instance {
  if (
    instance.nodeType !== ELEMENT_NODE ||
    instance.nodeName.toLowerCase() !== type.toLowerCase()
  ) {
    return null;
  } else {
    return ((instance: any): Instance);
  }
}

export function canHydrateTextInstance(
  instance: HydratableInstance,
  text: string,
): null | TextInstance {
  if (text === '') return null;

  if (instance.nodeType !== TEXT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a text node.
  return ((instance: any): TextInstance);
}

export function canHydrateSuspenseInstance(
  instance: HydratableInstance,
): null | SuspenseInstance {
  if (instance.nodeType !== COMMENT_NODE) {
    return null;
  }
  // This has now been refined to a suspense node.
  return ((instance: any): SuspenseInstance);
}

export function isSuspenseInstancePending(instance: SuspenseInstance): boolean {
  return instance.data === SUSPENSE_PENDING_START_DATA;
}

export function isSuspenseInstanceFallback(
  instance: SuspenseInstance,
): boolean {
  return instance.data === SUSPENSE_FALLBACK_START_DATA;
}

export function getSuspenseInstanceFallbackErrorDetails(
  instance: SuspenseInstance,
): {digest: ?string, message?: string, stack?: string} {
  const dataset =
    instance.nextSibling && ((instance.nextSibling: any): HTMLElement).dataset;
  let digest, message, stack;
  if (dataset) {
    digest = dataset.dgst;
    if (__DEV__) {
      message = dataset.msg;
      stack = dataset.stck;
    }
  }
  if (__DEV__) {
    return {
      message,
      digest,
      stack,
    };
  } else {
    // Object gets DCE'd if constructed in tail position and matches callsite destructuring
    return {
      digest,
    };
  }
}

export function registerSuspenseInstanceRetry(
  instance: SuspenseInstance,
  callback: () => void,
) {
  instance._reactRetry = callback;
}

function getNextHydratable(node: ?Node) {
  // Skip non-hydratable nodes.
  for (; node != null; node = ((node: any): Node).nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
    if (nodeType === COMMENT_NODE) {
      const nodeData = (node: any).data;
      if (
        nodeData === SUSPENSE_START_DATA ||
        nodeData === SUSPENSE_FALLBACK_START_DATA ||
        nodeData === SUSPENSE_PENDING_START_DATA
      ) {
        break;
      }
      if (nodeData === SUSPENSE_END_DATA) {
        return null;
      }
    }
  }
  return (node: any);
}

export function getNextHydratableSibling(
  instance: HydratableInstance,
): null | HydratableInstance {
  return getNextHydratable(instance.nextSibling);
}

export function getFirstHydratableChild(
  parentInstance: Instance,
): null | HydratableInstance {
  return getNextHydratable(parentInstance.firstChild);
}

export function getFirstHydratableChildWithinContainer(
  parentContainer: Container,
): null | HydratableInstance {
  return getNextHydratable(parentContainer.firstChild);
}

export function getFirstHydratableChildWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
): null | HydratableInstance {
  return getNextHydratable(parentInstance.nextSibling);
}

export function hydrateInstance(
  instance: Instance,
  type: string,
  props: Props,
  hostContext: HostContext,
  internalInstanceHandle: Object,
  shouldWarnDev: boolean,
): null | Array<mixed> {
  precacheFiberNode(internalInstanceHandle, instance);
  // TODO: Possibly defer this until the commit phase where all the events
  // get attached.
  updateFiberProps(instance, props);

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode =
    ((internalInstanceHandle: Fiber).mode & ConcurrentMode) !== NoMode;

  let parentNamespace;
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    parentNamespace = hostContextDev.namespace;
  } else {
    const hostContextProd = ((hostContext: any): HostContextProd);
    parentNamespace = hostContextProd;
  }

  return diffHydratedProperties(
    instance,
    type,
    props,
    isConcurrentMode,
    shouldWarnDev,
    parentNamespace,
  );
}

export function hydrateTextInstance(
  textInstance: TextInstance,
  text: string,
  internalInstanceHandle: Object,
  shouldWarnDev: boolean,
): boolean {
  precacheFiberNode(internalInstanceHandle, textInstance);

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode =
    ((internalInstanceHandle: Fiber).mode & ConcurrentMode) !== NoMode;

  return diffHydratedText(textInstance, text, isConcurrentMode);
}

export function hydrateSuspenseInstance(
  suspenseInstance: SuspenseInstance,
  internalInstanceHandle: Object,
) {
  precacheFiberNode(internalInstanceHandle, suspenseInstance);
}

export function getNextHydratableInstanceAfterSuspenseInstance(
  suspenseInstance: SuspenseInstance,
): null | HydratableInstance {
  let node = suspenseInstance.nextSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node: any).data: string);
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          return getNextHydratableSibling((node: any));
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        depth++;
      }
    }
    node = node.nextSibling;
  }
  // TODO: Warn, we didn't find the end comment boundary.
  return null;
}

// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
export function getParentSuspenseInstance(
  targetInstance: Node,
): null | SuspenseInstance {
  let node = targetInstance.previousSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node: any).data: string);
      if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        if (depth === 0) {
          return ((node: any): SuspenseInstance);
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_END_DATA) {
        depth++;
      }
    }
    node = node.previousSibling;
  }
  return null;
}

export function commitHydratedContainer(container: Container): void {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function commitHydratedSuspenseInstance(
  suspenseInstance: SuspenseInstance,
): void {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

// @TODO remove this function once float lands and hydrated tail nodes
// are controlled by HostSingleton fibers
export function shouldDeleteUnhydratedTailInstances(
  parentType: string,
): boolean {
  return parentType !== 'head' && parentType !== 'body';
}

export function didNotMatchHydratedContainerTextInstance(
  parentContainer: Container,
  textInstance: TextInstance,
  text: string,
  isConcurrentMode: boolean,
  shouldWarnDev: boolean,
) {
  checkForUnmatchedText(
    textInstance.nodeValue,
    text,
    isConcurrentMode,
    shouldWarnDev,
  );
}

export function didNotMatchHydratedTextInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  textInstance: TextInstance,
  text: string,
  isConcurrentMode: boolean,
  shouldWarnDev: boolean,
) {
  if (parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    checkForUnmatchedText(
      textInstance.nodeValue,
      text,
      isConcurrentMode,
      shouldWarnDev,
    );
  }
}

export function didNotHydrateInstanceWithinContainer(
  parentContainer: Container,
  instance: HydratableInstance,
) {
  if (__DEV__) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentContainer, (instance: any));
    } else if (instance.nodeType === COMMENT_NODE) {
      // TODO: warnForDeletedHydratableSuspenseBoundary
    } else {
      warnForDeletedHydratableText(parentContainer, (instance: any));
    }
  }
}

export function didNotHydrateInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
  instance: HydratableInstance,
) {
  if (__DEV__) {
    // $FlowFixMe: Only Element or Document can be parent nodes.
    const parentNode: Element | Document | null = parentInstance.parentNode;
    if (parentNode !== null) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentNode, (instance: any));
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentNode, (instance: any));
      }
    }
  }
}

export function didNotHydrateInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  instance: HydratableInstance,
  isConcurrentMode: boolean,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentInstance, (instance: any));
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentInstance, (instance: any));
      }
    }
  }
}

export function didNotFindHydratableInstanceWithinContainer(
  parentContainer: Container,
  type: string,
  props: Props,
) {
  if (__DEV__) {
    warnForInsertedHydratedElement(parentContainer, type, props);
  }
}

export function didNotFindHydratableTextInstanceWithinContainer(
  parentContainer: Container,
  text: string,
) {
  if (__DEV__) {
    warnForInsertedHydratedText(parentContainer, text);
  }
}

export function didNotFindHydratableSuspenseInstanceWithinContainer(
  parentContainer: Container,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentContainer);
  }
}

export function didNotFindHydratableInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
  type: string,
  props: Props,
) {
  if (__DEV__) {
    // $FlowFixMe: Only Element or Document can be parent nodes.
    const parentNode: Element | Document | null = parentInstance.parentNode;
    if (parentNode !== null)
      warnForInsertedHydratedElement(parentNode, type, props);
  }
}

export function didNotFindHydratableTextInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
  text: string,
) {
  if (__DEV__) {
    // $FlowFixMe: Only Element or Document can be parent nodes.
    const parentNode: Element | Document | null = parentInstance.parentNode;
    if (parentNode !== null) warnForInsertedHydratedText(parentNode, text);
  }
}

export function didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
) {
  if (__DEV__) {
    // const parentNode: Element | Document | null = parentInstance.parentNode;
    // TODO: warnForInsertedHydratedSuspense(parentNode);
  }
}

export function didNotFindHydratableInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  type: string,
  props: Props,
  isConcurrentMode: boolean,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedElement(parentInstance, type, props);
    }
  }
}

export function didNotFindHydratableTextInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  text: string,
  isConcurrentMode: boolean,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedText(parentInstance, text);
    }
  }
}

export function didNotFindHydratableSuspenseInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentInstance);
  }
}

export function errorHydratingContainer(parentContainer: Container): void {
  if (__DEV__) {
    // TODO: This gets logged by onRecoverableError, too, so we should be
    // able to remove it.
    console.error(
      'An error occurred during hydration. The server HTML was replaced with client content in <%s>.',
      parentContainer.nodeName.toLowerCase(),
    );
  }
}

// -------------------
//     Test Selectors
// -------------------

export const supportsTestSelectors = true;

export function findFiberRoot(node: Instance): null | FiberRoot {
  const stack = [node];
  let index = 0;
  while (index < stack.length) {
    const current = stack[index++];
    if (isContainerMarkedAsRoot(current)) {
      return ((getInstanceFromNodeDOMTree(current): any): FiberRoot);
    }
    stack.push(...current.children);
  }
  return null;
}

export function getBoundingRect(node: Instance): BoundingRect {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function matchAccessibilityRole(node: Instance, role: string): boolean {
  if (hasRole(node, role)) {
    return true;
  }

  return false;
}

export function getTextContent(fiber: Fiber): string | null {
  switch (fiber.tag) {
    case HostHoistable:
    case HostSingleton:
    case HostComponent:
      let textContent = '';
      const childNodes = fiber.stateNode.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          textContent += childNode.textContent;
        }
      }
      return textContent;
    case HostText:
      return fiber.stateNode.textContent;
  }

  return null;
}

export function isHiddenSubtree(fiber: Fiber): boolean {
  return fiber.tag === HostComponent && fiber.memoizedProps.hidden === true;
}

export function setFocusIfFocusable(node: Instance): boolean {
  // The logic for determining if an element is focusable is kind of complex,
  // and since we want to actually change focus anyway- we can just skip it.
  // Instead we'll just listen for a "focus" event to verify that focus was set.
  //
  // We could compare the node to document.activeElement after focus,
  // but this would not handle the case where application code managed focus to automatically blur.
  let didFocus = false;
  const handleFocus = () => {
    didFocus = true;
  };

  const element = ((node: any): HTMLElement);
  try {
    element.addEventListener('focus', handleFocus);
    // $FlowFixMe[method-unbinding]
    (element.focus || HTMLElement.prototype.focus).call(element);
  } finally {
    element.removeEventListener('focus', handleFocus);
  }

  return didFocus;
}

type RectRatio = {
  ratio: number,
  rect: BoundingRect,
};

export function setupIntersectionObserver(
  targets: Array<Instance>,
  callback: ObserveVisibleRectsCallback,
  options?: IntersectionObserverOptions,
): {
  disconnect: () => void,
  observe: (instance: Instance) => void,
  unobserve: (instance: Instance) => void,
} {
  const rectRatioCache: Map<Instance, RectRatio> = new Map();
  targets.forEach(target => {
    rectRatioCache.set(target, {
      rect: getBoundingRect(target),
      ratio: 0,
    });
  });

  const handleIntersection = (entries: Array<IntersectionObserverEntry>) => {
    entries.forEach(entry => {
      const {boundingClientRect, intersectionRatio, target} = entry;
      rectRatioCache.set(target, {
        rect: {
          x: boundingClientRect.left,
          y: boundingClientRect.top,
          width: boundingClientRect.width,
          height: boundingClientRect.height,
        },
        ratio: intersectionRatio,
      });
    });

    callback(Array.from(rectRatioCache.values()));
  };

  const observer = new IntersectionObserver(handleIntersection, options);
  targets.forEach(target => {
    observer.observe((target: any));
  });

  return {
    disconnect: () => observer.disconnect(),
    observe: target => {
      rectRatioCache.set(target, {
        rect: getBoundingRect(target),
        ratio: 0,
      });
      observer.observe((target: any));
    },
    unobserve: target => {
      rectRatioCache.delete(target);
      observer.unobserve((target: any));
    },
  };
}

export function requestPostPaintCallback(callback: (time: number) => void) {
  localRequestAnimationFrame(() => {
    localRequestAnimationFrame(time => callback(time));
  });
}
// -------------------
//     Resources
// -------------------

export const supportsResources = true;

export function isHostHoistableType(
  type: string,
  props: RawProps,
  hostContext: HostContext,
): boolean {
  let outsideHostContainerContext: boolean;
  let namespace: HostContextProd;
  if (__DEV__) {
    const hostContextDev: HostContextDev = (hostContext: any);
    // We can only render resources when we are not within the host container context
    outsideHostContainerContext =
      !hostContextDev.ancestorInfo.containerTagInScope;
    namespace = hostContextDev.namespace;
  } else {
    const hostContextProd: HostContextProd = (hostContext: any);
    namespace = hostContextProd;
  }

  // Global opt out of hoisting for anything in SVG Namespace or anything with an itemProp inside an itemScope
  if (namespace === SVG_NAMESPACE || props.itemProp != null) {
    if (__DEV__) {
      if (
        outsideHostContainerContext &&
        props.itemProp != null &&
        (type === 'meta' ||
          type === 'title' ||
          type === 'style' ||
          type === 'link' ||
          type === 'script')
      ) {
        console.error(
          'Cannot render a <%s> outside the main document if it has an `itemProp` prop. `itemProp` suggests the tag belongs to an' +
            ' `itemScope` which can appear anywhere in the DOM. If you were intending for React to hoist this <%s> remove the `itemProp` prop.' +
            ' Otherwise, try moving this tag into the <head> or <body> of the Document.',
          type,
          type,
        );
      }
    }
    return false;
  }

  switch (type) {
    case 'meta':
    case 'title': {
      return true;
    }
    case 'style': {
      if (
        typeof props.precedence !== 'string' ||
        typeof props.href !== 'string' ||
        props.href === ''
      ) {
        if (__DEV__) {
          if (outsideHostContainerContext) {
            console.error(
              'Cannot render a <style> outside the main document without knowing its precedence and a unique href key.' +
                ' React can hoist and deduplicate <style> tags if you provide a `precedence` prop along with an `href` prop that' +
                ' does not conflic with the `href` values used in any other hoisted <style> or <link rel="stylesheet" ...> tags. ' +
                ' Note that hoisting <style> tags is considered an advanced feature that most will not use directly.' +
                ' Consider moving the <style> tag to the <head> or consider adding a `precedence="default"` and `href="some unique resource identifier"`, or move the <style>' +
                ' to the <style> tag.',
            );
          }
        }
        return false;
      }
      return true;
    }
    case 'link': {
      if (
        typeof props.rel !== 'string' ||
        typeof props.href !== 'string' ||
        props.href === '' ||
        props.onLoad ||
        props.onError
      ) {
        if (__DEV__) {
          if (
            props.rel === 'stylesheet' &&
            typeof props.precedence === 'string'
          ) {
            validateLinkPropsForStyleResource(props);
          }
          if (outsideHostContainerContext) {
            if (
              typeof props.rel !== 'string' ||
              typeof props.href !== 'string' ||
              props.href === ''
            ) {
              console.error(
                'Cannot render a <link> outside the main document without a `rel` and `href` prop.' +
                  ' Try adding a `rel` and/or `href` prop to this <link> or moving the link into the <head> tag',
              );
            } else if (props.onError || props.onLoad) {
              console.error(
                'Cannot render a <link> with onLoad or onError listeners outside the main document.' +
                  ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            }
          }
        }
        return false;
      }
      switch (props.rel) {
        case 'stylesheet': {
          const {precedence, disabled} = props;
          if (__DEV__) {
            if (typeof precedence !== 'string') {
              if (outsideHostContainerContext) {
                console.error(
                  'Cannot render a <link rel="stylesheet" /> outside the main document without knowing its precedence.' +
                    ' Consider adding precedence="default" or moving it into the root <head> tag.',
                );
              }
            }
          }
          return typeof precedence === 'string' && disabled == null;
        }
        default: {
          return true;
        }
      }
    }
    case 'script': {
      if (
        props.async !== true ||
        props.onLoad ||
        props.onError ||
        typeof props.src !== 'string' ||
        !props.src
      ) {
        if (__DEV__) {
          if (outsideHostContainerContext) {
            if (props.async !== true) {
              console.error(
                'Cannot render a sync or defer <script> outside the main document without knowing its order.' +
                  ' Try adding async="" or moving it into the root <head> tag.',
              );
            } else if (props.onLoad || props.onError) {
              console.error(
                'Cannot render a <script> with onLoad or onError listeners outside the main document.' +
                  ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            } else {
              console.error(
                'Cannot render a <script> outside the main document without `async={true}` and a non-empty `src` prop.' +
                  ' Ensure there is a valid `src` and either make the script async or move it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            }
          }
        }
        return false;
      }
      return true;
    }
    case 'noscript':
    case 'template': {
      if (__DEV__) {
        if (outsideHostContainerContext) {
          console.error(
            'Cannot render <%s> outside the main document. Try moving it into the root <head> tag.',
            type,
          );
        }
      }
      return false;
    }
  }
  return false;
}

export function prepareRendererToRender(rootContainer: Container) {
  if (enableFloat) {
    prepareToRenderResources(rootContainer);
  }
}

export function resetRendererAfterRender() {
  if (enableFloat) {
    cleanupAfterRenderResources();
  }
}

export {
  getHoistableRoot,
  getResource,
  acquireResource,
  releaseResource,
  hydrateHoistable,
  mountHoistable,
  unmountHoistable,
} from './ReactDOMFloatClient';

// -------------------
//     Singletons
// -------------------

export const supportsSingletons = true;

export function isHostSingletonType(type: string): boolean {
  return type === 'html' || type === 'head' || type === 'body';
}

export function resolveSingletonInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  validateDOMNestingDev: boolean,
): Instance {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    if (validateDOMNestingDev) {
      validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    }
  }
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );
  switch (type) {
    case 'html': {
      const documentElement = ownerDocument.documentElement;
      if (!documentElement) {
        throw new Error(
          'React expected an <html> element (document.documentElement) to exist in the Document but one was' +
            ' not found. React never removes the documentElement for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return documentElement;
    }
    case 'head': {
      const head = ownerDocument.head;
      if (!head) {
        throw new Error(
          'React expected a <head> element (document.head) to exist in the Document but one was' +
            ' not found. React never removes the head for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return head;
    }
    case 'body': {
      const body = ownerDocument.body;
      if (!body) {
        throw new Error(
          'React expected a <body> element (document.body) to exist in the Document but one was' +
            ' not found. React never removes the body for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return body;
    }
    default: {
      throw new Error(
        'resolveSingletonInstance was called with an element type that is not supported. This is a bug in React.',
      );
    }
  }
}

export function acquireSingletonInstance(
  type: string,
  props: Props,
  instance: Instance,
  internalInstanceHandle: Object,
): void {
  if (__DEV__) {
    const currentInstanceHandle = getInstanceFromNodeDOMTree(instance);
    if (currentInstanceHandle) {
      const tagName = instance.tagName.toLowerCase();
      console.error(
        'You are mounting a new %s component when a previous one has not first unmounted. It is an' +
          ' error to render more than one %s component at a time and attributes and children of these' +
          ' components will likely fail in unpredictable ways. Please only render a single instance of' +
          ' <%s> and if you need to mount a new one, ensure any previous ones have unmounted first.',
        tagName,
        tagName,
        tagName,
      );
    }
    switch (type) {
      case 'html':
      case 'head':
      case 'body': {
        break;
      }
      default: {
        console.error(
          'acquireSingletonInstance was called with an element type that is not supported. This is a bug in React.',
        );
      }
    }
  }

  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }

  setInitialProperties(instance, type, props);
  precacheFiberNode(internalInstanceHandle, instance);
  updateFiberProps(instance, props);
}

export function releaseSingletonInstance(instance: Instance): void {
  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }
  detachDeletedInstance(instance);
}

export function clearSingleton(instance: Instance): void {
  const element: Element = (instance: any);
  let node = element.firstChild;
  while (node) {
    const nextNode = node.nextSibling;
    const nodeName = node.nodeName;
    if (
      isMarkedResource(node) ||
      nodeName === 'HEAD' ||
      nodeName === 'BODY' ||
      nodeName === 'STYLE' ||
      (nodeName === 'LINK' &&
        ((node: any): HTMLLinkElement).rel.toLowerCase() === 'stylesheet')
    ) {
      // retain these nodes
    } else {
      element.removeChild(node);
    }
    node = nextNode;
  }
  return;
}
