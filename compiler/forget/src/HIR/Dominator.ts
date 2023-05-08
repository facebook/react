/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import prettyFormat from "pretty-format";
import { BlockId, HIRFunction } from "./HIR";
import { eachTerminalSuccessor } from "./visitors";

/**
 * Computes the dominator or post dominator tree of the given function. The returned `Dominator` stores
 * the immediate dominator of each node in the function, which can be retrieved with `Dominator.prototype.get()`.
 *
 * The implementation is a straightforward adaptation of https://www.cs.rice.edu/~keith/Embed/dom.pdf
 * except that CFG nodes ordering is inverted (so the comparison functions are swapped)
 */
export function computeDominators(
  fn: HIRFunction,
  options: { reverse: boolean } | null = null
): Dominator<BlockId> {
  const reverse = options?.reverse === true;
  let graph: Graph<BlockId>;
  if (reverse) {
    graph = computeReverseGraph(fn);
  } else {
    graph = computeGraph(fn);
  }
  return Dominator.create(graph);
}

type Node<T> = {
  id: T;
  index: number;
  preds: Set<T>;
  succs: Set<T>;
};
type Graph<T> = {
  entry: T;
  nodes: Map<T, Node<T>>;
};

/**
 * A dominator tree that stores the immediate dominator for each block in function.
 */
class Dominator<T> {
  #entry: T;
  #nodes: Map<T, T>;

  private constructor(entry: T, nodes: Map<T, T>) {
    this.#entry = entry;
    this.#nodes = nodes;
  }

  static create<T>(graph: Graph<T>): Dominator<T> {
    const nodes: Map<T, T> = new Map();
    nodes.set(graph.entry, graph.entry);
    let changed = true;
    while (changed) {
      changed = false;
      for (const [id, node] of graph.nodes) {
        // Skip start node
        if (node.id === graph.entry) {
          continue;
        }

        // first processed predecessor
        let newIdom: T | null = null;
        for (const pred of node.preds) {
          if (nodes.has(pred)) {
            newIdom = pred;
            break;
          }
        }
        invariant(
          newIdom !== null,
          `At least one predecessor must have been visited for block ${id}`
        );

        for (const pred of node.preds) {
          // For all other predecessors
          if (pred === newIdom) {
            continue;
          }
          const predDom = nodes.get(pred);
          if (predDom !== undefined) {
            newIdom = intersect(pred, newIdom, graph, nodes);
          }
        }

        if (nodes.get(id) !== newIdom) {
          nodes.set(id, newIdom);
          changed = true;
        }
      }
    }

    return new Dominator(graph.entry, nodes);
  }

  /**
   * Returns the entry node
   */
  get entry(): T {
    return this.#entry;
  }

  /**
   * Returns the immediate dominator of the block with @param id if present. Returns null
   * if there is no immediate dominator (ie if the dominator is @param id itself).
   */
  get(id: T): T | null {
    const dominator = this.#nodes.get(id);
    invariant(
      dominator !== undefined,
      `Called on invalid node identifier '${id}'`
    );
    return dominator === id ? null : dominator;
  }

  debug(): string {
    return prettyFormat(this.#nodes);
  }
}

function intersect<T>(a: T, b: T, graph: Graph<T>, nodes: Map<T, T>): T {
  let block1: Node<T> = graph.nodes.get(a)!;
  let block2: Node<T> = graph.nodes.get(b)!;
  while (block1 !== block2) {
    while (block1.index > block2.index) {
      const dom = nodes.get(block1.id)!;
      block1 = graph.nodes.get(dom)!;
    }
    while (block2.index > block1.index) {
      const dom = nodes.get(block2.id)!;
      block2 = graph.nodes.get(dom)!;
    }
  }
  return block1.id;
}

function computeGraph(fn: HIRFunction): Graph<BlockId> {
  const graph: Graph<BlockId> = { entry: fn.body.entry, nodes: new Map() };
  let index = 0;
  for (const [id, block] of fn.body.blocks) {
    graph.nodes.set(id, {
      id,
      index: index++,
      preds: block.preds,
      succs: new Set(eachTerminalSuccessor(block.terminal)),
    });
  }
  return graph;
}

function computeReverseGraph(fn: HIRFunction): Graph<BlockId> {
  const nodes: Map<BlockId, Node<BlockId>> = new Map();
  const exitId = fn.env.nextBlockId;
  const exit: Node<BlockId> = {
    id: exitId,
    index: 0,
    preds: new Set(),
    succs: new Set(),
  };
  nodes.set(exitId, exit);

  for (const [id, block] of fn.body.blocks) {
    const node: Node<BlockId> = {
      id,
      index: 0,
      preds: new Set(eachTerminalSuccessor(block.terminal)),
      succs: new Set(block.preds),
    };
    if (block.terminal.kind === "return" || block.terminal.kind === "throw") {
      node.preds.add(exitId);
      exit.succs.add(id);
    }
    nodes.set(id, node);
  }

  // Put nodes into RPO form
  const visited = new Set<BlockId>();
  const postorder: Array<BlockId> = [];
  function visit(id: BlockId): void {
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    const node = nodes.get(id)!;
    for (const successor of node.succs) {
      visit(successor);
    }
    postorder.push(id);
  }
  visit(exitId);

  const rpo: Graph<BlockId> = { entry: exitId, nodes: new Map() };
  let index = 0;
  for (const id of postorder.reverse()) {
    const node = nodes.get(id)!;
    node.index = index++;
    rpo.nodes.set(id, node);
  }
  return rpo;
}
