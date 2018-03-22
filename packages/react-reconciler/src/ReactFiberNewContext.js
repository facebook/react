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

import warning from 'fbjs/lib/warning';

export type NewContext = {
  pushProvider(providerFiber: Fiber): void,
  popProvider(providerFiber: Fiber): void,
};

export default function(stack: Stack) {
  const {createCursor, push, pop} = stack;

  const providerCursor: StackCursor<Fiber | null> = createCursor(null);
  const valueCursor: StackCursor<mixed> = createCursor(null);
  const changedBitsCursor: StackCursor<number> = createCursor(0);

  let rendererSigil;
  if (__DEV__) {
    // Use this to detect multiple renderers using the same context
    rendererSigil = {};
  }

  function pushProvider(providerFiber: Fiber): void {
    const context: ReactContext<any> = providerFiber.type.context;

    push(changedBitsCursor, context._changedBits, providerFiber);
    push(valueCursor, context._currentValue, providerFiber);
    push(providerCursor, providerFiber, providerFiber);

    context._currentValue = providerFiber.pendingProps.value;
    context._changedBits = providerFiber.stateNode;

    if (__DEV__) {
      warning(
        context._currentRenderer === null ||
          context._currentRenderer === rendererSigil,
        'Detected multiple renderers concurrently rendering the ' +
          'same context provider. This is currently unsupported.',
      );
      context._currentRenderer = rendererSigil;
    }
  }

  function popProvider(providerFiber: Fiber): void {
    const changedBits = changedBitsCursor.current;
    const currentValue = valueCursor.current;

    pop(providerCursor, providerFiber);
    pop(valueCursor, providerFiber);
    pop(changedBitsCursor, providerFiber);

    const context: ReactContext<any> = providerFiber.type.context;
    context._currentValue = currentValue;
    context._changedBits = changedBits;
  }

  return {
    pushProvider,
    popProvider,
  };
}
