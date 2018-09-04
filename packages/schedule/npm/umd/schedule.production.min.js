/**
 * @license React
 *
 * Copyright (c) 2013-present, Facebook, Inc.
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
      : (global.Schedule = factory(global));
})(this, function(global) {
  function unstable_now() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Schedule.unstable_now.apply(
      this,
      arguments
    );
  }

  function unstable_scheduleWork() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Schedule.unstable_scheduleWork.apply(
      this,
      arguments
    );
  }

  function unstable_cancelScheduledWork() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Schedule.unstable_cancelScheduledWork.apply(
      this,
      arguments
    );
  }

  return Object.freeze({
    unstable_now: unstable_now,
    unstable_scheduleWork: unstable_scheduleWork,
    unstable_cancelScheduledWork: unstable_cancelScheduledWork,
  });
});
