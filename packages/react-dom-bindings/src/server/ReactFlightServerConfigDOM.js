/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  CrossOriginEnum,
  PreloadImplOptions,
  PreloadModuleImplOptions,
  PreinitStyleOptions,
  PreinitScriptOptions,
  PreinitModuleScriptOptions,
} from 'react-dom/src/shared/ReactDOMTypes';

// This module registers the host dispatcher so it needs to be imported
// but it does not have any exports
import './ReactDOMFlightServerHostDispatcher';

// We use zero to represent the absence of an explicit precedence because it is
// small, smaller than how we encode undefined, and is unambiguous. We could use
// a different tuple structure to encode this instead but this makes the runtime
// cost cheaper by eliminating a type checks in more positions.
type UnspecifiedPrecedence = 0;

// prettier-ignore
type TypeMap = {
  // prefetchDNS(href)
  'D': /* href */ string,
  // preconnect(href, options)
  'C':
    | /* href */ string
    | [/* href */ string, CrossOriginEnum],
  // preconnect(href, options)
  'L':
    | [/* href */ string, /* as */ string]
    | [/* href */ string, /* as */ string, PreloadImplOptions],
  'm':
    | /* href */ string
    | [/* href */ string, PreloadModuleImplOptions],
  'S':
    | /* href */ string
    | [/* href */ string, /* precedence */ string]
    | [/* href */ string, /* precedence */ string | UnspecifiedPrecedence, PreinitStyleOptions],
  'X':
    | /* href */ string
    | [/* href */ string, PreinitScriptOptions],
  'M':
    | /* href */ string
    | [/* href */ string, PreinitModuleScriptOptions],
}

export type HintCode = $Keys<TypeMap>;
export type HintModel<T: HintCode> = TypeMap[T];

export type Hints = Set<string>;

export function createHints(): Hints {
  return new Set();
}
