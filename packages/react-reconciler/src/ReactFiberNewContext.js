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

import warning from 'fbjs/lib/warning';

let stack: Array<Fiber> = [];
let index = -1;

let rendererSigil;
if (__DEV__) {
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

export function pushProvider(providerFiber: Fiber): void {
  index += 1;
  stack[index] = providerFiber;
  const context: ReactContext<any> = providerFiber.type.context;
  context.currentValue = providerFiber.pendingProps.value;
  context.changedBits = providerFiber.stateNode;

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

export function popProvider(providerFiber: Fiber): void {
  if (__DEV__) {
    warning(index > -1 && providerFiber === stack[index], 'Unexpected pop.');
  }
  stack[index] = null;
  index -= 1;
  const context: ReactContext<any> = providerFiber.type.context;
  if (index < 0) {
    context.currentValue = context.defaultValue;
    context.changedBits = 0;
  } else {
    const previousProviderFiber = stack[index];
    context.currentValue = previousProviderFiber.pendingProps.value;
    context.changedBits = previousProviderFiber.stateNode;
  }
}

export function resetProviderStack(): void {
  for (let i = index; i > -1; i--) {
    const providerFiber = stack[i];
    const context: ReactContext<any> = providerFiber.type.context;
    context.currentValue = context.defaultValue;
    context.changedBits = 0;
    stack[i] = null;
    if (__DEV__) {
      context._currentRenderer = null;
    }
  }
  index = -1;
}
