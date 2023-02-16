/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Effect, ValueKind } from "./HIR";

export const BUILTIN_HOOKS: Map<string, Hook> = new Map([
  [
    "useState",
    {
      kind: "State",
      name: "useState",
      effectKind: Effect.Freeze,
      valueKind: ValueKind.Frozen,
    },
  ],
  [
    "useRef",
    {
      kind: "Ref",
      name: "useRef",
      effectKind: Effect.Capture,
      valueKind: ValueKind.Mutable,
    },
  ],
  [
    "useFreeze",
    {
      kind: "Ref",
      name: "useFreeze",
      effectKind: Effect.Freeze,
      valueKind: ValueKind.Frozen,
    },
  ],
  [
    "useMemo",
    {
      kind: "Memo",
      name: "useMemo",
      effectKind: Effect.Freeze,
      valueKind: ValueKind.Frozen,
    },
  ],
  [
    "useCallback",
    {
      kind: "Memo",
      name: "useCallback",
      effectKind: Effect.Freeze,
      valueKind: ValueKind.Frozen,
    },
  ],
]);

export type HookKind = "State" | "Ref" | "Custom" | "Memo";
export type Hook = {
  kind: HookKind;
  name: string;
  effectKind: Effect;
  valueKind: ValueKind;
};
