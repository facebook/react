/**
 * @license React
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory(require('react')))
    : typeof define === 'function' && define.amd // eslint-disable-line no-undef
      ? define(['react'], factory) // eslint-disable-line no-undef
      : (global.ScheduleTracking = factory(global));
})(this, function(global) {
  function unstable_clear() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking.unstable_clear.apply(
      this,
      arguments
    );
  }

  function unstable_getCurrent() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking.unstable_getCurrent.apply(
      this,
      arguments
    );
  }

  function unstable_getThreadID() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking.unstable_getThreadID.apply(
      this,
      arguments
    );
  }

  function unstable_subscribe() {
    // eslint-disable-next-line max-len
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking.unstable_subscribe.apply(
      this,
      arguments
    );
  }

  function unstable_track() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking.unstable_track.apply(
      this,
      arguments
    );
  }

  function unstable_unsubscribe() {
    // eslint-disable-next-line max-len
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking.unstable_unsubscribe.apply(
      this,
      arguments
    );
  }

  function unstable_wrap() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking.unstable_wrap.apply(
      this,
      arguments
    );
  }

  return Object.freeze({
    unstable_clear: unstable_clear,
    unstable_getCurrent: unstable_getCurrent,
    unstable_getThreadID: unstable_getThreadID,
    unstable_subscribe: unstable_subscribe,
    unstable_track: unstable_track,
    unstable_unsubscribe: unstable_unsubscribe,
    unstable_wrap: unstable_wrap,
  });
});
