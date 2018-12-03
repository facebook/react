/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {roots, ReactRoot} from './ReactFireRoots';
import {
  enqueueStateRestore,
  restoreStateIfNeeded,
  setRestoreImplementation,
} from './controlled/ReactFireControlledState';
import {setBatchingImplementation} from './ReactFireBatching';
import {
  batchedUpdates,
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
  DOCUMENT_NODE,
  ELEMENT_NODE,
  ROOT_ATTRIBUTE_NAME,
} from './ReactFireDOMConfig';
import {getPublicRootInstance, isValidContainer} from './ReactFireUtils';
import {
  getFiberFromDomNode,
  getFiberPropsFromDomNodeInstance,
} from './ReactFireInternal';
import {proxyListener} from './ReactFireEvents';

import invariant from 'shared/invariant';
import {createPortal as createPortalImpl} from 'shared/ReactPortal';
import getComponentName from 'shared/getComponentName';
import {enableStableConcurrentModeAPIs} from 'shared/ReactFeatureFlags';
import warningWithoutStack from 'shared/warningWithoutStack';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {HostComponent, HostText} from 'shared/ReactWorkTags';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

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

function cleanRootDOMContainer(container) {
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

function legacyRenderRoot(children, domContainer, callback, shouldHydrate) {
  let root = roots.get(domContainer);
  if (root === undefined) {
    invariant(
      isValidContainer(domContainer),
      'unmountComponentAtNode(...): Target container is not a DOM element.',
    );
    if (!shouldHydrate) {
      cleanRootDOMContainer(domContainer);
    }
    root = new ReactRoot(domContainer, false, shouldHydrate);
    roots.set(domContainer, root);
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(root._internalRoot);
        originalCallback.call(instance);
      };
    }
    // Initial mount should not be batched.
    unbatchedUpdates(() => {
      root.render(children, callback);
    });
  } else {
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(root._internalRoot);
        originalCallback.call(instance);
      };
    }
    root.render(children, callback);
  }
  return getPublicRootInstance(root._internalRoot);
}

function render(children, domContainer, callback) {
  return legacyRenderRoot(children, domContainer, callback, false);
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

function unmountComponentAtNode(domContainer) {
  invariant(
    isValidContainer(domContainer),
    'unmountComponentAtNode(...): Target container is not a DOM element.',
  );
  if (roots.has(domContainer)) {
    if (__DEV__) {
      const rootEl = getReactRootElementInContainer(domContainer);
      const renderedByDifferentReact = rootEl && !getFiberFromDomNode(rootEl);
      warningWithoutStack(
        !renderedByDifferentReact,
        "unmountComponentAtNode(): The node you're attempting to unmount " +
          'was rendered by another copy of React.',
      );
    }
    unbatchedUpdates(() => {
      render(null, domContainer, () => {
        roots.delete(domContainer);
      });
    });
    return true;
  }
  if (__DEV__) {
    const rootEl = getReactRootElementInContainer(domContainer);
    const hasNonRootReactChild = !!(rootEl && getFiberFromDomNode(rootEl));

    // Check if the container itself is a React root node.
    const isContainerReactRoot =
      domContainer.nodeType === ELEMENT_NODE &&
      isValidContainer(domContainer.parentNode) &&
      !!domContainer.parentNode._reactRootContainer;

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
  return legacyRenderRoot(element, container, callback, true);
}

/**
 * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
 * DOM node.
 */
function getDomNodeFromFiber(inst) {
  if (inst.tag === HostComponent || inst.tag === HostText) {
    // In Fiber this, is just the state node right now. We assume it will be
    // a host component or host text.
    return inst.stateNode;
  }

  // Without this first invariant, passing a non-DOM-component triggers the next
  // invariant for a missing parent, which is super confusing.
  invariant(false, 'getNodeFromInstance: Invalid argument.');
}

const noOp = () => {};

const ReactDOM = {
  createPortal,
  findDOMNode,
  flushSync,
  hydrate,
  render,
  unmountComponentAtNode,
  unstable_createRoot: undefined,
  unstable_batchedUpdates: batchedUpdates,
  unstable_flushControlled: flushControlled,
  unstable_interactiveUpdates: interactiveUpdates,
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
