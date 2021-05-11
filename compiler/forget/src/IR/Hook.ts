/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import { CompilerContext } from "../CompilerContext";
import { invariant } from "../CompilerError";
import type { Func, Name } from "./Func";
import { refineToHookRetVal, Val } from "./Val";

/**
 * IR Hook.
 *
 * {@link HookCall}: the compiler IR for "ret = useHook()" in source.
 * {@link Hook}: specifications for each hook.
 * {@link HookSig}: signatures for each hook.
 */

export type HookCallExpr = t.CallExpression | t.OptionalCallExpression;

/**
 * Hook Call.
 */
export class HookCall {
  // AST of the call.
  call: NodePath<HookCallExpr>;

  // The Hook resolved from the call.
  hook: Hook;

  /**
   * Return values.
   */
  unused_retVals: Map<Name, Val>;

  /**
   * To guarantee that the @param hook was resolved from the @param call. It's
   * recommmended to use {@link resolveHookCall} as a factory instead.
   */
  private constructor(call: NodePath<HookCallExpr>, hook: Hook) {
    this.call = call;
    this.hook = hook;
    this.unused_retVals = new Map();
  }

  /**
   * Using this static factory method can guarantee to @returns a new instance
   * with its internal {@link Hook} resolved from the @param call.
   */
  static resolve(
    call: NodePath<HookCallExpr>,
    onInvalidHookNamespace?: (
      expression: t.Expression,
      isBuiltinHook: boolean
    ) => void
  ): HookCall | undefined {
    const maybeHook = matchHookCall(call.node, onInvalidHookNamespace);
    return maybeHook && new HookCall(call, maybeHook);
  }

  matchRetVals(irFunc: Func, context: CompilerContext) {
    matchHookCallRetVals(this, irFunc, context);
  }

  toString() {
    let name = this.hook.name;
    if (isCustomHook(this.hook) && this.hook.isNamedLikeBuiltin) {
      name += "%custom";
    }
    return name;
  }
}

/**
 * @returns the specific {@link Hook} resolved from @param call ast
 * @throws if @param call ast is not hook.
 *
 * This is more favorable than {@link resolveHookCall} when there is no need
 * to allocate an instance of {@link HookCall}.
 */
export function matchHookCall(
  call: HookCallExpr,
  onInvalidHookNamespace?: (
    expression: t.Expression,
    isBuiltinHook: boolean
  ) => void
): Hook | undefined {
  const calleeNode = call.callee;
  return matchHookNode(calleeNode, onInvalidHookNamespace);
}

function matchHookNode(
  node: Node,
  onInvalidHookNamespace?: (
    expression: t.Expression,
    isBuiltinHook: boolean
  ) => void
): Hook | undefined {
  const isPascalCaseNameSpace = (ns: string) => /^[A-Z].*/.test(ns);

  // Base case: orphan identifier.
  if (t.isIdentifier(node)) {
    return matchHookName(node);
  }
  // Recursive case: within member expression.
  else if (
    (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) &&
    !node.computed
  ) {
    // Check substructure.
    let maybeHook = matchHookNode(node.property);
    if (!maybeHook) return undefined;

    // Following our ESLint plugin, lowercased namespaced hook-like call e.g.
    // `x.useHook`, `A.B.useHook` are considered as not hook.
    if (
      !(t.isIdentifier(node.object) && isPascalCaseNameSpace(node.object.name))
    ) {
      onInvalidHookNamespace?.(node.object, isBuiltinHook(maybeHook));
      return undefined;
    }

    // We need to double check the namespace to avoid being fooled
    // by cases e.g. `NonReact.useState`.
    const underReact =
      t.isIdentifier(node.object) &&
      node.object.name === "React" &&
      t.isIdentifier(node.property);

    if (underReact) {
      return maybeHook;
    }

    // Any other matches can only be qualified as custom hooks.
    return createCustomHook(maybeHook.name, true);
  }
  // Unknown pattern.
  else {
    return undefined;
  }
}

function matchHookName(ident: t.Identifier): Hook | undefined {
  if (!isHookLikeName(ident.name)) {
    return undefined;
  }

  // match with builtin hooks.
  switch (ident.name) {
    case "useState":
      return UseState;
    case "useReducer":
      return UseReducer;
    case "useContext":
      return UseContext;
    case "useRef":
      return UseRef;
    case "useEffect":
      return UseEffect;
    case "useLayoutEffect":
      return UseLayoutEffect;
    case "useCallback":
      return UseCallback;
    case "useMemo":
      return UseMemo;
    default:
      return createCustomHook(ident.name.slice(3));
  }
}

/**
 * Catch all identifiers that begin with "use" followed by an uppercase Latin
 * character to exclude identifiers like "user".
 */
export function isHookLikeName(name: string): boolean {
  // TODO: Deprecate `_` along with its deprecation in react-hooks eslint
  return /^_?use[A-Z0-9].*$/.test(name);
}

/**
 * Hook ("Spec")
 *
 * We will provide the "spec" of builtin hooks. In the future, we may allow
 * custom hooks to specify there properties (stateful, effectful) and signature
 * (referential stablity and mutability of returned values) through either
 * annotations, naming conventions, or {@link CompilerOptions}.
 */
export interface Hook {
  name: string;

  kind: HookKind;

  signature: HookSig;

  /**
   * Hooks that reflexively and transitively depends on builtin stateful hooks.
   * This is currently unused.
   */
  stateful: boolean;

  /**
   * Hooks that reflexively and transitively depends on builtin effectful hooks.
   * This is currently unused.
   */
  effectful: boolean;
}

export interface CustomHook extends Hook {
  isNamedLikeBuiltin: boolean;
}

export enum HookKind {
  // Custom Hooks.
  Custom = 0,

  // Builtin Hooks.
  UseState,
  UseReducer,
  UseContext,
  UseRef,
  UseEffect,
  UseLayoutEffect,
  UseCallback,
  UseMemo,
}

export function isBuiltinHook(hook: Hook) {
  return hook.kind > HookKind.Custom;
}

export function isCustomHook(hook: Hook): hook is CustomHook {
  return hook.kind === HookKind.Custom;
}

/**
 * Custom Hooks are hooks provided in the user space.
 *
 * Until we can tell from either cross-module analysis or user-provided spec,
 * we will have to assume the worst case scenarios where it's both stateful
 * and effectful.
 */
export function createCustomHook(
  name: string,
  isNamedLikeBuiltin = false
): CustomHook {
  return {
    name,
    isNamedLikeBuiltin,
    kind: HookKind.Custom,
    stateful: true,
    effectful: true,
    /**
     * Why is custom hook return values immutable?
     * @see https://my.workplace.com/groups/335063911811171/permalink/408024221181806/
     *
     * Tldr; even though mutating hook return values is allowed in today's React,
     * it's a bad pattern since it makes it unsafe for the custom hook to
     * memoize the return value: it's a quite broken contract.
     *
     * In Forget, we want to tighten up the cross-call immutable contract. That
     * being said, we should either bailout or make it a compiler error.
     *
     * TODO: error when mutating "wanted-immutable-but-actually-mutable" values.
     */
    signature: {
      retValues: {
        kind: "AnyPatternLike",
        forall: { immutable: true, stable: false },
      },
    },
  };
}

export const UseState: Hook = {
  name: "State",
  kind: HookKind.UseState,
  stateful: true,
  effectful: false,
  signature: {
    retValues: /* [state, setState] */ {
      kind: "ArrayPattern",
      self: { immutable: true, stable: false },
      elements: [
        { immutable: true, stable: false },
        { immutable: true, stable: true },
      ],
    },
  },
};

export const UseReducer: Hook = {
  name: "Reducer",
  kind: HookKind.UseReducer,
  stateful: true,
  effectful: false,
  signature: {
    retValues: /* [state, dispatch] */ {
      kind: "ArrayPattern",
      self: { immutable: true, stable: false },
      elements: [
        { immutable: true, stable: false },
        { immutable: true, stable: true },
      ],
    },
  },
};

export const UseContext: Hook = {
  name: "Context",
  kind: HookKind.UseContext,
  stateful: true,
  effectful: false,
  signature: {
    retValues: /* context value */ {
      kind: "AnyPatternLike",
      forall: { immutable: true, stable: false },
    },
  },
};

/**
 * How can ref be {@link IR.HookRetVal} while being mutable? Wouldn't it be
 * considered as {@link IR.InputVal}, which are supposed to be deeply immutable?
 *
 * Technically, `ref.current` shouldn't be read (i.e. unboxing the ref) in the
 * render phase, but there is nothing stops people from doing that yet. It's
 * also technically safe if the developers ensured `ref.current` is immutable.
 *
 * To minimize changes/surprises brought up to developers and existing codebase,
 * we'll therefore track `useRef` return values as inputs. The ref obj is marked
 * as stable but what inside `current` is not.
 *
 * TODO: in the future, we should add runtime check: if `ref.current` is read
 * in render and therefore becoming the inputs of cache key, we should generate
 * code (deeply?) `freeze` it on developer mode.
 *
 * @see https://fb.workplace.com/groups/335063911811171/permalink/380068057310756
 *
 */
export const UseRef: Hook = {
  name: "Ref",
  kind: HookKind.UseRef,
  stateful: false,
  effectful: false,
  signature: {
    retValues: /* ref object */ {
      kind: "ObjectPattern",
      self: { immutable: false, stable: true },
      properties: {
        current: { immutable: false, stable: false },
      },
    },
  },
};

export const UseEffect: Hook = {
  name: "Effect",
  kind: HookKind.UseEffect,
  stateful: false,
  effectful: true,
  signature: {
    retValues: {
      kind: "Void",
    },
  },
};

export const UseLayoutEffect: Hook = {
  name: "LayoutEffect",
  kind: HookKind.UseLayoutEffect,
  stateful: false,
  effectful: true,
  signature: {
    retValues: {
      kind: "Void",
    },
  },
};

export const UseCallback: Hook = {
  name: "Callback",
  kind: HookKind.UseCallback,
  stateful: false,
  effectful: false,
  signature: {
    retValues: /* memoized callback */ {
      kind: "AnyPatternLike",
      forall: {
        immutable: true,
        stable: false,
      },
    },
  },
};

export const UseMemo: Hook = {
  name: "Memo",
  kind: HookKind.UseMemo,
  stateful: false,
  effectful: false,
  signature: {
    retValues: /* memoized value */ {
      kind: "AnyPatternLike",
      forall: {
        immutable: true,
        stable: false,
      },
    },
  },
};

/**
 * React Hook Signature
 *
 * Currenly, only well-known patterns and only own properties are specifiable
 * (i.e. 1-level shallow equality). We may add supports to more sophicated
 * patterns e.g. AssignmentPattern or RestElement if they became common.
 */

type ValSig = Pick<Val, "immutable" | "stable">;

/**
 * Currently we only care about return values of hooks.
 *
 * In the future we may need parameters but for now they are all universally
 * treated as immutably borrowing.
 */
export type HookSig = {
  retValues: HookSigVariant;
};

type HookSigVariant = Void | AnyPatternLike | ArrayPattern | ObjectPattern;

type Void = {
  kind: "Void";
};

type AnyPatternLike = {
  kind: "AnyPatternLike";
  // this will apply to all bindings coming from any PatternLike
  forall: ValSig;
};

type ArrayPattern = {
  kind: "ArrayPattern";
  self: ValSig;
  elements: ValSig[];
};

type ObjectPattern = {
  kind: "ObjectPattern";
  self: ValSig;
  properties: Record<string, ValSig>;
};

function matchHookCallRetVals(
  hookCall: HookCall,
  irFunc: Func,
  context: CompilerContext
) {
  let lval: NodePath<t.LVal> | undefined = undefined;
  const parent = hookCall.call.parentPath;

  if (parent.isVariableDeclarator()) {
    // e.g. let a = useHook()
    lval = parent.get("id");
  } else if (parent.isExpressionStatement() || parent.isReturnStatement()) {
    // e.g. useHook()
    // e.g. return useHook()
    // We do not have any values assigned, so nothing to refine.
    return;
  }

  if (lval == null) {
    context.bailout("NonVarDeclHookCallParent", {
      code: "E0009",
      path: parent,
      context: { call: hookCall.call },
    });
    return;
  }

  const pattern = hookCall.hook.signature.retValues;
  switch (pattern.kind) {
    case "ArrayPattern":
      matchArrayPattern(pattern, lval, parent);
      break;
    case "AnyPatternLike":
      matchAnyPatternLike(pattern, lval);
      break;
    case "ObjectPattern":
      matchObjectPattern(pattern, lval, parent);
      break;
    case "Void":
      matchVoid(pattern, lval);
      break;
    default:
      assertExhaustive(pattern, `Unhandled pattern ${pattern}`);
  }

  function matchVoid(_pattern: Void, lvals: NodePath<t.LVal>) {
    if (lvals.isPatternLike()) {
      let callee = lvals.parentPath.get("init.callee");
      context.createDiagnostic({
        code: "E0007",
        path: lvals.parentPath,
        context: { callee },
      });
    }
  }

  function matchObjectPattern(
    pattern: ObjectPattern,
    lvals: NodePath<t.LVal>,
    parent: NodePath
  ) {
    // var/let/const {...} = ...
    if (lvals.isObjectPattern()) {
      const lvalsProps = lvals.get("properties");
      const patternProps = pattern.properties;
      lvalsProps.forEach((lvalsProp) => {
        const lvalsPropNode = lvalsProp.node;
        if (lvalsPropNode.type !== "ObjectProperty") return;
        if (!t.isIdentifier(lvalsPropNode.key)) return;
        if (!(lvalsPropNode.key.name in patternProps)) {
          const callee = parent.get("init.callee");
          context.createDiagnostic({
            code: "E0005",
            path: lvalsProp as NodePath<t.ObjectProperty>,
            context: { callee, key: lvalsPropNode.key.name },
          });
          return;
        }
        const sig = patternProps[lvalsPropNode.key.name];
        irFunc.env.getDeclsFrom(lvalsProp).forEach((val) => {
          refineToHookRetVal(val, hookCall, sig.immutable, sig.stable);
        });
      });
    }
    // var/let/const obj = ...
    else if (lvals.isIdentifier()) {
      irFunc.env.getDeclsFrom(lvals).forEach((val) => {
        refineToHookRetVal(
          val,
          hookCall,
          pattern.self.immutable,
          pattern.self.stable
        );
      });
    }
    // Unknown. Downgrade to the worst case.
    else {
      irFunc.env.getDeclsFrom(lvals).forEach((val) => {
        refineToHookRetVal(val, hookCall, false, false);
      });
    }
  }

  function matchAnyPatternLike(
    pattern: AnyPatternLike,
    lvals: NodePath<t.LVal>
  ) {
    if (lvals.isPatternLike()) {
      irFunc.env.getDeclsFrom(lvals).forEach((val) => {
        refineToHookRetVal(
          val,
          hookCall,
          pattern.forall.immutable,
          pattern.forall.stable
        );
      });
    }
    // Currenlty, the only non-PatternLike LVal are MemberExpression
    else {
      invariant(false, "Unreachable.");
    }
  }

  function matchArrayPattern(
    pattern: ArrayPattern,
    lvals: NodePath<t.LVal>,
    parent: NodePath
  ) {
    // var/let/const [...] = ...
    if (lvals.isArrayPattern()) {
      const lvalsEles = lvals.get("elements") as NodePath[];
      const patternEles = pattern.elements;
      lvalsEles.forEach((lvalsEle, n) => {
        if (n >= patternEles.length) {
          const callee = parent.get("init.callee");
          context.createDiagnostic({
            code: "E0006",
            path: lvalsEle,
            context: {
              callee,
              attemptedLength: lvalsEles.length,
              tupleLength: patternEles.length,
            },
          });
          return;
        }
        const eleSig = patternEles[n];
        irFunc.env.getDeclsFrom(lvalsEle).forEach((val) => {
          refineToHookRetVal(val, hookCall, eleSig.immutable, eleSig.stable);
        });
      });
    }
    // var/let/const arrObj = ...
    else if (lvals.isIdentifier()) {
      irFunc.env.getDeclsFrom(lvals).forEach((val) => {
        refineToHookRetVal(
          val,
          hookCall,
          pattern.self.immutable,
          pattern.self.stable
        );
      });
    }
    // Unknown. Downgrade to the worst case.
    else {
      irFunc.env.getDeclsFrom(lvals).forEach((val) => {
        refineToHookRetVal(val, hookCall, false, false);
      });
    }
  }
}
