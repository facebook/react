/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef } from "react";

const placeholder = NaN;

export function useMemoCache(i) {
  const ref = useRef(new Array(i).fill(placeholder));
  return ref.current;
}
