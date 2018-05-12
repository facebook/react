/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as ReactScheduler from 'react-scheduler';

import * as ReactDOMComponentTree from './ReactDOMComponentTree';
import * as ReactDOMFiberComponent from './ReactDOMFiberComponent';
import * as ReactInputSelection from './ReactInputSelection';
import setTextContent from './setTextContent';
import validateDOMNesting from './validateDOMNesting';
import * as ReactBrowserEventEmitter from '../events/ReactBrowserEventEmitter';
import {getChildNamespace} from '../shared/DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';

export type Container = Element | Document;
type Props = {
  autoFocus?: boolean,
  children?: mixed,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
};
type Instance = Element;
type TextInstance = Text;

type HostContextDev = {
  namespace: string,
  ancestorInfo: mixed,
};
type HostContextProd = string;
type HostContext = HostContextDev | HostContextProd;

const {
  createElement,
  createTextNode,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  warnForUnmatchedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
} = ReactDOMFiberComponent;
const {updatedAncestorInfo} = validateDOMNesting;
const {precacheFiberNode, updateFiberProps} = ReactDOMComponentTree;

let SUPPRESS_HYDRATION_WARNING;
if (__DEV__) {
  SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
}

let eventsEnabled: ?boolean = null;
let selectionInformation: ?mixed = null;

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

const ReactDOMHostConfig = {
  getRootHostContext(rootContainerInstance: Container): HostContext {
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
      const ancestorInfo = updatedAncestorInfo(null, validatedTag, null);
      return {namespace, ancestorInfo};
    }
    return namespace;
  },

  getChildHostContext(
    parentHostContext: HostContext,
    type: string,
  ): HostContext {
    if (__DEV__) {
      const parentHostContextDev = ((parentHostContext: any): HostContextDev);
      const namespace = getChildNamespace(parentHostContextDev.namespace, type);
      const ancestorInfo = updatedAncestorInfo(
        parentHostContextDev.ancestorInfo,
        type,
        null,
      );
      return {namespace, ancestorInfo};
    }
    const parentNamespace = ((parentHostContext: any): HostContextProd);
    return getChildNamespace(parentNamespace, type);
  },

  getPublicInstance(instance: Instance | TextInstance): * {
    return instance;
  },

  prepareForCommit(): void {
    eventsEnabled = ReactBrowserEventEmitter.isEnabled();
    selectionInformation = ReactInputSelection.getSelectionInformation();
    ReactBrowserEventEmitter.setEnabled(false);
  },

  resetAfterCommit(): void {
    ReactInputSelection.restoreSelection(selectionInformation);
    selectionInformation = null;
    ReactBrowserEventEmitter.setEnabled(eventsEnabled);
    eventsEnabled = null;
  },

  createInstance(
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
          null,
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
  },

  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    parentInstance.appendChild(child);
  },

  finalizeInitialChildren(
    domElement: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
  ): boolean {
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return shouldAutoFocusHostComponent(type, props);
  },

  prepareUpdate(
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
          null,
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
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    return (
      type === 'textarea' ||
      typeof props.children === 'string' ||
      typeof props.children === 'number' ||
      (typeof props.dangerouslySetInnerHTML === 'object' &&
        props.dangerouslySetInnerHTML !== null &&
        typeof props.dangerouslySetInnerHTML.__html === 'string')
    );
  },

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return !!props.hidden;
  },

  createTextInstance(
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
  },

  now: ReactScheduler.now,

  isPrimaryRenderer: true,

  mutation: {
    commitMount(
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
    },

    commitUpdate(
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
    },

    resetTextContent(domElement: Instance): void {
      setTextContent(domElement, '');
    },

    commitTextUpdate(
      textInstance: TextInstance,
      oldText: string,
      newText: string,
    ): void {
      textInstance.nodeValue = newText;
    },

    appendChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      parentInstance.appendChild(child);
    },

    appendChildToContainer(
      container: Container,
      child: Instance | TextInstance,
    ): void {
      if (container.nodeType === COMMENT_NODE) {
        (container.parentNode: any).insertBefore(child, container);
      } else {
        container.appendChild(child);
      }
    },

    insertBefore(
      parentInstance: Instance,
      child: Instance | TextInstance,
      beforeChild: Instance | TextInstance,
    ): void {
      parentInstance.insertBefore(child, beforeChild);
    },

    insertInContainerBefore(
      container: Container,
      child: Instance | TextInstance,
      beforeChild: Instance | TextInstance,
    ): void {
      if (container.nodeType === COMMENT_NODE) {
        (container.parentNode: any).insertBefore(child, beforeChild);
      } else {
        container.insertBefore(child, beforeChild);
      }
    },

    removeChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      parentInstance.removeChild(child);
    },

    removeChildFromContainer(
      container: Container,
      child: Instance | TextInstance,
    ): void {
      if (container.nodeType === COMMENT_NODE) {
        (container.parentNode: any).removeChild(child);
      } else {
        container.removeChild(child);
      }
    },
  },

  hydration: {
    canHydrateInstance(
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
    },

    canHydrateTextInstance(
      instance: Instance | TextInstance,
      text: string,
    ): null | TextInstance {
      if (text === '' || instance.nodeType !== TEXT_NODE) {
        // Empty strings are not parsed by HTML so there won't be a correct match here.
        return null;
      }
      // This has now been refined to a text node.
      return ((instance: any): TextInstance);
    },

    getNextHydratableSibling(
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
    },

    getFirstHydratableChild(
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
    },

    hydrateInstance(
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
    },

    hydrateTextInstance(
      textInstance: TextInstance,
      text: string,
      internalInstanceHandle: Object,
    ): boolean {
      precacheFiberNode(internalInstanceHandle, textInstance);
      return diffHydratedText(textInstance, text);
    },

    didNotMatchHydratedContainerTextInstance(
      parentContainer: Container,
      textInstance: TextInstance,
      text: string,
    ) {
      if (__DEV__) {
        warnForUnmatchedText(textInstance, text);
      }
    },

    didNotMatchHydratedTextInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      textInstance: TextInstance,
      text: string,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        warnForUnmatchedText(textInstance, text);
      }
    },

    didNotHydrateContainerInstance(
      parentContainer: Container,
      instance: Instance | TextInstance,
    ) {
      if (__DEV__) {
        if (instance.nodeType === 1) {
          warnForDeletedHydratableElement(parentContainer, (instance: any));
        } else {
          warnForDeletedHydratableText(parentContainer, (instance: any));
        }
      }
    },

    didNotHydrateInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      instance: Instance | TextInstance,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        if (instance.nodeType === 1) {
          warnForDeletedHydratableElement(parentInstance, (instance: any));
        } else {
          warnForDeletedHydratableText(parentInstance, (instance: any));
        }
      }
    },

    didNotFindHydratableContainerInstance(
      parentContainer: Container,
      type: string,
      props: Props,
    ) {
      if (__DEV__) {
        warnForInsertedHydratedElement(parentContainer, type, props);
      }
    },

    didNotFindHydratableContainerTextInstance(
      parentContainer: Container,
      text: string,
    ) {
      if (__DEV__) {
        warnForInsertedHydratedText(parentContainer, text);
      }
    },

    didNotFindHydratableInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      type: string,
      props: Props,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        warnForInsertedHydratedElement(parentInstance, type, props);
      }
    },

    didNotFindHydratableTextInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      text: string,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        warnForInsertedHydratedText(parentInstance, text);
      }
    },
  },

  scheduleDeferredCallback: ReactScheduler.rIC,
  cancelDeferredCallback: ReactScheduler.cIC,
};

export default ReactDOMHostConfig;
