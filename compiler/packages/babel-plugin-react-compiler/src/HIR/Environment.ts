/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {ZodError, z} from 'zod/v4';
import {fromZodError} from 'zod-validation-error/v4';
import {CompilerError} from '../CompilerError';
import {Logger, ProgramContext} from '../Entrypoint';
import {Err, Ok, Result} from '../Utils/Result';
import {
  DEFAULT_GLOBALS,
  DEFAULT_SHAPES,
  Global,
  GlobalRegistry,
  getReanimatedModuleType,
  installTypeConfig,
} from './Globals';
import {
  BlockId,
  BuiltInType,
  Effect,
  FunctionType,
  HIRFunction,
  IdentifierId,
  NonLocalBinding,
  PolyType,
  ScopeId,
  SourceLocation,
  Type,
  ValidatedIdentifier,
  ValueKind,
  getHookKindForType,
  makeBlockId,
  makeIdentifierId,
  makeIdentifierName,
  makeScopeId,
} from './HIR';
import {
  BuiltInMixedReadonlyId,
  DefaultMutatingHook,
  DefaultNonmutatingHook,
  FunctionSignature,
  ShapeRegistry,
  addHook,
} from './ObjectShape';
import {Scope as BabelScope, NodePath} from '@babel/traverse';
import {TypeSchema} from './TypeSchema';
import {FlowTypeEnv} from '../Flood/Types';
import {defaultModuleTypeProvider} from './DefaultModuleTypeProvider';

export const ReactElementSymbolSchema = z.object({
  elementSymbol: z.union([
    z.literal('react.element'),
    z.literal('react.transitional.element'),
  ]),
  globalDevVar: z.string(),
});

export const ExternalFunctionSchema = z.object({
  // Source for the imported module that exports the `importSpecifierName` functions
  source: z.string(),

  // Unique name for the feature flag test condition, eg `isForgetEnabled_ProjectName`
  importSpecifierName: z.string(),
});

export const InstrumentationSchema = z
  .object({
    fn: ExternalFunctionSchema,
    gating: ExternalFunctionSchema.nullable(),
    globalGating: z.string().nullable(),
  })
  .refine(
    opts => opts.gating != null || opts.globalGating != null,
    'Expected at least one of gating or globalGating',
  );

export type ExternalFunction = z.infer<typeof ExternalFunctionSchema>;
export const USE_FIRE_FUNCTION_NAME = 'useFire';
export const EMIT_FREEZE_GLOBAL_GATING = '__DEV__';

export const MacroMethodSchema = z.union([
  z.object({type: z.literal('wildcard')}),
  z.object({type: z.literal('name'), name: z.string()}),
]);

// Would like to change this to drop the string option, but breaks compatibility with existing configs
export const MacroSchema = z.union([
  z.string(),
  z.tuple([z.string(), z.array(MacroMethodSchema)]),
]);

export type CompilerMode = 'all_features' | 'no_inferred_memo';

export type Macro = z.infer<typeof MacroSchema>;
export type MacroMethod = z.infer<typeof MacroMethodSchema>;

const HookSchema = z.object({
  /*
   * The effect of arguments to this hook. Describes whether the hook may or may
   * not mutate arguments, etc.
   */
  effectKind: z.nativeEnum(Effect),

  /*
   * The kind of value returned by the hook. Allows indicating that a hook returns
   * a primitive or already-frozen value, which can allow more precise memoization
   * of callers.
   */
  valueKind: z.nativeEnum(ValueKind),

  /*
   * Specifies whether hook arguments may be aliased by other arguments or by the
   * return value of the function. Defaults to false. When enabled, this allows the
   * compiler to avoid memoizing arguments.
   */
  noAlias: z.boolean().default(false),

  /*
   * Specifies whether the hook returns data that is composed of:
   * - undefined
   * - null
   * - boolean
   * - number
   * - string
   * - arrays whose items are also transitiveMixed
   * - objects whose values are also transitiveMixed
   *
   * Many state management and data-fetching APIs return data that meets
   * this criteria since this is JSON + undefined. Forget can compile
   * hooks that return transitively mixed data more optimally because it
   * can make inferences about some method calls (especially array methods
   * like `data.items.map(...)` since these builtin types have few built-in
   * methods.
   */
  transitiveMixedData: z.boolean().default(false),
});

export type Hook = z.infer<typeof HookSchema>;

/*
 * TODO(mofeiZ): User defined global types (with corresponding shapes).
 * User defined global types should have inline ObjectShapes instead of directly
 * using ObjectShapes.ShapeRegistry, as a user-provided ShapeRegistry may be
 * accidentally be not well formed.
 * i.e.
 *   missing required shapes (BuiltInArray for [] and BuiltInObject for {})
 *   missing some recursive Object / Function shapeIds
 */

export const EnvironmentConfigSchema = z.object({
  customHooks: z.map(z.string(), HookSchema).default(new Map()),

  /**
   * A function that, given the name of a module, can optionally return a description
   * of that module's type signature.
   */
  moduleTypeProvider: z.nullable(z.any()).default(null),

  /**
   * A list of functions which the application compiles as macros, where
   * the compiler must ensure they are not compiled to rename the macro or separate the
   * "function" from its argument.
   *
   * For example, Meta has some APIs such as `featureflag("name-of-feature-flag")` which
   * are rewritten by a plugin. Assigning `featureflag` to a temporary would break the
   * plugin since it looks specifically for the name of the function being invoked, not
   * following aliases.
   */
  customMacros: z.nullable(z.array(MacroSchema)).default(null),

  /**
   * Enable a check that resets the memoization cache when the source code of
   * the file changes. This is intended to support hot module reloading (HMR),
   * where the same runtime component instance will be reused across different
   * versions of the component source.
   *
   * When set to
   * - true:  code for HMR support is always generated, regardless of NODE_ENV
   *          or `globalThis.__DEV__`
   * - false: code for HMR support is not generated
   * - null:  (default) code for HMR support is conditionally generated dependent
   *          on `NODE_ENV` and `globalThis.__DEV__` at the time of compilation.
   */
  enableResetCacheOnSourceFileChanges: z.nullable(z.boolean()).default(null),

  /**
   * Enable using information from existing useMemo/useCallback to understand when a value is done
   * being mutated. With this mode enabled, Forget will still discard the actual useMemo/useCallback
   * calls and may memoize slightly differently. However, it will assume that the values produced
   * are not subsequently modified, guaranteeing that the value will be memoized.
   *
   * By preserving guarantees about when values are memoized, this option preserves any existing
   * behavior that depends on referential equality in the original program. Notably, this preserves
   * existing effect behavior (how often effects fire) for effects that rely on referential equality.
   *
   * When disabled, Forget will not only prune useMemo and useCallback calls but also completely ignore
   * them, not using any information from them to guide compilation. Therefore, disabling this flag
   * will produce output that mimics the result from removing all memoization.
   *
   * Our recommendation is to first try running your application with this flag enabled, then attempt
   * to disable this flag and see what changes or breaks. This will mostly likely be effects that
   * depend on referential equality, which can be refactored (TODO guide for this).
   *
   * NOTE: this mode treats freeze as a transitive operation for function expressions. This means
   * that if a useEffect or useCallback references a function value, that function value will be
   * considered frozen, and in turn all of its referenced variables will be considered frozen as well.
   */
  enablePreserveExistingMemoizationGuarantees: z.boolean().default(true),

  /**
   * Validates that all useMemo/useCallback values are also memoized by Forget. This mode can be
   * used with or without @enablePreserveExistingMemoizationGuarantees.
   *
   * With enablePreserveExistingMemoizationGuarantees, this validation enables automatically and
   * verifies that Forget was able to preserve manual memoization semantics under that mode's
   * additional assumptions about the input.
   *
   * With enablePreserveExistingMemoizationGuarantees off, this validation ignores manual memoization
   * when determining program behavior, and only uses information from useMemo/useCallback to check
   * that the memoization was preserved. This can be useful for determining where referential equalities
   * may change under Forget.
   */
  validatePreserveExistingMemoizationGuarantees: z.boolean().default(true),

  /**
   * When this is true, rather than pruning existing manual memoization but ensuring or validating
   * that the memoized values remain memoized, the compiler will simply not prune existing calls to
   * useMemo/useCallback.
   */
  enablePreserveExistingManualUseMemo: z.boolean().default(false),

  // 🌲
  enableForest: z.boolean().default(false),

  /**
   * Enable use of type annotations in the source to drive type inference. By default
   * Forget attemps to infer types using only information that is guaranteed correct
   * given the source, and does not trust user-supplied type annotations. This mode
   * enables trusting user type annotations.
   */
  enableUseTypeAnnotations: z.boolean().default(false),

  /**
   * Allows specifying a function that can populate HIR with type information from
   * Flow
   */
  flowTypeProvider: z.nullable(z.any()).default(null),

  /**
   * Enables inference of optional dependency chains. Without this flag
   * a property chain such as `props?.items?.foo` will infer as a dep on
   * just `props`. With this flag enabled, we'll infer that full path as
   * the dependency.
   */
  enableOptionalDependencies: z.boolean().default(true),

  enableFire: z.boolean().default(false),

  enableNameAnonymousFunctions: z.boolean().default(false),

  /**
   * Enables inference and auto-insertion of effect dependencies. Takes in an array of
   * configurable module and import pairs to allow for user-land experimentation. For example,
   * [
   *   {
   *     module: 'react',
   *     imported: 'useEffect',
   *     autodepsIndex: 1,
   *   },{
   *     module: 'MyExperimentalEffectHooks',
   *     imported: 'useExperimentalEffect',
   *     autodepsIndex: 2,
   *   },
   * ]
   * would insert dependencies for calls of `useEffect` imported from `react` and calls of
   * useExperimentalEffect` from `MyExperimentalEffectHooks`.
   *
   * `autodepsIndex` tells the compiler which index we expect the AUTODEPS to appear in.
   *  With the configuration above, we'd insert dependencies for `useEffect` if it has two
   *  arguments, and the second is AUTODEPS.
   *
   * Still experimental.
   */
  inferEffectDependencies: z
    .nullable(
      z.array(
        z.object({
          function: ExternalFunctionSchema,
          autodepsIndex: z.number().min(1, 'autodepsIndex must be > 0'),
        }),
      ),
    )
    .default(null),

  /**
   * Enables inlining ReactElement object literals in place of JSX
   * An alternative to the standard JSX transform which replaces JSX with React's jsxProd() runtime
   * Currently a prod-only optimization, requiring Fast JSX dependencies
   *
   * The symbol configuration is set for backwards compatability with pre-React 19 transforms
   */
  inlineJsxTransform: ReactElementSymbolSchema.nullable().default(null),

  /*
   * Enable validation of hooks to partially check that the component honors the rules of hooks.
   * When disabled, the component is assumed to follow the rules (though the Babel plugin looks
   * for suppressions of the lint rule).
   */
  validateHooksUsage: z.boolean().default(true),

  // Validate that ref values (`ref.current`) are not accessed during render.
  validateRefAccessDuringRender: z.boolean().default(true),

  /*
   * Validates that setState is not unconditionally called during render, as it can lead to
   * infinite loops.
   */
  validateNoSetStateInRender: z.boolean().default(true),

  /**
   * Validates that setState is not called synchronously within an effect (useEffect and friends).
   * Scheduling a setState (with an event listener, subscription, etc) is valid.
   */
  validateNoSetStateInEffects: z.boolean().default(false),

  /**
   * Validates that effects are not used to calculate derived data which could instead be computed
   * during render.
   */
  validateNoDerivedComputationsInEffects: z.boolean().default(false),

  /**
   * Validates against creating JSX within a try block and recommends using an error boundary
   * instead.
   */
  validateNoJSXInTryStatements: z.boolean().default(false),

  /**
   * Validates against dynamically creating components during render.
   */
  validateStaticComponents: z.boolean().default(false),

  /**
   * Validates that the dependencies of all effect hooks are memoized. This helps ensure
   * that Forget does not introduce infinite renders caused by a dependency changing,
   * triggering an effect, which triggers re-rendering, which causes a dependency to change,
   * triggering the effect, etc.
   *
   * Covers useEffect, useLayoutEffect, useInsertionEffect.
   */
  validateMemoizedEffectDependencies: z.boolean().default(false),

  /**
   * Validates that there are no capitalized calls other than those allowed by the allowlist.
   * Calls to capitalized functions are often functions that used to be components and may
   * have lingering hook calls, which makes those calls risky to memoize.
   *
   * You can specify a list of capitalized calls to allowlist using this option. React Compiler
   * always includes its known global functions, including common functions like Boolean and String,
   * in this allowlist. You can enable this validation with no additional allowlisted calls by setting
   * this option to the empty array.
   */
  validateNoCapitalizedCalls: z.nullable(z.array(z.string())).default(null),
  validateBlocklistedImports: z.nullable(z.array(z.string())).default(null),

  /**
   * Validate against impure functions called during render
   */
  validateNoImpureFunctionsInRender: z.boolean().default(false),

  /**
   * Validate against passing mutable functions to hooks
   */
  validateNoFreezingKnownMutableFunctions: z.boolean().default(false),

  /*
   * When enabled, the compiler assumes that hooks follow the Rules of React:
   * - Hooks may memoize computation based on any of their parameters, thus
   *   any arguments to a hook are assumed frozen after calling the hook.
   * - Hooks may memoize the result they return, thus the return value is
   *   assumed frozen.
   */
  enableAssumeHooksFollowRulesOfReact: z.boolean().default(true),

  /**
   * When enabled, the compiler assumes that any values are not subsequently
   * modified after they are captured by a function passed to React. For example,
   * if a value `x` is referenced inside a function expression passed to `useEffect`,
   * then this flag will assume that `x` is not subusequently modified.
   */
  enableTransitivelyFreezeFunctionExpressions: z.boolean().default(true),

  /*
   * Enables codegen mutability debugging. This emits a dev-mode only to log mutations
   * to values that Forget assumes are immutable (for Forget compiled code).
   * For example:
   *   emitFreeze: {
   *     source: 'ReactForgetRuntime',
   *     importSpecifierName: 'makeReadOnly',
   *   }
   *
   * produces:
   *   import {makeReadOnly} from 'ReactForgetRuntime';
   *
   *   function Component(props) {
   *     if (c_0) {
   *       // ...
   *       $[0] = __DEV__ ? makeReadOnly(x) : x;
   *     } else {
   *       x = $[0];
   *     }
   *   }
   */
  enableEmitFreeze: ExternalFunctionSchema.nullable().default(null),

  enableEmitHookGuards: ExternalFunctionSchema.nullable().default(null),

  /**
   * Enable instruction reordering. See InstructionReordering.ts for the details
   * of the approach.
   */
  enableInstructionReordering: z.boolean().default(false),

  /**
   * Enables function outlinining, where anonymous functions that do not close over
   * local variables can be extracted into top-level helper functions.
   */
  enableFunctionOutlining: z.boolean().default(true),

  /**
   * If enabled, this will outline nested JSX into a separate component.
   *
   * This will enable the compiler to memoize the separate component, giving us
   * the same behavior as compiling _within_ the callback.
   *
   * ```
   * function Component(countries, onDelete) {
   *   const name = useFoo();
   *   return countries.map(() => {
   *     return (
   *       <Foo>
   *         <Bar>{name}</Bar>
   *         <Button onclick={onDelete}>delete</Button>
   *       </Foo>
   *     );
   *   });
   * }
   * ```
   *
   * will be transpiled to:
   *
   * ```
   * function Component(countries, onDelete) {
   *   const name = useFoo();
   *   return countries.map(() => {
   *     return (
   *       <Temp name={name} onDelete={onDelete} />
   *     );
   *   });
   * }
   *
   * function Temp({name, onDelete}) {
   *   return (
   *     <Foo>
   *       <Bar>{name}</Bar>
   *       <Button onclick={onDelete}>delete</Button>
   *     </Foo>
   *   );
   * }
   *
   * Both, `Component` and `Temp` will then be memoized by the compiler.
   *
   * With this change, when `countries` is updated by adding one single value,
   * only the newly added value is re-rendered and not the entire list.
   */
  enableJsxOutlining: z.boolean().default(false),

  /*
   * Enables instrumentation codegen. This emits a dev-mode only call to an
   * instrumentation function, for components and hooks that Forget compiles.
   * For example:
   *   instrumentForget: {
   *     import: {
   *       source: 'react-compiler-runtime',
   *       importSpecifierName: 'useRenderCounter',
   *      }
   *   }
   *
   * produces:
   *   import {useRenderCounter} from 'react-compiler-runtime';
   *
   *   function Component(props) {
   *     if (__DEV__) {
   *        useRenderCounter("Component", "/filepath/filename.js");
   *     }
   *     // ...
   *   }
   *
   */
  enableEmitInstrumentForget: InstrumentationSchema.nullable().default(null),

  // Enable validation of mutable ranges
  assertValidMutableRanges: z.boolean().default(false),

  /*
   * Enable emitting "change variables" which store the result of whether a particular
   * reactive scope dependency has changed since the scope was last executed.
   *
   * Ex:
   * ```
   * const c_0 = $[0] !== input; // change variable
   * let output;
   * if (c_0) ...
   * ```
   *
   * Defaults to false, where the comparison is inlined:
   *
   * ```
   * let output;
   * if ($[0] !== input) ...
   * ```
   */
  enableChangeVariableCodegen: z.boolean().default(false),

  /**
   * Enable emitting comments that explain Forget's output, and which
   * values are being checked and which values produced by each memo block.
   *
   * Intended for use in demo purposes (incl playground)
   */
  enableMemoizationComments: z.boolean().default(false),

  /**
   * [TESTING ONLY] Throw an unknown exception during compilation to
   * simulate unexpected exceptions e.g. errors from babel functions.
   */
  throwUnknownException__testonly: z.boolean().default(false),

  /**
   * Enables deps of a function epxression to be treated as conditional. This
   * makes sure we don't load a dep when it's a property (to check if it has
   * changed) and instead check the receiver.
   *
   * This makes sure we don't end up throwing when the reciver is null. Consider
   * this code:
   *
   * ```
   * function getLength() {
   *   return props.bar.length;
   * }
   * ```
   *
   * It's only safe to memoize `getLength` against props, not props.bar, as
   * props.bar could be null when this `getLength` function is created.
   *
   * This does cause the memoization to now be coarse grained, which is
   * non-ideal.
   */
  enableTreatFunctionDepsAsConditional: z.boolean().default(false),

  /**
   * When true, always act as though the dependencies of a memoized value
   * have changed. This makes the compiler not actually perform any optimizations,
   * but is useful for debugging. Implicitly also sets
   * @enablePreserveExistingManualUseMemo, because otherwise memoization in the
   * original source will be disabled as well.
   */
  disableMemoizationForDebugging: z.boolean().default(false),

  /**
   * When true, rather using memoized values, the compiler will always re-compute
   * values, and then use a heuristic to compare the memoized value to the newly
   * computed one. This detects cases where rules of react violations may cause the
   * compiled code to behave differently than the original.
   */
  enableChangeDetectionForDebugging:
    ExternalFunctionSchema.nullable().default(null),

  /**
   * The react native re-animated library uses custom Babel transforms that
   * requires the calls to library API remain unmodified.
   *
   * If this flag is turned on, the React compiler will use custom type
   * definitions for reanimated library to make it's Babel plugin work
   * with the compiler.
   */
  enableCustomTypeDefinitionForReanimated: z.boolean().default(false),

  /**
   * If specified, this value is used as a pattern for determing which global values should be
   * treated as hooks. The pattern should have a single capture group, which will be used as
   * the hook name for the purposes of resolving hook definitions (for builtin hooks)_.
   *
   * For example, by default `React$useState` would not be treated as a hook. By specifying
   * `hookPattern: 'React$(\w+)'`, the compiler will treat this value equivalently to `useState()`.
   *
   * This setting is intended for cases where Forget is compiling code that has been prebundled
   * and identifiers have been changed.
   */
  hookPattern: z.string().nullable().default(null),

  /**
   * If enabled, this will treat objects named as `ref` or if their names end with the substring `Ref`,
   * and contain a property named `current`, as React refs.
   *
   * ```
   * const ref = useMyRef();
   * const myRef = useMyRef2();
   * useEffect(() => {
   *   ref.current = ...;
   *   myRef.current = ...;
   * })
   * ```
   *
   * Here the variables `ref` and `myRef` will be typed as Refs.
   */
  enableTreatRefLikeIdentifiersAsRefs: z.boolean().default(true),

  /**
   * Treat identifiers as SetState type if both
   * - they are named with a "set-" prefix
   * - they are called somewhere
   */
  enableTreatSetIdentifiersAsStateSetters: z.boolean().default(false),

  /*
   * If specified a value, the compiler lowers any calls to `useContext` to use
   * this value as the callee.
   *
   * A selector function is compiled and passed as an argument along with the
   * context to this function call.
   *
   * The compiler automatically figures out the keys by looking for the immediate
   * destructuring of the return value from the useContext call. In the future,
   * this can be extended to different kinds of context access like property
   * loads and accesses over multiple statements as well.
   *
   * ```
   * // input
   * const {foo, bar} = useContext(MyContext);
   *
   * // output
   * const {foo, bar} = useCompiledContext(MyContext, (c) => [c.foo, c.bar]);
   * ```
   */
  lowerContextAccess: ExternalFunctionSchema.nullable().default(null),

  /**
   * If enabled, will validate useMemos that don't return any values:
   *
   * Valid:
   *   useMemo(() => foo, [foo]);
   *   useMemo(() => { return foo }, [foo]);
   * Invalid:
   *   useMemo(() => { ... }, [...]);
   */
  validateNoVoidUseMemo: z.boolean().default(true),

  /**
   * Validates that Components/Hooks are always defined at module level. This prevents scope
   * reference errors that occur when the compiler attempts to optimize the nested component/hook
   * while its parent function remains uncompiled.
   */
  validateNoDynamicallyCreatedComponentsOrHooks: z.boolean().default(false),

  /**
   * When enabled, allows setState calls in effects when the value being set is
   * derived from a ref. This is useful for patterns where initial layout measurements
   * from refs need to be stored in state during mount.
   */
  enableAllowSetStateFromRefsInEffects: z.boolean().default(true),
});

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

export type PartialEnvironmentConfig = Partial<EnvironmentConfig>;

export type ReactFunctionType = 'Component' | 'Hook' | 'Other';

export function printFunctionType(type: ReactFunctionType): string {
  switch (type) {
    case 'Component': {
      return 'component';
    }
    case 'Hook': {
      return 'hook';
    }
    default: {
      return 'function';
    }
  }
}

export class Environment {
  #globals: GlobalRegistry;
  #shapes: ShapeRegistry;
  #moduleTypes: Map<string, Global | null> = new Map();
  #nextIdentifer: number = 0;
  #nextBlock: number = 0;
  #nextScope: number = 0;
  #scope: BabelScope;
  #outlinedFunctions: Array<{
    fn: HIRFunction;
    type: ReactFunctionType | null;
  }> = [];
  logger: Logger | null;
  filename: string | null;
  code: string | null;
  config: EnvironmentConfig;
  fnType: ReactFunctionType;
  compilerMode: CompilerMode;
  programContext: ProgramContext;
  hasFireRewrite: boolean;
  hasInferredEffect: boolean;
  inferredEffectLocations: Set<SourceLocation> = new Set();

  #contextIdentifiers: Set<t.Identifier>;
  #hoistedIdentifiers: Set<t.Identifier>;
  parentFunction: NodePath<t.Function>;

  #flowTypeEnvironment: FlowTypeEnv | null;

  constructor(
    scope: BabelScope,
    fnType: ReactFunctionType,
    compilerMode: CompilerMode,
    config: EnvironmentConfig,
    contextIdentifiers: Set<t.Identifier>,
    parentFunction: NodePath<t.Function>, // the outermost function being compiled
    logger: Logger | null,
    filename: string | null,
    code: string | null,
    programContext: ProgramContext,
  ) {
    this.#scope = scope;
    this.fnType = fnType;
    this.compilerMode = compilerMode;
    this.config = config;
    this.filename = filename;
    this.code = code;
    this.logger = logger;
    this.programContext = programContext;
    this.#shapes = new Map(DEFAULT_SHAPES);
    this.#globals = new Map(DEFAULT_GLOBALS);
    this.hasFireRewrite = false;
    this.hasInferredEffect = false;

    if (
      config.disableMemoizationForDebugging &&
      config.enableChangeDetectionForDebugging != null
    ) {
      CompilerError.throwInvalidConfig({
        reason: `Invalid environment config: the 'disableMemoizationForDebugging' and 'enableChangeDetectionForDebugging' options cannot be used together`,
        description: null,
        loc: null,
        suggestions: null,
      });
    }

    for (const [hookName, hook] of this.config.customHooks) {
      CompilerError.invariant(!this.#globals.has(hookName), {
        reason: `[Globals] Found existing definition in global registry for custom hook ${hookName}`,
        description: null,
        details: [
          {
            kind: 'error',
            loc: null,
            message: null,
          },
        ],
        suggestions: null,
      });
      this.#globals.set(
        hookName,
        addHook(this.#shapes, {
          positionalParams: [],
          restParam: hook.effectKind,
          returnType: hook.transitiveMixedData
            ? {kind: 'Object', shapeId: BuiltInMixedReadonlyId}
            : {kind: 'Poly'},
          returnValueKind: hook.valueKind,
          calleeEffect: Effect.Read,
          hookKind: 'Custom',
          noAlias: hook.noAlias,
        }),
      );
    }

    if (config.enableCustomTypeDefinitionForReanimated) {
      const reanimatedModuleType = getReanimatedModuleType(this.#shapes);
      this.#moduleTypes.set(REANIMATED_MODULE_NAME, reanimatedModuleType);
    }

    this.parentFunction = parentFunction;
    this.#contextIdentifiers = contextIdentifiers;
    this.#hoistedIdentifiers = new Set();

    if (config.flowTypeProvider != null) {
      this.#flowTypeEnvironment = new FlowTypeEnv();
      CompilerError.invariant(code != null, {
        reason:
          'Expected Environment to be initialized with source code when a Flow type provider is specified',
        description: null,
        details: [
          {
            kind: 'error',
            loc: null,
            message: null,
          },
        ],
      });
      this.#flowTypeEnvironment.init(this, code);
    } else {
      this.#flowTypeEnvironment = null;
    }
  }

  get typeContext(): FlowTypeEnv {
    CompilerError.invariant(this.#flowTypeEnvironment != null, {
      reason: 'Flow type environment not initialized',
      description: null,
      details: [
        {
          kind: 'error',
          loc: null,
          message: null,
        },
      ],
    });
    return this.#flowTypeEnvironment;
  }

  get isInferredMemoEnabled(): boolean {
    return this.compilerMode !== 'no_inferred_memo';
  }

  get nextIdentifierId(): IdentifierId {
    return makeIdentifierId(this.#nextIdentifer++);
  }

  get nextBlockId(): BlockId {
    return makeBlockId(this.#nextBlock++);
  }

  get nextScopeId(): ScopeId {
    return makeScopeId(this.#nextScope++);
  }

  get scope(): BabelScope {
    return this.#scope;
  }

  logErrors(errors: Result<void, CompilerError>): void {
    if (errors.isOk() || this.logger == null) {
      return;
    }
    for (const error of errors.unwrapErr().details) {
      this.logger.logEvent(this.filename, {
        kind: 'CompileError',
        detail: error,
        fnLoc: null,
      });
    }
  }

  isContextIdentifier(node: t.Identifier): boolean {
    return this.#contextIdentifiers.has(node);
  }

  isHoistedIdentifier(node: t.Identifier): boolean {
    return this.#hoistedIdentifiers.has(node);
  }

  generateGloballyUniqueIdentifierName(
    name: string | null,
  ): ValidatedIdentifier {
    const identifierNode = this.#scope.generateUidIdentifier(name ?? undefined);
    return makeIdentifierName(identifierNode.name);
  }

  outlineFunction(fn: HIRFunction, type: ReactFunctionType | null): void {
    this.#outlinedFunctions.push({fn, type});
  }

  getOutlinedFunctions(): Array<{
    fn: HIRFunction;
    type: ReactFunctionType | null;
  }> {
    return this.#outlinedFunctions;
  }

  #resolveModuleType(moduleName: string, loc: SourceLocation): Global | null {
    let moduleType = this.#moduleTypes.get(moduleName);
    if (moduleType === undefined) {
      /*
       * NOTE: Zod doesn't work when specifying a function as a default, so we have to
       * fallback to the default value here
       */
      const moduleTypeProvider =
        this.config.moduleTypeProvider ?? defaultModuleTypeProvider;
      if (moduleTypeProvider == null) {
        return null;
      }
      if (typeof moduleTypeProvider !== 'function') {
        CompilerError.throwInvalidConfig({
          reason: `Expected a function for \`moduleTypeProvider\``,
          loc,
        });
      }
      const unparsedModuleConfig = moduleTypeProvider(moduleName);
      if (unparsedModuleConfig != null) {
        const parsedModuleConfig = TypeSchema.safeParse(unparsedModuleConfig);
        if (!parsedModuleConfig.success) {
          CompilerError.throwInvalidConfig({
            reason: `Could not parse module type, the configured \`moduleTypeProvider\` function returned an invalid module description`,
            description: parsedModuleConfig.error.toString(),
            loc,
          });
        }
        const moduleConfig = parsedModuleConfig.data;
        moduleType = installTypeConfig(
          this.#globals,
          this.#shapes,
          moduleConfig,
          moduleName,
          loc,
        );
      } else {
        moduleType = null;
      }
      this.#moduleTypes.set(moduleName, moduleType);
    }
    return moduleType;
  }

  getGlobalDeclaration(
    binding: NonLocalBinding,
    loc: SourceLocation,
  ): Global | null {
    if (this.config.hookPattern != null) {
      const match = new RegExp(this.config.hookPattern).exec(binding.name);
      if (
        match != null &&
        typeof match[1] === 'string' &&
        isHookName(match[1])
      ) {
        const resolvedName = match[1];
        return this.#globals.get(resolvedName) ?? this.#getCustomHookType();
      }
    }

    switch (binding.kind) {
      case 'ModuleLocal': {
        // don't resolve module locals
        return isHookName(binding.name) ? this.#getCustomHookType() : null;
      }
      case 'Global': {
        return (
          this.#globals.get(binding.name) ??
          (isHookName(binding.name) ? this.#getCustomHookType() : null)
        );
      }
      case 'ImportSpecifier': {
        if (this.#isKnownReactModule(binding.module)) {
          /**
           * For `import {imported as name} from "..."` form, we use the `imported`
           * name rather than the local alias. Because we don't have definitions for
           * every React builtin hook yet, we also check to see if the imported name
           * is hook-like (whereas the fall-through below is checking if the aliased
           * name is hook-like)
           */
          return (
            this.#globals.get(binding.imported) ??
            (isHookName(binding.imported) || isHookName(binding.name)
              ? this.#getCustomHookType()
              : null)
          );
        } else {
          const moduleType = this.#resolveModuleType(binding.module, loc);
          if (moduleType !== null) {
            const importedType = this.getPropertyType(
              moduleType,
              binding.imported,
            );
            if (importedType != null) {
              /*
               * Check that hook-like export names are hook types, and non-hook names are non-hook types.
               * The user-assigned alias isn't decidable by the type provider, so we ignore that for the check.
               * Thus we allow `import {fooNonHook as useFoo} from ...` because the name and type both say
               * that it's not a hook.
               */
              const expectHook = isHookName(binding.imported);
              const isHook = getHookKindForType(this, importedType) != null;
              if (expectHook !== isHook) {
                CompilerError.throwInvalidConfig({
                  reason: `Invalid type configuration for module`,
                  description: `Expected type for \`import {${binding.imported}} from '${binding.module}'\` ${expectHook ? 'to be a hook' : 'not to be a hook'} based on the exported name`,
                  loc,
                });
              }
              return importedType;
            }
          }

          /**
           * For modules we don't own, we look at whether the original name or import alias
           * are hook-like. Both of the following are likely hooks so we would return a hook
           * type for both:
           *
           * `import {useHook as foo} ...`
           * `import {foo as useHook} ...`
           */
          return isHookName(binding.imported) || isHookName(binding.name)
            ? this.#getCustomHookType()
            : null;
        }
      }
      case 'ImportDefault':
      case 'ImportNamespace': {
        if (this.#isKnownReactModule(binding.module)) {
          // only resolve imports to modules we know about
          return (
            this.#globals.get(binding.name) ??
            (isHookName(binding.name) ? this.#getCustomHookType() : null)
          );
        } else {
          const moduleType = this.#resolveModuleType(binding.module, loc);
          if (moduleType !== null) {
            let importedType: Type | null = null;
            if (binding.kind === 'ImportDefault') {
              const defaultType = this.getPropertyType(moduleType, 'default');
              if (defaultType !== null) {
                importedType = defaultType;
              }
            } else {
              importedType = moduleType;
            }
            if (importedType !== null) {
              /*
               * Check that the hook-like modules are defined as types, and non hook-like modules are not typed as hooks.
               * So `import Foo from 'useFoo'` is expected to be a hook based on the module name
               */
              const expectHook = isHookName(binding.module);
              const isHook = getHookKindForType(this, importedType) != null;
              if (expectHook !== isHook) {
                CompilerError.throwInvalidConfig({
                  reason: `Invalid type configuration for module`,
                  description: `Expected type for \`import ... from '${binding.module}'\` ${expectHook ? 'to be a hook' : 'not to be a hook'} based on the module name`,
                  loc,
                });
              }
              return importedType;
            }
          }
          return isHookName(binding.name) ? this.#getCustomHookType() : null;
        }
      }
    }
  }

  #isKnownReactModule(moduleName: string): boolean {
    return (
      moduleName.toLowerCase() === 'react' ||
      moduleName.toLowerCase() === 'react-dom'
    );
  }
  static knownReactModules: ReadonlyArray<string> = ['react', 'react-dom'];

  getFallthroughPropertyType(
    receiver: Type,
    _property: Type,
  ): BuiltInType | PolyType | null {
    let shapeId = null;
    if (receiver.kind === 'Object' || receiver.kind === 'Function') {
      shapeId = receiver.shapeId;
    }

    if (shapeId !== null) {
      const shape = this.#shapes.get(shapeId);

      CompilerError.invariant(shape !== undefined, {
        reason: `[HIR] Forget internal error: cannot resolve shape ${shapeId}`,
        description: null,
        details: [
          {
            kind: 'error',
            loc: null,
            message: null,
          },
        ],
        suggestions: null,
      });
      return shape.properties.get('*') ?? null;
    }
    return null;
  }

  getPropertyType(
    receiver: Type,
    property: string | number,
  ): BuiltInType | PolyType | null {
    let shapeId = null;
    if (receiver.kind === 'Object' || receiver.kind === 'Function') {
      shapeId = receiver.shapeId;
    }
    if (shapeId !== null) {
      /*
       * If an object or function has a shapeId, it must have been assigned
       * by Forget (and be present in a builtin or user-defined registry)
       */
      const shape = this.#shapes.get(shapeId);
      CompilerError.invariant(shape !== undefined, {
        reason: `[HIR] Forget internal error: cannot resolve shape ${shapeId}`,
        description: null,
        details: [
          {
            kind: 'error',
            loc: null,
            message: null,
          },
        ],
        suggestions: null,
      });
      if (typeof property === 'string') {
        return (
          shape.properties.get(property) ??
          shape.properties.get('*') ??
          (isHookName(property) ? this.#getCustomHookType() : null)
        );
      } else {
        return shape.properties.get('*') ?? null;
      }
    } else if (typeof property === 'string' && isHookName(property)) {
      return this.#getCustomHookType();
    }
    return null;
  }

  getFunctionSignature(type: FunctionType): FunctionSignature | null {
    const {shapeId} = type;
    if (shapeId !== null) {
      const shape = this.#shapes.get(shapeId);
      CompilerError.invariant(shape !== undefined, {
        reason: `[HIR] Forget internal error: cannot resolve shape ${shapeId}`,
        description: null,
        details: [
          {
            kind: 'error',
            loc: null,
            message: null,
          },
        ],
        suggestions: null,
      });
      return shape.functionType;
    }
    return null;
  }

  addHoistedIdentifier(node: t.Identifier): void {
    this.#contextIdentifiers.add(node);
    this.#hoistedIdentifiers.add(node);
  }

  #getCustomHookType(): Global {
    if (this.config.enableAssumeHooksFollowRulesOfReact) {
      return DefaultNonmutatingHook;
    } else {
      return DefaultMutatingHook;
    }
  }
}

const REANIMATED_MODULE_NAME = 'react-native-reanimated';

// From https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js#LL18C1-L23C2
export function isHookName(name: string): boolean {
  return /^use[A-Z0-9]/.test(name);
}

export function parseEnvironmentConfig(
  partialConfig: PartialEnvironmentConfig,
): Result<EnvironmentConfig, ZodError<PartialEnvironmentConfig>> {
  const config = EnvironmentConfigSchema.safeParse(partialConfig);
  if (config.success) {
    return Ok(config.data);
  } else {
    return Err(config.error);
  }
}

export function validateEnvironmentConfig(
  partialConfig: PartialEnvironmentConfig,
): EnvironmentConfig {
  const config = EnvironmentConfigSchema.safeParse(partialConfig);
  if (config.success) {
    return config.data;
  }

  CompilerError.throwInvalidConfig({
    reason:
      'Could not validate environment config. Update React Compiler config to fix the error',
    description: `${fromZodError(config.error)}`,
    loc: null,
    suggestions: null,
  });
}

export function tryParseExternalFunction(
  maybeExternalFunction: any,
): ExternalFunction {
  const externalFunction = ExternalFunctionSchema.safeParse(
    maybeExternalFunction,
  );
  if (externalFunction.success) {
    return externalFunction.data;
  }

  CompilerError.throwInvalidConfig({
    reason:
      'Could not parse external function. Update React Compiler config to fix the error',
    description: `${fromZodError(externalFunction.error)}`,
    loc: null,
    suggestions: null,
  });
}

export const DEFAULT_EXPORT = 'default';
