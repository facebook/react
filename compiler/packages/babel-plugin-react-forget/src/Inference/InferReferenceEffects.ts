/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError, ErrorSeverity } from "../CompilerError";
import { Environment } from "../HIR";
import {
  AbstractValue,
  BasicBlock,
  BlockId,
  CallExpression,
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
  Type,
  ValueKind,
  ValueReason,
  isMutableEffect,
  isObjectType,
} from "../HIR/HIR";
import { FunctionSignature } from "../HIR/ObjectShape";
import {
  printIdentifier,
  printMixedHIR,
  printPlace,
  printSourceLocation,
} from "../HIR/PrintHIR";
import {
  eachInstructionOperand,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
  eachTerminalSuccessor,
} from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";
import { isEffectHook } from "../Validation/ValidateMemoizedEffectDependencies";

const UndefinedValue: InstructionValue = {
  kind: "Primitive",
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
  options: { isFunctionExpression: boolean } = { isFunctionExpression: false }
): void {
  /*
   * Initial state contains function params
   * TODO: include module declarations here as well
   */
  const initialState = InferenceState.empty(fn.env);
  const value: InstructionValue = {
    kind: "Primitive",
    loc: fn.loc,
    value: undefined,
  };
  initialState.initialize(value, {
    kind: ValueKind.Frozen,
    reason: new Set([ValueReason.Other]),
  });

  for (const ref of fn.context) {
    // TODO(gsn): This is a hack.
    const value: InstructionValue = {
      kind: "ObjectExpression",
      properties: [],
      loc: ref.loc,
    };
    initialState.initialize(value, {
      kind: ValueKind.Context,
      reason: new Set([ValueReason.Other]),
    });
    initialState.define(ref, value);
  }

  const paramKind: AbstractValue = options.isFunctionExpression
    ? {
        kind: ValueKind.Mutable,
        reason: new Set([ValueReason.Other]),
      }
    : {
        kind: ValueKind.Frozen,
        reason: new Set([ValueReason.ReactiveFunctionArgument]),
      };

  if (fn.fnType === "Component") {
    CompilerError.invariant(fn.params.length <= 2, {
      reason:
        "Expected React component to have not more than two parameters: one for props and for ref",
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
      if (ref.kind === "Identifier") {
        place = ref;
        value = {
          kind: "ObjectExpression",
          properties: [],
          loc: ref.loc,
        };
      } else {
        place = ref.place;
        value = {
          kind: "ObjectExpression",
          properties: [],
          loc: ref.place.loc,
        };
      }
      initialState.initialize(value, {
        kind: ValueKind.Mutable,
        reason: new Set([ValueReason.Other]),
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
      state = queuedState.merge(state) ?? state;
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
      inferBlock(fn.env, functionEffects, state, block);

      for (const nextBlockId of eachTerminalSuccessor(block.terminal)) {
        queue(nextBlockId, state);
      }
    }
  }

  if (!options.isFunctionExpression) {
    functionEffects.forEach((eff) => {
      switch (eff.kind) {
        case "GlobalMutation":
          CompilerError.throw(eff.error);
        default:
          assertExhaustive(
            eff.kind,
            `Unexpected function effect kind '${eff.kind}'`
          );
      }
    });
  } else {
    fn.effects = functionEffects;
  }
}

// Maintains a mapping of top-level variables to the kind of value they hold
class InferenceState {
  #env: Environment;

  // The kind of reach value, based on its allocation site
  #values: Map<InstructionValue, AbstractValue>;
  /*
   * The set of values pointed to by each identifier. This is a set
   * to accomodate phi points (where a variable may have different
   * values from different control flow paths).
   */
  #variables: Map<IdentifierId, Set<InstructionValue>>;

  constructor(
    env: Environment,
    values: Map<InstructionValue, AbstractValue>,
    variables: Map<IdentifierId, Set<InstructionValue>>
  ) {
    this.#env = env;
    this.#values = values;
    this.#variables = variables;
  }

  static empty(env: Environment): InferenceState {
    return new InferenceState(env, new Map(), new Map());
  }

  // (Re)initializes a @param value with its default @param kind.
  initialize(value: InstructionValue, kind: AbstractValue): void {
    CompilerError.invariant(value.kind !== "LoadLocal", {
      reason:
        "Expected all top-level identifiers to be defined as variables, not values",
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
      description: `No value found at '${printPlace(place)}'`,
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
        value.loc
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
  reference(
    place: Place,
    functionEffects: Array<FunctionEffect>,
    effectKind: Effect,
    reason: ValueReason
  ): void {
    const values = this.#variables.get(place.identifier.id);
    if (values === undefined) {
      CompilerError.invariant(effectKind !== Effect.Store, {
        reason: "[InferReferenceEffects] Unhandled store reference effect",
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

    for (const value of values) {
      if (
        (value.kind === "FunctionExpression" ||
          value.kind === "ObjectMethod") &&
        value.loweredFunc.func.effects != null
      ) {
        functionEffects.push(...value.loweredFunc.func.effects);
      }
    }
    let valueKind: AbstractValue | null = this.kind(place);
    let effect: Effect | null = null;
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
          };
          values.forEach((value) => {
            this.#values.set(value, {
              kind: ValueKind.Frozen,
              reason: reasonSet,
            });

            if (
              this.#env.config.enablePreserveExistingMemoizationGuarantees ||
              this.#env.config.enableTransitivelyFreezeFunctionExpressions
            ) {
              if (value.kind === "FunctionExpression") {
                for (const operand of eachInstructionValueOperand(value)) {
                  this.reference(
                    operand,
                    functionEffects,
                    Effect.Freeze,
                    ValueReason.Other
                  );
                }
              }
            }
          });
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
      case Effect.Mutate: {
        if (
          valueKind.kind !== ValueKind.Mutable &&
          valueKind.kind !== ValueKind.Context
        ) {
          let reason = getWriteErrorReason(valueKind);
          functionEffects.push({
            kind: "GlobalMutation",
            error: {
              reason,
              description:
                place.identifier.name !== null
                  ? `Found mutation of ${place.identifier.name}`
                  : null,
              loc: place.loc,
              suggestions: null,
              severity: ErrorSeverity.InvalidReact,
            },
          });
        }
        effect = Effect.Mutate;
        break;
      }
      case Effect.Store: {
        if (
          valueKind.kind !== ValueKind.Mutable &&
          valueKind.kind !== ValueKind.Context
        ) {
          let reason = getWriteErrorReason(valueKind);
          functionEffects.push({
            kind: "GlobalMutation",
            error: {
              reason,
              description:
                place.identifier.name !== null
                  ? `Found mutation of ${place.identifier.name}`
                  : null,
              loc: place.loc,
              suggestions: null,
              severity: ErrorSeverity.InvalidReact,
            },
          });
        }

        /*
         * TODO(gsn): This should be bailout once we add bailout infra.
         *
         * invariant(
         *   valueKind.kind === ValueKindKind.Mutable,
         *   `expected valueKind to be 'Mutable' but found to be '${valueKind}'`
         * );
         */
        effect = isObjectType(place.identifier) ? Effect.Store : Effect.Mutate;
        break;
      }
      case Effect.Capture: {
        if (
          valueKind.kind === ValueKind.Immutable ||
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
            "Unexpected unknown effect, expected to infer a precise effect kind",
          description: null,
          loc: place.loc,
          suggestions: null,
        });
      }
      default: {
        assertExhaustive(
          effectKind,
          `Unexpected reference kind '${effectKind as any as string}'`
        );
      }
    }
    CompilerError.invariant(effect !== null, {
      reason: "Expected effect to be set",
      description: null,
      loc: place.loc,
      suggestions: null,
    });
    place.effect = effect;
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
        this.#env,
        nextValues ?? new Map(this.#values),
        nextVariables ?? new Map(this.#variables)
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
      this.#env,
      new Map(this.#values),
      new Map(this.#variables)
    );
  }

  /*
   * For debugging purposes, dumps the state to a plain
   * object so that it can printed as JSON.
   */
  debug(): any {
    const result: any = { values: {}, variables: {} };
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
      result.values[id] = { kind, value: printMixedHIR(value) };
    }
    for (const [variable, values] of this.#variables) {
      result.variables[variable] = [...values].map(identify);
    }
    return result;
  }

  inferPhi(phi: Phi): void {
    const values: Set<InstructionValue> = new Set();
    for (const [_, operand] of phi.operands) {
      const operandValues = this.#variables.get(operand.id);
      // This is a backedge that will be handled later by State.merge
      if (operandValues === undefined) continue;
      for (const v of operandValues) {
        values.add(v);
      }
    }

    if (values.size > 0) {
      this.#variables.set(phi.id.id, values);
    }
  }
}

function inferParam(
  param: Place | SpreadPattern,
  initialState: InferenceState,
  paramKind: AbstractValue
): void {
  let value: InstructionValue;
  let place: Place;
  if (param.kind === "Identifier") {
    place = param;
    value = {
      kind: "Primitive",
      loc: param.loc,
      value: undefined,
    };
  } else {
    place = param.place;
    value = {
      kind: "Primitive",
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
  } else {
    // frozen | immutable
    return ValueKind.Frozen;
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
  b: AbstractValue
): AbstractValue {
  const kind = mergeValues(a.kind, b.kind);
  if (kind === a.kind && kind === b.kind && isSuperset(a.reason, b.reason)) {
    return a;
  }
  const reason = new Set(a.reason);
  for (const r of b.reason) {
    reason.add(r);
  }
  return { kind, reason };
}

/*
 * Iterates over the given @param block, defining variables and
 * recording references on the @param state according to JS semantics.
 */
function inferBlock(
  env: Environment,
  functionEffects: Array<FunctionEffect>,
  state: InferenceState,
  block: BasicBlock
): void {
  for (const phi of block.phis) {
    state.inferPhi(phi);
  }

  for (const instr of block.instructions) {
    const instrValue = instr.value;
    let effect: { kind: Effect; reason: ValueReason } | null = null;
    let lvalueEffect = Effect.ConditionallyMutate;
    let valueKind: AbstractValue;
    switch (instrValue.kind) {
      case "BinaryExpression": {
        valueKind = {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        };
        effect = {
          kind: Effect.Read,
          reason: ValueReason.Other,
        };
        break;
      }
      case "ArrayExpression": {
        valueKind = hasContextRefOperand(state, instrValue)
          ? {
              kind: ValueKind.Context,
              reason: new Set([ValueReason.Other]),
            }
          : { kind: ValueKind.Mutable, reason: new Set([ValueReason.Other]) };
        effect = { kind: Effect.Capture, reason: ValueReason.Other };
        lvalueEffect = Effect.Store;
        break;
      }
      case "NewExpression": {
        valueKind = {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
        };
        effect = {
          kind: Effect.ConditionallyMutate,
          reason: ValueReason.Other,
        };
        break;
      }
      case "ObjectExpression": {
        valueKind = hasContextRefOperand(state, instrValue)
          ? {
              kind: ValueKind.Context,
              reason: new Set([ValueReason.Other]),
            }
          : { kind: ValueKind.Mutable, reason: new Set([ValueReason.Other]) };

        for (const property of instrValue.properties) {
          switch (property.kind) {
            case "ObjectProperty": {
              if (property.key.kind === "computed") {
                // Object keys must be primitives, so we know they're frozen at this point
                state.reference(
                  property.key.name,
                  functionEffects,
                  Effect.Freeze,
                  ValueReason.Other
                );
              }
              // Object construction captures but does not modify the key/property values
              state.reference(
                property.place,
                functionEffects,
                Effect.Capture,
                ValueReason.Other
              );
              break;
            }
            case "Spread": {
              // Object construction captures but does not modify the key/property values
              state.reference(
                property.place,
                functionEffects,
                Effect.Capture,
                ValueReason.Other
              );
              break;
            }
            default: {
              assertExhaustive(
                property,
                `Unexpected property kind '${(property as any).kind}'`
              );
            }
          }
        }

        state.initialize(instrValue, valueKind);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Store;
        continue;
      }
      case "UnaryExpression": {
        valueKind = {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        };
        effect = { kind: Effect.Read, reason: ValueReason.Other };
        break;
      }
      case "UnsupportedNode": {
        // TODO: handle other statement kinds
        valueKind = {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
        };
        break;
      }
      case "JsxExpression": {
        valueKind = {
          kind: ValueKind.Frozen,
          reason: new Set([ValueReason.Other]),
        };
        effect = { kind: Effect.Freeze, reason: ValueReason.JsxCaptured };
        break;
      }
      case "JsxFragment": {
        valueKind = {
          kind: ValueKind.Frozen,
          reason: new Set([ValueReason.Other]),
        };
        effect = {
          kind: Effect.Freeze,
          reason: ValueReason.Other,
        };
        break;
      }
      case "TaggedTemplateExpression": {
        valueKind = {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
        };
        effect = {
          kind: Effect.ConditionallyMutate,
          reason: ValueReason.Other,
        };
        break;
      }
      case "TemplateLiteral": {
        /*
         * template literal (with no tag function) always produces
         * an immutable string
         */
        valueKind = {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        };
        effect = { kind: Effect.Read, reason: ValueReason.Other };
        break;
      }
      case "RegExpLiteral": {
        // RegExp instances are mutable objects
        valueKind = {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
        };
        effect = {
          kind: Effect.ConditionallyMutate,
          reason: ValueReason.Other,
        };
        break;
      }
      case "LoadGlobal":
        valueKind = {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Global]),
        };
        break;
      case "Debugger":
      case "JSXText":
      case "Primitive": {
        valueKind = {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        };
        break;
      }
      case "ObjectMethod":
      case "FunctionExpression": {
        let hasMutableOperand = false;
        for (const operand of eachInstructionOperand(instr)) {
          state.reference(
            operand,
            functionEffects,
            operand.effect === Effect.Unknown ? Effect.Read : operand.effect,
            ValueReason.Other
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
        });
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Store;
        continue;
      }
      case "CallExpression": {
        const signature = getFunctionCallSignature(
          env,
          instrValue.callee.identifier.type
        );

        const effects =
          signature !== null ? getFunctionEffects(instrValue, signature) : null;
        const returnValueKind: AbstractValue =
          signature !== null
            ? {
                kind: signature.returnValueKind,
                reason: new Set([
                  signature.returnValueReason ??
                    ValueReason.KnownReturnSignature,
                ]),
              }
            : { kind: ValueKind.Mutable, reason: new Set([ValueReason.Other]) };
        let hasCaptureArgument = false;
        let isUseEffect = isEffectHook(instrValue.callee.identifier);
        for (let i = 0; i < instrValue.args.length; i++) {
          const argumentEffects: Array<FunctionEffect> = [];
          const arg = instrValue.args[i];
          const place = arg.kind === "Identifier" ? arg : arg.place;
          if (effects !== null) {
            state.reference(
              place,
              argumentEffects,
              effects[i],
              ValueReason.Other
            );
          } else {
            state.reference(
              place,
              argumentEffects,
              Effect.ConditionallyMutate,
              ValueReason.Other
            );
          }
          /*
           * Join the effects of the argument with the effects of the enclosing function,
           * unless the we're detecting a global mutation inside a useEffect hook
           */
          functionEffects.push(
            ...argumentEffects.filter(
              (argEffect) =>
                !isUseEffect || i !== 0 || argEffect.kind !== "GlobalMutation"
            )
          );
          hasCaptureArgument ||= place.effect === Effect.Capture;
        }
        if (signature !== null) {
          state.reference(
            instrValue.callee,
            functionEffects,
            signature.calleeEffect,
            ValueReason.Other
          );
        } else {
          state.reference(
            instrValue.callee,
            functionEffects,
            Effect.ConditionallyMutate,
            ValueReason.Other
          );
        }
        hasCaptureArgument ||= instrValue.callee.effect === Effect.Capture;

        state.initialize(instrValue, returnValueKind);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = hasCaptureArgument
          ? Effect.Store
          : Effect.ConditionallyMutate;
        continue;
      }
      case "MethodCall": {
        CompilerError.invariant(state.isDefined(instrValue.receiver), {
          reason:
            "[InferReferenceEffects] Internal error: receiver of PropertyCall should have been defined by corresponding PropertyLoad",
          description: null,
          loc: instrValue.loc,
          suggestions: null,
        });
        state.reference(
          instrValue.property,
          functionEffects,
          Effect.Read,
          ValueReason.Other
        );

        const signature = getFunctionCallSignature(
          env,
          instrValue.property.identifier.type
        );

        const returnValueKind: AbstractValue =
          signature !== null
            ? {
                kind: signature.returnValueKind,
                reason: new Set([ValueReason.Other]),
              }
            : { kind: ValueKind.Mutable, reason: new Set([ValueReason.Other]) };

        if (
          signature !== null &&
          signature.mutableOnlyIfOperandsAreMutable &&
          areArgumentsImmutableAndNonMutating(state, instrValue.args)
        ) {
          /*
           * None of the args are mutable or mutate their params, we can downgrade to
           * treating as all reads (except that the receiver may be captured)
           */
          for (const arg of instrValue.args) {
            const place = arg.kind === "Identifier" ? arg : arg.place;
            state.reference(
              place,
              functionEffects,
              Effect.Read,
              ValueReason.Other
            );
          }
          state.reference(
            instrValue.receiver,
            functionEffects,
            Effect.Capture,
            ValueReason.Other
          );
          state.initialize(instrValue, returnValueKind);
          state.define(instr.lvalue, instrValue);
          instr.lvalue.effect =
            instrValue.receiver.effect === Effect.Capture
              ? Effect.Store
              : Effect.ConditionallyMutate;
          continue;
        }

        const effects =
          signature !== null ? getFunctionEffects(instrValue, signature) : null;
        let hasCaptureArgument = false;
        for (let i = 0; i < instrValue.args.length; i++) {
          const arg = instrValue.args[i];
          const place = arg.kind === "Identifier" ? arg : arg.place;
          if (effects !== null) {
            /*
             * If effects are inferred for an argument, we should fail invalid
             * mutating effects
             */
            state.reference(
              place,
              functionEffects,
              effects[i],
              ValueReason.Other
            );
          } else {
            state.reference(
              place,
              functionEffects,
              Effect.ConditionallyMutate,
              ValueReason.Other
            );
          }
          hasCaptureArgument ||= place.effect === Effect.Capture;
        }
        if (signature !== null) {
          state.reference(
            instrValue.receiver,
            functionEffects,
            signature.calleeEffect,
            ValueReason.Other
          );
        } else {
          state.reference(
            instrValue.receiver,
            functionEffects,
            Effect.ConditionallyMutate,
            ValueReason.Other
          );
        }
        hasCaptureArgument ||= instrValue.receiver.effect === Effect.Capture;

        state.initialize(instrValue, returnValueKind);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = hasCaptureArgument
          ? Effect.Store
          : Effect.ConditionallyMutate;
        continue;
      }
      case "PropertyStore": {
        const effect =
          state.kind(instrValue.object).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.reference(
          instrValue.value,
          functionEffects,
          effect,
          ValueReason.Other
        );
        state.reference(
          instrValue.object,
          functionEffects,
          Effect.Store,
          ValueReason.Other
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continue;
      }
      case "PropertyDelete": {
        // `delete` returns a boolean (immutable) and modifies the object
        valueKind = {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        };
        effect = { kind: Effect.Mutate, reason: ValueReason.Other };
        break;
      }
      case "PropertyLoad": {
        state.reference(
          instrValue.object,
          functionEffects,
          Effect.Read,
          ValueReason.Other
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.initialize(instrValue, state.kind(instrValue.object));
        state.define(lvalue, instrValue);
        continue;
      }
      case "ComputedStore": {
        const effect =
          state.kind(instrValue.object).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.reference(
          instrValue.value,
          functionEffects,
          effect,
          ValueReason.Other
        );
        state.reference(
          instrValue.property,
          functionEffects,
          Effect.Capture,
          ValueReason.Other
        );
        state.reference(
          instrValue.object,
          functionEffects,
          Effect.Store,
          ValueReason.Other
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continue;
      }
      case "ComputedDelete": {
        state.reference(
          instrValue.object,
          functionEffects,
          Effect.Mutate,
          ValueReason.Other
        );
        state.reference(
          instrValue.property,
          functionEffects,
          Effect.Read,
          ValueReason.Other
        );
        state.initialize(instrValue, {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        });
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Mutate;
        continue;
      }
      case "ComputedLoad": {
        state.reference(
          instrValue.object,
          functionEffects,
          Effect.Read,
          ValueReason.Other
        );
        state.reference(
          instrValue.property,
          functionEffects,
          Effect.Read,
          ValueReason.Other
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.initialize(instrValue, state.kind(instrValue.object));
        state.define(lvalue, instrValue);
        continue;
      }
      case "Await": {
        state.initialize(instrValue, state.kind(instrValue.value));
        /*
         * Awaiting a value causes it to change state (go from unresolved to resolved or error)
         * It also means that any side-effects which would occur as part of the promise evaluation
         * will occur.
         */
        state.reference(
          instrValue.value,
          functionEffects,
          Effect.ConditionallyMutate,
          ValueReason.Other
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.alias(lvalue, instrValue.value);
        continue;
      }
      case "TypeCastExpression": {
        /*
         * A type cast expression has no effect at runtime, so it's equivalent to a raw
         * identifier:
         * ```
         * x = (y: type)  // is equivalent to...
         * x = y
         * ```
         */
        state.initialize(instrValue, state.kind(instrValue.value));
        state.reference(
          instrValue.value,
          functionEffects,
          Effect.Read,
          ValueReason.Other
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.alias(lvalue, instrValue.value);
        continue;
      }
      case "Memoize": {
        if (env.config.enablePreserveExistingMemoizationGuarantees) {
          state.reference(
            instrValue.value,
            functionEffects,
            Effect.Freeze,
            ValueReason.Other
          );
        } else {
          state.reference(
            instrValue.value,
            functionEffects,
            Effect.Read,
            ValueReason.Other
          );
        }
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        state.initialize(instrValue, {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        });
        state.define(lvalue, instrValue);
        continue;
      }
      case "LoadLocal": {
        const lvalue = instr.lvalue;
        const effect =
          state.isDefined(lvalue) &&
          state.kind(lvalue).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.reference(
          instrValue.place,
          functionEffects,
          effect,
          ValueReason.Other
        );
        lvalue.effect = Effect.ConditionallyMutate;
        // direct aliasing: `a = b`;
        state.alias(lvalue, instrValue.place);
        continue;
      }
      case "LoadContext": {
        state.reference(
          instrValue.place,
          functionEffects,
          Effect.Capture,
          ValueReason.Other
        );
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.ConditionallyMutate;
        const valueKind = state.kind(instrValue.place);
        CompilerError.invariant(
          valueKind.kind === ValueKind.Mutable ||
            valueKind.kind === ValueKind.Context,
          {
            reason:
              "[InferReferenceEffects] Context variables are always mutable.",
            description: null,
            loc: instrValue.loc,
            suggestions: null,
          }
        );
        state.initialize(instrValue, valueKind);
        state.define(lvalue, instrValue);
        continue;
      }
      case "DeclareLocal": {
        const value = UndefinedValue;
        state.initialize(
          value,
          // Catch params may be aliased to mutable values
          instrValue.lvalue.kind === InstructionKind.Catch
            ? {
                kind: ValueKind.Mutable,
                reason: new Set([ValueReason.Other]),
              }
            : {
                kind: ValueKind.Immutable,
                reason: new Set([ValueReason.Other]),
              }
        );
        state.define(instrValue.lvalue.place, value);
        continue;
      }
      case "DeclareContext": {
        state.initialize(instrValue, {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
        });
        state.define(instrValue.lvalue.place, instrValue);
        continue;
      }
      case "PostfixUpdate":
      case "PrefixUpdate": {
        const effect =
          state.isDefined(instrValue.lvalue) &&
          state.kind(instrValue.lvalue).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.reference(
          instrValue.value,
          functionEffects,
          effect,
          ValueReason.Other
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
        continue;
      }
      case "StoreLocal": {
        const effect =
          state.isDefined(instrValue.lvalue.place) &&
          state.kind(instrValue.lvalue.place).kind === ValueKind.Context
            ? Effect.ConditionallyMutate
            : Effect.Capture;
        state.reference(
          instrValue.value,
          functionEffects,
          effect,
          ValueReason.Other
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
        continue;
      }
      case "StoreContext": {
        state.reference(
          instrValue.value,
          functionEffects,
          Effect.ConditionallyMutate,
          ValueReason.Other
        );
        state.reference(
          instrValue.lvalue.place,
          functionEffects,
          Effect.Mutate,
          ValueReason.Other
        );

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continue;
      }
      case "Destructure": {
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
        state.reference(
          instrValue.value,
          functionEffects,
          effect,
          ValueReason.Other
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
        continue;
      }
      case "NextIterableOf": {
        effect = { kind: Effect.Capture, reason: ValueReason.Other };
        lvalueEffect = Effect.Store;
        valueKind = {
          kind: ValueKind.Mutable,
          reason: new Set([ValueReason.Other]),
        };
        break;
      }
      case "NextPropertyOf": {
        effect = { kind: Effect.Read, reason: ValueReason.Other };
        lvalueEffect = Effect.Store;
        valueKind = {
          kind: ValueKind.Immutable,
          reason: new Set([ValueReason.Other]),
        };
        break;
      }
      default: {
        assertExhaustive(instrValue, "Unexpected instruction kind");
      }
    }

    for (const operand of eachInstructionOperand(instr)) {
      CompilerError.invariant(effect != null, {
        reason: `effectKind must be set for instruction value \`${instrValue.kind}\``,
        description: null,
        loc: instrValue.loc,
        suggestions: null,
      });
      state.reference(operand, functionEffects, effect.kind, effect.reason);
    }

    state.initialize(instrValue, valueKind);
    state.define(instr.lvalue, instrValue);
    instr.lvalue.effect = lvalueEffect;
  }

  for (const operand of eachTerminalOperand(block.terminal)) {
    let effect;
    if (block.terminal.kind === "return" || block.terminal.kind === "throw") {
      if (
        state.isDefined(operand) &&
        state.kind(operand).kind === ValueKind.Context
      ) {
        effect = Effect.ConditionallyMutate;
      } else {
        effect = Effect.Freeze;
      }
    } else {
      effect = Effect.Read;
    }
    state.reference(operand, functionEffects, effect, ValueReason.Other);
  }
}

function hasContextRefOperand(
  state: InferenceState,
  instrValue: InstructionValue
): boolean {
  for (const place of eachInstructionValueOperand(instrValue)) {
    if (
      state.isDefined(place) &&
      state.kind(place).kind === ValueKind.Context
    ) {
      return true;
    }
  }
  return false;
}

export function getFunctionCallSignature(
  env: Environment,
  type: Type
): FunctionSignature | null {
  if (type.kind !== "Function") {
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
function getFunctionEffects(
  fn: MethodCall | CallExpression,
  sig: FunctionSignature
): Array<Effect> | null {
  const results = [];
  for (let i = 0; i < fn.args.length; i++) {
    const arg = fn.args[i];
    if (i < sig.positionalParams.length) {
      /*
       * Only infer effects when there is a direct mapping positional arg --> positional param
       * Otherwise, return null to indicate inference failed
       */
      if (arg.kind === "Identifier") {
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

/**
 * Returns true if all of the arguments are both non-mutable (immutable or frozen)
 * _and_ are not functions which might mutate their arguments. Note that function
 * expressions count as frozen so long as they do not mutate free variables: this
 * function checks that such functions also don't mutate their inputs.
 */
function areArgumentsImmutableAndNonMutating(
  state: InferenceState,
  args: MethodCall["args"]
): boolean {
  for (const arg of args) {
    const place = arg.kind === "Identifier" ? arg : arg.place;
    const kind = state.kind(place).kind;
    switch (kind) {
      case ValueKind.Immutable:
      case ValueKind.Frozen: {
        /*
         * Only immutable values, or frozen lambdas are allowed.
         * A lambda may appear frozen even if it may mutate its inputs,
         * so we have a second check even for frozen value types
         */
        break;
      }
      default: {
        return false;
      }
    }
    const values = state.values(place);
    for (const value of values) {
      if (
        value.kind === "FunctionExpression" &&
        value.loweredFunc.func.params.some((param) => {
          const place = param.kind === "Identifier" ? param : param.place;
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

function getWriteErrorReason(abstractValue: AbstractValue): string {
  if (abstractValue.reason.has(ValueReason.Global)) {
    return "Writing to a variable defined outside a component or hook is not allowed. Consider using an effect.";
  } else if (abstractValue.reason.has(ValueReason.JsxCaptured)) {
    return "Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX.";
  } else if (abstractValue.reason.has(ValueReason.Context)) {
    return `Mutating a value returned from 'useContext()', which should not be mutated.`;
  } else if (abstractValue.reason.has(ValueReason.KnownReturnSignature)) {
    return "Mutating a value returned from a function that should not be mutated.";
  } else if (abstractValue.reason.has(ValueReason.ReactiveFunctionArgument)) {
    return "Mutating props or hook arguments is not allowed. Consider using a local variable instead.";
  } else {
    return "This mutates a variable that React considers immutable.";
  }
}
