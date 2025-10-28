/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Result} from '../Utils/Result';
import {CompilerDiagnostic, CompilerError, Effect} from '..';
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
  isUseRefType,
  GeneratedSource,
  SourceLocation,
  IdentifierName,
} from '../HIR';
import {eachInstructionLValue, eachInstructionOperand} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {assertExhaustive} from '../Utils/utils';
import {printInstruction} from '../HIR/PrintHIR';

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
  // These should replace the setStateCache and effectSetStateCache once we have
  readonly setStateLoads: Map<IdentifierId, IdentifierId | null>;
  readonly setStateUsages: Map<IdentifierId, Set<SourceLocation>>;
};

class DerivationCache {
  hasChanges: boolean = false;
  cache: Map<IdentifierId, DerivationMetadata> = new Map();
  private previousCache: Map<IdentifierId, DerivationMetadata> | null = null;

  takeSnapshot(): void {
    this.previousCache = new Map();
    for (const [key, value] of this.cache.entries()) {
      this.previousCache.set(key, {
        place: value.place,
        sourcesIds: new Set(value.sourcesIds),
        typeOfValue: value.typeOfValue,
      });
    }
  }

  checkForChanges(): void {
    if (this.previousCache === null) {
      this.hasChanges = true;
      return;
    }

    for (const [key, value] of this.cache.entries()) {
      const previousValue = this.previousCache.get(key);
      if (
        previousValue === undefined ||
        !this.isDerivationEqual(previousValue, value)
      ) {
        this.hasChanges = true;
        return;
      }
    }

    if (this.cache.size !== this.previousCache.size) {
      this.hasChanges = true;
      return;
    }

    this.hasChanges = false;
  }

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

    if (isNamedIdentifier(derivedVar)) {
      newValue.sourcesIds.add(derivedVar.identifier.id);
    }

    for (const id of sourcesIds) {
      const sourceMetadata = this.cache.get(id);

      if (sourceMetadata === undefined) {
        continue;
      }

      if (isNamedIdentifier(sourceMetadata.place)) {
        newValue.sourcesIds.add(sourceMetadata.place.identifier.id);
      } else {
        for (const sourcesSourceId of sourceMetadata.sourcesIds) {
          newValue.sourcesIds.add(sourcesSourceId);
        }
      }
    }

    this.cache.set(derivedVar.identifier.id, newValue);
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

function isNamedIdentifier(place: Place): Boolean {
  return (
    place.identifier.name !== null && place.identifier.name?.kind === 'named'
  );
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
): Result<void, CompilerError> {
  const functions: Map<IdentifierId, FunctionExpression> = new Map();
  const derivationCache = new DerivationCache();
  const errors = new CompilerError();
  const effects: Set<HIRFunction> = new Set();

  const setStateCache: Map<string | undefined | null, Array<Place>> = new Map();
  const effectSetStateCache: Map<
    string | undefined | null,
    Array<Place>
  > = new Map();

  const setStateLoads: Map<IdentifierId, IdentifierId> = new Map();
  const setStateUsages: Map<IdentifierId, Set<SourceLocation>> = new Map();

  const context: ValidationContext = {
    functions,
    errors,
    derivationCache,
    effects,
    setStateLoads,
    setStateUsages,
  };

  if (fn.fnType === 'Hook') {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        context.derivationCache.cache.set(param.identifier.id, {
          place: param,
          sourcesIds: new Set(
            isNamedIdentifier(param) ? [param.identifier.id] : [],
          ),
          typeOfValue: 'fromProps',
        });
      }
    }
  } else if (fn.fnType === 'Component') {
    const props = fn.params[0];
    if (props != null && props.kind === 'Identifier') {
      context.derivationCache.cache.set(props.identifier.id, {
        place: props,
        sourcesIds: new Set(
          isNamedIdentifier(props) ? [props.identifier.id] : [],
        ),
        typeOfValue: 'fromProps',
      });
    }
  }

  let isFirstPass = true;
  do {
    context.derivationCache.takeSnapshot();

    for (const block of fn.body.blocks.values()) {
      recordPhiDerivations(block, context);
      for (const instr of block.instructions) {
        recordInstructionDerivations(instr, context, isFirstPass);
      }
    }

    context.derivationCache.checkForChanges();
    isFirstPass = false;
  } while (context.derivationCache.snapshot());

  for (const effect of effects) {
    validateEffect(effect, context);
  }

  return errors.asResult();
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

function getRootSetState(
  key: IdentifierId,
  loads: Map<IdentifierId, IdentifierId | null>,
  visited: Set<IdentifierId> = new Set(),
): IdentifierId | null {
  if (visited.has(key)) {
    return null;
  }
  visited.add(key);

  const parentId = loads.get(key);

  if (parentId === undefined) {
    return null;
  }

  if (parentId === null) {
    return key;
  }

  return getRootSetState(parentId, loads, visited);
}

function maybeRecordSetState(
  instr: Instruction,
  loads: Map<IdentifierId, IdentifierId | null>,
  usages: Map<IdentifierId, Set<SourceLocation>>,
) {
  for (const operand of eachInstructionLValue(instr)) {
    if (isSetStateType(operand.identifier)) {
      if (instr.value.kind === 'LoadLocal') {
        loads.set(operand.identifier.id, instr.value.place.identifier.id);
      } else {
        // this is a root setState
        loads.set(operand.identifier.id, null);
      }

      const rootSetState = getRootSetState(operand.identifier.id, loads);
      if (rootSetState !== null && usages.get(rootSetState) === undefined) {
        usages.set(rootSetState, new Set([operand.loc]));
      }
    }
  }
}

function recordInstructionDerivations(
  instr: Instruction,
  context: ValidationContext,
  isFirstPass: boolean,
): void {
  if (isFirstPass) {
    maybeRecordSetState(instr, context.setStateLoads, context.setStateUsages);
  }

  let typeOfValue: TypeOfValue = 'ignored';
  const sources: Set<IdentifierId> = new Set();
  const {lvalue, value} = instr;
  if (value.kind === 'FunctionExpression') {
    context.functions.set(lvalue.identifier.id, value);
    for (const [, block] of value.loweredFunc.func.body.blocks) {
      recordPhiDerivations(block, context);
      for (const instr of block.instructions) {
        recordInstructionDerivations(instr, context, isFirstPass);
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
    if (isSetStateType(operand.identifier) && isFirstPass) {
      // this is a root setState
      const rootSetStateId = getRootSetState(
        operand.identifier.id,
        context.setStateLoads,
      );
      if (rootSetStateId !== null) {
        context.setStateUsages.get(rootSetStateId)?.add(operand.loc);
      }
    }

    const operandMetadata = context.derivationCache.cache.get(
      operand.identifier.id,
    );

    if (operandMetadata === undefined) {
      continue;
    }

    typeOfValue = joinValue(typeOfValue, operandMetadata.typeOfValue);
    sources.add(operand.identifier.id);
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
        if (
          isMutable(instr, operand) &&
          context.derivationCache.cache.has(operand.identifier.id)
        ) {
          const operandMetadata = context.derivationCache.cache.get(
            operand.identifier.id,
          );

          if (operandMetadata !== undefined) {
            operandMetadata.typeOfValue = joinValue(
              typeOfValue,
              operandMetadata.typeOfValue,
            );
          }
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

function buildDataFlowTree(
  sourceId: IdentifierId,
  indent: string = '',
  isLast: boolean = true,
  context: ValidationContext,
): string {
  const sourceMetadata = context.derivationCache.cache.get(sourceId);
  if (!sourceMetadata || !sourceMetadata.place.identifier.name?.value) {
    return '';
  }

  const sourceName = sourceMetadata.place.identifier.name.value;
  const prefix = indent + (isLast ? '└── ' : '├── ');
  const childIndent = indent + (isLast ? '    ' : '│   ');

  const childSourceIds = Array.from(sourceMetadata.sourcesIds).filter(
    id => id !== sourceId,
  );

  const isOriginal = childSourceIds.length === 0;

  let result = `${prefix}${sourceName}`;

  if (isOriginal) {
    let typeLabel: string;
    if (sourceMetadata.typeOfValue === 'fromProps') {
      typeLabel = 'Prop';
    } else if (sourceMetadata.typeOfValue === 'fromState') {
      typeLabel = 'State';
    } else {
      typeLabel = 'Prop and State';
    }
    result += ` (${typeLabel})`;
  }

  if (childSourceIds.length > 0) {
    result += '\n';
    childSourceIds.forEach((childId, index) => {
      const childTree = buildDataFlowTree(
        childId,
        childIndent,
        index === childSourceIds.length - 1,
        context,
      );
      if (childTree) {
        result += childTree + '\n';
      }
    });
    result = result.slice(0, -1);
  }

  return result;
}

function validateEffect(
  effectFunction: HIRFunction,
  context: ValidationContext,
): void {
  const seenBlocks: Set<BlockId> = new Set();

  const effectDerivedSetStateCalls: Array<{
    value: CallExpression;
    id: IdentifierId;
    sourceIds: Set<IdentifierId>;
    typeOfValue: TypeOfValue;
  }> = [];

  const effectSetStateUsages: Map<
    IdentifierId,
    Set<SourceLocation>
  > = new Map();

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

      maybeRecordSetState(instr, context.setStateLoads, effectSetStateUsages);

      for (const operand of eachInstructionOperand(instr)) {
        if (isSetStateType(operand.identifier)) {
          const rootSetStateId = getRootSetState(
            operand.identifier.id,
            context.setStateLoads,
          );
          if (rootSetStateId !== null) {
            effectSetStateUsages.get(rootSetStateId)?.add(operand.loc);
          }
        }
      }

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
            id: instr.value.callee.identifier.id,
            sourceIds: argMetadata.sourcesIds,
            typeOfValue: argMetadata.typeOfValue,
          });
        }
      } else if (instr.value.kind === 'CallExpression') {
        const calleeMetadata = context.derivationCache.cache.get(
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
    console.log('effectSetStateUsages', effectSetStateUsages);
    console.log('setStateUsages', context.setStateUsages);
    console.log('setStateLoads', context.setStateLoads);
    console.log('derivedSetStateCall id', derivedSetStateCall.id);

    const rootSetStateCall = getRootSetState(
      derivedSetStateCall.id,
      context.setStateLoads,
    );

    if (
      rootSetStateCall !== null &&
      effectSetStateUsages.has(rootSetStateCall) &&
      context.setStateUsages.has(rootSetStateCall) &&
      effectSetStateUsages.get(rootSetStateCall)!.size ===
        context.setStateUsages.get(rootSetStateCall)!.size - 1
    ) {
      const allSourceIds = Array.from(derivedSetStateCall.sourceIds);
      const trees = allSourceIds
        .map((id, index) =>
          buildDataFlowTree(id, '', index === allSourceIds.length - 1, context),
        )
        .filter(Boolean);

      const propsSet = new Set<string>();
      const stateSet = new Set<string>();

      for (const sourceId of derivedSetStateCall.sourceIds) {
        const sourceMetadata = context.derivationCache.cache.get(sourceId);
        if (
          sourceMetadata &&
          sourceMetadata.place.identifier.name?.value &&
          (sourceMetadata.sourcesIds.size === 0 ||
            (sourceMetadata.sourcesIds.size === 1 &&
              sourceMetadata.sourcesIds.has(sourceId)))
        ) {
          const name = sourceMetadata.place.identifier.name.value;
          if (sourceMetadata.typeOfValue === 'fromProps') {
            propsSet.add(name);
          } else if (sourceMetadata.typeOfValue === 'fromState') {
            stateSet.add(name);
          } else if (sourceMetadata.typeOfValue === 'fromPropsAndState') {
            propsSet.add(name);
            stateSet.add(name);
          }
        }
      }

      const propsArr = Array.from(propsSet);
      const stateArr = Array.from(stateSet);

      let rootSources = '';
      if (propsArr.length > 0) {
        rootSources += `Props: [${propsArr.join(', ')}]`;
      }
      if (stateArr.length > 0) {
        if (rootSources) rootSources += '\n';
        rootSources += `State: [${stateArr.join(', ')}]`;
      }

      const description = `Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user

This setState call is setting a derived value that depends on the following reactive sources:

${rootSources}

Data Flow Tree:
${trees.join('\n')}

See: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state`;

      context.errors.pushDiagnostic(
        CompilerDiagnostic.create({
          description: description,
          category: ErrorCategory.EffectDerivationsOfState,
          reason:
            'You might not need an effect. Derive values in render, not effects.',
        }).withDetails({
          kind: 'error',
          loc: derivedSetStateCall.value.callee.loc,
          message: 'This should be computed during render, not in an effect',
        }),
      );
    }
  }
}
