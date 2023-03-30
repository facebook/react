/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Effect, ValueKind } from "./HIR";

export type HookKind = "State" | "Ref" | "Custom" | "Memo";
export type Hook = {
  kind: HookKind;
  name: string;
  effectKind: Effect;
  valueKind: ValueKind;
};
