/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import expect from 'expect';

import {createMockSubscriber} from './createMockSubscriber';
import {
  toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted,
  toHaveBeenLastNotifiedOfInteractionTraced,
  toHaveBeenLastNotifiedOfWorkCanceled,
  toHaveBeenLastNotifiedOfWorkScheduled,
  toHaveBeenLastNotifiedOfWorkStarted,
  toHaveBeenLastNotifiedOfWorkStopped,
  toHaveBeenNotifiedOfInteractionsScheduledWorkCompleted,
  toHaveBeenNotifiedOfInteractionsTraced,
  toHaveBeenTracedWith,
  toMatchInteraction,
  toMatchInteractions,
} from './tracingMatchers';

// Auto install on require.
expect.extend({
  toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted,
  toHaveBeenLastNotifiedOfInteractionTraced,
  toHaveBeenLastNotifiedOfWorkCanceled,
  toHaveBeenLastNotifiedOfWorkScheduled,
  toHaveBeenLastNotifiedOfWorkStarted,
  toHaveBeenLastNotifiedOfWorkStopped,
  toHaveBeenNotifiedOfInteractionsScheduledWorkCompleted,
  toHaveBeenNotifiedOfInteractionsTraced,
  toHaveBeenTracedWith,
  toMatchInteraction,
  toMatchInteractions,
});

export {
  createMockSubscriber,
  toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted,
  toHaveBeenLastNotifiedOfInteractionTraced,
  toHaveBeenLastNotifiedOfWorkCanceled,
  toHaveBeenLastNotifiedOfWorkScheduled,
  toHaveBeenLastNotifiedOfWorkStarted,
  toHaveBeenLastNotifiedOfWorkStopped,
  toHaveBeenNotifiedOfInteractionsScheduledWorkCompleted,
  toHaveBeenNotifiedOfInteractionsTraced,
  toHaveBeenTracedWith,
  toMatchInteraction,
  toMatchInteractions,
};
