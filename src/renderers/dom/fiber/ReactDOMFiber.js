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

var DOMNamespaces = require('DOMNamespaces');
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
var {
  svg: SVG_NAMESPACE,
  mathml: MATH_NAMESPACE,
} = DOMNamespaces;

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

// The next few variables are mutable state that changes as we perform work.
// We could have replaced them by a single stack of namespaces but we want
// to avoid it since this is a very hot path.
let currentNamespaceURI : null | SVG_NAMESPACE | MATH_NAMESPACE = null;
// How many <foreignObject>s we have entered so far.
// We increment and decrement it when pushing and popping <foreignObject>.
// We use this counter as the current index for accessing the array below.
let foreignObjectDepth : number = 0;
// How many <svg>s have we entered so far.
// We increment or decrement the last array item when pushing and popping <svg>.
// A new counter is appended to the end whenever we enter a <foreignObject>.
let svgDepthByForeignObjectDepth : Array<number> | null = null;
// For example:
// <svg><foreignObject><svg><svg><svg><foreignObject><svg>
//  ^^^  ^^^^^^^^^^^^^  ^^^^^^^^^^^^^  ^^^^^^^^^^^^^  ^^^]
// [ 1         ,              3              ,         1 ]

// The mutable state above becomes irrelevant whenever we push a portal
// because a portal represents a different DOM tree. We store a snapshot
// of this state and restore it when the portal is popped.
type PortalState = {
  currentNamespaceURI: string | null,
  foreignObjectDepth: number,
  svgDepthByForeignObjectDepth: Array<number> | null,
};
let portalState : Array<PortalState> | null = null;
let portalStateIndex : number = -1;

function getIntrinsicNamespaceURI(type : string) {
  switch (type) {
    case 'svg':
      return SVG_NAMESPACE;
    case 'math':
      return MATH_NAMESPACE;
    default:
      return null;
  }
}

var DOMRenderer = ReactFiberReconciler({

  pushHostContext(type : string) {
    switch (type) {
      case 'svg':
        // Lazily initialize the array for the first time.
        if (!svgDepthByForeignObjectDepth) {
          svgDepthByForeignObjectDepth = [0];
        }
        if (currentNamespaceURI == null) {
          // We are entering an <svg> for the first time.
          currentNamespaceURI = SVG_NAMESPACE;
          svgDepthByForeignObjectDepth[foreignObjectDepth] = 1;
        } else if (currentNamespaceURI === SVG_NAMESPACE) {
          // We are entering an <svg> inside <svg>.
          // We record this fact so that when we pop this <svg>, we stay in the
          // SVG mode instead of switching to HTML mode.
          svgDepthByForeignObjectDepth[foreignObjectDepth]++;
        }
        break;
      case 'math':
        if (currentNamespaceURI == null) {
          currentNamespaceURI = MATH_NAMESPACE;
        }
        break;
      case 'foreignObject':
        if (currentNamespaceURI === SVG_NAMESPACE) {
          currentNamespaceURI = null;
          // We are in HTML mode again, so current <svg> nesting counter needs
          // to be reset. However we still need to remember its value when we
          // pop this <foreignObject>. So instead of resetting the counter, we
          // advance the pointer, and start a new independent <svg> depth
          // counter at the next array index.
          foreignObjectDepth++;
          if (!svgDepthByForeignObjectDepth) {
            throw new Error('Expected to already be in SVG mode.');
          }
          svgDepthByForeignObjectDepth[foreignObjectDepth] = 0;
        }
        break;
    }
  },

  popHostContext(type : string) {
    switch (type) {
      case 'svg':
        if (currentNamespaceURI === SVG_NAMESPACE) {
          if (!svgDepthByForeignObjectDepth) {
            throw new Error('Expected to already be in SVG mode.');
          }
          if (svgDepthByForeignObjectDepth[foreignObjectDepth] === 1) {
            // We exited all nested <svg> nodes.
            // We can switch to HTML mode.
            currentNamespaceURI = null;
          } else {
            // There is still an <svg> above so we stay in SVG mode.
            // We decrease the counter so that next time we leave <svg>
            // we will be able to switch to HTML mode.
            svgDepthByForeignObjectDepth[foreignObjectDepth]--;
          }
        }
        break;
      case 'math':
        if (currentNamespaceURI === MATH_NAMESPACE) {
          currentNamespaceURI = null;
        }
        break;
      case 'foreignObject':
        if (currentNamespaceURI == null) {
          // We are exiting <foreignObject> and nested <svg>s may exist above.
          // Switch to the previous <svg> depth counter by decreasing the index.
          foreignObjectDepth--;
          currentNamespaceURI = SVG_NAMESPACE;
        }
        break;
    }
  },

  pushHostPortal() : void {
    // We optimize for the simple case: portals usually exist outside of SVG.
    const canBailOutOfTrackingPortalState = (
      // If we're in HTML mode, we don't need to save this.
      currentNamespaceURI == null &&
      // If state was ever saved before, we can't bail out because we wouldn't
      // be able to tell whether to restore it or not next time we pop a portal.
      portalStateIndex === -1
    );
    if (canBailOutOfTrackingPortalState) {
      return;
    }
    // We are going to save the state before entering the portal.
    portalStateIndex++;
    // We are inside <svg> (or deeper) and need to store that before
    // jumping into a portal elsewhere in the tree.
    if (!portalState) {
      portalState = [];
    }
    if (!portalState[portalStateIndex]) {
      // Lazily allocate a single object for every portal nesting level.
      portalState[portalStateIndex] = {
        currentNamespaceURI,
        foreignObjectDepth,
        svgDepthByForeignObjectDepth,
      };
    } else {
      // If we already have state on the stack, just mutate it.
      const mutableState = portalState[portalStateIndex];
      mutableState.currentNamespaceURI = currentNamespaceURI;
      mutableState.foreignObjectDepth = foreignObjectDepth;
      mutableState.svgDepthByForeignObjectDepth = svgDepthByForeignObjectDepth;
    }
    // Reset the host context we're working with.
    // TODO: what if the portal is inside <svg> element itself?
    // We currently don't handle this case.
    currentNamespaceURI = null;
    foreignObjectDepth = 0;
    svgDepthByForeignObjectDepth = null;
  },

  popHostPortal() {
    if (portalStateIndex === -1 || portalState == null) {
      // There is nothing interesting to restore.
      return;
    }
    // Restore to the state before we entered that portal.
    const savedState = portalState[portalStateIndex];
    currentNamespaceURI = savedState.currentNamespaceURI;
    foreignObjectDepth = savedState.foreignObjectDepth;
    svgDepthByForeignObjectDepth = savedState.svgDepthByForeignObjectDepth;
    // We have restored the state.
    portalStateIndex--;
  },

  resetHostContext() : void {
    currentNamespaceURI = null;
    foreignObjectDepth = 0;
    portalStateIndex = -1;
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
    internalInstanceHandle : Object
  ) : Instance {
    const root = document.documentElement; // HACK

    const namespaceURI = currentNamespaceURI || getIntrinsicNamespaceURI(type);
    const domElement : Instance = createElement(type, props, namespaceURI, root);
    precacheFiberNode(internalInstanceHandle, domElement);
    return domElement;
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
  },

  finalizeInitialChildren(domElement : Instance, type : string, props : Props) : void {
    const root = document.documentElement; // HACK

    setInitialProperties(domElement, type, props, root);
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
    var root = document.documentElement; // HACK
    // Update the internal instance handle so that we know which props are
    // the current ones.
    precacheFiberNode(internalInstanceHandle, domElement);
    updateProperties(domElement, type, oldProps, newProps, root);
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
