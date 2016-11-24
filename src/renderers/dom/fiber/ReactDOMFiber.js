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
import type { HostChildren } from 'ReactFiberReconciler';
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
  setInitialProperties,
  updateProperties,
} = ReactDOMFiberComponent;
var { precacheFiberNode } = ReactDOMComponentTree;

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

function recursivelyAppendChildren(parent : Element, child : HostChildren<Instance | TextInstance>) {
  if (!child) {
    return;
  }
  /* $FlowFixMe: Element and Text should have this property. */
  if (child.nodeType === 1 || child.nodeType === 3) {
    /* $FlowFixMe: Refinement issue. I don't know how to express different. */
    parent.appendChild(child);
  } else {
    /* As a result of the refinement issue this type isn't known. */
    let node : any = child;
    do {
      recursivelyAppendChildren(parent, node.output);
    } while (node = node.sibling);
  }
}

let eventsEnabled : ?boolean = null;
let selectionInformation : ?mixed = null;

var DOMRenderer = ReactFiberReconciler({

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

  updateContainer(container : Container, children : HostChildren<Instance | TextInstance>) : void {
    // TODO: Containers should update similarly to other parents.
    container.innerHTML = '';
    recursivelyAppendChildren(container, children);
  },

  createInstance(
    type : string,
    props : Props,
    children : HostChildren<Instance | TextInstance>,
    internalInstanceHandle : Object
  ) : Instance {
    const root = document.body; // HACK

    const domElement : Instance = createElement(type, props, root);
    precacheFiberNode(internalInstanceHandle, domElement);
    recursivelyAppendChildren(domElement, children);
    setInitialProperties(domElement, type, props, root);
    return domElement;
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
    internalInstanceHandle : Object
  ) : void {
    var type = domElement.tagName.toLowerCase(); // HACK
    var root = document.body; // HACK
    // Update the internal instance handle so that we know which props are
    // the current ones.
    precacheFiberNode(internalInstanceHandle, domElement);
    updateProperties(domElement, type, oldProps, newProps, root);
  },

  createTextInstance(text : string, internalInstanceHandle : Object) : TextInstance {
    var textNode : TextInstance = document.createTextNode(text);
    precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
  },

  commitTextUpdate(textInstance : TextInstance, oldText : string, newText : string) : void {
    textInstance.nodeValue = newText;
  },

  appendChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
  },

  insertBefore(
    parentInstance : Instance,
    child : Instance | TextInstance,
    beforeChild : Instance | TextInstance
  ) : void {
    parentInstance.insertBefore(child, beforeChild);
  },

  removeChild(parentInstance : Instance, child : Instance | TextInstance) : void {
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

function renderSubtreeIntoContainer(parentComponent : ?ReactComponent<any, any, any>, element : ReactElement<any>, container : DOMContainerElement, callback: ?Function) {
  let root;
  if (!container._reactRootContainer) {
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

  unstable_renderSubtreeIntoContainer(parentComponent : ReactComponent<any, any, any>, element : ReactElement<any>, container : DOMContainerElement, callback: ?Function) {
    invariant(
      parentComponent != null && ReactInstanceMap.has(parentComponent),
      'parentComponent must be a valid React Component'
    );
    return renderSubtreeIntoContainer(parentComponent, element, container, callback);
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
