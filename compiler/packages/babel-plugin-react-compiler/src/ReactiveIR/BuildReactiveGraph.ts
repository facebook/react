/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, SourceLocation} from '..';
import {BlockId, HIRFunction, Identifier, IdentifierId, Place} from '../HIR';
import {printIdentifier, printPlace} from '../HIR/PrintHIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  terminalFallthrough,
} from '../HIR/visitors';
import {
  IfNode,
  InstructionNode,
  LoadArgumentNode,
  makeReactiveId,
  NodeDependencies,
  NodeReference,
  populateReactiveGraphNodeOutputs,
  printReactiveNodes,
  ReactiveGraph,
  ReactiveId,
  ReactiveNode,
  ReturnNode,
  reversePostorderReactiveGraph,
  ScopeNode,
} from './ReactiveIR';

export function buildReactiveGraph(fn: HIRFunction): ReactiveGraph {
  const builder = new Builder();
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    const node: LoadArgumentNode = {
      kind: 'LoadArgument',
      id: builder.nextReactiveId,
      loc: place.loc,
      outputs: [],
      place: {...place},
    };
    builder.nodes.set(node.id, node);
    builder.declare(node.id, place);
  }

  const exitNode = buildBlockScope(fn, builder, fn.body.entry);

  const graph: ReactiveGraph = {
    async: fn.async,
    directives: fn.directives,
    env: fn.env,
    exit: exitNode,
    fnType: fn.fnType,
    generator: fn.generator,
    id: fn.id,
    loc: fn.loc,
    nextNodeId: builder._nextNodeId,
    nodes: builder.nodes,
    params: fn.params,
  };
  populateReactiveGraphNodeOutputs(graph);
  reversePostorderReactiveGraph(graph);
  return graph;
}

class Builder {
  _nextNodeId: number = 0;
  #environment: Map<IdentifierId, {node: ReactiveId; from: Place}> = new Map();
  nodes: Map<ReactiveId, ReactiveNode> = new Map();
  args: Set<IdentifierId> = new Set();

  get nextReactiveId(): ReactiveId {
    return makeReactiveId(this._nextNodeId++);
  }

  declare(node: ReactiveId, place: Place): void {
    this.#environment.set(place.identifier.id, {node, from: place});
  }

  lookup(
    identifier: Identifier,
    loc: SourceLocation,
  ): {node: ReactiveId; from: Place} {
    const dep = this.#environment.get(identifier.id);
    if (dep == null) {
      console.log(printReactiveNodes(this.nodes));
      for (const [id, dep] of this.#environment) {
        console.log(`t#${id} => £${dep.node} . ${printPlace(dep.from)}`);
      }

      console.log();
      console.log(`could not find ${printIdentifier(identifier)}`);
    }
    CompilerError.invariant(dep != null, {
      reason: `No source node for identifier ${printIdentifier(identifier)}`,
      loc,
    });
    return dep;
  }
}

function buildBlockScope(
  fn: HIRFunction,
  builder: Builder,
  entry: BlockId,
): ReactiveId {
  let block = fn.body.blocks.get(entry)!;
  let lastNode: ReactiveNode = {
    kind: 'Empty',
    id: builder.nextReactiveId,
    loc: block.terminal.loc,
    outputs: [],
  };
  builder.nodes.set(lastNode.id, lastNode);
  while (true) {
    // iterate instructions of the block
    for (const instr of block.instructions) {
      const dependencies: NodeDependencies = new Map();
      for (const operand of eachInstructionValueOperand(instr.value)) {
        const dep = builder.lookup(operand.identifier, operand.loc);
        dependencies.set(dep.node, {
          from: {...dep.from},
          as: {...operand},
        });
      }
      const node: InstructionNode = {
        kind: 'Value',
        controlDependency: null,
        dependencies,
        id: builder.nextReactiveId,
        loc: instr.loc,
        outputs: [],
        value: instr,
      };
      builder.nodes.set(node.id, node);
      lastNode = node;
      for (const lvalue of eachInstructionLValue(instr)) {
        builder.declare(node.id, lvalue);
      }
    }

    // handle the terminal
    const terminal = block.terminal;
    switch (terminal.kind) {
      case 'if': {
        const testDep = builder.lookup(
          terminal.test.identifier,
          terminal.test.loc,
        );
        const test: NodeReference = {
          node: testDep.node,
          from: testDep.from,
          as: {...terminal.test},
        };
        const consequent = buildBlockScope(fn, builder, terminal.consequent);
        const alternate = buildBlockScope(fn, builder, terminal.alternate);
        const ifNode: IfNode = {
          kind: 'If',
          alternate,
          consequent,
          id: builder.nextReactiveId,
          loc: terminal.loc,
          outputs: [],
          test,
        };
        builder.nodes.set(ifNode.id, ifNode);
        lastNode = ifNode;
        break;
      }
      case 'return': {
        const valueDep = builder.lookup(
          terminal.value.identifier,
          terminal.value.loc,
        );
        const value: NodeReference = {
          node: valueDep.node,
          from: valueDep.from,
          as: {...terminal.value},
        };
        const returnNode: ReturnNode = {
          kind: 'Return',
          id: builder.nextReactiveId,
          loc: terminal.loc,
          outputs: [],
          value,
        };
        builder.nodes.set(returnNode.id, returnNode);
        lastNode = returnNode;
        break;
      }
      case 'scope': {
        const body = buildBlockScope(fn, builder, terminal.block);
        const scopeNode: ScopeNode = {
          kind: 'Scope',
          body,
          dependencies: new Map(),
          id: builder.nextReactiveId,
          loc: terminal.scope.loc,
          outputs: [],
          scope: terminal.scope,
        };
        builder.nodes.set(scopeNode.id, scopeNode);
        lastNode = scopeNode;
        break;
      }
      case 'goto': {
        break;
      }
      default: {
        CompilerError.throwTodo({
          reason: `Support ${terminal.kind} nodes`,
          loc: terminal.loc,
        });
      }
    }

    // Continue iteration in the fallthrough
    const fallthrough = terminalFallthrough(terminal);
    if (fallthrough != null) {
      block = fn.body.blocks.get(fallthrough)!;
    } else {
      break;
    }
  }
  return lastNode.id;
}
