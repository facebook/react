/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
import type {Transition} from './ReactFiberTracingMarkerComponent.new';

const {ReactCurrentBatchConfig} = ReactSharedInternals;

export const NoTransition = null;

export function requestCurrentTransition(): Transition | null {
  return ReactCurrentBatchConfig.transition;
}
