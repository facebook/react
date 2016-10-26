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

import type { HostChildren } from 'ReactFiberReconciler';

var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

var warning = require('warning');

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

var DOMRenderer = ReactFiberReconciler({

  updateContainer(container : Container, children : HostChildren<Instance | TextInstance>) : void {
    // TODO: Containers should update similarly to other parents.
    container.innerHTML = '';
    recursivelyAppendChildren(container, children);
  },

  createInstance(type : string, props : Props, children : HostChildren<Instance | TextInstance>) : Instance {
    const domElement = document.createElement(type);
    recursivelyAppendChildren(domElement, children);
    if (typeof props.className !== 'undefined') {
      domElement.className = props.className;
    }
    if (typeof props.children === 'string') {
      domElement.textContent = props.children;
    } else if (typeof props.children === 'number') {
      domElement.textContent = props.children.toString();
    }
    return domElement;
  },

  prepareUpdate(
    domElement : Instance,
    oldProps : Props,
    newProps : Props
  ) : boolean {
    return true;
  },

  commitUpdate(domElement : Instance, oldProps : Props, newProps : Props) : void {
    if (typeof newProps.className !== 'undefined') {
      domElement.className = newProps.className;
    }
    if (typeof newProps.children === 'string') {
      domElement.textContent = newProps.children;
    } else if (typeof newProps.children === 'number') {
      domElement.textContent = newProps.children.toString();
    }
  },

  createTextInstance(text : string) : TextInstance {
    return document.createTextNode(text);
  },

  commitTextUpdate(textInstance : TextInstance, oldText : string, newText : string) : void {
    textInstance.nodeValue = newText;
  },

  appendChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
  },

  insertBefore(parentInstance : Instance, child : Instance | TextInstance, beforeChild : Instance | TextInstance) : void {
    parentInstance.insertBefore(child, beforeChild);
  },

  removeChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.removeChild(child);
  },

  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback,

});

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

var ReactDOM = {

  render(element : ReactElement<any>, container : DOMContainerElement, callback: ?Function) {
    warnAboutUnstableUse();
    let root;
    if (!container._reactRootContainer) {
      root = container._reactRootContainer = DOMRenderer.mountContainer(element, container, callback);
    } else {
      DOMRenderer.updateContainer(element, root = container._reactRootContainer, callback);
    }
    return DOMRenderer.getPublicRootInstance(root);
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

  findDOMNode(componentOrElement : Element | ?ReactComponent<any, any, any>) : null | Element | Text {
    if (componentOrElement == null) {
      return null;
    }
    // Unsound duck typing.
    const component = (componentOrElement : any);
    if (component.nodeType === 1) {
      return component;
    }
    return DOMRenderer.findHostInstance(component);
  },

};

module.exports = ReactDOM;
