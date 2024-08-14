/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, Effect, ErrorSeverity} from '..';
import {DeclarationId, HIRFunction, Place} from '../HIR';
import { eachInstructionOperand, eachPatternOperand } from '../HIR/visitors';
/**
 * Validates that all store/load references to a given named identifier align with the
 * "kind" of that variable (normal variable or context variable). For example, a context
 * variable may not be loaded/stored with regular StoreLocal/LoadLocal/Destructure instructions.
 */
export function validateOnlySafeFunctionCalls(fn: HIRFunction): void {
  const globalDerivedNames = new Map<DeclarationId, string>();
  const names = new Map<DeclarationId, string>();
  const error = new CompilerError();
  for (const [_, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      function testCallee(callee: Place) {
        if (callee.identifier.type.kind === 'Function' && callee.identifier.type.shapeId == null && Array(...eachInstructionOperand(instr)).some((x) => x.reactive && (x.effect === Effect.ConditionallyMutate || x.effect === Effect.Mutate) && x.identifier.type.kind !== "Primitive")) {
          const name = globalDerivedNames.get(callee.identifier.declarationId) ?? names.get(callee.identifier.declarationId) ?? "[unknown]";
          error.push({reason: `Unsafe call of ${name}`, loc: instr.loc, severity: ErrorSeverity.InvalidReact})
        }
      }
      switch (instr.value.kind) {
        case "CallExpression":
          testCallee(instr.value.callee);
          break;
        case "MethodCall":
          testCallee(instr.value.property);
          break;
        case "LoadGlobal":
          names.set(instr.lvalue.identifier.declarationId, instr.value.binding.name);
          if (instr.value.binding.kind !== "ModuleLocal") {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, instr.value.binding.name);
          }
          break;
        case "LoadLocal":
        case "LoadContext": {
          const val = names.get(instr.value.place.identifier.declarationId)
          const global = globalDerivedNames.get(instr.value.place.identifier.declarationId)
          if (val != null) {
            names.set(instr.lvalue.identifier.declarationId, val);
          }
          if (global != null) {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, global);
          } else if (instr.value.place.identifier.type.kind === "Object" && instr.value.place.identifier.type.shapeId === "BuiltInArray") {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, "[Array instance]");
          } else if (instr.value.place.identifier.type.kind === "Object" && instr.value.place.identifier.type.shapeId === "BuiltInObject") {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, "[Object instance]");
          }
          break;
        }
        case 'StoreLocal':
        case 'StoreContext': {
          const val = names.get(instr.value.value.identifier.declarationId)
          const global = globalDerivedNames.get(instr.value.value.identifier.declarationId)
          if (val != null) {
            names.set(instr.lvalue.identifier.declarationId, val);
            names.set(instr.value.lvalue.place.identifier.declarationId, val);
          }
          if (global != null) {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, global);
            globalDerivedNames.set(instr.value.lvalue.place.identifier.declarationId, global);
          } else if (instr.value.value.identifier.type.kind === "Object" && instr.value.value.identifier.type.shapeId === "BuiltInArray") {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, "[Array instance]");
            globalDerivedNames.set(instr.value.lvalue.place.identifier.declarationId, "[Array instance]");
          } else if (instr.value.value.identifier.type.kind === "Object" && instr.value.value.identifier.type.shapeId === "BuiltInObject") {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, "[Object instance]");
            globalDerivedNames.set(instr.value.lvalue.place.identifier.declarationId, "[Object instance]");
          }
          break;
        }
        case "PropertyLoad": {
          const global = globalDerivedNames.get(instr.value.object.identifier.declarationId)
          names.set(instr.lvalue.identifier.declarationId, instr.value.property);
          if (global != null) {
            globalDerivedNames.set(instr.lvalue.identifier.declarationId, `${global}.${instr.value.property}`);
          }
          break;
        }
        case "Destructure": {
          const global = globalDerivedNames.get(instr.value.value.identifier.declarationId);
          for (const pat of eachPatternOperand(instr.value.lvalue.pattern)) {
            if (pat.identifier.name?.kind === "named") {
              if (global != null) {
                globalDerivedNames.set(pat.identifier.declarationId, `${global}.${pat.identifier.name.value}`);
              }
              names.set(pat.identifier.declarationId, pat.identifier.name.value);
            }
          }
        }
      }
    }
  }
  if (error.hasErrors()) {
    throw error;
  }
}
