/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

const ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const {
  unstable_cancelCallback,
  unstable_now,
  unstable_scheduleCallback,
  unstable_shouldYield,
  unstable_requestPaint,
  unstable_getFirstCallbackNode,
  unstable_runWithPriority,
  unstable_next,
  unstable_continueExecution,
  unstable_pauseExecution,
  unstable_getCurrentPriorityLevel,
  unstable_ImmediatePriority,
  unstable_UserBlockingPriority,
  unstable_NormalPriority,
  unstable_LowPriority,
  unstable_IdlePriority,
  unstable_forceFrameRate,

  // this doesn't actually exist on the scheduler, but it *does*
  // on scheduler/unstable_mock, which we'll need inside act().
  unstable_flushAllWithoutAsserting,
} = ReactInternals.Scheduler;

export {
  unstable_cancelCallback,
  unstable_now,
  unstable_scheduleCallback,
  unstable_shouldYield,
  unstable_requestPaint,
  unstable_getFirstCallbackNode,
  unstable_runWithPriority,
  unstable_next,
  unstable_continueExecution,
  unstable_pauseExecution,
  unstable_getCurrentPriorityLevel,
  unstable_ImmediatePriority,
  unstable_UserBlockingPriority,
  unstable_NormalPriority,
  unstable_LowPriority,
  unstable_IdlePriority,
  unstable_forceFrameRate,
  unstable_flushAllWithoutAsserting,
};
