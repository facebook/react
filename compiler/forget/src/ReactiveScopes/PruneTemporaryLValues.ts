/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Identifier,
  InstructionKind,
  ReactiveFunction,
  ReactiveInstruction,
} from "../HIR/HIR";
import { visitFunction } from "./visitors";

/**
 * Nulls out lvalues for temporary variables that are never accessed later. This only
 * nulls out the lvalue itself, it does not remove the corresponding instructions.
 */
export function pruneTemporaryLValues(fn: ReactiveFunction): void {
  const lvalues = new Map<Identifier, ReactiveInstruction>();
  visitFunction(fn, {
    visitInstruction: (instr) => {
      if (
        instr.lvalue !== null &&
        instr.lvalue.kind === InstructionKind.Const &&
        instr.lvalue.place.identifier.name === null
      ) {
        lvalues.set(instr.lvalue.place.identifier, instr);
      }
    },
    visitValue: (value) => {
      if (value.kind === "Identifier") {
        lvalues.delete(value.identifier);
      }
    },
  });
  for (const [, instr] of lvalues) {
    instr.lvalue = null;
  }
}
