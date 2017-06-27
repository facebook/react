/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiberEntry
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
var ReactVersion = require('ReactVersion');
var {isValidElement} = require('react');
var {injectInternals} = require('ReactFiberDevToolsHook');
var {
  ELEMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} = require('HTMLNodeType');
var {ID_ATTRIBUTE_NAME} = require('DOMProperty');

var findDOMNode = require('findDOMNode');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var {
  createElement,
  getChildNamespace,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
} = ReactDOMFiberComponent;
var {precacheFiberNode, updateFiberProps} = ReactDOMComponentTree;

if (__DEV__) {
  var validateDOMNesting = require('validateDOMNesting');
  var {updatedAncestorInfo} = validateDOMNesting;
}

ReactDOMInjection.inject();
ReactControlledComponent.injection.injectFiberControlledHostComponent(
  ReactDOMFiberComponent,
);
findDOMNode._injectFiber(function(fiber: Fiber) {
  return DOMRenderer.findHostInstance(fiber);
});

type DOMContainer =
  | (Element & {_reactRootContainer: ?Object})
  | (Document & {_reactRootContainer: ?Object});

type Container = Element | Document;
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

/**
 * True if the supplied DOM node is a valid node element.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM is a valid DOM node.
 * @internal
 */
function isValidContainer(node) {
  return !!(node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE));
}

function getReactRootElementInContainer(container: any) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

function shouldReuseContent(container) {
  const rootElement = getReactRootElementInContainer(container);
  return !!(rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ID_ATTRIBUTE_NAME));
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
    let type;
    let namespace;
    if (rootContainerInstance.nodeType === DOCUMENT_NODE) {
      type = '#document';
      let root = (rootContainerInstance: any).documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
    } else {
      const ownNamespace = (rootContainerInstance: any).namespaceURI || null;
      type = (rootContainerInstance: any).tagName;
      namespace = getChildNamespace(ownNamespace, type);
    }
    if (__DEV__) {
      const validatedTag = type.toLowerCase();
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
        typeof props.children === 'string' ||
        typeof props.children === 'number'
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

  shouldSetTextContent(type: string, props: Props): boolean {
    return (
      typeof props.children === 'string' ||
      typeof props.children === 'number' ||
      (typeof props.dangerouslySetInnerHTML === 'object' &&
        props.dangerouslySetInnerHTML !== null &&
        typeof props.dangerouslySetInnerHTML.__html === 'string')
    );
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

  appendChild(parentInstance: Instance, child: Instance | TextInstance): void {
    parentInstance.appendChild(child);
  },

  appendChildToContainer(
    container: Container,
    child: Instance | TextInstance,
  ): void {
    container.appendChild(child);
  },

  insertBefore(
    parentInstance: Instance,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ): void {
    parentInstance.insertBefore(child, beforeChild);
  },

  insertInContainerBefore(
    container: Container,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ): void {
    container.insertBefore(child, beforeChild);
  },

  removeChild(parentInstance: Instance, child: Instance | TextInstance): void {
    parentInstance.removeChild(child);
  },

  removeChildFromContainer(
    container: Container,
    child: Instance | TextInstance,
  ): void {
    container.removeChild(child);
  },

  canHydrateInstance(
    instance: Instance | TextInstance,
    type: string,
    props: Props,
  ): boolean {
    return instance.nodeType === 1 && type === instance.nodeName.toLowerCase();
  },

  canHydrateTextInstance(
    instance: Instance | TextInstance,
    text: string,
  ): boolean {
    if (text === '') {
      // Empty strings are not parsed by HTML so there won't be a correct match here.
      return false;
    }
    return instance.nodeType === 3;
  },

  getNextHydratableSibling(
    instance: Instance | TextInstance,
  ): null | Instance | TextInstance {
    let node = instance.nextSibling;
    // Skip non-hydratable nodes.
    while (node && node.nodeType !== 1 && node.nodeType !== 3) {
      node = node.nextSibling;
    }
    return (node: any);
  },

  getFirstHydratableChild(
    parentInstance: Container | Instance,
  ): null | Instance | TextInstance {
    let next = parentInstance.firstChild;
    // Skip non-hydratable nodes.
    while (next && next.nodeType !== 1 && next.nodeType !== 3) {
      next = next.nextSibling;
    }
    return (next: any);
  },

  hydrateInstance(
    instance: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
    internalInstanceHandle: Object,
  ): null | Array<mixed> {
    precacheFiberNode(internalInstanceHandle, instance);
    // TODO: Possibly defer this until the commit phase where all the events
    // get attached.
    updateFiberProps(instance, props);
    return diffHydratedProperties(instance, type, props, rootContainerInstance);
  },

  hydrateTextInstance(
    textInstance: TextInstance,
    text: string,
    internalInstanceHandle: Object,
  ): boolean {
    precacheFiberNode(internalInstanceHandle, textInstance);
    return textInstance.nodeValue !== text;
  },

  scheduleDeferredCallback: ReactDOMFrameScheduling.rIC,

  useSyncScheduling: !ReactDOMFeatureFlags.fiberAsyncScheduling,
});

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  DOMRenderer.batchedUpdates,
);

function renderSubtreeIntoContainer(
  parentComponent: ?ReactComponent<any, any, any>,
  children: ReactNodeList,
  container: DOMContainer,
  callback: ?Function,
) {
  invariant(
    isValidContainer(container),
    'Target container is not a DOM element.',
  );

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
      container.nodeType !== 1 ||
        !container.tagName ||
        container.tagName.toUpperCase() !== 'BODY',
      'render(): Rendering components directly into document.body is ' +
        'discouraged, since its children are often manipulated by third-party ' +
        'scripts and browser extensions. This may lead to subtle ' +
        'reconciliation issues. Try rendering into a container element created ' +
        'for your app.',
    );
  }

  let root = container._reactRootContainer;
  if (!root) {
    // First clear any existing content.
    // TODO: Figure out the best heuristic here.
    if (!shouldReuseContent(container)) {
      while (container.lastChild) {
        container.removeChild(container.lastChild);
      }
    }
    const newRoot = DOMRenderer.createContainer(container);
    root = container._reactRootContainer = newRoot;
    // Initial mount should not be batched.
    DOMRenderer.unbatchedUpdates(() => {
      DOMRenderer.updateContainer(children, newRoot, parentComponent, callback);
    });
  } else {
    DOMRenderer.updateContainer(children, root, parentComponent, callback);
  }
  return DOMRenderer.getPublicRootInstance(root);
}

var ReactDOMFiber = {
  render(
    element: ReactElement<any>,
    container: DOMContainer,
    callback: ?Function,
  ) {
    if (ReactFeatureFlags.disableNewFiberFeatures) {
      // Top-level check occurs here instead of inside child reconciler
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
    return renderSubtreeIntoContainer(null, element, container, callback);
  },

  unstable_renderSubtreeIntoContainer(
    parentComponent: ReactComponent<any, any, any>,
    element: ReactElement<any>,
    containerNode: DOMContainer,
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

  unmountComponentAtNode(container: DOMContainer) {
    invariant(
      isValidContainer(container),
      'unmountComponentAtNode(...): Target container is not a DOM element.',
    );

    if (container._reactRootContainer) {
      if (__DEV__) {
        const rootEl = getReactRootElementInContainer(container);
        const renderedByDifferentReact =
          rootEl && !ReactDOMComponentTree.getInstanceFromNode(rootEl);
        warning(
          !renderedByDifferentReact,
          "unmountComponentAtNode(): The node you're attempting to unmount " +
            'was rendered by another copy of React.',
        );
      }

      // Unmount should not be batched.
      DOMRenderer.unbatchedUpdates(() => {
        renderSubtreeIntoContainer(null, null, container, () => {
          container._reactRootContainer = null;
        });
      });
      // If you call unmountComponentAtNode twice in quick succession, you'll
      // get `true` twice. That's probably fine?
      return true;
    } else {
      return false;
    }
  },

  findDOMNode: findDOMNode,

  unstable_createPortal(
    children: ReactNodeList,
    container: DOMContainer,
    key: ?string = null,
  ) {
    // TODO: pass ReactDOM portal implementation as third argument
    return ReactPortal.createPortal(children, container, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  unstable_deferredUpdates: DOMRenderer.deferredUpdates,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // For TapEventPlugin which is popular in open source
    EventPluginHub: require('EventPluginHub'),
    // Used by test-utils
    EventPluginRegistry: require('EventPluginRegistry'),
    EventPropagators: require('EventPropagators'),
    ReactControlledComponent,
    ReactDOMComponentTree,
    ReactDOMEventListener: require('ReactDOMEventListener'),
  },
};

if (typeof injectInternals === 'function') {
  injectInternals({
    findFiberByHostInstance: ReactDOMComponentTree.getClosestInstanceFromNode,
    findHostInstanceByFiber: DOMRenderer.findHostInstance,
    // This is an enum because we may add more (e.g. profiler build)
    bundleType: __DEV__ ? 1 : 0,
    version: ReactVersion,
  });
}

module.exports = ReactDOMFiber;
