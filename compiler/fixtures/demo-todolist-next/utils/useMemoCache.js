/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef } from "react";

const REACT_MEMOCACHE_SENTINEL = Symbol.for('react.memocache_sentinel');

export function useMemoCache(i) {
  const $ = new Array(i).fill(REACT_MEMOCACHE_SENTINEL)
  $._ = REACT_MEMOCACHE_SENTINEL
  const ref = useRef($);
  return ref.current;
};
