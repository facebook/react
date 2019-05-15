/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactResponderEvent,
  ReactResponderContext,
} from 'shared/ReactTypes';

export function isEventPositionWithinTouchHitTarget(
  event: ReactResponderEvent,
  context: ReactResponderContext,
) {
  const nativeEvent: any = event.nativeEvent;
  return context.isPositionWithinTouchHitTarget(
    // x and y can be doubles, so ensure they are integers
    parseInt(nativeEvent.x, 10),
    parseInt(nativeEvent.y, 10),
  );
}
