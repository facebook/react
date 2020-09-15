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
  // eslint-disable-next-line no-unused-expressions
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory(require('react')))
    : typeof define === 'function' && define.amd // eslint-disable-line no-undef
    ? define(['react'], factory) // eslint-disable-line no-undef
    : (global.SchedulerTracing = factory(global));
})(this, function(global) {
  function unstable_clear() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracing.unstable_clear.apply(
      this,
      arguments
    );
  }

  function unstable_getCurrent() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracing.unstable_getCurrent.apply(
      this,
      arguments
    );
  }

  function unstable_getThreadID() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracing.unstable_getThreadID.apply(
      this,
      arguments
    );
  }

  function unstable_subscribe() {
    // eslint-disable-next-line max-len
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracing.unstable_subscribe.apply(
      this,
      arguments
    );
  }

  function unstable_trace() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracing.unstable_trace.apply(
      this,
      arguments
    );
  }

  function unstable_unsubscribe() {
    // eslint-disable-next-line max-len
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracing.unstable_unsubscribe.apply(
      this,
      arguments
    );
  }

  function unstable_wrap() {
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTracing.unstable_wrap.apply(
      this,
      arguments
    );
  }

  return Object.freeze({
    unstable_clear: unstable_clear,
    unstable_getCurrent: unstable_getCurrent,
    unstable_getThreadID: unstable_getThreadID,
    unstable_subscribe: unstable_subscribe,
    unstable_trace: unstable_trace,
    unstable_unsubscribe: unstable_unsubscribe,
    unstable_wrap: unstable_wrap,
  });
});
