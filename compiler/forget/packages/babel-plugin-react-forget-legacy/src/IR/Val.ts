/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Binding, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { dumpNode, dumpNodeLoc } from "../Common/Dumper";
import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import { isAllocatingExpr } from "./babel-utils";
import { HookCall } from "./Hook";
import { JSXTag } from "./JSX";
import { ValSnapshot } from "./ValSnapshot";

/**
 * Val Kind.
 * N.B. It's an numeric enum and we relied on comparsion for classification.
 */
export enum ValKind {
  // (Deeply) Immutable Binding
  Param, // Props and Hook args are immutable so they are safe to be cache key.
  HookRet, // Hook return value are immutable so they are safe to be memoized.
  DerivedImmut, // Values derived from other immutables are therefore immutable.

  // Mutable (New) Binding
  MutableNew,

  // Unknown Binding
  Unknown,

  // Free Variable
  Free,

  // Expression
  Expr,
  JSXTag,
}

export function isBindingVal(val: Val): val is BindingVal {
  return val.kind <= ValKind.Unknown;
}

export function isHookRetVal(val: Val): val is HookRetVal {
  return val.kind === ValKind.HookRet;
}

export function isDerivedImmutVal(val: Val): val is DerivedImmutVal {
  return val.kind === ValKind.DerivedImmut;
}

export function isFreeVal(val: Val): val is FreeVal {
  return val.kind === ValKind.Free;
}

export function isExprVal(val: Val): val is ExprVal {
  return val.kind >= ValKind.Expr;
}

export function isJSXTagVal(val: Val): val is JSXTagVal {
  return val.kind === ValKind.JSXTag;
}

/**
 * Reactive Values and Input Values.
 *
 * These are {@link BindingVal} that are special to React semantics.
 * 1. Conceptually, they are either React states or derivations of states
 *    (including props, hook return values, and their further derivations). They
 *    are required to be deeply immutable during a rendering, so that their
 *    referential identity can be used to approximate if there was a update.
 * 2. Analysis-wise, they are the roots of all variations of {@link DepGraph}.
 *    Specifically, they are the set of values that {@link DepsReduction} pass
 *    aimed to reduce every other vertcies to depend and _only_ depend on.
 * 3. Runtime-wise, they are always recomputed; diffed; and cached in the
 *    generated code. Most interestingly, they are the sources of reactivity,
 *    or, speaking in terms of memoization, they form the cache key.
 *
 * The differences between {@link InputVal} and {@link ReactiveVal} is minimal
 * and is only relevant as an implementation details, where ReactiveVal is
 * defined as every InputVal that is NOT stable so they can be omitted from the
 * analysis and code generation, e.g. we don't need to diff and cache `setState`
 * since it's stable and owned by React.
 *
 * Programming model per-se, one may just say "Props and state aren’t the only
 * reactive values. Values that you calculate from them are also reactive."
 * (https://beta.reactjs.org/learn/lifecycle-of-reactive-effects#all-variables-declared-in-the-component-body-are-reactive),
 * Where "stable reactive values" like `setState` were just optimized.
 */
export interface InputVal extends BindingVal {}
export interface ReactiveVal extends InputVal {}

export function isInputVal(val: Val): val is InputVal {
  return val.kind <= ValKind.DerivedImmut;
}

export function isReactiveVal(val: Val): val is ReactiveVal {
  return isInputVal(val) && !val.stable;
}

export function formatValKind(val: Val): string {
  switch (val.kind) {
    case ValKind.Param:
      return "Param";
    case ValKind.HookRet:
      invariant(isHookRetVal(val), "");
      return `${val.hookCall}`;
    case ValKind.DerivedImmut:
      invariant(isDerivedImmutVal(val), "");
      // Only prepend the derivation sign (~) once.
      let fromFmt = formatValKind(val.from);
      return fromFmt.startsWith("~") ? fromFmt : `~${fromFmt}`;
    case ValKind.MutableNew:
      return `MutableNew`;
    case ValKind.Unknown:
      return "Unknown";
    case ValKind.Free:
      return "Free";
    case ValKind.Expr:
      return "Expr";
    case ValKind.JSXTag:
      return "JSX";
    default:
      assertExhaustive(val.kind, `Unhandled val ${val}`);
  }
}

type ValNode<Val> = Val extends BindingVal
  ? t.Node
  : Val extends FreeVal
  ? t.Identifier
  : Val extends JSXTagVal
  ? JSXTag
  : t.Expression;

type ValAST<V extends Val> = {
  hasMutated: boolean;
  unsafePath: NodePath<ValNode<V>>;
  path: NodePath<ValNode<V>>;
  replaceWith: NodePath["replaceWith"];
};

/**
 * A proxy to Babel's AST so path access is guarded against mutation.
 */
function createValAST<V extends Val>(path: NodePath<ValNode<V>>): ValAST<V> {
  let hasMutated = false;
  return {
    hasMutated,
    unsafePath: path,
    get path() {
      invariant(!hasMutated, "Access path after it's mutated.");
      return path;
    },
    replaceWith(replacement) {
      hasMutated = true;
      return path.replaceWith(replacement);
    },
  };
}

/**
 * IR Value.
 *
┌──────────────┬───────────────────────┬─────────────────┐
│    IR.Val    │       immutable       │     mutable     │
├──────────────┼───────────────────────┼─────────────────┤
│    stable    │  useState, dispatch   │     ref obj     │
├──────────────┼───────────────────────┼─────────────────┤
│   unstable   │ prop, state, hook arg │  anything else  │
└──────────────┴───────────────────────┴─────────────────┘
 */
export interface Val {
  kind: ValKind;

  ast: ValAST<Val> | undefined;

  // Whether or not this value is immutable.
  immutable: boolean;

  // Whether or not the identity of this value is stable across re-renders.
  // N.B. for ExprVal, it is describing whether or not the expression itself
  // creating unstable value, e.g. `c ? x : y` is a stable ExprVal that returns
  // unstable values like `x` and `y`, which is likely pre-memoized.
  stable: boolean;

  // Reference Record.
  // Val owns its Ref.
  references: Map<NodePath, Ref<Val>>;

  getFormatedProperties(): string;
  getFormatedProperties(immutable: boolean): string;

  toString(): string;
  toString(immutable: boolean): string;

  toLoc(): string;

  toJSON(): object;

  snapshot(): ValSnapshot;
}

export interface BindingVal extends Val {
  ast: ValAST<BindingVal>;
  binding: Binding;
  references: Map<RefPath<BindingVal>, Ref<BindingVal>>;

  /**
   * Refine value kinds and properties without changing its identity.
   */
  refineTo(kind: ValKind, immutable?: boolean, stable?: boolean): void;
}

export interface HookRetVal extends BindingVal {
  kind: ValKind.HookRet;
  hookCall: HookCall;
}

export interface DerivedImmutVal extends BindingVal {
  kind: ValKind.DerivedImmut;
  from: InputVal;
}

export interface FreeVal extends Val {
  name: string;
  ast: undefined;
  references: Map<RefPath<FreeVal>, Ref<FreeVal>>;
  reference(refPath: RefPath<FreeVal>): Ref<FreeVal>;
}

export interface ExprVal extends Val {
  ast: ValAST<ExprVal>;
  references: Map<NodePath, Ref<ExprVal>>;
  getRef(): Ref<ExprVal>;
}

export interface JSXTagVal extends ExprVal {
  kind: ValKind.JSXTag;
  ast: ValAST<JSXTagVal>;
  getRef(): Ref<JSXTagVal>;
  children: ExprVal[];
  isUnsafeToMemo: boolean;
}

/**
 * N.B. it's more common a value is @param immutable over @param stable.
 */
export function createBindingVal(
  binding: Binding,
  kind: ValKind = ValKind.Unknown,
  immutable = false,
  stable = false
): BindingVal {
  const newVal: BindingVal = {
    binding,
    kind,
    ast: createValAST<BindingVal>(binding.path),
    immutable,
    stable,
    references: new Map<RefPath<BindingVal>, Ref<BindingVal>>(),
    refineTo(
      this: BindingVal,
      kind: ValKind,
      immutable = this.immutable,
      stable = this.stable
    ): void {
      this.kind = kind;
      this.immutable = immutable;
      this.stable = stable;
    },
    getFormatedProperties(
      this: BindingVal,
      immutable: boolean = this.immutable
    ) {
      return formatValProperties(this, immutable);
    },
    toString(this: BindingVal, immutable: boolean = this.immutable) {
      const name = this.binding.identifier.name;
      const tracked = isReactiveVal(this) ? "$" : "";
      const anno = this.getFormatedProperties(immutable);
      const annoFmt = anno[anno.length - 1] === "_" ? anno : `${anno} `;

      return `${annoFmt}${tracked}${name}`.trimStart();
    },
    toLoc(this: BindingVal) {
      return dumpNodeLoc(this.ast.path.node);
    },
    toJSON() {
      return {
        kind: this.binding.kind,
        identifier: this.binding.identifier.name,
        referenced: this.binding.referenced,
        references: this.binding.references,
        constant: this.binding.constant,
      };
    },
    snapshot(this: BindingVal) {
      return new ValSnapshot(this);
    },
  };

  /**
   * Babel doesn't consider LHS of Assignment as {@link Binding.referencePaths}
   * because they are "write" rather than "read". Instead, "write" are put under
   * {@link Binding.constantViolations}.
   *
   * @see https://github.com/babel/babel/issues/11313
   *
   * Our notion of {@link IR.Ref} are canonical symbol references so we need
   * to collect both reads and writes.
   */
  for (const ref of binding.referencePaths) {
    if (ref.isIdentifier() || ref.isJSXIdentifier()) {
      if (!t.isObjectPattern(ref.parentPath.parentPath)) {
        // Older version of babel marks `FOO` in `{x: FOO}` as reference (https://github.com/babel/babel/pull/9492/)
        newVal.references.set(ref, createRef<BindingVal>(ref, newVal));
      }
    } else {
      invariant(false, `Babel bindings can only be referenced by identifiers`);
    }
  }

  // This is considered the single source of truth of our notion of "Reference"
  // since it performs the strictest check by far until may be
  // https://github.com/babel/babel/issues/14771 is fixed.
  for (const write of binding.constantViolations) {
    invariant(
      write.isAssignmentExpression() ||
        write.isUpdateExpression() ||
        write.isForInStatement() ||
        write.isForOfStatement(),
      `Unexpected node type for binding update: %s`,
      write.type
    );

    let path: NodePath = write;
    if (write.isAssignmentExpression()) path = write.get("left");

    if (path.isIdentifier()) {
      newVal.references.set(
        path,
        createRef<BindingVal>(path, newVal, RefKind.Reassign)
      );
    } else {
      path.traverse({
        Identifier(ref) {
          if (ref.node.name === binding.identifier.name) {
            newVal.references.set(
              ref,
              createRef<BindingVal>(ref, newVal, RefKind.Reassign)
            );
          }
        },
      });
    }
  }

  return newVal;
}

export function refineToHookRetVal(
  val: BindingVal,
  hookCall: HookCall,
  immutable: boolean = val.immutable,
  stable: boolean = val.stable
): HookRetVal {
  val.refineTo(ValKind.HookRet, immutable, stable);
  invariant(isHookRetVal(val), "");
  val.hookCall = hookCall;
  return val;
}

export function refineToDerivedImmutVal(
  val: BindingVal,
  from: InputVal,
  immutable: boolean = val.immutable,
  stable: boolean = val.stable
): DerivedImmutVal {
  val.refineTo(ValKind.DerivedImmut, immutable, stable);
  invariant(isDerivedImmutVal(val), "");
  val.from = from;
  return val;
}

/**
 * React requires no existence of global shared mutable states, therefore all
 * free vars are assumed to be stable and immutable.
 *
 * That being said, by including this analysis into the system we may
 * conservatively refine some of them to be mutable in a case-by-case manner.
 */
export function createFreeVal(
  name: string,
  kind: ValKind = ValKind.Free,
  immutable = false,
  stable = true
): FreeVal {
  const newVal: FreeVal = {
    kind,
    ast: undefined,
    immutable,
    stable,
    name,
    references: new Map<RefPath<FreeVal>, Ref<FreeVal>>(),
    reference(this: FreeVal, refPath: RefPath<FreeVal>): Ref<FreeVal> {
      const ref = createRef<FreeVal>(refPath, this, RefKind.Unknown);
      this.references.set(refPath, ref);
      return ref;
    },
    getFormatedProperties(this: FreeVal, immutable: boolean = this.immutable) {
      return formatValProperties(this, immutable);
    },
    toString(this: FreeVal) {
      return `${this.getFormatedProperties()}${this.name}`;
    },
    toLoc(this: FreeVal) {
      return "free";
    },
    toJSON() {
      return {};
    },
    snapshot(this: FreeVal) {
      return new ValSnapshot(this);
    },
  };
  return newVal;
}

export function createExprVal(
  expr: NodePath<t.Expression>,
  kind: ValKind = ValKind.Expr,
  immutable = false,
  stable?: boolean
): ExprVal {
  if (typeof stable === "undefined") {
    stable = !isAllocatingExpr(expr);
  }

  const newVal = {
    ast: createValAST(expr),
    kind,
    immutable,
    stable,
    references: new Map(),
    getRef(): Ref<ExprVal> {
      return ref;
    },
    getFormatedProperties(this: ExprVal, immutable = this.immutable) {
      return formatValProperties(this, immutable);
    },
    toString(this: ExprVal, immutable = this.immutable) {
      const anno = this.getFormatedProperties(immutable);
      const annoFmt = anno[anno.length - 1] === "_" ? anno : `${anno} `;
      const str = dumpNode(this.ast.path.node);
      return `${annoFmt}${str}`;
    },
    toLoc(this: ExprVal) {
      return dumpNodeLoc(this.ast.path.node);
    },
    toJSON(this: ExprVal): any {
      const key = this.toString();
      if (isJSXTagVal(this)) {
        return {
          [key]: this.children.map((child) => child.toJSON()),
        };
      } else {
        return key;
      }
    },
    snapshot(this: ExprVal) {
      return new ValSnapshot(this);
    },
  };

  // expressions has only one reference which is itself.
  const ref = createRef<ExprVal>(expr, newVal);
  newVal.references.set(expr, ref);

  return newVal;
}

export function createJSXTagVal(expr: NodePath<JSXTag>): JSXTagVal {
  const jsxTagVal = createExprVal(expr, ValKind.JSXTag, true, false);
  invariant(isJSXTagVal(jsxTagVal), "");

  jsxTagVal.children = [];
  jsxTagVal.isUnsafeToMemo = false;
  return jsxTagVal;
}

/**
 * References to IR Value
 *
 * Creation of shared references are known as "borrowing". N.B. we are not
 * trying to formally formalize ownership here due to the shared and mutable
 * nature of JavaScript references, but we are designing with them in mind:
 *
 * 1. Immutable vals can't be borrowed as mutable, e.g. `unknown(prop)`. But
 * instead of erroring like Rust, we'll just assume `unknown` will only borrow
 * `prop` immutably, and eventually resulted in an immutable ref. This is
 * partially guranteed by React `freeze(prop)` in DEV (which doesn't work for
 * variables destructured from the props object though).
 *
 * 2. Mutable vals can not be mutated when it's immutably borrowed. when a value
 * is passing to JSX/Hook, we'll treat it as if the value is moved and owned by
 * React, and later references are considered as immutable borrowes. Forget may
 * generate `freeze(val)` in DEV to help guard this.
 *
 * The mutability of the "borrowing" itself is denoted by {@link RefKind}, while
 * the eventual mutablity of the resultant references are denoted via a getter
 * {@field immutable}.
 *
 * The overall strategy (@see BodyAnalysis) is that:
 * - Everything is started as Unknown which can either be assumed as mutable
 *   (the current optimistic default) or immutable (if pessmestic).
 * - Refine identifier refs directly flowed into JSX and Hook as Freeze.
 * - Refine refs reassign-ed (from Binding.constantViolations) as Reassign.
 * - Refine all refs under certain syntactical position (e.g. MemberExpr.object,
 *   CallExpr.argument) conservatively as Borrow
 */

export enum RefKind {
  // Immutable
  Freeze,

  // Unknown
  Unknown,

  // Mutable
  Reassign,
  Borrow,
  MutBorrow,
}

type RefPath<Val> = Val extends BindingVal
  ? NodePath<t.Identifier | t.JSXIdentifier>
  : Val extends FreeVal
  ? NodePath<t.Identifier>
  : Val extends JSXTagVal
  ? NodePath<JSXTag>
  : NodePath<t.Expression>;

export interface Ref<V extends Val> {
  kind: RefKind;

  val: V;

  path: RefPath<V>;

  // Whether or not this reference is immutable.
  // We can only create immutable reference on immutable value.
  get immutable(): boolean;

  /**
   * Refine value ref kind and properties without changing its identity.
   */
  refineTo(kind: RefKind): void;

  getFormatedProperties(): string;
  toString(): string;
}

export function createRef<V extends Val>(
  path: RefPath<V>,
  val: V,
  kind = RefKind.Unknown
): Ref<V> {
  return {
    path,
    val,
    kind,
    get immutable() {
      switch (this.kind) {
        case RefKind.Freeze:
          return true;
        case RefKind.Reassign:
        case RefKind.Borrow:
          return this.val.immutable;
        case RefKind.MutBorrow:
          return false;
        case RefKind.Unknown:
          return true;
        default:
          assertExhaustive(this.kind, `Unhandled Ref ${this}`);
      }
    },
    refineTo(kind: RefKind) {
      this.kind = kind;
    },
    getFormatedProperties(this: Ref<V>) {
      // Override val's mutabiliy formatting to the ref's mutability.
      return `&${this.val.getFormatedProperties(this.immutable)}`;
    },
    toString(this: Ref<V>) {
      // Override val's mutabiliy formatting to the ref's mutability.
      return `&${this.val.toString(this.immutable)}`;
    },
  };
}

/**
 * @return properties shared by all {@link Val} formatted, with the
 * @param immutable overriable conveniently for {@link Ref}.
 *
 * This is used by {@link PrettyPrinter} to annotate source with comments.
 */
function formatValProperties(val: Val, immutable = val.immutable) {
  const kind = val.kind !== ValKind.Unknown && formatValKind(val);
  const stable = !isExprVal(val) && val.stable && "_";
  const mut = !immutable && "mut";

  return [mut, kind, stable].filter(Boolean).join(" ");
}
