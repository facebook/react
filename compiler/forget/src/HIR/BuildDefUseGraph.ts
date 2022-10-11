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
import { printMixedHIR, printPlace } from "./PrintHIR";

const HOOKS: Map<string, Hook> = new Map([
  ["useState", { kind: "State", capability: Capability.Freeze }],
  ["useRef", { kind: "Ref", capability: Capability.Freeze }],
]);

type HookKind = { kind: "State" } | { kind: "Ref" } | { kind: "Custom" };
type Hook = HookKind & { capability: Capability };

/**
 * For every usage of a value in the given function, infers whether that usage
 * is frozen, readonly, or mutable:
 * - frozen: the value is known to be "owned" by React and is therefore permanently
 *   and transitively immutable.
 * - readonly: the value is not frozen, but this usage of the value does not modify it.
 *   the value may be mutated by a subsequent reference. Examples include referencing
 *   the operands of a binary expression, or referencing the items/properties of an
 *   array or object literal.
 * - mutable: the value is not frozen and this usage *may* modify it. Examples include
 *   passing a value to as a function argument or assigning into an object.
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
 * ## Algorithm
 *
 * The algorithm creates a "use-use" graph in which each usage of a variable links to
 * the previous (incoming) and subsequent (outgoing) usages of that variable. The primary
 * purpose of this graph is to perform inference of usages that are frozen vs not, including
 * accounting for control-flow and reassignment, and to update the input *in place* to
 * annotate `Place` with the appropriate capability. The set of vertexs is returned for
 * debugging purposes.
 *
 * - First create a mapping of the first and last usages of each top-level identifier
 *   in each block, in isolation (ie without considering control-flow paths between
 *   blocks).
 * - Then iterate over the blocks in control-flow order and link the last usage of
 *   identifiers in predecssor blocks with the first usage in successor blocks.
 * - Then find all vertices corresponding to frozen usage of a value, and propagate
 *   that "frozenness" forward to all subsequent usages of that value.
 */
export default function buildDefUseGraph(fn: HIRFunction): Array<Vertex> {
  const graph = new UseGraph();

  const blockResults: Map<BlockId, BlockResult> = new Map();
  for (const [blockId, block] of fn.body.blocks) {
    const blockResult = buildInputsOutputsForBlock(graph, block);
    blockResults.set(blockId, blockResult);
  }

  const preambleBuilder = new BlockResultBuilder(graph);
  for (const param of fn.params) {
    const place: Place = {
      kind: "Identifier",
      memberPath: null,
      value: param,
      path: null as any, // TODO
      capability: Capability.Freeze,
    };
    preambleBuilder.init(place, null, true);
  }
  const preambleResult = preambleBuilder.build();

  // Iterate over the CFG linking outputs of predecssor blocks to the inputs
  // of successor blocks, stopping once all links have been established.
  const queue: Array<{
    blockId: BlockId;
    prevResult: BlockResult;
  }> = [{ blockId: fn.body.entry, prevResult: preambleResult }];
  while (queue.length !== 0) {
    const { blockId, prevResult } = queue.shift()!;

    // Link the previous block's outputs to the next block's inputs
    const blockResult = blockResults.get(blockId)!;
    const hasChange = linkPreviousNextBlock(graph, prevResult, blockResult);

    // If there were changes to this block's outgoing edges, update any
    // successor blocks
    if (hasChange || blockId === fn.body.entry) {
      const block = fn.body.blocks.get(blockId)!;
      // TODO: add a forEachSuccessor helper, this maps the terminal unnecessarily
      const _ = mapTerminalSuccessors(
        block.terminal,
        (blockId, isFallthrough) => {
          if (!isFallthrough) {
            queue.push({ blockId, prevResult: blockResult });
          }
          return blockId;
        }
      );
    }
  }
  const vertices = graph.build();
  for (const vertex of vertices) {
    invariant(
      vertex.place === null || vertex.place.capability !== Capability.Unknown,
      "Expected all vertices to have a capability inferred"
    );

    // Vertices derived from a frozen value are also frozen
    if (
      vertex.place !== null &&
      vertex.place.capability === Capability.Freeze
    ) {
      flowFrozennessForwards(vertex, 0);
    }
    // Join nodes are created before we know if they will be consumed,
    // prune join nodes without any outgoing edges to aid visualization.
    // note that this is not required for correctness.
    if (vertex.place === null && vertex.outgoing.size === 0) {
      for (const incoming of vertex.incoming) {
        incoming.outgoing.delete(vertex);
      }
      vertex.incoming.clear();
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
  if (vertex.place !== null) {
    vertex.place.capability = Capability.Freeze;
  }
  for (const outgoing of vertex.outgoing) {
    flowFrozennessForwards(outgoing, epoch);
  }
}

/**
 * Link the last usages from a predecessor block to the first usages in a successor block,
 * and propagate any values used in the predecessor but _unused_ in the successor.
 */
function linkPreviousNextBlock(
  graph: UseGraph,
  prevBlock: BlockResult,
  nextBlock: BlockResult
): boolean {
  // are there any changes to the *outgoing* edges of `nextBlock`?
  let hasChanges = false;

  // for each first usage of next block, link it to last usage from prev block.
  for (const [id, nextVertex] of nextBlock.firstUsage) {
    if (nextVertex.isReassignment) {
      // nextVertex was a full reassignment, do not attach an edge.
      continue;
    }
    const prevVertex = prevBlock.lastUsage.get(id);
    if (prevVertex != null && prevVertex !== nextVertex) {
      // Note: don't update hasChanges here bc these do not affect the *outgoing* edges
      prevVertex.outgoing.add(nextVertex);
      nextVertex.incoming.add(prevVertex);
    }
  }
  // for each last usage in the prev block that was not already linked in the above
  // loop, add an outgoing edge to pass-through the data. the value may be used by
  // a later block.
  for (const [id, prevVertex] of prevBlock.lastUsage) {
    if (nextBlock.firstUsage.has(id)) {
      // already handled in the above loop
      continue;
    }
    const nextVertex = nextBlock.lastUsage.get(id);
    if (nextVertex == null) {
      // First time propagating a value for this id: use the prev vertex from
      // the predecessor as the output of the successor
      hasChanges = true;
      nextBlock.lastUsage.set(id, prevVertex);
    } else if (nextVertex === prevVertex) {
      // already propagated
      continue;
    } else {
      let joinVertex;
      if (nextVertex.place === null) {
        // A join vertex was already created, link the successor value to it
        joinVertex = nextVertex;
      } else {
        // A normal vertex was propagated through on the previous visit, but
        // now there is a different value that needs to be propagated through.
        // swap the node for a "join" vertex, adding the previous node as an
        // input to that node.
        joinVertex = graph.join();
        nextVertex.outgoing.add(joinVertex);
        joinVertex.incoming.add(nextVertex);
        nextBlock.lastUsage.set(id, joinVertex);
      }
      // the incoming node may itself be a join vertex, add its inputs to
      // avoid linking join vertices to other join vertices.
      if (prevVertex.place === null) {
        for (const prev of prevVertex.incoming) {
          hasChanges =
            hasChanges ||
            !joinVertex.incoming.has(prev) ||
            !prev.outgoing.has(joinVertex);
          joinVertex.incoming.add(prev);
          prev.outgoing.add(joinVertex);
        }
      } else {
        hasChanges =
          hasChanges ||
          !joinVertex.incoming.has(prevVertex) ||
          !prevVertex.outgoing.has(joinVertex);
        joinVertex.incoming.add(prevVertex);
        prevVertex.outgoing.add(joinVertex);
      }
    }
  }
  return hasChanges;
}

/**
 * Iterates over a single basic block and constructs a mapping of the first and last usages
 * of each Place referenced in that block.
 */
function buildInputsOutputsForBlock(
  graph: UseGraph,
  block: BasicBlock
): BlockResult {
  const builder = new BlockResultBuilder(graph);

  for (const instr of block.instructions) {
    const instrValue = instr.value;
    let valueCapability = Capability.Readonly;
    switch (instrValue.kind) {
      case "BinaryExpression": {
        valueCapability = Capability.Freeze;
        builder.reference(instrValue.left, instrValue, Capability.Readonly);
        builder.reference(instrValue.right, instrValue, Capability.Readonly);
        break;
      }
      case "ArrayExpression": {
        for (const element of instrValue.elements) {
          builder.reference(element, instrValue, Capability.Readonly);
        }
        break;
      }
      case "NewExpression": {
        builder.reference(instrValue.callee, instrValue, Capability.Mutable);
        for (const arg of instrValue.args) {
          builder.reference(arg, instrValue, Capability.Mutable);
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
        builder.reference(instrValue.callee, instrValue, capability);
        for (const arg of instrValue.args) {
          builder.reference(arg, instrValue, capability);
        }
        break;
      }
      case "ObjectExpression": {
        // Object construction captures but does not modify the key/property values
        if (instrValue.properties !== null) {
          for (const [_key, value] of Object.entries(instrValue.properties)) {
            builder.reference(value, instrValue, Capability.Readonly);
          }
        }
        break;
      }
      case "UnaryExpression": {
        valueCapability = Capability.Freeze; // TODO check that value must be a primitive, or make conditional based on the operator
        builder.reference(instrValue.value, instrValue, Capability.Readonly);
        break;
      }
      case "OtherStatement": {
        // TODO: handle other statement kinds
        break;
      }
      case "JsxExpression": {
        builder.reference(instrValue.tag, instrValue, Capability.Freeze);
        for (const [_prop, value] of Object.entries(instrValue.props)) {
          builder.reference(value, instrValue, Capability.Freeze);
        }
        if (instrValue.children !== null) {
          for (const child of instrValue.children) {
            builder.reference(child, instrValue, Capability.Freeze);
          }
        }
        break;
      }
      case "JSXText":
      case "Primitive": {
        valueCapability = Capability.Readonly;
        break;
      }
      case "Identifier": {
        builder.reference(instrValue, instrValue, Capability.Readonly);
        valueCapability = instrValue.capability;
        if (instr.lvalue !== null && instr.lvalue.place.memberPath === null) {
          builder.assign(instr.lvalue.place, instr, instrValue);
          instr.lvalue.place.capability = valueCapability;
          continue;
        }
        break;
      }
      default: {
        assertExhaustive(instrValue, "Unexpected instruction kind");
      }
    }
    if (instr.lvalue !== null) {
      if (instr.lvalue.place.memberPath == null) {
        builder.init(instr.lvalue.place, instr, true);
        instr.lvalue.place.capability = valueCapability;
      } else {
        builder.reference(instr.lvalue.place, instr, valueCapability);
      }
    }
  }
  switch (block.terminal.kind) {
    case "throw": {
      builder.reference(
        block.terminal.value,
        block.terminal,
        Capability.Freeze
      );
      break;
    }
    case "return": {
      if (block.terminal.value !== null) {
        builder.reference(
          block.terminal.value,
          block.terminal,
          Capability.Freeze
        );
      }
      break;
    }
    case "if": {
      builder.reference(
        block.terminal.test,
        block.terminal,
        Capability.Readonly
      );
      break;
    }
    case "switch": {
      builder.reference(
        block.terminal.test,
        block.terminal,
        Capability.Readonly
      );
      for (const case_ of block.terminal.cases) {
        if (case_.test !== null) {
          builder.reference(case_.test, block.terminal, Capability.Readonly);
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

  return builder.build();
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
  return { kind: "Custom", capability: Capability.Freeze };
}

type BlockResult = {
  firstUsage: Map<IdentifierId, Vertex>;
  lastUsage: Map<IdentifierId, Vertex>;
};

class BlockResultBuilder {
  #firstUsage: Map<IdentifierId, Vertex> = new Map();
  #lastUsage: Map<IdentifierId, Vertex> = new Map();
  #graph: UseGraph;

  constructor(graph: UseGraph) {
    this.#graph = graph;
  }

  build(): BlockResult {
    return {
      firstUsage: this.#firstUsage,
      lastUsage: this.#lastUsage,
    };
  }

  /**
   * Represents assignment of a value to a Place. Unlike with `reference()`,
   * this does *not* establish an edge between this usage of the place and
   * previous usages, because the value is not the same.
   */
  init(
    place: Place,
    instr: Instruction | InstructionValue | Terminal | null,
    isReassignment: boolean
  ): Vertex {
    const id = place.value.id;
    const vertex = this.#graph.init(place, instr, isReassignment);
    if (!this.#firstUsage.has(id)) {
      this.#firstUsage.set(id, vertex);
    }
    this.#lastUsage.set(id, vertex);
    return vertex;
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
    const targetVertex = this.init(target, instr, true);
    const valueVertex = this.#graph.get(value)!;
    targetVertex.incoming.add(valueVertex);
    valueVertex.outgoing.add(targetVertex);
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
    const id = place.value.id;
    place.capability = capability;
    const prevVertex = this.#lastUsage.get(id);
    const vertex = this.init(place, instr, false);

    if (prevVertex != null) {
      prevVertex.outgoing.add(vertex);
      vertex.incoming?.add(prevVertex);
    }
  }
}

class IdGenerator {
  #value: number = 0;

  next(): number {
    return this.#value++;
  }
}

class UseGraph {
  #idGenerator: IdGenerator = new IdGenerator();
  #verticesByPlace: Map<Place, Vertex> = new Map();
  #vertices: Array<Vertex> = [];

  get(place: Place): Vertex | null {
    return this.#verticesByPlace.get(place) ?? null;
  }

  init(
    place: Place,
    instr: Instruction | InstructionValue | Terminal | null,
    isReassignment: boolean
  ): Vertex {
    let vertex = this.#verticesByPlace.get(place);
    if (vertex == null) {
      vertex = new Vertex(place, instr, this.#idGenerator, isReassignment);
      this.#verticesByPlace.set(place, vertex);
      this.#vertices.push(vertex);
    }
    return vertex;
  }

  join(): Vertex {
    const vertex = new Vertex(null, null, this.#idGenerator, false);
    this.#vertices.push(vertex);
    return vertex;
  }

  build(): Array<Vertex> {
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
  place: Place | null;

  /**
   * The instruction where the reference occurs (for debugging)
   */
  instr: Instruction | InstructionValue | Terminal | null;

  /**
   * Does this vertex represent an assignment? If yes, incoming
   * represents the set of values that are *assigned* to this vertex,
   * and not previous usages.
   */
  isReassignment: boolean;

  /**
   * Unique identifier for this vertex (for debugging)
   */
  id: string;

  /**
   * The last epoch in which this vertex was visited. This is used during
   * data-flow analysis post construction of the graph to ensure termination
   * by avoiding revisiting the same nodes in a given pass.
   */
  epoch: number | null = null;

  constructor(
    place: Place | null,
    instr: Instruction | InstructionValue | Terminal | null,
    idGenerator: IdGenerator,
    isReassignment: boolean
  ) {
    this.place = place;
    this.instr = instr;
    this.id = `v${idGenerator.next()}`;
    this.isReassignment = isReassignment;
  }
}

/**
 * Prints the graph into GraphViz DOT format.
 * https://graphviz.org/doc/info/lang.html
 */
export function printGraph(vertices: Array<Vertex>): string {
  const output = [];

  for (const vertex of vertices) {
    if (
      vertex.place === null &&
      vertex.incoming.size === 0 &&
      vertex.outgoing.size === 0
    ) {
      continue;
    }
    const vertexId = vertex.id;
    output.push(
      `${vertexId} [ label="${vertexId} (${
        vertex.place ? printPlace(vertex.place) : "<join>"
      } @ ${
        vertex.instr
          ? printMixedHIR(vertex.instr).replaceAll('"', '\\"')
          : "<no-instr>"
      }) ${vertex.isReassignment ? "<assign>" : "<update>"}", shape="box" ]`
    );
    for (const outgoing of vertex.outgoing) {
      const outgoingId = outgoing.id;
      output.push(`${vertexId} -> ${outgoingId}`);
    }
  }
  const lines = output.map((line) => "  " + line);
  lines.unshift("digraph BuildDefUseGraph {");
  lines.push("}");
  return lines.join("\n");
}

function mapToJson(map: Map<IdentifierId, Vertex>): {
  [key: string]: string;
} {
  const result: { [key: string]: string } = {};
  for (const [id, vertex] of map) {
    result[id] = vertex.id;
  }
  return result;
}
