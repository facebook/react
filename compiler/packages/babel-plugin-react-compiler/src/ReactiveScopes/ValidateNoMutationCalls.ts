/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '../CompilerError';
import {Environment} from '../HIR';
import {
  Effect,
  Identifier,
  IdentifierId,
  InstructionId,
  Place,
  ReactiveFunction,
  ReactiveInstruction,
  getHookKind,
  isSetStateType,
} from '../HIR/HIR';
import { eachInstructionLValue, eachInstructionValueLValue } from '../HIR/visitors';
import {
  ReactiveFunctionVisitor,
  eachReactiveValueOperand,
  visitReactiveFunction,
} from './visitors';

const allowedNames = new Set(['invariant', 'recoverableViolation']);

class Visitor extends ReactiveFunctionVisitor<CompilerError> {
  #env: Environment;
  #names = new Map<IdentifierId, string>();
  #functions = new Map<IdentifierId, CompilerError>()

  constructor(env: Environment) {
    super();
    this.#env = env;
  }

  getName(id: Identifier): string | undefined {
    if (id.name?.kind === 'named') {
      return id.name.value;
    } else {
      return this.#names.get(id.id);
    }
  }

  setName(id: Identifier, name: string | undefined): void {
    if (name != null) {
      this.#names.set(id.id, name);
    }
  }

  override visitReactiveFunctionValue(): void {
    CompilerError.invariant(false, { reason: 'visitReactiveFunctionValue should not be called', loc: null })
  }

  override visitInstruction(
    instr: ReactiveInstruction,
    state: CompilerError,
  ): void {
    if (instr.lvalue != null) {
      switch (instr.value.kind) {
        case 'LoadGlobal':
          this.setName(instr.lvalue.identifier, instr.value.binding.name);
          super.visitInstruction(instr, state);
          break;
        case 'LoadLocal':
        case 'LoadContext':
          this.setName(
            instr.lvalue.identifier,
            this.getName(instr.value.place.identifier),
          );
          super.visitInstruction(instr, state);
          break;
        case 'PropertyLoad': {
          const name = this.getName(instr.value.object.identifier);
          if (name != null) {
            this.setName(
              instr.lvalue.identifier,
              name + '.' + instr.value.property,
            );
          }
          super.visitInstruction(instr, state);
          break;
        }
        case 'ComputedLoad': {
          const name = this.getName(instr.value.object.identifier);
          if (name != null) {
            this.setName(instr.lvalue.identifier, name + '[...]');
          }
          super.visitInstruction(instr, state);
          break;
        }
        case 'FunctionExpression': {
          this.setName(instr.lvalue.identifier, instr.value.name ?? undefined);
          const state = new CompilerError();
          this.visitHirFunction(instr.value.loweredFunc.func, state);
          if (state.hasErrors()) {
            this.#functions.set(instr.lvalue.identifier.id, state);
          }
          break;
        }
        case 'ReactiveFunctionValue': {
          this.setName(instr.lvalue.identifier, instr.value.fn.id ?? undefined);
          const state = new CompilerError();
          this.visitBlock(instr.value.fn.body, state);
          if (state.hasErrors()) {
            this.#functions.set(instr.lvalue.identifier.id, state);
          }
          break;
        }
        default: {
          super.visitInstruction(instr, state);
          break;
        }
      }
    } else {
      super.visitInstruction(instr, state);
    }

    let hookKind = null;
    let callee = null;
    if (
      instr.value.kind === 'CallExpression' ||
      instr.value.kind === 'MethodCall'
    ) {
      if (instr.value.kind === 'CallExpression') {
        callee = instr.value.callee;
      } else {
        callee = instr.value.property;
      }
      hookKind = getHookKind(this.#env, callee.identifier);
    }

    if (instr.value.kind !== 'JsxExpression') {
      for (const operand of eachReactiveValueOperand(instr.value)) {
        const errors = this.#functions.get(operand.identifier.id);
        if (errors != null) {
          for (const lval of eachInstructionLValue(instr)) {
            const existing = this.#functions.get(lval.identifier.id) ?? new CompilerError();
            errors.details.forEach(detail => existing.pushErrorDetail(detail));
            this.#functions.set(lval.identifier.id, existing);
          }
        }
      }
    }

    if (callee != null) {
      const isException =
        hookKind != null ||
        isSetStateType(callee.identifier);
      const name = this.getName(callee.identifier) ?? "(unknown)";

      if (hookKind !== 'useEffect' && hookKind !== 'useLayoutEffect' && hookKind !== 'useInsertionEffect') {
        [...eachReactiveValueOperand(instr.value)].forEach(operand => this.#functions.get(operand.identifier.id)?.details?.forEach(detail => state.pushErrorDetail(detail)));
      }

      if (instr.lvalue === null && !isException && !allowedNames.has(name)) {
        let allReads = true;
        for (const operand of eachReactiveValueOperand(instr.value)) {
          allReads &&= operand.effect === Effect.Read;
        }
        if (allReads) {
          state.push({
            reason: `Likely illegal mutation call \`${name}\``,
            loc: instr.loc,
            severity: ErrorSeverity.Todo,
          });
        }
      }
    }
  }
}

export function validateNoMutationCalls(fn: ReactiveFunction): void {
  const error = new CompilerError();
  visitReactiveFunction(fn, new Visitor(fn.env), error);
  if (error.hasErrors()) {
    throw error;
  }
}
