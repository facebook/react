/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity, ValueKind} from '..';
import {
  AbstractValue,
  BasicBlock,
  Effect,
  Environment,
  FunctionEffect,
  Instruction,
  InstructionValue,
  Place,
  ValueReason,
  getHookKind,
  isRefOrRefValue,
} from '../HIR';
import {eachInstructionOperand, eachTerminalOperand} from '../HIR/visitors';
import {assertExhaustive} from '../Utils/utils';

interface State {
  kind(place: Place): AbstractValue;
  values(place: Place): Array<InstructionValue>;
  isDefined(place: Place): boolean;
}

function inferOperandEffect(state: State, place: Place): null | FunctionEffect {
  const value = state.kind(place);
  CompilerError.invariant(value != null, {
    reason: 'Expected operand to have a kind',
    loc: null,
  });

  switch (place.effect) {
    case Effect.Store:
    case Effect.Mutate: {
      if (isRefOrRefValue(place.identifier)) {
        break;
      } else if (value.kind === ValueKind.Context) {
        CompilerError.invariant(value.context.size > 0, {
          reason:
            "[InferFunctionEffects] Expected Context-kind value's capture list to be non-empty.",
          loc: place.loc,
        });
        return {
          kind: 'ContextMutation',
          loc: place.loc,
          effect: place.effect,
          places: value.context,
        };
      } else if (
        value.kind !== ValueKind.Mutable &&
        // We ignore mutations of primitives since this is not a React-specific problem
        value.kind !== ValueKind.Primitive
      ) {
        let reason = getWriteErrorReason(value);
        return {
          kind:
            value.reason.size === 1 && value.reason.has(ValueReason.Global)
              ? 'GlobalMutation'
              : 'ReactMutation',
          error: {
            reason,
            description:
              place.identifier.name !== null &&
              place.identifier.name.kind === 'named'
                ? `Found mutation of \`${place.identifier.name.value}\``
                : null,
            loc: place.loc,
            suggestions: null,
            severity: ErrorSeverity.InvalidReact,
          },
        };
      }
      break;
    }
  }
  return null;
}

function inheritFunctionEffects(
  state: State,
  place: Place,
): Array<FunctionEffect> {
  const effects = inferFunctionInstrEffects(state, place);

  return effects
    .flatMap(effect => {
      if (effect.kind === 'GlobalMutation' || effect.kind === 'ReactMutation') {
        return [effect];
      } else {
        const effects: Array<FunctionEffect | null> = [];
        CompilerError.invariant(effect.kind === 'ContextMutation', {
          reason: 'Expected ContextMutation',
          loc: null,
        });
        /**
         * Contextual effects need to be replayed against the current inference
         * state, which may know more about the value to which the effect applied.
         * The main cases are:
         * 1. The mutated context value is _still_ a context value in the current scope,
         *    so we have to continue propagating the original context mutation.
         * 2. The mutated context value is a mutable value in the current scope,
         *    so the context mutation was fine and we can skip propagating the effect.
         * 3. The mutated context value  is an immutable value in the current scope,
         *    resulting in a non-ContextMutation FunctionEffect. We propagate that new,
         *    more detailed effect to the current function context.
         */
        for (const place of effect.places) {
          if (state.isDefined(place)) {
            const replayedEffect = inferOperandEffect(state, {
              ...place,
              loc: effect.loc,
              effect: effect.effect,
            });
            if (replayedEffect != null) {
              if (replayedEffect.kind === 'ContextMutation') {
                // Case 1, still a context value so propagate the original effect
                effects.push(effect);
              } else {
                // Case 3, immutable value so propagate the more precise effect
                effects.push(replayedEffect);
              }
            } // else case 2, local mutable value so this effect was fine
          }
        }
        return effects;
      }
    })
    .filter((effect): effect is FunctionEffect => effect != null);
}

function inferFunctionInstrEffects(
  state: State,
  place: Place,
): Array<FunctionEffect> {
  const effects: Array<FunctionEffect> = [];
  const instrs = state.values(place);
  CompilerError.invariant(instrs != null, {
    reason: 'Expected operand to have instructions',
    loc: null,
  });

  for (const instr of instrs) {
    if (
      (instr.kind === 'FunctionExpression' || instr.kind === 'ObjectMethod') &&
      instr.loweredFunc.func.effects != null
    ) {
      effects.push(...instr.loweredFunc.func.effects);
    }
  }

  return effects;
}

function operandEffects(
  state: State,
  place: Place,
  filterRenderSafe: boolean,
): Array<FunctionEffect> {
  const functionEffects: Array<FunctionEffect> = [];
  const effect = inferOperandEffect(state, place);
  effect && functionEffects.push(effect);
  functionEffects.push(...inheritFunctionEffects(state, place));
  if (filterRenderSafe) {
    return functionEffects.filter(effect => !isEffectSafeOutsideRender(effect));
  } else {
    return functionEffects;
  }
}

export function inferInstructionFunctionEffects(
  env: Environment,
  state: State,
  instr: Instruction,
): Array<FunctionEffect> {
  const functionEffects: Array<FunctionEffect> = [];
  switch (instr.value.kind) {
    case 'JsxExpression': {
      if (instr.value.tag.kind === 'Identifier') {
        functionEffects.push(...operandEffects(state, instr.value.tag, false));
      }
      instr.value.children?.forEach(child =>
        functionEffects.push(...operandEffects(state, child, false)),
      );
      for (const attr of instr.value.props) {
        if (attr.kind === 'JsxSpreadAttribute') {
          functionEffects.push(...operandEffects(state, attr.argument, false));
        } else {
          functionEffects.push(...operandEffects(state, attr.place, true));
        }
      }
      break;
    }
    case 'ObjectMethod':
    case 'FunctionExpression': {
      /**
       * If this function references other functions, propagate the referenced function's
       * effects to this function.
       *
       * ```
       * let f = () => global = true;
       * let g = () => f();
       * g();
       * ```
       *
       * In this example, because `g` references `f`, we propagate the GlobalMutation from
       * `f` to `g`. Thus, referencing `g` in `g()` will evaluate the GlobalMutation in the outer
       * function effect context and report an error. But if instead we do:
       *
       * ```
       * let f = () => global = true;
       * let g = () => f();
       * useEffect(() => g(), [g])
       * ```
       *
       * Now `g`'s effects will be discarded since they're in a useEffect.
       */
      for (const operand of eachInstructionOperand(instr)) {
        instr.value.loweredFunc.func.effects ??= [];
        instr.value.loweredFunc.func.effects.push(
          ...inferFunctionInstrEffects(state, operand),
        );
      }
      break;
    }
    case 'MethodCall':
    case 'CallExpression': {
      let callee;
      if (instr.value.kind === 'MethodCall') {
        callee = instr.value.property;
        functionEffects.push(
          ...operandEffects(state, instr.value.receiver, false),
        );
      } else {
        callee = instr.value.callee;
      }
      functionEffects.push(...operandEffects(state, callee, false));
      let isHook = getHookKind(env, callee.identifier) != null;
      for (const arg of instr.value.args) {
        const place = arg.kind === 'Identifier' ? arg : arg.place;
        /*
         * Join the effects of the argument with the effects of the enclosing function,
         * unless the we're detecting a global mutation inside a useEffect hook
         */
        functionEffects.push(...operandEffects(state, place, isHook));
      }
      break;
    }
    case 'StartMemoize':
    case 'FinishMemoize':
    case 'LoadLocal':
    case 'StoreLocal': {
      break;
    }
    case 'StoreGlobal': {
      functionEffects.push({
        kind: 'GlobalMutation',
        error: {
          reason:
            'Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)',
          loc: instr.loc,
          suggestions: null,
          severity: ErrorSeverity.InvalidReact,
        },
      });
      break;
    }
    default: {
      for (const operand of eachInstructionOperand(instr)) {
        functionEffects.push(...operandEffects(state, operand, false));
      }
    }
  }
  return functionEffects;
}

export function inferTerminalFunctionEffects(
  state: State,
  block: BasicBlock,
): Array<FunctionEffect> {
  const functionEffects: Array<FunctionEffect> = [];
  for (const operand of eachTerminalOperand(block.terminal)) {
    functionEffects.push(...operandEffects(state, operand, true));
  }
  return functionEffects;
}

export function raiseFunctionEffectErrors(
  functionEffects: Array<FunctionEffect>,
): void {
  functionEffects.forEach(eff => {
    switch (eff.kind) {
      case 'ReactMutation':
      case 'GlobalMutation': {
        CompilerError.throw(eff.error);
      }
      case 'ContextMutation': {
        CompilerError.throw({
          severity: ErrorSeverity.Invariant,
          reason: `Unexpected ContextMutation in top-level function effects`,
          loc: eff.loc,
        });
      }
      default:
        assertExhaustive(
          eff,
          `Unexpected function effect kind \`${(eff as any).kind}\``,
        );
    }
  });
}

function isEffectSafeOutsideRender(effect: FunctionEffect): boolean {
  return effect.kind === 'GlobalMutation';
}

function getWriteErrorReason(abstractValue: AbstractValue): string {
  if (abstractValue.reason.has(ValueReason.Global)) {
    return 'Writing to a variable defined outside a component or hook is not allowed. Consider using an effect';
  } else if (abstractValue.reason.has(ValueReason.JsxCaptured)) {
    return 'Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX';
  } else if (abstractValue.reason.has(ValueReason.Context)) {
    return `Mutating a value returned from 'useContext()', which should not be mutated`;
  } else if (abstractValue.reason.has(ValueReason.KnownReturnSignature)) {
    return 'Mutating a value returned from a function whose return value should not be mutated';
  } else if (abstractValue.reason.has(ValueReason.ReactiveFunctionArgument)) {
    return 'Mutating component props or hook arguments is not allowed. Consider using a local variable instead';
  } else if (abstractValue.reason.has(ValueReason.State)) {
    return "Mutating a value returned from 'useState()', which should not be mutated. Use the setter function to update instead";
  } else if (abstractValue.reason.has(ValueReason.ReducerState)) {
    return "Mutating a value returned from 'useReducer()', which should not be mutated. Use the dispatch function to update instead";
  } else {
    return 'This mutates a variable that React considers immutable';
  }
}
