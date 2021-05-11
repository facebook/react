/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Binding, NodePath, Scope } from "@babel/traverse";
import * as t from "@babel/types";
import { invariant } from "../CompilerError";

/**
 * Babel Utils
 *
 * This module implements utils (e.g. specialized scope analysis) that
 * conceptually fits better in Babel-like toolchain.
 */

/**
 * @returns bindings scoped under @param scope that are declared by @param path.
 *
 * Babel's {@link getBindingIdentifiers} conveniently pattern match on all types
 * of nodes to find those {@link Identifier} where {@link Bindings} originated.
 * But it has many unwanted quirks:
 *
 * 1. sometimes include bindings created for inner block scope
 *
 *   function foo(a, b){}          // {foo, a, b}
 *   const foo = function(a, b){}  // {foo}
 *   for (const x of xs){}         // {x}
 *
 * 2. suffers from shadowing, since it can return identifiers with
 *    the same name but bound on multiple scopes when @param path
 *    itself introduces new scopes
 *
 *   function foo(foo, b){}  // {foo, b} (foo is the param!)  duplicate = false
 *                           // {foo: Array(2), b: Array(1)}  otherwise
 *
 * 3. sometimes includes references to existing bindings
 *   let x;        // [x]
 *   x = 0;        // []
 *   for (x in {}) // [x], but this does not introduce a new binding
 *
 * N.B. {@link getOuterBindingIdentifiers} special-cased
 * {@link FunctionDeclaration} but is still not rigid enough.
 *
 * This method refined it to only return those bindings that are bound on the
 * same scope as @param path, resulting:
 *
 *   function foo(a, b){}          // {foo}
 *   const foo = function(a, b){}  // {foo}
 *   for (const x of xs){}         // {}
 *   function foo(foo, b){}        // {foo} (foo is the func)
 *
 * N.B. we choose return Bindings because it's more generalized. You can
 * find path, identifier, name all from it.
 */
export function getScopedBindings(path: NodePath, scope: Scope): Binding[] {
  // Babel @type doesn't match with the real implementations.
  // @ts-ignore
  const bindingIdents = path.getBindingIdentifiers(true) as Record<
    string,
    t.Identifier[]
  >;
  const res: Binding[] = [];

  for (const [name, ids] of Object.entries(bindingIdents)) {
    // Use identifier name and re-lookup from the @param scope
    const maybeBinding = scope.getOwnBinding(name);
    for (const id of ids) {
      // Path may introduce a new binding of `name` under its own scope,
      //  so we explicitly check whether `id` references the binding
      //  under @param scope
      if (id === maybeBinding?.identifier) {
        res.push(maybeBinding);
      }
    }
  }
  return res;
}

/**
 * @returns identifiers under @param path referencing bindings on @param scope.
 */
export function getScopedReferences(
  path: NodePath,
  scope: Scope
): NodePath<t.Identifier | t.JSXIdentifier>[] {
  const refs: NodePath<t.Identifier | t.JSXIdentifier>[] = [];

  for (const ident of getReferences(path)) {
    if (isBoundOnScope(ident, scope)) {
      refs.push(ident);
    }
  }

  return refs;
}

/**
 * @returns identifiers under @param path referencing bindings bound out of
 * @param scope.
 */
export function getOuterScopedReferences(
  path: NodePath,
  scope: Scope
): NodePath<t.Identifier>[] {
  const refs: NodePath<t.Identifier>[] = [];

  for (const ident of getReferences(path, false)) {
    if (isBoundAboveScope(ident, scope)) {
      refs.push(ident);
    }
  }

  return refs;
}

/**
 * @returns references to identifiers under @param path, including itself.
 * N.B. our notion of "references" (read and write) is broader than Babel's
 * "references" (only "read").
 */
export function getReferences(
  path: NodePath,
  includesJSXIdent: false
): NodePath<t.Identifier>[];

export function getReferences(
  path: NodePath,
  includesJSXIdent?: true
): NodePath<t.Identifier | t.JSXIdentifier>[];

export function getReferences(
  path: NodePath,
  includesJSXIdent: boolean = true
): NodePath<t.Identifier | t.JSXIdentifier>[] {
  const refs: Set<NodePath<t.Identifier | t.JSXIdentifier>> = new Set();

  if (isReferencedIdentifier(path)) {
    refs.add(path);
  } else {
    // Babel actually supports `ReferencedIdentifer()` as virtual type but
    // it's not included in `@types`. In addition, we may needs to distinguish
    // normal identifiers and JSX identifiers in the future.
    path.traverse({
      Identifier(ident) {
        if (isReferencedIdentifier(ident)) {
          refs.add(ident);
        }
      },
      JSXIdentifier(jsxIdent) {
        if (includesJSXIdent && jsxIdent.isReferencedIdentifier()) {
          refs.add(jsxIdent);
        }
      },
    });

    /**
     * We also need to include "writes" in {@link Binding.constantViolations}
     * @see Val.ts {@link createBindingVal}. Note that the Identifiers recorded
     * here are unsound until {@link IR.Func.getScopedReferences} check against
     * with {@link Val.references}.
     *
     * Note that We don't need to patch `UpdateExpressions` since they are
     * already tracked as "read" too.
     */
    path.traverse({
      AssignmentExpression(expr) {
        const lhs = expr.get("left");
        // Typescript casts, since DefinitelyTyped is missing this class function
        invariant(
          lhs.getOuterBindingIdentifiers != null,
          "Expected getOuterBindingIdentifiers to exist on NodePath"
        );
        const paths = (lhs as any).getOuterBindingIdentifierPaths() as {
          _: NodePath<t.Identifier>;
        };
        Object.values(paths).forEach((p) => refs.add(p));
      },
    });
  }

  return [...refs];
}

// Older version of babel marks `FOO` in `{x: FOO}` as reference (https://github.com/babel/babel/pull/9492/)
function isReferencedIdentifier(
  path: NodePath<t.Node>
): path is NodePath<t.Identifier | t.JSXIdentifier> {
  if (
    !path.isReferencedIdentifier() ||
    t.isObjectPattern(path.parentPath.parentPath)
  ) {
    return false;
  }
  return true;
}

/**
 * Collect all Identifiers targeted by a normal / destructuring assignment.
 * We ignore IDENT in the majority of cases. These do not necessarily mutate
 * any bound identifiers
 *  - `call(IDENT)`, or `new IDENT` expressions
 *       (new Foo(immut.x)).bar = 0;
 *       foo(immut.x).bar = 0;
 *  - all "primary expressions" except for IdentifierReference
 *      - e.g. literals, classes, functions, generators
 *       (function foo(){}).bar = 0;
 *       (class foo{}).bar = 0;
 *
 * https://tc39.es/ecma262/#sec-destructuring-assignment
 * https://tc39.es/ecma262/#prod-LeftHandSideExpression
 **/
export function getAssignmentTargets(
  expr: NodePath<babel.types.Node>
): Set<NodePath<t.Identifier>> {
  const refs = new Set<NodePath<t.Identifier>>();
  type NotArray<T> = T extends Array<unknown> ? never : T;

  function toArray<T>(o: NotArray<T> | T[]): T[] {
    return Array.isArray(o) ? o : [o];
  }
  function collectIdent(
    elem: NodePath<babel.types.Node>,
    { inDestructure }: { inDestructure: boolean }
  ) {
    if (elem.isIdentifier()) {
      // collect found identifier
      refs.add(elem);
    } else if (elem.isMemberExpression() || elem.isOptionalMemberExpression()) {
      // recursively visit OBJ_PATH in OBJ_PATH.prop, OBJ_PATH?.prop
      toArray(elem.get("object")).forEach((elem) => {
        collectIdent(elem, { inDestructure: false });
      });
    } else if (elem.isArrayPattern()) {
      // recursively visit OBJ1, OBJ2 in [OBJ1, OBJ2]
      elem.get("elements").forEach((elem) => {
        if (elem.node != null)
          collectIdent(elem as NodePath<babel.types.Node>, {
            inDestructure: true,
          });
      });
    } else if (elem.isObjectPattern()) {
      // recursively visit VAL1, VAL2 in {key1: VAL1, key2: VAL2}
      elem.get("properties").forEach((elem) => {
        if (elem.type === "ObjectProperty") {
          collectIdent(elem.get("value") as NodePath, {
            inDestructure: true,
          });
        } else {
          collectIdent(elem.get("argument") as NodePath, {
            inDestructure: false,
          });
        }
      });
    } else if (inDestructure && elem.isAssignmentPattern()) {
      // recursively visit LVAL=val
      collectIdent(elem.get("left"), { inDestructure: false });
    }
  }
  collectIdent(expr, { inDestructure: false });
  return refs;
}

/**
 * @returns whethor or not @param ident is bound to @param scope.
 *
 * Babel's {@link hasBinding} and {@link hasOwnBinding} are insufficient when
 * shadowing came into play, so we perform a stronger check by checking if
 * a scope chain look up would be same as direct own scope lookup.
 */
export function isBoundOnScope(
  ident: NodePath<t.Identifier | t.JSXIdentifier>,
  scope: Scope
): boolean {
  const bindingFromLookup = ident.scope.getBinding(ident.node.name);
  const bindingFromScope = scope.getOwnBinding(ident.node.name);

  if (!bindingFromScope || !bindingFromLookup) return false;

  return bindingFromLookup === bindingFromScope;
}

export function isBoundAboveScope(
  ident: NodePath<t.Identifier | t.JSXIdentifier>,
  scope: Scope
): boolean {
  const bindingFromLookup = ident.scope.getBinding(ident.node.name);
  if (!bindingFromLookup) {
    invariant(
      ident.scope.hasGlobal(ident.node.name),
      `sanity check ${ident.node.name}`
    );
    return true;
  }
  let top = bindingFromLookup?.scope.getProgramParent();
  let curScope = bindingFromLookup.scope;

  while (curScope !== top) {
    if (curScope === scope) return false;
    curScope = curScope.parent;
  }
  return true;
}

/**
 * @returns whether or not @param expr is considered allocating (unstable).
 * TODO: we should do this recursively over compound expressions.
 */
export function isAllocatingExpr(expr: NodePath<t.Expression>): boolean {
  return (
    expr.isObjectExpression() ||
    expr.isArrayExpression() ||
    expr.isFunctionExpression() ||
    expr.isArrowFunctionExpression() ||
    expr.isClassExpression() ||
    expr.isNewExpression() ||
    expr.isJSXElement() ||
    expr.isJSXFragment() ||
    expr.isRegExpLiteral() ||
    expr.isCallExpression() ||
    expr.isOptionalCallExpression() ||
    expr.isTemplateLiteral()
  );
}

/**
 * Unlike `t.Function`, this excludes `ClassMethod` and `ClassPrivateMethod`
 */
export type NonMethodFunction =
  | t.FunctionDeclaration
  | t.FunctionExpression
  | t.ObjectMethod
  | t.ArrowFunctionExpression;

export function isNonMethodFunction(
  node: object | null | undefined,
  opts?: object | null
): node is NonMethodFunction {
  return (
    t.isFunctionDeclaration(node, opts) ||
    t.isFunctionExpression(node, opts) ||
    t.isObjectMethod(node, opts) ||
    t.isArrowFunctionExpression(node, opts)
  );
}

export function isNonMethodFunctionPath(
  path: NodePath,
  opts?: object | null
): path is NodePath<NonMethodFunction> {
  return isNonMethodFunction(path.node, opts);
}
