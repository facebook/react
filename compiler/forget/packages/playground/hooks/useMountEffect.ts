/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { EffectCallback } from "react";
import { useEffect } from "react";

export default function useMountEffect(effect: EffectCallback) {
  return useEffect(effect, []);
}
