/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TypeOf} from 'zod';
import {CompilerError, Effect, ErrorSeverity, SourceLocation} from '..';
import {
  ArrayExpression,
  BlockId,
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  InstructionValue,
  Place,
  isSetStateType,
  isUseEffectHookType,
} from '../HIR';
import {printInstruction, printPlace} from '../HIR/PrintHIR';
import {
  eachInstructionValueOperand,
  eachInstructionOperand,
  eachTerminalOperand,
  eachInstructionLValue,
} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {assertExhaustive} from '../Utils/utils';

type SetStateCall = {
  loc: SourceLocation;
  propsSources: Place[] | undefined; // undefined means state-derived, defined means props-derived
};
type TypeOfValue = 'ignored' | 'fromProps' | 'fromState' | 'fromPropsOrState';

type DerivationMetadata = {
  identifierPlace: Place;
  sources: Place[];
  typeOfValue: TypeOfValue;
};

function joinValue(
  lvalueType: TypeOfValue,
  valueType: TypeOfValue,
): TypeOfValue {
  if (lvalueType === 'ignored') return valueType;
  if (valueType === 'ignored') return lvalueType;
  if (lvalueType === valueType) return lvalueType;
  return 'fromPropsOrState';
}

function propagateDerivation(
  dest: Place,
  source: Place | undefined,
  derivedFromProps: Map<IdentifierId, Place>,
) {
  if (source === undefined) {
    return;
  }

  if (source.identifier.name?.kind === 'promoted') {
    derivedFromProps.set(dest.identifier.id, dest);
  } else {
    derivedFromProps.set(dest.identifier.id, source);
  }
}

function updateDerivationMetadata(
  target: Place,
  sources: DerivationMetadata[],
  typeOfValue: TypeOfValue,
  derivedTuple: Map<IdentifierId, DerivationMetadata>,
): void {
  let newValue: DerivationMetadata = {
    identifierPlace: target,
    sources: [],
    typeOfValue: typeOfValue,
  };

  for (const source of sources) {
    // If the identifier of the source is a promoted identifier, then
    // we should set the source as the first named identifier.
    if (source.identifierPlace.identifier.name?.kind === 'promoted') {
      newValue.sources.push(target);
    } else {
      newValue.sources.push(...source.sources);
    }
  }
  derivedTuple.set(target.identifier.id, newValue);
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
export function validateNoDerivedComputationsInEffects(fn: HIRFunction): void {
  const candidateDependencies: Map<IdentifierId, ArrayExpression> = new Map();
  const functions: Map<IdentifierId, FunctionExpression> = new Map();
  const locals: Map<IdentifierId, IdentifierId> = new Map();

  // MY take on this
  const valueToType: Map<IdentifierId, TypeOfValue> = new Map();
  const valueToSourceProps: Map<IdentifierId, Set<Place>> = new Map();
  const valueToSourceStates: Map<IdentifierId, Set<Place>> = new Map();
  const valueToSources: Map<IdentifierId, Set<Place>> = new Map();

  // Sources are still probably not correct
  const derivedTuple: Map<IdentifierId, DerivationMetadata> = new Map();

  const errors = new CompilerError();

  if (fn.fnType === 'Hook') {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        derivedTuple.set(param.identifier.id, {
          identifierPlace: param,
          sources: [param],
          typeOfValue: 'fromProps',
        });
      }
    }
  } else if (fn.fnType === 'Component') {
    const props = fn.params[0];
    if (props != null && props.kind === 'Identifier') {
      derivedTuple.set(props.identifier.id, {
        identifierPlace: props,
        sources: [props],
        typeOfValue: 'fromProps',
      });
    }
  }

  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      for (const operand of phi.operands.values()) {
        const source = derivedTuple.get(operand.identifier.id);
        if (source !== undefined && source.typeOfValue === 'fromProps') {
          if (
            source.identifierPlace.identifier.name === null ||
            source.identifierPlace.identifier.name?.kind === 'promoted'
          ) {
            derivedTuple.set(phi.place.identifier.id, {
              identifierPlace: phi.place,
              sources: [phi.place],
              typeOfValue: 'fromProps',
            });
          } else {
            derivedTuple.set(phi.place.identifier.id, {
              identifierPlace: phi.place,
              sources: source.sources,
              typeOfValue: 'fromProps',
            });
          }
        }
      }
    }

    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      // This needs to be repeated "recursively" on FunctionExpressions
      // HERE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
      // DERIVATION LOGIC-----------------------------------------------------
      console.log('instr', printInstruction(instr));
      console.log('instr', instr);
      // console.log('instr lValue', instr.lvalue);

      let typeOfValue: TypeOfValue = 'ignored';

      // TODO: Add handling for state derived props
      let sources: DerivationMetadata[] = [];
      for (const operand of eachInstructionValueOperand(value)) {
        const opSource = derivedTuple.get(operand.identifier.id);
        if (opSource === undefined) {
          continue;
        }

        typeOfValue = joinValue(typeOfValue, opSource.typeOfValue);
        sources.push(opSource);
      }

      // TODO: Add handling for state derived props
      if (typeOfValue !== 'ignored') {
        for (const lvalue of eachInstructionLValue(instr)) {
          updateDerivationMetadata(lvalue, sources, typeOfValue, derivedTuple);
        }

        for (const operand of eachInstructionValueOperand(value)) {
          switch (operand.effect) {
            case Effect.Capture:
            case Effect.Store:
            case Effect.ConditionallyMutate:
            case Effect.ConditionallyMutateIterator:
            case Effect.Mutate: {
              if (isMutable(instr, operand)) {
                updateDerivationMetadata(
                  operand,
                  sources,
                  typeOfValue,
                  derivedTuple,
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
                loc: operand.loc,
                suggestions: null,
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
      console.log('derivedTuple', derivedTuple);
      // HERE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

      // console.log('derivedTuple', derivedTuple);
      // DERIVATION LOGIC-----------------------------------------------------
      if (value.kind === 'LoadLocal') {
        locals.set(lvalue.identifier.id, value.place.identifier.id);
      } else if (value.kind === 'ArrayExpression') {
        candidateDependencies.set(lvalue.identifier.id, value);
      } else if (value.kind === 'FunctionExpression') {
        functions.set(lvalue.identifier.id, value);
      } else if (
        value.kind === 'CallExpression' ||
        value.kind === 'MethodCall'
      ) {
        const callee =
          value.kind === 'CallExpression' ? value.callee : value.property;

        // This is a useEffect hook
        if (
          isUseEffectHookType(callee.identifier) &&
          value.args.length === 2 &&
          value.args[0].kind === 'Identifier' &&
          value.args[1].kind === 'Identifier'
        ) {
          const effectFunction = functions.get(value.args[0].identifier.id);
          const deps = candidateDependencies.get(value.args[1].identifier.id);
          if (
            effectFunction != null &&
            deps != null &&
            deps.elements.length !== 0 &&
            deps.elements.every(element => element.kind === 'Identifier')
          ) {
            const dependencies: Array<IdentifierId> = deps.elements.map(dep => {
              CompilerError.invariant(dep.kind === 'Identifier', {
                reason: `Dependency is checked as a place above`,
                loc: value.loc,
              });
              return locals.get(dep.identifier.id) ?? dep.identifier.id;
            });
            validateEffect(
              effectFunction.loweredFunc.func,
              dependencies,
              derivedTuple,
              errors,
            );
          }
        }
      }
    }
  }
  if (errors.hasErrors()) {
    throw errors;
  }
}

function validateEffect(
  effectFunction: HIRFunction,
  effectDeps: Array<IdentifierId>,
  derivedTuple: Map<IdentifierId, DerivationMetadata>,
  errors: CompilerError,
): void {
  for (const operand of effectFunction.context) {
    if (isSetStateType(operand.identifier)) {
      continue;
    } else if (effectDeps.find(dep => dep === operand.identifier.id) != null) {
      continue;
    } else if (derivedTuple.has(operand.identifier.id)) {
      continue;
    } else {
      // Captured something other than the effect dep or setState
      console.log('early return 1');
      return;
    }
  }

  // This might be wrong gotta double check
  let hasInvalidDep = false;
  for (const dep of effectDeps) {
    const depMetadata = derivedTuple.get(dep);
    if (
      effectFunction.context.find(operand => operand.identifier.id === dep) !=
        null ||
      (depMetadata !== undefined && depMetadata.typeOfValue !== 'ignored')
    ) {
      hasInvalidDep = true;
    }
  }

  if (!hasInvalidDep) {
    console.log('early return 2');
    // effect dep wasn't actually used in the function
    return;
  }

  const seenBlocks: Set<BlockId> = new Set();
  // This variable is suspicious maybe we don't need it?
  const values: Map<IdentifierId, Array<IdentifierId>> = new Map();
  const effectInvalidlyDerived: Map<IdentifierId, Place[]> = new Map();

  for (const dep of effectDeps) {
    values.set(dep, [dep]);
    const depMetadata = derivedTuple.get(dep);
    if (depMetadata !== undefined) {
      effectInvalidlyDerived.set(dep, depMetadata.sources);
    }
  }

  const setStateCalls: Array<SetStateCall> = [];
  for (const block of effectFunction.body.blocks.values()) {
    for (const pred of block.preds) {
      if (!seenBlocks.has(pred)) {
        // skip if block has a back edge
        return;
      }
    }

    // TODO: This might need editing
    for (const phi of block.phis) {
      const aggregateDeps: Set<IdentifierId> = new Set();
      let propsSources: Place[] | null = null;

      for (const operand of phi.operands.values()) {
        const deps = values.get(operand.identifier.id);
        if (deps != null) {
          for (const dep of deps) {
            aggregateDeps.add(dep);
          }
        }
        const sources = effectInvalidlyDerived.get(operand.identifier.id);
        if (sources != null) {
          propsSources = sources;
        }
      }

      if (aggregateDeps.size !== 0) {
        values.set(phi.place.identifier.id, Array.from(aggregateDeps));
      }
      if (propsSources != null) {
        effectInvalidlyDerived.set(phi.place.identifier.id, propsSources);
      }
    }

    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'Primitive':
        case 'JSXText':
        case 'LoadGlobal': {
          break;
        }
        case 'LoadLocal': {
          const deps = values.get(instr.value.place.identifier.id);
          if (deps != null) {
            values.set(instr.lvalue.identifier.id, deps);
          }
          break;
        }
        case 'ComputedLoad':
        case 'PropertyLoad':
        case 'BinaryExpression':
        case 'TemplateLiteral':
        case 'CallExpression':
        case 'MethodCall': {
          const aggregateDeps: Set<IdentifierId> = new Set();
          for (const operand of eachInstructionOperand(instr)) {
            const deps = values.get(operand.identifier.id);
            if (deps != null) {
              for (const dep of deps) {
                aggregateDeps.add(dep);
              }
            }
          }
          if (aggregateDeps.size !== 0) {
            values.set(instr.lvalue.identifier.id, Array.from(aggregateDeps));
          }

          if (
            instr.value.kind === 'CallExpression' &&
            isSetStateType(instr.value.callee.identifier) &&
            instr.value.args.length === 1 &&
            instr.value.args[0].kind === 'Identifier'
          ) {
            const deps = values.get(instr.value.args[0].identifier.id);
            console.log('deps', deps);
            if (deps != null && new Set(deps).size === effectDeps.length) {
              // console.log('setState arg', instr.value.args[0].identifier.id);
              // console.log('effectInvalidlyDerived', effectInvalidlyDerived);
              // console.log('derivedTuple', derivedTuple);
              const propSources = derivedTuple.get(
                instr.value.args[0].identifier.id,
              );

              console.log('Final reference', propSources);
              if (propSources !== undefined) {
                setStateCalls.push({
                  loc: instr.value.callee.loc,
                  propsSources: propSources.sources,
                });
              } else {
                setStateCalls.push({
                  loc: instr.value.callee.loc,
                  propsSources: undefined,
                });
              }
            } else {
              // doesn't depend on all deps
              console.log('early return 3');
              return;
            }
          }
          break;
        }
        default: {
          console.log('early return 4');
          return;
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      if (values.has(operand.identifier.id)) {
        return;
      }
    }
    seenBlocks.add(block.id);
  }

  console.log('setStateCalls', setStateCalls);
  for (const call of setStateCalls) {
    if (call.propsSources != null) {
      const propNames = call.propsSources
        .map(place => place.identifier.name?.value)
        .join(', ');
      const propInfo = propNames != null ? ` (from props '${propNames}')` : '';

      errors.push({
        reason: `Consider lifting state up to the parent component to make this a controlled component. (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)`,
        description: `You are using props${propInfo} to update local state in an effect.`,
        severity: ErrorSeverity.InvalidReact,
        loc: call.loc,
        suggestions: null,
      });
    } else {
      errors.push({
        reason:
          'You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)',
        description:
          'This effect updates state based on other state values. ' +
          'Consider calculating this value directly during render',
        severity: ErrorSeverity.InvalidReact,
        loc: call.loc,
        suggestions: null,
      });
    }
  }
}
