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

export function pushProvider(providerFiber: Fiber): void {
  index += 1;
  stack[index] = providerFiber;
}

export function popProvider(providerFiber: Fiber): void {
  if (__DEV__) {
    warning(index > -1 && providerFiber === stack[index], 'Unexpected pop.');
  }
  stack[index] = null;
  index -= 1;
}

// Find the nearest matching provider
export function getProvider<T>(context: ReactContext<T>): Fiber | null {
  for (let i = index; i > -1; i--) {
    const provider = stack[i];
    if (provider.type.context === context) {
      return provider;
    }
  }
  return null;
}

export function resetProviderStack(): void {
  for (let i = index; i > -1; i--) {
    stack[i] = null;
  }
}
