/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {
  Environment,
  GotoVariant,
  Instruction,
  InstructionKind,
  Place,
  SourceLocation,
  SpreadPattern,
} from '../HIR';
import {ReactFunctionType} from '../HIR/Environment';
import {printInstruction, printPlace} from '../HIR/PrintHIR';
import {assertExhaustive} from '../Utils/utils';

export type ReactiveGraph = {
  nodes: Map<ReactiveId, ReactiveNode>;
  nextNodeId: number;
  entry: ReactiveId;
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
  | EntryNode
  | LoadNode
  | StoreNode
  | LoadArgumentNode
  | InstructionNode
  | BranchNode
  | FallthroughNode
  | ControlNode
  | ReturnNode
  | GotoNode;

export type NodeReference = {
  node: ReactiveId;
  from: Place;
  as: Place;
};

export type NodeDependencies = Map<ReactiveId, NodeDependency>;
export type NodeDependency = {from: Place; as: Place};

export type EntryNode = {
  kind: 'Entry';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
};

export type LoadArgumentNode = {
  kind: 'LoadArgument';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  place: Place;
  control: ReactiveId;
};

export type LoadNode = {
  kind: 'Load';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  value: NodeReference;
  control: ReactiveId;
};

export type StoreNode = {
  kind: 'Store';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  lvalue: Place;
  instructionKind: InstructionKind;
  value: NodeReference;
  control: ReactiveId;
};

// An individual instruction
export type InstructionNode = {
  kind: 'Value';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  dependencies: NodeDependencies;
  control: ReactiveId;
  value: Instruction;
};

export type ReturnNode = {
  kind: 'Return';
  id: ReactiveId;
  loc: SourceLocation;
  value: NodeReference;
  outputs: Array<ReactiveId>;
  dependencies: Array<ReactiveId>;
  control: ReactiveId;
};

export type GotoNode = {
  kind: 'Goto';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  dependencies: Array<ReactiveId>;
  control: ReactiveId;
  target: ReactiveId;
  variant: GotoVariant;
};

export type BranchNode = {
  kind: 'Branch';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  dependencies: Array<ReactiveId>; // values/scopes depended on by more than one branch, or by the terminal
  control: ReactiveId;
  fallthrough: ReactiveId;
  terminal: BranchTerminal;
};

export type BranchTerminal = IfBranch;

export type IfBranch = {
  kind: 'If';
  test: NodeReference;
  consequent: {entry: ReactiveId; exit: ReactiveId};
  alternate: {entry: ReactiveId; exit: ReactiveId};
};

export type FallthroughNode = {
  kind: 'Fallthrough';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  control: ReactiveId; // always the corresponding branch node
  branches: Array<ReactiveId>; // the other control-flow paths that reach the fallthrough
};

export type ControlNode = {
  kind: 'Control';
  id: ReactiveId;
  loc: SourceLocation;
  outputs: Array<ReactiveId>;
  dependencies: Array<ReactiveId>;
  control: ReactiveId;
};

function _staticInvariantReactiveNodeHasIdLocationAndOutputs(
  node: ReactiveNode,
): [ReactiveId, SourceLocation, Array<ReactiveId>, ReactiveId | null] {
  // If this fails, it is because a variant of ReactiveNode is missing a .id and/or .loc - add it!
  let control: ReactiveId | null = null;
  if (node.kind !== 'Entry') {
    const nonNullControl: ReactiveId = node.control;
    control = nonNullControl;
  }
  return [node.id, node.loc, node.outputs, control];
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
    if (node.outputs.length === 0 && node.kind !== 'Control') {
      visit(node.id);
    }
  }
  visit(graph.exit);
  graph.nodes = nodes;
}

export function* eachBranchTerminalDependency(
  terminal: BranchTerminal,
): Iterable<ReactiveId> {
  switch (terminal.kind) {
    case 'If': {
      yield terminal.test.node;
    }
  }
}

export function* eachNodeDependency(node: ReactiveNode): Iterable<ReactiveId> {
  switch (node.kind) {
    case 'Entry':
    case 'LoadArgument': {
      break;
    }
    case 'Goto':
    case 'Control': {
      yield* node.dependencies;
      break;
    }
    case 'Branch': {
      yield* node.dependencies;
      yield* eachBranchTerminalDependency(node.terminal);
      break;
    }
    case 'Fallthrough': {
      yield* node.branches;
      break;
    }
    case 'Load': {
      yield node.value.node;
      break;
    }
    case 'Store': {
      yield node.value.node;
      break;
    }
    case 'Return': {
      yield* node.dependencies;
      yield node.value.node;
      break;
    }
    case 'Value': {
      yield* [...node.dependencies.keys()];
      break;
    }
    default: {
      assertExhaustive(node, `Unexpected node kind '${(node as any).kind}'`);
    }
  }
  if (node.kind !== 'Entry' && node.control != null) {
    yield node.control;
  }
}

export function* eachBranchTerminalReference(
  terminal: BranchTerminal,
): Iterable<NodeReference> {
  switch (terminal.kind) {
    case 'If': {
      yield terminal.test;
      break;
    }
  }
}

export function* eachNodeReference(
  node: ReactiveNode,
): Iterable<NodeReference> {
  switch (node.kind) {
    case 'Goto':
    case 'Entry':
    case 'Control':
    case 'LoadArgument': {
      break;
    }
    case 'Store': {
      yield node.value;
      break;
    }
    case 'Load': {
      yield node.value;
      break;
    }
    case 'Return': {
      yield node.value;
      break;
    }
    case 'Branch': {
      yield* eachBranchTerminalReference(node.terminal);
      break;
    }
    case 'Fallthrough': {
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
    const control =
      node.kind !== 'Entry' && node.control != null
        ? ` control=£${node.control}`
        : '';
    switch (node.kind) {
      case 'Entry': {
        buffer.push(`£${id} Entry`);
        break;
      }
      case 'Goto': {
        buffer.push(
          `£${id} Goto(${node.variant}) target=£${node.target} deps=[${node.dependencies.map(id => `£${id}`).join(', ')}]${control}`,
        );
        break;
      }
      case 'LoadArgument': {
        buffer.push(`£${id} LoadArgument ${printPlace(node.place)}${control}`);
        break;
      }
      case 'Control': {
        buffer.push(
          `£${id} Control${control} deps=[${node.dependencies.map(id => `£${id}`).join(', ')}]`,
        );
        break;
      }
      case 'Load': {
        buffer.push(`£${id} Load ${printNodeReference(node.value)}${control}`);
        break;
      }
      case 'Store': {
        buffer.push(
          `£${id} Store ${node.instructionKind} ${printPlace(node.lvalue)} = ${printNodeReference(node.value)}${control}`,
        );
        break;
      }
      case 'Return': {
        buffer.push(
          `£${id} Return ${printNodeReference(node.value)} deps=[${node.dependencies.map(id => `£${id}`).join(', ')}]${control}`,
        );
        break;
      }
      case 'Branch': {
        buffer.push(
          `£${id} Branch deps=[${node.dependencies.map(id => `£${id}`).join(', ')}]${control}`,
        );
        switch (node.terminal.kind) {
          case 'If': {
            buffer.push(
              `  If test=${printNodeReference(node.terminal.test)} ` +
                `consequent=£${node.terminal.consequent.entry}:${node.terminal.consequent.exit} ` +
                `alternate=£${node.terminal.alternate.entry}:${node.terminal.alternate.exit}`,
            );
            break;
          }
          default: {
            // assertExhaustive(node.terminal, `Unsupported terminal kind ${(node.terminal as any).kind}`);
          }
        }
        break;
      }
      case 'Fallthrough': {
        buffer.push(
          `£${id} Fallthrough${control} branches=[${node.branches.map(id => `£${id}`).join(', ')}]`,
        );
        break;
      }
      case 'Value': {
        const deps = [...eachNodeReference(node)]
          .map(id => printNodeReference(id))
          .join(' ');
        buffer.push(`£${id} Value deps=[${deps}]${control}`);
        buffer.push('  ' + printInstruction(node.value));
        break;
      }
      default: {
        assertExhaustive(node, `Unexpected node kind ${(node as any).kind}`);
      }
    }
  }
}
