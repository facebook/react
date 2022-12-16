/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Binding, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { invariant } from "../CompilerError";
import * as DepGraph from "../DepGraph";
import * as BabelUtils from "./babel-utils";
import { FuncTopLevel } from "./FuncTopLevel";
import {
  BindingVal,
  createBindingVal,
  createFreeVal,
  ExprVal,
  FreeVal,
  Ref,
  ValKind,
} from "./Val";

/**
 * IR Function.
 */
export class Func {
  name: Name;

  ast: NodePath<BabelUtils.NonMethodFunction>;

  kind: FuncKind;

  paramKind: FuncParamKind;

  get params(): BindingVal[] {
    return [...this.env.decls.values()].filter((v) => v.kind === ValKind.Param);
  }

  // FunctionBody: FunctionStatementList: StatementListItem
  body: FuncTopLevel[] = [];

  /**
   * Number of return statements. Does not count a potential implicit return at
   * the end of the function.
   */
  returnCount: number = 0;

  isImplicitReturn: boolean = true;

  env: FuncEnv;

  depGraph: DepGraph.ValGraph;

  constructor(
    ast: NodePath<BabelUtils.NonMethodFunction>,
    name: Name = undefined,
    kind: FuncKind = FuncKind.Unknown,
    localMutationThroughFreeVars: boolean = false
  ) {
    this.name = name;
    this.ast = ast;
    this.kind = kind;
    this.paramKind = FuncParamKind.NonSimple;
    this.env = new FuncEnv(this, localMutationThroughFreeVars);
    this.depGraph = new DepGraph.ValGraph(this.env);
  }
}

/**
 * Fucntion Environments
 */
export class FuncEnv {
  /**
   * Its belonging IR function.
   */
  func: Func;

  /**
   * If the environment includes free vars.
   */
  includeFreeVars: boolean;

  /**
   * Declarative Bindings (Top-level).
   *
   * This correpondences to the "Function Environment Records" in ECMA-262,
   * which is used to represent the top-level scope of a function, and contains
   * bindings for the top-level declarations within that function.
   *
   * @see https://tc39.es/ecma262/#sec-function-environment-records
   */
  decls: Map<Name, BindingVal>;

  /**
   * Expressions.
   *
   * This is used to represent expressions occurred within this function that
   * could be interesting to the compiler optimizations, e.g. common
   * sub-expressions that could be lifted/treated as declarations.
   */
  exprs: Map<NodePath<t.Expression>, ExprVal>;

  /**
   * Free Variables
   *
   * This correpondences to the `[[OuterEnv]]` of the "Function Environment
   * Records" (i.e. the [[Environment]]` slot of the instantiated
   * "ECMAScript Function Objects") AND all the "Environment Records" that are
   * transitively accesible through the `[[OuterEnv]]` slot.
   *
   * It is used to represent the acumulation of all the outer environments of
   * the function, and contains all the free variables closed over.
   *
   * @see https://tc39.es/ecma262/#sec-ecmascript-function-objects
   */
  freeVars: Map<Name, FreeVal>;

  constructor(func: Func, includeFreeVars: boolean) {
    this.func = func;
    this.includeFreeVars = includeFreeVars;

    /**
     * Add all own bindings from @param scope as default-kinded {@link Val}.
     * To ensure their identity being stable, it's critical that they are only
     * created once here and later analysis should look them up from here and
     * refine their properties via {@link Val.refineTo} which mutates.
     */
    this.decls = new Map(
      Object.entries(func.ast.scope.bindings).map(([name, binding]) => [
        name,
        createBindingVal(binding),
      ])
    );

    /**
     * TODO: exprs are currently populated during {@link RefKindInfer} when
     * iterating over the JSX tree which basically use this as a cache. We
     * should consider splitting the initialization and the analysis, despite
     * that means we have to do it in two AST passes.
     */
    this.exprs = new Map();

    /**
     * Add all free bindings referenced from @param scope as {@link FreeVal}.
     */
    this.freeVars = new Map();
    if (this.includeFreeVars) {
      for (const refIdent of this.#getFuncOuterScopedReferences(func.ast)) {
        const name = refIdent.node.name;
        let val = this.freeVars.get(name);
        if (!val) {
          val = createFreeVal(name);
          this.freeVars.set(name, val);
        }
        val.reference(refIdent);
      }
    }
  }

  /**
   * @returns RF-level bindings created by @param path.
   */
  #getFuncScopedBindings(path: NodePath): Binding[] {
    return BabelUtils.getScopedBindings(path, this.func.ast.scope);
  }

  /**
   * @returns identifiers referencing above-RF-level bindings under @param path.
   */
  #getFuncOuterScopedReferences(path: NodePath): NodePath<t.Identifier>[] {
    return BabelUtils.getOuterScopedReferences(path, this.func.ast.scope);
  }

  /**
   * @returns identifiers referencing RF-level bindings under @param path.
   */
  #getFuncScopedReferences(
    path: NodePath
  ): NodePath<t.Identifier | t.JSXIdentifier>[] {
    return BabelUtils.getScopedReferences(path, this.func.ast.scope).filter(
      (refIdent) => {
        if (refIdent.isJSXIdentifier()) return true;

        // We have to perform a doucble check against `val.references` (the
        // source of truth) to be sound.
        const val = this.decls.get(refIdent.node.name);
        invariant(
          val !== undefined,
          refIdent
            .buildCodeFrameError(`Val of ${refIdent.node.name} must exists`)
            .toString()
        );

        const maybeRef = val.references.get(refIdent);
        return Boolean(maybeRef);
      }
    );
  }

  /**
   * @return all declarative {@link BindingVal} originated from @param path.
   */
  getDeclsFrom(path: NodePath): BindingVal[] {
    const decls: BindingVal[] = [];

    for (const b of this.#getFuncScopedBindings(path)) {
      const val = this.decls.get(b.identifier.name);
      invariant(val, `Decl "${b.identifier.name}" must exists.`);
      decls.push(val);
    }

    return decls;
  }

  /**
   * @return all {@link Ref} to declarations originated from @param path.
   */
  getRefsToDeclsFrom(path: NodePath): Ref<BindingVal>[] {
    return this.#getFuncScopedReferences(path).map((refIdent) => {
      const val = this.decls.get(refIdent.node.name);
      invariant(
        val !== undefined,
        refIdent
          .buildCodeFrameError(`Val of ${refIdent.node.name} must exists`)
          .toString()
      );

      const ref = val.references.get(refIdent);
      invariant(
        ref !== undefined,
        refIdent
          .buildCodeFrameError(
            `Ref of ${refIdent.node.type} ${refIdent.node.name} must exists`
          )
          .toString()
      );

      return ref;
    });
  }

  /**
   * @returns all free variables originated from @param path
   */
  getFreeVarsFrom(path: NodePath): Ref<FreeVal>[] {
    if (!this.includeFreeVars) return [];

    return this.#getFuncOuterScopedReferences(path).map((refIdent) => {
      const val = this.freeVars.get(refIdent.node.name);
      invariant(
        val !== undefined,
        refIdent
          .buildCodeFrameError(`Val of ${refIdent.node.name} must exists`)
          .toString()
      );

      const ref = val.references.get(refIdent);
      invariant(
        ref !== undefined,
        refIdent
          .buildCodeFrameError(
            `Ref of ${refIdent.node.type} ${refIdent.node.name} must exists`
          )
          .toString()
      );

      return ref;
    });
  }
}

/**
 * React Function Kinds
 * @default Unset, e.g. when "use forget" is used.
 */
export enum FuncKind {
  Unknown = "Unknown",
  Component = "Component",
  Hook = "Hook",
}

/**
 * React Function Param Kinds.
 * @default NonSimple
 * @see https://tc39.es/ecma262/#sec-static-semantics-issimpleparameterlist
 */
export enum FuncParamKind {
  /**
   * FormalParamerers: [empty] or actually having empty bindings.
   */
  Empty,
  /**
   * IsSimpleParameterList and not Empty
   */
  Simple,
  /**
   * !IsSimpleParameterList and not Empty
   */
  NonSimple,
}

/**
 * Due to `var` hoisting and TDZ of lexical bindings, name should be sufficient
 * to uniquely identify function top-level bindings (e.g. props, states, hooks).
 * If needed, we can change this to unique symbol id in the future.
 */
export type Name = String | undefined;

export function hasMultipleReturn(func: Func): boolean {
  return func.isImplicitReturn ? func.returnCount > 0 : func.returnCount > 1;
}
