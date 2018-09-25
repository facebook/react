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
} = ReactInternals.Scheduler;

export {unstable_cancelCallback, unstable_now, unstable_scheduleCallback};
