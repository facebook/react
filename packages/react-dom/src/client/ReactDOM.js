/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {Container} from './ReactDOMHostConfig';
import type {
  RootType,
  HydrateRootOptions,
  CreateRootOptions,
} from './ReactDOMRoot';

import {
  findDOMNode,
  render,
  hydrate,
  unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode,
} from './ReactDOMLegacy';
import {
  createRoot as createRootImpl,
  hydrateRoot as hydrateRootImpl,
  isValidContainer,
} from './ReactDOMRoot';
import {createEventHandle} from './ReactDOMEventHandle';

import {
  batchedUpdates,
  discreteUpdates,
  flushSync as flushSyncWithoutWarningIfAlreadyRendering,
  isAlreadyRendering,
  flushControlled,
  injectIntoDevTools,
  attemptSynchronousHydration,
  attemptDiscreteHydration,
  attemptContinuousHydration,
  attemptHydrationAtCurrentPriority,
} from 'react-reconciler/src/ReactFiberReconciler';
import {
  runWithPriority,
  getCurrentUpdatePriority,
} from 'react-reconciler/src/ReactEventPriorities';
import {createPortal as createPortalImpl} from 'react-reconciler/src/ReactPortal';
import {canUseDOM} from 'shared/ExecutionEnvironment';
import ReactVersion from 'shared/ReactVersion';
import {enableNewReconciler} from 'shared/ReactFeatureFlags';

import {
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
  getClosestInstanceFromNode,
} from './ReactDOMComponentTree';
import {restoreControlledState} from './ReactDOMComponent';
import {
  setAttemptSynchronousHydration,
  setAttemptDiscreteHydration,
  setAttemptContinuousHydration,
  setAttemptHydrationAtCurrentPriority,
  setGetCurrentUpdatePriority,
  setAttemptHydrationAtPriority,
} from '../events/ReactDOMEventReplaying';
import {setBatchingImplementation} from '../events/ReactDOMUpdateBatching';
import {
  setRestoreImplementation,
  enqueueStateRestore,
  restoreStateIfNeeded,
} from '../events/ReactDOMControlledComponent';

setAttemptSynchronousHydration(attemptSynchronousHydration);
setAttemptDiscreteHydration(attemptDiscreteHydration);
setAttemptContinuousHydration(attemptContinuousHydration);
setAttemptHydrationAtCurrentPriority(attemptHydrationAtCurrentPriority);
setGetCurrentUpdatePriority(getCurrentUpdatePriority);
setAttemptHydrationAtPriority(runWithPriority);

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
    console.error(
      'React depends on Map and Set built-in types. Make sure that you load a ' +
        'polyfill in older browsers. https://reactjs.org/link/react-polyfills',
    );
  }
}

setRestoreImplementation(restoreControlledState);
setBatchingImplementation(
  batchedUpdates,
  discreteUpdates,
  flushSyncWithoutWarningIfAlreadyRendering,
);

function createPortal(
  children: ReactNodeList,
  container: Element | DocumentFragment,
  key: ?string = null,
): React$Portal {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  // TODO: pass ReactDOM portal implementation as third argument
  // $FlowFixMe The Flow type is opaque but there's no way to actually create it.
  return createPortalImpl(children, container, null, key);
}

function renderSubtreeIntoContainer(
  parentComponent: React$Component<any, any>,
  element: React$Element<any>,
  containerNode: Container,
  callback: ?Function,
) {
  return unstable_renderSubtreeIntoContainer(
    parentComponent,
    element,
    containerNode,
    callback,
  );
}

const Internals = {
  usingClientEntryPoint: false,
  // Keep in sync with ReactTestUtils.js.
  // This is an array for better minification.
  Events: [
    getInstanceFromNode,
    getNodeFromInstance,
    getFiberCurrentPropsFromNode,
    enqueueStateRestore,
    restoreStateIfNeeded,
    batchedUpdates,
  ],
};

function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  if (__DEV__) {
    if (!Internals.usingClientEntryPoint && !__UMD__) {
      console.error(
        'You are importing createRoot from "react-dom" which is not supported. ' +
          'You should instead import it from "react-dom/client".',
      );
    }
  }
  return createRootImpl(container, options);
}

function hydrateRoot(
  container: Document | Element,
  initialChildren: ReactNodeList,
  options?: HydrateRootOptions,
): RootType {
  if (__DEV__) {
    if (!Internals.usingClientEntryPoint && !__UMD__) {
      console.error(
        'You are importing hydrateRoot from "react-dom" which is not supported. ' +
          'You should instead import it from "react-dom/client".',
      );
    }
  }
  return hydrateRootImpl(container, initialChildren, options);
}

// Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
declare function flushSync<R>(fn: () => R): R;
// eslint-disable-next-line no-redeclare
declare function flushSync(): void;
// eslint-disable-next-line no-redeclare
function flushSync(fn) {
  if (__DEV__) {
    if (isAlreadyRendering()) {
      console.error(
        'flushSync was called from inside a lifecycle method. React cannot ' +
          'flush when React is already rendering. Consider moving this call to ' +
          'a scheduler task or micro task.',
      );
    }
  }
  return flushSyncWithoutWarningIfAlreadyRendering(fn);
}

export {
  createPortal,
  batchedUpdates as unstable_batchedUpdates,
  flushSync,
  Internals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  ReactVersion as version,
  // Disabled behind disableLegacyReactDOMAPIs
  findDOMNode,
  hydrate,
  render,
  unmountComponentAtNode,
  // exposeConcurrentModeAPIs
  createRoot,
  hydrateRoot,
  flushControlled as unstable_flushControlled,
  // Disabled behind disableUnstableRenderSubtreeIntoContainer
  renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer,
  // enableCreateEventHandleAPI
  createEventHandle as unstable_createEventHandle,
  // TODO: Remove this once callers migrate to alternatives.
  // This should only be used by React internals.
  runWithPriority as unstable_runWithPriority,
};

const foundDevTools = injectIntoDevTools({
  findFiberByHostInstance: getClosestInstanceFromNode,
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-dom',
});

if (__DEV__) {
  if (!foundDevTools && canUseDOM && window.top === window.self) {
    // If we're in Chrome or Firefox, provide a download link if not installed.
    if (
      (navigator.userAgent.indexOf('Chrome') > -1 &&
        navigator.userAgent.indexOf('Edge') === -1) ||
      navigator.userAgent.indexOf('Firefox') > -1
    ) {
      const protocol = window.location.protocol;
      // Don't warn in exotic cases like chrome-extension://.
      if (/^(https?|file):$/.test(protocol)) {
        // eslint-disable-next-line react-internal/no-production-logging
        console.info(
          '%cDownload the React DevTools ' +
            'for a better development experience: ' +
            'https://reactjs.org/link/react-devtools' +
            (protocol === 'file:'
              ? '\nYou might need to use a local HTTP server (instead of file://): ' +
                'https://reactjs.org/link/react-devtools-faq'
              : ''),
          'font-weight:bold',
        );
      }
    }
  }
}

export const unstable_isNewReconciler = enableNewReconciler;
