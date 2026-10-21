/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Hints,
  HintCode,
  HintModel,
} from 'react-server/src/ReactFlightServerConfig';

export type Hint = {+code: HintCode, +model: HintModel<any>};

// The render-scoped state Server Components observe while they execute:
// cache(), cacheSignal(), useId() and resource hints. A stream request owns
// one of these today. It is separate from the request so that a render whose
// output is consumed more than once can share it across the consumers.
export type RenderContext = {
  cache: Map<Function, mixed>,
  cacheController: AbortController,
  hints: Hints,
  hintQueue: Array<Hint>,
  hintListeners: Array<(hint: Hint) => void>,
  identifierPrefix: string,
  identifierCount: number,
};

export function createRenderContext(
  hints: Hints,
  identifierPrefix: void | string,
): RenderContext {
  return {
    cache: new Map(),
    cacheController: new AbortController(),
    hints,
    hintQueue: [],
    hintListeners: [],
    identifierPrefix: identifierPrefix || '',
    identifierCount: 1,
  };
}

export function emitHint<Code: HintCode>(
  context: RenderContext,
  code: Code,
  model: HintModel<Code>,
): void {
  const hint: Hint = {code, model};
  context.hintQueue.push(hint);
  const listeners = context.hintListeners;
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](hint);
  }
}

// Delivers hints already emitted, then every later one, in order.
export function subscribeToHints(
  context: RenderContext,
  listener: (hint: Hint) => void,
): () => void {
  const queue = context.hintQueue;
  for (let i = 0; i < queue.length; i++) {
    listener(queue[i]);
  }
  const listeners = context.hintListeners;
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}
