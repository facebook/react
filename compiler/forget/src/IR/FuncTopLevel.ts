/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { FuncEnv } from "./Func";
import { HookCall } from "./Hook";
import { BindingVal, ExprVal, FreeVal, JSXTagVal, Ref, Val } from "./Val";

/**
 * IR Func Top Level
 */
export class FuncTopLevel {
  /**
   * Note that Babel treat Declaration <: Statement while ECMA-262 splits them:
   * StatementListItem: Declaration | Statement
   */
  ast: NodePath<t.Statement>;

  /**
   * Declaration:
   *   HoistableDeclaration
   *   ClassDeclaration
   *   LexicalDeclaration
   */
  isDecl: boolean;

  /**
   * Declarations.
   */
  decls: BindingVal[];

  /**
   * References to declarations.
   */
  refsToDecls: Ref<BindingVal>[];

  /**
   * References of free vars.
   */
  refsToFreeVars: Ref<FreeVal>[];

  /**
   * References of expressions.
   */
  refsToExprs: Ref<ExprVal>[];

  /**
   * Hook Calls.
   */
  hookCalls: HookCall[] = [];

  /**
   * JSX Tree Roots.
   */
  jsxTreeRoots: JSXTagVal[] = [];

  /**
   * Potential control flow exits.
   */
  returnStmts: Map<NodePath<t.ReturnStatement>, number> = new Map();

  includeFreeVars: boolean;

  constructor(stmt: NodePath<t.Statement>, funcEnv: FuncEnv) {
    this.ast = stmt;
    this.isDecl = stmt.isDeclaration();
    this.decls = funcEnv.getDeclsFrom(stmt);
    this.refsToDecls = funcEnv.getRefsToDeclsFrom(stmt);
    this.refsToFreeVars = funcEnv.getFreeVarsFrom(stmt);
    this.refsToExprs = [];
    this.includeFreeVars = funcEnv.includeFreeVars;
  }

  /**
   * All "uses" of {@link Val}.
   */
  get uses(): Ref<Val>[] {
    return [
      ...this.refsToDecls,
      ...this.refsToExprs,
      ...(this.includeFreeVars ? this.refsToFreeVars : []),
    ];
  }

  /**
   * All mutable uses. This needs to be lazy so it's computed after refinements.
   */
  get mutableUses(): Ref<Val>[] {
    return this.uses.filter((use) => !use.immutable);
  }

  /**
   * All defs. This needs to be lazy since it depends on {@link mutableUses}.
   */
  get defs(): Val[] {
    return [...this.decls, ...this.mutableUses.map((use) => use.val)];
  }
}
