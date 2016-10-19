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

type Element = HTMLElement;

type DOMContainerElement = Element & { _reactRootContainer: ?Object };

type Container = Element;
type Props = { };
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

var COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

if (!window.requestIdleCallback) {
  window.requestIdleCallback = function(callback) {
    setTimeout(function() {
      var endTime = Date.now() + 16;
      callback({
        timeRemaining() {
          return endTime - Date.now();
        },
      });

    }, 0);
  };
}

var VISUALIZE_RECONCILIATION = false;

var DOMRenderer = ReactFiberReconciler({

  updateContainer(container : Container, children : HostChildren<Instance | TextInstance>) : void {
    // TODO: Containers should update similarly to other parents.
    if (container.firstChild === children && container.lastChild === children) {
      // Rudimentary bail out mechanism.
      return;
    }
    container.innerHTML = '';
    recursivelyAppendChildren(container, children);
  },

  createInstance(type : string, props : Props, children : HostChildren<Instance | TextInstance>) : Instance {
    const domElement = document.createElement(type);
    recursivelyAppendChildren(domElement, children);
    if (typeof props.style === 'object') {
      Object.assign(domElement.style, props.style);
    }
    if (typeof props.onMouseEnter === 'function') {
      domElement.addEventListener('mouseenter', props.onMouseEnter);
    }
    if (typeof props.onMouseLeave === 'function') {
      domElement.addEventListener('mouseleave', props.onMouseLeave);
    }
    if (typeof props.children === 'string' ||
        typeof props.children === 'number') {
      domElement.textContent = props.children;
      return domElement;
    }
    domElement.innerHTML = '';
    recursivelyAppendChildren(domElement, children);
    return domElement;
  },

  prepareUpdate(
    domElement : Instance,
    oldProps : Props,
    newProps : Props
  ) : boolean {
    /*
    Visualize the reconciliation
    */
    if (VISUALIZE_RECONCILIATION && typeof newProps.children === 'string') {
      var c = +newProps.children;
      if (!isNaN(c)) {
        domElement.style.border = '3px solid ' + COLORS[c];

//        domElement.style.background = COLORS[c];
      }
    }
    return true;
  },

  beginUpdate(domElement) {
    /*if (VISUALIZE_RECONCILIATION) {
      var c = (Math.round(Date.now() / 50) + 2) % COLORS.length;
      if (!isNaN(c)) {
        domElement.style.border = '3px solid ' + COLORS[c];
      }
    }*/
  },

  commitUpdate(domElement : Instance, oldProps : Props, newProps : Props) : void {
    if (typeof newProps.style === 'object') {
      var oldStyle = oldProps.style;
      var newStyle = newProps.style;
      if (oldStyle) {
        for (var key in newStyle) {
          if (oldStyle[key] !== newStyle[key]) {
            domElement.style[key] = newStyle[key];
          }
        }
      } else {
        Object.assign(domElement.style, newStyle);
      }
    }
    if (typeof newProps.children === 'string' ||
        typeof newProps.children === 'number') {
      domElement.textContent = newProps.children;
      return;
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

var rootContainer = null;

var ReactDOM = {

  render(element : ReactElement<any>, container : DOMContainerElement) {
    warnAboutUnstableUse();
    if (!container._reactRootContainer) {
      container._reactRootContainer = rootContainer = DOMRenderer.mountContainer(element, container);
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

  // Logs the current state of the tree.
  dumpTree() {
    if (!rootContainer) {
      console.log('Nothing rendered yet.');
      return;
    }

    function logFiber(fiber : any, depth) {
      console.log(
        '  '.repeat(depth) + '- ' + (fiber.type ? fiber.type.name || fiber.type : '[root]'),
        '[' + fiber.pendingWorkPriority + (fiber.pendingProps ? '*' : '') + ']'
      );
      const childInProgress = fiber.childInProgress;
      if (childInProgress) {
        if (childInProgress === fiber.child) {
          console.log('  '.repeat(depth + 1) + 'ERROR: IN PROGRESS == CURRENT');
        } else {
          console.log('  '.repeat(depth + 1) + 'IN PROGRESS');
          logFiber(childInProgress, depth + 1);
          if (fiber.child) {
            console.log('  '.repeat(depth + 1) + 'CURRENT');
          }
        }
      }
      if (fiber.child) {
        logFiber(fiber.child, depth + 1);
      }
      if (fiber.sibling) {
        logFiber(fiber.sibling, depth);
      }
    }

    console.log('FIBERS:');
    logFiber((rootContainer.stateNode : any).current, 0);
  },

};

module.exports = ReactDOM;
