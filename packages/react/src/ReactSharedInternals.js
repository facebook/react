/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assign from 'object-assign';
import {
  unstable_cancelScheduledWork,
  unstable_now,
  unstable_scheduleWork,
} from 'schedule';
import {
  __interactionsRef,
  __subscriberRef,
  unstable_clear,
  unstable_getCurrent,
  unstable_getThreadID,
  unstable_subscribe,
  unstable_track,
  unstable_unsubscribe,
  unstable_wrap,
} from 'schedule/tracking';
import ReactCurrentOwner from './ReactCurrentOwner';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';

const ReactSharedInternals = {
  ReactCurrentOwner,
  // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  assign,
};

if (__UMD__) {
  // Re-export the schedule API(s) for UMD bundles.
  // This avoids introducing a dependency on a new UMD global in a minor update,
  // Since that would be a breaking change (e.g. for all existing CodeSandboxes).
  // This re-export is only required for UMD bundles;
  // CJS bundles use the shared NPM package.
  Object.assign(ReactSharedInternals, {
    Schedule: {
      unstable_cancelScheduledWork,
      unstable_now,
      unstable_scheduleWork,
    },
    ScheduleTracking: {
      __interactionsRef,
      __subscriberRef,
      unstable_clear,
      unstable_getCurrent,
      unstable_getThreadID,
      unstable_subscribe,
      unstable_track,
      unstable_unsubscribe,
      unstable_wrap,
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
