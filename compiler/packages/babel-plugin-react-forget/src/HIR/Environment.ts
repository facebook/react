/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import { CompilerError } from "../CompilerError";
import { Logger } from "../Entrypoint";
import { Err, Ok, Result } from "../Utils/Result";
import { log } from "../Utils/logger";
import {
  DEFAULT_GLOBALS,
  DEFAULT_SHAPES,
  Global,
  GlobalRegistry,
  installReAnimatedTypes,
} from "./Globals";
import {
  BlockId,
  BuiltInType,
  Effect,
  FunctionType,
  IdentifierId,
  PolyType,
  ScopeId,
  Type,
  ValueKind,
  makeBlockId,
  makeIdentifierId,
  makeScopeId,
} from "./HIR";
import {
  BuiltInMixedReadonlyId,
  DefaultMutatingHook,
  DefaultNonmutatingHook,
  FunctionSignature,
  ShapeRegistry,
  addHook,
} from "./ObjectShape";

export const ExternalFunctionSchema = z.object({
  // Source for the imported module that exports the `importSpecifierName` functions
  source: z.string(),

  // Unique name for the feature flag test condition, eg `isForgetEnabled_ProjectName`
  importSpecifierName: z.string(),
});

export const InstrumentationSchema = z
  .object({
    fn: ExternalFunctionSchema,
    gating: ExternalFunctionSchema.nullish(),
    globalGating: z.string().nullish(),
  })
  .refine(
    (opts) => opts.gating != null || opts.globalGating != null,
    "Expected at least one of gating or globalGating"
  );

export type ExternalFunction = z.infer<typeof ExternalFunctionSchema>;

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

const EnvironmentConfigSchema = z.object({
  customHooks: z.map(z.string(), HookSchema).optional().default(new Map()),

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
  enablePreserveExistingMemoizationGuarantees: z.boolean().default(false),

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
  validatePreserveExistingMemoizationGuarantees: z.boolean().default(false),

  // 🌲
  enableForest: z.boolean().default(false),
  // <🌲>
  enableForestJsx: z.boolean().default(false),

  /*
   * Enable memoization of JSX elements in addition to other types of values. When disabled,
   * other types (objects, arrays, call expressions, etc) are memoized, but not known JSX
   * values.
   */
  memoizeJsxElements: z.boolean().default(true),

  /**
   * Enable use of type annotations in the source to drive type inference. By default
   * Forget attemps to infer types using only information that is guaranteed correct
   * given the source, and does not trust user-supplied type annotations. This mode
   * enables trusting user type annotations.
   */
  enableUseTypeAnnotations: z.boolean().default(false),

  /*
   * Enable validation of hooks to partially check that the component honors the rules of hooks.
   * When disabled, the component is assumed to follow the rules (though the Babel plugin looks
   * for suppressions of the lint rule).
   */
  validateHooksUsage: z.boolean().default(true),

  // Validate that ref values (`ref.current`) are not accessed during render.
  validateRefAccessDuringRender: z.boolean().default(false),

  /*
   * Validates that setState is not unconditionally called during render, as it can lead to
   * infinite loops.
   */
  validateNoSetStateInRender: z.boolean().default(false),

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

  /*
   * When enabled, the compiler assumes that hooks follow the Rules of React:
   * - Hooks may memoize computation based on any of their parameters, thus
   *   any arguments to a hook are assumed frozen after calling the hook.
   * - Hooks may memoize the result they return, thus the return value is
   *   assumed frozen.
   */
  enableAssumeHooksFollowRulesOfReact: z.boolean().default(false),

  /**
   * When enabled, the compiler assumes that any values are not subsequently
   * modified after they are captured by a function passed to React. For example,
   * if a value `x` is referenced inside a function expression passed to `useEffect`,
   * then this flag will assume that `x` is not subusequently modified.
   */
  enableTransitivelyFreezeFunctionExpressions: z.boolean().default(false),

  /*
   * When enabled, removes *all* memoization from the function: this includes
   * removing manually added useMemo/useCallback as well as not adding Forget's
   * usual useMemoCache-based memoization.
   */
  disableAllMemoization: z.boolean().default(false),

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
  enableEmitFreeze: ExternalFunctionSchema.nullish(),

  enableEmitHookGuards: ExternalFunctionSchema.nullish(),

  /*
   * Enables instrumentation codegen. This emits a dev-mode only call to an
   * instrumentation function, for components and hooks that Forget compiles.
   * For example:
   *   instrumentForget: {
   *     import: {
   *       source: 'react-forget-runtime',
   *       importSpecifierName: 'useRenderCounter',
   *      }
   *   }
   *
   * produces:
   *   import {useRenderCounter} from 'react-forget-runtime';
   *
   *   function Component(props) {
   *     if (__DEV__) {
   *        useRenderCounter("Component", "/filepath/filename.js");
   *     }
   *     // ...
   *   }
   *
   */
  enableEmitInstrumentForget: InstrumentationSchema.nullish(),

  /**
   * Enable support for reactive scopes that contain an early return.
   * This is relatively infrequent, as reactive scopes generally span
   * up to but excluding return statements.
   *
   * When disabled, the compiler will error (bailout) on any functions which
   * would create a reactive scope that contains a return statement.
   */
  enableEarlyReturnInReactiveScopes: z.boolean().default(true),

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
   * The react native re-animated library uses custom Babel transforms that
   * requires the calls to library API remain unmodified.
   *
   * If this flag is turned on, the React compiler will use custom type
   * definitions for reanimated library to make it's Babel plugin work
   * with the compiler.
   */
  enableCustomTypeDefinitionForReAnimated: z.boolean().default(false),

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
});

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

export function parseConfigPragma(pragma: string): EnvironmentConfig {
  const maybeConfig: any = {};
  // Get the defaults to programmatically check for boolean properties
  const defaultConfig = EnvironmentConfigSchema.parse({});

  for (const token of pragma.split(" ")) {
    if (!token.startsWith("@")) {
      continue;
    }
    const keyVal = token.slice(1);
    let [key, val]: any = keyVal.split(":");

    if (key === "validateNoCapitalizedCalls") {
      maybeConfig[key] = [];
      continue;
    }

    if (typeof defaultConfig[key as keyof EnvironmentConfig] !== "boolean") {
      // skip parsing non-boolean properties
      continue;
    }
    if (val === undefined || val === "true") {
      val = true;
    } else {
      val = false;
    }
    maybeConfig[key] = val;
  }

  const config = EnvironmentConfigSchema.safeParse(maybeConfig);
  if (config.success) {
    return config.data;
  }
  CompilerError.throwInvalidConfig({
    reason: `${fromZodError(config.error)}`,
    description: "Update Forget config to fix the error",
    loc: null,
    suggestions: null,
  });
}

export type PartialEnvironmentConfig = Partial<EnvironmentConfig>;

export type ReactFunctionType = "Component" | "Hook" | "Other";

export class Environment {
  #globals: GlobalRegistry;
  #shapes: ShapeRegistry;
  #nextIdentifer: number = 0;
  #nextBlock: number = 0;
  #nextScope: number = 0;
  logger: Logger | null;
  filename: string | null;
  config: EnvironmentConfig;
  fnType: ReactFunctionType;

  #contextIdentifiers: Set<t.Identifier>;
  #hoistedIdentifiers: Set<t.Identifier>;

  constructor(
    fnType: ReactFunctionType,
    config: EnvironmentConfig,
    contextIdentifiers: Set<t.Identifier>,
    logger: Logger | null,
    filename: string | null
  ) {
    this.fnType = fnType;
    this.config = config;
    this.filename = filename;
    this.logger = logger;
    this.#shapes = new Map(DEFAULT_SHAPES);
    this.#globals = new Map(DEFAULT_GLOBALS);

    for (const [hookName, hook] of this.config.customHooks) {
      CompilerError.invariant(!this.#globals.has(hookName), {
        reason: `[Globals] Found existing definition in global registry for custom hook ${hookName}`,
        description: null,
        loc: null,
        suggestions: null,
      });
      this.#globals.set(
        hookName,
        addHook(this.#shapes, {
          positionalParams: [],
          restParam: hook.effectKind,
          returnType: hook.transitiveMixedData
            ? { kind: "Object", shapeId: BuiltInMixedReadonlyId }
            : { kind: "Poly" },
          returnValueKind: hook.valueKind,
          calleeEffect: Effect.Read,
          hookKind: "Custom",
          noAlias: hook.noAlias,
        })
      );
    }

    if (config.enableCustomTypeDefinitionForReAnimated) {
      installReAnimatedTypes(this.#globals, this.#shapes);
    }

    this.#contextIdentifiers = contextIdentifiers;
    this.#hoistedIdentifiers = new Set();
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

  isContextIdentifier(node: t.Identifier): boolean {
    return this.#contextIdentifiers.has(node);
  }

  isHoistedIdentifier(node: t.Identifier): boolean {
    return this.#hoistedIdentifiers.has(node);
  }

  getGlobalDeclaration(name: string): Global | null {
    let resolvedName = name;

    if (this.config.hookPattern != null) {
      const match = new RegExp(this.config.hookPattern).exec(name);
      if (
        match != null &&
        typeof match[1] === "string" &&
        isHookName(match[1])
      ) {
        resolvedName = match[1];
      }
    }

    let resolvedGlobal: Global | null = this.#globals.get(resolvedName) ?? null;
    if (resolvedGlobal === null) {
      // Hack, since we don't track module level declarations and imports
      if (isHookName(resolvedName)) {
        return this.#getCustomHookType();
      } else {
        log(() => `Undefined global '${name}'`);
      }
    }
    return resolvedGlobal;
  }

  getPropertyType(
    receiver: Type,
    property: string
  ): BuiltInType | PolyType | null {
    let shapeId = null;
    if (receiver.kind === "Object" || receiver.kind === "Function") {
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
        loc: null,
        suggestions: null,
      });
      let value =
        shape.properties.get(property) ?? shape.properties.get("*") ?? null;
      if (value === null && isHookName(property)) {
        value = this.#getCustomHookType();
      }
      return value;
    } else if (isHookName(property)) {
      return this.#getCustomHookType();
    } else {
      return null;
    }
  }

  getFunctionSignature(type: FunctionType): FunctionSignature | null {
    const { shapeId } = type;
    if (shapeId !== null) {
      const shape = this.#shapes.get(shapeId);
      CompilerError.invariant(shape !== undefined, {
        reason: `[HIR] Forget internal error: cannot resolve shape ${shapeId}`,
        description: null,
        loc: null,
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

// From https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js#LL18C1-L23C2
export function isHookName(name: string): boolean {
  /*
   * if (__EXPERIMENTAL__) {
   *   return name === 'use' || /^use[A-Z0-9]/.test(name);
   * }
   */
  return /^use[A-Z0-9]/.test(name);
}

export function parseEnvironmentConfig(
  partialConfig: PartialEnvironmentConfig
): Result<EnvironmentConfig, ZodError<PartialEnvironmentConfig>> {
  const config = EnvironmentConfigSchema.safeParse(partialConfig);
  if (config.success) {
    return Ok(config.data);
  } else {
    return Err(config.error);
  }
}

export function validateEnvironmentConfig(
  partialConfig: PartialEnvironmentConfig
): EnvironmentConfig {
  const config = EnvironmentConfigSchema.safeParse(partialConfig);
  if (config.success) {
    return config.data;
  }

  CompilerError.throwInvalidConfig({
    reason: `${fromZodError(config.error)}`,
    description: "Update Forget config to fix the error",
    loc: null,
    suggestions: null,
  });
}

export function tryParseExternalFunction(
  maybeExternalFunction: any
): ExternalFunction {
  const externalFunction = ExternalFunctionSchema.safeParse(
    maybeExternalFunction
  );
  if (externalFunction.success) {
    return externalFunction.data;
  }

  CompilerError.throwInvalidConfig({
    reason: `${fromZodError(externalFunction.error)}`,
    description: "Update Forget config to fix the error",
    loc: null,
    suggestions: null,
  });
}
