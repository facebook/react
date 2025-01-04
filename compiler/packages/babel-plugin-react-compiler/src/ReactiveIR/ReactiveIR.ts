/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {
  Environment,
  Instruction,
  Place,
  ReactiveScope,
  SourceLocation,
  SpreadPattern,
} from '../HIR';
import {ReactFunctionType} from '../HIR/Environment';
import {printInstruction, printPlace} from '../HIR/PrintHIR';
import {assertExhaustive} from '../Utils/utils';

export type ReactiveGraph = {
  nodes: Map<ReactiveId, ReactiveNode>;
  nextNodeId: number;
  exit: ReactiveId;
  loc: SourceLocation;
  id: string | null;
  params: Array<Place | SpreadPattern>;
  generator: boolean;
  async: boolean;
  env: Environment;
  directives: Array<string>;
  fnType: ReactFunctionType;
};

/*
 * Simulated opaque type for Reactive IDs to prevent using normal numbers as ids
 * accidentally.
 */
const opaqueReactiveId = Symbol();
export type ReactiveId = number & {[opaqueReactiveId]: 'ReactiveId'};

export function makeReactiveId(id: number): ReactiveId {
  CompilerError.invariant(id >= 0 && Number.isInteger(id), {
    reason: 'Expected reactive node id to be a non-negative integer',
    description: null,
    loc: null,
    suggestions: null,
  });
  return id as ReactiveId;
}

export type ReactiveNode =
  | LoadArgumentNode
  | InstructionNode
  | IfNode
  | EmptyNode
  | ReturnNode
  | ScopeNode;

export type NodeReference = {
  node: ReactiveId;
  from: Place;
  as: Place;
};

export type NodeDependencies = Map<ReactiveId, NodeDependency>;
export type NodeDependency = {from: Place; as: Place};

export type LoadArgumentNode = {
  kind: 'LoadArgument';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  place: Place;
};

// An individual instruction
export type InstructionNode = {
  kind: 'Value';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  dependencies: NodeDependencies;
  controlDependency: ReactiveId | null;
  value: Instruction;
};

export type ReturnNode = {
  kind: 'Return';
  id: ReactiveId;
  loc: SourceLocation;
  value: NodeReference;
  outputs: Array<ReactiveId>;
};

export type IfNode = {
  kind: 'If';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  test: NodeReference;
  consequent: ReactiveId;
  alternate: ReactiveId;
};

export type EmptyNode = {
  kind: 'Empty';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
};

export type ScopeNode = {
  kind: 'Scope';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  scope: ReactiveScope;
  /**
   * The hoisted dependencies of the scope. Instructions "within" the scope
   * (ie, the declarations or their deps) will also depend on these same values
   * but we explicitly describe them here to ensure that all deps come before the scope
   */
  dependencies: NodeDependencies;
  /**
   * The nodes that produce the values declared by the scope
   */
  // declarations: NodeDependencies;
  body: ReactiveId;
};

function _staticInvariantReactiveNodeHasIdLocationAndOutputs(
  node: ReactiveNode,
): [ReactiveId, SourceLocation, Array<ReactiveId>] {
  // If this fails, it is because a variant of ReactiveNode is missing a .id and/or .loc - add it!
  return [node.id, node.loc, node.outputs];
}

/**
 * Populates the outputs of each node in the graph
 */
export function populateReactiveGraphNodeOutputs(graph: ReactiveGraph): void {
  // Populate node outputs
  for (const [, node] of graph.nodes) {
    node.outputs.length = 0;
  }
  for (const [, node] of graph.nodes) {
    for (const dep of eachNodeDependency(node)) {
      const sourceNode = graph.nodes.get(dep);
      CompilerError.invariant(sourceNode != null, {
        reason: `Expected source dependency ${dep} to exist`,
        loc: node.loc,
      });
      sourceNode.outputs.push(node.id);
    }
  }
  const exitNode = graph.nodes.get(graph.exit)!;
  exitNode.outputs.push(graph.exit);
}

/**
 * Puts the nodes of the graph into reverse postorder, such that nodes
 * appear before any of their "successors" (consumers/dependents).
 */
export function reversePostorderReactiveGraph(graph: ReactiveGraph): void {
  const nodes: Map<ReactiveId, ReactiveNode> = new Map();
  function visit(id: ReactiveId): void {
    if (nodes.has(id)) {
      return;
    }
    const node = graph.nodes.get(id);
    CompilerError.invariant(node != null, {
      reason: `Missing definition for ID ${id}`,
      loc: null,
    });
    for (const dep of eachNodeDependency(node)) {
      visit(dep);
    }
    nodes.set(id, node);
  }
  for (const [_id, node] of graph.nodes) {
    if (node.outputs.length === 0 && node.kind !== 'Empty') {
      visit(node.id);
    }
  }
  visit(graph.exit);
  graph.nodes = nodes;
}

export function* eachNodeDependency(node: ReactiveNode): Iterable<ReactiveId> {
  switch (node.kind) {
    case 'LoadArgument':
    case 'Empty': {
      break;
    }
    case 'If': {
      yield node.test.node;
      yield node.consequent;
      yield node.alternate;
      break;
    }
    case 'Return': {
      yield node.value.node;
      break;
    }
    case 'Value': {
      yield* [...node.dependencies.keys()];
      if (node.controlDependency != null) {
        yield node.controlDependency;
      }
      break;
    }
    case 'Scope': {
      yield* [...node.dependencies.keys()];
      // yield* [...node.declarations.keys()];
      yield node.body;
      break;
    }
    default: {
      assertExhaustive(node, `Unexpected node kind '${(node as any).kind}'`);
    }
  }
}

export function* eachNodeReference(
  node: ReactiveNode,
): Iterable<NodeReference> {
  switch (node.kind) {
    case 'LoadArgument':
    case 'Empty': {
      break;
    }
    case 'Return': {
      yield node.value;
      break;
    }
    case 'If': {
      yield node.test;
      break;
    }
    case 'Value': {
      yield* [...node.dependencies].map(([node, dep]) => ({
        node,
        from: dep.from,
        as: dep.as,
      }));
      break;
    }
    case 'Scope': {
      yield* [...node.dependencies].map(([node, dep]) => ({
        node,
        from: dep.from,
        as: dep.as,
      }));
      // yield* [...node.declarations].map(([node, dep]) => ({
      //   node,
      //   from: dep.from,
      //   as: dep.as,
      // }));
      break;
    }
    default: {
      assertExhaustive(node, `Unexpected node kind '${(node as any).kind}'`);
    }
  }
}

function printNodeReference({node, from, as}: NodeReference): string {
  return `£${node}.${printPlace(from)} => ${printPlace(as)}`;
}

export function printNodeDependencies(deps: NodeDependencies): string {
  const buffer: Array<string> = [];
  for (const [id, dep] of deps) {
    buffer.push(printNodeReference({node: id, from: dep.from, as: dep.as}));
  }
  return buffer.join(', ');
}

export function printReactiveGraph(graph: ReactiveGraph): string {
  const buffer: Array<string> = [];
  buffer.push(
    `${graph.fnType} ${graph.id ?? ''}(` +
      graph.params
        .map(param => {
          if (param.kind === 'Identifier') {
            return printPlace(param);
          } else {
            return `...${printPlace(param.place)}`;
          }
        })
        .join(', ') +
      ')',
  );
  writeReactiveNodes(buffer, graph.nodes);
  buffer.push(`Exit £${graph.exit}`);
  return buffer.join('\n');
}

export function printReactiveNodes(
  nodes: Map<ReactiveId, ReactiveNode>,
): string {
  const buffer: Array<string> = [];
  writeReactiveNodes(buffer, nodes);
  return buffer.join('\n');
}

function writeReactiveNodes(
  buffer: Array<string>,
  nodes: Map<ReactiveId, ReactiveNode>,
): void {
  for (const [id, node] of nodes) {
    const deps = [...eachNodeReference(node)]
      .map(id => printNodeReference(id))
      .join(' ');
    switch (node.kind) {
      case 'LoadArgument': {
        buffer.push(`£${id} LoadArgument ${printPlace(node.place)}`);
        break;
      }
      case 'Empty': {
        buffer.push(`£${id} Empty deps=[${deps}]`);
        break;
      }
      case 'Return': {
        buffer.push(`£${id} Return ${printNodeReference(node.value)}`);
        break;
      }
      case 'If': {
        buffer.push(
          `£${id} If test=${printNodeReference(node.test)} consequent=£${node.consequent} alternate=£${node.alternate}`,
        );
        break;
      }
      case 'Value': {
        buffer.push(`£${id} Intermediate deps=[${deps}]`);
        buffer.push('  ' + printInstruction(node.value));
        break;
      }
      case 'Scope': {
        buffer.push(
          // `£${id} Scope @${node.scope.id} deps=[${printNodeDependencies(node.dependencies)}] declarations=[${printNodeDependencies(node.declarations)}]`,
          `£${id} Scope @${node.scope.id} deps=[${printNodeDependencies(node.dependencies)}] body=£${node.body}`,
        );
        break;
      }
      default: {
        assertExhaustive(node, `Unexpected node kind ${(node as any).kind}`);
      }
    }
  }
}
