/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assign from 'object-assign';
import {
  unstable_cancelScheduledWork as cancelScheduledWork,
  unstable_now as now,
  unstable_scheduleWork as scheduleWork,
} from 'react-scheduler';
import {
  __getInteractionsRef,
  __getSubscriberRef,
  unstable_clear as clear,
  unstable_getCurrent as getCurrent,
  unstable_getThreadID as getThreadID,
  unstable_track as track,
  unstable_wrap as wrap,
} from 'react-scheduler/tracking';
import {
  unstable_subscribe as subscribe,
  unstable_unsubscribe as unsubscribe,
} from 'react-scheduler/tracking-subscriptions';
import ReactCurrentOwner from './ReactCurrentOwner';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';

const ReactSharedInternals = {
  ReactCurrentOwner,
  // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  assign,
};

if (__UMD__) {
  // Re-export the react-scheduler API(s) for UMD bundles.
  // This avoids introducing a dependency on a new UMD global in a minor update,
  // Since that would be a breaking change (e.g. for all existing CodeSandboxes).
  // This re-export is only required for UMD bundles;
  // CJS bundles use the shared NPM package.
  Object.assign(ReactSharedInternals, {
    Scheduler: {
      cancelScheduledWork,
      now,
      scheduleWork,
    },
    SchedulerTracking: {
      __getInteractionsRef,
      __getSubscriberRef,
      clear,
      getCurrent,
      getThreadID,
      track,
      wrap,
    },
    SchedulerTrackingSubscriptions: {
      subscribe,
      unsubscribe,
    },
  });
}

if (__DEV__) {
  Object.assign(ReactSharedInternals, {
    // These should not be included in production.
    ReactDebugCurrentFrame,
    // Shim for React DOM 16.0.0 which still destructured (but not used) this.
    // TODO: remove in React 17.0.
    ReactComponentTreeHook: {},
  });
}

export default ReactSharedInternals;
