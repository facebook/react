/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import {
  BasicBlock,
  BlockId,
  Capability,
  HIRFunction,
  IdentifierId,
  Instruction,
  InstructionValue,
  Place,
  Terminal,
} from "./HIR";
import { mapTerminalSuccessors } from "./HIRBuilder";
import { printMixedHIR } from "./PrintHIR";

/**
 * For every usage of a value in the given function, infers the capability or action
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
 * and iterates over the control flow graph. The inferred capability of reach reference is
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
export default function inferReferenceCapability(fn: HIRFunction) {
  // Initial environment contains function params
  // TODO: include module declarations here as well
  const initialEnvironment = Environment.empty();
  const id: Place = {
    kind: "Identifier",
    memberPath: null,
    value: fn.id as any,
    path: null as any, // TODO
    capability: Capability.Freeze,
  };
  const value: InstructionValue = {
    kind: "Primitive",
    path: null as any, // TODO
    value: undefined,
  };
  initialEnvironment.initialize(value, ValueKind.Frozen);
  initialEnvironment.define(id, value);

  for (const param of fn.params) {
    const place: Place = {
      kind: "Identifier",
      memberPath: null,
      value: param.value,
      path: null as any, // TODO
      capability: Capability.Freeze,
    };
    const value: InstructionValue = {
      kind: "Primitive",
      path: null as any, // TODO
      value: undefined,
    };
    initialEnvironment.initialize(value, ValueKind.Frozen);
    initialEnvironment.define(place, value);
  }

  // Map of blocks to the last (merged) incoming environment that was processed
  const environmentsByBlock: Map<BlockId, Environment> = new Map();

  // Multiple predecessors may be visited prior to reaching a given successor,
  // so track the list of incoming environments for each successor block.
  // These are merged when reaching that block again.
  const queuedEnvironments: Map<BlockId, Environment> = new Map();
  function queue(blockId: BlockId, environment: Environment) {
    let queuedEnvironment = queuedEnvironments.get(blockId);
    if (queuedEnvironment != null) {
      // merge the queued environments for this block
      environment = queuedEnvironment.merge(environment) ?? environment;
      queuedEnvironments.set(blockId, environment);
    } else {
      // this is the first queued environment for this block, see whether
      // there are changed relative to the last time it was processed.
      const prevEnvironment = environmentsByBlock.get(blockId);
      const nextEnvironment =
        prevEnvironment != null
          ? prevEnvironment.merge(environment)
          : environment;
      if (nextEnvironment != null) {
        queuedEnvironments.set(blockId, nextEnvironment);
      }
    }
  }
  queue(fn.body.entry, initialEnvironment);

  while (queuedEnvironments.size !== 0) {
    for (const [blockId, block] of fn.body.blocks) {
      const incomingEnvironment = queuedEnvironments.get(blockId);
      queuedEnvironments.delete(blockId);
      if (incomingEnvironment == null) {
        continue;
      }

      environmentsByBlock.set(blockId, incomingEnvironment);
      const environment = incomingEnvironment.clone();
      inferBlock(environment, block);

      // TODO: add a `forEachTerminalSuccessor` helper, we don't actually want the result
      // here
      const _ = mapTerminalSuccessors(
        block.terminal,
        (nextBlockId, isFallthrough) => {
          if (!isFallthrough) {
            queue(nextBlockId, environment);
          }
          return nextBlockId;
        }
      );
    }
  }
}

type QueueEntry = {
  blockId: BlockId;
  environment: Environment;
};

/**
 * Maintains a mapping of top-level variables to the kind of value they hold
 */
class Environment {
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

  static empty(): Environment {
    return new Environment(new Map(), new Map());
  }

  /**
   * (Re)initializes a @param value with its default @param kind.
   */
  initialize(
    value: InstructionValue,
    kind: ValueKind,
    instr: Instruction | null = null
  ) {
    invariant(
      value.kind !== "Identifier" || value.memberPath !== null,
      "Expected all top-level identifiers to be defined as variables, not values"
    );
    this.#values.set(value, kind);
  }

  /**
   * Lookup the kind of the given @param value.
   */
  kind(place: Place): ValueKind {
    const values = this.#variables.get(place.value.id);
    invariant(
      values != null,
      `Expected value kind to be initialized at '${String(place.path)}'`
    );
    let mergedKind: ValueKind | null = null;
    for (const value of values) {
      const kind = this.#values.get(value)!;
      mergedKind = mergedKind !== null ? mergeValues(mergedKind, kind) : kind;
    }
    invariant(mergedKind !== null, "Expected at least value");
    return mergedKind;
  }

  /**
   * Updates the value at @param place to point to the same value as @param value.
   */
  alias(place: Place, value: Place) {
    const values = this.#variables.get(value.value.id);
    invariant(
      values != null,
      `Expected value to be populated at '${String(value.path)}' in '${String(
        value.path.parentPath
      )}'`
    );
    this.#variables.set(place.value.id, new Set(values));
  }

  /**
   * Defines (initializing or updating) a variable with a specific kind of value.
   */
  define(place: Place, value: InstructionValue) {
    invariant(
      place.memberPath === null,
      "Expected a top-level identifier, not a member path"
    );
    invariant(
      this.#values.has(value),
      `Expected value to be initialized at '${String(value.path)}' in '${String(
        value.path?.parentPath
      )}'`
    );
    this.#variables.set(place.value.id, new Set([value]));
  }

  /**
   * Records that a given Place was accessed with the given kind and:
   * - Updates the capability of @param place based on the kind of value
   *   and the kind of reference (@param effectKind).
   * - Updates the value kind to reflect the effect of the reference.
   *
   * Notably, a mutable reference is downgraded to readonly if the
   * value unless the value is known to be mutable.
   *
   * Similarly, a freeze reference is converted to readonly if the
   * value is already frozen or is immutable.
   */
  reference(place: Place, effectKind: EffectKind) {
    const values = this.#variables.get(place.value.id);
    if (values === undefined) {
      place.capability =
        effectKind === EffectKind.Write
          ? Capability.Mutable
          : Capability.Readonly;
      return;
    }
    let capability: Capability | null = null;
    switch (effectKind) {
      case EffectKind.Freeze: {
        values.forEach((value) => {
          const valueKind = this.#values.get(value)!;
          if (
            valueKind === ValueKind.Mutable ||
            valueKind === ValueKind.MaybeFrozen
          ) {
            this.#values.set(value, ValueKind.Frozen);
            capability = Capability.Freeze;
          }
        });
        capability = capability ?? Capability.Readonly;
        break;
      }
      case EffectKind.Write: {
        let maybeFrozen = false;
        let maybeMutable = false;
        values.forEach((value) => {
          const valueKind = this.#values.get(value)!;
          if (
            valueKind === ValueKind.Frozen ||
            valueKind === ValueKind.MaybeFrozen
          ) {
            maybeFrozen = true;
          } else if (valueKind === ValueKind.Mutable) {
            maybeMutable = true;
          }
        });
        capability = maybeFrozen
          ? Capability.Readonly
          : maybeMutable
          ? Capability.Mutable
          : Capability.Readonly;
        break;
      }
      case EffectKind.Read: {
        capability = Capability.Readonly;
        break;
      }
      default: {
        assertExhaustive(
          effectKind,
          `Unexpected reference kind '${effectKind as any as string}'`
        );
      }
    }
    invariant(capability !== null, "Expected capability to be set");
    place.capability = capability;
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
  merge(other: Environment): Environment | null {
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
      return new Environment(
        nextValues ?? new Map(this.#values),
        nextVariables ?? new Map(this.#variables)
      );
    }
  }

  /**
   * Returns a copy of this environment.
   * TODO: consider using persistent data structures to make
   * clone cheaper.
   */
  clone(): Environment {
    return new Environment(new Map(this.#values), new Map(this.#variables));
  }

  /**
   * For debugging purposes, dumps the environment to a plain
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
 * - immutable | frozen => frozen
 * - frozen | mutable => maybe-frozen
 * - <any> | maybe-frozen => maybe-frozen
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
    } else {
      // mutable | immutable
      return ValueKind.Mutable;
    }
  } else {
    // frozen | immutable
    return ValueKind.Frozen;
  }
}

/**
 * Distinguish between different kinds of values relevant to inference purposes:
 * see the main docblock for the module for details.
 */
enum ValueKind {
  MaybeFrozen = "MaybeFrozen",
  Frozen = "Frozen",
  Immutable = "Immutable",
  Mutable = "Mutable",
}

/**
 * Distinguish between different kinds of references.
 */
enum EffectKind {
  Write = "Write",
  Read = "Read",
  Freeze = "Freeze",
}

/**
 * Iterates over the given @param block, defining variables and
 * recording references on the @param env according to JS semantics.
 */
function inferBlock(env: Environment, block: BasicBlock) {
  for (const instr of block.instructions) {
    const instrValue = instr.value;
    let valueKind: ValueKind;
    switch (instrValue.kind) {
      case "BinaryExpression": {
        valueKind = ValueKind.Immutable;
        env.reference(instrValue.left, EffectKind.Read);
        env.reference(instrValue.right, EffectKind.Read);
        break;
      }
      case "ArrayExpression": {
        valueKind = ValueKind.Mutable;
        for (const element of instrValue.elements) {
          env.reference(element, EffectKind.Read);
        }
        break;
      }
      case "NewExpression": {
        valueKind = ValueKind.Mutable;
        env.reference(instrValue.callee, EffectKind.Write);
        for (const arg of instrValue.args) {
          env.reference(arg, EffectKind.Write);
        }
        break;
      }
      case "CallExpression": {
        let effectKind = EffectKind.Write;
        valueKind = ValueKind.Mutable;
        const hook = parseHookCall(instrValue.callee);
        if (hook !== null) {
          effectKind = hook.effectKind;
          valueKind = hook.valueKind;
        }
        env.reference(instrValue.callee, effectKind);
        for (const arg of instrValue.args) {
          env.reference(arg, effectKind);
        }
        break;
      }
      case "ObjectExpression": {
        valueKind = ValueKind.Mutable;
        // Object construction captures but does not modify the key/property values
        if (instrValue.properties !== null) {
          for (const [_key, value] of Object.entries(instrValue.properties)) {
            env.reference(value, EffectKind.Read);
          }
        }
        break;
      }
      case "UnaryExpression": {
        // TODO check that value must be a primitive, or make conditional based on the operator
        valueKind = ValueKind.Immutable;
        env.reference(instrValue.value, EffectKind.Read);
        break;
      }
      case "OtherStatement": {
        // TODO: handle other statement kinds
        valueKind = ValueKind.Mutable;
        break;
      }
      case "JsxExpression": {
        valueKind = ValueKind.Frozen;
        env.reference(instrValue.tag, EffectKind.Freeze);
        for (const [_prop, value] of Object.entries(instrValue.props)) {
          env.reference(value, EffectKind.Freeze);
        }
        if (instrValue.children !== null) {
          for (const child of instrValue.children) {
            env.reference(child, EffectKind.Freeze);
          }
        }
        break;
      }
      case "JSXText":
      case "Primitive": {
        valueKind = ValueKind.Immutable;
        break;
      }
      case "Identifier": {
        env.reference(instrValue, EffectKind.Read);
        const lvalue = instr.lvalue;
        if (lvalue !== null) {
          lvalue.place.capability = Capability.Mutable;
          if (
            lvalue.place.memberPath === null &&
            instrValue.memberPath === null
          ) {
            // direct aliasing: `a = b`;
            env.alias(lvalue.place, instrValue);
          } else if (lvalue.place.memberPath === null) {
            // redefine lvalue: `a = b.c.d`
            env.initialize(instrValue, env.kind(instrValue));
            env.define(lvalue.place, instrValue);
          } else if (instrValue.memberPath === null) {
            // no-op: `a.b.c = d`
            env.reference(lvalue.place, EffectKind.Write);
          } else {
            // no-op: `a.b.c = d.e.f`
            env.reference(lvalue.place, EffectKind.Write);
          }
        }
        continue;
      }
      default: {
        assertExhaustive(instrValue, "Unexpected instruction kind");
      }
    }
    env.initialize(instrValue, valueKind, instr);
    if (instr.lvalue !== null) {
      if (instr.lvalue.place.memberPath === null) {
        env.define(instr.lvalue.place, instrValue);
      } else {
        env.reference(instr.lvalue.place, EffectKind.Write);
      }
      instr.lvalue.place.capability = Capability.Mutable;
    }
  }
  switch (block.terminal.kind) {
    case "throw": {
      env.reference(block.terminal.value, EffectKind.Freeze);
      break;
    }
    case "return": {
      if (block.terminal.value !== null) {
        env.reference(block.terminal.value, EffectKind.Freeze);
      }
      break;
    }
    case "if": {
      env.reference(block.terminal.test, EffectKind.Read);
      break;
    }
    case "switch": {
      for (const case_ of block.terminal.cases) {
        if (case_.test !== null) {
          env.reference(case_.test, EffectKind.Read);
        }
      }
      break;
    }
    case "goto": {
      break;
    }
    default: {
      assertExhaustive(
        block.terminal,
        `Unexpected terminal kind '${(block.terminal as any as Terminal).kind}'`
      );
    }
  }
}

const GLOBALS: Map<string, ValueKind> = new Map([
  ["Map", ValueKind.Mutable],
  ["Set", ValueKind.Mutable],
  ["Math.max", ValueKind.Immutable],
]);

const HOOKS: Map<string, Hook> = new Map([
  [
    "useState",
    {
      kind: "State",
      effectKind: EffectKind.Freeze,
      valueKind: ValueKind.Frozen,
    },
  ],
  [
    "useRef",
    {
      kind: "Ref",
      effectKind: EffectKind.Read,
      valueKind: ValueKind.Mutable,
    },
  ],
]);

type HookKind = { kind: "State" } | { kind: "Ref" } | { kind: "Custom" };
type Hook = HookKind & { effectKind: EffectKind; valueKind: ValueKind };

function parseHookCall(place: Place): Hook | null {
  if (place.memberPath !== null) {
    // Hook calls must be statically resolved
    return null;
  }
  const name = place.value.name;
  if (name === null || !name.match(/^_?use/)) {
    return null;
  }
  const hook = HOOKS.get(name);
  if (hook != null) {
    return hook;
  }
  return {
    kind: "Custom",
    effectKind: EffectKind.Freeze,
    valueKind: ValueKind.Frozen,
  };
}
