/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Patch fetch
import './ReactFetch';

export {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  Children,
  Fragment,
  Profiler,
  StrictMode,
  Suspense,
  cloneElement,
  createElement,
  createRef,
  createServerContext,
  use,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  cache,
  startTransition,
  useId,
  useCallback,
  useContext,
  useDebugValue,
  useMemo,
  version,
} from './React';
