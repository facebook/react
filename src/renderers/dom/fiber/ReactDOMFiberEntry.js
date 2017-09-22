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

require('checkReact');
var DOMNamespaces = require('DOMNamespaces');
var ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactControlledComponent = require('ReactControlledComponent');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactDOMFiberComponent = require('ReactDOMFiberComponent');
var ReactDOMFrameScheduling = require('ReactDOMFrameScheduling');
var ReactGenericBatching = require('ReactGenericBatching');
var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactInputSelection = require('ReactInputSelection');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactPortal = require('ReactPortal');
var ReactVersion = require('ReactVersion');
var {injectInternals} = require('ReactFiberDevToolsHook');
var {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} = require('HTMLNodeType');
var {ROOT_ATTRIBUTE_NAME} = require('DOMProperty');

var findDOMNode = require('findDOMNode');
var invariant = require('fbjs/lib/invariant');

var {getChildNamespace} = DOMNamespaces;
var {
  createElement,
  createTextNode,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
} = ReactDOMFiberComponent;
var {precacheFiberNode, updateFiberProps} = ReactDOMComponentTree;

if (__DEV__) {
  var lowPriorityWarning = require('lowPriorityWarning');
  var warning = require('fbjs/lib/warning');
  var validateDOMNesting = require('validateDOMNesting');
  var {updatedAncestorInfo} = validateDOMNesting;

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

  /* 
    HydrationWarningRenderer module
      - setContainer()
        set the container dom element, this is required for 
        constructing a warning in a tree structure.
      - registerWarning()
        instead of calling the old warningFor* methods during 
        hydration, we call registerWarning method to save diffs 
        in a central registry.
      - flushWarnings()
        this method is called in prepareForCommit when hydration is completed.
        There are two steps to print out warnings, 
        1. buildWarningTree, 2. warningTreeToText
      - buildWarningTree()
        starting from current container dom element, recursively build a tree, in
        which each node is a pair of {curentDomNode, diffs}
      - warningTreeToText()
        recursivly convert diffsInfo into warning string and print out the whole
        warning tree as formated string.

  */
  var HydrationWarningRenderer = {
    /*
      warningRegistry, a central registry for warnings 
      saving diffs during hydration.

      each warning node in warningNodes array has following structure, 
      {
        node: DOMElement <--- the dom node in problem
        warningDetails: {
          type: number <--- type 1, the node is going to be deleted
                            type 2, there are some attribute diffs
                                    which is recoreded in diffs section
          diffs: [
            {
              propKey: string <--- the prop that has diff
              server: string|number <--- server value
              client: string|number <--- client value
            }
            ...
          ]  
        }  
      }

    */
    warningRegistry: {container: null, warningNodes: []},
    setContainer: function(rootContainerElement) {
      if (rootContainerElement) {
        const warningRegistry = HydrationWarningRenderer.warningRegistry;
        if (
          warningRegistry.container &&
          warningRegistry.container !== rootContainerElement
        ) {
          // console.warn('unflushed warnings are being cleared');
          warningRegistry.warningNodes = [];
        }
        warningRegistry.container = rootContainerElement;
      }
    },
    registerWarning: function(instance, warningDetails) {
      var warningRegistry = HydrationWarningRenderer.warningRegistry;
      var warningNodeIndex = warningRegistry.warningNodes
        .map(function(node) {
          return node.instance;
        })
        .indexOf(instance);
      if (warningNodeIndex > -1) {
        var currentWarningDetails =
          warningRegistry.warningNodes[warningNodeIndex].warningDetails;
        if (currentWarningDetails.type === 1 && warningDetails.type === 1) {
          currentWarningDetails.diffs = currentWarningDetails.diffs.concat(
            warningDetails.diffs,
          );
        }
      } else {
        warningRegistry.warningNodes.push({instance, warningDetails});
      }
    },
    buildWarningTree: function(root, warningNodes) {
      // is current root itself a warningNode?
      const index = warningNodes
        .map(function(warningNode) {
          return warningNode.instance;
        })
        .indexOf(root.instance);

      if (index > -1) {
        // remove from warning Nodes collection
        // copy over warning Details
        const matchedWarningNode = warningNodes.splice(index, 1)[0];
        root.warningDetails = matchedWarningNode.warningDetails;
      }
      const childNodesArray = HydrationWarningRenderer.convertNlToArray(
        root.instance.childNodes,
      );

      root.subWarningTrees = childNodesArray.map(function(domNode) {
        const childrenWarningNodes = [];
        HydrationWarningRenderer.findNodesInTree(
          domNode,
          warningNodes,
          childrenWarningNodes,
        );

        if (childrenWarningNodes.length > 0) {
          return HydrationWarningRenderer.buildWarningTree(
            {instance: domNode},
            childrenWarningNodes,
          );
        } else {
          // a dom node that does not contain warning in subtree
          // we just keep a placeholder
          return {instance: domNode};
        }
      });
      return root;
    },
    findNodesInTree: function(domRootNode, nodesToMatch, matched) {
      if (nodesToMatch.length === matched.length) {
        // all matched, terminate recursion
        return;
      }
      const domNodesArray = nodesToMatch.map(function(node) {
        return node.instance;
      });
      const index = domNodesArray.indexOf(domRootNode);

      // check if the node can be marched.
      if (index > -1) {
        matched.push(nodesToMatch[index]);
      }

      HydrationWarningRenderer.convertNlToArray(
        domRootNode.childNodes,
      ).forEach(function(childNode) {
        HydrationWarningRenderer.findNodesInTree(
          childNode,
          nodesToMatch,
          matched,
        );
      });
    },
    warningsTreeToText: function(rootWarningNode) {
      var subWarningsText = !rootWarningNode.subWarningTrees
        ? rootWarningNode.instance.childNodes.length > 0 ? '...' : ''
        : rootWarningNode.subWarningTrees
            .map(function(subTree) {
              return HydrationWarningRenderer.warningsTreeToText(subTree)
                .split('\n')
                .map(function(line) {
                  return '  ' + line;
                })
                .join('\n'); // add indentation
            })
            .join('\n');

      var tag = rootWarningNode.instance.tagName;
      var warningsCode = rootWarningNode.warningDetails
        ? rootWarningNode.warningDetails.type
        : '';
      return !rootWarningNode.warningDetails && !rootWarningNode.subWarningTrees
        ? '...'
        : HydrationWarningRenderer.renderWarningDetail(
            rootWarningNode.instance,
            rootWarningNode.warningDetails,
            subWarningsText,
          );
    },
    renderWarningDetail: function(instance, warningDetails, subWarningsText) {
      var tag = instance.tagName;

      if (!warningDetails) {
        // when the instance is HTML document
        if (!tag) {
          return subWarningsText;
        }

        var attrsText = '';
        if (instance.attributes) {
          for (var i = 0; i < instance.attributes.length && i < 2; i++) {
            attrsText = `${attrsText} ${instance.attributes[i].name}="${instance.attributes[i].value}"`;
          }

          attrsText = instance.attributes.length > 2
            ? attrsText + ' ...'
            : attrsText;
        }

        // no warning, return sub warnings
        return `<${tag.toLowerCase()} ${attrsText}>\n${subWarningsText}\n</${tag.toLowerCase()}>`;
      }

      if (warningDetails.type === 1) {
        if (instance.nodeType === 1 && Array.isArray(warningDetails.diffs)) {
          var currentProps = warningDetails.diffs.reduce(function(
            result,
            diff,
          ) {
            return diff.server && diff.propKey
              ? `${result} ${diff.propKey}="${diff.server}"`
              : result;
          }, '');

          var hydratedProps = warningDetails.diffs.reduce(function(
            result,
            diff,
          ) {
            return diff.client && diff.propKey
              ? `${result} ${diff.propKey}="${diff.client}"`
              : result;
          }, '');

          var textProps = warningDetails.diffs.reduce(function(result, diff) {
            return !diff.propKey
              ? (diff.server ? `- ${diff.server}` : '') +
                  (diff.server ? '\n' : '') +
                  (diff.client ? `+ ${diff.client}` : '') +
                  (diff.client ? '\n' : '') +
                  result
              : result;
          }, '');

          subWarningsText = subWarningsText ? `\n${subWarningsText}\n` : '\n';
          subWarningsText = textProps
            ? `\n${textProps}${subWarningsText}`
            : subWarningsText;

          return (
            `- <${tag.toLowerCase()} ${currentProps} ...>\n` +
            `+ <${tag.toLowerCase()} ${hydratedProps} ...>${subWarningsText}</${tag.toLowerCase()}>`
          );
        } else {
          var serverTextValue = warningDetails.diffs.server;
          var clientTextValue = warningDetails.diffs.client;
          return `- ${serverTextValue}\n+ ${clientTextValue}`;
        }
      } else if (warningDetails.type === 2) {
        if (instance.nodeType === 1) {
          var attrsText = '';
          for (var i = 0; i < instance.attributes.length && i < 2; i++) {
            attrsText =
              attrsText +
              ' ' +
              instance.attributes[i].name +
              '=' +
              instance.attributes[i].value;
          }
          attrsText = instance.attributes.length > 2
            ? attrsText + '...'
            : attrsText;
          return `- <${tag.toLowerCase()} ${attrsText}>...</${tag.toLowerCase()}>`;
        } else {
          return `- "${instance.nodeValue} unknown warning type"`;
        }
      }
    },
    flushWarning: function() {
      const warningRegistry = HydrationWarningRenderer.warningRegistry;
      if (!warningRegistry.container) {
        // no cotainer object, abort the warning
        return;
      }

      if (warningRegistry.warningNodes.length > 0) {
        var warningsTree = HydrationWarningRenderer.buildWarningTree(
          {instance: warningRegistry.container},
          warningRegistry.warningNodes,
        );
        warning(
          false,
          HydrationWarningRenderer.warningsTreeToText(warningsTree),
        );
      }

      // reset
      warningRegistry.container = null;
      warningRegistry.warningNodes = [];
    },
    convertNlToArray: function(nl) {
      const arr = [];
      for (var i = 0, n; (n = nl[i]); ++i)
        arr.push(n);
      return arr;
    },
  };
}

require('ReactDOMClientInjection');
require('ReactDOMInjection');
ReactControlledComponent.injection.injectFiberControlledHostComponent(
  ReactDOMFiberComponent,
);
findDOMNode._injectFiber(function(fiber: Fiber) {
  return DOMRenderer.findHostInstance(fiber);
});

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
    if (rootContainerInstance.nodeType === DOCUMENT_NODE) {
      type = '#document';
      let root = (rootContainerInstance: any).documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
    } else {
      const container: any = rootContainerInstance.nodeType === COMMENT_NODE
        ? rootContainerInstance.parentNode
        : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
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
    if (__DEV__) {
      HydrationWarningRenderer.flushWarning();
    }
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
      type === 'textarea' ||
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
    var textNode: TextInstance = createTextNode(text, rootContainerInstance);
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

  removeChild(parentInstance: Instance, child: Instance | TextInstance): void {
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

  canHydrateInstance(
    instance: Instance | TextInstance,
    type: string,
    props: Props,
  ): boolean {
    return (
      instance.nodeType === ELEMENT_NODE &&
      type === instance.nodeName.toLowerCase()
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
      HydrationWarningRenderer.registerWarning,
    );
  },

  hydrateTextInstance(
    textInstance: TextInstance,
    text: string,
    internalInstanceHandle: Object,
  ): boolean {
    precacheFiberNode(internalInstanceHandle, textInstance);
    return diffHydratedText(
      textInstance,
      text,
      HydrationWarningRenderer.registerWarning,
    );
  },

  didNotHydrateInstance(
    parentInstance: Instance | Container,
    instance: Instance | TextInstance,
  ) {
    if (instance.nodeType === 1) {
      if (__DEV__) {
        HydrationWarningRenderer.registerWarning(instance, {type: 2});
      }
      warnForDeletedHydratableElement(parentInstance, (instance: any));
    } else {
      if (__DEV__) {
        HydrationWarningRenderer.registerWarning(instance, {type: 2});
      }
      warnForDeletedHydratableText(parentInstance, (instance: any));
    }
  },

  didNotFindHydratableInstance(
    parentInstance: Instance | Container,
    type: string,
    props: Props,
  ) {
    warnForInsertedHydratedElement(parentInstance, type, props);
  },

  didNotFindHydratableTextInstance(
    parentInstance: Instance | Container,
    text: string,
  ) {
    warnForInsertedHydratedText(parentInstance, text);
  },

  scheduleDeferredCallback: ReactDOMFrameScheduling.rIC,

  useSyncScheduling: !ReactDOMFeatureFlags.fiberAsyncScheduling,
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
      HydrationWarningRenderer.setContainer(container);
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

var ReactDOMFiber = {
  createPortal,

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

  findDOMNode: findDOMNode,

  // Temporary alias since we already shipped React 16 RC with it.
  // TODO: remove in React 17.
  unstable_createPortal: createPortal,

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  unstable_deferredUpdates: DOMRenderer.deferredUpdates,

  flushSync: DOMRenderer.flushSync,

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

module.exports = ReactDOMFiber;
