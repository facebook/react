/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {hasPointerEvent, setPointerEvent} from './domEnvironment';

export function describeWithPointerEvent(message, describeFn) {
  const pointerEvent = 'PointerEvent';
  const fallback = 'MouseEvent/TouchEvent';
  describe.each`
    value    | name
    ${true}  | ${pointerEvent}
    ${false} | ${fallback}
  `(`${message}: $name`, entry => {
    const hasPointerEvents = entry.value;
    setPointerEvent(hasPointerEvents);
    describeFn(hasPointerEvents);
  });
}

export function testWithPointerType(message, testFn) {
  const table = hasPointerEvent()
    ? ['mouse', 'touch', 'pen']
    : ['mouse', 'touch'];
  test.each(table)(`${message}: %s`, pointerType => {
    testFn(pointerType);
  });
}
