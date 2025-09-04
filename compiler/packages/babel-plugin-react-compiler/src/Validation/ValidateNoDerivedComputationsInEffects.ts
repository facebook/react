/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  Effect,
  ErrorSeverity,
  SourceLocation,
} from '..';
import {ErrorCategory} from '../CompilerError';
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
import {eachInstructionOperand, eachInstructionLValue} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {assertExhaustive} from '../Utils/utils';

type SetStateCall = {
  loc: SourceLocation;
  derivedDep: DerivationMetadata;
  setStateId: IdentifierId;
};

type TypeOfValue = 'ignored' | 'fromProps' | 'fromState' | 'fromPropsOrState';

type DerivationMetadata = {
  typeOfValue: TypeOfValue;
  place: Place;
  sources: Array<Place>;
};

type ErrorMetadata = {
  type: TypeOfValue;
  description: string | undefined;
  loc: SourceLocation;
  setStateName: string | undefined | null;
  derivedDepsNames: Array<string>;
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
  const candidateDependencies: Map<IdentifierId, ArrayExpression> = new Map();
  const functions: Map<IdentifierId, FunctionExpression> = new Map();
  const locals: Map<IdentifierId, IdentifierId> = new Map();
  const derivationCache: Map<IdentifierId, DerivationMetadata> = new Map();
  const shadowingUseState: Map<string, Array<SourceLocation>> = new Map();

  const effectSetStates: Map<
    string | undefined | null,
    Array<Place>
  > = new Map();
  const setStateCalls: Map<string | undefined | null, Array<Place>> = new Map();

  const errors: Array<ErrorMetadata> = [];

  if (fn.fnType === 'Hook') {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        derivationCache.set(param.identifier.id, {
          place: param,
          sources: [param],
          typeOfValue: 'fromProps',
        });
      }
    }
  } else if (fn.fnType === 'Component') {
    const props = fn.params[0];
    if (props != null && props.kind === 'Identifier') {
      derivationCache.set(props.identifier.id, {
        place: props,
        sources: [props],
        typeOfValue: 'fromProps',
      });
    }
  }

  for (const block of fn.body.blocks.values()) {
    parseBlockPhi(block, derivationCache);

    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      parseInstr(instr, derivationCache, setStateCalls, shadowingUseState);

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
              derivationCache,
              effectSetStates,
              errors,
            );
          }
        }
      }
    }
  }

  const compilerError = generateCompilerError(
    setStateCalls,
    effectSetStates,
    shadowingUseState,
    errors,
  );

  if (compilerError.hasErrors()) {
    throw compilerError;
  }
}

function generateCompilerError(
  setStateCalls: Map<string | undefined | null, Array<Place>>,
  effectSetStates: Map<string | undefined | null, Array<Place>>,
  shadowingUseState: Map<string, Array<SourceLocation>>,
  errors: Array<ErrorMetadata>,
): CompilerError {
  const throwableErrors = new CompilerError();
  for (const error of errors) {
    let compilerDiagnostic: CompilerDiagnostic | undefined = undefined;

    /*
     * If we use a setState from an invalid useEffect elsewhere then we probably have to
     * hoist state up, else we should calculate in render
     */
    if (
      setStateCalls.get(error.setStateName)?.length !=
        effectSetStates.get(error.setStateName)?.length &&
      error.type !== 'fromState'
    ) {
      compilerDiagnostic = CompilerDiagnostic.create({
        description: `The setState within a useEffect is deriving from ${error.description}. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there. If you are purposefully initializing state with a prop, and want to update it when a prop changes, do so conditionally in render`,
        category: ErrorCategory.EffectDerivationShadowingParentState,
        severity: ErrorSeverity.InvalidReact,
        reason:
          'You might not need an effect. Local state shadows parent state.',
      }).withDetail({
        kind: 'error',
        loc: error.loc,
        message: `this derives values from props ${error.type === 'fromPropsOrState' ? 'and local state ' : ''}to synchronize state`,
      });

      for (const derivedDep of error.derivedDepsNames) {
        if (shadowingUseState.has(derivedDep)) {
          for (const loc of shadowingUseState.get(derivedDep)!) {
            compilerDiagnostic.withDetail({
              kind: 'error',
              loc: loc,
              message: `this useState shadows ${derivedDep}`,
            });
          }
        }
      }

      for (const [key, setStateCallArray] of effectSetStates) {
        if (setStateCallArray.length === 0) {
          continue;
        }

        const nonUseEffectSetStateCalls = setStateCalls.get(key);
        if (nonUseEffectSetStateCalls) {
          for (const place of nonUseEffectSetStateCalls) {
            if (!setStateCallArray.includes(place)) {
              compilerDiagnostic.withDetail({
                kind: 'error',
                loc: place.loc,
                message:
                  'this setState updates the shadowed state, but should call an onChange event from the parent',
              });
            }
          }
        }
      }
    } else {
      compilerDiagnostic = CompilerDiagnostic.create({
        description: `${error.description ? error.description.charAt(0).toUpperCase() + error.description.slice(1) : ''}. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.`,
        category: ErrorCategory.EffectDerivationDeriveInRender,
        severity: ErrorSeverity.InvalidReact,
        reason:
          'You might not need an effect. Derive values in render, not effects.',
      }).withDetail({
        kind: 'error',
        loc: error.loc,
        message: 'This should be computed during render, not in an effect',
      });
    }

    if (compilerDiagnostic) {
      throwableErrors.pushDiagnostic(compilerDiagnostic);
    }
  }

  return throwableErrors;
}

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
  derivationCache: Map<IdentifierId, DerivationMetadata>,
): void {
  let newValue: DerivationMetadata = {
    place: target,
    sources: [],
    typeOfValue: typeOfValue ?? 'ignored',
  };

  if (sources !== undefined) {
    for (const source of sources) {
      /*
       * If the identifier of the source is a promoted identifier, then
       *  we should set the target as the source.
       */
      for (const place of source.sources) {
        if (
          place.identifier.name === null ||
          place.identifier.name?.kind === 'promoted'
        ) {
          newValue.sources.push(target);
        } else {
          newValue.sources.push(place);
        }
      }
    }
  }

  derivationCache.set(target.identifier.id, newValue);
}

function parseInstr(
  instr: Instruction,
  derivationCache: Map<IdentifierId, DerivationMetadata>,
  setStateCalls: Map<string | undefined | null, Array<Place>>,
  shadowingUseState: Map<string, Array<SourceLocation>>,
): void {
  // Recursively parse function expressions
  let typeOfValue: TypeOfValue = 'ignored';

  let sources: Array<DerivationMetadata> = [];
  if (instr.value.kind === 'FunctionExpression') {
    for (const [, block] of instr.value.loweredFunc.func.body.blocks) {
      for (const instr of block.instructions) {
        parseInstr(instr, derivationCache, setStateCalls, shadowingUseState);
      }
    }
  } else if (
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
  } else if (
    (instr.value.kind === 'CallExpression' ||
      instr.value.kind === 'MethodCall') &&
    isUseStateType(instr.lvalue.identifier)
  ) {
    const stateValueSource = instr.value.args[0];
    if (stateValueSource.kind === 'Identifier') {
      sources.push({
        place: stateValueSource,
        typeOfValue: typeOfValue,
        sources: [stateValueSource],
      });
    }

    typeOfValue = joinValue(typeOfValue, 'fromState');
  }

  for (const operand of eachInstructionOperand(instr)) {
    const opSource = derivationCache.get(operand.identifier.id);
    if (opSource === undefined) {
      continue;
    }

    typeOfValue = joinValue(typeOfValue, opSource.typeOfValue);
    sources.push(opSource);

    if (
      (instr.value.kind === 'CallExpression' ||
        instr.value.kind === 'MethodCall') &&
      opSource.typeOfValue === 'fromProps' &&
      isUseStateType(instr.lvalue.identifier)
    ) {
      opSource.sources.forEach(source => {
        if (source.identifier.name !== null) {
          if (shadowingUseState.has(source.identifier.name.value)) {
            shadowingUseState
              .get(source.identifier.name.value)
              ?.push(instr.lvalue.loc);
          } else {
            shadowingUseState.set(source.identifier.name.value, [
              instr.lvalue.loc,
            ]);
          }
        }
      });
    }
  }

  if (typeOfValue !== 'ignored') {
    for (const lvalue of eachInstructionLValue(instr)) {
      updateDerivationMetadata(lvalue, sources, typeOfValue, derivationCache);
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
  derivationCache: Map<IdentifierId, DerivationMetadata>,
): void {
  for (const phi of block.phis) {
    let typeOfValue: TypeOfValue = 'ignored';
    let sources: Array<DerivationMetadata> = [];
    for (const operand of phi.operands.values()) {
      const opSource = derivationCache.get(operand.identifier.id);

      if (opSource === undefined) {
        continue;
      }

      typeOfValue = joinValue(typeOfValue, opSource?.typeOfValue ?? 'ignored');
      sources.push(opSource);
    }

    if (typeOfValue !== 'ignored') {
      updateDerivationMetadata(
        phi.place,
        sources,
        typeOfValue,
        derivationCache,
      );
    }
  }
}

function validateEffect(
  effectFunction: HIRFunction,
  effectDeps: Array<IdentifierId>,
  derivationCache: Map<IdentifierId, DerivationMetadata>,
  effectSetStates: Map<string | undefined | null, Array<Place>>,
  errors: Array<ErrorMetadata>,
): void {
  let isUsingDerivedDeps = false;
  for (const dep of effectDeps) {
    const depMetadata = derivationCache.get(dep);
    if (
      effectFunction.context.find(operand => operand.identifier.id === dep) !=
        null ||
      (depMetadata !== undefined && depMetadata.typeOfValue !== 'ignored')
    ) {
      isUsingDerivedDeps = true;
    }
  }

  if (!isUsingDerivedDeps) {
    // no prop/state derived deps were used in the body of the effect
    return;
  }

  const seenBlocks: Set<BlockId> = new Set();

  const derivedSetStateCall: Array<SetStateCall> = [];
  for (const block of effectFunction.body.blocks.values()) {
    for (const pred of block.preds) {
      if (!seenBlocks.has(pred)) {
        // skip if block has a back edge
        return;
      }
    }

    parseBlockPhi(block, derivationCache);

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
          break;
        }
        case 'ComputedLoad':
        case 'PropertyLoad':
        case 'BinaryExpression':
        case 'TemplateLiteral':
        case 'CallExpression':
        case 'MethodCall': {
          if (
            instr.value.kind === 'CallExpression' &&
            isSetStateType(instr.value.callee.identifier) &&
            instr.value.args.length === 1 &&
            instr.value.args[0].kind === 'Identifier'
          ) {
            const derivedDep = derivationCache.get(
              instr.value.args[0].identifier.id,
            );

            if (derivedDep !== undefined) {
              derivedSetStateCall.push({
                loc: instr.value.callee.loc,
                setStateId: instr.value.callee.identifier.id,
                derivedDep: derivedDep,
              });
            }
          }
          break;
        }
      }
    }

    seenBlocks.add(block.id);
  }

  for (const call of derivedSetStateCall) {
    const derivedDepsStr = Array.from(call.derivedDep.sources)
      .map(place => {
        return place.identifier.name?.value;
      })
      .filter(Boolean)
      .join(', ');

    let errorDescription = '';

    if (call.derivedDep.typeOfValue === 'fromProps') {
      errorDescription = `props [${derivedDepsStr}]`;
    } else if (call.derivedDep.typeOfValue === 'fromState') {
      errorDescription = `local state [${derivedDepsStr}]`;
    } else {
      errorDescription = `both props and local state [${derivedDepsStr}]`;
    }

    errors.push({
      type: call.derivedDep.typeOfValue,
      description: `${errorDescription}`,
      loc: call.loc,
      setStateName:
        call.loc !== GeneratedSource ? call.loc.identifierName : undefined,
      derivedDepsNames: Array.from(call.derivedDep.sources)
        .map(place => {
          return place.identifier.name?.value ?? '';
        })
        .filter(Boolean),
    });
  }
}
