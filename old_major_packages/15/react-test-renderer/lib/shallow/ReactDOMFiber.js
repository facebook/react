/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var ReactFiberReconciler = require('./ReactFiberReconciler');

var warning = require('fbjs/lib/warning');

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


  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback
});

var warned = false;

function warnAboutUnstableUse() {
  process.env.NODE_ENV !== 'production' ? warning(warned, 'You are using React DOM Fiber which is an experimental renderer. ' + 'It is likely to have bugs, breaking changes and is unsupported.') : void 0;
  warned = true;
}

var ReactDOM = {
  render: function (element, container) {
    warnAboutUnstableUse();
    if (!container._reactRootContainer) {
      container._reactRootContainer = DOMRenderer.mountContainer(element, container);
    } else {
      DOMRenderer.updateContainer(element, container._reactRootContainer);
    }
  },
  unmountComponentAtNode: function (container) {
    warnAboutUnstableUse();
    var root = container._reactRootContainer;
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this
      // unmount could be deferred?
      container._reactRootContainer = null;
      DOMRenderer.unmountContainer(root);
    }
  }
};

module.exports = ReactDOM;