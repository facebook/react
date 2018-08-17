/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Subscriber} from './InteractionTracking';

import {enableInteractionTracking} from 'shared/ReactFeatureFlags';
import {__subscriberRef} from 'interaction-tracking';

export function subscribe(subscriber: Subscriber): void {
  if (enableInteractionTracking) {
    __subscriberRef.current = subscriber;
  }
}

export function unsubscribe(subscriber: Subscriber): void {
  if (enableInteractionTracking) {
    __subscriberRef.current = null;
  }
}
