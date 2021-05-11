/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as IR from "../IR";

/**
 * The Memoization Cache, or MemoCache.
 *
 * This is the compile-time abstraction device of the runtime memoCache that
 * we'll allocate from `React.useMemoCache` hooks for each React functions.
 */

export enum EntryKind {
  Fixed = "FIXED",
  Reactive = "REACTIVE",
  Local = "LOCAL",
  Expr = "EXPR",
}

/**
 * MemoCache entries are allocated in the {@link MemoCacheAlloc} pass.
 * They are tagged union of three kinds:
 */
export interface Entry {
  kind: EntryKind;
  value: IR.Val | Symbol;
  index: number;
}

/**
 * 0. fixed overhead.
 */
export interface FixedEntry extends Entry {
  kind: EntryKind.Fixed;
  value: Symbol;
}

/**
 * 1. used to cache every reactive values.
 */
export interface ReactiveEntry extends Entry {
  kind: EntryKind.Reactive;
  value: IR.ReactiveVal;
}

/**
 * 2. used to cache intermediate non-reactive local bindings.
 */
export interface LocalEntry extends Entry {
  kind: EntryKind.Local;
  value: IR.BindingVal;
}

/**
 * 3. used to cache intermediate (inlined) expressions.
 */
export interface ExprEntry extends Entry {
  kind: EntryKind.Expr;
  value: IR.ExprVal;
}

export const isReactiveEntry = (entry: Entry): entry is ReactiveEntry =>
  entry.kind === EntryKind.Reactive;

export const isLocalEntry = (entry: Entry): entry is LocalEntry =>
  entry.kind === EntryKind.Local;

export const isExprEntry = (entry: Entry): entry is ExprEntry =>
  entry.kind === EntryKind.Expr;

export const isFixedEntry = (entry: Entry): entry is FixedEntry =>
  entry.kind === EntryKind.Fixed;

export type EntryKey = IR.Val | Symbol;

export const BAD_INDEX = -1;

const retValSym = Symbol.for("ret");
const retIdxSym = Symbol.for("ret_idx");

/**
 * A compilation environment is a fancy way to say a bookkeeping that associates
 * part of the program (in this case, `props`, `state` variables and `refs`) to
 * some compile-time metadata (in this case, the memoCache {@link Entry}).
 */
export class MemoCache {
  /**
   * The underlying entries of the environment
   */
  entries: Map<EntryKey, Entry>;
  retValPos: number | null;
  retIdxPos: number | null;

  constructor() {
    this.entries = new Map();
    this.retValPos = null;
    this.retIdxPos = null;
  }

  get size() {
    return this.entries.size;
  }

  alloc(key: EntryKey, entry: Entry) {
    this.entries.set(key, entry);
  }

  allocRetVal() {
    const entry: FixedEntry = {
      kind: EntryKind.Fixed,
      value: retValSym,
      index: BAD_INDEX,
    };
    this.alloc(retValSym, entry);
  }

  allocRetIdx() {
    const entry: FixedEntry = {
      kind: EntryKind.Fixed,
      value: retIdxSym,
      index: BAD_INDEX,
    };
    this.alloc(retIdxSym, entry);
  }

  allocReactive(val: IR.ReactiveVal) {
    const entry: ReactiveEntry = {
      kind: EntryKind.Reactive,
      value: val,
      index: BAD_INDEX,
    };
    this.alloc(val, entry);
  }

  allocLocal(val: IR.BindingVal) {
    const entry: LocalEntry = {
      kind: EntryKind.Local,
      value: val,
      index: BAD_INDEX,
    };
    this.alloc(val, entry);
  }

  allocExpr(val: IR.ExprVal) {
    const entry: ExprEntry = {
      kind: EntryKind.Expr,
      value: val,
      index: BAD_INDEX,
    };
    this.alloc(val, entry);
  }

  /**
   * Optimizations over LIR have freedom to manipulate the {@link entries} and
   * during that process index may change.
   *
   * This function is intended to be called right before code generation to
   * finalize the index in codegen.
   */
  finializeIndices(this: MemoCache) {
    [...this.entries.values()].forEach((entry, index) => {
      entry.index = index;
    });
    this.retValPos = this.entries.get(retValSym)?.index ?? null;
    this.retIdxPos = this.entries.get(retIdxSym)?.index ?? null;
  }
}

export function createMemoCache(): MemoCache {
  return new MemoCache();
}
