/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity, SourceLocation} from '..';
import {
  ArrayExpression,
  BlockId,
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  Place,
  isSetStateType,
  isUseEffectHookType,
} from '../HIR';
import {printInstruction, printPlace} from '../HIR/PrintHIR';
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';

type SetStateCall = {
  loc: SourceLocation;
  propsSource: Place | null; // null means state-derived, non-null means props-derived
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
  const derivedFromProps: Map<IdentifierId, Place> = new Map();

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
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      // Track props derivation through instruction effects
      if (instr.effects != null) {
        for (const effect of instr.effects) {
          switch (effect.kind) {
            case 'Assign':
            case 'Alias':
            case 'MaybeAlias':
            case 'Capture': {
              const source = derivedFromProps.get(effect.from.identifier.id);
              if (source != null) {
                derivedFromProps.set(effect.into.identifier.id, source);
              }
              break;
            }
          }
        }
      }

      /**
       * TODO: figure out why property access off of props does not create an Assign or Alias/Maybe
       * Alias
       *
       * import {useEffect, useState} from 'react'
       *
       *        function Component(props) {
       *          const [displayValue, setDisplayValue] = useState('');
       *
       *          useEffect(() => {
       *            const computed = props.prefix + props.value + props.suffix;
       *                             ^^^^^^^^^^^^   ^^^^^^^^^^^   ^^^^^^^^^^^^
       *                             we want to track that these are from props
       *            setDisplayValue(computed);
       *          }, [props.prefix, props.value, props.suffix]);
       *
       *          return <div>{displayValue}</div>;
       *        }
       */
      if (value.kind === 'FunctionExpression') {
        for (const [, block] of value.loweredFunc.func.body.blocks) {
          for (const instr of block.instructions) {
            if (instr.effects != null) {
              console.group(printInstruction(instr));
              for (const effect of instr.effects) {
                console.log(effect);
                switch (effect.kind) {
                  case 'Assign':
                  case 'Alias':
                  case 'MaybeAlias':
                  case 'Capture': {
                    const source = derivedFromProps.get(
                      effect.from.identifier.id,
                    );
                    if (source != null) {
                      derivedFromProps.set(effect.into.identifier.id, source);
                    }
                    break;
                  }
                }
              }
            }
            console.groupEnd();
          }
        }
      }

      for (const [, place] of derivedFromProps) {
        console.log(printPlace(place));
      }

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
  for (const dep of effectDeps) {
    console.log({dep});
    if (
      effectFunction.context.find(operand => operand.identifier.id === dep) ==
        null ||
      derivedFromProps.has(dep) === false
    ) {
      console.log('early return 2');
      // effect dep wasn't actually used in the function
      return;
    }
  }

  const seenBlocks: Set<BlockId> = new Set();
  const values: Map<IdentifierId, Array<IdentifierId>> = new Map();
  const effectDerivedFromProps: Map<IdentifierId, Place> = new Map();

  for (const dep of effectDeps) {
    console.log({dep});
    values.set(dep, [dep]);
    const propsSource = derivedFromProps.get(dep);
    if (propsSource != null) {
      effectDerivedFromProps.set(dep, propsSource);
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
    for (const phi of block.phis) {
      const aggregateDeps: Set<IdentifierId> = new Set();
      let propsSource: Place | null = null;

      for (const operand of phi.operands.values()) {
        const deps = values.get(operand.identifier.id);
        if (deps != null) {
          for (const dep of deps) {
            aggregateDeps.add(dep);
          }
        }
        const source = effectDerivedFromProps.get(operand.identifier.id);
        if (source != null) {
          propsSource = source;
        }
      }

      if (aggregateDeps.size !== 0) {
        values.set(phi.place.identifier.id, Array.from(aggregateDeps));
      }
      if (propsSource != null) {
        effectDerivedFromProps.set(phi.place.identifier.id, propsSource);
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
          for (const operand of eachInstructionValueOperand(instr.value)) {
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

              setStateCalls.push({
                loc: instr.value.callee.loc,
                propsSource: propsSource ?? null,
              });
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

      // Track props derivation through instruction effects
      if (instr.effects != null) {
        for (const effect of instr.effects) {
          switch (effect.kind) {
            case 'Assign':
            case 'Alias':
            case 'MaybeAlias':
            case 'Capture': {
              const source = effectDerivedFromProps.get(
                effect.from.identifier.id,
              );
              if (source != null) {
                effectDerivedFromProps.set(effect.into.identifier.id, source);
              }
              break;
            }
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      if (values.has(operand.identifier.id)) {
        //
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
