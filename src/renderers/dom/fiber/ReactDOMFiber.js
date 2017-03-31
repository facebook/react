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

import type {Fiber} from 'ReactFiber';
import type {ReactNodeList} from 'ReactTypes';

var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactControlledComponent = require('ReactControlledComponent');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactFeatureFlags = require('ReactFeatureFlags');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactDOMFiberComponent = require('ReactDOMFiberComponent');
var ReactDOMFrameScheduling = require('ReactDOMFrameScheduling');
var ReactDOMInjection = require('ReactDOMInjection');
var ReactGenericBatching = require('ReactGenericBatching');
var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactInputSelection = require('ReactInputSelection');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactPortal = require('ReactPortal');
var {isValidElement} = require('react');
var {injectInternals} = require('ReactFiberDevToolsHook');

var findDOMNode = require('findDOMNode');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var {
  createElement,
  getChildNamespace,
  setInitialProperties,
  diffProperties,
  updateProperties,
} = ReactDOMFiberComponent;
var {
  precacheFiberNode,
  updateFiberProps,
} = ReactDOMComponentTree;

if (__DEV__) {
  var validateDOMNesting = require('validateDOMNesting');
  var {updatedAncestorInfo} = validateDOMNesting;
}

const DOCUMENT_NODE = 9;

ReactDOMInjection.inject();
ReactControlledComponent.injection.injectFiberControlledHostComponent(
  ReactDOMFiberComponent,
);
findDOMNode._injectFiber(function(fiber: Fiber) {
  return DOMRenderer.findHostInstance(fiber);
});

type DOMContainerElement = Element & {_reactRootContainer: ?Object};

type Container = Element;
type Props = {
  autoFocus?: boolean,
  children?: mixed,
  hidden?: boolean,
};
type Instance = Element;
type TextInstance = Text;

type HostContextDev = {
  namespace: string,
  ancestorInfo: mixed,
};
type HostContextProd = string;
type HostContext = HostContextDev | HostContextProd;

let eventsEnabled: ?boolean = null;
let selectionInformation: ?mixed = null;

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
  return !!(node &&
    (node.nodeType === ELEMENT_NODE_TYPE ||
      node.nodeType === DOC_NODE_TYPE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE));
}

function validateContainer(container) {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }
}

function getReactRootElementInContainer(container: any) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOC_NODE_TYPE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

function shouldAutoFocusHostComponent(type: string, props: Props): boolean {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
}

var DOMRenderer = ReactFiberReconciler({
  getRootHostContext(rootContainerInstance: Container): HostContext {
    const ownNamespace = rootContainerInstance.namespaceURI || null;
    const type = rootContainerInstance.tagName;
    const namespace = getChildNamespace(ownNamespace, type);
    if (__DEV__) {
      const isMountingIntoDocument = rootContainerInstance.ownerDocument.documentElement ===
        rootContainerInstance;
      const validatedTag = isMountingIntoDocument
        ? '#document'
        : type.toLowerCase();
      const ancestorInfo = updatedAncestorInfo(null, validatedTag, null);
      return {namespace, ancestorInfo};
    }
    return namespace;
  },

  getChildHostContext(
    parentHostContext: HostContext,
    type: string,
  ): HostContext {
    if (__DEV__) {
      const parentHostContextDev = ((parentHostContext: any): HostContextDev);
      const namespace = getChildNamespace(parentHostContextDev.namespace, type);
      const ancestorInfo = updatedAncestorInfo(
        parentHostContextDev.ancestorInfo,
        type,
        null,
      );
      return {namespace, ancestorInfo};
    }
    const parentNamespace = ((parentHostContext: any): HostContextProd);
    return getChildNamespace(parentNamespace, type);
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit(): void {
    eventsEnabled = ReactBrowserEventEmitter.isEnabled();
    selectionInformation = ReactInputSelection.getSelectionInformation();
    ReactBrowserEventEmitter.setEnabled(false);
  },

  resetAfterCommit(): void {
    ReactInputSelection.restoreSelection(selectionInformation);
    selectionInformation = null;
    ReactBrowserEventEmitter.setEnabled(eventsEnabled);
    eventsEnabled = null;
  },

  createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: HostContext,
    internalInstanceHandle: Object,
  ): Instance {
    let parentNamespace: string;
    if (__DEV__) {
      // TODO: take namespace into account when validating.
      const hostContextDev = ((hostContext: any): HostContextDev);
      validateDOMNesting(type, null, null, hostContextDev.ancestorInfo);
      if (
        typeof props.children === 'string' || typeof props.children === 'number'
      ) {
        const string = '' + props.children;
        const ownAncestorInfo = updatedAncestorInfo(
          hostContextDev.ancestorInfo,
          type,
          null,
        );
        validateDOMNesting(null, string, null, ownAncestorInfo);
      }
      parentNamespace = hostContextDev.namespace;
    } else {
      parentNamespace = ((hostContext: any): HostContextProd);
    }
    const domElement: Instance = createElement(
      type,
      props,
      rootContainerInstance,
      parentNamespace,
    );
    precacheFiberNode(internalInstanceHandle, domElement);
    updateFiberProps(domElement, props);
    return domElement;
  },

  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    parentInstance.appendChild(child);
  },

  finalizeInitialChildren(
    domElement: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
  ): boolean {
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return shouldAutoFocusHostComponent(type, props);
  },

  prepareUpdate(
    domElement: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: HostContext,
  ): null | Array<mixed> {
    if (__DEV__) {
      const hostContextDev = ((hostContext: any): HostContextDev);
      if (
        typeof newProps.children !== typeof oldProps.children &&
        (typeof newProps.children === 'string' ||
          typeof newProps.children === 'number')
      ) {
        const string = '' + newProps.children;
        const ownAncestorInfo = updatedAncestorInfo(
          hostContextDev.ancestorInfo,
          type,
          null,
        );
        validateDOMNesting(null, string, null, ownAncestorInfo);
      }
    }
    return diffProperties(
      domElement,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
    );
  },

  commitMount(
    domElement: Instance,
    type: string,
    newProps: Props,
    internalInstanceHandle: Object,
  ): void {
    ((domElement: any):
      | HTMLButtonElement
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement).focus();
  },

  commitUpdate(
    domElement: Instance,
    updatePayload: Array<mixed>,
    type: string,
    oldProps: Props,
    newProps: Props,
    internalInstanceHandle: Object,
  ): void {
    // Update the props handle so that we know which props are the ones with
    // with current event handlers.
    updateFiberProps(domElement, newProps);
    // Apply the diff to the DOM node.
    updateProperties(domElement, updatePayload, type, oldProps, newProps);
  },

  shouldSetTextContent(props: Props): boolean {
    return typeof props.children === 'string' ||
      typeof props.children === 'number' ||
      (typeof props.dangerouslySetInnerHTML === 'object' &&
        props.dangerouslySetInnerHTML !== null &&
        typeof props.dangerouslySetInnerHTML.__html === 'string');
  },

  resetTextContent(domElement: Instance): void {
    domElement.textContent = '';
  },

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return !!props.hidden;
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: HostContext,
    internalInstanceHandle: Object,
  ): TextInstance {
    if (__DEV__) {
      const hostContextDev = ((hostContext: any): HostContextDev);
      validateDOMNesting(null, text, null, hostContextDev.ancestorInfo);
    }
    var textNode: TextInstance = document.createTextNode(text);
    precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
  },

  commitTextUpdate(
    textInstance: TextInstance,
    oldText: string,
    newText: string,
  ): void {
    textInstance.nodeValue = newText;
  },

  appendChild(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
  ): void {
    parentInstance.appendChild(child);
  },

  insertBefore(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ): void {
    parentInstance.insertBefore(child, beforeChild);
  },

  removeChild(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
  ): void {
    parentInstance.removeChild(child);
  },

  scheduleAnimationCallback: ReactDOMFrameScheduling.rAF,

  scheduleDeferredCallback: ReactDOMFrameScheduling.rIC,

  useSyncScheduling: !ReactDOMFeatureFlags.fiberAsyncScheduling,
});

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  DOMRenderer.batchedUpdates,
);

var warned = false;

function warnAboutUnstableUse() {
  // Ignore this warning is the feature flag is turned on. E.g. for tests.
  warning(
    warned || ReactDOMFeatureFlags.useFiber,
    'You are using React DOM Fiber which is an experimental renderer. ' +
      'It is likely to have bugs, breaking changes and is unsupported.',
  );
  warned = true;
}

function renderSubtreeIntoContainer(
  parentComponent: ?ReactComponent<any, any, any>,
  children: ReactNodeList,
  containerNode: DOMContainerElement | Document,
  callback: ?Function,
) {
  validateContainer(containerNode);

  let container: DOMContainerElement = containerNode.nodeType === DOCUMENT_NODE
    ? (containerNode: any).documentElement
    : (containerNode: any);
  let root = container._reactRootContainer;
  if (!root) {
    // First clear any existing content.
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    const newRoot = DOMRenderer.createContainer(container);
    root = (container._reactRootContainer = newRoot);
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
  render(
    element: ReactElement<any>,
    container: DOMContainerElement,
    callback: ?Function,
  ) {
    validateContainer(container);

    if (ReactFeatureFlags.disableNewFiberFeatures) {
      // Top-level check occurs here instead of inside child reconciler because
      // because requirements vary between renderers. E.g. React Art
      // allows arrays.
      if (!isValidElement(element)) {
        if (typeof element === 'string') {
          invariant(
            false,
            'ReactDOM.render(): Invalid component element. Instead of ' +
              "passing a string like 'div', pass " +
              "React.createElement('div') or <div />.",
          );
        } else if (typeof element === 'function') {
          invariant(
            false,
            'ReactDOM.render(): Invalid component element. Instead of ' +
              'passing a class like Foo, pass React.createElement(Foo) ' +
              'or <Foo />.',
          );
        } else if (element != null && typeof element.props !== 'undefined') {
          // Check if it quacks like an element
          invariant(
            false,
            'ReactDOM.render(): Invalid component element. This may be ' +
              'caused by unintentionally loading two independent copies ' +
              'of React.',
          );
        } else {
          invariant(false, 'ReactDOM.render(): Invalid component element.');
        }
      }
    }

    if (__DEV__) {
      const isRootRenderedBySomeReact = !!container._reactRootContainer;
      const rootEl = getReactRootElementInContainer(container);
      const hasNonRootReactChild = !!(rootEl &&
        ReactDOMComponentTree.getInstanceFromNode(rootEl));

      warning(
        !hasNonRootReactChild || isRootRenderedBySomeReact,
        'render(...): Replacing React-rendered children with a new root ' +
          'component. If you intended to update the children of this node, ' +
          'you should instead have the existing children update their state ' +
          'and render the new components instead of calling ReactDOM.render.',
      );

      warning(
        !container.tagName || container.tagName.toUpperCase() !== 'BODY',
        'render(): Rendering components directly into document.body is ' +
          'discouraged, since its children are often manipulated by third-party ' +
          'scripts and browser extensions. This may lead to subtle ' +
          'reconciliation issues. Try rendering into a container element created ' +
          'for your app.',
      );
    }

    return renderSubtreeIntoContainer(null, element, container, callback);
  },

  unstable_renderSubtreeIntoContainer(
    parentComponent: ReactComponent<any, any, any>,
    element: ReactElement<any>,
    containerNode: DOMContainerElement | Document,
    callback: ?Function,
  ) {
    invariant(
      parentComponent != null && ReactInstanceMap.has(parentComponent),
      'parentComponent must be a valid React Component',
    );
    return renderSubtreeIntoContainer(
      parentComponent,
      element,
      containerNode,
      callback,
    );
  },

  unmountComponentAtNode(container: DOMContainerElement) {
    invariant(
      isValidContainer(container),
      'unmountComponentAtNode(...): Target container is not a DOM element.',
    );
    warnAboutUnstableUse();

    if (container._reactRootContainer) {
      if (__DEV__) {
        const rootEl = getReactRootElementInContainer(container);
        const renderedByDifferentReact = rootEl &&
          !ReactDOMComponentTree.getInstanceFromNode(rootEl);
        warning(
          !renderedByDifferentReact,
          "unmountComponentAtNode(): The node you're attempting to unmount " +
            'was rendered by another copy of React.',
        );
      }

      // Unmount should not be batched.
      return DOMRenderer.unbatchedUpdates(() => {
        return renderSubtreeIntoContainer(null, null, container, () => {
          container._reactRootContainer = null;
        });
      });
    }
  },

  findDOMNode: findDOMNode,

  unstable_createPortal(
    children: ReactNodeList,
    container: DOMContainerElement,
    key: ?string = null,
  ) {
    // TODO: pass ReactDOM portal implementation as third argument
    return ReactPortal.createPortal(children, container, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  unstable_deferredUpdates: DOMRenderer.deferredUpdates,
};

if (typeof injectInternals === 'function') {
  injectInternals({
    findFiberByHostInstance: ReactDOMComponentTree.getClosestInstanceFromNode,
    findHostInstanceByFiber: DOMRenderer.findHostInstance,
  });
}

module.exports = ReactDOM;
