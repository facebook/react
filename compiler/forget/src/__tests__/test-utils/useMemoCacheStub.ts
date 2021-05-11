/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef } from "react";

const REACT_MEMOCACHE_SENTINEL = Symbol.for("react.memocache_sentinel");

/**
 * Stub for `React.useMemoCache` used in E2E tests until we have a React
 * version that supports it.
 *
 * @param i Cache size
 * @returns Memo cache
 */
export function useMemoCacheStub(i: number) {
  "use no forget";
  const $ = new Array(i).fill(REACT_MEMOCACHE_SENTINEL);
  // @ts-ignore
  $._ = REACT_MEMOCACHE_SENTINEL;
  const ref = useRef($);
  return ref.current;
}
