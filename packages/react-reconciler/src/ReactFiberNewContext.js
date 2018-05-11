/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ReactContext} from 'shared/ReactTypes';
import type {StackCursor, Stack} from './ReactFiberStack';

export type NewContext = {
  pushProvider(providerFiber: Fiber): void,
  popProvider(providerFiber: Fiber): void,
  getContextCurrentValue(context: ReactContext<any>): any,
  getContextChangedBits(context: ReactContext<any>): number,
};

export default function(stack: Stack, isPrimaryRenderer: boolean) {
  const {createCursor, push, pop} = stack;

  const providerCursor: StackCursor<Fiber | null> = createCursor(null);
  const valueCursor: StackCursor<mixed> = createCursor(null);
  const changedBitsCursor: StackCursor<number> = createCursor(0);

  function pushProvider(providerFiber: Fiber): void {
    const context: ReactContext<any> = providerFiber.type._context;

    if (isPrimaryRenderer) {
      push(changedBitsCursor, context._changedBits, providerFiber);
      push(valueCursor, context._currentValue, providerFiber);
      push(providerCursor, providerFiber, providerFiber);

      context._currentValue = providerFiber.pendingProps.value;
      context._changedBits = providerFiber.stateNode;
    } else {
      push(changedBitsCursor, context._changedBits_secondary, providerFiber);
      push(valueCursor, context._currentValue_secondary, providerFiber);
      push(providerCursor, providerFiber, providerFiber);

      context._currentValue_secondary = providerFiber.pendingProps.value;
      context._changedBits_secondary = providerFiber.stateNode;
    }
  }

  function popProvider(providerFiber: Fiber): void {
    const changedBits = changedBitsCursor.current;
    const currentValue = valueCursor.current;

    pop(providerCursor, providerFiber);
    pop(valueCursor, providerFiber);
    pop(changedBitsCursor, providerFiber);

    const context: ReactContext<any> = providerFiber.type._context;
    if (isPrimaryRenderer) {
      context._currentValue = currentValue;
      context._changedBits = changedBits;
    } else {
      context._currentValue_secondary = currentValue;
      context._changedBits_secondary = changedBits;
    }
  }

  function getContextCurrentValue(context: ReactContext<any>): any {
    return isPrimaryRenderer
      ? context._currentValue
      : context._currentValue_secondary;
  }

  function getContextChangedBits(context: ReactContext<any>): number {
    return isPrimaryRenderer
      ? context._changedBits
      : context._changedBits_secondary;
  }

  return {
    pushProvider,
    popProvider,
    getContextCurrentValue,
    getContextChangedBits,
  };
}
