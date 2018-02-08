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

let inProgressContexts: Set<ReactContext<mixed>> | null = null;

let rendererSigil;
if (__DEV__) {
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

export function pushProvider(providerFiber: Fiber): void {
  const context: ReactContext<any> = providerFiber.type.context;
  if (__DEV__) {
    warning(
      context._currentRenderer === null ||
        context._currentRenderer === rendererSigil,
      'Detected multiple renderers concurrently rendering the ' +
        'same context provider. This is currently unsupported.',
    );
    context._currentRenderer = rendererSigil;
  }
  if (inProgressContexts === null) {
    inProgressContexts = new Set([context]);
  } else {
    inProgressContexts.add(context);
  }
  const previous = context.current;
  context.current = {
    previous: previous,
    fiber: providerFiber,
  };
}

export function popProvider(providerFiber: Fiber): void {
  const context: ReactContext<any> = providerFiber.type.context;
  const current = context.current;
  if (__DEV__) {
    warning(
      context.current !== null && context.current.fiber === providerFiber,
      'Unexpected pop.',
    );
  }
  context.current = current.previous;
}

export function resetProviderStack(): void {
  if (inProgressContexts !== null) {
    inProgressContexts.forEach(context => {
      context.current = null;
    });
    inProgressContexts = null;
  }
}
