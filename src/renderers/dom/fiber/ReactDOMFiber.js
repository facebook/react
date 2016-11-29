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
type Props = { className ?: string };
type Instance = Element;
type TextInstance = Text;

let eventsEnabled : ?boolean = null;
let selectionInformation : ?mixed = null;

var DOMRenderer = ReactFiberReconciler({

  getChildHostContext(parentHostContext : string | null, type : string) {
    const parentNamespace = parentHostContext;
    return getChildNamespace(parentNamespace, type);
  },

  prepareForCommit() : void {
    eventsEnabled = ReactBrowserEventEmitter.isEnabled();
    ReactBrowserEventEmitter.setEnabled(false);
    selectionInformation = ReactInputSelection.getSelectionInformation();
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
    hostContext : string | null,
    internalInstanceHandle : Object,
  ) : Instance {
    const domElement : Instance = createElement(type, props, rootContainerInstance, hostContext);
    precacheFiberNode(internalInstanceHandle, domElement);
    return domElement;
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
  },

  finalizeInitialChildren(
    domElement : Instance,
    props : Props,
    rootContainerInstance : Container,
  ) : void {
    // TODO: we normalize here because DOM renderer expects tag to be lowercase.
    // We can change DOM renderer to compare special case against upper case,
    // and use tagName (which is upper case for HTML DOM elements). Or we could
    // let the renderer "normalize" the fiber type so we don't have to read
    // the type from DOM. However we need to remember SVG is case-sensitive.
    var tag = domElement.tagName.toLowerCase();
    setInitialProperties(domElement, tag, props, rootContainerInstance);
  },

  prepareUpdate(
    domElement : Instance,
    oldProps : Props,
    newProps : Props
  ) : boolean {
    return true;
  },

  commitUpdate(
    domElement : Instance,
    oldProps : Props,
    newProps : Props,
    rootContainerInstance : Container,
    internalInstanceHandle : Object,
  ) : void {
    // TODO: we normalize here because DOM renderer expects tag to be lowercase.
    // We can change DOM renderer to compare special case against upper case,
    // and use tagName (which is upper case for HTML DOM elements). Or we could
    // let the renderer "normalize" the fiber type so we don't have to read
    // the type from DOM. However we need to remember SVG is case-sensitive.
    var tag = domElement.tagName.toLowerCase();
    // Update the internal instance handle so that we know which props are
    // the current ones.
    precacheFiberNode(internalInstanceHandle, domElement);
    updateProperties(domElement, tag, oldProps, newProps, rootContainerInstance);
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

  createTextInstance(text : string, internalInstanceHandle : Object) : TextInstance {
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

function renderSubtreeIntoContainer(parentComponent : ?ReactComponent<any, any, any>, element : ReactElement<any>, containerNode : DOMContainerElement | Document, callback: ?Function) {
  let container : DOMContainerElement =
    containerNode.nodeType === DOCUMENT_NODE ? (containerNode : any).documentElement : (containerNode : any);
  let root;
  if (!container._reactRootContainer) {
    // First clear any existing content.
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    root = container._reactRootContainer = DOMRenderer.mountContainer(element, container, parentComponent, callback);
  } else {
    DOMRenderer.updateContainer(element, root = container._reactRootContainer, parentComponent, callback);
  }
  return DOMRenderer.getPublicRootInstance(root);
}

var ReactDOM = {

  render(element : ReactElement<any>, container : DOMContainerElement, callback: ?Function) {
    warnAboutUnstableUse();
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
    warnAboutUnstableUse();
    const root = container._reactRootContainer;
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this
      // unmount could be deferred?
      container._reactRootContainer = null;
      DOMRenderer.unmountContainer(root);
    }
  },

  findDOMNode: findDOMNode,

  unstable_createPortal(children: ReactNodeList, container : DOMContainerElement, key : ?string = null) {
    // TODO: pass ReactDOM portal implementation as third argument
    return ReactPortal.createPortal(children, container, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

};

module.exports = ReactDOM;
