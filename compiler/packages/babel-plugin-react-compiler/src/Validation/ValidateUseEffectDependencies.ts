/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '..';
import {
  IdentifierId,
  Place,
  ReactiveFunction,
  ReactiveInstruction,
} from '../HIR';
import {
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from '../ReactiveScopes/visitors';
import {isEffectHook} from './ValidateMemoizedEffectDependencies';

export function validateUseEffectDependencies(fn: ReactiveFunction): void {
  const errors = new CompilerError();
  visitReactiveFunction(fn, new Visitor(), errors);
  if (errors.hasErrors()) {
    throw errors;
  }
}

class Visitor extends ReactiveFunctionVisitor<CompilerError> {
  #functionDependencies: Map<IdentifierId, Array<Place>> = new Map();

  override visitInstruction(
    instruction: ReactiveInstruction,
    state: CompilerError,
  ): void {
    this.traverseInstruction(instruction, state);
    if (instruction.lvalue) {
      if (
        instruction.value.kind === 'LoadLocal' ||
        instruction.value.kind === 'LoadContext'
      ) {
        if (
          this.#functionDependencies.has(instruction.value.place.identifier.id)
        ) {
          this.#functionDependencies.set(
            instruction.lvalue.identifier.id,
            this.#functionDependencies.get(
              instruction.value.place.identifier.id,
            )!,
          );
        }
      } else if (instruction.value.kind === 'FunctionExpression') {
        this.#functionDependencies.set(
          instruction.lvalue.identifier.id,
          instruction.value.loweredFunc.dependencies,
        );
      } else if (instruction.value.kind === 'ReactiveFunctionValue') {
        this.#functionDependencies.set(
          instruction.lvalue.identifier.id,
          instruction.value.dependencies,
        );
      }
    }
    if (
      instruction.value.kind === 'CallExpression' &&
      isEffectHook(instruction.value.callee.identifier)
    ) {
      let inferredDeps = null;
      if (
        instruction.value.args.length === 1 &&
        instruction.value.args[0].kind === 'Identifier'
      ) {
        inferredDeps =
          this.#functionDependencies.get(
            instruction.value.args[0].identifier.id,
          ) ?? null;
      }

      if (inferredDeps != null && inferredDeps.length > 0) {
        state.push({
          reason:
            'React Compiler has skipped optimizing this component because an effect hook was called without a dependency array.',
          description: null,
          severity: ErrorSeverity.InvalidReact,
          loc: typeof instruction.loc !== 'symbol' ? instruction.loc : null,
          suggestions: null,
        });
      }
    }
  }
}
