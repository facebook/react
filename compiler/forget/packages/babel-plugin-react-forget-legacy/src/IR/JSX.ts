/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { pathUnion } from "../Common/PathUnion";
import { assertExhaustive } from "../Common/utils";
import { Func } from "./Func";
import {
  createExprVal,
  createJSXTagVal,
  ExprVal,
  JSXTagVal,
  ValKind,
} from "./Val";

/**
 * React JSX Tree.
 */

/**
 * Technically we don't need to distinguish fragments and elements and
 * they are lowered to `React.createElement` anyways.
 *
 * But since Babel and the JSX spec differentiate them syntactically, let's
 * call them JSX "tag" then.
 */
export type JSXTag = t.JSXElement | t.JSXFragment;

export class JSXTreeBuilder {
  #irFunc: Func;
  #rootTag: NodePath<JSXTag>;

  constructor(rootTag: NodePath<JSXTag>, irFunc: Func) {
    this.#irFunc = irFunc;
    this.#rootTag = rootTag;
  }
  build(): JSXTagVal {
    return this.#jsxTag(this.#rootTag);
  }
  /**
   * Construct a JSX tree and return the {@link JSXTagVal} of root.
   */
  #jsxTag(tagPath: NodePath<JSXTag>): JSXTagVal {
    const val = createJSXTagVal(tagPath);

    const unsafeParent = tagPath.findParent((path) => {
      if (
        t.isConditional(path) ||
        t.isLoop(path) ||
        t.isFunction(path) ||
        t.isJSXExpressionContainer(path) ||
        t.isSwitchStatement(path) ||
        t.isLogicalExpression(path)
      ) {
        return true;
      }

      // If Forget runs before Fbt, we should not memoize insde Fbt.
      // As the Fbt transform limits allowed content.
      // Unsure if this could be loosened within FbtParam.
      if (t.isJSXElement(path.node)) {
        const name = path.node.openingElement.name;
        if (t.isJSXIdentifier(name) && /[Ff]b[st]/.test(name.name)) {
          return true;
        }
      }

      return false;
    });

    val.isUnsafeToMemo =
      unsafeParent != null && unsafeParent.isDescendant(this.#irFunc.ast);

    const tag = pathUnion(tagPath);
    switch (tag.type) {
      // <JSXElement attr=ATTRIBUTES>CHILDREN</JSXElement>
      case "JSXElement":
        const attrs = tag.get("openingElement").get("attributes");

        for (const rawAttr of attrs) {
          const attr = pathUnion(rawAttr);
          switch (attr.type) {
            case "JSXAttribute":
              const attrVal = pathUnion(attr.get("value"));
              switch (attrVal.type) {
                case "JSXExpressionContainer":
                  this.#expressionContainer(attrVal, val);
                  break;
                case "JSXElement":
                case "JSXFragment":
                  val.children.push(this.#jsxTag(attrVal));
                  break;
                case "StringLiteral":
                case undefined:
                case null:
                  break;
                default:
                  assertExhaustive(
                    attrVal,
                    `Unhandled ${(attrVal as NodePath).type}.`
                  );
              }
              break;
            case "JSXSpreadAttribute":
              val.children.push(this.#expression(attr.get("argument")));
              break;
            default:
              assertExhaustive(attr, "Unhandled `${(attr as NodePath).type}`.");
          }
        }
        this.#children(tag, val);
        break;
      case "JSXFragment":
        this.#children(tag, val);
        break;
      default:
        assertExhaustive(tag, `Unhandled ${(tag as NodePath).type}.`);
    }
    return val;
  }
  #children(tag: NodePath<JSXTag>, parent: JSXTagVal) {
    const children = tag.get("children");
    for (const rawChild of children) {
      const child = pathUnion(rawChild);
      switch (child.type) {
        case "JSXExpressionContainer":
          this.#expressionContainer(child, parent);
          break;
        case "JSXElement":
        case "JSXFragment":
          parent.children.push(this.#jsxTag(child));
          break;
        case "JSXText":
          // nothing interesting.
          break;
        case "JSXSpreadChild":
          // React doesn't support this.
          break;
        default:
          assertExhaustive(child, `Unhandled ${(child as NodePath).type}.`);
      }
    }
  }
  #expressionContainer(
    jsxExprContainer: NodePath<t.JSXExpressionContainer>,
    parent: JSXTagVal
  ) {
    const expr = jsxExprContainer.get("expression");

    // Find sub trees under JSXExpressionContainer e.g. {<JSX />}.
    // TODO: verify if we need this again??
    expr.traverse({
      JSXElement: (jsxEle) => {
        parent.children.push(this.#jsxTag(jsxEle));
      },
      JSXFragment: (jsxFrag) => {
        parent.children.push(this.#jsxTag(jsxFrag));
      },
    });

    if (expr.isExpression()) {
      parent.children.push(this.#expression(expr));
    }
  }
  #expression(expr: NodePath<t.Expression>): ExprVal {
    return createExprVal(expr, ValKind.Expr, true);
  }
}
