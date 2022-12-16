/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { invariant } from "../CompilerError";
import * as IR from "../IR";
import { SCCGraph, SCCVertex } from "./SCCGraph";
import { ValGraphSnapshot, ValVertexSnapshot } from "./ValGraphSnapshot";

/**
 * Val Dependency Graph
 *
 * ValGraph is used to express the dependence relation between {@link IR.Val},
 * materialzed as {@link ValVertex}. Although it's specialized for our purpose,
 * It is inspired by traditional graph IRs e.g. the DDG (Data Dependence Graph)
 * and PDG (Program Dependence Graph) that are often found in the compilers
 * community e.g. LLVM, HotSpot JVM.
 *
 * N.B.
 * 1. ValGraph can be cyclic. Cicular dependencies (established by either
 *    direct reference or infered mutation) are intended to be handled as a group
 *    like mutatually recursive function during the condensation to form a
 *    {@link SCCGraph} which is a DAG.
 * 2. ValGraph is intended to capture the dependence relation between program
 *    components (i.e. materalized as {@link IR.Val} at the granularity that we
 *    are concerned about. See {@link DepGraphAnalysis} for the details.
 * 3. Due to the nature of undecidability and the limitations from being
 *    flow-insensitive, mutation (e.g. re-assignment) are handled by assuming
 *    the worst case where every mutable {@link Ref} may be mutated by,
 *    therefore depends on, any other {@link Val} that is syntactically possible
 *    to flow into it. Therefore, the dependency relation captured by this graph
 *    is intentionally conservative and contains false positives.
 */

export class ValGraph {
  /**
   * ValGraph is represented as an (modified) adjacency list:
   * It's a collection of {@link ValVertex}, and every vertex stores a set of
   * outgoing edges (as well as incoming edges in our version).
   *
   * The collection is a mapping from {@link IR.Val}s to their corresponding
   * vertices to ease the lookups needed during construction.
   */
  vertices: Map<IR.Val, ValVertex> = new Map();

  constructor(funcEnv: IR.FuncEnv) {
    // Prepopulate vertices for declarations
    for (const [_, b] of funcEnv.decls.entries()) {
      this.getOrCreateVertex(b);
    }

    // ...and may be free vars.
    if (funcEnv.includeFreeVars) {
      for (const [_, b] of funcEnv.freeVars.entries()) {
        this.getOrCreateVertex(b);
      }
    }
  }

  /**
   * Add a (@param from) --is dependency for--> (@param to) edge (dependents) while
   * setting up the "backward pointer" (dependencies).
   */
  addEdge(from: ValVertex, to: ValVertex) {
    from.outgoings.add(to);
    to.incomings.add(from);
  }

  /**
   * Remove a (@param from) --is dependency for--> (@param to) edge (dependents) while
   * clearing up the "backward pointer" (dependencies).
   */
  removeEdge(from: ValVertex, to: ValVertex) {
    from.outgoings.delete(to);
    to.incomings.delete(from);
  }

  /**
   * @returns the vertex associated with the @param val if it exists, and if it
   * does not, create an new vertex and @returns it instead.
   *
   * This is used to handle the possible presence of "forward references" where
   * we may discover {@link dependencies} before we actually visited them and
   * created vertices for them.
   */
  getOrCreateVertex(val: IR.Val): ValVertex {
    let vertex = this.vertices.get(val);
    if (!vertex) {
      vertex = new ValVertex(this, val);
    }
    return vertex;
  }

  /**
   * Tarjan's strongly connected components algorithm.
   * @see https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
   */
  tarjan(): Set<SCCVertex> {
    const outputs = new Set<SCCVertex>();
    const stack: ValVertex[] = [];

    let index = 0;
    for (const v of this.vertices.values()) {
      if (v.index === -1) strongConnect(v);
    }

    function strongConnect(v: ValVertex) {
      v.index = index;
      v.lowlink = index;
      index++;
      stack.push(v);
      v.onStack = true;

      // Successors of v
      for (const w of v.outgoings) {
        if (w.index === -1) {
          // Successor w has not yet been visited; recurse on it.
          strongConnect(w);
          // since w is reachable by v, pick the lowest link.
          v.lowlink = Math.min(v.lowlink, w.lowlink);
        } else if (w.onStack) {
          // Successor w is in stack S and hence in the current SCC.
          // see if w has a lower index to becomes v's lowlink.
          v.lowlink = Math.min(v.lowlink, w.index);
          // If w is not on stack, then (v, w) is an edge pointing to an SCC
          // already found (since w has been visited) and must be ignored.
        }
      }

      // If v is a root node, pop the stack and generate an SCC
      if (v.lowlink === v.index) {
        const scc = new SCCVertex();
        let w;
        while (w !== v) {
          w = stack.pop();
          invariant(w, "stack should not be empty");
          w.onStack = false;
          scc.add(w);
        }
        outputs.add(scc);
      }
    }

    return outputs;
  }

  /**
   * Graph condensation based on Tarjan.
   */
  condense(): SCCGraph {
    const dag = new SCCGraph(this.tarjan());

    // (v.SCC, w.SCC) is an edge in SCCGraph only if they are different and
    // (v, w) is an edge in ValGRaph.
    for (const scc of dag.vertices) {
      for (const v of scc.members) {
        for (const w of v.outgoings) {
          invariant(v.scc, "v belongs to a SCC.");
          invariant(w.scc, "w belongs to a SCC.");
          if (v.scc !== w.scc) {
            dag.addEdge(v.scc, w.scc);
          }
        }
      }
    }

    return dag;
  }

  snapshot() {
    return new ValGraphSnapshot(this);
  }
}

/**
 * Each vertex represents an unique {@link IR.Val}.
 * Vertices of {@link ValGraph}.
 */
export class ValVertex {
  /**
   * The belonging graph.
   */
  graph: ValGraph;

  /**
   * The corresponding {@link IR.Val}
   */
  val: IR.Val;

  /**
   * The set of reactive values flowed into this vertex directly.
   */
  ownInputs: Set<IR.ReactiveVal>;

  /**
   * Vertices that depend on this vertex (Dependents).
   * Outgoing edges ("pointing to") of this vertex.
   */
  outgoings: Set<ValVertex>;

  /**
   * Vertices that this vertex depends on (Dependencies).
   * Incoming edges ("pointing from") of this vertex.
   */
  incomings: Set<ValVertex>;

  /**
   * Used by Tarjan algorithm.
   */
  index: number;
  lowlink: number;
  onStack: boolean;

  /**
   * Belonging {@link SCCVertex}
   */
  scc: SCCVertex | undefined;

  constructor(graph: ValGraph, val: IR.Val) {
    this.graph = graph;
    this.val = val;
    this.ownInputs = new Set();
    this.incomings = new Set();
    this.outgoings = new Set();
    this.index = -1;
    this.lowlink = -1;
    this.onStack = false;
    this.scc = undefined;

    this.graph.vertices.set(val, this);
  }

  /**
   * This getter @return the latest set of reactive values considered inputs.
   * - In returns {@link this.ownInputs} initially until it's grouped into SCC.
   */
  get inputs(): Set<IR.ReactiveVal> {
    if (this.scc) {
      return this.scc.inputs;
    } else {
      return this.ownInputs;
    }
  }

  /**
   * Refine a vertex as "Reactive Input" (i.e. roots) of the graph, which
   * should only include the val itself in the inputs payload.
   */
  refineToReactiveInput(this: ValVertex) {
    invariant(IR.isReactiveVal(this.val), "This val must be a ReactiveVal.");
    invariant(
      this.inputs.size === 0 ||
        (this.inputs.size === 1 && this.inputs.has(this.val)),
      "Inputs was previously empty or only contain itself."
    );
    this.inputs.add(this.val);
  }

  /**
   * In initial construction, dependencies are discovered as (to, from) pair
   * due to the nature of AST visitation. This method provides a convenient
   * way to add them as (from, to) edges.
   */
  addDependency(val: IR.Val): void {
    const dependency = this.graph.getOrCreateVertex(val);
    this.graph.addEdge(dependency, this);
  }

  snapshot() {
    return new ValVertexSnapshot(this);
  }
}
