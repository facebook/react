/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { assertExhaustive } from "../Common/utils";
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
import { printMixedHIR, printPlace } from "./PrintHIR";

const HOOKS: Map<string, Hook> = new Map([
  ["useState", { kind: "State", capability: Capability.Frozen }],
  ["useRef", { kind: "Ref", capability: Capability.Frozen }],
]);

type HookKind = { kind: "State" } | { kind: "Ref" } | { kind: "Custom" };
type Hook = HookKind & { capability: Capability };

/**
 * For every usage of a value, infers whether the value is accessed as frozen, mutable,
 * or readonly:
 * - Frozen: the value is known to be deeply immutable. This usage cannot alter the value,
 *     and the value cannot change after this usage. The usage can therefore safely memoize
 *     based on the value.
 * - Mutable: the value may be modified by this or a subsequent usage.
 * - Readonly: the value is not modified by this or any subsequent usage, but was previously
 *    mutable. Thus the first usage of a value as readonly (after a previous mutable usage)
 *    is a point at which the value could safely frozen.
 *
 * In general usages default to be inferred as readonly (for operations that read) or mutable
 * (for operations that may write). Usages can only be inferred as frozen when:
 * - The value is derived from a reactive input: props, a hook argument. Derived here means
 *   that the value is itself a reactive input (`props`) or statically known to be extracted
 *   purely from a reactive input (`props.a`, `props.a[1]` etc).
 * - The value is "moved" into a reactive ouput, ie is captured into a component/hook return
 *   value.
 * - The value is known to be a primitive (boolean, number, string, null, or undefined). This
 *   is only the case when the value is a constant primitive *or* is the result of an
 *   operation that, under JS semantics, must produce a primitive. Examples are binary
 *   expressions.
 *
 * ## Algorithm
 * Fixpoint iteration of the CFG to construct use-use chains (graphs) in which nodes
 * are usages of a particular value and the required capability (frozen/read/write),
 * and each "usage" node points to predecessor node(s). Iteration stops once no new
 * edges/nodes need to be added to the graph.
 *
 * After construction, walk the graph to propagate frozenness forward and mutability
 * backward:
 * - If a usage of a value is frozen, then any subsequent usage of that value must be
 *   frozen as well. Flow the frozenness forward through the graph, following only
 *   use chains (outoing edges, but not captures).
 * - If a usage of a vale is mutable, then any prior readonly references of that value
 *   must be marked as mutable as well (since there is a subsequent mutation). Again,
 *   usages only remain readonly if there is no subsequent mutation.
 * - Finally, any value that is *initialized* as readonly and never modified (ie, that is
 *   still readonly in the graph) can be marked frozen (and all of its usages as frozen),
 *   since it is never ever modified.
 */
export default function inferLifetimes(fn: HIRFunction): Map<Place, Vertex> {
  const graph = UseGraph.empty();
  for (const param of fn.params) {
    const place: Place = {
      kind: "Identifier",
      memberPath: null,
      value: param,
      path: null as any, // TODO
      capability: Capability.Frozen,
    };
    graph.init(place, null);
  }

  const queue: Array<QueueEntry> = [{ block: fn.body.entry, graph }];
  const blockMemory: Map<BlockId, UseGraph> = new Map();
  while (queue.length !== 0) {
    const { block: blockId, graph: inputGraph } = queue.shift()!;
    const prevGraph = blockMemory.get(blockId);
    let nextGraph = null;
    if (prevGraph == null) {
      blockMemory.set(blockId, inputGraph);
      nextGraph = inputGraph.snapshot();
    } else {
      const merged = prevGraph.snapshot();
      const hasChanges = merged.merge(inputGraph);
      if (!hasChanges) {
        continue;
      }
      blockMemory.set(blockId, merged);
      nextGraph = prevGraph.snapshot();
    }

    const block = fn.body.blocks.get(blockId)!;
    inferBlock(nextGraph, block);

    const terminal = block.terminal;
    switch (terminal.kind) {
      case "throw": {
        nextGraph.reference(terminal.value, terminal, Capability.Frozen);
        break;
      }
      case "return": {
        if (terminal.value !== null) {
          nextGraph.reference(terminal.value, terminal, Capability.Frozen);
        }
        break;
      }
      case "goto": {
        queue.push({ block: terminal.block, graph: nextGraph });
        break;
      }
      case "if": {
        nextGraph.reference(terminal.test, terminal, Capability.Readonly);
        queue.push({ block: terminal.consequent, graph: nextGraph });
        queue.push({ block: terminal.alternate, graph: nextGraph });
        break;
      }
      case "switch": {
        nextGraph.reference(terminal.test, terminal, Capability.Readonly);
        for (const case_ of terminal.cases) {
          if (case_.test !== null) {
            nextGraph.reference(case_.test, terminal, Capability.Readonly);
          }
          queue.push({ block: case_.block, graph: nextGraph.snapshot() });
        }
        break;
      }
      default: {
        assertExhaustive(terminal, "Unexpected terminal kind");
      }
    }
  }

  // perform inference over the constructed graph and return it
  return analyzeGraph(graph);
}

type QueueEntry = {
  block: BlockId;
  graph: UseGraph;
};

function analyzeGraph(graph: UseGraph): Map<Place, Vertex> {
  const vertices = graph.build();
  let epoch = 0;

  // First flow frozen values forward through the graph
  for (const vertex of vertices.values()) {
    if (vertex.place.capability === Capability.Frozen) {
      flowFrozennessForwards(vertex, epoch++);
    }
  }
  // Then flow mutability backward through the graph
  for (const vertex of vertices.values()) {
    if (vertex.place.capability === Capability.Mutable) {
      flowMutabilityBackwards(vertex, epoch++);
    }
  }
  // Finally, any *entry* nodes that are readonly are now known to never be mutated,
  // so convert them to frozen (and flow that frozenness forward)
  for (const vertex of vertices.values()) {
    invariant(
      vertex.place.capability !== Capability.Unknown,
      "Expected capability to have been inferred as frozen, readonly, or mutable"
    );
    if (
      vertex.place.capability === Capability.Readonly &&
      vertex.incoming.size === 0
    ) {
      flowFrozennessForwards(vertex, epoch);
    }
  }
  return vertices;
}

/**
 * Once a value is known to be frozen, all usages forward of that point must be frozen too.
 */
function flowFrozennessForwards(vertex: Vertex, epoch: number) {
  if (vertex.epoch === epoch) {
    return;
  }
  vertex.epoch = epoch;
  vertex.place.capability = Capability.Frozen;
  for (const outgoing of vertex.outgoing) {
    flowFrozennessForwards(outgoing, epoch);
  }
}

/**
 * If a value is known to be mutable, any previous readonly references must be mutable too.
 */
function flowMutabilityBackwards(vertex: Vertex, epoch: number) {
  if (vertex.epoch === epoch) {
    return;
  }
  vertex.epoch = epoch;
  if (vertex.place.capability === Capability.Frozen) {
    return;
  }
  vertex.place.capability = Capability.Mutable;
  for (const incoming of vertex.incoming) {
    flowMutabilityBackwards(incoming, epoch);
  }
  for (const [id, capture] of vertex.captures) {
    flowMutabilityBackwards(capture, epoch);
  }
}

function inferBlock(graph: UseGraph, block: BasicBlock) {
  for (const instr of block.instructions) {
    if (instr.lvalue !== null) {
      if (instr.lvalue.place.memberPath == null) {
        graph.init(instr.lvalue.place, instr);
      } else {
        graph.reference(instr.lvalue.place, instr, Capability.Mutable);
      }
    }
    const instrValue = instr.value;
    let valueCapability = Capability.Readonly;
    switch (instrValue.kind) {
      case "BinaryExpression": {
        valueCapability = Capability.Frozen;
        graph.reference(instrValue.left, instrValue, Capability.Readonly);
        graph.reference(instrValue.right, instrValue, Capability.Readonly);
        break;
      }
      case "ArrayExpression": {
        for (const element of instrValue.elements) {
          graph.reference(element, instrValue, Capability.Readonly);
          if (instr.lvalue !== null) {
            graph.capture(instr.lvalue.place, instr, element);
          }
        }
        break;
      }
      case "NewExpression": {
        graph.reference(instrValue.callee, instrValue, Capability.Mutable);
        let prevArg: Place | null = null;
        for (const arg of instrValue.args) {
          graph.reference(arg, instrValue, Capability.Mutable);
          if (instr.lvalue !== null) {
            graph.capture(instr.lvalue.place, instr, arg);
          }
          if (prevArg !== null) {
            graph.capture(prevArg, instr, arg);
          }
          prevArg = arg;
        }
        break;
      }
      case "CallExpression": {
        let capability = Capability.Mutable;
        const hook = parseHookCall(instrValue.callee);
        if (hook !== null) {
          capability = hook.capability;
          valueCapability = hook.capability;
        }
        graph.reference(instrValue.callee, instrValue, capability);
        let prevArg: Place | null = null;
        for (const arg of instrValue.args) {
          graph.reference(arg, instrValue, capability);
          if (instr.lvalue !== null) {
            graph.capture(instr.lvalue.place, instr, arg);
          }
          if (prevArg !== null) {
            graph.capture(prevArg, instr, arg);
          }
          prevArg = arg;
        }
        break;
      }
      case "ObjectExpression": {
        // Object construction captures but does not modify the key/property values
        if (instrValue.properties !== null) {
          for (const [_key, value] of Object.entries(instrValue.properties)) {
            graph.reference(value, instrValue, Capability.Readonly);
            if (instr.lvalue !== null) {
              graph.capture(instr.lvalue.place, instr, value);
            }
          }
        }
        break;
      }
      case "UnaryExpression": {
        valueCapability = Capability.Frozen; // TODO check that value must be a primitive, or make conditional based on the operator
        graph.reference(instrValue.value, instrValue, Capability.Readonly);
        break;
      }
      case "OtherStatement": {
        // TODO: handle other statement kinds
        break;
      }
      case "JsxExpression": {
        graph.reference(instrValue.tag, instrValue, Capability.Readonly);
        for (const [_prop, value] of Object.entries(instrValue.props)) {
          graph.reference(value, instrValue, Capability.Readonly);
          if (instr.lvalue !== null) {
            graph.capture(instr.lvalue.place, instr, value);
          }
        }
        if (instrValue.children !== null) {
          for (const child of instrValue.children) {
            graph.reference(child, instrValue, Capability.Readonly);
            if (instr.lvalue !== null) {
              graph.capture(instr.lvalue.place, instr, child);
            }
          }
        }
        break;
      }
      case "JSXText":
      case "Primitive": {
        valueCapability = Capability.Frozen;
        break;
      }
      case "Identifier": {
        graph.reference(instrValue, instrValue, Capability.Readonly);
        if (instr.lvalue !== null) {
          graph.assign(instr.lvalue.place, instr, instrValue);
        }
        valueCapability = instrValue.capability;
        break;
      }
      default: {
        assertExhaustive(instrValue, "Unexpected instruction kind");
      }
    }
    if (instr.lvalue !== null) {
      instr.lvalue.place.capability = valueCapability;
    }
  }
}

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
  return { kind: "Custom", capability: Capability.Frozen };
}

/**
 * A graph of usages of references within a program.
 */
class UseGraph {
  /**
   * Represents the last usage for each top-level identifier (by IdentifierId)
   * in the program. So after `let x = []`, there will be an entry mapping
   * `x` to a vertex. A subsequent `x.y` reference will update the mapping
   * for `x` to point to a new vertex, with the previous `let x = []` as
   * an incoming edge. Note again that vertices are always created based
   * on the top-level identifier id and ignore member paths.
   */
  #nodes: Map<IdentifierId, Vertex>;

  /**
   * A mapping of places to vertices, allowing repeated operations against
   * the same place (eg referencing, assigning, etc) to update the single
   * vertex for that place.
   *
   * NOTE: this algorithm and data structure relies on `Place` instances
   * being unique, hence BuildHIR is careful to clone Place instances rather
   * than use structural sharing.
   */
  #vertices: Map<Place, Vertex>;

  static empty(): UseGraph {
    return new UseGraph(new Map(), new Map());
  }

  constructor(nodes: Map<IdentifierId, Vertex>, vertices: Map<Place, Vertex>) {
    this.#nodes = nodes;
    this.#vertices = vertices;
  }

  /**
   * Lookup the current vertex for a given identifier.
   */
  lookup(id: IdentifierId): Vertex | null {
    return this.#nodes.get(id) ?? null;
  }

  /**
   * Represents assignment of a value to a Place. Unlike with `reference()`,
   * this does *not* establish an edge between this usage of the place and
   * previous usages, because the value is not the same.
   */
  init(place: Place, instr: Instruction | null) {
    let vertex = this.#vertices.get(place);
    if (vertex == null) {
      vertex = new Vertex(place, instr);
      this.#vertices.set(place, vertex);
    }
    this.#nodes.set(place.value.id, vertex);
  }

  /**
   * Represents assigning a (new) value to @param target via the given @param instr,
   * with @param value as the value being assigned.
   *
   * This breaks the use chain, such that this and subsequent usages of @param target
   * are not associated to previous usages. This replicates SSA semantics, conceptually
   * @param target is a new place now.
   */
  assign(target: Place, instr: Instruction, value: Place) {
    this.init(target, instr);
    if (value.capability === Capability.Frozen) {
      target.capability = Capability.Frozen;
    }
    this.capture(target, instr, value);
  }

  /**
   * Represents data flow in which two places capture references to each other,
   * such that a mutation of one place may affect data accessible via the other
   * place or vice versa. This includes assignment (`x = y`) but also things like
   * array or object construction, where `x = [y]` means that modifying either
   * `x` or `y` _could_ be visible through either refernece (eg `x[0].foo = ...`)
   * would modify `y`.
   */
  capture(target: Place, instr: Instruction, value: Place) {
    const targetVertex = this.#vertices.get(target)!;
    const valueVertex = this.#vertices.get(value)!;

    if (
      targetVertex.place.capability === Capability.Frozen ||
      valueVertex.place.capability === Capability.Frozen
    ) {
      return;
    }

    targetVertex.captures.set(value.value.id, valueVertex);
    valueVertex.captures.set(target.value.id, targetVertex);
  }

  /**
   * Represents a reference (usage of) a Place. This establishes an edge
   * with this usage and the previous usage
   */
  reference(
    place: Place,
    instr: Instruction | InstructionValue | Terminal,
    capability: Capability
  ) {
    place.capability = capability;
    let vertex = this.#vertices.get(place);
    if (vertex == null) {
      vertex = new Vertex(place, instr);
      this.#vertices.set(place, vertex);
    }

    let prev = this.#nodes.get(place.value.id);
    if (prev != null) {
      vertex.incoming.add(prev);
      prev.outgoing.add(vertex);

      for (const [id, _vertex] of prev.captures) {
        const capture = this.#nodes.get(id)!;
        if (capture.captures.has(place.value.id)) {
          vertex.captures.set(id, capture);
        }
      }

      if (prev.place.capability === Capability.Frozen) {
        vertex.place.capability = Capability.Frozen;
      }
    }
    this.#nodes.set(place.value.id, vertex);
  }

  /**
   * Returns a snapshot of the graph that can be used to represent different
   * control flows paths, and which later may merge together (see `merge()`).
   *
   * The snapshot contains a distinct mapping of the most recent vertex per
   * identifier, but *shares* the mapping of places to vertices (vertices are
   * stable across different control flow paths).
   *
   * The intent is that fixpoint iteration relies on updating the `#nodes`
   * mapping of identifiers to most recent vertex, but the underlying graph
   * of vertices is intended to be shared across control flow paths.
   */
  snapshot(): UseGraph {
    const nodes = new Map(this.#nodes);
    return new UseGraph(nodes, this.#vertices);
  }

  /**
   * Giver some @param other use graph that shares an ancestor with @param this,
   * merges the graphs together and returns whether there were any changes to
   * the underlying edges (if any new edges were added).
   *
   * Note that @param this and @param other must share an ancestor, ie one must
   * be derived from a `snapshot()` of the other, or they must both be derived
   * from a `snapshot()` of the same instance.
   */
  merge(other: UseGraph): boolean {
    let hasChange = false;
    for (const [id, newIncoming] of other.#nodes) {
      const prevIncoming = this.#nodes.get(id);
      if (prevIncoming == null || newIncoming === prevIncoming) {
        continue;
      }
      for (const prevOutgoing of prevIncoming.outgoing) {
        hasChange =
          hasChange ||
          !prevOutgoing.incoming.has(newIncoming) ||
          !newIncoming.outgoing.has(prevOutgoing);
        prevOutgoing.incoming.add(newIncoming);
        newIncoming.outgoing.add(prevOutgoing);
      }
    }
    return hasChange;
  }

  /**
   * Returns the mapping of places to vertices.
   */
  build(): Map<Place, Vertex> {
    return this.#vertices;
  }
}

/**
 * Represents a distinct usage of a `Place` within a program. Note that
 * vertices are only created for top-level identifiers, not for points
 * within an object. So both `x` and `x.y` create vertices for `x`,
 * though this is enforced by the _construction_ of vertices in UseGraph,
 * not the implementation of Vertex itself.
 */
class Vertex {
  /**
   * A set of vertices whose values are captured into this vertex, keyed
   * by the identifier of the captured value. This represents any form
   * of capturing, including:
   * - direct assignment: `x = y`, `x.y = y`, `x[0] = y` all captures
   *   x into y and vice-versa.
   * - composition of objects into arrays, object, jsx: `<foo>{x}{y}</div>`,
   *   `{k1: x, k2: y}`, and `[x, y]` all capture x and y into the outer
   *   value (jsx, object, array, respectively).
   * - Mutation that could cause values to take references into each other:
   *   `foo(x, y)` could modify x and/or y in a way that they are assigned
   *   into each other (eg it could internally do `x.y = y`, `y.x = x` etc).
   *
   * Note that the representation only stores *one* vertex for each identifier,
   * so eg `y.x = x` the `y` vertex can only store a capture of *one* vertex
   * for `x`. If there are multiple potentially prior usages of x when this
   * occurs, we have to take care that they are both represnted as captured:
   *
   * ```javascript
   * let x;
   * if (cond) {
   *   x = [1];
   * } else {
   *   x = [2]
   * }
   * y = x;
   * ```
   * The final line must reflect that y captures *either* of the two possible
   * values of `x`. This is achieved by *first* using `x`, *then* capturing.
   * The usage will create a single new `x` vertex in the final scope, to which
   * there are two incoming edges. Then the capture of `x` into `y` references
   * that single x vertex with two incoming edges. Thus the data model can capture
   * this case, but the order of construction is important.
   *
   * The result is a graph such as:
   *
   * [x @ let x] -> [ x @ x = [1] ] -> [ x @ y = x]
   *           └--> [ x @ x = [2] ] ---┘    ↑
   *                                        | capture
   *                                        ↓
   *                                   [ y @ y - x]
   *
   * Note that it's possible to walk from `y` to both of the possible x values.
   */
  captures: Map<IdentifierId, Vertex> = new Map();

  /**
   * the set of vertices where *this* place was previously referenced
   */
  incoming: Set<Vertex> = new Set();

  /**
   * the set of vertices where *this* place is subseqently referenced
   */
  outgoing: Set<Vertex> = new Set();

  /**
   * The place that is using the value.
   */
  place: Place;

  /**
   * The instruction where the reference occurs (for debugging)
   */
  instr: Instruction | InstructionValue | Terminal | null;

  /**
   * The last epoch in which this vertex was visited. This is used during
   * data-flow analysis post construction of the graph to ensure termination
   * by avoiding revisiting the same nodes in a given pass.
   */
  epoch: number | null = null;

  constructor(
    place: Place,
    instr: Instruction | InstructionValue | Terminal | null
  ) {
    this.place = place;
    this.instr = instr;
  }
}

/**
 * Prints the graph into GraphViz DOT format.
 * https://graphviz.org/doc/info/lang.html
 */
export function printGraph(vertices: Map<Place, Vertex>): string {
  const output = [];

  // Maps vertices to short string names. Note that multiple vertex instances
  // can share the same Place, so we can't use the place (identifier/path etc).
  // Instead we create an auto-incrementing index.
  const indices: Map<Vertex, string> = new Map();
  function identify(vertex: Vertex): string {
    let id = indices.get(vertex);
    if (id == null) {
      id = `v${indices.size}`;
      indices.set(vertex, id);
    }
    return id;
  }

  for (const [place, vertex] of vertices) {
    const vertexId = identify(vertex);
    output.push(
      `${vertexId} [ label="${vertexId} (${printPlace(vertex.place)} @ ${
        vertex.instr
          ? printMixedHIR(vertex.instr).replaceAll('"', '\\"')
          : "<no-instr>"
      })", shape="box" ]`
    );
    for (const outgoing of vertex.outgoing) {
      const outgoingId = identify(outgoing);
      output.push(`${vertexId} -> ${outgoingId}`);
    }
    for (const [id, capture] of vertex.captures) {
      const captureId = identify(capture);
      output.push(`${captureId} -> ${vertexId} [ label="capture" ]`);
    }
  }
  const lines = output.map((line) => "  " + line);
  lines.unshift("digraph InferMutability {");
  lines.push("}");
  return lines.join("\n");
}
