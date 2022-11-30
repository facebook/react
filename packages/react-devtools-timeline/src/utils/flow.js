/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {SchedulingEvent} from '../types';

export function isStateUpdateEvent(event: SchedulingEvent): boolean %checks {
  return event.type === 'schedule-state-update';
}
