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
var ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment');
var ReactControlledComponent = require('ReactControlledComponent');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactFeatureFlags = require('ReactFeatureFlags');
var ReactDOMFiberComponent = require('ReactDOMFiberComponent');
var ReactGenericBatching = require('ReactGenericBatching');
var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactDOMFiberConfig = require('ReactDOMFiberConfig');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactPortal = require('ReactPortal');
var ReactVersion = require('ReactVersion');
var {isValidElement} = require('react');
var {injectInternals} = require('ReactFiberDevToolsHook');
var {
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} = require('HTMLNodeType');
var {ROOT_ATTRIBUTE_NAME} = require('DOMProperty');

var findDOMNode = require('findDOMNode');
var invariant = require('fbjs/lib/invariant');

if (__DEV__) {
  var lowPriorityWarning = require('lowPriorityWarning');
  var warning = require('fbjs/lib/warning');

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

type Props = {
  autoFocus?: boolean,
  children?: mixed,
  hidden?: boolean,
};

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

var DOMRenderer = ReactDOMFiberConfig(ReactFiberReconciler);

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  DOMRenderer.batchedUpdates,
);

var warnedAboutHydrateAPI = false;

function renderSubtreeIntoContainer(
  parentComponent: ?ReactComponent<any, any, any>,
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
  hydrate(
    element: ReactElement<any>,
    container: DOMContainer,
    callback: ?Function,
  ) {
    // TODO: throw or warn if we couldn't hydrate?
    return renderSubtreeIntoContainer(null, element, container, true, callback);
  },

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
    return renderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback,
    );
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
