/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Effect, ValueKind } from "./HIR";
import { Hook } from "./Hooks";
import {
  BUILTIN_SHAPES,
  BuiltInArrayId,
  ShapeRegistry,
  addFunction,
  addObject,
} from "./ObjectShape";
import { BuiltInType, HookType, PolyType } from "./Types";

/**
 * This file exports types and defaults for JavaScript global objects.
 * A Forget `Environment` stores the GlobalRegistry and ShapeRegistry
 * used for the current project. These ultimately help Forget refine
 * its inference of types (i.e. Object vs Primitive) and effects
 * (i.e. read vs mutate) in source programs.
 */

/**
 * ShapeRegistry with default definitions for builtins and global objects.
 */
export const DEFAULT_SHAPES: ShapeRegistry = new Map(BUILTIN_SHAPES);

// Hack until we add ObjectShapes for all globals
const UNTYPED_GLOBALS: Set<string> = new Set([
  "String",
  "Object",
  "Function",
  "Number",
  "RegExp",
  "Date",
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

const TYPED_GLOBALS: Array<[string, BuiltInType]> = [
  [
    "Array",
    addObject(DEFAULT_SHAPES, "Array", [
      [
        "isArray",
        // Array.isArray(value)
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [Effect.Read],
          restParam: null,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
      // https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.from
      // Array.from(arrayLike, optionalFn, optionalThis) not added because
      // the Effect of `arrayLike` is polymorphic i.e.
      //  - Effect.read if
      //     - it does not have an @iterator property and is array-like
      //       (i.e. has a length property)
      ///    - it is an iterable object whose iterator does not mutate itself
      //  - Effect.mutate if it is a self-mutative iterator (e.g. a generator
      //    function)
      [
        "of",
        // Array.of(element0, ..., elementN)
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Object", shapeId: BuiltInArrayId },
          calleeEffect: Effect.Read,
        }),
      ],
    ]),
  ],
  [
    "Math",
    addObject(DEFAULT_SHAPES, "Math", [
      // Static properties (TODO)
      ["PI", { kind: "Primitive" }],
      // Static methods (TODO)
      [
        "max",
        // Math.max(value0, ..., valueN)
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
    ]),
  ],
  ["Infinity", { kind: "Primitive" }],
  ["NaN", { kind: "Primitive" }],
  [
    "console",
    addObject(DEFAULT_SHAPES, "console", [
      [
        "error",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
      [
        "info",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
      [
        "log",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
      [
        "table",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
      [
        "trace",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
      [
        "warn",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
        }),
      ],
    ]),
  ],
  // TODO: rest of Global objects
];

const BUILTIN_HOOKS: Array<[string, Hook]> = [
  [
    "useContext",
    {
      kind: "State",
      name: "useContext",
      effectKind: Effect.Read,
      valueKind: ValueKind.Mutable,
    },
  ],
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
  [
    "useEffect",
    {
      kind: "Memo",
      name: "useEffect",
      effectKind: Effect.Freeze,
      valueKind: ValueKind.Frozen,
    },
  ],
  [
    "useLayoutEffect",
    {
      kind: "Memo",
      name: "useLayoutEffect",
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

for (const [name, type_] of TYPED_GLOBALS) {
  DEFAULT_GLOBALS.set(name, type_);
}

// Recursive global type
DEFAULT_GLOBALS.set(
  "globalThis",
  addObject(DEFAULT_SHAPES, "globalThis", TYPED_GLOBALS)
);
