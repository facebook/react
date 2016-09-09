/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiber
 * 
 */

'use strict';

var ReactFiberReconciler = require('./ReactFiberReconciler');

function recursivelyAppendChildren(parent, child) {
  if (!child) {
    return;
  }
  /* $FlowFixMe: Element should have this property. */
  if (child.nodeType === 1) {
    /* $FlowFixMe: Refinement issue. I don't know how to express different. */
    parent.appendChild(child);
  } else {
    /* As a result of the refinement issue this type isn't known. */
    var node = child;
    do {
      recursivelyAppendChildren(parent, node.output);
    } while (node = node.sibling);
  }
}

var DOMRenderer = ReactFiberReconciler({
  updateContainer: function (container, children) {
    container.innerHTML = '';
    recursivelyAppendChildren(container, children);
  },
  createInstance: function (type, props, children) {
    var domElement = document.createElement(type);
    recursivelyAppendChildren(domElement, children);
    if (typeof props.children === 'string') {
      domElement.textContent = props.children;
    }
    return domElement;
  },
  prepareUpdate: function (domElement, oldProps, newProps, children) {
    return true;
  },
  commitUpdate: function (domElement, oldProps, newProps, children) {
    domElement.innerHTML = '';
    recursivelyAppendChildren(domElement, children);
    if (typeof newProps.children === 'string') {
      domElement.textContent = newProps.children;
    }
  },
  deleteInstance: function (instance) {
    // Noop
  },
  scheduleHighPriCallback: window.requestAnimationFrame,

  scheduleLowPriCallback: window.requestIdleCallback

});

var ReactDOM = {
  render: function (element, container) {
    if (!container._reactRootContainer) {
      container._reactRootContainer = DOMRenderer.mountContainer(element, container);
    } else {
      DOMRenderer.updateContainer(element, container._reactRootContainer);
    }
  }
};

module.exports = ReactDOM;