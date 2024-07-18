/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {default as __SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE} from './ReactSharedInternalsServer';

import {forEach, map, count, toArray, only} from './ReactChildren';
import {
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
} from 'shared/ReactSymbols';
import {
  cloneElement,
  createElement,
  isValidElement,
} from './jsx/ReactJSXElement';
import {createRef} from './ReactCreateRef';
import {use, useId, useCallback, useDebugValue, useMemo} from './ReactHooks';
import {forwardRef} from './ReactForwardRef';
import {lazy} from './ReactLazy';
import {memo} from './ReactMemo';
import {cache} from './ReactCacheServer';
import version from 'shared/ReactVersion';

const Children = {
  map,
  forEach,
  count,
  toArray,
  only,
};

export {
  Children,
  REACT_FRAGMENT_TYPE as Fragment,
  REACT_PROFILER_TYPE as Profiler,
  REACT_STRICT_MODE_TYPE as StrictMode,
  REACT_SUSPENSE_TYPE as Suspense,
  cloneElement,
  createElement,
  createRef,
  use,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  cache,
  useId,
  useCallback,
  useDebugValue,
  useMemo,
  version,
};
