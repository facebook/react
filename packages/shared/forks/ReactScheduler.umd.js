/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

export function unstable_now() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Scheduler.now.apply(
    this,
    arguments,
  );
}

export function unstable_scheduleWork() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Scheduler.scheduleWork.apply(
    this,
    arguments,
  );
}

export function unstable_cancelScheduledWork() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Scheduler.cancelScheduledWork.apply(
    this,
    arguments,
  );
}
