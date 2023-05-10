/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  PrefetchDNSOptions,
  PreconnectOptions,
  PreloadOptions,
  PreinitOptions,
} from 'react-dom/src/ReactDOMDispatcher';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;

import {ReactDOMFlightServerDispatcher} from './ReactDOMFlightServerHostDispatcher';

export function prepareHostDispatcher(): void {
  ReactDOMCurrentDispatcher.current = ReactDOMFlightServerDispatcher;
}

// Used to distinguish these contexts from ones used in other renderers.
// E.g. this can be used to distinguish legacy renderers from this modern one.
export const isPrimaryRenderer = true;

export type HintModel =
  | string
  | [
      string,
      PrefetchDNSOptions | PreconnectOptions | PreloadOptions | PreinitOptions,
    ];

export type Hints = Set<string>;

export function createHints(): Hints {
  return new Set();
}
