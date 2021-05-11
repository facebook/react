/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { setFirst } from "../Common/utils";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import { SCCGraphSnapshot, SCCVertexSnapshot } from "./SCCGraphSnapshot";
import type { ValVertex } from "./ValGraph";

/**
 * SCC Dependency Graph
 *
 * SCCGraph is used to express the dependence relation between SCC, or Strongly
 * Connect Componnets in {@link ValGraph}. In other words, SCCGraph is the
 * "condensation" of {@link ValGraph}. It's constructed by contracting SCCs of
 * {@link ValVertex} into {@link SCCVertex}s. The resulting graph is guranteed
 * to be a DAG, or Directed Acyclic Graph, which has the property to be
 * topologically sorted, or scheduled, that we leveraged to perform a change
 * propagation process that we called "Dependency Reduction".
 *
 * Although customized, it is insipred by TDG (Task Dependency Graph) that are
 * often used in build systems (e.g. Build Systems à la Carte).
 */
export class SCCGraph {
  /**
   * SCCGraph is represented as an (modified) adjacency list:
   * It's a collection of {@link SCCVertex}, and every vertex stores a set of
   * outgoing edges (as well as incoming edges in our version).
   */
  vertices: Set<SCCVertex>;

  /**
   * SCCGraph are constructed as a whole.
   */
  constructor(vertices: Set<SCCVertex>) {
    this.vertices = vertices;
  }

  /**
   * Add a (@param from) --depends on--> (@param to) edge (depdenents) while
   * setting up the "backward pointer" (dependencies).
   */
  addEdge(from: SCCVertex, to: SCCVertex) {
    from.outgoings.add(to);
    to.incomings.add(from);
  }

  /**
   * Remove a (@param from) --depends on--> (@param to) edge (depdenents) while
   * clearing up the "backward pointer" (dependencies).
   */
  removeEdge(from: SCCVertex, to: SCCVertex) {
    from.outgoings.delete(to);
    to.incomings.delete(from);
  }

  /**
   * A topological-ordered reducer (or scheduler, in the build system term) over
   * the {@link SCCGraph} using Kahn's algorithm.
   * @see https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm
   *
   * A fully reduced SCCGraph is consisted of only vertices that have no edges,
   * i.e. all {@link SCCVertex.incomings} and {@link SCCVertex.outgoings} have
   * been contracted to {@link SCCVertex.inputs} payload.
   */
  reduce() {
    // A queue of all vertices with no incoming edges (0-degree).
    const queue = Array.from(this.vertices.values()).filter(
      (vertex) => vertex.incomings.size === 0
    );

    while (queue.length !== 0) {
      const cur = queue.shift();
      invariant(cur, "Unexpected Null.");

      // for all its outgoing edges (dependent)
      cur.outgoings.forEach((out: SCCVertex) => {
        invariant(
          out.incomings.has(cur),
          "Dependencies and dependents are not paired."
        );

        // Propagate inputs to out.
        // Except out is itself an Input then the propagration should stop.
        if (!out.isInput()) {
          cur.inputs.forEach((input) => {
            // N.B. out's inputs is a union of all its incomings' inputs.
            out.inputs.add(input);
          });
        }

        // Current dependency reduced. Remove the edge.
        this.removeEdge(cur, out);

        // If all incoming edges have been reduced. Add to working queue.
        if (out.incomings.size === 0) {
          queue.push(out);
        }
      });
    }

    invariant(
      this.irreducibleVertices.length === 0,
      "DAG should always be fully reduced."
    );
  }

  /**
   * A collcetion of irreducible vertices (due to cycle).
   */
  get irreducibleVertices(): SCCVertex[] {
    return Array.from(this.vertices.values()).filter(
      (vertex) => vertex.incomings.size !== 0
    );
  }

  snapshot() {
    return new SCCGraphSnapshot(this);
  }
}

/**
 * Strongly Connected Components of {@link ValGraph}.
 * Vertices of {@link SCCGraph}.
 */
export class SCCVertex {
  /**
   * Members.
   */
  members: Set<ValVertex>;

  /**
   * Members of a group share the same set of inputs (physically in memory).
   */
  inputs: Set<IR.ReactiveVal>;

  /**
   * Vertices that depend on this vertex (Dependents).
   * Outgoing edges ("pointing to") of this vertex.
   */
  outgoings: Set<SCCVertex>;

  /**
   * Vertices that this vertex depends on (Dependencies).
   * Incoming edges ("pointing from") of this vertex.
   */
  incomings: Set<SCCVertex>;

  constructor() {
    this.members = new Set();
    this.inputs = new Set();
    this.outgoings = new Set();
    this.incomings = new Set();
  }

  /**
   * Add @param v to the SCC.
   *
   * Note that this change the {@link ValVertex}'s input pointing to the inputs
   * of SCC so that we can still query {@link ValGraph} for inputs.
   */
  add(v: ValVertex) {
    this.members.add(v);

    v.inputs.forEach((input) => this.inputs.add(input));
    v.scc = this;
  }

  isInput() {
    return this.members.size === 1 && IR.isInputVal(setFirst(this.members).val);
  }

  snapshot() {
    return new SCCVertexSnapshot(this);
  }
}
