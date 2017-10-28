/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {ReactNodeList} from 'shared/ReactTypes';

require('../shared/checkReact');

var ReactFiberReconciler = require('react-reconciler');
// TODO: direct imports like some-package/src/* are bad. Fix me.
var ReactPortal = require('react-reconciler/src/ReactPortal');
// TODO: direct imports like some-package/src/* are bad. Fix me.
var {injectInternals} = require('react-reconciler/src/ReactFiberDevToolsHook');
var ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment');
var ReactGenericBatching = require('events/ReactGenericBatching');
var ReactControlledComponent = require('events/ReactControlledComponent');
var ReactInstanceMap = require('shared/ReactInstanceMap');
var ReactFeatureFlags = require('shared/ReactFeatureFlags');
var ReactVersion = require('shared/ReactVersion');
var ReactDOMFrameScheduling = require('shared/ReactDOMFrameScheduling');
var {ReactCurrentOwner} = require('shared/ReactGlobalSharedState');
var getComponentName = require('shared/getComponentName');
var invariant = require('fbjs/lib/invariant');

var ReactDOMComponentTree = require('./ReactDOMComponentTree');
var ReactDOMFiberComponent = require('./ReactDOMFiberComponent');
var ReactInputSelection = require('./ReactInputSelection');
var ReactBrowserEventEmitter = require('../events/ReactBrowserEventEmitter');
var DOMNamespaces = require('../shared/DOMNamespaces');
var {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} = require('../shared/HTMLNodeType');
var {ROOT_ATTRIBUTE_NAME} = require('../shared/DOMProperty');
var {getChildNamespace} = DOMNamespaces;
var {
  createElement,
  createTextNode,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  warnForUnmatchedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
} = ReactDOMFiberComponent;
var {precacheFiberNode, updateFiberProps} = ReactDOMComponentTree;

if (__DEV__) {
  var lowPriorityWarning = require('shared/lowPriorityWarning');
  var warning = require('fbjs/lib/warning');

  var validateDOMNesting = require('./validateDOMNesting');
  var {updatedAncestorInfo} = validateDOMNesting;

  var SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
  if (
    typeof Map !== 'function' ||
    Map.prototype == null ||
    typeof Map.prototype.forEach !== 'function' ||
    typeof Set !== 'function' ||
    Set.prototype == null ||
    typeof Set.prototype.clear !== 'function' ||
    typeof Set.prototype.forEach !== 'function'
  ) {
    warning(
      false,
      'React depends on Map and Set built-in types. Make sure that you load a ' +
        'polyfill in older browsers. http://fb.me/react-polyfills',
    );
  }
}

require('./ReactDOMClientInjection');
require('../shared/ReactDOMInjection');
ReactControlledComponent.injection.injectFiberControlledHostComponent(
  ReactDOMFiberComponent,
);

type DOMContainer =
  | (Element & {
    _reactRootContainer: ?Object,
  })
  | (Document & {
    _reactRootContainer: ?Object,
  });

type Container = Element | Document;
type Props = {
  autoFocus?: boolean,
  children?: mixed,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
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
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        node.nodeValue === ' react-mount-point-unstable ')));
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

function shouldHydrateDueToLegacyHeuristic(container) {
  const rootElement = getReactRootElementInContainer(container);
  return !!(rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME));
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
    const nodeType = rootContainerInstance.nodeType;
    switch (nodeType) {
      case DOCUMENT_NODE:
      case DOCUMENT_FRAGMENT_NODE: {
        type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
        let root = (rootContainerInstance: any).documentElement;
        namespace = root ? root.namespaceURI : getChildNamespace(null, '');
        break;
      }
      default: {
        const container: any = nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
        const ownNamespace = container.namespaceURI || null;
        type = container.tagName;
        namespace = getChildNamespace(ownNamespace, type);
        break;
      }
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
      validateDOMNesting(type, null, hostContextDev.ancestorInfo);
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
        validateDOMNesting(null, string, ownAncestorInfo);
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
        validateDOMNesting(null, string, ownAncestorInfo);
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

  shouldSetTextContent(type: string, props: Props): boolean {
    return (
      type === 'textarea' ||
      typeof props.children === 'string' ||
      typeof props.children === 'number' ||
      (typeof props.dangerouslySetInnerHTML === 'object' &&
        props.dangerouslySetInnerHTML !== null &&
        typeof props.dangerouslySetInnerHTML.__html === 'string')
    );
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
      validateDOMNesting(null, text, hostContextDev.ancestorInfo);
    }
    var textNode: TextInstance = createTextNode(text, rootContainerInstance);
    precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
  },

  now: ReactDOMFrameScheduling.now,

  mutation: {
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

    resetTextContent(domElement: Instance): void {
      domElement.textContent = '';
    },

    commitTextUpdate(
      textInstance: TextInstance,
      oldText: string,
      newText: string,
    ): void {
      textInstance.nodeValue = newText;
    },

    appendChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      parentInstance.appendChild(child);
    },

    appendChildToContainer(
      container: Container,
      child: Instance | TextInstance,
    ): void {
      if (container.nodeType === COMMENT_NODE) {
        (container.parentNode: any).insertBefore(child, container);
      } else {
        container.appendChild(child);
      }
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
      if (container.nodeType === COMMENT_NODE) {
        (container.parentNode: any).insertBefore(child, beforeChild);
      } else {
        container.insertBefore(child, beforeChild);
      }
    },

    removeChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      parentInstance.removeChild(child);
    },

    removeChildFromContainer(
      container: Container,
      child: Instance | TextInstance,
    ): void {
      if (container.nodeType === COMMENT_NODE) {
        (container.parentNode: any).removeChild(child);
      } else {
        container.removeChild(child);
      }
    },
  },

  hydration: {
    canHydrateInstance(
      instance: Instance | TextInstance,
      type: string,
      props: Props,
    ): boolean {
      return (
        instance.nodeType === ELEMENT_NODE &&
        type.toLowerCase() === instance.nodeName.toLowerCase()
      );
    },

    canHydrateTextInstance(
      instance: Instance | TextInstance,
      text: string,
    ): boolean {
      if (text === '') {
        // Empty strings are not parsed by HTML so there won't be a correct match here.
        return false;
      }
      return instance.nodeType === TEXT_NODE;
    },

    getNextHydratableSibling(
      instance: Instance | TextInstance,
    ): null | Instance | TextInstance {
      let node = instance.nextSibling;
      // Skip non-hydratable nodes.
      while (
        node &&
        node.nodeType !== ELEMENT_NODE &&
        node.nodeType !== TEXT_NODE
      ) {
        node = node.nextSibling;
      }
      return (node: any);
    },

    getFirstHydratableChild(
      parentInstance: Container | Instance,
    ): null | Instance | TextInstance {
      let next = parentInstance.firstChild;
      // Skip non-hydratable nodes.
      while (
        next &&
        next.nodeType !== ELEMENT_NODE &&
        next.nodeType !== TEXT_NODE
      ) {
        next = next.nextSibling;
      }
      return (next: any);
    },

    hydrateInstance(
      instance: Instance,
      type: string,
      props: Props,
      rootContainerInstance: Container,
      hostContext: HostContext,
      internalInstanceHandle: Object,
    ): null | Array<mixed> {
      precacheFiberNode(internalInstanceHandle, instance);
      // TODO: Possibly defer this until the commit phase where all the events
      // get attached.
      updateFiberProps(instance, props);
      let parentNamespace: string;
      if (__DEV__) {
        const hostContextDev = ((hostContext: any): HostContextDev);
        parentNamespace = hostContextDev.namespace;
      } else {
        parentNamespace = ((hostContext: any): HostContextProd);
      }
      return diffHydratedProperties(
        instance,
        type,
        props,
        parentNamespace,
        rootContainerInstance,
      );
    },

    hydrateTextInstance(
      textInstance: TextInstance,
      text: string,
      internalInstanceHandle: Object,
    ): boolean {
      precacheFiberNode(internalInstanceHandle, textInstance);
      return diffHydratedText(textInstance, text);
    },

    didNotMatchHydratedContainerTextInstance(
      parentContainer: Container,
      textInstance: TextInstance,
      text: string,
    ) {
      if (__DEV__) {
        warnForUnmatchedText(textInstance, text);
      }
    },

    didNotMatchHydratedTextInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      textInstance: TextInstance,
      text: string,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        warnForUnmatchedText(textInstance, text);
      }
    },

    didNotHydrateContainerInstance(
      parentContainer: Container,
      instance: Instance | TextInstance,
    ) {
      if (__DEV__) {
        if (instance.nodeType === 1) {
          warnForDeletedHydratableElement(parentContainer, (instance: any));
        } else {
          warnForDeletedHydratableText(parentContainer, (instance: any));
        }
      }
    },

    didNotHydrateInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      instance: Instance | TextInstance,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        if (instance.nodeType === 1) {
          warnForDeletedHydratableElement(parentInstance, (instance: any));
        } else {
          warnForDeletedHydratableText(parentInstance, (instance: any));
        }
      }
    },

    didNotFindHydratableContainerInstance(
      parentContainer: Container,
      type: string,
      props: Props,
    ) {
      if (__DEV__) {
        warnForInsertedHydratedElement(parentContainer, type, props);
      }
    },

    didNotFindHydratableContainerTextInstance(
      parentContainer: Container,
      text: string,
    ) {
      if (__DEV__) {
        warnForInsertedHydratedText(parentContainer, text);
      }
    },

    didNotFindHydratableInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      type: string,
      props: Props,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        warnForInsertedHydratedElement(parentInstance, type, props);
      }
    },

    didNotFindHydratableTextInstance(
      parentType: string,
      parentProps: Props,
      parentInstance: Instance,
      text: string,
    ) {
      if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        warnForInsertedHydratedText(parentInstance, text);
      }
    },
  },

  scheduleDeferredCallback: ReactDOMFrameScheduling.rIC,

  useSyncScheduling: !ReactFeatureFlags.enableAsyncSchedulingByDefaultInReactDOM,
});

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  DOMRenderer.batchedUpdates,
);

var warnedAboutHydrateAPI = false;

function renderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  container: DOMContainer,
  forceHydrate: boolean,
  callback: ?Function,
) {
  invariant(
    isValidContainer(container),
    'Target container is not a DOM element.',
  );

  if (__DEV__) {
    if (container._reactRootContainer && container.nodeType !== COMMENT_NODE) {
      const hostInstance = DOMRenderer.findHostInstanceWithNoPortals(
        container._reactRootContainer.current,
      );
      if (hostInstance) {
        warning(
          hostInstance.parentNode === container,
          'render(...): It looks like the React-rendered content of this ' +
            'container was removed without using React. This is not ' +
            'supported and will cause errors. Instead, call ' +
            'ReactDOM.unmountComponentAtNode to empty a container.',
        );
      }
    }

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
      container.nodeType !== ELEMENT_NODE ||
        !((container: any): Element).tagName ||
        ((container: any): Element).tagName.toUpperCase() !== 'BODY',
      'render(): Rendering components directly into document.body is ' +
        'discouraged, since its children are often manipulated by third-party ' +
        'scripts and browser extensions. This may lead to subtle ' +
        'reconciliation issues. Try rendering into a container element created ' +
        'for your app.',
    );
  }

  let root = container._reactRootContainer;
  if (!root) {
    const shouldHydrate =
      forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
    // First clear any existing content.
    if (!shouldHydrate) {
      let warned = false;
      let rootSibling;
      while ((rootSibling = container.lastChild)) {
        if (__DEV__) {
          if (
            !warned &&
            rootSibling.nodeType === ELEMENT_NODE &&
            (rootSibling: any).hasAttribute(ROOT_ATTRIBUTE_NAME)
          ) {
            warned = true;
            warning(
              false,
              'render(): Target node has markup rendered by React, but there ' +
                'are unrelated nodes as well. This is most commonly caused by ' +
                'white-space inserted around server-rendered markup.',
            );
          }
        }
        container.removeChild(rootSibling);
      }
    }
    if (__DEV__) {
      if (shouldHydrate && !forceHydrate && !warnedAboutHydrateAPI) {
        warnedAboutHydrateAPI = true;
        lowPriorityWarning(
          false,
          'render(): Calling ReactDOM.render() to hydrate server-rendered markup ' +
            'will stop working in React v17. Replace the ReactDOM.render() call ' +
            'with ReactDOM.hydrate() if you want React to attach to the server HTML.',
        );
      }
    }
    const newRoot = DOMRenderer.createContainer(container, shouldHydrate);
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

function createPortal(
  children: ReactNodeList,
  container: DOMContainer,
  key: ?string = null,
) {
  invariant(
    isValidContainer(container),
    'Target container is not a DOM element.',
  );
  // TODO: pass ReactDOM portal implementation as third argument
  return ReactPortal.createPortal(children, container, null, key);
}

type ReactRootNode = {
  render(children: ReactNodeList, callback: ?() => mixed): void,
  unmount(callback: ?() => mixed): void,

  _reactRootContainer: *,
};

type RootOptions = {
  hydrate?: boolean,
};

function ReactRoot(container: Container, hydrate: boolean) {
  const root = DOMRenderer.createContainer(container, hydrate);
  this._reactRootContainer = root;
}
ReactRoot.prototype.render = function(
  children: ReactNodeList,
  callback: ?() => mixed,
): void {
  const root = this._reactRootContainer;
  DOMRenderer.updateContainer(children, root, null, callback);
};
ReactRoot.prototype.unmount = function(callback) {
  const root = this._reactRootContainer;
  DOMRenderer.updateContainer(null, root, null, callback);
};

var ReactDOM = {
  createRoot(container: DOMContainer, options?: RootOptions): ReactRootNode {
    const hydrate = options != null && options.hydrate === true;
    return new ReactRoot(container, hydrate);
  },

  createPortal,

  findDOMNode(
    componentOrElement: Element | ?React$Component<any, any>,
  ): null | Element | Text {
    if (__DEV__) {
      var owner = (ReactCurrentOwner.current: any);
      if (owner !== null) {
        var warnedAboutRefsInRender = owner.stateNode._warnedAboutRefsInRender;
        warning(
          warnedAboutRefsInRender,
          '%s is accessing findDOMNode inside its render(). ' +
            'render() should be a pure function of props and state. It should ' +
            'never access something that requires stale data from the previous ' +
            'render, such as refs. Move this logic to componentDidMount and ' +
            'componentDidUpdate instead.',
          getComponentName(owner) || 'A component',
        );
        owner.stateNode._warnedAboutRefsInRender = true;
      }
    }
    if (componentOrElement == null) {
      return null;
    }
    if ((componentOrElement: any).nodeType === ELEMENT_NODE) {
      return (componentOrElement: any);
    }

    var inst = ReactInstanceMap.get(componentOrElement);
    if (inst) {
      return DOMRenderer.findHostInstance(inst);
    }

    if (typeof componentOrElement.render === 'function') {
      invariant(false, 'Unable to find node on an unmounted component.');
    } else {
      invariant(
        false,
        'Element appears to be neither ReactComponent nor DOMNode. Keys: %s',
        Object.keys(componentOrElement),
      );
    }
  },

  hydrate(element: React$Node, container: DOMContainer, callback: ?Function) {
    // TODO: throw or warn if we couldn't hydrate?
    return renderSubtreeIntoContainer(null, element, container, true, callback);
  },

  render(
    element: React$Element<any>,
    container: DOMContainer,
    callback: ?Function,
  ) {
    return renderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback,
    );
  },

  unstable_renderSubtreeIntoContainer(
    parentComponent: React$Component<any, any>,
    element: React$Element<any>,
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
      false,
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
        renderSubtreeIntoContainer(null, null, container, false, () => {
          container._reactRootContainer = null;
        });
      });
      // If you call unmountComponentAtNode twice in quick succession, you'll
      // get `true` twice. That's probably fine?
      return true;
    } else {
      if (__DEV__) {
        const rootEl = getReactRootElementInContainer(container);
        const hasNonRootReactChild = !!(rootEl &&
          ReactDOMComponentTree.getInstanceFromNode(rootEl));

        // Check if the container itself is a React root node.
        const isContainerReactRoot =
          container.nodeType === 1 &&
          isValidContainer(container.parentNode) &&
          !!container.parentNode._reactRootContainer;

        warning(
          !hasNonRootReactChild,
          "unmountComponentAtNode(): The node you're attempting to unmount " +
            'was rendered by React and is not a top-level container. %s',
          isContainerReactRoot
            ? 'You may have accidentally passed in a React root node instead ' +
                'of its container.'
            : 'Instead, have the parent component update its state and ' +
                'rerender in order to remove this component.',
        );
      }

      return false;
    }
  },

  // Temporary alias since we already shipped React 16 RC with it.
  // TODO: remove in React 17.
  unstable_createPortal: createPortal,

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  unstable_deferredUpdates: DOMRenderer.deferredUpdates,

  flushSync: DOMRenderer.flushSync,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // For TapEventPlugin which is popular in open source
    EventPluginHub: require('events/EventPluginHub'),
    // Used by test-utils
    EventPluginRegistry: require('events/EventPluginRegistry'),
    EventPropagators: require('events/EventPropagators'),
    ReactControlledComponent,
    ReactDOMComponentTree,
    ReactDOMEventListener: require('../events/ReactDOMEventListener'),
  },
};

const foundDevTools = injectInternals({
  findFiberByHostInstance: ReactDOMComponentTree.getClosestInstanceFromNode,
  findHostInstanceByFiber: DOMRenderer.findHostInstance,
  // This is an enum because we may add more (e.g. profiler build)
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-dom',
});

if (__DEV__) {
  if (
    !foundDevTools &&
    ExecutionEnvironment.canUseDOM &&
    window.top === window.self
  ) {
    // If we're in Chrome or Firefox, provide a download link if not installed.
    if (
      (navigator.userAgent.indexOf('Chrome') > -1 &&
        navigator.userAgent.indexOf('Edge') === -1) ||
      navigator.userAgent.indexOf('Firefox') > -1
    ) {
      const protocol = window.location.protocol;
      // Don't warn in exotic cases like chrome-extension://.
      if (/^(https?|file):$/.test(protocol)) {
        console.info(
          '%cDownload the React DevTools ' +
            'for a better development experience: ' +
            'https://fb.me/react-devtools' +
            (protocol === 'file:'
              ? '\nYou might need to use a local HTTP server (instead of file://): ' +
                  'https://fb.me/react-devtools-faq'
              : ''),
          'font-weight:bold',
        );
      }
    }
  }
}

module.exports = ReactDOM;
