/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, Effect} from '..';
import {ErrorCategory} from '../CompilerError';
import {
  BlockId,
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  isSetStateType,
  isUseEffectHookType,
  Place,
  CallExpression,
  Instruction,
  isUseStateType,
  BasicBlock,
} from '../HIR';
import {eachInstructionLValue, eachInstructionOperand} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {assertExhaustive} from '../Utils/utils';

type TypeOfValue = 'ignored' | 'fromProps' | 'fromState' | 'fromPropsAndState';

type DerivationMetadata = {
  typeOfValue: TypeOfValue;
  place: Place;
  sourcesIds: Set<IdentifierId>;
};

type ValidationContext = {
  readonly functions: Map<IdentifierId, FunctionExpression>;
  readonly errors: CompilerError;
  readonly derivationCache: DerivationCache;
  readonly effects: Set<HIRFunction>;
};

class DerivationCache {
  hasChanges: boolean = false;
  cache: Map<IdentifierId, DerivationMetadata> = new Map();

  snapshot(): boolean {
    const hasChanges = this.hasChanges;
    this.hasChanges = false;
    return hasChanges;
  }

  addDerivationEntry(
    derivedVar: Place,
    sourcesIds: Set<IdentifierId>,
    typeOfValue: TypeOfValue,
  ): void {
    let newValue: DerivationMetadata = {
      place: derivedVar,
      sourcesIds: new Set(),
      typeOfValue: typeOfValue ?? 'ignored',
    };

    if (sourcesIds !== undefined) {
      for (const id of sourcesIds) {
        const sourcePlace = this.cache.get(id)?.place;

        if (sourcePlace === undefined) {
          continue;
        }

        /*
         * If the identifier of the source is a promoted identifier, then
         *  we should set the target as the source.
         */
        if (
          sourcePlace.identifier.name === null ||
          sourcePlace.identifier.name?.kind === 'promoted'
        ) {
          newValue.sourcesIds.add(derivedVar.identifier.id);
        } else {
          newValue.sourcesIds.add(sourcePlace.identifier.id);
        }
      }
    }

    if (newValue.sourcesIds.size === 0) {
      newValue.sourcesIds.add(derivedVar.identifier.id);
    }

    const existingValue = this.cache.get(derivedVar.identifier.id);
    if (
      existingValue === undefined ||
      !this.isDerivationEqual(existingValue, newValue)
    ) {
      this.cache.set(derivedVar.identifier.id, newValue);
      this.hasChanges = true;
    }
  }

  private isDerivationEqual(
    a: DerivationMetadata,
    b: DerivationMetadata,
  ): boolean {
    if (a.typeOfValue !== b.typeOfValue) {
      return false;
    }
    if (a.sourcesIds.size !== b.sourcesIds.size) {
      return false;
    }
    for (const id of a.sourcesIds) {
      if (!b.sourcesIds.has(id)) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Validates that useEffect is not used for derived computations which could/should
 * be performed in render.
 *
 * See https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state
 *
 * Example:
 *
 * ```
 * // 🔴 Avoid: redundant state and unnecessary Effect
 * const [fullName, setFullName] = useState('');
 * useEffect(() => {
 *   setFullName(firstName + ' ' + lastName);
 * }, [firstName, lastName]);
 * ```
 *
 * Instead use:
 *
 * ```
 * // ✅ Good: calculated during rendering
 * const fullName = firstName + ' ' + lastName;
 * ```
 */
export function validateNoDerivedComputationsInEffects_exp(
  fn: HIRFunction,
): void {
  const functions: Map<IdentifierId, FunctionExpression> = new Map();
  const derivationCache = new DerivationCache();
  const errors = new CompilerError();
  const effects: Set<HIRFunction> = new Set();

  const context: ValidationContext = {
    functions,
    errors,
    derivationCache,
    effects,
  };

  if (fn.fnType === 'Hook') {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        context.derivationCache.cache.set(param.identifier.id, {
          place: param,
          sourcesIds: new Set([param.identifier.id]),
          typeOfValue: 'fromProps',
        });
        context.derivationCache.hasChanges = true;
      }
    }
  } else if (fn.fnType === 'Component') {
    const props = fn.params[0];
    if (props != null && props.kind === 'Identifier') {
      context.derivationCache.cache.set(props.identifier.id, {
        place: props,
        sourcesIds: new Set([props.identifier.id]),
        typeOfValue: 'fromProps',
      });
      context.derivationCache.hasChanges = true;
    }
  }

  do {
    for (const block of fn.body.blocks.values()) {
      recordPhiDerivations(block, context);
      for (const instr of block.instructions) {
        recordInstructionDerivations(instr, context);
      }
    }
  } while (context.derivationCache.snapshot());

  for (const effect of effects) {
    validateEffect(effect, context);
  }

  if (errors.hasAnyErrors()) {
    throw errors;
  }
}

function recordPhiDerivations(
  block: BasicBlock,
  context: ValidationContext,
): void {
  for (const phi of block.phis) {
    let typeOfValue: TypeOfValue = 'ignored';
    let sourcesIds: Set<IdentifierId> = new Set();
    for (const operand of phi.operands.values()) {
      const operandMetadata = context.derivationCache.cache.get(
        operand.identifier.id,
      );

      if (operandMetadata === undefined) {
        continue;
      }

      typeOfValue = joinValue(typeOfValue, operandMetadata.typeOfValue);
      sourcesIds.add(operand.identifier.id);
    }

    if (typeOfValue !== 'ignored') {
      context.derivationCache.addDerivationEntry(
        phi.place,
        sourcesIds,
        typeOfValue,
      );
    }
  }
}

function joinValue(
  lvalueType: TypeOfValue,
  valueType: TypeOfValue,
): TypeOfValue {
  if (lvalueType === 'ignored') return valueType;
  if (valueType === 'ignored') return lvalueType;
  if (lvalueType === valueType) return lvalueType;
  return 'fromPropsAndState';
}

function recordInstructionDerivations(
  instr: Instruction,
  context: ValidationContext,
): void {
  let typeOfValue: TypeOfValue = 'ignored';
  const sources: Set<IdentifierId> = new Set();
  const {lvalue, value} = instr;
  if (value.kind === 'FunctionExpression') {
    context.functions.set(lvalue.identifier.id, value);
    for (const [, block] of value.loweredFunc.func.body.blocks) {
      for (const instr of block.instructions) {
        recordInstructionDerivations(instr, context);
      }
    }
  } else if (value.kind === 'CallExpression' || value.kind === 'MethodCall') {
    const callee =
      value.kind === 'CallExpression' ? value.callee : value.property;
    if (
      isUseEffectHookType(callee.identifier) &&
      value.args.length === 2 &&
      value.args[0].kind === 'Identifier' &&
      value.args[1].kind === 'Identifier'
    ) {
      const effectFunction = context.functions.get(value.args[0].identifier.id);
      if (effectFunction != null) {
        context.effects.add(effectFunction.loweredFunc.func);
      }
    } else if (isUseStateType(lvalue.identifier) && value.args.length > 0) {
      const stateValueSource = value.args[0];
      if (stateValueSource.kind === 'Identifier') {
        sources.add(stateValueSource.identifier.id);
      }
      typeOfValue = joinValue(typeOfValue, 'fromState');
    }
  }

  for (const operand of eachInstructionOperand(instr)) {
    const operandMetadata = context.derivationCache.cache.get(
      operand.identifier.id,
    );

    if (operandMetadata === undefined) {
      continue;
    }

    typeOfValue = joinValue(typeOfValue, operandMetadata.typeOfValue);
    for (const id of operandMetadata.sourcesIds) {
      sources.add(id);
    }
  }

  if (typeOfValue === 'ignored') {
    return;
  }

  for (const lvalue of eachInstructionLValue(instr)) {
    context.derivationCache.addDerivationEntry(lvalue, sources, typeOfValue);
  }

  for (const operand of eachInstructionOperand(instr)) {
    switch (operand.effect) {
      case Effect.Capture:
      case Effect.Store:
      case Effect.ConditionallyMutate:
      case Effect.ConditionallyMutateIterator:
      case Effect.Mutate: {
        if (isMutable(instr, operand)) {
          context.derivationCache.addDerivationEntry(
            operand,
            sources,
            typeOfValue,
          );
        }
        break;
      }
      case Effect.Freeze:
      case Effect.Read: {
        // no-op
        break;
      }
      case Effect.Unknown: {
        CompilerError.invariant(false, {
          reason: 'Unexpected unknown effect',
          description: null,
          details: [
            {
              kind: 'error',
              loc: operand.loc,
              message: 'Unexpected unknown effect',
            },
          ],
        });
      }
      default: {
        assertExhaustive(
          operand.effect,
          `Unexpected effect kind \`${operand.effect}\``,
        );
      }
    }
  }
}

function validateEffect(
  effectFunction: HIRFunction,
  context: ValidationContext,
): void {
  const seenBlocks: Set<BlockId> = new Set();

  const effectDerivedSetStateCalls: Array<{
    value: CallExpression;
    sourceIds: Set<IdentifierId>;
  }> = [];

  for (const block of effectFunction.body.blocks.values()) {
    for (const pred of block.preds) {
      if (!seenBlocks.has(pred)) {
        // skip if block has a back edge
        return;
      }
    }

    for (const instr of block.instructions) {
      if (
        instr.value.kind === 'CallExpression' &&
        isSetStateType(instr.value.callee.identifier) &&
        instr.value.args.length === 1 &&
        instr.value.args[0].kind === 'Identifier'
      ) {
        const argMetadata = context.derivationCache.cache.get(
          instr.value.args[0].identifier.id,
        );

        if (argMetadata !== undefined) {
          effectDerivedSetStateCalls.push({
            value: instr.value,
            sourceIds: argMetadata.sourcesIds,
          });
        }
      }
    }
    seenBlocks.add(block.id);
  }

  for (const derivedSetStateCall of effectDerivedSetStateCalls) {
    context.errors.push({
      category: ErrorCategory.EffectDerivationsOfState,
      reason:
        'Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)',
      description: null,
      loc: derivedSetStateCall.value.callee.loc,
      suggestions: null,
    });
  }
}
