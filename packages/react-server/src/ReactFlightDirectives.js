/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Directive} from './ReactFlightServerConfig';
import {
  supportsRequestStorage,
  requestStorage,
} from './ReactFlightServerConfig';

export function resolveDirectives(): null | Array<Directive> {
  if (currentDirectives) return currentDirectives;
  if (supportsRequestStorage) {
    const store = requestStorage.getStore();
    if (store) return store.directives;
  }
  // If we do not have a store with directives we can't resolve them.
  // Callers need to handle cases where directives are unavailable
  return null;
}

let currentDirectives: null | Array<Directive> = null;

export function setCurrentDirectives(
  directives: null | Array<Directive>,
): null | Array<Directive> {
  currentDirectives = directives;
  return currentDirectives;
}

export function getCurrentDirectives(): null | Array<Directive> {
  return currentDirectives;
}
