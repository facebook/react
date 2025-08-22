/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, Effect, ErrorSeverity, SourceLocation} from '..';
import {
  ArrayExpression,
  BasicBlock,
  BlockId,
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  Instruction,
  Place,
  isSetStateType,
  isUseEffectHookType,
  isUseStateType,
  GeneratedSource,
} from '../HIR';
import {printInstruction} from '../HIR/PrintHIR';
import {
  eachInstructionOperand,
  eachTerminalOperand,
  eachInstructionLValue,
} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {assertExhaustive} from '../Utils/utils';

// TODO: Maybe I can consolidate some types
type SetStateCall = {
  loc: SourceLocation;
  invalidDeps: DerivationMetadata;
  setStateId: IdentifierId;
};

type TypeOfValue = 'ignored' | 'fromProps' | 'fromState' | 'fromPropsOrState';

type SetStateName = string | undefined | null;

type DerivationMetadata = {
  typeOfValue: TypeOfValue;
  place: Place;
  sources: Set<Place>;
};

type ErrorMetadata = {
  errorType: TypeOfValue;
  invalidDepInfo: string | undefined;
  loc: SourceLocation;
  setStateName: SetStateName;
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

function updateDerivationMetadata(
  target: Place,
  sources: Array<DerivationMetadata> | undefined,
  typeOfValue: TypeOfValue | undefined,
  derivedTuple: Map<IdentifierId, DerivationMetadata>,
): void {
  let newValue: DerivationMetadata = {
    place: target,
    sources: new Set(),
    typeOfValue: typeOfValue ?? 'ignored',
  };

  if (sources !== undefined) {
    for (const source of sources) {
      /*
       * If the identifier of the source is a promoted identifier, then
       *  we should set the target as the source.
       */
      if (source.place.identifier.name?.kind === 'promoted') {
        newValue.sources.add(target);
      } else {
        for (const place of source.sources) {
          newValue.sources.add(place);
        }
      }
    }
  }

  derivedTuple.set(target.identifier.id, newValue);
}

function parseInstr(
  instr: Instruction,
  derivedTuple: Map<IdentifierId, DerivationMetadata>,
  setStateCalls: Map<SetStateName, Array<Place>>,
): void {
  // Recursively parse function expressions
  if (instr.value.kind === 'FunctionExpression') {
    for (const [, block] of instr.value.loweredFunc.func.body.blocks) {
      for (const instr of block.instructions) {
        parseInstr(instr, derivedTuple, setStateCalls);
      }
    }
  }

  let typeOfValue: TypeOfValue = 'ignored';

  // TODO: Not sure if this will catch every time we create a new useState
  let sources: Array<DerivationMetadata> = [];
  if (
    instr.value.kind === 'Destructure' &&
    instr.value.lvalue.pattern.kind === 'ArrayPattern' &&
    isUseStateType(instr.value.value.identifier)
  ) {
    typeOfValue = 'fromState';

    const stateValueSource = instr.value.lvalue.pattern.items[0];
    if (stateValueSource.kind === 'Identifier') {
      sources.push({
        place: stateValueSource,
        typeOfValue: typeOfValue,
        sources: new Set([stateValueSource]),
      });
    }
  }

  if (
    instr.value.kind === 'CallExpression' &&
    isSetStateType(instr.value.callee.identifier) &&
    instr.value.args.length === 1 &&
    instr.value.args[0].kind === 'Identifier' &&
    instr.value.callee.loc !== GeneratedSource
  ) {
    if (setStateCalls.has(instr.value.callee.loc.identifierName)) {
      setStateCalls
        .get(instr.value.callee.loc.identifierName)!
        .push(instr.value.callee);
    } else {
      setStateCalls.set(instr.value.callee.loc.identifierName, [
        instr.value.callee,
      ]);
    }
  }

  for (const operand of eachInstructionOperand(instr)) {
    const opSource = derivedTuple.get(operand.identifier.id);
    if (opSource === undefined) {
      continue;
    }

    typeOfValue = joinValue(typeOfValue, opSource.typeOfValue);
    sources.push(opSource);
  }

  if (typeOfValue !== 'ignored') {
    for (const lvalue of eachInstructionLValue(instr)) {
      updateDerivationMetadata(lvalue, sources, typeOfValue, derivedTuple);
    }

    for (const operand of eachInstructionOperand(instr)) {
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
}

function parseBlockPhi(
  block: BasicBlock,
  derivedTuple: Map<IdentifierId, DerivationMetadata>,
): void {
  for (const phi of block.phis) {
    for (const operand of phi.operands.values()) {
      const source = derivedTuple.get(operand.identifier.id);
      updateDerivationMetadata(
        phi.place,
        source !== undefined ? [source] : undefined,
        source?.typeOfValue,
        derivedTuple,
      );
    }
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
export function validateNoDerivedComputationsInEffects(fn: HIRFunction): void {
  const candidateDependencies: Map<IdentifierId, ArrayExpression> = new Map();
  const functions: Map<IdentifierId, FunctionExpression> = new Map();
  const locals: Map<IdentifierId, IdentifierId> = new Map();
  const derivedTuple: Map<IdentifierId, DerivationMetadata> = new Map();

  const effectSetStates: Map<SetStateName, Array<Place>> = new Map();
  const setStateCalls: Map<SetStateName, Array<Place>> = new Map();

  const errors: Array<ErrorMetadata> = [];

  if (fn.fnType === 'Hook') {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        derivedTuple.set(param.identifier.id, {
          place: param,
          sources: new Set([param]),
          typeOfValue: 'fromProps',
        });
      }
    }
  } else if (fn.fnType === 'Component') {
    const props = fn.params[0];
    if (props != null && props.kind === 'Identifier') {
      derivedTuple.set(props.identifier.id, {
        place: props,
        sources: new Set([props]),
        typeOfValue: 'fromProps',
      });
    }
  }

  for (const block of fn.body.blocks.values()) {
    parseBlockPhi(block, derivedTuple);

    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      parseInstr(instr, derivedTuple, setStateCalls);

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
              effectSetStates,
              errors,
            );
          }
        }
      }
    }
  }

  const throwableErrors = new CompilerError();
  for (const error of errors) {
    let reason;
    // TODO: Not sure if this is robust enough.
    /*
     * If we use a setState from an invalid useEffect elsewhere then we probably have to
     * hoist state up, else we should calculate in render
     */
    if (
      setStateCalls.get(error.setStateName)?.length !=
        effectSetStates.get(error.setStateName)?.length &&
      error.errorType !== 'fromState'
    ) {
      reason =
        'Consider lifting state up to the parent component to make this a controlled component. (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)';
    } else {
      reason =
        'You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)';
    }

    throwableErrors.push({
      reason: reason,
      description: `You are using invalid dependencies: \n\n${error.invalidDepInfo}`,
      severity: ErrorSeverity.InvalidReact,
      loc: error.loc,
    });
  }

  if (throwableErrors.hasErrors()) {
    throw throwableErrors;
  }
}

function validateEffect(
  effectFunction: HIRFunction,
  effectDeps: Array<IdentifierId>,
  derivedTuple: Map<IdentifierId, DerivationMetadata>,
  effectSetStates: Map<SetStateName, Array<Place>>,
  errors: Array<ErrorMetadata>,
): void {
  // TODO: This might be wrong gotta double check
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
  const effectInvalidlyDerived: Map<IdentifierId, DerivationMetadata> =
    new Map();

  for (const dep of effectDeps) {
    values.set(dep, [dep]);
    const depMetadata = derivedTuple.get(dep);
    if (depMetadata !== undefined) {
      effectInvalidlyDerived.set(dep, depMetadata);
    }
  }

  const setStateCallsInEffect: Array<SetStateCall> = [];
  for (const block of effectFunction.body.blocks.values()) {
    for (const pred of block.preds) {
      if (!seenBlocks.has(pred)) {
        // skip if block has a back edge
        console.log('skipping block');
        return;
      }
    }

    parseBlockPhi(block, effectInvalidlyDerived);

    for (const instr of block.instructions) {
      if (
        instr.value.kind === 'CallExpression' &&
        isSetStateType(instr.value.callee.identifier) &&
        instr.value.args.length === 1 &&
        instr.value.args[0].kind === 'Identifier' &&
        instr.value.callee.loc !== GeneratedSource &&
        instr.value.callee.loc.identifierName !== undefined &&
        instr.value.callee.loc.identifierName !== null
      ) {
        if (effectSetStates.has(instr.value.callee.loc.identifierName)) {
          effectSetStates
            .get(instr.value.callee.loc.identifierName)!
            .push(instr.value.callee);
        } else {
          effectSetStates.set(instr.value.callee.loc.identifierName, [
            instr.value.callee,
          ]);
        }
      }
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
            const invalidDeps = derivedTuple.get(
              instr.value.args[0].identifier.id,
            );

            if (invalidDeps !== undefined) {
              setStateCallsInEffect.push({
                loc: instr.value.callee.loc,
                setStateId: instr.value.callee.identifier.id,
                invalidDeps: invalidDeps,
              });
            }
          }
          break;
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

  for (const call of setStateCallsInEffect) {
    const placeNames = Array.from(call.invalidDeps.sources)
      .map(place => place.identifier.name?.value)
      .filter(Boolean)
      .join(', ');

    let sourceNames = '';
    let invalidDepInfo = '';

    if (call.invalidDeps.typeOfValue === 'fromProps') {
      sourceNames += `[${placeNames}], `;
      sourceNames = sourceNames.slice(0, -2);
      invalidDepInfo = sourceNames
        ? `Invalid deps from props ${sourceNames}`
        : '';
    } else if (call.invalidDeps.typeOfValue === 'fromState') {
      sourceNames += `[${placeNames}], `;
      sourceNames = sourceNames.slice(0, -2);
      invalidDepInfo = sourceNames
        ? `Invalid deps from local state: ${sourceNames}`
        : '';
    } else {
      sourceNames += `[${placeNames}], `;
      sourceNames = sourceNames.slice(0, -2);
      invalidDepInfo = sourceNames
        ? `Invalid deps from both props and local state: ${sourceNames}`
        : '';
    }

    errors.push({
      errorType: call.invalidDeps.typeOfValue,
      invalidDepInfo: invalidDepInfo,
      loc: call.loc,
      setStateName:
        call.loc !== GeneratedSource ? call.loc.identifierName : undefined,
    });
  }
}
