/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';
import {
  unstable_now as now,
  unstable_scheduleWork as scheduleWork,
  unstable_cancelScheduledWork as cancelScheduledWork,
} from 'react-scheduler';

export {now, scheduleWork, cancelScheduledWork};
