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

const NO_SCOPE = /*         */ 0b000000;
const NOSCRIPT_SCOPE = /*   */ 0b000001;
const PICTURE_SCOPE = /*    */ 0b000010;

export opaque type FormatContext = number;

export function createRootFormatContext(): FormatContext {
  return NO_SCOPE;
}

function processImg(props: Object, formatContext: FormatContext): void {}

function processLink(props: Object, formatContext: FormatContext): void {}

export function getChildFormatContext(
  parentContext: FormatContext,
  type: string,
  props: Object,
): FormatContext {
  switch (type) {
    case 'img':
      processImg(props, parentContext);
      return parentContext;
    case 'link':
      processLink(props, parentContext);
      return parentContext;
    case 'picture':
      return parentContext | PICTURE_SCOPE;
    case 'noscript':
      return parentContext | NOSCRIPT_SCOPE;
    default:
      return parentContext;
  }
}
