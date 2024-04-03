/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  IdentifierId,
  makeInstructionId,
  Place,
  ReactiveValue,
} from "../HIR";
import { eachReactiveValueOperand } from "./visitors";

/*
 * This pass supports the `fbt` translation system (https://facebook.github.io/fbt/).
 * FBT provides the `<fbt>` JSX element and `fbt()` calls (which take params in the
 * form of `<fbt:param>` children or `fbt.param()` arguments, respectively). These
 * tags/functions have restrictions on what types of syntax may appear as props/children/
 * arguments, notably that variable references may not appear directly — variables
 * must always be wrapped in a `<fbt:param>` or `fbt.param()`.
 *
 * To ensure that Forget doesn't rewrite code to violate this restriction, we force
 * operands to fbt tags/calls have the same scope as the tag/call itself.
 *
 * Note that this still allows the props/arguments of `<fbt:param>`/`fbt.param()`
 * to be independently memoized
 */
export function memoizeFbtOperandsInSameScope(fn: HIRFunction): void {
  const fbtValues: Set<IdentifierId> = new Set();
  while (true) {
    let size = fbtValues.size;
    visit(fn, fbtValues);
    if (size === fbtValues.size) {
      break;
    }
  }
}

export const FBT_TAGS: Set<string> = new Set(["fbt", "fbt:param"]);
export const SINGLE_CHILD_FBT_TAGS: Set<string> = new Set(["fbt:param"]);

function visit(fn: HIRFunction, fbtValues: Set<IdentifierId>): void {
  for (const [, block] of fn.body.blocks) {
    for (const instruction of block.instructions) {
      const { lvalue, value } = instruction;
      if (lvalue === null) {
        return;
      }
      if (
        value.kind === "Primitive" &&
        typeof value.value === "string" &&
        FBT_TAGS.has(value.value)
      ) {
        /*
         * We don't distinguish between tag names and strings, so record
         * all `fbt` string literals in case they are used as a jsx tag.
         */
        fbtValues.add(lvalue.identifier.id);
      } else if (value.kind === "LoadGlobal" && FBT_TAGS.has(value.name)) {
        // Record references to `fbt` as a global
        fbtValues.add(lvalue.identifier.id);
      } else if (isFbtCallExpression(fbtValues, value)) {
        const fbtScope = lvalue.identifier.scope;
        if (fbtScope === null) {
          return;
        }

        /*
         * if the JSX element's tag was `fbt`, mark all its operands
         * to ensure that they end up in the same scope as the jsx element
         * itself.
         */
        for (const operand of eachReactiveValueOperand(value)) {
          operand.identifier.scope = fbtScope;

          // Expand the jsx element's range to account for its operands
          fbtScope.range.start = makeInstructionId(
            Math.min(
              fbtScope.range.start,
              operand.identifier.mutableRange.start
            )
          );
        }
      } else if (
        isFbtJsxExpression(fbtValues, value) ||
        isFbtJsxChild(fbtValues, lvalue, value)
      ) {
        const fbtScope = lvalue.identifier.scope;
        if (fbtScope === null) {
          return;
        }

        /*
         * if the JSX element's tag was `fbt`, mark all its operands
         * to ensure that they end up in the same scope as the jsx element
         * itself.
         */
        for (const operand of eachReactiveValueOperand(value)) {
          operand.identifier.scope = fbtScope;

          // Expand the jsx element's range to account for its operands
          fbtScope.range.start = makeInstructionId(
            Math.min(
              fbtScope.range.start,
              operand.identifier.mutableRange.start
            )
          );

          /*
           * NOTE: we add the operands as fbt values so that they are also
           * grouped with this expression
           */
          fbtValues.add(operand.identifier.id);
        }
      }
    }
  }
}

function isFbtCallExpression(
  fbtValues: Set<IdentifierId>,
  value: ReactiveValue
): boolean {
  return (
    value.kind === "CallExpression" && fbtValues.has(value.callee.identifier.id)
  );
}

function isFbtJsxExpression(
  fbtValues: Set<IdentifierId>,
  value: ReactiveValue
): boolean {
  return (
    value.kind === "JsxExpression" &&
    ((value.tag.kind === "Identifier" &&
      fbtValues.has(value.tag.identifier.id)) ||
      (value.tag.kind === "BuiltinTag" && FBT_TAGS.has(value.tag.name)))
  );
}

function isFbtJsxChild(
  fbtValues: Set<IdentifierId>,
  lvalue: Place | null,
  value: ReactiveValue
): boolean {
  return (
    (value.kind === "JsxExpression" || value.kind === "JsxFragment") &&
    lvalue !== null &&
    fbtValues.has(lvalue.identifier.id)
  );
}
