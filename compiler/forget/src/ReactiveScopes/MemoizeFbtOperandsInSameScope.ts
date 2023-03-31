/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  IdentifierId,
  makeInstructionId,
  ReactiveFunction,
  ReactiveInstruction,
} from "../HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

/**
 * This is a Meta-ism. We special-case the `<fbt>` element for translation purposes,
 * and have a transform that requires the children of this element to be a limited
 * subset of nodes. Notably, any dynamic translation values must appear as
 * `<fbt:param>` children — we disallow identifiers as children of `<fbt>` nodes.
 *
 * This PR adds a new pass which finds `<fbt>` nodes and ensures their immediate
 * operands are not independently memoized. Note that this still allows the values
 * of `<fbt:param>` to be independently memoized
 */
export function memoizeFbtOperandsInSameScope(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), undefined);
}

class Transform extends ReactiveFunctionVisitor<void> {
  fbtTags: Set<IdentifierId> = new Set();

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
      this.fbtTags.add(lvalue.identifier.id);
    } else if (
      value.kind === "JsxExpression" &&
      this.fbtTags.has(value.tag.identifier.id)
    ) {
      // if the JSX element's tag was `fbt`, mark all its operands
      // to ensure that they end up in the same scope as the jsx element
      // itself.
      for (const operand of eachInstructionValueOperand(value)) {
        operand.identifier.scope = lvalue.identifier.scope;
        operand.identifier.mutableRange.end =
          lvalue.identifier.mutableRange.end;

        // Expand the jsx element's range to account for its operands
        lvalue.identifier.mutableRange.start = makeInstructionId(
          Math.min(
            lvalue.identifier.mutableRange.start,
            operand.identifier.mutableRange.start
          )
        );
      }
    }
  }
}
