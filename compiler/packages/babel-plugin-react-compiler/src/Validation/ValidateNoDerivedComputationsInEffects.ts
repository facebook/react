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
  isUseRefType,
  GeneratedSource,
  SourceLocation,
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
export function validateNoDerivedComputationsInEffects(fn: HIRFunction): void {
  const functions: Map<IdentifierId, FunctionExpression> = new Map();

  const derivationCache: Map<IdentifierId, DerivationMetadata> = new Map();
  const setStateCache: Map<string | undefined | null, Array<Place>> = new Map();

  const effects: Array<HIRFunction> = [];

  if (fn.fnType === 'Hook') {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        derivationCache.set(param.identifier.id, {
          place: param,
          sourcesIds: new Set([param.identifier.id]),
          typeOfValue: 'fromProps',
        });
      }
    }
  } else if (fn.fnType === 'Component') {
    const props = fn.params[0];
    if (props != null && props.kind === 'Identifier') {
      derivationCache.set(props.identifier.id, {
        place: props,
        sourcesIds: new Set([props.identifier.id]),
        typeOfValue: 'fromProps',
      });
    }
  }

  const errors = new CompilerError();

  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      let typeOfValue: TypeOfValue = 'ignored';
      let sourcesIds: Set<IdentifierId> = new Set();
      for (const operand of phi.operands.values()) {
        const operandMetadata = derivationCache.get(operand.identifier.id);

        if (operandMetadata === undefined) {
          continue;
        }

        typeOfValue = joinValue(typeOfValue, operandMetadata.typeOfValue);
        sourcesIds.add(operand.identifier.id);
      }

      if (typeOfValue !== 'ignored') {
        addDerivationEntry(phi.place, sourcesIds, typeOfValue, derivationCache);
      }
    }
    for (const i of block.instructions) {
      function recordInstructiorDerivations(instr: Instruction): void {
        let typeOfValue: TypeOfValue = 'ignored';
        const sources: Set<IdentifierId> = new Set();
        const {lvalue, value} = instr;
        if (value.kind === 'FunctionExpression') {
          functions.set(lvalue.identifier.id, value);
          for (const [, block] of value.loweredFunc.func.body.blocks) {
            for (const instr of block.instructions) {
              recordInstructiorDerivations(instr);
            }
          }
        } else if (
          value.kind === 'CallExpression' ||
          value.kind === 'MethodCall'
        ) {
          const callee =
            value.kind === 'CallExpression' ? value.callee : value.property;
          if (
            isUseEffectHookType(callee.identifier) &&
            value.args.length === 2 &&
            value.args[0].kind === 'Identifier' &&
            value.args[1].kind === 'Identifier'
          ) {
            const effectFunction = functions.get(value.args[0].identifier.id);
            if (effectFunction != null) {
              effects.push(effectFunction.loweredFunc.func);
            }
          } else if (isUseStateType(lvalue.identifier)) {
            const stateValueSource = value.args[0];
            if (stateValueSource.kind === 'Identifier') {
              sources.add(stateValueSource.identifier.id);
            }
            typeOfValue = joinValue(typeOfValue, 'fromState');
          }
        }

        for (const operand of eachInstructionOperand(instr)) {
          // Record setState usages everywhere
          switch (instr.value.kind) {
            case 'JsxExpression':
            case 'CallExpression':
            case 'MethodCall':
              if (
                isSetStateType(operand.identifier) &&
                operand.loc !== GeneratedSource
              ) {
                if (setStateCache.has(operand.loc.identifierName)) {
                  setStateCache.get(operand.loc.identifierName)!.push(operand);
                } else {
                  setStateCache.set(operand.loc.identifierName, [operand]);
                }
              }
              break;
            default:
          }

          const operandMetadata = derivationCache.get(operand.identifier.id);

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
          addDerivationEntry(lvalue, sources, typeOfValue, derivationCache);
        }

        for (const operand of eachInstructionOperand(instr)) {
          switch (operand.effect) {
            case Effect.Capture:
            case Effect.Store:
            case Effect.ConditionallyMutate:
            case Effect.ConditionallyMutateIterator:
            case Effect.Mutate: {
              if (isMutable(instr, operand)) {
                addDerivationEntry(
                  operand,
                  sources,
                  typeOfValue,
                  derivationCache,
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
      recordInstructiorDerivations(i);
    }
  }

  for (const effect of effects) {
    validateEffect(effect, errors, derivationCache, setStateCache);
  }

  if (errors.hasAnyErrors()) {
    throw errors;
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

function addDerivationEntry(
  derivedVar: Place,
  sourcesIds: Set<IdentifierId>,
  typeOfValue: TypeOfValue,
  derivationCache: Map<IdentifierId, DerivationMetadata>,
): void {
  let newValue: DerivationMetadata = {
    place: derivedVar,
    sourcesIds: new Set(),
    typeOfValue: typeOfValue ?? 'ignored',
  };

  if (sourcesIds !== undefined) {
    for (const id of sourcesIds) {
      const sourcePlace = derivationCache.get(id)?.place;

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

  derivationCache.set(derivedVar.identifier.id, newValue);
}

function validateEffect(
  effectFunction: HIRFunction,
  errors: CompilerError,
  derivationCache: Map<IdentifierId, DerivationMetadata>,
  setStateCache: Map<string | undefined | null, Array<Place>>,
): void {
  const effectSetStateCache: Map<
    string | undefined | null,
    Array<Place>
  > = new Map();
  const seenBlocks: Set<BlockId> = new Set();

  const effectDerivedSetStateCalls: Array<{
    value: CallExpression;
    loc: SourceLocation;
    sourceIds: Set<IdentifierId>;
  }> = [];

  const globals: Set<IdentifierId> = new Set();
  for (const block of effectFunction.body.blocks.values()) {
    for (const pred of block.preds) {
      if (!seenBlocks.has(pred)) {
        // skip if block has a back edge
        return;
      }
    }

    for (const instr of block.instructions) {
      // Early return if any instruction is deriving a value from a ref
      if (isUseRefType(instr.lvalue.identifier)) {
        return;
      }

      for (const operand of eachInstructionOperand(instr)) {
        switch (instr.value.kind) {
          case 'JsxExpression':
          case 'CallExpression':
          case 'MethodCall':
            if (
              isSetStateType(operand.identifier) &&
              operand.loc !== GeneratedSource
            ) {
              if (effectSetStateCache.has(operand.loc.identifierName)) {
                effectSetStateCache
                  .get(operand.loc.identifierName)!
                  .push(operand);
              } else {
                effectSetStateCache.set(operand.loc.identifierName, [operand]);
              }
            }
            break;
          default:
        }
      }

      if (
        instr.value.kind === 'CallExpression' &&
        isSetStateType(instr.value.callee.identifier) &&
        instr.value.args.length === 1 &&
        instr.value.args[0].kind === 'Identifier'
      ) {
        const argMetadata = derivationCache.get(
          instr.value.args[0].identifier.id,
        );

        if (argMetadata !== undefined) {
          effectDerivedSetStateCalls.push({
            value: instr.value,
            loc: instr.value.callee.loc,
            sourceIds: argMetadata.sourcesIds,
          });
        }
      } else if (instr.value.kind === 'CallExpression') {
        const calleeMetadata = derivationCache.get(
          instr.value.callee.identifier.id,
        );

        if (
          calleeMetadata !== undefined &&
          (calleeMetadata.typeOfValue === 'fromProps' ||
            calleeMetadata.typeOfValue === 'fromPropsAndState')
        ) {
          // If the callee is a prop we can't confidently say that it should be derived in render
          return;
        }

        if (globals.has(instr.value.callee.identifier.id)) {
          // If the callee is a global we can't confidently say that it should be derived in render
          return;
        }
      } else if (instr.value.kind === 'LoadGlobal') {
        globals.add(instr.lvalue.identifier.id);
        for (const operand of eachInstructionOperand(instr)) {
          globals.add(operand.identifier.id);
        }
      }
    }
    seenBlocks.add(block.id);
  }

  for (const derivedSetStateCall of effectDerivedSetStateCalls) {
    if (
      derivedSetStateCall.loc !== GeneratedSource &&
      effectSetStateCache.has(derivedSetStateCall.loc.identifierName) &&
      setStateCache.has(derivedSetStateCall.loc.identifierName) &&
      effectSetStateCache.get(derivedSetStateCall.loc.identifierName)!
        .length ===
        setStateCache.get(derivedSetStateCall.loc.identifierName)!.length
    ) {
      errors.push({
        category: ErrorCategory.EffectDerivationsOfState,
        reason:
          'Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)',
        description: null,
        loc: derivedSetStateCall.value.callee.loc,
        suggestions: null,
      });
    }
  }
}
