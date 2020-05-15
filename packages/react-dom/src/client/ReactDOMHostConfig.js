/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelType} from 'legacy-events/TopLevelEventTypes';
import type {Fiber, FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {
  BoundingRect,
  IntersectionObserverOptions,
  ObserveVisibleRectsCallback,
} from 'react-reconciler/src/ReactTestSelectors';
import type {RootType} from './ReactDOMRoot';
import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {
  ReactDOMEventResponder,
  ReactDOMEventResponderInstance,
  ReactDOMFundamentalComponentInstance,
} from '../shared/ReactDOMTypes';

import {
  precacheFiberNode,
  updateFiberProps,
  getClosestInstanceFromNode,
  getFiberFromScopeInstance,
  getInstanceFromNode as getInstanceFromNodeDOMTree,
  isContainerMarkedAsRoot,
} from './ReactDOMComponentTree';
import {hasRole} from './DOMAccessibilityRoles';
import {
  createElement,
  createTextNode,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  trapClickOnNonInteractiveElement,
  warnForUnmatchedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
  listenToEventResponderEventTypes,
} from './ReactDOMComponent';
import {getSelectionInformation, restoreSelection} from './ReactInputSelection';
import setTextContent from './setTextContent';
import {validateDOMNesting, updatedAncestorInfo} from './validateDOMNesting';
import {
  isEnabled as ReactBrowserEventEmitterIsEnabled,
  setEnabled as ReactBrowserEventEmitterSetEnabled,
} from '../events/ReactDOMEventListener';
import {getChildNamespace} from '../shared/DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';
import dangerousStyleValue from '../shared/dangerousStyleValue';

import {REACT_OPAQUE_ID_TYPE} from 'shared/ReactSymbols';
import {
  mountEventResponder,
  unmountEventResponder,
} from '../events/DeprecatedDOMEventResponderSystem';
import {retryIfBlockedOn} from '../events/ReactDOMEventReplaying';

import {
  enableSuspenseServerRenderer,
  enableDeprecatedFlareAPI,
  enableFundamentalAPI,
  enableModernEventSystem,
  enableCreateEventHandleAPI,
  enableScopeAPI,
  disableHiddenPropDeprioritization,
} from 'shared/ReactFeatureFlags';
import {HostComponent, HostText} from 'react-reconciler/src/ReactWorkTags';
import {TOP_BEFORE_BLUR, TOP_AFTER_BLUR} from '../events/DOMTopLevelEventTypes';
import {
  listenToEvent,
  clearEventHandleListenersForTarget,
} from '../events/DOMModernPluginEventSystem';

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
  | (Element & {_reactRootContainer?: RootType, ...})
  | (Document & {_reactRootContainer?: RootType, ...});
export type Instance = Element;
export type TextInstance = Text;
export type SuspenseInstance = Comment & {_reactRetry?: () => void, ...};
export type HydratableInstance = Instance | TextInstance | SuspenseInstance;
export type PublicInstance = Element | Text;
type HostContextDev = {
  namespace: string,
  ancestorInfo: mixed,
  ...
};
type HostContextProd = string;
export type HostContext = HostContextDev | HostContextProd;
export type UpdatePayload = Array<mixed>;
export type ChildSet = void; // Unused
export type TimeoutHandle = TimeoutID;
export type NoTimeout = -1;
export type RendererInspectionConfig = $ReadOnly<{||}>;

export opaque type OpaqueIDType =
  | string
  | {
      toString: () => string | void,
      valueOf: () => string | void,
    };

type SelectionInformation = {|
  focusedElem: null | HTMLElement,
  selectionRange: mixed,
|};

let SUPPRESS_HYDRATION_WARNING;
if (__DEV__) {
  SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
}

const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';

const STYLE = 'style';

let eventsEnabled: ?boolean = null;
let selectionInformation: null | SelectionInformation = null;

function shouldAutoFocusHostComponent(type: string, props: Props): boolean {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
}

export * from 'react-reconciler/src/ReactFiberHostConfigWithNoPersistence';

export function getRootHostContext(
  rootContainerInstance: Container,
): HostContext {
  let type;
  let namespace;
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
    const ancestorInfo = updatedAncestorInfo(null, validatedTag);
    return {namespace, ancestorInfo};
  }
  return namespace;
}

export function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
  rootContainerInstance: Container,
): HostContext {
  if (__DEV__) {
    const parentHostContextDev = ((parentHostContext: any): HostContextDev);
    const namespace = getChildNamespace(parentHostContextDev.namespace, type);
    const ancestorInfo = updatedAncestorInfo(
      parentHostContextDev.ancestorInfo,
      type,
    );
    return {namespace, ancestorInfo};
  }
  const parentNamespace = ((parentHostContext: any): HostContextProd);
  return getChildNamespace(parentNamespace, type);
}

export function getPublicInstance(instance: Instance): * {
  return instance;
}

export function prepareForCommit(containerInfo: Container): Object | null {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation();
  let activeInstance = null;
  if (enableDeprecatedFlareAPI || enableCreateEventHandleAPI) {
    const focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      activeInstance = getClosestInstanceFromNode(focusedElem);
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}

export function beforeActiveInstanceBlur(): void {
  if (enableDeprecatedFlareAPI || enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchBeforeDetachedBlur((selectionInformation: any).focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function afterActiveInstanceBlur(): void {
  if (enableDeprecatedFlareAPI || enableCreateEventHandleAPI) {
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

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): Instance {
  let parentNamespace: string;
  if (__DEV__) {
    // TODO: take namespace into account when validating.
    const hostContextDev = ((hostContext: any): HostContextDev);
    validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    if (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    ) {
      const string = '' + props.children;
      const ownAncestorInfo = updatedAncestorInfo(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
    parentNamespace = hostContextDev.namespace;
  } else {
    parentNamespace = ((hostContext: any): HostContextProd);
  }
  const domElement: Instance = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
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
  rootContainerInstance: Container,
  hostContext: HostContext,
): boolean {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  return shouldAutoFocusHostComponent(type, props);
}

export function prepareUpdate(
  domElement: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  rootContainerInstance: Container,
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
      const ownAncestorInfo = updatedAncestorInfo(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
  }
  return diffProperties(
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
  );
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === 'textarea' ||
    type === 'option' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function shouldDeprioritizeSubtree(type: string, props: Props): boolean {
  if (disableHiddenPropDeprioritization) {
    // This is obnoxiously specific so that nobody uses it, but we can still opt
    // in via an infra-level userspace abstraction.
    return props.hidden === 'unstable-do-not-use-legacy-hidden';
  } else {
    // Legacy behavior. Any truthy value works.
    return !!props.hidden;
  }
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
  if (shouldAutoFocusHostComponent(type, newProps)) {
    ((domElement: any):
      | HTMLButtonElement
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement).focus();
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
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
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

function createEvent(type: TopLevelType): Event {
  const event = document.createEvent('Event');
  event.initEvent(((type: any): string), false, false);
  return event;
}

function dispatchBeforeDetachedBlur(target: HTMLElement): void {
  if (enableDeprecatedFlareAPI || enableCreateEventHandleAPI) {
    const event = createEvent(TOP_BEFORE_BLUR);
    // Dispatch "beforeblur" directly on the target,
    // so it gets picked up by the event system and
    // can propagate through the React internal tree.
    target.dispatchEvent(event);
  }
}

function dispatchAfterDetachedBlur(target: HTMLElement): void {
  if (enableDeprecatedFlareAPI || enableCreateEventHandleAPI) {
    const event = createEvent(TOP_AFTER_BLUR);
    // So we know what was detached, make the relatedTarget the
    // detached target on the "afterblur" event.
    (event: any).relatedTarget = target;
    // Dispatch the event on the document.
    document.dispatchEvent(event);
  }
}

export function removeInstanceEventHandles(
  instance: Instance | TextInstance | SuspenseInstance,
) {
  if (enableCreateEventHandleAPI) {
    clearEventHandleListenersForTarget(instance);
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
  let node = suspenseInstance;
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
  if (container.nodeType === ELEMENT_NODE) {
    ((container: any): Element).textContent = '';
  } else if (container.nodeType === DOCUMENT_NODE) {
    const body = ((container: any): Document).body;
    if (body != null) {
      body.textContent = '';
    }
  }
}

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

export function canHydrateInstance(
  instance: HydratableInstance,
  type: string,
  props: Props,
): null | Instance {
  if (
    instance.nodeType !== ELEMENT_NODE ||
    type.toLowerCase() !== instance.nodeName.toLowerCase()
  ) {
    return null;
  }
  // This has now been refined to an element node.
  return ((instance: any): Instance);
}

export function canHydrateTextInstance(
  instance: HydratableInstance,
  text: string,
): null | TextInstance {
  if (text === '' || instance.nodeType !== TEXT_NODE) {
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
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a suspense node.
  return ((instance: any): SuspenseInstance);
}

export function isSuspenseInstancePending(instance: SuspenseInstance) {
  return instance.data === SUSPENSE_PENDING_START_DATA;
}

export function isSuspenseInstanceFallback(instance: SuspenseInstance) {
  return instance.data === SUSPENSE_FALLBACK_START_DATA;
}

export function registerSuspenseInstanceRetry(
  instance: SuspenseInstance,
  callback: () => void,
) {
  instance._reactRetry = callback;
}

function getNextHydratable(node) {
  // Skip non-hydratable nodes.
  for (; node != null; node = node.nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
    if (enableSuspenseServerRenderer) {
      if (nodeType === COMMENT_NODE) {
        const nodeData = (node: any).data;
        if (
          nodeData === SUSPENSE_START_DATA ||
          nodeData === SUSPENSE_FALLBACK_START_DATA ||
          nodeData === SUSPENSE_PENDING_START_DATA
        ) {
          break;
        }
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
  parentInstance: Container | Instance,
): null | HydratableInstance {
  return getNextHydratable(parentInstance.firstChild);
}

export function hydrateInstance(
  instance: Instance,
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): null | Array<mixed> {
  precacheFiberNode(internalInstanceHandle, instance);
  // TODO: Possibly defer this until the commit phase where all the events
  // get attached.
  updateFiberProps(instance, props);
  let parentNamespace: string;
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    parentNamespace = hostContextDev.namespace;
  } else {
    parentNamespace = ((hostContext: any): HostContextProd);
  }
  return diffHydratedProperties(
    instance,
    type,
    props,
    parentNamespace,
    rootContainerInstance,
  );
}

export function hydrateTextInstance(
  textInstance: TextInstance,
  text: string,
  internalInstanceHandle: Object,
): boolean {
  precacheFiberNode(internalInstanceHandle, textInstance);
  return diffHydratedText(textInstance, text);
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

export function didNotMatchHydratedContainerTextInstance(
  parentContainer: Container,
  textInstance: TextInstance,
  text: string,
) {
  if (__DEV__) {
    warnForUnmatchedText(textInstance, text);
  }
}

export function didNotMatchHydratedTextInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  textInstance: TextInstance,
  text: string,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    warnForUnmatchedText(textInstance, text);
  }
}

export function didNotHydrateContainerInstance(
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

export function didNotHydrateInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  instance: HydratableInstance,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentInstance, (instance: any));
    } else if (instance.nodeType === COMMENT_NODE) {
      // TODO: warnForDeletedHydratableSuspenseBoundary
    } else {
      warnForDeletedHydratableText(parentInstance, (instance: any));
    }
  }
}

export function didNotFindHydratableContainerInstance(
  parentContainer: Container,
  type: string,
  props: Props,
) {
  if (__DEV__) {
    warnForInsertedHydratedElement(parentContainer, type, props);
  }
}

export function didNotFindHydratableContainerTextInstance(
  parentContainer: Container,
  text: string,
) {
  if (__DEV__) {
    warnForInsertedHydratedText(parentContainer, text);
  }
}

export function didNotFindHydratableContainerSuspenseInstance(
  parentContainer: Container,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSupsense(parentContainer);
  }
}

export function didNotFindHydratableInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  type: string,
  props: Props,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    warnForInsertedHydratedElement(parentInstance, type, props);
  }
}

export function didNotFindHydratableTextInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  text: string,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    warnForInsertedHydratedText(parentInstance, text);
  }
}

export function didNotFindHydratableSuspenseInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    // TODO: warnForInsertedHydratedSuspense(parentInstance);
  }
}

export function DEPRECATED_mountResponderInstance(
  responder: ReactDOMEventResponder,
  responderInstance: ReactDOMEventResponderInstance,
  responderProps: Object,
  responderState: Object,
  instance: Instance,
): ReactDOMEventResponderInstance {
  // Listen to events
  const doc = instance.ownerDocument;
  const {targetEventTypes} = ((responder: any): ReactDOMEventResponder);
  if (targetEventTypes !== null) {
    listenToEventResponderEventTypes(targetEventTypes, doc);
  }
  mountEventResponder(
    responder,
    responderInstance,
    responderProps,
    responderState,
  );
  return responderInstance;
}

export function DEPRECATED_unmountResponderInstance(
  responderInstance: ReactDOMEventResponderInstance,
): void {
  if (enableDeprecatedFlareAPI) {
    // TODO stop listening to targetEventTypes
    unmountEventResponder(responderInstance);
  }
}

export function getFundamentalComponentInstance(
  fundamentalInstance: ReactDOMFundamentalComponentInstance,
): Instance {
  if (enableFundamentalAPI) {
    const {currentFiber, impl, props, state} = fundamentalInstance;
    const instance = impl.getInstance(null, props, state);
    precacheFiberNode(currentFiber, instance);
    return instance;
  }
  // Because of the flag above, this gets around the Flow error;
  return (null: any);
}

export function mountFundamentalComponent(
  fundamentalInstance: ReactDOMFundamentalComponentInstance,
): void {
  if (enableFundamentalAPI) {
    const {impl, instance, props, state} = fundamentalInstance;
    const onMount = impl.onMount;
    if (onMount !== undefined) {
      onMount(null, instance, props, state);
    }
  }
}

export function shouldUpdateFundamentalComponent(
  fundamentalInstance: ReactDOMFundamentalComponentInstance,
): boolean {
  if (enableFundamentalAPI) {
    const {impl, prevProps, props, state} = fundamentalInstance;
    const shouldUpdate = impl.shouldUpdate;
    if (shouldUpdate !== undefined) {
      return shouldUpdate(null, prevProps, props, state);
    }
  }
  return true;
}

export function updateFundamentalComponent(
  fundamentalInstance: ReactDOMFundamentalComponentInstance,
): void {
  if (enableFundamentalAPI) {
    const {impl, instance, prevProps, props, state} = fundamentalInstance;
    const onUpdate = impl.onUpdate;
    if (onUpdate !== undefined) {
      onUpdate(null, instance, prevProps, props, state);
    }
  }
}

export function unmountFundamentalComponent(
  fundamentalInstance: ReactDOMFundamentalComponentInstance,
): void {
  if (enableFundamentalAPI) {
    const {impl, instance, props, state} = fundamentalInstance;
    const onUnmount = impl.onUnmount;
    if (onUnmount !== undefined) {
      onUnmount(null, instance, props, state);
    }
  }
}

export function getInstanceFromNode(node: HTMLElement): null | Object {
  return getClosestInstanceFromNode(node) || null;
}

let clientId: number = 0;
export function makeClientId(): OpaqueIDType {
  return 'r:' + (clientId++).toString(36);
}

export function makeClientIdInDEV(warnOnAccessInDEV: () => void): OpaqueIDType {
  const id = 'r:' + (clientId++).toString(36);
  return {
    toString() {
      warnOnAccessInDEV();
      return id;
    },
    valueOf() {
      warnOnAccessInDEV();
      return id;
    },
  };
}

export function isOpaqueHydratingObject(value: mixed): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.$$typeof === REACT_OPAQUE_ID_TYPE
  );
}

export function makeOpaqueHydratingObject(
  attemptToReadValue: () => void,
): OpaqueIDType {
  return {
    $$typeof: REACT_OPAQUE_ID_TYPE,
    toString: attemptToReadValue,
    valueOf: attemptToReadValue,
  };
}

export function preparePortalMount(portalInstance: Instance): void {
  if (enableModernEventSystem) {
    listenToEvent('onMouseEnter', portalInstance);
  }
}

export function prepareScopeUpdate(
  scopeInstance: ReactScopeInstance,
  internalInstanceHandle: Object,
): void {
  if (enableScopeAPI) {
    precacheFiberNode(internalInstanceHandle, scopeInstance);
  }
}

export function removeScopeEventHandles(
  scopeInstance: ReactScopeInstance,
): void {
  if (enableScopeAPI && enableCreateEventHandleAPI) {
    clearEventHandleListenersForTarget(scopeInstance);
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
): {|
  disconnect: () => void,
  observe: (instance: Instance) => void,
  unobserve: (instance: Instance) => void,
|} {
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
