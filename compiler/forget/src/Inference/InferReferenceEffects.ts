/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { CompilerError } from "../CompilerError";
import { Environment } from "../HIR";
import {
  BasicBlock,
  BlockId,
  Effect,
  HIRFunction,
  IdentifierId,
  InstructionValue,
  isObjectType,
  Phi,
  Place,
  ValueKind,
} from "../HIR/HIR";
import {
  printMixedHIR,
  printPlace,
  printSourceLocation,
} from "../HIR/PrintHIR";
import {
  eachInstructionOperand,
  eachInstructionValueOperand,
  eachTerminalOperand,
  eachTerminalSuccessor,
} from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";

/**
 * For every usage of a value in the given function, infers the effect or action
 * taken at that reference. Each reference is inferred as exactly one of:
 * - freeze: this usage freezes the value, ie converts it to frozen. This is only inferred
 *   when the value *may* not already be frozen.
 * - frozen: the value is known to already be "owned" by React and is therefore already
 *   frozen (permanently and transitively immutable).
 * - immutable: the value is not owned by React, but is known to be an immutable value
 *   that therefore cannot ever change.
 * - readonly: the value is not frozen or immutable, but this usage of the value does
 *   not modify it. the value may be mutated by a subsequent reference. Examples include
 *   referencing the operands of a binary expression, or referencing the items/properties
 *   of an array or object literal.
 * - mutable: the value is not frozen or immutable, and this usage *may* modify it.
 *   Examples include passing a value to as a function argument or assigning into an object.
 *
 * Note that the inference follows variable assignment, so assigning a frozen value
 * to a different value will infer usages of the other variable as frozen as well.
 *
 * The inference assumes that the code follows the rules of React:
 * - React function arguments are frozen (component props, hook arguments).
 * - Hook arguments are frozen at the point the hook is invoked.
 * - React function return values are frozen at the point of being returned,
 *   thus the return value of a hook call is frozen.
 * - JSX represents invocation of a React function (the component) and
 *   therefore all values passed to JSX become frozen at the point the JSX
 *   is created.
 *
 * Internally, the inference tracks the approximate type of value held by each variable,
 * and iterates over the control flow graph. The inferred effect of reach reference is
 * a combination of the operation performed (ie, assignment into an object mutably uses the
 * object; an if condition reads the condition) and the type of the value. The types of values
 * are:
 * - frozen: can be any type so long as the value is known to be owned by React, permanently
 *   and transitively immutable
 * - maybe-frozen: the value may or may not be frozen, conditionally depending on control flow.
 * - immutable: a type with value semantics: primitives, records/tuples when standardized.
 * - mutable: a type with reference semantics eg array, object, class instance, etc.
 *
 * When control flow paths converge the types of values are merged together, with the value
 * types forming a lattice to ensure convergence.
 */
export default function inferReferenceEffects(fn: HIRFunction) {
  // Initial state contains function params
  // TODO: include module declarations here as well
  const initialState = InferenceState.empty();
  const value: InstructionValue = {
    kind: "Primitive",
    loc: fn.loc,
    value: undefined,
  };
  initialState.initialize(value, ValueKind.Frozen);
  if (fn.id !== null) {
    const id: Place = {
      kind: "Identifier",
      identifier: fn.id,
      loc: fn.loc,
      effect: Effect.Freeze,
    };
    initialState.define(id, value);
  }

  for (const ref of fn.context) {
    // TODO(gsn): This is a hack.
    const value: InstructionValue = {
      kind: "ObjectExpression",
      properties: null,
      loc: ref.loc,
    };
    initialState.initialize(value, ValueKind.Context);
    initialState.define(ref, value);
  }

  for (const param of fn.params) {
    const value: InstructionValue = {
      kind: "Primitive",
      loc: param.loc,
      value: undefined,
    };
    initialState.initialize(value, ValueKind.Frozen);
    initialState.define(param, value);
  }

  // Map of blocks to the last (merged) incoming state that was processed
  const statesByBlock: Map<BlockId, InferenceState> = new Map();

  // Multiple predecessors may be visited prior to reaching a given successor,
  // so track the list of incoming state for each successor block.
  // These are merged when reaching that block again.
  const queuedStates: Map<BlockId, InferenceState> = new Map();
  function queue(blockId: BlockId, state: InferenceState) {
    let queuedState = queuedStates.get(blockId);
    if (queuedState != null) {
      // merge the queued states for this block
      state = queuedState.merge(state) ?? state;
      queuedStates.set(blockId, state);
    } else {
      // this is the first queued state for this block, see whether
      // there are changed relative to the last time it was processed.
      const prevState = statesByBlock.get(blockId);
      const nextState = prevState != null ? prevState.merge(state) : state;
      if (nextState != null) {
        queuedStates.set(blockId, nextState);
      }
    }
  }
  queue(fn.body.entry, initialState);

  while (queuedStates.size !== 0) {
    for (const [blockId, block] of fn.body.blocks) {
      const incomingState = queuedStates.get(blockId);
      queuedStates.delete(blockId);
      if (incomingState == null) {
        continue;
      }

      statesByBlock.set(blockId, incomingState);
      const state = incomingState.clone();
      inferBlock(fn.env, state, block);

      for (const nextBlockId of eachTerminalSuccessor(block.terminal)) {
        queue(nextBlockId, state);
      }
    }
  }
}

/**
 * Maintains a mapping of top-level variables to the kind of value they hold
 */
class InferenceState {
  // The kind of reach value, based on its allocation site
  #values: Map<InstructionValue, ValueKind>;
  // The set of values pointed to by each identifier. This is a set
  // to accomodate phi points (where a variable may have different
  // values from different control flow paths).
  #variables: Map<IdentifierId, Set<InstructionValue>>;

  constructor(
    values: Map<InstructionValue, ValueKind>,
    variables: Map<IdentifierId, Set<InstructionValue>>
  ) {
    this.#values = values;
    this.#variables = variables;
  }

  static empty(): InferenceState {
    return new InferenceState(new Map(), new Map());
  }

  /**
   * (Re)initializes a @param value with its default @param kind.
   */
  initialize(value: InstructionValue, kind: ValueKind) {
    invariant(
      value.kind !== "LoadLocal",
      "Expected all top-level identifiers to be defined as variables, not values"
    );
    this.#values.set(value, kind);
  }

  /**
   * Lookup the kind of the given @param value.
   */
  kind(place: Place): ValueKind {
    const values = this.#variables.get(place.identifier.id);
    invariant(
      values != null,
      `Expected value kind to be initialized at '${printSourceLocation(
        place.loc
      )}'`
    );
    let mergedKind: ValueKind | null = null;
    for (const value of values) {
      const kind = this.#values.get(value)!;
      mergedKind = mergedKind !== null ? mergeValues(mergedKind, kind) : kind;
    }
    if (mergedKind === null) {
      CompilerError.invariant(
        `InferReferenceEffects::kind: Expected at least one value at '${printPlace(
          place
        )}'`,
        place.loc
      );
    }
    return mergedKind;
  }

  /**
   * Updates the value at @param place to point to the same value as @param value.
   */
  alias(place: Place, value: Place) {
    const values = this.#variables.get(value.identifier.id);
    invariant(
      values != null,
      "Expected value for identifier `%s` to be initialized.",
      value.identifier.id
    );
    this.#variables.set(place.identifier.id, new Set(values));
  }

  /**
   * Defines (initializing or updating) a variable with a specific kind of value.
   */
  define(place: Place, value: InstructionValue) {
    invariant(
      this.#values.has(value),
      `Expected value to be initialized at '${printSourceLocation(value.loc)}'`
    );
    this.#variables.set(place.identifier.id, new Set([value]));
  }

  isDefined(place: Place): boolean {
    return this.#variables.has(place.identifier.id);
  }

  /**
   * Records that a given Place was accessed with the given kind and:
   * - Updates the effect of @param place based on the kind of value
   *   and the kind of reference (@param effectKind).
   * - Updates the value kind to reflect the effect of the reference.
   *
   * Notably, a mutable reference is downgraded to readonly if the
   * value unless the value is known to be mutable.
   *
   * Similarly, a freeze reference is converted to readonly if the
   * value is already frozen or is immutable.
   */
  reference(place: Place, effectKind: Effect) {
    const values = this.#variables.get(place.identifier.id);
    if (values === undefined) {
      place.effect = effectKind === Effect.Mutate ? Effect.Mutate : Effect.Read;
      return;
    }
    let valueKind: ValueKind | null = this.kind(place);
    let effect: Effect | null = null;
    switch (effectKind) {
      case Effect.Freeze: {
        if (
          valueKind === ValueKind.Mutable ||
          valueKind === ValueKind.Context ||
          valueKind === ValueKind.MaybeFrozen
        ) {
          effect = Effect.Freeze;
          valueKind = ValueKind.Frozen;
          values.forEach((value) => this.#values.set(value, ValueKind.Frozen));
        } else {
          effect = Effect.Read;
        }
        break;
      }
      case Effect.Mutate: {
        if (
          valueKind === ValueKind.Mutable ||
          valueKind === ValueKind.Context
        ) {
          effect = Effect.Mutate;
        } else {
          effect = Effect.Read;
        }
        break;
      }
      case Effect.Store: {
        // TODO(gsn): This should be bailout once we add bailout infra.
        //
        // invariant(
        //   valueKind === ValueKind.Mutable,
        //   `expected valueKind to be 'Mutable' but found to be '${valueKind}'`
        // );
        effect = isObjectType(place.identifier) ? Effect.Store : Effect.Mutate;
        break;
      }
      case Effect.Capture: {
        if (
          valueKind === ValueKind.Immutable ||
          valueKind === ValueKind.Frozen ||
          valueKind === ValueKind.MaybeFrozen
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
        invariant(
          false,
          "Unexpected unknown effect, expected to infer a precise effect kind"
        );
      }
      default: {
        assertExhaustive(
          effectKind,
          `Unexpected reference kind '${effectKind as any as string}'`
        );
      }
    }
    invariant(effect !== null, "Expected effect to be set");
    place.effect = effect;
  }

  /**
   * Combine the contents of @param this and @param other, returning a new
   * instance with the combined changes _if_ there are any changes, or
   * returning null if no changes would occur. Changes include:
   * - new entries in @param other that did not exist in @param this
   * - entries whose values differ in @param this and @param other,
   *   and where joining the values produces a different value than
   *   what was in @param this.
   *
   * Note that values are joined using a lattice operation to ensure
   * termination.
   */
  merge(other: InferenceState): InferenceState | null {
    let nextValues: Map<InstructionValue, ValueKind> | null = null;
    let nextVariables: Map<IdentifierId, Set<InstructionValue>> | null = null;

    for (const [id, thisValue] of this.#values) {
      const otherValue = other.#values.get(id);
      if (otherValue !== undefined) {
        const mergedValue = mergeValues(thisValue, otherValue);
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
        nextValues ?? new Map(this.#values),
        nextVariables ?? new Map(this.#variables)
      );
    }
  }

  /**
   * Returns a copy of this state.
   * TODO: consider using persistent data structures to make
   * clone cheaper.
   */
  clone(): InferenceState {
    return new InferenceState(new Map(this.#values), new Map(this.#variables));
  }

  /**
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

  inferPhi(phi: Phi) {
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

/**
 * Joins two values using the following rules:
 * == Effect Transitions ==
 *
 * Freezing an immutable value has not effect:
 *               ┌───────────────┐
 *               │               │
 *               ▼               │ Freeze
 * ┌──────────────────────────┐  │
 * │        Immutable         │──┘
 * └──────────────────────────┘
 *
 * Freezing a mutable or maybe-frozen value makes it frozen. Freezing a frozen
 * value has no effect:
 *                                                    ┌───────────────┐
 * ┌─────────────────────────┐     Freeze             │               │
 * │       MaybeFrozen       │────┐                   ▼               │ Freeze
 * └─────────────────────────┘    │     ┌──────────────────────────┐  │
 *                                ├────▶│          Frozen          │──┘
 *                                │     └──────────────────────────┘
 * ┌─────────────────────────┐    │
 * │         Mutable         │────┘
 * └─────────────────────────┘
 *
 * == Join Lattice ==
 * - immutable | mutable => mutable
 *    The justification is that immutable and mutable values are different types,
 *    and functions can introspect them to tell the difference (if the argument
 *    is null return early, else if its an object mutate it).
 * - frozen | mutable => maybe-frozen
 *    Frozen values are indistinguishable from mutable values at runtime, so callers
 *    cannot dynamically avoid mutation of "frozen" values. If a value could be
 *    frozen we have to distinguish it from a mutable value. But it also isn't known
 *    frozen yet, so we distinguish as maybe-frozen.
 * - immutable | frozen => frozen
 *    This is subtle and falls out of the above rules. If a value could be any of
 *    immutable, mutable, or frozen, then at runtime it could either be a primitive
 *    or a reference type, and callers can't distinguish frozen or not for reference
 *    types. To ensure that any sequence of joins btw those three states yields the
 *    correct maybe-frozen, these two have to produce a frozen value.
 * - <any> | maybe-frozen => maybe-frozen
 * - immutable | context => context
 * - mutable | context => context
 * - frozen | context => maybe-frozen
 *
 * ┌──────────────────────────┐
 * │        Immutable         │───┐
 * └──────────────────────────┘   │
 *                                │    ┌─────────────────────────┐
 *                                ├───▶│         Frozen          │──┐
 * ┌──────────────────────────┐   │    └─────────────────────────┘  │
 * │          Frozen          │───┤                                 │  ┌─────────────────────────┐
 * └──────────────────────────┘   │                                 ├─▶│       MaybeFrozen       │
 *                                │    ┌─────────────────────────┐  │  └─────────────────────────┘
 *                                ├───▶│       MaybeFrozen       │──┘
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
 * Iterates over the given @param block, defining variables and
 * recording references on the @param state according to JS semantics.
 */
function inferBlock(
  env: Environment,

  state: InferenceState,
  block: BasicBlock
) {
  for (const phi of block.phis) {
    state.inferPhi(phi);
  }

  for (const instr of block.instructions) {
    const instrValue = instr.value;
    let effectKind: Effect | null = null;
    let lvalueEffect = Effect.Mutate;
    let valueKind: ValueKind;
    switch (instrValue.kind) {
      case "BinaryExpression": {
        valueKind = ValueKind.Immutable;
        effectKind = Effect.Read;
        break;
      }
      case "ArrayExpression": {
        valueKind = hasContextRefOperand(state, instrValue)
          ? ValueKind.Context
          : ValueKind.Mutable;
        effectKind = Effect.Capture;
        lvalueEffect = Effect.Store;
        break;
      }
      case "NewExpression": {
        valueKind = ValueKind.Mutable;
        effectKind = Effect.Mutate;
        break;
      }
      case "CallExpression": {
        valueKind = ValueKind.Mutable;
        effectKind = Effect.Mutate;
        const hook =
          instrValue.callee.identifier.type.kind === "Hook"
            ? instrValue.callee.identifier.type.definition
            : null;
        if (hook !== null) {
          effectKind = hook.effectKind;
          valueKind = hook.valueKind;
        }
        break;
      }
      case "ObjectExpression": {
        valueKind = hasContextRefOperand(state, instrValue)
          ? ValueKind.Context
          : ValueKind.Mutable;

        // Object construction captures but does not modify the key/property values
        effectKind = Effect.Capture;
        lvalueEffect = Effect.Store;
        break;
      }
      case "UnaryExpression": {
        valueKind = ValueKind.Immutable;
        effectKind = Effect.Read;
        break;
      }
      case "UnsupportedNode": {
        // TODO: handle other statement kinds
        valueKind = ValueKind.Mutable;
        break;
      }
      case "JsxExpression": {
        valueKind = ValueKind.Frozen;
        effectKind = Effect.Freeze;
        break;
      }
      case "JsxFragment": {
        valueKind = ValueKind.Frozen;
        effectKind = Effect.Freeze;
        break;
      }
      case "TaggedTemplateExpression": {
        valueKind = ValueKind.Mutable;
        effectKind = Effect.Mutate;
        break;
      }
      case "TemplateLiteral": {
        // template literal (with no tag function) always produces
        // an immutable string
        valueKind = ValueKind.Immutable;
        effectKind = Effect.Read;
        break;
      }
      case "LoadGlobal":
      case "JSXText":
      case "Primitive": {
        valueKind = ValueKind.Immutable;
        break;
      }
      case "FunctionExpression": {
        for (const operand of eachInstructionOperand(instr)) {
          state.reference(
            operand,
            operand.effect === Effect.Unknown ? Effect.Read : operand.effect
          );
        }
        state.initialize(instrValue, ValueKind.Mutable);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Store;
        continue;
      }
      case "PropertyCall": {
        if (!state.isDefined(instrValue.receiver)) {
          // TODO @josephsavona: improve handling of globals
          const value: InstructionValue = {
            kind: "Primitive",
            loc: instrValue.loc,
            value: undefined,
          };
          state.initialize(value, ValueKind.Frozen);
          state.define(instrValue.receiver, value);
        }

        state.reference(instrValue.receiver, Effect.Mutate);
        for (const arg of instrValue.args) {
          state.reference(arg, Effect.Mutate);
        }
        state.initialize(instrValue, ValueKind.Mutable);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Mutate;
        continue;
      }
      case "ComputedCall": {
        if (!state.isDefined(instrValue.receiver)) {
          // TODO @josephsavona: improve handling of globals
          const value: InstructionValue = {
            kind: "Primitive",
            loc: instrValue.loc,
            value: undefined,
          };
          state.initialize(value, ValueKind.Frozen);
          state.define(instrValue.receiver, value);
        }

        state.reference(instrValue.receiver, Effect.Mutate);
        state.reference(instrValue.property, Effect.Read);
        for (const arg of instrValue.args) {
          state.reference(arg, Effect.Mutate);
        }
        state.initialize(instrValue, ValueKind.Mutable);
        state.define(instr.lvalue, instrValue);
        instr.lvalue.effect = Effect.Mutate;
        continue;
      }
      case "PropertyStore": {
        const effect =
          state.kind(instrValue.object) === ValueKind.Context
            ? Effect.Mutate
            : Effect.Capture;
        state.reference(instrValue.value, effect);
        state.reference(instrValue.object, Effect.Store);

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continue;
      }
      case "PropertyLoad": {
        if (!state.isDefined(instrValue.object)) {
          // TODO @josephsavona: improve handling of globals
          const value: InstructionValue = {
            kind: "Primitive",
            loc: instrValue.loc,
            value: undefined,
          };
          state.initialize(value, ValueKind.Frozen);
          state.define(instrValue.object, value);
        }

        state.reference(instrValue.object, Effect.Read);
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.Mutate;
        state.initialize(instrValue, state.kind(instrValue.object));
        state.define(lvalue, instrValue);
        continue;
      }
      case "ComputedStore": {
        const effect =
          state.kind(instrValue.object) === ValueKind.Context
            ? Effect.Mutate
            : Effect.Capture;
        state.reference(instrValue.value, effect);
        state.reference(instrValue.property, Effect.Capture);
        state.reference(instrValue.object, Effect.Store);

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        continue;
      }
      case "ComputedLoad": {
        if (!state.isDefined(instrValue.object)) {
          // TODO @josephsavona: improve handling of globals
          const value: InstructionValue = {
            kind: "Primitive",
            loc: instrValue.loc,
            value: undefined,
          };
          state.initialize(value, ValueKind.Frozen);
          state.define(instrValue.object, value);
        }

        state.reference(instrValue.object, Effect.Read);
        state.reference(instrValue.property, Effect.Read);
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.Mutate;
        state.initialize(instrValue, state.kind(instrValue.object));
        state.define(lvalue, instrValue);
        continue;
      }
      case "TypeCastExpression": {
        // A type cast expression has no effect at runtime, so it's equivalent to a raw
        // identifier:
        // ```
        // x = (y: type)  // is equivalent to...
        // x = y
        // ```
        state.initialize(instrValue, state.kind(instrValue.value));
        state.reference(instrValue.value, Effect.Read);
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.Mutate;
        state.alias(lvalue, instrValue.value);
        continue;
      }
      case "LoadLocal": {
        state.reference(instrValue.place, Effect.Capture);
        const lvalue = instr.lvalue;
        lvalue.effect = Effect.Mutate;
        // direct aliasing: `a = b`;
        state.alias(lvalue, instrValue.place);
        continue;
      }
      case "StoreLocal": {
        const effect =
          state.isDefined(instrValue.lvalue.place) &&
          state.kind(instrValue.lvalue.place) === ValueKind.Context
            ? Effect.Mutate
            : Effect.Capture;
        state.reference(instrValue.value, effect);

        const lvalue = instr.lvalue;
        state.alias(lvalue, instrValue.value);
        lvalue.effect = Effect.Store;
        state.alias(instrValue.lvalue.place, instrValue.value);
        instrValue.lvalue.place.effect = Effect.Store;
        continue;
      }
      default: {
        assertExhaustive(instrValue, "Unexpected instruction kind");
      }
    }

    for (const operand of eachInstructionOperand(instr)) {
      invariant(
        effectKind != null,
        "effectKind must be set for instruction value `%s`",
        instrValue.kind
      );
      state.reference(operand, effectKind);
    }

    state.initialize(instrValue, valueKind);
    state.define(instr.lvalue, instrValue);
    instr.lvalue.effect = lvalueEffect;
  }

  const effect =
    block.terminal.kind === "return" || block.terminal.kind === "throw"
      ? Effect.Freeze
      : Effect.Read;
  for (const operand of eachTerminalOperand(block.terminal)) {
    state.reference(operand, effect);
  }
}

function hasContextRefOperand(
  state: InferenceState,
  instrValue: InstructionValue
) {
  for (const place of eachInstructionValueOperand(instrValue)) {
    if (state.isDefined(place) && state.kind(place) === ValueKind.Context) {
      return true;
    }
  }
  return false;
}
