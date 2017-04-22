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

import type {HostChildren} from 'ReactFiberReconciler';

var ReactFiberReconciler = require('ReactFiberReconciler');

var warning = require('warning');

type DOMContainerElement = Element & {_reactRootContainer: ?Object};

type Container = Element;
type Props = {};
type Instance = Element;

function recursivelyAppendChildren(
  parent: Element,
  child: HostChildren<Instance>,
) {
  if (!child) {
    return;
  }
  /* $FlowFixMe: Element should have this property. */
  if (child.nodeType === 1) {
    /* $FlowFixMe: Refinement issue. I don't know how to express different. */
    parent.appendChild(child);
  } else {
    /* As a result of the refinement issue this type isn't known. */
    let node: any = child;
    do {
      recursivelyAppendChildren(parent, node.output);
    } while ((node = node.sibling));
  }
}

var DOMRenderer = ReactFiberReconciler({
  updateContainer(
    container: Container,
    children: HostChildren<Instance>,
  ): void {
    container.innerHTML = '';
    recursivelyAppendChildren(container, children);
  },

  createInstance(
    type: string,
    props: Props,
    children: HostChildren<Instance>,
  ): Instance {
    const domElement = document.createElement(type);
    recursivelyAppendChildren(domElement, children);
    if (typeof props.children === 'string') {
      domElement.textContent = props.children;
    }
    return domElement;
  },

  prepareUpdate(
    domElement: Instance,
    oldProps: Props,
    newProps: Props,
    children: HostChildren<Instance>,
  ): boolean {
    return true;
  },

  commitUpdate(
    domElement: Instance,
    oldProps: Props,
    newProps: Props,
    children: HostChildren<Instance>,
  ): void {
    domElement.innerHTML = '';
    recursivelyAppendChildren(domElement, children);
    if (typeof newProps.children === 'string') {
      domElement.textContent = newProps.children;
    }
  },

  deleteInstance(instance: Instance): void {
    // Noop
  },

  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback,
});

var warned = false;

function warnAboutUnstableUse() {
  warning(
    warned,
    'You are using React DOM Fiber which is an experimental renderer. ' +
      'It is likely to have bugs, breaking changes and is unsupported.',
  );
  warned = true;
}

var ReactDOM = {
  render(element: ReactElement<any>, container: DOMContainerElement) {
    warnAboutUnstableUse();
    if (!container._reactRootContainer) {
      container._reactRootContainer = DOMRenderer.mountContainer(
        element,
        container,
      );
    } else {
      DOMRenderer.updateContainer(element, container._reactRootContainer);
    }
  },

  unmountComponentAtNode(container: DOMContainerElement) {
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
