/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Effect, ValueKind } from "./HIR";
import {
  BUILTIN_SHAPES,
  BuiltInArrayId,
  BuiltInUseRefId,
  BuiltInUseStateId,
  ShapeRegistry,
  addFunction,
  addHook,
  addObject,
} from "./ObjectShape";
import { BuiltInType, PolyType } from "./Types";

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
          returnValueKind: ValueKind.Immutable,
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
          returnValueKind: ValueKind.Mutable,
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
          returnValueKind: ValueKind.Immutable,
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
          returnValueKind: ValueKind.Immutable,
        }),
      ],
      [
        "info",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Immutable,
        }),
      ],
      [
        "log",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Immutable,
        }),
      ],
      [
        "table",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Immutable,
        }),
      ],
      [
        "trace",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Immutable,
        }),
      ],
      [
        "warn",
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: { kind: "Primitive" },
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Immutable,
        }),
      ],
    ]),
  ],
  [
    "Boolean",
    addFunction(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: { kind: "Primitive" },
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Immutable,
    }),
  ],
  [
    "Number",
    addFunction(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: { kind: "Primitive" },
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Immutable,
    }),
  ],
  [
    "String",
    addFunction(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: { kind: "Primitive" },
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Immutable,
    }),
  ],
  // TODO: rest of Global objects
];

// TODO(mofeiZ): We currently only store rest param effects for hooks.
// now that FeatureFlag `enableTreatHooksAsFunctions` is removed we can
// use positional params too (?)
const BUILTIN_HOOKS: Array<[string, BuiltInType]> = [
  [
    "useContext",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: { kind: "Poly" },
      calleeEffect: Effect.Read,
      hookKind: "useContext",
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    "useState",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: { kind: "Object", shapeId: BuiltInUseStateId },
      calleeEffect: Effect.Read,
      hookKind: "useState",
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    "useRef",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Capture,
      returnType: { kind: "Object", shapeId: BuiltInUseRefId },
      calleeEffect: Effect.Read,
      hookKind: "useRef",
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    "useMemo",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: { kind: "Poly" },
      calleeEffect: Effect.Read,
      hookKind: "useMemo",
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    "useCallback",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: { kind: "Poly" },
      calleeEffect: Effect.Read,
      hookKind: "useCallback",
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    "useEffect",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: { kind: "Poly" },
      calleeEffect: Effect.Read,
      hookKind: "useEffect",
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    "useLayoutEffect",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: { kind: "Poly" },
      calleeEffect: Effect.Read,
      hookKind: "useLayoutEffect",
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    "useInsertionEffect",
    addHook(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: { kind: "Poly" },
      calleeEffect: Effect.Read,
      hookKind: "useLayoutEffect",
      returnValueKind: ValueKind.Frozen,
    }),
  ],
];

TYPED_GLOBALS.push([
  "React",
  addObject(DEFAULT_SHAPES, null, [
    ...BUILTIN_HOOKS,
    [
      "createElement",
      addFunction(DEFAULT_SHAPES, [], {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: { kind: "Poly" },
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Frozen,
      }),
    ],
    [
      "cloneElement",
      addFunction(DEFAULT_SHAPES, [], {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: { kind: "Poly" },
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Frozen,
      }),
    ],
    [
      "createRef",
      addFunction(DEFAULT_SHAPES, [], {
        positionalParams: [],
        restParam: Effect.Capture, // createRef takes no paramters
        returnType: { kind: "Object", shapeId: BuiltInUseRefId },
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Mutable,
      }),
    ],
  ]),
]);

export type Global = BuiltInType | PolyType;
export type GlobalRegistry = Map<string, Global>;
export const DEFAULT_GLOBALS: GlobalRegistry = new Map(BUILTIN_HOOKS);

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
