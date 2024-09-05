/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Effect, ValueKind, ValueReason} from './HIR';
import {
  BUILTIN_SHAPES,
  BuiltInArrayId,
  BuiltInMixedReadonlyId,
  BuiltInUseActionStateId,
  BuiltInUseContextHookId,
  BuiltInUseEffectHookId,
  BuiltInUseInsertionEffectHookId,
  BuiltInUseLayoutEffectHookId,
  BuiltInUseOperatorId,
  BuiltInUseReducerId,
  BuiltInUseRefId,
  BuiltInUseStateId,
  BuiltInUseTransitionId,
  ShapeRegistry,
  addFunction,
  addHook,
  addObject,
} from './ObjectShape';
import {BuiltInType, PolyType} from './Types';
import {TypeConfig} from './TypeSchema';
import {assertExhaustive} from '../Utils/utils';

/*
 * This file exports types and defaults for JavaScript global objects.
 * A Forget `Environment` stores the GlobalRegistry and ShapeRegistry
 * used for the current project. These ultimately help Forget refine
 * its inference of types (i.e. Object vs Primitive) and effects
 * (i.e. read vs mutate) in source programs.
 */

// ShapeRegistry with default definitions for builtins and global objects.
export const DEFAULT_SHAPES: ShapeRegistry = new Map(BUILTIN_SHAPES);

// Hack until we add ObjectShapes for all globals
const UNTYPED_GLOBALS: Set<string> = new Set([
  'String',
  'Object',
  'Function',
  'Number',
  'RegExp',
  'Date',
  'Error',
  'Function',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError',
  'Boolean',
  'DataView',
  'Float32Array',
  'Float64Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Map',
  'Set',
  'WeakMap',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'ArrayBuffer',
  'JSON',
  'parseFloat',
  'parseInt',
  'console',
  'isNaN',
  'eval',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
]);

const TYPED_GLOBALS: Array<[string, BuiltInType]> = [
  [
    'Array',
    addObject(DEFAULT_SHAPES, 'Array', [
      [
        'isArray',
        // Array.isArray(value)
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [Effect.Read],
          restParam: null,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      /*
       * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.from
       * Array.from(arrayLike, optionalFn, optionalThis) not added because
       * the Effect of `arrayLike` is polymorphic i.e.
       *  - Effect.read if
       *     - it does not have an @iterator property and is array-like
       *       (i.e. has a length property)
       *    - it is an iterable object whose iterator does not mutate itself
       *  - Effect.mutate if it is a self-mutative iterator (e.g. a generator
       *    function)
       */
      [
        'of',
        // Array.of(element0, ..., elementN)
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Object', shapeId: BuiltInArrayId},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Mutable,
        }),
      ],
    ]),
  ],
  [
    'Math',
    addObject(DEFAULT_SHAPES, 'Math', [
      // Static properties (TODO)
      ['PI', {kind: 'Primitive'}],
      // Static methods (TODO)
      [
        'max',
        // Math.max(value0, ..., valueN)
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'min',
        // Math.min(value0, ..., valueN)
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'trunc',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'ceil',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'floor',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'pow',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
    ]),
  ],
  ['Infinity', {kind: 'Primitive'}],
  ['NaN', {kind: 'Primitive'}],
  [
    'console',
    addObject(DEFAULT_SHAPES, 'console', [
      [
        'error',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'info',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'log',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'table',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'trace',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
      [
        'warn',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Read,
          returnType: {kind: 'Primitive'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Primitive,
        }),
      ],
    ]),
  ],
  [
    'Boolean',
    addFunction(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  [
    'Number',
    addFunction(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  [
    'String',
    addFunction(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  // TODO: rest of Global objects
];

/*
 * TODO(mofeiZ): We currently only store rest param effects for hooks.
 * now that FeatureFlag `enableTreatHooksAsFunctions` is removed we can
 * use positional params too (?)
 */
const REACT_APIS: Array<[string, BuiltInType]> = [
  [
    'useContext',
    addHook(
      DEFAULT_SHAPES,
      {
        positionalParams: [],
        restParam: Effect.Read,
        returnType: {kind: 'Poly'},
        calleeEffect: Effect.Read,
        hookKind: 'useContext',
        returnValueKind: ValueKind.Frozen,
        returnValueReason: ValueReason.Context,
      },
      BuiltInUseContextHookId,
    ),
  ],
  [
    'useState',
    addHook(DEFAULT_SHAPES, {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: {kind: 'Object', shapeId: BuiltInUseStateId},
      calleeEffect: Effect.Read,
      hookKind: 'useState',
      returnValueKind: ValueKind.Frozen,
      returnValueReason: ValueReason.State,
    }),
  ],
  [
    'useActionState',
    addHook(DEFAULT_SHAPES, {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: {kind: 'Object', shapeId: BuiltInUseActionStateId},
      calleeEffect: Effect.Read,
      hookKind: 'useActionState',
      returnValueKind: ValueKind.Frozen,
      returnValueReason: ValueReason.State,
    }),
  ],
  [
    'useReducer',
    addHook(DEFAULT_SHAPES, {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: {kind: 'Object', shapeId: BuiltInUseReducerId},
      calleeEffect: Effect.Read,
      hookKind: 'useReducer',
      returnValueKind: ValueKind.Frozen,
      returnValueReason: ValueReason.ReducerState,
    }),
  ],
  [
    'useRef',
    addHook(DEFAULT_SHAPES, {
      positionalParams: [],
      restParam: Effect.Capture,
      returnType: {kind: 'Object', shapeId: BuiltInUseRefId},
      calleeEffect: Effect.Read,
      hookKind: 'useRef',
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    'useMemo',
    addHook(DEFAULT_SHAPES, {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: {kind: 'Poly'},
      calleeEffect: Effect.Read,
      hookKind: 'useMemo',
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    'useCallback',
    addHook(DEFAULT_SHAPES, {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: {kind: 'Poly'},
      calleeEffect: Effect.Read,
      hookKind: 'useCallback',
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    'useEffect',
    addHook(
      DEFAULT_SHAPES,
      {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: {kind: 'Primitive'},
        calleeEffect: Effect.Read,
        hookKind: 'useEffect',
        returnValueKind: ValueKind.Frozen,
      },
      BuiltInUseEffectHookId,
    ),
  ],
  [
    'useLayoutEffect',
    addHook(
      DEFAULT_SHAPES,
      {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: {kind: 'Poly'},
        calleeEffect: Effect.Read,
        hookKind: 'useLayoutEffect',
        returnValueKind: ValueKind.Frozen,
      },
      BuiltInUseLayoutEffectHookId,
    ),
  ],
  [
    'useInsertionEffect',
    addHook(
      DEFAULT_SHAPES,
      {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: {kind: 'Poly'},
        calleeEffect: Effect.Read,
        hookKind: 'useInsertionEffect',
        returnValueKind: ValueKind.Frozen,
      },
      BuiltInUseInsertionEffectHookId,
    ),
  ],
  [
    'useTransition',
    addHook(DEFAULT_SHAPES, {
      positionalParams: [],
      restParam: null,
      returnType: {kind: 'Object', shapeId: BuiltInUseTransitionId},
      calleeEffect: Effect.Read,
      hookKind: 'useTransition',
      returnValueKind: ValueKind.Frozen,
    }),
  ],
  [
    'use',
    addFunction(
      DEFAULT_SHAPES,
      [],
      {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: {kind: 'Poly'},
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Frozen,
      },
      BuiltInUseOperatorId,
    ),
  ],
];

TYPED_GLOBALS.push(
  [
    'React',
    addObject(DEFAULT_SHAPES, null, [
      ...REACT_APIS,
      [
        'createElement',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Freeze,
          returnType: {kind: 'Poly'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Frozen,
        }),
      ],
      [
        'cloneElement',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Freeze,
          returnType: {kind: 'Poly'},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Frozen,
        }),
      ],
      [
        'createRef',
        addFunction(DEFAULT_SHAPES, [], {
          positionalParams: [],
          restParam: Effect.Capture, // createRef takes no paramters
          returnType: {kind: 'Object', shapeId: BuiltInUseRefId},
          calleeEffect: Effect.Read,
          returnValueKind: ValueKind.Mutable,
        }),
      ],
    ]),
  ],
  [
    '_jsx',
    addFunction(DEFAULT_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Freeze,
      returnType: {kind: 'Poly'},
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Frozen,
    }),
  ],
);

export type Global = BuiltInType | PolyType;
export type GlobalRegistry = Map<string, Global>;
export const DEFAULT_GLOBALS: GlobalRegistry = new Map(REACT_APIS);

// Hack until we add ObjectShapes for all globals
for (const name of UNTYPED_GLOBALS) {
  DEFAULT_GLOBALS.set(name, {
    kind: 'Poly',
  });
}

for (const [name, type_] of TYPED_GLOBALS) {
  DEFAULT_GLOBALS.set(name, type_);
}

// Recursive global types
DEFAULT_GLOBALS.set(
  'globalThis',
  addObject(DEFAULT_SHAPES, 'globalThis', TYPED_GLOBALS),
);
DEFAULT_GLOBALS.set(
  'global',
  addObject(DEFAULT_SHAPES, 'global', TYPED_GLOBALS),
);

export function installTypeConfig(
  globals: GlobalRegistry,
  shapes: ShapeRegistry,
  typeConfig: TypeConfig,
): Global {
  switch (typeConfig.kind) {
    case 'type': {
      switch (typeConfig.name) {
        case 'Array': {
          return {kind: 'Object', shapeId: BuiltInArrayId};
        }
        case 'MixedReadonly': {
          return {kind: 'Object', shapeId: BuiltInMixedReadonlyId};
        }
        case 'Primitive': {
          return {kind: 'Primitive'};
        }
        case 'Ref': {
          return {kind: 'Object', shapeId: BuiltInUseRefId};
        }
        case 'Any': {
          return {kind: 'Poly'};
        }
        default: {
          assertExhaustive(
            typeConfig.name,
            `Unexpected type '${(typeConfig as any).name}'`,
          );
        }
      }
    }
    case 'function': {
      return addFunction(shapes, [], {
        positionalParams: typeConfig.positionalParams,
        restParam: typeConfig.restParam,
        calleeEffect: typeConfig.calleeEffect,
        returnType: installTypeConfig(globals, shapes, typeConfig.returnType),
        returnValueKind: typeConfig.returnValueKind,
        noAlias: typeConfig.noAlias === true,
        mutableOnlyIfOperandsAreMutable:
          typeConfig.mutableOnlyIfOperandsAreMutable === true,
      });
    }
    case 'hook': {
      return addHook(shapes, {
        hookKind: 'Custom',
        positionalParams: typeConfig.positionalParams ?? [],
        restParam: typeConfig.restParam ?? Effect.Freeze,
        calleeEffect: Effect.Read,
        returnType: installTypeConfig(globals, shapes, typeConfig.returnType),
        returnValueKind: typeConfig.returnValueKind ?? ValueKind.Frozen,
        noAlias: typeConfig.noAlias === true,
      });
    }
    case 'object': {
      return addObject(
        shapes,
        null,
        Object.entries(typeConfig.properties ?? {}).map(([key, value]) => [
          key,
          installTypeConfig(globals, shapes, value),
        ]),
      );
    }
    default: {
      assertExhaustive(
        typeConfig,
        `Unexpected type kind '${(typeConfig as any).kind}'`,
      );
    }
  }
}

export function installReAnimatedTypes(
  globals: GlobalRegistry,
  registry: ShapeRegistry,
): void {
  // hooks that freeze args and return frozen value
  const frozenHooks = [
    'useFrameCallback',
    'useAnimatedStyle',
    'useAnimatedProps',
    'useAnimatedScrollHandler',
    'useAnimatedReaction',
    'useWorkletCallback',
  ];
  for (const hook of frozenHooks) {
    globals.set(
      hook,
      addHook(registry, {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: {kind: 'Poly'},
        returnValueKind: ValueKind.Frozen,
        noAlias: true,
        calleeEffect: Effect.Read,
        hookKind: 'Custom',
      }),
    );
  }

  /**
   * hooks that return a mutable value. ideally these should be modelled as a
   * ref, but this works for now.
   */
  const mutableHooks = ['useSharedValue', 'useDerivedValue'];
  for (const hook of mutableHooks) {
    globals.set(
      hook,
      addHook(registry, {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: {kind: 'Poly'},
        returnValueKind: ValueKind.Mutable,
        noAlias: true,
        calleeEffect: Effect.Read,
        hookKind: 'Custom',
      }),
    );
  }

  // functions that return mutable value
  const funcs = [
    'withTiming',
    'withSpring',
    'createAnimatedPropAdapter',
    'withDecay',
    'withRepeat',
    'runOnUI',
    'executeOnUIRuntimeSync',
  ];
  for (const fn of funcs) {
    globals.set(
      fn,
      addFunction(registry, [], {
        positionalParams: [],
        restParam: Effect.Read,
        returnType: {kind: 'Poly'},
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Mutable,
        noAlias: true,
      }),
    );
  }
}
