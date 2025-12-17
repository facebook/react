/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {ReactScheduleStateUpdateEvent, SchedulingEvent} from '../types';

export function isStateUpdateEvent(
  event: SchedulingEvent,
  // eslint-disable-next-line
): event is ReactScheduleStateUpdateEvent {
  return event.type === 'schedule-state-update';
}
