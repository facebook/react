/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  IdentifierId,
  makeInstructionId,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveValue,
} from "../HIR";
import {
  eachReactiveValueOperand,
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from "./visitors";

/**
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
export function memoizeFbtOperandsInSameScope(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), undefined);
}

class Transform extends ReactiveFunctionVisitor<void> {
  // Values that represent *potential* references of `fbt` as a JSX tag name
  // or as a callee.
  fbtValues: Set<IdentifierId> = new Set();

  override visitInstruction(
    instruction: ReactiveInstruction,
    _state: void
  ): void {
    const { lvalue, value } = instruction;
    if (lvalue === null) {
      return;
    }
    if (
      value.kind === "Primitive" &&
      typeof value.value === "string" &&
      value.value === "fbt"
    ) {
      // We don't distinguish between tag names and strings, so record
      // all `fbt` string literals in case they are used as a jsx tag.
      this.fbtValues.add(lvalue.identifier.id);
    } else if (value.kind === "LoadGlobal" && value.name === "fbt") {
      // Record references to `fbt` as a global
      this.fbtValues.add(lvalue.identifier.id);
    } else if (
      isFbtJsxExpression(this.fbtValues, value) ||
      (value.kind === "CallExpression" &&
        this.fbtValues.has(value.callee.identifier.id))
    ) {
      const fbtScope = lvalue.identifier.scope;
      if (fbtScope === null) {
        return;
      }

      // if the JSX element's tag was `fbt`, mark all its operands
      // to ensure that they end up in the same scope as the jsx element
      // itself.
      for (const operand of eachReactiveValueOperand(value)) {
        operand.identifier.scope = fbtScope;

        // Expand the jsx element's range to account for its operands
        fbtScope.range.start = makeInstructionId(
          Math.min(fbtScope.range.start, operand.identifier.mutableRange.start)
        );
      }
    }
  }
}

function isFbtJsxExpression(
  fbtValues: Set<IdentifierId>,
  value: ReactiveValue
): boolean {
  return (
    value.kind === "JsxExpression" &&
    ((value.tag.kind === "Identifier" &&
      fbtValues.has(value.tag.identifier.id)) ||
      (value.tag.kind === "BuiltinTag" && value.tag.name === "fbt"))
  );
}
