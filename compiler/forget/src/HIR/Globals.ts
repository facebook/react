/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Effect, ValueKind } from "./HIR";
import { Hook } from "./Hooks";
import { BuiltInType, HookType, PolyType } from "./Types";

// Hack until we add ObjectShapes for all globals
const UNTYPED_GLOBALS: Set<string> = new Set([
  "String",
  "Object",
  "Function",
  "Array",
  "Number",
  "RegExp",
  "Date",
  "Math",
  "Error",
  "Function",
  "TypeError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "URIError",
  "EvalError",
  "Boolean",
  "DataView",
  "Float32Array",
  "Float64Array",
  "Int8Array",
  "Int16Array",
  "Int32Array",
  "Map",
  "Set",
  "WeakMap",
  "Uint8Array",
  "Uint8ClampedArray",
  "Uint16Array",
  "Uint32Array",
  "ArrayBuffer",
  "JSON",
  "parseFloat",
  "parseInt",
  "console",
  "isNaN",
  "eval",
  "isFinite",
  "encodeURI",
  "decodeURI",
  "encodeURIComponent",
  "decodeURIComponent",
]);

const BUILTIN_HOOKS: Array<[string, Hook]> = [
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
];

export type Global = BuiltInType | HookType | PolyType;
export type GlobalRegistry = Map<string, Global>;
export const DEFAULT_GLOBALS: GlobalRegistry = new Map(
  BUILTIN_HOOKS.map(([hookName, hook]) => {
    return [
      hookName,
      {
        kind: "Hook",
        definition: hook,
      },
    ];
  })
);

// Hack until we add ObjectShapes for all globals
for (const name of UNTYPED_GLOBALS) {
  DEFAULT_GLOBALS.set(name, {
    kind: "Poly",
  });
}
