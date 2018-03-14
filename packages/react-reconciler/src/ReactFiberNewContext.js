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

let changedBitsStack: Array<any> = [];
let currentValueStack: Array<any> = [];
let stack: Array<Fiber> = [];
let index = -1;

let rendererSigil;
if (__DEV__) {
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

export function pushProvider(providerFiber: Fiber): void {
  const context: ReactContext<any> = providerFiber.type.context;
  index += 1;
  changedBitsStack[index] = context._changedBits;
  currentValueStack[index] = context._currentValue;
  stack[index] = providerFiber;
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

export function popProvider(providerFiber: Fiber): void {
  if (__DEV__) {
    warning(index > -1 && providerFiber === stack[index], 'Unexpected pop.');
  }
  const changedBits = changedBitsStack[index];
  const currentValue = currentValueStack[index];
  changedBitsStack[index] = null;
  currentValueStack[index] = null;
  stack[index] = null;
  index -= 1;
  const context: ReactContext<any> = providerFiber.type.context;
  context._currentValue = currentValue;
  context._changedBits = changedBits;
}

export function resetProviderStack(): void {
  for (let i = index; i > -1; i--) {
    const providerFiber = stack[i];
    const context: ReactContext<any> = providerFiber.type.context;
    context._currentValue = context._defaultValue;
    context._changedBits = 0;
    changedBitsStack[i] = null;
    currentValueStack[i] = null;
    stack[i] = null;
    if (__DEV__) {
      context._currentRenderer = null;
    }
  }
  index = -1;
}
