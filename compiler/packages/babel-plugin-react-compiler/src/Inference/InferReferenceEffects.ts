/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, CompilerErrorDetailOptions} from '../CompilerError';
import {Environment} from '../HIR';
import {
  AbstractValue,
  BasicBlock,
  BlockId,
  CallExpression,
  NewExpression,
  Effect,
  FunctionEffect,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  InstructionKind,
  InstructionValue,
  MethodCall,
  Phi,
  Place,
  SpreadPattern,
  TInstruction,
  Type,
  ValueKind,
  ValueReason,
  isArrayType,
  isMapType,
  isMutableEffect,
  isObjectType,
  isSetType,
} from '../HIR/HIR';
import {FunctionSignature} from '../HIR/ObjectShape';
import {
  printIdentifier,
  printMixedHIR,
  printPlace,
  printSourceLocation,
} from '../HIR/PrintHIR';
import {
  eachInstructionOperand,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
  eachTerminalSuccessor,
} from '../HIR/visitors';
import {assertExhaustive} from '../Utils/utils';
import {
  inferTerminalFunctionEffects,
  inferInstructionFunctionEffects,
  transformFunctionEffectErrors,
} from './InferFunctionEffects';

const UndefinedValue: InstructionValue = {
  kind: 'Primitive',
  loc: GeneratedSource,
  value: undefined,
};

/*
 * For every usage of a value in the given function, infers the effect or action
 * taken at that reference. Each reference is inferred as exactly one of:
 * - freeze: this usage freezes the value, ie converts it to frozen. This is only inferred
 *    when the value *may* not already be frozen.
 * - frozen: the value is known to already be "owned" by React and is therefore already
 *    frozen (permanently and transitively immutable).
 * - immutable: the value is not owned by React, but is known to be an immutable value
 *    that therefore cannot ever change.
 * - readonly: the value is not frozen or immutable, but this usage of the value does
 *    not modify it. the value may be mutated by a subsequent reference. Examples include
 *    referencing the operands of a binary expression, or referencing the items/properties
 *    of an array or object literal.
 * - mutable: the value is not frozen or immutable, and this usage *may* modify it.
 *    Examples include passing a value to as a function argument or assigning into an object.
 *
 * Note that the inference follows variable assignment, so assigning a frozen value
 * to a different value will infer usages of the other variable as frozen as well.
 *
 * The inference assumes that the code follows the rules of React:
 * - React function arguments are frozen (component props, hook arguments).
 * - Hook arguments are frozen at the point the hook is invoked.
 * - React function return values are frozen at the point of being returned,
 *    thus the return value of a hook call is frozen.
 * - JSX represents invocation of a React function (the component) and
 *    therefore all values passed to JSX become frozen at the point the JSX
 *    is created.
 *
 * Internally, the inference tracks the approximate type of value held by each variable,
 * and iterates over the control flow graph. The inferred effect of reach reference is
 * a combination of the operation performed (ie, assignment into an object mutably uses the
 * object; an if condition reads the condition) and the type of the value. The types of values
 * are:
 * - frozen: can be any type so long as the value is known to be owned by React, permanently
 *    and transitively immutable
 * - maybe-frozen: the value may or may not be frozen, conditionally depending on control flow.
 * - immutable: a type with value semantics: primitives, records/tuples when standardized.
 * - mutable: a type with reference semantics eg array, object, class instance, etc.
 *
 * When control flow paths converge the types of values are merged together, with the value
 * types forming a lattice to ensure convergence.
 */
export default function inferReferenceEffects(
  fn: HIRFunction,
  options: {isFunctionExpression: boolean} = {isFunctionExpression: false},
): Array<CompilerErrorDetailOptions> {
  /*
   * Initial state contains function params
   * TODO: include module declarations here as well
   */
  const initialState = InferenceState.empty(
    fn.env,
    options.isFunctionExpression,
  );
  const value: InstructionValue = {
    kind: 'Primitive',
    loc: fn.loc,
    value: undefined,
  };
  initialState.initialize(value, {
    kind: ValueKind.Frozen,
    reason: new Set([ValueReason.Other]),
    context: new Set(),
  });

  for (const ref of fn.context) {
    // TODO(gsn): This is a hack.
    const value: InstructionValue = {
      kind: 'ObjectExpression',
      properties: [],
      loc: ref.loc,
    };
    initialState.initialize(value, {
      kind: ValueKind.Context,
      reason: new Set([ValueReason.Other]),
      context: new Set([ref]),
    });
    initialState.define(ref, value);
  }

  const paramKind: AbstractValue = options.isFunctionExpression
    ? {
        kind: ValueKind.Mutable,
        reason: new Set([ValueReason.Other]),
        context: new Set(),
      }
    : {
        kind: ValueKind.Frozen,
        reason: new Set([ValueReason.ReactiveFunctionArgument]),
        context: new Set(),
      };

  if (fn.fnType === 'Component') {
    CompilerError.invariant(fn.params.length <= 2, {
      reason:
        'Expected React component to have not more than two parameters: one for props and for ref',
      description: null,
      loc: fn.loc,
      suggestions: null,
    });
    const [props, ref] = fn.params;
    let value: InstructionValue;
    let place: Place;
    if (props) {
      inferParam(props, initialState, paramKind);
    }
    if (ref) {
      if (ref.kind === 'Identifier') {
        place = ref;
        value = {
          kind: 'ObjectExpression',
          properties: [],
          loc: ref.loc,
        };
      } else {
        place = ref.place;
        value = {
          kind: 'ObjectExpression',
          properties: [],
          loc: ref.place.loc,
        };
      }
      initialState.initialize(value, {
        kind: ValueKind.Mutable,
        reason: new Set([ValueReason.Other]),
        context: new Set(),
      });
      initialState.define(place, value);
    }
  } else {
    for (const param of fn.params) {
      inferParam(param, initialState, paramKind);
    }
  }

  // Map of blocks to the last (merged) incoming state that was processed
  const statesByBlock: Map<BlockId, InferenceState> = new Map();

  /*
   * Multiple predecessors may be visited prior to reaching a given successor,
   * so track the list of incoming state for each successor block.
   * These are merged when reaching that block again.
   */
  const queuedStates: Map<BlockId, InferenceState> = new Map();
  function queue(blockId: BlockId, state: InferenceState): void {
    let queuedState = queuedStates.get(blockId);
    if (queuedState != null) {
      // merge the queued states for this block
      state = queuedState.merge(state) ?? queuedState;
      queuedStates.set(blockId, state);
    } else {
      /*
       * this is the first queued state for this block, see whether
       * there are changed relative to the last time it was processed.
       */
      const prevState = statesByBlock.get(blockId);
      const nextState = prevState != null ? prevState.merge(state) : state;
      if (nextState != null) {
        queuedStates.set(blockId, nextState);
      }
    }
  }
  queue(fn.body.entry, initialState);

  const functionEffects: Array<FunctionEffect> = fn.effects ?? [];

  while (queuedStates.size !== 0) {
    for (const [blockId, block] of fn.body.blocks) {
      const incomingState = queuedStates.get(blockId);
      queuedStates.delete(blockId);
      if (incomingState == null) {
        continue;
      }

      statesByBlock.set(blockId, incomingState);
      const state = incomingState.clone();
      inferBlock(fn.env, state, block, functionEffects);

      for (const nextBlockId of eachTerminalSuccessor(block.terminal)) {
        queue(nextBlockId, state);
      }
    }
  }

  if (options.isFunctionExpression) {
    fn.effects = functionEffects;
    return [];
  } else {
    return transformFunctionEffectErrors(functionEffects);
  }
}

type FreezeAction = {values: Set<InstructionValue>; reason: Set<ValueReason>};

// Maintains a mapping of top-level variables to the kind of value they hold
class InferenceState {
  env: Environment;
  #isFunctionExpression: boolean;

  // The kind of each value, based on its allocation site
  #values: Map<InstructionValue, AbstractValue>;
  /*
   * The set of values pointed to by each identifier. This is a set
   * to accomodate phi points (where a variable may have different
   * values from different control flow paths).
   */
  #variables: Map<IdentifierId, Set<InstructionValue>>;

  constructor(
    env: Environment,
    isFunctionExpression: boolean,
    values: Map<InstructionValue, AbstractValue>,
    variables: Map<IdentifierId, Set<InstructionValue>>,
  ) {
    this.env = env;
    this.#isFunctionExpression = isFunctionExpression;
    this.#values = values;
    this.#variables = variables;
  }

  static empty(
    env: Environment,
    isFunctionExpression: boolean,
  ): InferenceState {
    return new InferenceState(env, isFunctionExpression, new Map(), new Map());
  }

  get isFunctionExpression(): boolean {
    return this.#isFunctionExpression;
  }

  // (Re)initializes a @param value with its default @param kind.
  initialize(value: InstructionValue, kind: AbstractValue): void {
    CompilerError.invariant(value.kind !== 'LoadLocal', {
      reason:
        'Expected all top-level identifiers to be defined as variables, not values',
      description: null,
      loc: value.loc,
      suggestions: null,
    });
    this.#values.set(value, kind);
  }

  values(place: Place): Array<InstructionValue> {
    const values = this.#variables.get(place.identifier.id);
    CompilerError.invariant(values != null, {
      reason: `[hoisting] Expected value kind to be initialized`,
      description: `${printPlace(place)}`,
      loc: place.loc,
      suggestions: null,
    });
    return Array.from(values);
  }

  // Lookup the kind of the given @param value.
  kind(place: Place): AbstractValue {
    const values = this.#variables.get(place.identifier.id);
    CompilerError.invariant(values != null, {
      reason: `[hoisting] Expected value kind to be initialized`,
      description: `${printPlace(place)}`,
      loc: place.loc,
      suggestions: null,
    });
    let mergedKind: AbstractValue | null = null;
    for (const value of values) {
      const kind = this.#values.get(value)!;
      mergedKind =
        mergedKind !== null ? mergeAbstractValues(mergedKind, kind) : kind;
    }
    CompilerError.invariant(mergedKind !== null, {
      reason: `InferReferenceEffects::kind: Expected at least one value`,
      description: `No value found at \`${printPlace(place)}\``,
      loc: place.loc,
      suggestions: null,
    });
    return mergedKind;
  }

  // Updates the value at @param place to point to the same value as @param value.
  alias(place: Place, value: Place): void {
    const values = this.#variables.get(value.identifier.id);
    CompilerError.invariant(values != null, {
      reason: `[hoisting] Expected value for identifier to be initialized`,
      description: `${printIdentifier(value.identifier)}`,
      loc: value.loc,
      suggestions: null,
    });
    this.#variables.set(place.identifier.id, new Set(values));
  }

  // Defines (initializing or updating) a variable with a specific kind of value.
  define(place: Place, value: InstructionValue): void {
    CompilerError.invariant(this.#values.has(value), {
      reason: `Expected value to be initialized at '${printSourceLocation(
        value.loc,
      )}'`,
      description: null,
      loc: value.loc,
      suggestions: null,
    });
    this.#variables.set(place.identifier.id, new Set([value]));
  }

  isDefined(place: Place): boolean {
    return this.#variables.has(place.identifier.id);
  }

  /*
   * Records that a given Place was accessed with the given kind and:
   * - Updates the effect of @param place based on the kind of value
   *    and the kind of reference (@param effectKind).
   * - Updates the value kind to reflect the effect of the reference.
   *
   * Notably, a mutable reference is downgraded to readonly if the
   * value unless the value is known to be mutable.
   *
   * Similarly, a freeze reference is converted to readonly if the
   * value is already frozen or is immutable.
   */
  referenceAndRecordEffects(
    freezeActions: Array<FreezeAction>,
    place: Place,
    effectKind: Effect,
    reason: ValueReason,
  ): void {
    const values = this.#variables.get(place.identifier.id);
    if (values === undefined) {
      CompilerError.invariant(effectKind !== Effect.Store, {
        reason: '[InferReferenceEffects] Unhandled store reference effect',
        description: null,
        loc: place.loc,
        suggestions: null,
      });
      place.effect =
        effectKind === Effect.ConditionallyMutate
          ? Effect.ConditionallyMutate
          : Effect.Read;
      return;
    }

    const action = this.reference(place, effectKind, reason);
    action && freezeActions.push(action);
  }

  freezeValues(values: Set<InstructionValue>, reason: Set<ValueReason>): void {
    for (const value of values) {
      if (
        value.kind === 'DeclareContext' ||
        (value.kind === 'StoreContext' &&
          (value.lvalue.kind === InstructionKind.Let ||
            value.lvalue.kind === InstructionKind.Const))
      ) {
        /**
         * Avoid freezing context variable declarations, hoisted or otherwise
         * function Component() {
         *   const cb = useBar(() => foo(2)); // produces a hoisted context declaration
         *   const foo = useFoo();            // reassigns to the context variable
         *   return <Foo cb={cb} />;
         * }
         */
        continue;
      }
      this.#values.set(value, {
        kind: ValueKind.Frozen,
        reason,
        context: new Set(),
      });
      if (
        value.kind === 'FunctionExpression' &&
        (this.env.config.enablePreserveExistingMemoizationGuarantees ||
          this.env.config.enableTransitivelyFreezeFunctionExpressions)
      ) {
        for (const operand of value.loweredFunc.func.context) {
          const operandValues = this.#variables.get(operand.identifier.id);
          if (operandValues !== undefined) {
            this.freezeValues(operandValues, reason);
          }
        }
      }
    }
  }

  reference(
    place: Place,
    effectKind: Effect,
    reason: ValueReason,
  ): null | FreezeAction {
    const values = this.#variables.get(place.identifier.id);
    CompilerError.invariant(values !== undefined, {
      reason: '[InferReferenceEffects] Expected value to be initialized',
      description: null,
      loc: place.loc,
      suggestions: null,
    });
    let valueKind: AbstractValue | null = this.kind(place);
    let effect: Effect | null = null;
    let freeze: null | FreezeAction = null;
    switch (effectKind) {
      case Effect.Freeze: {
        if (
          valueKind.kind === ValueKind.Mutable ||
          valueKind.kind === ValueKind.Context ||
          valueKind.kind === ValueKind.MaybeFrozen
        ) {
          const reasonSet = new Set([reason]);
          effect = Effect.Freeze;
          valueKind = {
            kind: ValueKind.Frozen,
            reason: reasonSet,
            context: new Set(),
          };
          freeze = {values, reason: reasonSet};
        } else {
          effect = Effect.Read;
        }
        break;
      }
      case Effect.ConditionallyMutate: {
        if (
          valueKind.kind === ValueKind.Mutable ||
          valueKind.kind === ValueKind.Context
        ) {
          effect = Effect.ConditionallyMutate;
        } else {
          effect = Effect.Read;
        }
        break;
      }
      case Effect.ConditionallyMutateIterator: {
        if (
          valueKind.kind === ValueKind.Mutable ||
          valueKind.kind === ValueKind.Context
        ) {
          if (
            isArrayType(place.identifier) ||
            isSetType(place.identifier) ||
            isMapType(place.identifier)
          ) {
            effect = Effect.Capture;
          } else {
            effect = Effect.ConditionallyMutate;
          }
        } else {
          effect = Effect.Read;
        }
        break;
      }
      case Effect.Mutate: {
        effect = Effect.Mutate;
        break;
      }
      case Effect.Store: {
        /*
         * TODO(gsn): This should be bailout once we add bailout infra.
         *
         * invariant(
         *   valueKind.kind === ValueKindKind.Mutable,
         *   `expected valueKind to be 'Mutable' but found to be \`${valueKind}\``
         * );
         */
        effect = isObjectType(place.identifier) ? Effect.Store : Effect.Mutate;
        break;
      }
      case Effect.Capture: {
        if (
          valueKind.kind === ValueKind.Primitive ||
          valueKind.kind === ValueKind.Global ||
          valueKind.kind === ValueKind.Frozen ||
          valueKind.kind === ValueKind.MaybeFrozen
        ) {
          effect = Effect.Read;
        } else {
          effect = Effect.Capture;
        }
        break;
      }
      case Effect.Read: {
        effect = Effect.Read;
        break;
      }
      case Effect.Unknown: {
        CompilerError.invariant(false, {
          reason:
            'Unexpected unknown effect, expected to infer a precise effect kind',
          description: null,
          loc: place.loc,
          suggestions: null,
        });
      }
      default: {
        assertExhaustive(
          effectKind,
          `Unexpected reference kind \`${effectKind as any as string}\``,
        );
      }
    }
    CompilerError.invariant(effect !== null, {
      reason: 'Expected effect to be set',
      description: null,
      loc: place.loc,
      suggestions: null,
    });
    place.effect = effect;
    return freeze;
  }

  /*
   * Combine the contents of @param this and @param other, returning a new
   * instance with the combined changes _if_ there are any changes, or
   * returning null if no changes would occur. Changes include:
   * - new entries in @param other that did not exist in @param this
   * - entries whose values differ in @param this and @param other,
   *    and where joining the values produces a different value than
   *    what was in @param this.
   *
   * Note that values are joined using a lattice operation to ensure
   * termination.
   */
  merge(other: InferenceState): InferenceState | null {
    let nextValues: Map<InstructionValue, AbstractValue> | null = null;
    let nextVariables: Map<IdentifierId, Set<InstructionValue>> | null = null;

    for (const [id, thisValue] of this.#values) {
      const otherValue = other.#values.get(id);
      if (otherValue !== undefined) {
        const mergedValue = mergeAbstractValues(thisValue, otherValue);
        if (mergedValue !== thisValue) {
          nextValues = nextValues ?? new Map(this.#values);
          nextValues.set(id, mergedValue);
        }
      }
    }
    for (const [id, otherValue] of other.#values) {
      if (this.#values.has(id)) {
        // merged above
        continue;
      }
      nextValues = nextValues ?? new Map(this.#values);
      nextValues.set(id, otherValue);
    }

    for (const [id, thisValues] of this.#variables) {
      const otherValues = other.#variables.get(id);
      if (otherValues !== undefined) {
        let mergedValues: Set<InstructionValue> | null = null;
        for (const otherValue of otherValues) {
          if (!thisValues.has(otherValue)) {
            mergedValues = mergedValues ?? new Set(thisValues);
            mergedValues.add(otherValue);
          }
        }
        if (mergedValues !== null) {
          nextVariables = nextVariables ?? new Map(this.#variables);
          nextVariables.set(id, mergedValues);
        }
      }
    }
    for (const [id, otherValues] of other.#variables) {
      if (this.#variables.has(id)) {
        continue;
      }
      nextVariables = nextVariables ?? new Map(this.#variables);
      nextVariables.set(id, new Set(otherValues));
    }

    if (nextVariables === null && nextValues === null) {
      return null;
    } else {
      return new InferenceState(
        this.env,
        this.#isFunctionExpression,
        nextValues ?? new Map(this.#values),
        nextVariables ?? new Map(this.#variables),
      );
    }
  }

  /*
   * Returns a copy of this state.
   * TODO: consider using persistent data structures to make
   * clone cheaper.
   */
  clone(): InferenceState {
    return new InferenceState(
      this.env,
      this.#isFunctionExpression,
      new Map(this.#values),
      new Map(this.#variables),
    );
  }

  /*
   * For debugging purposes, dumps the state to a plain
   * object so that it can printed as JSON.
   */
  debug(): any {
    const result: any = {values: {}, variables: {}};
    const objects: Map<InstructionValue, number> = new Map();
    function identify(value: InstructionValue): number {
      let id = objects.get(value);
      if (id == null) {
        id = objects.size;
        objects.set(value, id);
      }
      return id;
    }
    for (const [value, kind] of this.#values) {
      const id = identify(value);
      result.values[id] = {kind, value: printMixedHIR(value)};
    }
    for (const [variable, values] of this.#variables) {
      result.variables[`$${variable}`] = [...values].map(identify);
    }
    return result;
  }

  inferPhi(phi: Phi): void {
    const values: Set<InstructionValue> = new Set();
    for (const [_, operand] of phi.operands) {
      const operandValues = this.#variables.get(operand.identifier.id);
      // This is a backedge that will be handled later by State.merge
      if (operandValues === undefined) continue;
      for (const v of operandValues) {
        values.add(v);
      }
    }

    if (values.size > 0) {
      this.#variables.set(phi.place.identifier.id, values);
    }
  }
}

function inferParam(
  param: Place | SpreadPattern,
  initialState: InferenceState,
  paramKind: AbstractValue,
): void {
  let value: InstructionValue;
  let place: Place;
  if (param.kind === 'Identifier') {
    place = param;
    value = {
      kind: 'Primitive',
      loc: param.loc,
      value: undefined,
    };
  } else {
    place = param.place;
    value = {
      kind: 'Primitive',
      loc: param.place.loc,
      value: undefined,
    };
  }
  initialState.initialize(value, paramKind);
  initialState.define(place, value);
}

/*
 * Joins two values using the following rules:
 * == Effect Transitions ==
 *
 * Freezing an immutable value has not effect:
 *                ┌───────────────┐
 *                │               │
 *                ▼               │ Freeze
 * ┌──────────────────────────┐  │
 * │        Immutable         │──┘
 * └──────────────────────────┘
 *
 * Freezing a mutable or maybe-frozen value makes it frozen. Freezing a frozen
 * value has no effect:
 *                                                     ┌───────────────┐
 * ┌─────────────────────────┐     Freeze             │               │
 * │       MaybeFrozen       │────┐                   ▼               │ Freeze
 * └─────────────────────────┘    │     ┌──────────────────────────┐  │
 *                                 ├────▶│          Frozen          │──┘
 *                                 │     └──────────────────────────┘
 * ┌─────────────────────────┐    │
 * │         Mutable         │────┘
 * └─────────────────────────┘
 *
 * == Join Lattice ==
 * - immutable | mutable => mutable
 *     The justification is that immutable and mutable values are different types,
 *     and functions can introspect them to tell the difference (if the argument
 *     is null return early, else if its an object mutate it).
 * - frozen | mutable => maybe-frozen
 *     Frozen values are indistinguishable from mutable values at runtime, so callers
 *     cannot dynamically avoid mutation of "frozen" values. If a value could be
 *     frozen we have to distinguish it from a mutable value. But it also isn't known
 *     frozen yet, so we distinguish as maybe-frozen.
 * - immutable | frozen => frozen
 *     This is subtle and falls out of the above rules. If a value could be any of
 *     immutable, mutable, or frozen, then at runtime it could either be a primitive
 *     or a reference type, and callers can't distinguish frozen or not for reference
 *     types. To ensure that any sequence of joins btw those three states yields the
 *     correct maybe-frozen, these two have to produce a frozen value.
 * - <any> | maybe-frozen => maybe-frozen
 * - immutable | context => context
 * - mutable | context => context
 * - frozen | context => maybe-frozen
 *
 * ┌──────────────────────────┐
 * │        Immutable         │───┐
 * └──────────────────────────┘   │
 *                                 │    ┌─────────────────────────┐
 *                                 ├───▶│         Frozen          │──┐
 * ┌──────────────────────────┐   │    └─────────────────────────┘  │
 * │          Frozen          │───┤                                 │  ┌─────────────────────────┐
 * └──────────────────────────┘   │                                 ├─▶│       MaybeFrozen       │
 *                                 │    ┌─────────────────────────┐  │  └─────────────────────────┘
 *                                 ├───▶│       MaybeFrozen       │──┘
 * ┌──────────────────────────┐   │    └─────────────────────────┘
 * │         Mutable          │───┘
 * └──────────────────────────┘
 */
function mergeValues(a: ValueKind, b: ValueKind): ValueKind {
  if (a === b) {
    return a;
  } else if (a === ValueKind.MaybeFrozen || b === ValueKind.MaybeFrozen) {
    return ValueKind.MaybeFrozen;
    // after this a and b differ and neither are MaybeFrozen
  } else if (a === ValueKind.Mutable || b === ValueKind.Mutable) {
    if (a === ValueKind.Frozen || b === ValueKind.Frozen) {
      // frozen | mutable
      return ValueKind.MaybeFrozen;
    } else if (a === ValueKind.Context || b === ValueKind.Context) {
      // context | mutable
      return ValueKind.Context;
    } else {
      // mutable | immutable
      return ValueKind.Mutable;
    }
  } else if (a === ValueKind.Context || b === ValueKind.Context) {
    if (a === ValueKind.Frozen || b === ValueKind.Frozen) {
      // frozen | context
      return ValueKind.MaybeFrozen;
    } else {
      // context | immutable
      return ValueKind.Context;
    }
  } else if (a === ValueKind.Frozen || b === ValueKind.Frozen) {
    return ValueKind.Frozen;
  } else if (a === ValueKind.Global || b === ValueKind.Global) {
    return ValueKind.Global;
  } else {
    CompilerError.invariant(
      a === ValueKind.Primitive && b == ValueKind.Primitive,
      {
        reason: `Unexpected value kind in mergeValues()`,
        description: `Found kinds ${a} and ${b}`,
        loc: GeneratedSource,
      },
    );
    return ValueKind.Primitive;
  }
}

/**
 * @returns `true` if `a` is a superset of `b`.
 */
function isSuperset<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  for (const v of b) {
    if (!a.has(v)) {
      return false;
    }
  }
  return true;
}

function mergeAbstractValues(
  a: AbstractValue,
  b: AbstractValue,
): AbstractValue {
  const kind = mergeValues(a.kind, b.kind);
  if (
    kind === a.kind &&
    kind === b.kind &&
    isSuperset(a.reason, b.reason) &&
    isSuperset(a.context, b.context)
  ) {
    return a;
  }
  const reason = new Set(a.reason);
  for (const r of b.reason) {
    reason.add(r);
  }
  const context = new Set(a.context);
  for (const c of b.context) {
    context.add(c);
  }
  return {kind, reason, context};
}

type Continuation =
  | {
      kind: 'initialize';
      valueKind: AbstractValue;
      effect: {kind: Effect; reason: ValueReason} | null;
      lvalueEffect?: Effect;
    }
  | {kind: 'funeffects'};

/*
 * Iterates over the given @param block, defining variables and
 * recording references on the @param state according to JS semantics.
 */
function inferBlock(
  env: Environment,
  state: InferenceState,
  block: BasicBlock,
  functionEffects: Array<FunctionEffect>,
): void {
  for (const phi of block.phis) {
    state.inferPhi(phi);
  }

  for (const instr of block.instructions) {
    const instrValue = instr.value;
    const defaultLvalueEffect = Effect.ConditionallyMutate;
    let continuation: Continuation;
    const freezeActions: Array<FreezeAction> = [];
    switch (instrValue.kind) {
      case 'BinaryExpression': {
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Primitive,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: {
            kind: Effect.Read,
            reason: ValueReason.Other,
          },
        };
        break;
      }
      case 'ArrayExpression': {
        const contextRefOperands = getContextRefOperand(state, instrValue);
        const valueKind: AbstractValue =
          contextRefOperands.length > 0
            ? {
                kind: ValueKind.Context,
                reason: new Set([ValueReason.Other]),
                context: new Set(contextRefOperands),
              }
            : {
                kind: ValueKind.Mutable,
                reason: new Set([ValueReason.Other]),
                context: new Set(),
              };

        for (const element of instrValue.elements) {
          if (element.kind === 'Spread') {
            state.referenceAndRecordEffects(
              freezeActions,
              element.place,
              Effect.ConditionallyMutateIterator,
              ValueReason.Other,
            );
          } else if (element.kind === 'Identifier') {
            state.referenceAndRecordEffects(
              freezeActions,
              element,
              Effect.Capture,
              ValueReason.Other,
            );
          } else {
            let _: 'Hole' = element.kind;
          }
        }
        state.initialize(instrValue, valueKind);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Store;
        continuation = {
          kind: 'funeffects',
        };
        break;
      }
      case 'NewExpression': {
        inferCallEffects(
          state,
          instr as TInstruction<NewExpression>,
          freezeActions,
          getFunctionCallSignature(env, instrValue.callee.identifier.type),
        );
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'ObjectExpression': {
        const contextRefOperands = getContextRefOperand(state, instrValue);
        const valueKind: AbstractValue =
          contextRefOperands.length > 0
            ? {
                kind: ValueKind.Context,
                reason: new Set([ValueReason.Other]),
                context: new Set(contextRefOperands),
              }
            : {
                kind: ValueKind.Mutable,
                reason: new Set([ValueReason.Other]),
                context: new Set(),
              };

        for (const property of instrValue.properties) {
          switch (property.kind) {
            case 'ObjectProperty': {
              if (property.key.kind === 'computed') {
                // Object keys must be primitives, so we know they're frozen at this point
                state.referenceAndRecordEffects(
                  freezeActions,
                  property.key.name,
                  Effect.Freeze,
                  ValueReason.Other,
                );
              }
              // Object construction captures but does not modify the key/property values
              state.referenceAndRecordEffects(
                freezeActions,
                property.place,
                Effect.Capture,
                ValueReason.Other,
              );
              break;
            }
            case 'Spread': {
              // Object construction captures but does not modify the key/property values
              state.referenceAndRecordEffects(
                freezeActions,
                property.place,
                Effect.Capture,
                ValueReason.Other,
              );
              break;
            }
            default: {
              assertExhaustive(
                property,
                `Unexpected property kind \`${(property as any).kind}\``,
              );
            }
          }
        }

        state.initialize(instrValue, valueKind);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'UnaryExpression': {
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Primitive,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: {kind: Effect.Read, reason: ValueReason.Other},
        };
        break;
      }
      case 'UnsupportedNode': {
        // TODO: handle other statement kinds
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Mutable,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: null,
        };
        break;
      }
      case 'JsxExpression': {
        if (instrValue.tag.kind === 'Identifier') {
          state.referenceAndRecordEffects(
            freezeActions,
            instrValue.tag,
            Effect.Freeze,
            ValueReason.JsxCaptured,
          );
        }
        if (instrValue.children !== null) {
          for (const child of instrValue.children) {
            state.referenceAndRecordEffects(
              freezeActions,
              child,
              Effect.Freeze,
              ValueReason.JsxCaptured,
            );
          }
        }
        for (const attr of instrValue.props) {
          if (attr.kind === 'JsxSpreadAttribute') {
            state.referenceAndRecordEffects(
              freezeActions,
              attr.argument,
              Effect.Freeze,
              ValueReason.JsxCaptured,
            );
          } else {
            state.referenceAndRecordEffects(
              freezeActions,
              attr.place,
              Effect.Freeze,
              ValueReason.JsxCaptured,
            );
          }
        }

        state.initialize(instrValue, {
          kind: ValueKind.Frozen,
          reason: new Set([ValueReason.Other]),
          context: new Set(),
        });
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.ConditionallyMutate;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'JsxFragment': {
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Frozen,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: {
            kind: Effect.Freeze,
            reason: ValueReason.Other,
          },
        };
        break;
      }
      case 'TemplateLiteral': {
        /*
         * template literal (with no tag function) always produces
         * an immutable string
         */
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Primitive,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: {kind: Effect.Read, reason: ValueReason.Other},
        };
        break;
      }
      case 'RegExpLiteral': {
        // RegExp instances are mutable objects
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Mutable,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: {
            kind: Effect.ConditionallyMutate,
            reason: ValueReason.Other,
          },
        };
        break;
      }
      case 'MetaProperty': {
        if (instrValue.meta !== 'import' || instrValue.property !== 'meta') {
          continuation = {kind: 'funeffects'};
          break;
        }
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Global,
            reason: new Set([ValueReason.Global]),
            context: new Set(),
          },
          effect: null,
        };
        break;
      }
      case 'LoadGlobal':
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Global,
            reason: new Set([ValueReason.Global]),
            context: new Set(),
          },
          effect: null,
        };
        break;
      case 'Debugger':
      case 'JSXText':
      case 'Primitive': {
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Primitive,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: null,
        };
        break;
      }
      case 'ObjectMethod':
      case 'FunctionExpression': {
        let hasMutableOperand = false;
        for (const operand of eachInstructionOperand(instr)) {
          CompilerError.invariant(operand.effect !== Effect.Unknown, {
            reason: 'Expected fn effects to be populated',
            loc: operand.loc,
          });
          state.referenceAndRecordEffects(
            freezeActions,
            operand,
            operand.effect,
            ValueReason.Other,
          );
          hasMutableOperand ||= isMutableEffect(operand.effect, operand.loc);
        }
        /*
         * If a closure did not capture any mutable values, then we can consider it to be
         * frozen, which allows it to be independently memoized.
         */
        state.initialize(instrValue, {
          kind: hasMutableOperand ? ValueKind.Mutable : ValueKind.Frozen,
          reason: new Set([ValueReason.Other]),
          context: new Set(),
        });
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'TaggedTemplateExpression': {
        const operands = [...eachInstructionValueOperand(instrValue)];
        if (operands.length !== 1) {
          // future-proofing to make sure we update this case when we support interpolation
          CompilerError.throwTodo({
            reason: 'Support tagged template expressions with interpolations',
            loc: instrValue.loc,
          });
        }
        const signature = getFunctionCallSignature(
          env,
          instrValue.tag.identifier.type,
        );
        let calleeEffect =
          signature?.calleeEffect ?? Effect.ConditionallyMutate;
        const returnValueKind: AbstractValue =
          signature !== null
            ? {
                kind: signature.returnValueKind,
                reason: new Set([
                  signature.returnValueReason ??
                    ValueReason.KnownReturnSignature,
                ]),
                context: new Set(),
              }
            : {
                kind: ValueKind.Mutable,
                reason: new Set([ValueReason.Other]),
                context: new Set(),
              };
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.tag,
          calleeEffect,
          ValueReason.Other,
        );
        state.initialize(instrValue, returnValueKind);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.ConditionallyMutate;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'CallExpression': {
        inferCallEffects(
          state,
          instr as TInstruction<CallExpression>,
          freezeActions,
          getFunctionCallSignature(env, instrValue.callee.identifier.type),
        );
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'MethodCall': {
        CompilerError.invariant(state.isDefined(instrValue.receiver), {
          reason:
            '[InferReferenceEffects] Internal error: receiver of PropertyCall should have been defined by corresponding PropertyLoad',
          description: null,
          loc: instrValue.loc,
          suggestions: null,
        });
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.property,
          Effect.Read,
          ValueReason.Other,
        );
        inferCallEffects(
          state,
          instr as TInstruction<MethodCall>,
          freezeActions,
          getFunctionCallSignature(env, instrValue.property.identifier.type),
        );
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'PropertyStore': {
        const effect =
          state.kind(instrValue.object).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          effect,
          ValueReason.Other,
        );
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.object,
          Effect.Store,
          ValueReason.Other,
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'PropertyDelete': {
        // `delete` returns a boolean (immutable) and modifies the object
        continuation = {
          kind: 'initialize',
          valueKind: {
            kind: ValueKind.Primitive,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
          effect: {kind: Effect.Mutate, reason: ValueReason.Other},
        };
        break;
      }
      case 'PropertyLoad': {
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.object,
          Effect.Read,
          ValueReason.Other,
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.initialize(instrValue, state.kind(instrValue.object));
        state.define(lvalue, instrValue);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'ComputedStore': {
        const effect =
          state.kind(instrValue.object).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          effect,
          ValueReason.Other,
        );
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.property,
          Effect.Capture,
          ValueReason.Other,
        );
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.object,
          Effect.Store,
          ValueReason.Other,
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'ComputedDelete': {
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.object,
          Effect.Mutate,
          ValueReason.Other,
        );
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.property,
          Effect.Read,
          ValueReason.Other,
        );
        state.initialize(instrValue, {
          kind: ValueKind.Primitive,
          reason: new Set([ValueReason.Other]),
          context: new Set(),
        });
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Mutate;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'ComputedLoad': {
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.object,
          Effect.Read,
          ValueReason.Other,
        );
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.property,
          Effect.Read,
          ValueReason.Other,
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.initialize(instrValue, state.kind(instrValue.object));
        state.define(lvalue, instrValue);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'Await': {
        state.initialize(instrValue, state.kind(instrValue.value));
        /*
         * Awaiting a value causes it to change state (go from unresolved to resolved or error)
         * It also means that any side-effects which would occur as part of the promise evaluation
         * will occur.
         */
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          Effect.ConditionallyMutate,
          ValueReason.Other,
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.alias(lvalue, instrValue.value);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'NonNullExpression':
      case 'TypeCastExpression': {
        /*
         * A non-null expression or type cast expression has no effect at runtime,
         * so it's equivalent to a raw identifier:
         * ```
         * x = (y: type)  // is equivalent to...
         * x = y
         * ```
         */
        state.initialize(instrValue, state.kind(instrValue.value));
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          Effect.Read,
          ValueReason.Other,
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.alias(lvalue, instrValue.value);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'StartMemoize':
      case 'FinishMemoize': {
        for (const val of eachInstructionValueOperand(instrValue)) {
          if (env.config.enablePreserveExistingMemoizationGuarantees) {
            state.referenceAndRecordEffects(
              freezeActions,
              val,
              Effect.Freeze,
              ValueReason.Other,
            );
          } else {
            state.referenceAndRecordEffects(
              freezeActions,
              val,
              Effect.Read,
              ValueReason.Other,
            );
          }
        }
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.initialize(instrValue, {
          kind: ValueKind.Frozen,
          reason: new Set([ValueReason.Other]),
          context: new Set(),
        });
        state.define(lvalue, instrValue);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'LoadLocal': {
        /**
         * Due to backedges in the CFG, we may revisit LoadLocal lvalues
         * multiple times. Unlike StoreLocal which may reassign to existing
         * identifiers, LoadLocal always evaluates to store a new temporary.
         * This means that we should always model LoadLocal as a Capture effect
         * on the rvalue.
         */
        const lvalue = instr.lvalue;
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.place,
          Effect.Capture,
          ValueReason.Other,
        );
        lvalue.effect = Effect.ConditionallyMutate;
        // direct aliasing: `a = b`;
        state.alias(lvalue, instrValue.place);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'LoadContext': {
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.place,
          Effect.Capture,
          ValueReason.Other,
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        const valueKind = state.kind(instrValue.place);
        state.initialize(instrValue, valueKind);
        state.define(lvalue, instrValue);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'DeclareLocal': {
        const value = UndefinedValue;
        state.initialize(
          value,
          // Catch params may be aliased to mutable values
          instrValue.lvalue.kind === InstructionKind.Catch
            ? {
                kind: ValueKind.Mutable,
                reason: new Set([ValueReason.Other]),
                context: new Set(),
              }
            : {
                kind: ValueKind.Primitive,
                reason: new Set([ValueReason.Other]),
                context: new Set(),
              },
        );
        state.define(instrValue.lvalue.place, value);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'DeclareContext': {
        state.initialize(instrValue, {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
          context: new Set(),
        });
        state.define(instrValue.lvalue.place, instrValue);
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'PostfixUpdate':
      case 'PrefixUpdate': {
        const effect =
          state.isDefined(instrValue.lvalue) &&
          state.kind(instrValue.lvalue).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          effect,
          ValueReason.Other,
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        state.alias(instrValue.lvalue, instrValue.value);
        /*
         * NOTE: *not* using state.reference since this is an assignment.
         * reference() checks if the effect is valid given the value kind,
         * but here the previous value kind doesn't matter since we are
         * replacing it
         */
        instrValue.lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'StoreLocal': {
        const effect =
          state.isDefined(instrValue.lvalue.place) &&
          state.kind(instrValue.lvalue.place).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          effect,
          ValueReason.Other,
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        state.alias(instrValue.lvalue.place, instrValue.value);
        /*
         * NOTE: *not* using state.reference since this is an assignment.
         * reference() checks if the effect is valid given the value kind,
         * but here the previous value kind doesn't matter since we are
         * replacing it
         */
        instrValue.lvalue.place.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'StoreContext': {
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          Effect.ConditionallyMutate,
          ValueReason.Other,
        );
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.lvalue.place,
          Effect.Mutate,
          ValueReason.Other,
        );

        const lvalue = instr.lvalue;
        if (instrValue.lvalue.kind !== InstructionKind.Reassign) {
          state.initialize(instrValue, {
            kind: ValueKind.Mutable,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          });
          state.define(instrValue.lvalue.place, instrValue);
        }
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'StoreGlobal': {
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          Effect.Capture,
          ValueReason.Other,
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'Destructure': {
        let effect: Effect = Effect.Capture;
        for (const place of eachPatternOperand(instrValue.lvalue.pattern)) {
          if (
            state.isDefined(place) &&
            state.kind(place).kind === ValueKind.Context
          ) {
            effect = Effect.ConditionallyMutate;
            break;
          }
        }
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.value,
          effect,
          ValueReason.Other,
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        for (const place of eachPatternOperand(instrValue.lvalue.pattern)) {
          state.alias(place, instrValue.value);
          /*
           * NOTE: *not* using state.reference since this is an assignment.
           * reference() checks if the effect is valid given the value kind,
           * but here the previous value kind doesn't matter since we are
           * replacing it
           */
          place.effect = Effect.Store;
        }
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'GetIterator': {
        /**
         * This instruction represents the step of retrieving an iterator from the collection
         * in `for (... of <collection>)` syntax. We model two cases:
         *
         * 1. The collection is immutable or a known collection type (e.g. Array). In this case
         *    we infer that the iterator produced won't be the same as the collection itself.
         *    If the collection is an Array, this is because it will produce a native Array
         *    iterator. If the collection is already frozen, we assume it must be of some
         *    type that returns a separate iterator. In theory you could pass an Iterator
         *    as props to a component and then for..of over that in the component body, but
         *    this already violates React's rules so we assume you're not doing this.
         * 2. The collection could be an Iterator itself, such that advancing the iterator
         *    (modeled with IteratorNext) mutates the collection itself.
         */
        const kind = state.kind(instrValue.collection).kind;
        const isMutable =
          kind === ValueKind.Mutable || kind === ValueKind.Context;
        let effect;
        let valueKind: AbstractValue;
        const iterator = instrValue.collection.identifier;
        if (
          !isMutable ||
          isArrayType(iterator) ||
          isMapType(iterator) ||
          isSetType(iterator)
        ) {
          // Case 1, assume iterator is a separate mutable object
          effect = {
            kind: Effect.Read,
            reason: ValueReason.Other,
          };
          valueKind = {
            kind: ValueKind.Mutable,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          };
        } else {
          // Case 2, assume that the iterator could be the (mutable) collection itself
          effect = {
            kind: Effect.Capture,
            reason: ValueReason.Other,
          };
          valueKind = state.kind(instrValue.collection);
        }
        continuation = {
          kind: 'initialize',
          effect,
          valueKind,
          lvalueEffect: Effect.Store,
        };
        break;
      }
      case 'IteratorNext': {
        /**
         * This instruction represents advancing an iterator with .next(). We use a
         * conditional mutate to model the two cases for GetIterator:
         * - If the collection is a mutable iterator, we want to model the fact that
         *   advancing the iterator will mutate it
         * - If the iterator may be different from the collection and the collection
         *   is frozen, we don't want to report a false positive "cannot mutate" error.
         *
         * ConditionallyMutate reflects this "mutate if mutable" semantic.
         */
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.iterator,
          Effect.ConditionallyMutateIterator,
          ValueReason.Other,
        );
        /**
         * Regardless of the effect on the iterator, the *result* of advancing the iterator
         * is to extract a value from the collection. We use a Capture effect to reflect this
         * aliasing, and then initialize() the lvalue to the same kind as the colleciton to
         * ensure that the item is mutable or frozen if the collection is mutable/frozen.
         */
        state.referenceAndRecordEffects(
          freezeActions,
          instrValue.collection,
          Effect.Capture,
          ValueReason.Other,
        );
        state.initialize(instrValue, state.kind(instrValue.collection));
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Store;
        continuation = {kind: 'funeffects'};
        break;
      }
      case 'NextPropertyOf': {
        continuation = {
          kind: 'initialize',
          effect: {kind: Effect.Read, reason: ValueReason.Other},
          lvalueEffect: Effect.Store,
          valueKind: {
            kind: ValueKind.Primitive,
            reason: new Set([ValueReason.Other]),
            context: new Set(),
          },
        };
        break;
      }
      default: {
        assertExhaustive(instrValue, 'Unexpected instruction kind');
      }
    }

    if (continuation.kind === 'initialize') {
      for (const operand of eachInstructionOperand(instr)) {
        CompilerError.invariant(continuation.effect != null, {
          reason: `effectKind must be set for instruction value \`${instrValue.kind}\``,
          description: null,
          loc: instrValue.loc,
          suggestions: null,
        });
        state.referenceAndRecordEffects(
          freezeActions,
          operand,
          continuation.effect.kind,
          continuation.effect.reason,
        );
      }

      state.initialize(instrValue, continuation.valueKind);
      state.define(instr.lvalue, instrValue);
      instr.lvalue.effect = continuation.lvalueEffect ?? defaultLvalueEffect;
    }

    functionEffects.push(...inferInstructionFunctionEffects(env, state, instr));
    freezeActions.forEach(({values, reason}) =>
      state.freezeValues(values, reason),
    );
  }

  const terminalFreezeActions: Array<FreezeAction> = [];
  for (const operand of eachTerminalOperand(block.terminal)) {
    let effect;
    if (block.terminal.kind === 'return' || block.terminal.kind === 'throw') {
      if (
        state.isDefined(operand) &&
        ((operand.identifier.type.kind === 'Function' &&
          state.isFunctionExpression) ||
          state.kind(operand).kind === ValueKind.Context)
      ) {
        /**
         * Returned values should only be typed as 'frozen' if they are both (1)
         * local and (2) not a function expression which may capture and mutate
         * this function's outer context.
         */
        effect = Effect.ConditionallyMutate;
      } else {
        effect = Effect.Freeze;
      }
    } else {
      effect = Effect.Read;
    }
    state.referenceAndRecordEffects(
      terminalFreezeActions,
      operand,
      effect,
      ValueReason.Other,
    );
  }
  functionEffects.push(...inferTerminalFunctionEffects(state, block));
  terminalFreezeActions.forEach(({values, reason}) =>
    state.freezeValues(values, reason),
  );
}

function getContextRefOperand(
  state: InferenceState,
  instrValue: InstructionValue,
): Array<Place> {
  const result = [];
  for (const place of eachInstructionValueOperand(instrValue)) {
    if (
      state.isDefined(place) &&
      state.kind(place).kind === ValueKind.Context
    ) {
      result.push(place);
    }
  }
  return result;
}

export function getFunctionCallSignature(
  env: Environment,
  type: Type,
): FunctionSignature | null {
  if (type.kind !== 'Function') {
    return null;
  }
  return env.getFunctionSignature(type);
}

/*
 * Make a best attempt at matching arguments of a {@link MethodCall} to parameter effects.
 * defined in its {@link FunctionSignature}.
 *
 * @param fn
 * @param sig
 * @returns Inferred effects of function arguments, or null if inference fails.
 */
export function getFunctionEffects(
  fn: MethodCall | CallExpression | NewExpression,
  sig: FunctionSignature,
): Array<Effect> | null {
  const results = [];
  for (let i = 0; i < fn.args.length; i++) {
    const arg = fn.args[i];
    if (i < sig.positionalParams.length) {
      /*
       * Only infer effects when there is a direct mapping positional arg --> positional param
       * Otherwise, return null to indicate inference failed
       */
      if (arg.kind === 'Identifier') {
        results.push(sig.positionalParams[i]);
      } else {
        return null;
      }
    } else if (sig.restParam !== null) {
      results.push(sig.restParam);
    } else {
      /*
       * If there are more arguments than positional arguments and a rest parameter is not
       * defined, we'll also assume that inference failed
       */
      return null;
    }
  }
  return results;
}

export function isKnownMutableEffect(effect: Effect): boolean {
  switch (effect) {
    case Effect.Store:
    case Effect.ConditionallyMutate:
    case Effect.ConditionallyMutateIterator:
    case Effect.Mutate: {
      return true;
    }

    case Effect.Unknown: {
      CompilerError.invariant(false, {
        reason: 'Unexpected unknown effect',
        description: null,
        loc: GeneratedSource,
        suggestions: null,
      });
    }
    case Effect.Read:
    case Effect.Capture:
    case Effect.Freeze: {
      return false;
    }
    default: {
      assertExhaustive(effect, `Unexpected effect \`${effect}\``);
    }
  }
}
/**
 * Returns true if all of the arguments are both non-mutable (immutable or frozen)
 * _and_ are not functions which might mutate their arguments. Note that function
 * expressions count as frozen so long as they do not mutate free variables: this
 * function checks that such functions also don't mutate their inputs.
 */
function areArgumentsImmutableAndNonMutating(
  state: InferenceState,
  args: MethodCall['args'],
): boolean {
  for (const arg of args) {
    if (arg.kind === 'Identifier' && arg.identifier.type.kind === 'Function') {
      const fnShape = state.env.getFunctionSignature(arg.identifier.type);
      if (fnShape != null) {
        return (
          !fnShape.positionalParams.some(isKnownMutableEffect) &&
          (fnShape.restParam == null ||
            !isKnownMutableEffect(fnShape.restParam))
        );
      }
    }
    const place = arg.kind === 'Identifier' ? arg : arg.place;

    const kind = state.kind(place).kind;
    switch (kind) {
      case ValueKind.Primitive:
      case ValueKind.Frozen: {
        /*
         * Only immutable values, or frozen lambdas are allowed.
         * A lambda may appear frozen even if it may mutate its inputs,
         * so we have a second check even for frozen value types
         */
        break;
      }
      default: {
        /**
         * Globals, module locals, and other locally defined functions may
         * mutate their arguments.
         */
        return false;
      }
    }
    const values = state.values(place);
    for (const value of values) {
      if (
        value.kind === 'FunctionExpression' &&
        value.loweredFunc.func.params.some(param => {
          const place = param.kind === 'Identifier' ? param : param.place;
          const range = place.identifier.mutableRange;
          return range.end > range.start + 1;
        })
      ) {
        // This is a function which may mutate its inputs
        return false;
      }
    }
  }
  return true;
}

function getArgumentEffect(
  signatureEffect: Effect | null,
  arg: Place | SpreadPattern,
): Effect {
  if (signatureEffect != null) {
    if (arg.kind === 'Identifier') {
      return signatureEffect;
    } else if (
      signatureEffect === Effect.Mutate ||
      signatureEffect === Effect.ConditionallyMutate
    ) {
      return signatureEffect;
    } else {
      // see call-spread-argument-mutable-iterator test fixture
      if (signatureEffect === Effect.Freeze) {
        CompilerError.throwTodo({
          reason: 'Support spread syntax for hook arguments',
          loc: arg.place.loc,
        });
      }
      // effects[i] is Effect.Capture | Effect.Read | Effect.Store
      return Effect.ConditionallyMutateIterator;
    }
  } else {
    return Effect.ConditionallyMutate;
  }
}

function inferCallEffects(
  state: InferenceState,
  instr:
    | TInstruction<CallExpression>
    | TInstruction<MethodCall>
    | TInstruction<NewExpression>,
  freezeActions: Array<FreezeAction>,
  signature: FunctionSignature | null,
): void {
  const instrValue = instr.value;
  const returnValueKind: AbstractValue =
    signature !== null
      ? {
          kind: signature.returnValueKind,
          reason: new Set([
            signature.returnValueReason ?? ValueReason.KnownReturnSignature,
          ]),
          context: new Set(),
        }
      : {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
          context: new Set(),
        };

  if (
    instrValue.kind === 'MethodCall' &&
    signature !== null &&
    signature.mutableOnlyIfOperandsAreMutable &&
    areArgumentsImmutableAndNonMutating(state, instrValue.args)
  ) {
    /*
     * None of the args are mutable or mutate their params, we can downgrade to
     * treating as all reads (except that the receiver may be captured)
     */
    for (const arg of instrValue.args) {
      const place = arg.kind === 'Identifier' ? arg : arg.place;
      state.referenceAndRecordEffects(
        freezeActions,
        place,
        Effect.Read,
        ValueReason.Other,
      );
    }
    state.referenceAndRecordEffects(
      freezeActions,
      instrValue.receiver,
      Effect.Capture,
      ValueReason.Other,
    );
    state.initialize(instrValue, returnValueKind);
    state.define(instr.lvalue, instrValue);
    instr.lvalue.effect =
      instrValue.receiver.effect === Effect.Capture
        ? Effect.Store
        : Effect.ConditionallyMutate;
    return;
  }

  const effects =
    signature !== null ? getFunctionEffects(instrValue, signature) : null;
  let hasCaptureArgument = false;
  for (let i = 0; i < instrValue.args.length; i++) {
    const arg = instrValue.args[i];
    const place = arg.kind === 'Identifier' ? arg : arg.place;
    /*
     * If effects are inferred for an argument, we should fail invalid
     * mutating effects
     */
    state.referenceAndRecordEffects(
      freezeActions,
      place,
      getArgumentEffect(effects != null ? effects[i] : null, arg),
      ValueReason.Other,
    );
    hasCaptureArgument ||= place.effect === Effect.Capture;
  }
  const callee =
    instrValue.kind === 'MethodCall' ? instrValue.receiver : instrValue.callee;
  if (signature !== null) {
    state.referenceAndRecordEffects(
      freezeActions,
      callee,
      signature.calleeEffect,
      ValueReason.Other,
    );
  } else {
    /**
     * For new expressions, we infer a `read` effect on the Class / Function type
     * to avoid extending mutable ranges of locally created classes, e.g.
     * ```js
     * const MyClass = getClass();
     * const value = new MyClass(val1, val2)
     *                   ^ (read)   ^ (conditionally mutate)
     * ```
     *
     * Risks:
     * Classes / functions created during render could technically capture and
     * mutate their enclosing scope, which we currently do not detect.
     */

    state.referenceAndRecordEffects(
      freezeActions,
      callee,
      instrValue.kind === 'NewExpression'
        ? Effect.Read
        : Effect.ConditionallyMutate,
      ValueReason.Other,
    );
  }
  hasCaptureArgument ||= callee.effect === Effect.Capture;

  state.initialize(instrValue, returnValueKind);
  state.define(instr.lvalue, instrValue);
  instr.lvalue.effect = hasCaptureArgument
    ? Effect.Store
    : Effect.ConditionallyMutate;
}
