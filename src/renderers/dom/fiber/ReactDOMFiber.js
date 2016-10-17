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
var ReactDefaultInjection = require('ReactDefaultInjection');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

var {
  properties: DOMProperties,
  isCustomAttribute,
} = require('DOMProperty');

var {
  deleteValueForProperty,
  setValueForProperty,
} = require('DOMPropertyOperations');

var warning = require('warning');

type DOMContainerElement = Element & { _reactRootContainer: ?Object };

type Container = Element;
type Props = { };
type Instance = Element;
type TextInstance = Text;

// TODO: this brings a lot of non-Fiber code into the Fiber bundle.
// However, without it tests that use both ReactDOM (Fiber) and
// ReactDOMServer (non-Fiber) in the same file break due to "double injection".
ReactDefaultInjection.inject();

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

function removeMissingPrevDOMProperties(
  domElement: Element,
  oldProps: Props,
  newProps: Props,
) {
  for (const propKey in oldProps) {
    if (newProps.hasOwnProperty(propKey) ||
        !oldProps.hasOwnProperty(propKey) ||
        oldProps[propKey] == null) {
      continue;
    }
    // TODO: unregister events, remove styles, handle custom components
    if (DOMProperties[propKey] || isCustomAttribute(propKey)) {
      deleteValueForProperty(domElement, propKey, 0);
    }
  }
}

function applyNextDOMProperties(
  domElement: Element,
  oldProps: Props | null,
  newProps: Props,
) {
  // TODO: associate DOM nodes with components for ReactPerf
  const debugID = 1;
  for (const propKey in newProps) {
    const newProp = newProps[propKey];
    const oldProp = oldProps != null ? oldProps[propKey] : undefined;

    if (!newProps.hasOwnProperty(propKey) ||
        newProp === oldProp ||
        newProp == null && oldProp == null) {
      continue;
    }

    // TODO: register events, add styles, handle custom components
    if (DOMProperties[propKey] || isCustomAttribute(propKey)) {
      // If we're updating to null or undefined, we should remove the property
      // from the DOM node instead of inadvertently setting to a string. This
      // brings us in line with the same behavior we have on initial render.
      if (newProp != null) {
        setValueForProperty(domElement, propKey, newProp, debugID);
      } else {
        deleteValueForProperty(domElement, propKey, debugID);
      }
    }
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
    applyNextDOMProperties(domElement, null, props);
    recursivelyAppendChildren(domElement, children);
    if (typeof props.children === 'string' ||
        typeof props.children === 'number') {
      domElement.textContent = props.children;
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
    removeMissingPrevDOMProperties(domElement, oldProps, newProps);
    applyNextDOMProperties(domElement, oldProps, newProps);
    if (typeof newProps.children === 'string' ||
        typeof newProps.children === 'number') {
      domElement.textContent = newProps.children;
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

  render(element : ReactElement<any>, container : DOMContainerElement) {
    warnAboutUnstableUse();
    if (!container._reactRootContainer) {
      container._reactRootContainer = DOMRenderer.mountContainer(element, container);
    } else {
      DOMRenderer.updateContainer(element, container._reactRootContainer);
    }
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

};

module.exports = ReactDOM;
