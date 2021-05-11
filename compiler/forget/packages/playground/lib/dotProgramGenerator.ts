/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

// TODO: Add transform tests for these.

import { SCCGraph, ValGraph } from "babel-plugin-react-forget";
import invariant from "invariant";

const dotPrologue = `\
  compound=true;
  node [shape=rect, fontsize=11];
`;

export default function genDotProgram(graph: ValGraph | SCCGraph): string {
  return graph instanceof ValGraph
    ? genValGraphDotProgram(graph)
    : genSCCGraphDotProgram(graph);
}

function genValGraphDotProgram(graph: ValGraph): string {
  const stmts: string[] = [];
  // Stringified Val => Node ID.
  const nodeTable = new Map<string, string>();

  // Nodes
  graph.vertices.forEach(({ val }, i) => {
    const id = `node${i}`;
    const node = genDotNode(id, val.pretty);
    stmts.push(node);
    nodeTable.set(val.toString(), id);
  });

  // Edges (dependency => dependent)
  graph.vertices.forEach(({ val, incomings }) => {
    const destinationId = getNodeId(nodeTable, val.toString());
    incomings.forEach((sourceVal) => {
      const sourceId = getNodeId(nodeTable, sourceVal.toString());
      const edge = genDotEdge(sourceId, destinationId);
      stmts.push(edge);
    });
  });

  return `\
    digraph G {
      ${dotPrologue}
      ${stmts.join("\n")}
    }
  `;
}

function genSCCGraphDotProgram(graph: SCCGraph): string {
  const stmts: string[] = [];
  // Stringified SCCVertex => subgraph ID + representative node ID.
  const subGraphTable = new Map<string, SubgraphId>();
  // Stringified Val => Node ID.
  const nodeTable = new Map<string, string>();
  let nodeCount = 0;

  // Subgraphs
  graph.vertices.forEach((sccVertex, i) => {
    const id = `cluster_${i}`;

    // Nodes
    const nodes = sccVertex.members.map(({ val }) => {
      const nodeId = `node${nodeCount++}`;
      nodeTable.set(val.toString(), nodeId);
      return genDotNode(nodeId, val.pretty);
    });

    const subgraph = genDotSubgraph(id, nodes);
    stmts.push(subgraph);
    subGraphTable.set(sccVertex.toString(), {
      id,
      repNodeId: `node${nodeCount - 1}`,
    });
  });

  // Edges
  graph.vertices.forEach((sccVertex) => {
    const { id: destinationId, repNodeId: destinationNodeId } = getSubgraphId(
      subGraphTable,
      sccVertex.toString()
    );

    // RedGraph: input node => subgraph
    sccVertex.inputs.forEach((input) => {
      const inputNodeId = getNodeId(nodeTable, input.toString());
      // Prevent self-loops on reactive inputs.
      if (inputNodeId !== destinationNodeId) {
        const edge = genDotEdge(inputNodeId, destinationNodeId, {
          lhead: destinationId,
        });
        stmts.push(edge);
      }
    });

    // SCCGraph: dependency subgraph => dependent subgraph
    sccVertex.incomings.forEach((sourceValVertices) => {
      const stringifiedSCCVertex = `[${sourceValVertices
        .map(({ val }) => val.toString())
        .join(",")}]`;
      const { id: sourceId, repNodeId: sourceNodeId } = getSubgraphId(
        subGraphTable,
        stringifiedSCCVertex
      );
      // Since Dot doesn't allow connecting two subgraphs directly, we
      // instead connect each of their representative nodes and specify
      // that the head and tail of the edge should attach to subgraphs instead.
      const edge = genDotEdge(sourceNodeId, destinationNodeId, {
        ltail: sourceId,
        lhead: destinationId,
      });
      stmts.push(edge);
    });
  });

  return `\
    digraph G {
      ${dotPrologue}
      ${stmts.join("\n")}
    }
  `;
}

function genDotNode(id: string, label: string): string {
  return `${id} [id="${id}", label="${label}"];`;
}

function genDotEdge(
  sourceNode: string,
  destinationNode: string,
  options?: { ltail?: string; lhead?: string }
): string {
  const edge = `${sourceNode} -> ${destinationNode}`;
  const attrs = options
    ? `[ltail=${options.ltail ?? `""`}, lhead=${
        options.lhead ?? `""`
      }, minlen=3]`
    : undefined;
  return [edge, attrs].filter(Boolean).join(" ");
}

function genDotSubgraph(id: string, stmts: string[]): string {
  return `\
    subgraph ${id} {
      style=filled;
      color="#EBECF0";
      ${stmts.join("\n")}
    }
  `;
}

function getNodeId(nodeTable: Map<string, string>, label: string): string {
  const id = nodeTable.get(label);
  invariant(id, `Could not find Node ID for label: %s`, label);
  return id;
}

interface SubgraphId {
  id: string;
  // The ID of the node representing a subgraph (the last ID in the subgraph).
  repNodeId: string;
}

function getSubgraphId(
  sourceMap: Map<string, SubgraphId>,
  label: string
): SubgraphId {
  const id = sourceMap.get(label);
  invariant(id, `Could not find subgraph ID for label: %s`, label);
  return id;
}
