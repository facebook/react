/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TypeOf} from 'zod';
import {CompilerError, ErrorSeverity, SourceLocation} from '..';
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
} from '../HIR/visitors';

type SetStateCall = {
  loc: SourceLocation;
  propsSource: Place | null; // null means state-derived, non-null means props-derived
};
type TypeOfValue = 'ignored' | 'fromProps' | 'fromState' | 'fromPropsOrState';

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
  const derivedFromProps: Map<IdentifierId, Place> = new Map();

  // MY take on this
  const valueToType: Map<IdentifierId, TypeOfValue> = new Map();
  const valueToSourceProps: Map<IdentifierId, Set<Place>> = new Map();
  const valueToSourceStates: Map<IdentifierId, Set<Place>> = new Map();
  const valueToSources: Map<IdentifierId, Set<Place>> = new Map();

  const errors = new CompilerError();

  if (fn.fnType === 'Hook') {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        derivedFromProps.set(param.identifier.id, param);
      }
    }
  } else if (fn.fnType === 'Component') {
    const props = fn.params[0];
    if (props != null && props.kind === 'Identifier') {
      derivedFromProps.set(props.identifier.id, props);
    }
  }

  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      for (const operand of phi.operands.values()) {
        if (derivedFromProps.has(operand.identifier.id)) {
          const source = derivedFromProps.get(operand.identifier.id);

          if (source === undefined) {
            continue;
          }

          if (
            source.identifier.name === null ||
            source.identifier.name?.kind === 'promoted'
          ) {
            derivedFromProps.set(phi.place.identifier.id, phi.place);
          } else {
            derivedFromProps.set(phi.place.identifier.id, source);
          }
        }
      }
    }

    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      let typeOfValue: TypeOfValue = 'ignored';

      // DERIVATION LOGIC-----------------------------------------------------
      console.log('instr', printInstruction(instr));
      console.log('instr', instr);
      console.log('instr lValue', instr.lvalue);

      let source;
      switch (value.kind) {
        // We only need to propagate to the lValue from the operands
        case 'LoadLocal':
        case 'LoadContext':
        case 'NewExpression':
        case 'CallExpression':
        case 'MethodCall':
        case 'UnaryExpression':
        case 'TypeCastExpression':
        case 'JsxExpression':
        case 'ObjectExpression':
        // TODO: ObjectMethod looks complicated, I'm not sure how to trigger it and would
        // like to double check if the generic solution is enough
        case 'ObjectMethod':
        case 'ArrayExpression':
        case 'JsxFragment':
          for (const operand of eachInstructionValueOperand(value)) {
            const opSource = derivedFromProps.get(operand.identifier.id);
            propagateDerivation(lvalue, opSource, derivedFromProps);
          }
          break;
        // We have a nested lValue so we need to first propagate the operands to the
        // nested lValue and then to the instruction's lValue
        case 'StoreLocal':
        case 'StoreContext':
          // store state on value lValue
          source = derivedFromProps.get(value.value.identifier.id);
          if (source !== undefined) {
            propagateDerivation(value.lvalue.place, source, derivedFromProps);
          }

          // store on instruction lValue
          source = derivedFromProps.get(value.lvalue.place.identifier.id);
          if (source !== undefined) {
            propagateDerivation(lvalue, source, derivedFromProps);
          }

          break;
        // special Destructure case
        case 'Destructure':
          source = derivedFromProps.get(value.value.identifier.id);

          if (value.lvalue.pattern.kind === 'ArrayPattern') {
            for (const item of value.lvalue.pattern.items) {
              if (item.kind === 'Identifier') {
                propagateDerivation(item, source, derivedFromProps);
                propagateDerivation(
                  lvalue,
                  derivedFromProps.get(item.identifier.id),
                  derivedFromProps,
                );
              } else if (item.kind === 'Spread') {
                propagateDerivation(item.place, source, derivedFromProps);
                propagateDerivation(
                  lvalue,
                  derivedFromProps.get(item.place.identifier.id),
                  derivedFromProps,
                );
              }
            }
          } else if (value.lvalue.pattern.kind === 'ObjectPattern') {
            for (const property of value.lvalue.pattern.properties) {
              propagateDerivation(property.place, source, derivedFromProps);
              propagateDerivation(
                lvalue,
                derivedFromProps.get(property.place.identifier.id),
                derivedFromProps,
              );
            }
          }

          break;
        case 'BinaryExpression':
          propagateDerivation(lvalue, value.left, derivedFromProps);
          propagateDerivation(lvalue, value.right, derivedFromProps);
          break;

        // No clue
        case 'DeclareLocal':
        case 'DeclareContext':
        // No clue
        // Will never be derived from props
        case 'Primitive':
        case 'JSXText':
        case 'RegExpLiteral':
        case 'MetaProperty':
        // Will never be derived from props

        case 'PropertyStore':
        case 'PropertyLoad':
        case 'PropertyDelete':
        case 'ComputedStore':
        case 'ComputedLoad':
        case 'ComputedDelete':
        case 'LoadGlobal':
        case 'StoreGlobal':
        case 'FunctionExpression':
        case 'TaggedTemplateExpression':
        case 'TemplateLiteral':
        case 'Await':
        case 'GetIterator':
        case 'IteratorNext':
        case 'NextPropertyOf':
        case 'PrefixUpdate':
        case 'PostfixUpdate':
        case 'Debugger':
        case 'StartMemoize':
        case 'FinishMemoize':
        case 'UnsupportedNode':
      }

      for (const operand of eachInstructionOperand(instr)) {
        console.log('operand: ', operand);
      }

      // for (const operand of eachInstructionOperand(instr)) {
      //   console.log('operand: ', operand);
      //   let type: TypeOfValue = 'ignored';
      //   // TODO: Add 'fromState' and 'fromPropsOrState'
      //   if (derivedFromProps.get(operand.identifier.id)) {
      //     type = 'fromProps';
      //   }

      //   typeOfValue = joinValue(typeOfValue, type);
      //   // TODO: Add 'fromState' and 'fromPropsOrState'
      //   if (type === 'fromProps') {
      //     if (valueToSourceProps.has(lvalue.identifier.id)) {
      //       valueToSourceProps.get(lvalue.identifier.id)?.add(operand);
      //     } else {
      //       valueToSourceProps.set(lvalue.identifier.id, new Set([operand]));
      //     }
      //   }
      //   continue;
      // }

      valueToType.set(lvalue.identifier.id, typeOfValue);
      // DERIVATION LOGIC-----------------------------------------------------

      if (value.kind === 'CallExpression' || value.kind === 'MethodCall') {
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
              derivedFromProps,
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
  derivedFromProps: Map<IdentifierId, Place>,
  errors: CompilerError,
  valueToType: Map<IdentifierId, TypeOfValue> = new Map(),
  valueToSourceProps: Map<IdentifierId, Set<Place>> = new Map(),
  valueToSourceState: Map<IdentifierId, Set<Place>> = new Map(),
  valueToSources: Map<IdentifierId, Set<Place>> = new Map(),
): void {
  for (const operand of effectFunction.context) {
    if (isSetStateType(operand.identifier)) {
      continue;
    } else if (effectDeps.find(dep => dep === operand.identifier.id) != null) {
      continue;
    } else if (derivedFromProps.has(operand.identifier.id)) {
      continue;
    } else {
      // Captured something other than the effect dep or setState
      console.log('early return 1');
      return;
    }
  }

  let hasInvalidDep = false;
  for (const dep of effectDeps) {
    if (
      effectFunction.context.find(operand => operand.identifier.id === dep) !=
        null ||
      (valueToType.has(dep) !== null && valueToType.get(dep) !== 'ignored')
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
  const values: Map<IdentifierId, Array<IdentifierId>> = new Map();
  const effectDerivedFromProps: Map<IdentifierId, Set<Place>> = new Map();

  for (const dep of effectDeps) {
    const depToSources = valueToSourceProps.get(dep);
    if (depToSources !== undefined) {
      for (const source of depToSources.values()) {
        if (effectDerivedFromProps.has(dep)) {
          effectDerivedFromProps.get(dep)?.add(source);
        } else {
          effectDerivedFromProps.set(dep, new Set([source]));
        }
      }
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
    // for (const phi of block.phis) {
    //   const aggregateDeps: Set<IdentifierId> = new Set();
    //   let propsSource: Place | null = null;

    //   for (const operand of phi.operands.values()) {
    //     const deps = values.get(operand.identifier.id);
    //     if (deps != null) {
    //       for (const dep of deps) {
    //         aggregateDeps.add(dep);
    //       }
    //     }
    //     const source = effectDerivedFromProps.get(operand.identifier.id);
    //     if (source != null) {
    //       propsSource = source;
    //     }
    //   }

    //   if (aggregateDeps.size !== 0) {
    //     values.set(phi.place.identifier.id, Array.from(aggregateDeps));
    //   }
    //   if (propsSource != null) {
    //     effectDerivedFromProps.set(phi.place.identifier.id, propsSource);
    //   }
    // }

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
            if (deps != null && new Set(deps).size === effectDeps.length) {
              const propsSource = effectDerivedFromProps.get(
                instr.value.args[0].identifier.id,
              );

              if (propsSource !== undefined) {
                for (const source of propsSource.values())
                  setStateCalls.push({
                    loc: instr.value.callee.loc,
                    propsSource: source ?? null,
                  });
              } else {
                setStateCalls.push({
                  loc: instr.value.callee.loc,
                  propsSource: null,
                });
              }
            } else {
              // doesn't depend on all deps
              return;
            }
          }
          break;
        }
        default: {
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

  for (const call of setStateCalls) {
    if (call.propsSource != null) {
      const propName = call.propsSource.identifier.name?.value;
      const propInfo = propName != null ? ` (from prop '${propName}')` : '';

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
