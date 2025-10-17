/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BasicBlock,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  Instruction,
  isSetStateType,
  Place,
  isUseStateType,
  Effect,
  isUseEffectHookType,
  FunctionExpression,
  BlockId,
  SourceLocation,
  CallExpression,
} from '../HIR';
import {eachInstructionLValue, eachInstructionOperand} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {
  CompilerDiagnostic,
  CompilerError,
  ErrorCategory,
} from '../CompilerError';
import {assertExhaustive} from '../Utils/utils';

type TypeOfValue = 'ignored' | 'fromProps' | 'fromState' | 'fromPropsAndState';

type DerivationMetadata = {
  typeOfValue: TypeOfValue;
  place: Place;
  sourcesIds: Set<IdentifierId>;
};

type DerivationCache = Map<IdentifierId, DerivationMetadata>;

type SetStateCallCache = Map<string | undefined | null, Array<Place>>;

type FunctionExpressionsCache = Map<IdentifierId, FunctionExpression>;

type DerivedSetStateCall = {
  value: CallExpression;
  sourceIds: Set<IdentifierId>;
};

type ErrorMetadata = {
  derivedComputationDetails: string;
  loc: SourceLocation;
};

const DERIVE_IN_RENDER_REASON =
  'You might net need an effect. Derive values in render, not effects.';

const DERIVE_IN_RENDER_DETAIL_MESSAGE =
  'This should be computed during render, not in an effect';

const DERIVE_IN_RENDER_DESCRIPTION =
  'State derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user';

/**
 * Validates that useEffect is not used for derived computations which could/should
 * be performed in render.
 *
 * See https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state
 */
export function validateNoDerivedComputationsInEffects(fn: HIRFunction): void {
  const derivationCache: DerivationCache = new Map();
  const setStateCallCache: SetStateCallCache = new Map();
  const effectSetStateCache: SetStateCallCache = new Map();
  const functionExpressionsCache: FunctionExpressionsCache = new Map();

  const stateDerivationErrors: Array<ErrorMetadata> = [];

  parseFNParameters(fn, derivationCache);

  for (const block of fn.body.blocks.values()) {
    parseBlockPhi(block, derivationCache);

    for (const instr of block.instructions) {
      parseInstr(
        instr,
        derivationCache,
        setStateCallCache,
        effectSetStateCache,
        functionExpressionsCache,
        stateDerivationErrors,
      );
    }
  }

  const compilerError = generateCompilerErrors(stateDerivationErrors);

  if (compilerError.hasErrors()) {
    throw compilerError;
  }
}

function parseFNParameters(fn: HIRFunction, derivationCache: DerivationCache) {
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
}

function parseBlockPhi(
  block: BasicBlock,
  derivationCache: DerivationCache,
): void {
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
  derivationCache: DerivationCache,
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

function parseInstr(
  instr: Instruction,
  derivationCache: DerivationCache,
  setStateCallCache: SetStateCallCache,
  effectSetStateCache: SetStateCallCache,
  functionExpressionsCache: FunctionExpressionsCache,
  stateDerivationErrors: Array<ErrorMetadata>,
): void {
  const {value, lvalue} = instr;

  let typeOfValue: TypeOfValue = 'ignored';
  const sources: Set<IdentifierId> = new Set();

  // Recursively parse function expressions
  if (value.kind === 'FunctionExpression') {
    for (const [, block] of value.loweredFunc.func.body.blocks) {
      for (const instr of block.instructions) {
        functionExpressionsCache.set(lvalue.identifier.id, value);

        parseInstr(
          instr,
          derivationCache,
          setStateCallCache,
          effectSetStateCache,
          functionExpressionsCache,
          stateDerivationErrors,
        );
      }
    }
  }
  // Record setState calls
  else if (
    value.kind === 'CallExpression' &&
    isSetStateType(value.callee.identifier)
  ) {
    addSetStateCallEntry(value.callee, setStateCallCache);
  } else if (value.kind === 'CallExpression' || value.kind === 'MethodCall') {
    const callee =
      value.kind === 'CallExpression' ? value.callee : value.property;

    // Handle values derived from useState calls
    if (isUseStateType(lvalue.identifier)) {
      const stateValueSource = value.args[0];
      if (stateValueSource.kind === 'Identifier') {
        sources.add(stateValueSource.identifier.id);
      }
      typeOfValue = joinValue(typeOfValue, 'fromState');
    }
    // Validate useEffect calls
    else if (
      isUseEffectHookType(callee.identifier) &&
      value.args.length === 2 &&
      value.args[0].kind === 'Identifier' &&
      value.args[1].kind === 'Identifier'
    ) {
      const effectFunction = functionExpressionsCache.get(
        value.args[0].identifier.id,
      );

      validateEffect(
        effectFunction?.loweredFunc.func,
        effectSetStateCache,
        derivationCache,
        stateDerivationErrors,
      );
    }
  }

  parseOperands(instr, derivationCache, typeOfValue, sources);
}

function addSetStateCallEntry(
  callee: Place,
  setStateCallCache: SetStateCallCache,
) {
  if (callee.loc === GeneratedSource) {
    return;
  }

  if (setStateCallCache.has(callee.loc.identifierName)) {
    setStateCallCache.get(callee.loc.identifierName)!.push(callee);
  } else {
    setStateCallCache.set(callee.loc.identifierName, [callee]);
  }
}

function validateEffect(
  effectFunction: HIRFunction | undefined,
  effectSetStateCache: SetStateCallCache,
  derivationCache: DerivationCache,
  stateDerivationErrors: Array<ErrorMetadata>,
): void {
  if (effectFunction === undefined) {
    return;
  }

  const seenBlocks: Set<BlockId> = new Set();
  const effectDerivedSetStateCalls: Array<DerivedSetStateCall> = [];

  for (const block of effectFunction.body.blocks.values()) {
    for (const pred of block.preds) {
      if (!seenBlocks.has(pred)) {
        // skip if block has a back edge
        return;
      }
    }
    for (const instr of block.instructions) {
      const {value} = instr;
      if (
        value.kind === 'CallExpression' &&
        isSetStateType(value.callee.identifier) &&
        value.args.length === 1 &&
        value.args[0].kind === 'Identifier'
      ) {
        addSetStateCallEntry(value.callee, effectSetStateCache);
        const argMetadata = derivationCache.get(value.args[0].identifier.id);

        if (argMetadata !== undefined) {
          effectDerivedSetStateCalls.push({
            value: value,
            sourceIds: argMetadata.sourcesIds,
          });
        }
      }
    }

    seenBlocks.add(block.id);
  }

  generateDerivedComputationDetails(
    effectDerivedSetStateCalls,
    derivationCache,
    stateDerivationErrors,
  );
}

function generateDerivedComputationDetails(
  effectDerivedSetStateCalls: Array<DerivedSetStateCall>,
  derivationCache: DerivationCache,
  stateDerivationErrors: Array<ErrorMetadata>,
) {
  console.log(derivationCache);
  for (const derivedCall of effectDerivedSetStateCalls) {
    const arg = derivedCall.value.args[0];
    if (arg.kind === 'Identifier') {
      const argMetadata = derivationCache.get(arg.identifier.id);
      if (argMetadata !== undefined) {
        const derivationSources: Array<string> = [];

        for (const sourceId of argMetadata.sourcesIds) {
          const sourceMetadata = derivationCache.get(sourceId);
          if (sourceMetadata !== undefined) {
            const sourceName =
              sourceMetadata.place.identifier.name?.value ||
              `identifier_${sourceId}`;
            derivationSources.push(sourceName);
          }
        }

        let derivationType: string;
        switch (argMetadata.typeOfValue) {
          case 'fromProps':
            derivationType = 'props';
            break;
          case 'fromState':
            derivationType = 'local state';
            break;
          case 'fromPropsAndState':
            derivationType = 'local state and props';
            break;
          default:
            derivationType = 'unknown source';
            break;
        }

        const sourcesList =
          derivationSources.length > 0
            ? ` [${derivationSources.join(', ')}]`
            : '';

        const formattedDetails = `State is being derived from ${derivationType}${sourcesList}`;

        stateDerivationErrors.push({
          derivedComputationDetails: formattedDetails,
          loc: derivedCall.value.loc,
        });
      }
    }
  }
}

function parseOperands(
  instr: Instruction,
  derivationCache: DerivationCache,
  typeOfValue: TypeOfValue,
  sourceIds: Set<IdentifierId>,
) {
  for (const operand of eachInstructionOperand(instr)) {
    const operandMetadata = derivationCache.get(operand.identifier.id);

    if (operandMetadata === undefined) {
      continue;
    }

    typeOfValue = joinValue(typeOfValue, operandMetadata.typeOfValue);
    for (const id of operandMetadata.sourcesIds) {
      sourceIds.add(id);
    }
  }

  if (typeOfValue === 'ignored') {
    return;
  }

  propagateTypeOfValue(instr, sourceIds, typeOfValue, derivationCache);
}

function propagateTypeOfValue(
  instr: Instruction,
  sourceIds: Set<IdentifierId>,
  typeOfValue: TypeOfValue,
  derivationCache: DerivationCache,
): void {
  for (const lvalue of eachInstructionLValue(instr)) {
    addDerivationEntry(lvalue, sourceIds, typeOfValue, derivationCache);
  }

  for (const operand of eachInstructionOperand(instr)) {
    switch (operand.effect) {
      case Effect.Capture:
      case Effect.Store:
      case Effect.ConditionallyMutate:
      case Effect.ConditionallyMutateIterator:
      case Effect.Mutate: {
        if (isMutable(instr, operand)) {
          addDerivationEntry(operand, sourceIds, typeOfValue, derivationCache);
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

function generateCompilerErrors(stateDerivationErrors: Array<ErrorMetadata>) {
  const throwableErrors = new CompilerError();
  for (const e of stateDerivationErrors) {
    throwableErrors.pushDiagnostic(
      CompilerDiagnostic.create({
        description:
          DERIVE_IN_RENDER_DESCRIPTION + `\n\n${e.derivedComputationDetails}`,
        category: ErrorCategory.EffectStateDerivationCalculateInRender,
        reason: DERIVE_IN_RENDER_REASON,
      }).withDetails({
        kind: 'error',
        loc: e.loc,
        message: DERIVE_IN_RENDER_DETAIL_MESSAGE,
      }),
    );
  }

  return throwableErrors;
}
