/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RootType} from './ReactDOMRoot';
import type {ReactNodeList} from 'shared/ReactTypes';

import '../shared/checkReact';
import './ReactDOMClientInjection';
import {
  findDOMNode,
  render,
  hydrate,
  unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode,
} from './ReactDOMLegacy';
import {createRoot, createBlockingRoot, isValidContainer} from './ReactDOMRoot';

import {
  batchedEventUpdates,
  batchedUpdates,
  discreteUpdates,
  flushDiscreteUpdates,
  flushSync,
  flushControlled,
  injectIntoDevTools,
  flushPassiveEffects,
  IsThisRendererActing,
  attemptSynchronousHydration,
  attemptUserBlockingHydration,
  attemptContinuousHydration,
  attemptHydrationAtCurrentPriority,
} from 'react-reconciler/inline.dom';
import {createPortal as createPortalImpl} from 'shared/ReactPortal';
import {canUseDOM} from 'shared/ExecutionEnvironment';
import {setBatchingImplementation} from 'legacy-events/ReactGenericBatching';
import {
  setRestoreImplementation,
  enqueueStateRestore,
  restoreStateIfNeeded,
} from 'legacy-events/ReactControlledComponent';
import {injection as EventPluginHubInjection} from 'legacy-events/EventPluginHub';
import {runEventsInBatch} from 'legacy-events/EventBatching';
import {eventNameDispatchConfigs} from 'legacy-events/EventPluginRegistry';
import {
  accumulateTwoPhaseDispatches,
  accumulateDirectDispatches,
} from 'legacy-events/EventPropagators';
import ReactVersion from 'shared/ReactVersion';
import invariant from 'shared/invariant';
import lowPriorityWarningWithoutStack from 'shared/lowPriorityWarningWithoutStack';
import warningWithoutStack from 'shared/warningWithoutStack';
import {exposeConcurrentModeAPIs} from 'shared/ReactFeatureFlags';

import {
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
  getClosestInstanceFromNode,
} from './ReactDOMComponentTree';
import {restoreControlledState} from './ReactDOMComponent';
import {dispatchEvent} from '../events/ReactDOMEventListener';
import {
  setAttemptSynchronousHydration,
  setAttemptUserBlockingHydration,
  setAttemptContinuousHydration,
  setAttemptHydrationAtCurrentPriority,
  queueExplicitHydrationTarget,
} from '../events/ReactDOMEventReplaying';

setAttemptSynchronousHydration(attemptSynchronousHydration);
setAttemptUserBlockingHydration(attemptUserBlockingHydration);
setAttemptContinuousHydration(attemptContinuousHydration);
setAttemptHydrationAtCurrentPriority(attemptHydrationAtCurrentPriority);

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
}

setRestoreImplementation(restoreControlledState);
setBatchingImplementation(
  batchedUpdates,
  discreteUpdates,
  flushDiscreteUpdates,
  batchedEventUpdates,
);

export type DOMContainer =
  | (Element & {
      _reactRootContainer: ?RootType,
    })
  | (Document & {
      _reactRootContainer: ?RootType,
    });

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

const ReactDOM: Object = {
  createPortal,

  // Legacy
  findDOMNode,
  hydrate,
  render,
  unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode,

  // Temporary alias since we already shipped React 16 RC with it.
  // TODO: remove in React 17.
  unstable_createPortal(...args) {
    if (__DEV__) {
      if (!didWarnAboutUnstableCreatePortal) {
        didWarnAboutUnstableCreatePortal = true;
        lowPriorityWarningWithoutStack(
          false,
          'The ReactDOM.unstable_createPortal() alias has been deprecated, ' +
            'and will be removed in React 17+. Update your code to use ' +
            'ReactDOM.createPortal() instead. It has the exact same API, ' +
            'but without the "unstable_" prefix.',
        );
      }
    }
    return createPortal(...args);
  },

  unstable_batchedUpdates: batchedUpdates,

  flushSync: flushSync,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Keep in sync with ReactDOMUnstableNativeDependencies.js
    // ReactTestUtils.js, and ReactTestUtilsAct.js. This is an array for better minification.
    Events: [
      getInstanceFromNode,
      getNodeFromInstance,
      getFiberCurrentPropsFromNode,
      EventPluginHubInjection.injectEventPluginsByName,
      eventNameDispatchConfigs,
      accumulateTwoPhaseDispatches,
      accumulateDirectDispatches,
      enqueueStateRestore,
      restoreStateIfNeeded,
      dispatchEvent,
      runEventsInBatch,
      flushPassiveEffects,
      IsThisRendererActing,
    ],
  },
};

if (exposeConcurrentModeAPIs) {
  ReactDOM.createRoot = createRoot;
  ReactDOM.createBlockingRoot = createBlockingRoot;

  ReactDOM.unstable_discreteUpdates = discreteUpdates;
  ReactDOM.unstable_flushDiscreteUpdates = flushDiscreteUpdates;
  ReactDOM.unstable_flushControlled = flushControlled;

  ReactDOM.unstable_scheduleHydration = target => {
    if (target) {
      queueExplicitHydrationTarget(target);
    }
  };
}

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

export default ReactDOM;
