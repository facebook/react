/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { CompilerError } from "../CompilerError";
import { ExternalFunction } from "../Entrypoint/Options";
import { log } from "../Utils/logger";
import {
  DEFAULT_GLOBALS,
  DEFAULT_SHAPES,
  Global,
  GlobalRegistry,
} from "./Globals";
import {
  BlockId,
  BuiltInType,
  Effect,
  FunctionType,
  IdentifierId,
  PolyType,
  Type,
  ValueKind,
  makeBlockId,
  makeIdentifierId,
} from "./HIR";
import {
  BuiltInMixedReadonlyId,
  DefaultMutatingHook,
  DefaultNonmutatingHook,
  FunctionSignature,
  ShapeRegistry,
  addHook,
} from "./ObjectShape";

export type Hook = {
  /**
   * The effect of arguments to this hook. Describes whether the hook may or may
   * not mutate arguments, etc.
   */
  effectKind: Effect;

  /**
   * The kind of value returned by the hook. Allows indicating that a hook returns
   * a primitive or already-frozen value, which can allow more precise memoization
   * of callers.
   */
  valueKind: ValueKind;

  /**
   * Specifies whether hook arguments may be aliased by other arguments or by the
   * return value of the function. Defaults to false. When enabled, this allows the
   * compiler to avoid memoizing arguments.
   */
  noAlias?: boolean;

  /**
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
  transitiveMixedData?: boolean;
};

// TODO(mofeiZ): User defined global types (with corresponding shapes).
// User defined global types should have inline ObjectShapes instead of directly
// using ObjectShapes.ShapeRegistry, as a user-provided ShapeRegistry may be
// accidentally be not well formed.
// i.e.
//   missing required shapes (BuiltInArray for [] and BuiltInObject for {})
//   missing some recursive Object / Function shapeIds

export type EnvironmentConfig = {
  customHooks: Map<string, Hook> | null;

  // 🌲
  enableForest: boolean;

  /**
   * Enable memoization of JSX elements in addition to other types of values. When disabled,
   * other types (objects, arrays, call expressions, etc) are memoized, but not known JSX
   * values.
   *
   * Defaults to true
   */
  memoizeJsxElements: boolean;

  /**
   * Enable validation of hooks to partially check that the component honors the rules of hooks.
   * When disabled, the component is assumed to follow the rules (though the Babel plugin looks
   * for suppressions of the lint rule).
   *
   * Defaults to false
   */
  validateHooksUsage: boolean;

  /**
   * Validate that ref values (`ref.current`) are not accessed during render.
   *
   * Defaults to false
   */
  validateRefAccessDuringRender: boolean;

  /**
   * Validate that mutable lambdas are not passed where a frozen value is expected, since mutable
   * lambdas cannot be frozen. The only mutation allowed inside a frozen lambda is of ref values.
   *
   * Defaults to false
   */
  validateFrozenLambdas: boolean;

  /**
   * Validates that setState is not unconditionally called during render, as it can lead to
   * infinite loops.
   *
   * Defaults to false
   */
  validateNoSetStateInRender: boolean;

  /**
   * Enable inlining of `useMemo()` function expressions so that they can be more optimally
   * compiled.
   *
   * Defaults to false
   */
  inlineUseMemo: boolean;

  /**
   * When enabled, the compiler assumes that hooks follow the Rules of React:
   * - Hooks may memoize computation based on any of their parameters, thus
   *   any arguments to a hook are assumed frozen after calling the hook.
   * - Hooks may memoize the result they return, thus the return value is
   *   assumed frozen.

   * Defaults to false
   */
  enableAssumeHooksFollowRulesOfReact: boolean;

  /**
   * When enabled, removes *all* memoization from the function: this includes
   * removing manually added useMemo/useCallback as well as not adding Forget's
   * usual useMemoCache-based memoization.
   *
   * Defaults to false (ie, by default memoization is enabled)
   */
  disableAllMemoization: boolean;

  /**
   * Enables codegen mutability debugging. This emits a dev-mode only to log mutations
   * to values that Forget assumes are immutable (for Forget compiled code).
   * For example:
   *  emitFreeze: {
   *    source: 'ReactForgetRuntime',
   *    importSpecifierName: 'makeReadOnly',
   *  }
   *
   * produces:
   *  import {makeReadOnly} from 'ReactForgetRuntime';
   *
   *  function Component(props) {
   *    if (c_0) {
   *      // ...
   *      $[0] = __DEV__ ? makeReadOnly(x) : x;
   *    } else {
   *      x = $[0];
   *    }
   *  }
   */
  enableEmitFreeze: ExternalFunction | null;

  /**
   * Enable merging consecutive scopes that invalidate together.
   *
   * Defaults to false.
   */
  enableMergeConsecutiveScopes: boolean;

  /**
   * Enable validation of mutable ranges
   *
   * Defaults to false
   */
  assertValidMutableRanges: boolean;

  /**
   * Instead of handling holey arrays, bail out with a TODO error.
   * 
   * Older versions of babel seem to have inconsistent handling of holey arrays,
   * at least when paired with HermesParser. When using these versions, we should
   * bail out instead of throwing a Babel validation error.

   * The babel ast definition for array elements changed from Array<PatternLike>
   * to Array<PatternLike | null>. Older versions does not expect null in the
   * ArrayPattern ast and will throw a validation error.
   * 
   * - HermesParser will parse [, b] into [NodePath<null>, NodePath<Identifier>]
   * - Forget will try to preserve this holey array when we codegen back to js
   *   (e.g. we call a babel builder function arrayPattern([null, identifier]))
   * - Babel will fail with `TypeError: Property elements[0] of ArrayPattern 
   *   expected node to be of a type ["PatternLike"] but instead got null`
   * 
   * PR that changed the AST definition
   * https://github.com/babel/babel/pull/10917/files#diff-19b555d2f3904c206af406540d9df200b1e16befedb83ff39ebfcbd876f7fa8aL52-R56
   */
  bailoutOnHoleyArrays: boolean;
};

const DEFAULT_ENVIRONMENT_CONFIG: Readonly<EnvironmentConfig> = {
  customHooks: null,

  memoizeJsxElements: true,
  inlineUseMemo: true,
  validateHooksUsage: true,

  assertValidMutableRanges: false,
  bailoutOnHoleyArrays: false,
  disableAllMemoization: false,
  enableAssumeHooksFollowRulesOfReact: false,
  enableEmitFreeze: null,
  enableForest: false,
  enableMergeConsecutiveScopes: false,

  validateFrozenLambdas: false,
  validateNoSetStateInRender: false,
  validateRefAccessDuringRender: false,
};

function isEnvironmentConfigKey(key: string): key is keyof EnvironmentConfig {
  return Object.prototype.hasOwnProperty.call(DEFAULT_ENVIRONMENT_CONFIG, key);
}

export type PartialEnvironmentConfig = Partial<EnvironmentConfig>;

export class Environment {
  #globals: GlobalRegistry;
  #shapes: ShapeRegistry;
  #nextIdentifer: number = 0;
  #nextBlock: number = 0;
  config: EnvironmentConfig;

  #contextIdentifiers: Set<t.Identifier>;
  #hoistedIdentifiers: Set<t.Identifier>;

  constructor(
    partialConfig: PartialEnvironmentConfig | null,
    contextIdentifiers: Set<t.Identifier>
  ) {
    this.#shapes = new Map(DEFAULT_SHAPES);
    const config: EnvironmentConfig = { ...DEFAULT_ENVIRONMENT_CONFIG };
    if (partialConfig != null) {
      for (const key of Object.keys(DEFAULT_ENVIRONMENT_CONFIG)) {
        if (!isEnvironmentConfigKey(key)) {
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(partialConfig, key)) {
          config[key] = partialConfig[key] as any; // we know the key is present from hasOwnProperty
        }
      }
    }
    this.config = config;

    if (this.config.customHooks != null && this.config.customHooks.size > 0) {
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
          addHook(this.#shapes, [], {
            positionalParams: [],
            restParam: hook.effectKind,
            returnType: hook.transitiveMixedData
              ? { kind: "Object", shapeId: BuiltInMixedReadonlyId }
              : { kind: "Poly" },
            returnValueKind: hook.valueKind,
            calleeEffect: Effect.Read,
            hookKind: "Custom",
            noAlias: hook.noAlias ?? false,
          })
        );
      }
    } else {
      this.#globals = DEFAULT_GLOBALS;
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

  isContextIdentifier(node: t.Identifier): boolean {
    return this.#contextIdentifiers.has(node);
  }

  isHoistedIdentifier(node: t.Identifier): boolean {
    return this.#hoistedIdentifiers.has(node);
  }

  getGlobalDeclaration(name: string): Global | null {
    let resolvedGlobal: Global | null = this.#globals.get(name) ?? null;
    if (resolvedGlobal === null) {
      // Hack, since we don't track module level declarations and imports
      if (isHookName(name)) {
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
      // If an object or function has a shapeId, it must have been assigned
      // by Forget (and be present in a builtin or user-defined registry)
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
function isHookName(name: string): boolean {
  // if (__EXPERIMENTAL__) {
  //   return name === 'use' || /^use[A-Z0-9]/.test(name);
  // }
  return /^use[A-Z0-9]/.test(name);
}
