/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {roots, ReactRoot, type Root} from './ReactFireRoots';
import {
  enqueueStateRestore,
  restoreStateIfNeeded,
  setRestoreImplementation,
} from './controlled/ReactFireControlledState';
import {setBatchingImplementation} from './ReactFireBatching';
import {
  batchedUpdates,
  findHostInstanceWithNoPortals,
  findHostInstance,
  findHostInstanceWithWarning,
  flushControlled,
  flushInteractiveUpdates,
  flushSync,
  interactiveUpdates,
  unbatchedUpdates,
} from 'react-reconciler/inline.fire';
import {restoreHostComponentInputControlledState} from './controlled/ReactFireInput';
import {restoreHostComponentTextareaControlledState} from './controlled/ReactFireTextarea';
import {restoreHostComponentSelectControlledState} from './controlled/ReactFireSelect';
import {setupDevTools} from './ReactFireDevTools';
import {
  COMMENT_NODE,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  ROOT_ATTRIBUTE_NAME,
} from './ReactFireDOMConfig';
import {getPublicRootInstance, isValidContainer} from './ReactFireUtils';
import {
  getFiberFromDomNode,
  getFiberPropsFromDomNodeInstance,
} from './ReactFireInternal';
import {proxyListener} from './events/ReactFireEvents';

import type {ReactNodeList} from 'shared/ReactTypes';
import invariant from 'shared/invariant';
import {createPortal as createPortalImpl} from 'shared/ReactPortal';
import getComponentName from 'shared/getComponentName';
import {enableStableConcurrentModeAPIs} from 'shared/ReactFeatureFlags';
import warningWithoutStack from 'shared/warningWithoutStack';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {HostComponent, HostText} from 'shared/ReactWorkTags';
import lowPriorityWarning from 'shared/lowPriorityWarning';
import {has as hasInstance} from 'shared/ReactInstanceMap';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

type RootOptions = {
  hydrate?: boolean,
};

export type DOMContainer =
  | (Element & {
      _reactRootContainer: ?Root,
    })
  | (Document & {
      _reactRootContainer: ?Root,
    });

let topLevelUpdateWarnings;
let warnedAboutHydrateAPI = false;
let didWarnAboutUnstableCreatePortal = false;

if (__DEV__) {
  if (
    typeof Map !== 'function' ||
    // $FlowIssue Flow incorrectly thinks Map has no prototype
    Map.prototype == null ||
    typeof Map.prototype.forEach !== 'function' ||
    typeof Set !== 'function' ||
    // $FlowIssue Flow incorrectly thinks Set has no prototype
    Set.prototype == null ||
    typeof Set.prototype.clear !== 'function' ||
    typeof Set.prototype.forEach !== 'function'
  ) {
    warningWithoutStack(
      false,
      'React depends on Map and Set built-in types. Make sure that you load a ' +
        'polyfill in older browsers. https://fb.me/react-polyfills',
    );
  }

  topLevelUpdateWarnings = (container: DOMContainer) => {
    if (roots.has(container) && container.nodeType !== COMMENT_NODE) {
      const root = roots.get(container);
      const hostInstance =
        root !== undefined &&
        findHostInstanceWithNoPortals(root._internalRoot.current);
      if (hostInstance) {
        warningWithoutStack(
          hostInstance.parentNode === container,
          'render(...): It looks like the React-rendered content of this ' +
            'container was removed without using React. This is not ' +
            'supported and will cause errors. Instead, call ' +
            'ReactDOM.unmountComponentAtNode to empty a container.',
        );
      }
    }

    const isRootRenderedBySomeReact = roots.has(container);
    const rootEl = getReactRootElementInContainer(container);
    const hasNonRootReactChild = !!(rootEl && getFiberFromDomNode(rootEl));

    warningWithoutStack(
      !hasNonRootReactChild || isRootRenderedBySomeReact,
      'render(...): Replacing React-rendered children with a new root ' +
        'component. If you intended to update the children of this node, ' +
        'you should instead have the existing children update their state ' +
        'and render the new components instead of calling ReactDOM.render.',
    );

    warningWithoutStack(
      container.nodeType !== ELEMENT_NODE ||
        !((container: any): Element).tagName ||
        ((container: any): Element).tagName.toUpperCase() !== 'BODY',
      'render(): Rendering components directly into document.body is ' +
        'discouraged, since its children are often manipulated by third-party ' +
        'scripts and browser extensions. This may lead to subtle ' +
        'reconciliation issues. Try rendering into a container element created ' +
        'for your app.',
    );
  };
}

setRestoreImplementation((domNode: Element, tag: string, props: Object) => {
  switch (tag) {
    case 'input':
      restoreHostComponentInputControlledState(domNode, props);
      return;
    case 'textarea':
      restoreHostComponentTextareaControlledState(domNode, props);
      return;
    case 'select':
      restoreHostComponentSelectControlledState(domNode, props);
      return;
  }
});

setBatchingImplementation(
  batchedUpdates,
  interactiveUpdates,
  flushInteractiveUpdates,
);

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
  return createPortalImpl(children, container, null, key);
}

function createRoot(container: DOMContainer, options?: RootOptions): ReactRoot {
  const functionName = enableStableConcurrentModeAPIs
    ? 'createRoot'
    : 'unstable_createRoot';
  invariant(
    isValidContainer(container),
    '%s(...): Target container is not a DOM element.',
    functionName,
  );
  const shouldHydrate = options != null && options.hydrate === true;
  return new ReactRoot(container, true, shouldHydrate);
}

function findDOMNode(componentOrElement: Element | ?React$Component<any, any>) {
  if (__DEV__) {
    let owner = (ReactCurrentOwner.current: any);
    if (owner !== null && owner.stateNode !== null) {
      const warnedAboutRefsInRender = owner.stateNode._warnedAboutRefsInRender;
      warningWithoutStack(
        warnedAboutRefsInRender,
        '%s is accessing findDOMNode inside its render(). ' +
          'render() should be a pure function of props and state. It should ' +
          'never access something that requires stale data from the previous ' +
          'render, such as refs. Move this logic to componentDidMount and ' +
          'componentDidUpdate instead.',
        getComponentName(owner.type) || 'A component',
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
  if (__DEV__) {
    return findHostInstanceWithWarning(componentOrElement, 'findDOMNode');
  }
  return findHostInstance(componentOrElement);
}

function cleanRootDOMContainer(container: DOMContainer) {
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
        warningWithoutStack(
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

function shouldHydrateDueToLegacyHeuristic(container) {
  const rootElement = getReactRootElementInContainer(container);
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  );
}

function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  domContainer: DOMContainer,
  forceHydrate: boolean,
  callback: ?Function,
) {
  let root = roots.get(domContainer);

  invariant(
    isValidContainer(domContainer),
    'unmountComponentAtNode(...): Target container is not a DOM element.',
  );

  if (__DEV__) {
    (domContainer: any)._reactRootDev = true;
    topLevelUpdateWarnings(domContainer);
  }

  if (root === undefined) {
    const shouldHydrate =
      forceHydrate || shouldHydrateDueToLegacyHeuristic(domContainer);
    // Initial mount
    if (!shouldHydrate) {
      cleanRootDOMContainer(domContainer);
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
    root = new ReactRoot(domContainer, false, shouldHydrate);
    roots.set(domContainer, ((root: any): Root));
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(
          ((root: any): Root)._internalRoot,
        );
        originalCallback.call(instance);
      };
    }
    // Initial mount should not be batched.
    unbatchedUpdates(() => {
      if (parentComponent != null) {
        ((root: any): Root).legacy_renderSubtreeIntoContainer(
          parentComponent,
          children,
          callback,
        );
      } else {
        ((root: any): Root).render(children, callback);
      }
    });
  } else {
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(
          ((root: any): Root)._internalRoot,
        );
        originalCallback.call(instance);
      };
    }
    // Update
    if (parentComponent != null) {
      ((root: any): Root).legacy_renderSubtreeIntoContainer(
        parentComponent,
        children,
        callback,
      );
    } else {
      ((root: any): Root).render(children, callback);
    }
  }
  return getPublicRootInstance(((root: any): Root)._internalRoot);
}

function render(
  children: ReactNodeList,
  domContainer: DOMContainer,
  callback: ?Function,
) {
  return legacyRenderSubtreeIntoContainer(
    null,
    children,
    domContainer,
    false,
    callback,
  );
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

function unmountComponentAtNode(domContainer: DOMContainer) {
  invariant(
    isValidContainer(domContainer),
    'unmountComponentAtNode(...): Target container is not a DOM element.',
  );
  if (roots.has(domContainer)) {
    unbatchedUpdates(() => {
      legacyRenderSubtreeIntoContainer(null, null, domContainer, false, () => {
        roots.delete(domContainer);
      });
    });
    return true;
  } else {
    if (__DEV__ && (domContainer: any)._reactRootDev === true) {
      warningWithoutStack(
        false,
        "unmountComponentAtNode(): The node you're attempting to unmount " +
          'was rendered by another copy of React.',
      );
    }
  }
  if (__DEV__) {
    const rootEl = getReactRootElementInContainer(domContainer);
    const hasNonRootReactChild = !!(rootEl && getFiberFromDomNode(rootEl));

    // Check if the container itself is a React root node.
    const isContainerReactRoot =
      domContainer.nodeType === ELEMENT_NODE &&
      isValidContainer(domContainer.parentNode) &&
      roots.has(domContainer.parentNode);

    warningWithoutStack(
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

function hydrate(
  element: React$Node,
  container: DOMContainer,
  callback: ?Function,
) {
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    true,
    callback,
  );
}

/**
 * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
 * DOM node.
 */
function getDomNodeFromFiber(inst: Object) {
  if (inst.tag === HostComponent || inst.tag === HostText) {
    // In Fiber this, is just the state node right now. We assume it will be
    // a host component or host text.
    return inst.stateNode;
  }

  // Without this first invariant, passing a non-DOM-component triggers the next
  // invariant for a missing parent, which is super confusing.
  invariant(false, 'getNodeFromInstance: Invalid argument.');
}

// Ideally we should aim to remove this from React Fire
function unstable_renderSubtreeIntoContainer(
  parentComponent: React$Component<any, any>,
  element: React$Element<any>,
  containerNode: DOMContainer,
  callback: ?Function,
) {
  invariant(
    parentComponent != null && hasInstance(parentComponent),
    'parentComponent must be a valid React Component',
  );
  return legacyRenderSubtreeIntoContainer(
    parentComponent,
    element,
    containerNode,
    false,
    callback,
  );
}

const noOp = () => {};

const ReactDOM: Object = {
  createPortal,
  findDOMNode,
  flushSync,
  hydrate,
  render,
  unmountComponentAtNode,
  // Temporary alias since we already shipped React 16 RC with it.
  // TODO: remove in React 17.
  unstable_createPortal(...args) {
    if (!didWarnAboutUnstableCreatePortal) {
      didWarnAboutUnstableCreatePortal = true;
      lowPriorityWarning(
        false,
        'The ReactDOM.unstable_createPortal() alias has been deprecated, ' +
          'and will be removed in React 17+. Update your code to use ' +
          'ReactDOM.createPortal() instead. It has the exact same API, ' +
          'but without the "unstable_" prefix.',
      );
    }
    return createPortal(...args);
  },
  unstable_createRoot: undefined,
  unstable_batchedUpdates: batchedUpdates,
  unstable_flushControlled: flushControlled,
  unstable_interactiveUpdates: interactiveUpdates,
  unstable_renderSubtreeIntoContainer,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Keep in sync with ReactDOMUnstableNativeDependencies.js
    // and ReactTestUtils.js. This is an array for better minification.
    Events: [
      getFiberFromDomNode,
      getDomNodeFromFiber,
      getFiberPropsFromDomNodeInstance,
      noOp,
      null,
      noOp,
      noOp,
      enqueueStateRestore,
      restoreStateIfNeeded,
      proxyListener,
      noOp,
    ],
  },
};

if (enableStableConcurrentModeAPIs) {
  ReactDOM.createRoot = createRoot;
} else {
  ReactDOM.unstable_createRoot = createRoot;
}

setupDevTools();

export default ReactDOM;
