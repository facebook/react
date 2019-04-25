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

export function getEventCurrentTarget(
  event: ReactResponderEvent,
  context: ReactResponderContext,
) {
  const target: any = event.target;
  let currentTarget = target;
  while (
    currentTarget.parentNode &&
    currentTarget.parentNode.nodeType === Node.ELEMENT_NODE &&
    context.isTargetWithinEventComponent(currentTarget.parentNode)
  ) {
    currentTarget = currentTarget.parentNode;
  }
  return currentTarget;
}

export function getEventPointerType(event: ReactResponderEvent) {
  const nativeEvent: any = event.nativeEvent;
  const {type, pointerType} = nativeEvent;
  if (pointerType != null) {
    return pointerType;
  }
  if (type.indexOf('mouse') === 0) {
    return 'mouse';
  }
  if (type.indexOf('touch') === 0) {
    return 'touch';
  }
  if (type.indexOf('key') === 0) {
    return 'keyboard';
  }
  return '';
}

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
