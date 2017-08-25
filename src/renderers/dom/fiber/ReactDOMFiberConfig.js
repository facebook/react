/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiberConfig
 * @flow
 */

var DOMNamespaces = require('DOMNamespaces');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactDOMFiberComponent = require('ReactDOMFiberComponent');
var ReactDOMFrameScheduling = require('ReactDOMFrameScheduling');
var ReactInputSelection = require('ReactInputSelection');
var {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
} = require('HTMLNodeType');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var validateDOMNesting = require('validateDOMNesting');
  var {updatedAncestorInfo} = validateDOMNesting;

  if (
    typeof Map !== 'function' ||
    Map.prototype == null ||
    typeof Map.prototype.forEach !== 'function' ||
    typeof Set !== 'function' ||
    Set.prototype == null ||
    typeof Set.prototype.clear !== 'function' ||
    typeof Set.prototype.forEach !== 'function'
  ) {
    warning(
      false,
      'React depends on Map and Set built-in types. Make sure that you load a ' +
        'polyfill in older browsers. http://fb.me/react-polyfills',
    );
  }
}


var {getChildNamespace} = DOMNamespaces;
var {
  createElement,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
} = ReactDOMFiberComponent;
var {precacheFiberNode, updateFiberProps} = ReactDOMComponentTree;

type Container = Element | Document;
type Props = {
  autoFocus?: boolean,
  children?: mixed,
  hidden?: boolean,
};
type Instance = Element;
type TextInstance = Text;

type HostContextDev = {
  namespace: string,
  ancestorInfo: mixed,
};
type HostContextProd = string;
type HostContext = HostContextDev | HostContextProd;


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

const ReactDOMFiberConfig = {
  getRootHostContext(rootContainerInstance: Container): HostContext {
    let type;
    let namespace;
    if (rootContainerInstance.nodeType === DOCUMENT_NODE) {
      type = '#document';
      let root = (rootContainerInstance: any).documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
    } else {
      const container: any = rootContainerInstance.nodeType === COMMENT_NODE
        ? rootContainerInstance.parentNode
        : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
      namespace = getChildNamespace(ownNamespace, type);
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

  getPublicInstance(instance) {
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
      validateDOMNesting(type, null, null, hostContextDev.ancestorInfo);
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
        validateDOMNesting(null, string, null, ownAncestorInfo);
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
        validateDOMNesting(null, string, null, ownAncestorInfo);
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

  commitMount(
    domElement: Instance,
    type: string,
    newProps: Props,
    internalInstanceHandle: Object,
  ): void {
    ((domElement: any):
      | HTMLButtonElement
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement).focus();
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

  resetTextContent(domElement: Instance): void {
    domElement.textContent = '';
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
      validateDOMNesting(null, text, null, hostContextDev.ancestorInfo);
    }
    var textNode: TextInstance = document.createTextNode(text);
    precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
  },

  commitTextUpdate(
    textInstance: TextInstance,
    oldText: string,
    newText: string,
  ): void {
    textInstance.nodeValue = newText;
  },

  appendChild(parentInstance: Instance, child: Instance | TextInstance): void {
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

  removeChild(parentInstance: Instance, child: Instance | TextInstance): void {
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

  canHydrateInstance(
    instance: Instance | TextInstance,
    type: string,
    props: Props,
  ): boolean {
    return (
      instance.nodeType === ELEMENT_NODE &&
      type === instance.nodeName.toLowerCase()
    );
  },

  canHydrateTextInstance(
    instance: Instance | TextInstance,
    text: string,
  ): boolean {
    if (text === '') {
      // Empty strings are not parsed by HTML so there won't be a correct match here.
      return false;
    }
    return instance.nodeType === TEXT_NODE;
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
    internalInstanceHandle: Object,
  ): null | Array<mixed> {
    precacheFiberNode(internalInstanceHandle, instance);
    // TODO: Possibly defer this until the commit phase where all the events
    // get attached.
    updateFiberProps(instance, props);
    return diffHydratedProperties(instance, type, props, rootContainerInstance);
  },

  hydrateTextInstance(
    textInstance: TextInstance,
    text: string,
    internalInstanceHandle: Object,
  ): boolean {
    precacheFiberNode(internalInstanceHandle, textInstance);
    return diffHydratedText(textInstance, text);
  },

  didNotHydrateInstance(
    parentInstance: Instance | Container,
    instance: Instance | TextInstance,
  ) {
    if (instance.nodeType === 1) {
      warnForDeletedHydratableElement(parentInstance, (instance: any));
    } else {
      warnForDeletedHydratableText(parentInstance, (instance: any));
    }
  },

  didNotFindHydratableInstance(
    parentInstance: Instance | Container,
    type: string,
    props: Props,
  ) {
    warnForInsertedHydratedElement(parentInstance, type, props);
  },

  didNotFindHydratableTextInstance(
    parentInstance: Instance | Container,
    text: string,
  ) {
    warnForInsertedHydratedText(parentInstance, text);
  },

  scheduleDeferredCallback: ReactDOMFrameScheduling.rIC,

  useSyncScheduling: !ReactDOMFeatureFlags.fiberAsyncScheduling,
};

module.exports = ReactDOMFiberConfig;
