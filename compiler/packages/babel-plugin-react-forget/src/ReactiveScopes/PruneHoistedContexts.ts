/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Identifier,
  InstructionKind,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveStatement,
} from "../HIR";
import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from "./visitors";

/*
 * Prunes DeclareContexts lowered for HoistedConsts, and transforms any references back to its
 * original instruction kind.
 */
export function pruneHoistedContexts(fn: ReactiveFunction): void {
  const hoistedIdentifiers: HoistedIdentifiers = new Set();
  visitReactiveFunction(fn, new Visitor(), hoistedIdentifiers);
}

type HoistedIdentifiers = Set<Identifier>;

class Visitor extends ReactiveFunctionTransform<HoistedIdentifiers> {
  override transformInstruction(
    instruction: ReactiveInstruction,
    state: HoistedIdentifiers
  ): Transformed<ReactiveStatement> {
    this.visitInstruction(instruction, state);
    if (
      instruction.value.kind === "DeclareContext" &&
      instruction.value.lvalue.kind === "HoistedConst"
    ) {
      state.add(instruction.value.lvalue.place.identifier);
      return { kind: "remove" };
    }

    if (
      instruction.value.kind === "StoreContext" &&
      state.has(instruction.value.lvalue.place.identifier)
    ) {
      return {
        kind: "replace",
        value: {
          kind: "instruction",
          instruction: {
            ...instruction,
            value: {
              ...instruction.value,
              lvalue: {
                ...instruction.value.lvalue,
                kind: InstructionKind.Const,
              },
              type: null,
              kind: "StoreLocal",
            },
          },
        },
      };
    }

    return { kind: "keep" };
  }
}
