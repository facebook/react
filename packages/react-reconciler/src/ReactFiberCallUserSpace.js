/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent} from 'react/src/ReactLazy';

import {setIsRendering} from './ReactCurrentFiber';

// These indirections exists so we can exclude its stack frame in DEV (and anything below it).
// TODO: Consider marking the whole bundle instead of these boundaries.

/** @noinline */
export function callComponentInDEV<Props, Arg, R>(
  Component: (p: Props, arg: Arg) => R,
  props: Props,
  secondArg: Arg,
): R {
  setIsRendering(true);
  const result = Component(props, secondArg);
  setIsRendering(false);
  return result;
}

interface ClassInstance<R> {
  render(): R;
}

/** @noinline */
export function callRenderInDEV<R>(instance: ClassInstance<R>): R {
  setIsRendering(true);
  const result = instance.render();
  setIsRendering(false);
  return result;
}

/** @noinline */
export function callLazyInitInDEV(lazy: LazyComponent<any, any>): any {
  const payload = lazy._payload;
  const init = lazy._init;
  return init(payload);
}
