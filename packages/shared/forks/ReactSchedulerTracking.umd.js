/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

export function __getInteractionsRef() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracking.__getInteractionsRef.apply(
    this,
    arguments,
  );
}

export function __getSubscriberRef() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracking.__getSubscriberRef.apply(
    this,
    arguments,
  );
}

export function unstable_clear() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracking.clear.apply(
    this,
    arguments,
  );
}

export function unstable_getCurrent() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracking.getCurrent.apply(
    this,
    arguments,
  );
}

export function unstable_getThreadID() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracking.getThreadID.apply(
    this,
    arguments,
  );
}

export function unstable_track() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracking.track.apply(
    this,
    arguments,
  );
}

export function unstable_wrap() {
  return React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracking.wrap.apply(
    this,
    arguments,
  );
}
