/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {roots} from './ReactFireRoots';
import type {DOMContainer} from './ReactFire';
import {
  createHostComponent,
  setHostComponentInitialProps,
} from './host-components/ReactFireHostComponentCreation';
import {
  diffHostComponentProperties,
  diffHydratedHostComponentProperties,
} from './host-components/ReactFireHostComponentDiffing';
import {updateHostComponentProperties} from './host-components/ReactFireHostComponentUpdating';
import {
  createTextNode,
  getChildNamespace,
  isStringOrNumber,
  shouldAutoFocusHostComponent,
} from './ReactFireUtils';
import {
  setFiberByDomNodeInstance,
  setFiberPropsByDomNodeInstance,
} from './ReactFireMaps';
import {
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
  STYLE,
  SUPPRESS_HYDRATION_WARNING,
  ELEMENT_NODE,
  TEXT_NODE,
} from './ReactFireDOMConfig';
import {
  setEventsEnabled,
  isEventsEnabled,
  trapClickOnNonInteractiveElement,
} from './events/ReactFireEvents';
import {getSelectionInformation, restoreSelection} from './ReactFireSelection';
import {dangerousStyleValue} from './host-components/ReactFireHostComponentStyling';
import {
  updatedAncestorInfo,
  validateDOMNesting,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
  warnForTextDifference,
} from './ReactFireDevOnly';

export {
  unstable_now as now,
  unstable_scheduleCallback as scheduleDeferredCallback,
  unstable_shouldYield as shouldYield,
  unstable_cancelCallback as cancelDeferredCallback,
} from 'scheduler';

let eventsEnabled: ?boolean = null;
let selectionInformation: ?mixed = null;

export type Type = string;
export type Props = {
  autoFocus?: boolean,
  children?: mixed,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
  dangerouslySetInnerHTML?: mixed,
  style?: {
    display?: string,
  },
};
export type Container = Element | Document;
export type Instance = Element;
export type TextInstance = Text;
export type HydratableInstance = Element | Text;
export type PublicInstance = Element | Text;
export type HostContextDev = {
  namespace: string,
  ancestorInfo: mixed,
};
export type HostContextProd = string;
export type HostContext = HostContextDev | HostContextProd;
export type UpdatePayload = Array<mixed>;
export type ChildSet = void; // Unused
export type TimeoutHandle = TimeoutID;
export type NoTimeout = -1;

export * from 'shared/HostConfigWithNoPersistence';

export const isPrimaryRenderer = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout =
  typeof setTimeout === 'function' ? setTimeout : (undefined: any);
export const cancelTimeout =
  typeof clearTimeout === 'function' ? clearTimeout : (undefined: any);
export const noTimeout = -1;

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
      let root = (rootContainerInstance: any).documentElement;
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

export function prepareForCommit(containerInfo: Container): void {
  eventsEnabled = isEventsEnabled();
  selectionInformation = getSelectionInformation();
  setEventsEnabled(false);
}

export function resetAfterCommit(containerInfo: Container): void {
  restoreSelection((selectionInformation: any));
  selectionInformation = null;
  setEventsEnabled(eventsEnabled);
  eventsEnabled = null;
}

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  fiber: Object,
): Instance {
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
  }
  const domNode = createHostComponent(
    type,
    props,
    rootContainerInstance,
    hostContext,
  );
  setFiberByDomNodeInstance(domNode, fiber);
  setFiberPropsByDomNodeInstance(domNode, props);
  return domNode;
}

export function createTextInstance(
  text: string,
  rootContainerInstance: Container,
  hostContext: HostContext,
  fiber: Object,
): TextInstance {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    validateDOMNesting(null, text, hostContextDev.ancestorInfo);
  }
  const domNode: TextInstance = createTextNode(text, rootContainerInstance);
  setFiberByDomNodeInstance(domNode, fiber);
  return domNode;
}

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}

export function finalizeInitialChildren(
  domNode: Instance,
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): boolean {
  setHostComponentInitialProps(
    type,
    props,
    domNode,
    rootContainerInstance,
    hostContext,
  );
  return shouldAutoFocusHostComponent(type, props);
}

export function prepareUpdate(
  domNode: Instance,
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
  return diffHostComponentProperties(
    domNode,
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
    isStringOrNumber(props.children) ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function shouldDeprioritizeSubtree(type: string, props: Props): boolean {
  return !!props.hidden;
}

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function commitMount(
  domNode: Instance,
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
    ((domNode: any):
      | HTMLButtonElement
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement).focus();
  }
}

export function commitUpdate(
  domNode: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  setFiberPropsByDomNodeInstance(domNode, newProps);
  // Apply the diff to the DOM node.
  updateHostComponentProperties(
    domNode,
    updatePayload,
    type,
    oldProps,
    newProps,
  );
}

export function resetTextContent(domNode: Instance): void {
  domNode.textContent = '';
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
  container: DOMContainer,
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
  if (!roots.has(container) && parentNode.onclick === null) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(((parentNode: any): HTMLElement));
  }
}

export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  parentInstance.insertBefore(child, beforeChild);
}

export function insertInContainerBefore(
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

export function removeChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.removeChild(child);
}

export function removeChildFromContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).removeChild(child);
  } else {
    container.removeChild(child);
  }
}

export function hideInstance(instance: Instance): void {
  // TODO: Does this work for all element types? What about MathML? Should we
  // pass host context to this method?
  instance = ((instance: any): HTMLElement);
  instance.style.display = 'none';
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

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

export function canHydrateInstance(
  instance: Instance | TextInstance,
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
  instance: Instance | TextInstance,
  text: string,
): null | TextInstance {
  if (text === '' || instance.nodeType !== TEXT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a text node.
  return ((instance: any): TextInstance);
}

export function getNextHydratableSibling(
  instance: Instance | TextInstance,
): null | Instance | TextInstance {
  let node = instance.nextSibling;
  // Skip non-hydratable nodes.
  while (
    node &&
    node.nodeType !== ELEMENT_NODE &&
    node.nodeType !== TEXT_NODE
  ) {
    node = node.nextSibling;
  }
  return (node: any);
}

export function getFirstHydratableChild(
  parentInstance: Container | Instance,
): null | Instance | TextInstance {
  let next = parentInstance.firstChild;
  // Skip non-hydratable nodes.
  while (
    next &&
    next.nodeType !== ELEMENT_NODE &&
    next.nodeType !== TEXT_NODE
  ) {
    next = next.nextSibling;
  }
  return (next: any);
}

export function hydrateInstance(
  domNode: Instance,
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  fiber: Object,
): null | Array<mixed> {
  setFiberByDomNodeInstance(domNode, fiber);
  // TODO: Possibly defer this until the commit phase where all the events
  // get attached.
  setFiberPropsByDomNodeInstance(domNode, props);
  let parentNamespace: string;
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    parentNamespace = hostContextDev.namespace;
  } else {
    parentNamespace = ((hostContext: any): HostContextProd);
  }
  return diffHydratedHostComponentProperties(
    domNode,
    type,
    props,
    parentNamespace,
    rootContainerInstance,
  );
}

export function hydrateTextInstance(
  textInstance: TextInstance,
  text: string,
  fiber: Object,
): boolean {
  setFiberByDomNodeInstance(textInstance, fiber);
  const isDifferent = textInstance.nodeValue !== text;
  return isDifferent;
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
  instance: Instance | TextInstance,
) {
  if (__DEV__) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentContainer, (instance: any));
    } else {
      warnForDeletedHydratableText(parentContainer, (instance: any));
    }
  }
}

export function didNotHydrateInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  instance: Instance | TextInstance,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentInstance, (instance: any));
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

function warnForUnmatchedText(textNode: Text, text: string) {
  if (__DEV__) {
    warnForTextDifference(textNode.nodeValue, text);
  }
}
