/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiber
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { ReactNodeList } from 'ReactTypes';

var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactControlledComponent = require('ReactControlledComponent');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactDOMFiberComponent = require('ReactDOMFiberComponent');
var ReactDOMInjection = require('ReactDOMInjection');
var ReactGenericBatching = require('ReactGenericBatching');
var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactInputSelection = require('ReactInputSelection');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactPortal = require('ReactPortal');

var findDOMNode = require('findDOMNode');
var invariant = require('invariant');
var warning = require('warning');

var {
  createElement,
  getChildNamespace,
  setInitialProperties,
  updateProperties,
} = ReactDOMFiberComponent;
var { precacheFiberNode } = ReactDOMComponentTree;

if (__DEV__) {
  var validateDOMNesting = require('validateDOMNesting');
  var { updatedAncestorInfo } = validateDOMNesting;
}

const DOCUMENT_NODE = 9;

ReactDOMInjection.inject();
ReactControlledComponent.injection.injectFiberControlledHostComponent(
  ReactDOMFiberComponent
);
findDOMNode._injectFiber(function(fiber: Fiber) {
  return DOMRenderer.findHostInstance(fiber);
});

type DOMContainerElement = Element & { _reactRootContainer: ?Object };

type Container = Element;
type Props = { children ?: mixed };
type Instance = Element;
type TextInstance = Text;

type HostContextDev = {
  namespace : string,
  ancestorInfo : mixed,
};
type HostContextProd = string;
type HostContext = HostContextDev | HostContextProd;

let eventsEnabled : ?boolean = null;
let selectionInformation : ?mixed = null;

var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;
var DOCUMENT_FRAGMENT_NODE_TYPE = 11;

/**
 * True if the supplied DOM node is a valid node element.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM is a valid DOM node.
 * @internal
 */
function isValidContainer(node) {
  return !!(node && (
    node.nodeType === ELEMENT_NODE_TYPE ||
    node.nodeType === DOC_NODE_TYPE ||
    node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE
  ));
}

function validateContainer(container) {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }
}

function shouldAutoFocusHostComponent(
  type : string,
  props : Props,
) : boolean {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!(props : any).autoFocus;
  }
  return false;
}

var DOMRenderer = ReactFiberReconciler({

  getRootHostContext(rootContainerInstance : Container) : HostContext {
    const type = rootContainerInstance.tagName.toLowerCase();
    if (__DEV__) {
      const namespace = getChildNamespace(null, type);
      const isMountingIntoDocument = rootContainerInstance.ownerDocument.documentElement === rootContainerInstance;
      const ancestorInfo = updatedAncestorInfo(null, isMountingIntoDocument ? '#document' : type, null);
      return {namespace, ancestorInfo};
    }
    return getChildNamespace(null, type);
  },

  getChildHostContext(
    parentHostContext : HostContext,
    type : string,
  ) : HostContext {
    if (__DEV__) {
      const parentHostContextDev = ((parentHostContext : any) : HostContextDev);
      const namespace = getChildNamespace(parentHostContextDev.namespace, type);
      const ancestorInfo = updatedAncestorInfo(parentHostContextDev.ancestorInfo, type, null);
      return {namespace, ancestorInfo};
    }
    const parentNamespace = ((parentHostContext : any) : HostContextProd);
    return getChildNamespace(parentNamespace, type);
  },

  prepareForCommit() : void {
    eventsEnabled = ReactBrowserEventEmitter.isEnabled();
    selectionInformation = ReactInputSelection.getSelectionInformation();
    ReactBrowserEventEmitter.setEnabled(false);
  },

  resetAfterCommit() : void {
    ReactInputSelection.restoreSelection(selectionInformation);
    selectionInformation = null;
    ReactBrowserEventEmitter.setEnabled(eventsEnabled);
    eventsEnabled = null;
  },

  createInstance(
    type : string,
    props : Props,
    rootContainerInstance : Container,
    hostContext : HostContext,
    internalInstanceHandle : Object,
  ) : Instance {
    let parentNamespace : string;
    if (__DEV__) {
      // TODO: take namespace into account when validating.
      const hostContextDev = ((hostContext : any) : HostContextDev);
      validateDOMNesting(type, null, null, hostContextDev.ancestorInfo);
      if (
        typeof props.children === 'string' ||
        typeof props.children === 'number'
      ) {
        const ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type, null);
        validateDOMNesting(null, String(props.children), null, ownAncestorInfo);
      }
      parentNamespace = hostContextDev.namespace;
    } else {
      parentNamespace = ((hostContext : any) : HostContextProd);
    }
    const domElement : Instance = createElement(type, props, rootContainerInstance, parentNamespace);
    precacheFiberNode(internalInstanceHandle, domElement);
    return domElement;
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
  },

  finalizeInitialChildren(
    domElement : Instance,
    type : string,
    props : Props,
    rootContainerInstance : Container,
  ) : boolean {
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return shouldAutoFocusHostComponent(type, props);
  },

  prepareUpdate(
    domElement : Instance,
    type : string,
    oldProps : Props,
    newProps : Props,
    hostContext : HostContext,
  ) : boolean {
    if (__DEV__) {
      const hostContextDev = ((hostContext : any) : HostContextDev);
      if (typeof newProps.children !== typeof oldProps.children && (
        typeof newProps.children === 'string' ||
        typeof newProps.children === 'number'
      )) {
        const ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type, null);
        validateDOMNesting(null, String(newProps.children), null, ownAncestorInfo);
      }
    }
    return true;
  },

  commitMount(
    domElement : Instance,
    type : string,
    newProps : Props,
    rootContainerInstance : Container,
    internalInstanceHandle : Object,
  ) : void {
    if (shouldAutoFocusHostComponent(type, newProps)) {
      (domElement : any).focus();
    }
  },

  commitUpdate(
    domElement : Instance,
    type : string,
    oldProps : Props,
    newProps : Props,
    rootContainerInstance : Container,
    internalInstanceHandle : Object,
  ) : void {
    // Update the internal instance handle so that we know which props are
    // the current ones.
    precacheFiberNode(internalInstanceHandle, domElement);
    updateProperties(domElement, type, oldProps, newProps, rootContainerInstance);
  },

  shouldSetTextContent(props : Props) : boolean {
    return (
      typeof props.children === 'string' ||
      typeof props.children === 'number' ||
      (
        typeof props.dangerouslySetInnerHTML === 'object' &&
        props.dangerouslySetInnerHTML !== null &&
        typeof props.dangerouslySetInnerHTML.__html === 'string'
      )
    );
  },

  resetTextContent(domElement : Instance) : void {
    domElement.textContent = '';
  },

  createTextInstance(
    text : string,
    rootContainerInstance : Container,
    hostContext : HostContext,
    internalInstanceHandle : Object
  ) : TextInstance {
    if (__DEV__) {
      const hostContextDev = ((hostContext : any) : HostContextDev);
      validateDOMNesting(null, text, null, hostContextDev.ancestorInfo);
    }
    var textNode : TextInstance = document.createTextNode(text);
    precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
  },

  commitTextUpdate(textInstance : TextInstance, oldText : string, newText : string) : void {
    textInstance.nodeValue = newText;
  },

  appendChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
  },

  insertBefore(
    parentInstance : Instance | Container,
    child : Instance | TextInstance,
    beforeChild : Instance | TextInstance
  ) : void {
    parentInstance.insertBefore(child, beforeChild);
  },

  removeChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    parentInstance.removeChild(child);
  },

  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback,

  useSyncScheduling: true,

});

ReactGenericBatching.injection.injectFiberBatchedUpdates(DOMRenderer.batchedUpdates);

var warned = false;

function warnAboutUnstableUse() {
  // Ignore this warning is the feature flag is turned on. E.g. for tests.
  warning(
    warned || ReactDOMFeatureFlags.useFiber,
    'You are using React DOM Fiber which is an experimental renderer. ' +
    'It is likely to have bugs, breaking changes and is unsupported.'
  );
  warned = true;
}

function renderSubtreeIntoContainer(parentComponent : ?ReactComponent<any, any, any>, children : ReactNodeList, containerNode : DOMContainerElement | Document, callback: ?Function) {
  validateContainer(containerNode);

  let container : DOMContainerElement =
    containerNode.nodeType === DOCUMENT_NODE ? (containerNode : any).documentElement : (containerNode : any);
  let root = container._reactRootContainer;
  if (!root) {
    // First clear any existing content.
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    const newRoot = DOMRenderer.createContainer(container);
    root = container._reactRootContainer = newRoot;
    // Initial mount should not be batched.
    DOMRenderer.unbatchedUpdates(() => {
      DOMRenderer.updateContainer(children, newRoot, parentComponent, callback);
    });
  } else {
    DOMRenderer.updateContainer(children, root, parentComponent, callback);
  }
  return DOMRenderer.getPublicRootInstance(root);
}

var ReactDOM = {

  render(element : ReactElement<any>, container : DOMContainerElement, callback: ?Function) {
    validateContainer(container);
    return renderSubtreeIntoContainer(null, element, container, callback);
  },

  unstable_renderSubtreeIntoContainer(parentComponent : ReactComponent<any, any, any>, element : ReactElement<any>, containerNode : DOMContainerElement | Document, callback: ?Function) {
    invariant(
      parentComponent != null && ReactInstanceMap.has(parentComponent),
      'parentComponent must be a valid React Component'
    );
    return renderSubtreeIntoContainer(parentComponent, element, containerNode, callback);
  },

  unmountComponentAtNode(container : DOMContainerElement) {
    invariant(
      isValidContainer(container),
      'unmountComponentAtNode(...): Target container is not a DOM element.'
    );
    warnAboutUnstableUse();
    if (container._reactRootContainer) {
      // Unmount should not be batched.
      return DOMRenderer.unbatchedUpdates(() => {
        return renderSubtreeIntoContainer(null, null, container, () => {
          container._reactRootContainer = null;
        });
      });
    }
  },

  findDOMNode: findDOMNode,

  unstable_createPortal(children: ReactNodeList, container : DOMContainerElement, key : ?string = null) {
    // TODO: pass ReactDOM portal implementation as third argument
    return ReactPortal.createPortal(children, container, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  unstable_deferredUpdates: DOMRenderer.deferredUpdates,

};

module.exports = ReactDOM;
