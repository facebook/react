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
  ReactiveFunction,
  ReactiveInstruction,
  getHookKind,
  isSetStateType,
} from '../HIR/HIR';
import {
  ReactiveFunctionVisitor,
  eachReactiveValueOperand,
  visitReactiveFunction,
} from './visitors';

const allowedNames = new Set(['invariant']);

class Visitor extends ReactiveFunctionVisitor<CompilerError> {
  #env: Environment;
  #names: Map<IdentifierId, string> = new Map();

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

  override visitInstruction(
    instr: ReactiveInstruction,
    state: CompilerError,
  ): void {
    if (instr.lvalue != null) {
      switch (instr.value.kind) {
        case 'LoadGlobal':
          this.setName(instr.lvalue.identifier, instr.value.binding.name);
          break;
        case 'LoadLocal':
        case 'LoadContext':
          this.setName(
            instr.lvalue.identifier,
            this.getName(instr.value.place.identifier),
          );
          break;
        case 'PropertyLoad': {
          const name = this.getName(instr.value.object.identifier);
          if (name != null) {
            this.setName(
              instr.lvalue.identifier,
              name + '.' + instr.value.property,
            );
          }
          break;
        }
        case 'ComputedLoad': {
          const name = this.getName(instr.value.object.identifier);
          if (name != null) {
            this.setName(instr.lvalue.identifier, name + '[...]');
          }
          break;
        }
      }
    }

    if (
      instr.value.kind === 'CallExpression' ||
      instr.value.kind === 'MethodCall'
    ) {
      let isException = false;
      let name = '(unknown)';
      if (instr.value.kind === 'CallExpression') {
        isException =
          getHookKind(this.#env, instr.value.callee.identifier) != null ||
          isSetStateType(instr.value.callee.identifier);
        name = this.getName(instr.value.callee.identifier) ?? name;
      } else {
        isException =
          getHookKind(this.#env, instr.value.property.identifier) != null ||
          isSetStateType(instr.value.property.identifier);
        name = this.getName(instr.value.property.identifier) ?? name;
      }
      if (instr.lvalue === null && !isException && allowedNames.has(name)) {
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
    super.visitInstruction(instr, state);
  }
}

export function validateNoMutationCalls(fn: ReactiveFunction): void {
  const error = new CompilerError();
  visitReactiveFunction(fn, new Visitor(fn.env), error);
  if (error.hasErrors()) {
    throw error;
  }
}
