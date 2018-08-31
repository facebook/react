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
      : (global.ReactSchedulerTrackingSubscriptions = factory(global));
})(this, function(global) {
  function unstable_subscribe() {
    // eslint-disable-next-line max-len
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTrackingSubscriptions.unstable_subscribe.apply(
      this,
      arguments
    );
  }

  function unstable_unsubscribe() {
    // eslint-disable-next-line max-len
    return global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.SchedulerTrackingSubscriptions.unstable_unsubscribe.apply(
      this,
      arguments
    );
  }

  return Object.freeze({
    unstable_subscribe: unstable_subscribe,
    unstable_unsubscribe: unstable_unsubscribe,
  });
});
