/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {Effect, ValueKind, ValueReason} from './HIR';
import {
  BuiltInType,
  FunctionType,
  ObjectType,
  PolyType,
  PrimitiveType,
} from './Types';

/*
 * This file exports types and defaults for JavaScript object shapes. These are
 * stored and used by a Forget `Environment`. See comments in `Types.ts`,
 * `Globals.ts`, and `Environment.ts` for more details.
 */

const PRIMITIVE_TYPE: PrimitiveType = {
  kind: 'Primitive',
};

let nextAnonId = 0;
/*
 * We currently use strings for anonymous ShapeIds since they are easily
 * debuggable, even though `Symbol()` might be more performant
 */
function createAnonId(): string {
  return `<generated_${nextAnonId++}>`;
}

/*
 * Add a non-hook function to an existing ShapeRegistry.
 *
 * @returns a {@link FunctionType} representing the added function.
 */
export function addFunction(
  registry: ShapeRegistry,
  properties: Iterable<[string, BuiltInType | PolyType]>,
  fn: Omit<FunctionSignature, 'hookKind'>,
  id: string | null = null,
): FunctionType {
  const shapeId = id ?? createAnonId();
  addShape(registry, shapeId, properties, {
    ...fn,
    hookKind: null,
  });
  return {
    kind: 'Function',
    return: fn.returnType,
    shapeId,
  };
}

/*
 * Add a hook to an existing ShapeRegistry.
 *
 * @returns a {@link FunctionType} representing the added hook function.
 */
export function addHook(
  registry: ShapeRegistry,
  fn: FunctionSignature & {hookKind: HookKind},
  id: string | null = null,
): FunctionType {
  const shapeId = id ?? createAnonId();
  addShape(registry, shapeId, [], fn);
  return {
    kind: 'Function',
    return: fn.returnType,
    shapeId,
  };
}

/*
 * Add an object to an existing ShapeRegistry.
 *
 * @returns an {@link ObjectType} representing the added object.
 */
export function addObject(
  registry: ShapeRegistry,
  id: string | null,
  properties: Iterable<[string, BuiltInType | PolyType]>,
): ObjectType {
  const shapeId = id ?? createAnonId();
  addShape(registry, shapeId, properties, null);
  return {
    kind: 'Object',
    shapeId,
  };
}

function addShape(
  registry: ShapeRegistry,
  id: string,
  properties: Iterable<[string, BuiltInType | PolyType]>,
  functionType: FunctionSignature | null,
): ObjectShape {
  const shape: ObjectShape = {
    properties: new Map(properties),
    functionType,
  };

  CompilerError.invariant(!registry.has(id), {
    reason: `[ObjectShape] Could not add shape to registry: name ${id} already exists.`,
    description: null,
    loc: null,
    suggestions: null,
  });
  registry.set(id, shape);
  return shape;
}

export type HookKind =
  | 'useContext'
  | 'useState'
  | 'useActionState'
  | 'useReducer'
  | 'useRef'
  | 'useEffect'
  | 'useLayoutEffect'
  | 'useInsertionEffect'
  | 'useMemo'
  | 'useCallback'
  | 'useTransition'
  | 'Custom';

/*
 * Call signature of a function, used for type and effect inference.
 *
 * Note: Param type is not recorded since it currently does not affect inference.
 * Specifically, we currently do not:
 *   - infer types based on their usage in argument position
 *   - handle inference for overloaded / generic functions
 */
export type FunctionSignature = {
  positionalParams: Array<Effect>;
  restParam: Effect | null;
  returnType: BuiltInType | PolyType;
  returnValueKind: ValueKind;

  /**
   * For functions that return frozen/immutable values, the reason provides a more
   * precise error message for any (invalid) mutations of the value.
   */
  returnValueReason?: ValueReason;

  calleeEffect: Effect;
  hookKind: HookKind | null;
  /*
   * Whether any of the parameters may be aliased by each other or the return
   * value. Defaults to false (parameters may alias). When true, the compiler
   * may choose not to memoize arguments if they do not otherwise escape.
   */
  noAlias?: boolean;

  /**
   * Supported only for methods (no-op when used on functions in CallExpression.callee position).
   *
   * Indicates that the method can only modify its receiver if any of the arguments
   * are mutable or are function expressions which mutate their arguments. This is designed
   * for methods such as Array.prototype.map(), which only mutate the receiver array if they are
   * passed a callback which has mutable side-effects (including mutating its inputs).
   *
   * MethodCalls to such functions will use a different behavior depending on their arguments:
   * - If arguments are all non-mutable, the arguments get the Read effect and the receiver is Capture.
   * - Else uses the effects specified by this signature.
   */
  mutableOnlyIfOperandsAreMutable?: boolean;
};

/*
 * Shape of an {@link FunctionType} if {@link ObjectShape.functionType} is present,
 * or {@link ObjectType} otherwise.
 *
 * Constructors (e.g. the global `Array` object) and other functions (e.g. `Math.min`)
 * are both represented by {@link ObjectShape.functionType}.
 */
export type ObjectShape = {
  properties: Map<string, BuiltInType | PolyType>;
  functionType: FunctionSignature | null;
};

/*
 * Every valid ShapeRegistry must contain ObjectShape definitions for
 * {@link BuiltInArrayId} and {@link BuiltInObjectId}, since these are the
 * the inferred types for [] and {}.
 */
export type ShapeRegistry = Map<string, ObjectShape>;
export const BuiltInPropsId = 'BuiltInProps';
export const BuiltInArrayId = 'BuiltInArray';
export const BuiltInFunctionId = 'BuiltInFunction';
export const BuiltInJsxId = 'BuiltInJsx';
export const BuiltInObjectId = 'BuiltInObject';
export const BuiltInUseStateId = 'BuiltInUseState';
export const BuiltInSetStateId = 'BuiltInSetState';
export const BuiltInUseActionStateId = 'BuiltInUseActionState';
export const BuiltInSetActionStateId = 'BuiltInSetActionState';
export const BuiltInUseRefId = 'BuiltInUseRefId';
export const BuiltInRefValueId = 'BuiltInRefValue';
export const BuiltInMixedReadonlyId = 'BuiltInMixedReadonly';
export const BuiltInUseEffectHookId = 'BuiltInUseEffectHook';
export const BuiltInUseLayoutEffectHookId = 'BuiltInUseLayoutEffectHook';
export const BuiltInUseInsertionEffectHookId = 'BuiltInUseInsertionEffectHook';
export const BuiltInUseOperatorId = 'BuiltInUseOperator';
export const BuiltInUseReducerId = 'BuiltInUseReducer';
export const BuiltInDispatchId = 'BuiltInDispatch';
export const BuiltInUseContextHookId = 'BuiltInUseContextHook';
export const BuiltInUseTransitionId = 'BuiltInUseTransition';
export const BuiltInStartTransitionId = 'BuiltInStartTransition';

// ShapeRegistry with default definitions for built-ins.
export const BUILTIN_SHAPES: ShapeRegistry = new Map();

// If the `ref` prop exists, it has the ref type
addObject(BUILTIN_SHAPES, BuiltInPropsId, [
  ['ref', {kind: 'Object', shapeId: BuiltInUseRefId}],
]);

/* Built-in array shape */
addObject(BUILTIN_SHAPES, BuiltInArrayId, [
  [
    'indexOf',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  [
    'includes',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  [
    'pop',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: null,
      returnType: {kind: 'Poly'},
      calleeEffect: Effect.Store,
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    'at',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [Effect.Read],
      restParam: null,
      returnType: {kind: 'Poly'},
      calleeEffect: Effect.Capture,
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    'concat',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Capture,
      returnType: {
        kind: 'Object',
        shapeId: BuiltInArrayId,
      },
      calleeEffect: Effect.Capture,
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  ['length', PRIMITIVE_TYPE],
  [
    'push',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Capture,
      returnType: PRIMITIVE_TYPE,
      calleeEffect: Effect.Store,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  [
    'slice',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {
        kind: 'Object',
        shapeId: BuiltInArrayId,
      },
      calleeEffect: Effect.Capture,
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    'map',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Object', shapeId: BuiltInArrayId},
      /*
       * callee is ConditionallyMutate because items of the array
       * flow into the lambda and may be mutated there, even though
       * the array object itself is not modified
       */
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Mutable,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'filter',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Object', shapeId: BuiltInArrayId},
      /*
       * callee is ConditionallyMutate because items of the array
       * flow into the lambda and may be mutated there, even though
       * the array object itself is not modified
       */
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Mutable,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'every',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Primitive'},
      /*
       * callee is ConditionallyMutate because items of the array
       * flow into the lambda and may be mutated there, even though
       * the array object itself is not modified
       */
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Primitive,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'some',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Primitive'},
      /*
       * callee is ConditionallyMutate because items of the array
       * flow into the lambda and may be mutated there, even though
       * the array object itself is not modified
       */
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Primitive,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'find',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Poly'},
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Mutable,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'findIndex',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Primitive'},
      /*
       * callee is ConditionallyMutate because items of the array
       * flow into the lambda and may be mutated there, even though
       * the array object itself is not modified
       */
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Primitive,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'join',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: PRIMITIVE_TYPE,
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  // TODO: rest of Array properties
]);

/* Built-in Object shape */
addObject(BUILTIN_SHAPES, BuiltInObjectId, [
  [
    'toString',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: null,
      returnType: PRIMITIVE_TYPE,
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  /*
   * TODO:
   * hasOwnProperty, isPrototypeOf, propertyIsEnumerable, toLocaleString, valueOf
   */
]);

addObject(BUILTIN_SHAPES, BuiltInUseStateId, [
  ['0', {kind: 'Poly'}],
  [
    '1',
    addFunction(
      BUILTIN_SHAPES,
      [],
      {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: PRIMITIVE_TYPE,
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Primitive,
      },
      BuiltInSetStateId,
    ),
  ],
]);

addObject(BUILTIN_SHAPES, BuiltInUseTransitionId, [
  ['0', {kind: 'Primitive'}],
  [
    '1',
    addFunction(
      BUILTIN_SHAPES,
      [],
      {
        positionalParams: [],
        restParam: null,
        returnType: PRIMITIVE_TYPE,
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Primitive,
      },
      BuiltInStartTransitionId,
    ),
  ],
]);

addObject(BUILTIN_SHAPES, BuiltInUseActionStateId, [
  ['0', {kind: 'Poly'}],
  [
    '1',
    addFunction(
      BUILTIN_SHAPES,
      [],
      {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: PRIMITIVE_TYPE,
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Primitive,
      },
      BuiltInSetActionStateId,
    ),
  ],
]);

addObject(BUILTIN_SHAPES, BuiltInUseReducerId, [
  ['0', {kind: 'Poly'}],
  [
    '1',
    addFunction(
      BUILTIN_SHAPES,
      [],
      {
        positionalParams: [],
        restParam: Effect.Freeze,
        returnType: PRIMITIVE_TYPE,
        calleeEffect: Effect.Read,
        returnValueKind: ValueKind.Primitive,
      },
      BuiltInDispatchId,
    ),
  ],
]);

addObject(BUILTIN_SHAPES, BuiltInUseRefId, [
  ['current', {kind: 'Object', shapeId: BuiltInRefValueId}],
]);

addObject(BUILTIN_SHAPES, BuiltInRefValueId, [
  ['*', {kind: 'Object', shapeId: BuiltInRefValueId}],
]);

addObject(BUILTIN_SHAPES, BuiltInMixedReadonlyId, [
  [
    'toString',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: PRIMITIVE_TYPE,
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  [
    'map',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {kind: 'Object', shapeId: BuiltInArrayId},
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Mutable,
      noAlias: true,
    }),
  ],
  [
    'filter',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {kind: 'Object', shapeId: BuiltInArrayId},
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Mutable,
      noAlias: true,
    }),
  ],
  [
    'concat',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Capture,
      returnType: {
        kind: 'Object',
        shapeId: BuiltInArrayId,
      },
      calleeEffect: Effect.Capture,
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    'slice',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: {
        kind: 'Object',
        shapeId: BuiltInArrayId,
      },
      calleeEffect: Effect.Capture,
      returnValueKind: ValueKind.Mutable,
    }),
  ],
  [
    'every',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Primitive,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'some',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Primitive,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'find',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Poly'},
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Mutable,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'findIndex',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.ConditionallyMutate,
      returnType: {kind: 'Primitive'},
      calleeEffect: Effect.ConditionallyMutate,
      returnValueKind: ValueKind.Primitive,
      noAlias: true,
      mutableOnlyIfOperandsAreMutable: true,
    }),
  ],
  [
    'join',
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Read,
      returnType: PRIMITIVE_TYPE,
      calleeEffect: Effect.Read,
      returnValueKind: ValueKind.Primitive,
    }),
  ],
  ['*', {kind: 'Object', shapeId: BuiltInMixedReadonlyId}],
]);

addObject(BUILTIN_SHAPES, BuiltInJsxId, []);
addObject(BUILTIN_SHAPES, BuiltInFunctionId, []);

export const DefaultMutatingHook = addHook(
  BUILTIN_SHAPES,
  {
    positionalParams: [],
    restParam: Effect.ConditionallyMutate,
    returnType: {kind: 'Poly'},
    calleeEffect: Effect.Read,
    hookKind: 'Custom',
    returnValueKind: ValueKind.Mutable,
  },
  'DefaultMutatingHook',
);

export const DefaultNonmutatingHook = addHook(
  BUILTIN_SHAPES,
  {
    positionalParams: [],
    restParam: Effect.Freeze,
    returnType: {kind: 'Poly'},
    calleeEffect: Effect.Read,
    hookKind: 'Custom',
    returnValueKind: ValueKind.Frozen,
  },
  'DefaultNonmutatingHook',
);
