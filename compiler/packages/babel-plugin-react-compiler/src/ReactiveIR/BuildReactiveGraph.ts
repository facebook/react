/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, SourceLocation} from '..';
import {
  BlockId,
  DeclarationId,
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  InstructionKind,
  Place,
  ReactiveScope,
  ScopeId,
} from '../HIR';
import {printIdentifier, printInstruction, printPlace} from '../HIR/PrintHIR';
import {
  eachInstructionLValue,
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  terminalFallthrough,
} from '../HIR/visitors';
import {
  BranchNode,
  ConstNode,
  ControlNode,
  EntryNode,
  InstructionNode,
  JoinNode,
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
  const context = new ControlContext();
  const control: EntryNode = {
    kind: 'Entry',
    id: builder.nextReactiveId,
    loc: fn.loc,
    outputs: [],
  };
  builder.nodes.set(control.id, control);
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    const node: LoadArgumentNode = {
      kind: 'LoadArgument',
      id: builder.nextReactiveId,
      loc: place.loc,
      outputs: [],
      place: {...place},
      control: control.id,
    };
    builder.nodes.set(node.id, node);
    builder.declare(place, node.id);
    context.recordDeclaration(place.identifier, node.id);
  }

  const exitNode = buildBlockScope(
    fn,
    builder,
    context,
    fn.body.entry,
    control.id,
  );

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

  declare(place: Place, node: ReactiveId): void {
    this.#environment.set(place.identifier.id, {node, from: place});
  }

  controlNode(control: ReactiveId, loc: SourceLocation): ReactiveId {
    const node: ControlNode = {
      kind: 'Control',
      id: this.nextReactiveId,
      loc,
      outputs: [],
      control,
    };
    this.nodes.set(node.id, node);
    return node.id;
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

class ControlContext {
  constructor(
    private declarations: Map<DeclarationId, ReactiveId> = new Map(),
    private scopes: Map<ScopeId, ReactiveId> = new Map(),
  ) {}

  clone(): ControlContext {
    return new ControlContext(new Map(this.declarations), new Map(this.scopes));
  }

  recordScope(scope: ScopeId, node: ReactiveId): void {
    this.scopes.set(scope, node);
  }

  getScope(scope: ScopeId): ReactiveId | undefined {
    return this.scopes.get(scope);
  }

  recordDeclaration(identifier: Identifier, node: ReactiveId): void {
    this.declarations.set(identifier.declarationId, node);
  }

  getDeclaration(identifier: Identifier): ReactiveId | undefined {
    return this.declarations.get(identifier.declarationId);
  }

  assertDeclaration(identifier: Identifier, loc: SourceLocation): ReactiveId {
    const id = this.declarations.get(identifier.declarationId);
    CompilerError.invariant(id != null, {
      reason: `Could not find declaration for ${printIdentifier(identifier)}`,
      loc,
    });
    return id;
  }
}

function buildBlockScope(
  fn: HIRFunction,
  builder: Builder,
  context: ControlContext,
  entry: BlockId,
  control: ReactiveId,
): ReactiveId {
  let block = fn.body.blocks.get(entry)!;
  let lastNode = control;
  while (true) {
    // iterate instructions of the block
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      if (value.kind === 'LoadLocal') {
        const declaration = context.assertDeclaration(
          value.place.identifier,
          value.place.loc,
        );
        builder.declare(lvalue, declaration);
      } else if (
        value.kind === 'StoreLocal' &&
        value.lvalue.kind === InstructionKind.Const
      ) {
        const dep = builder.lookup(value.value.identifier, value.value.loc);
        const node: ConstNode = {
          kind: 'Const',
          id: builder.nextReactiveId,
          loc: value.loc,
          lvalue: value.lvalue.place,
          outputs: [],
          value: {
            node: dep.node,
            from: dep.from,
            as: value.value,
          },
          control,
        };
        builder.nodes.set(node.id, node);
        builder.declare(lvalue, node.id);
        builder.declare(value.lvalue.place, node.id);
        context.recordDeclaration(value.lvalue.place.identifier, node.id);
      } else if (
        value.kind === 'StoreLocal' &&
        value.lvalue.kind === InstructionKind.Let
      ) {
        CompilerError.throwTodo({
          reason: `Handle StoreLocal kind ${value.lvalue.kind}`,
          loc: value.loc,
        });
      } else if (
        value.kind === 'StoreLocal' &&
        value.lvalue.kind === InstructionKind.Reassign
      ) {
        CompilerError.throwTodo({
          reason: `Handle StoreLocal kind ${value.lvalue.kind}`,
          loc: value.loc,
        });
      } else if (value.kind === 'StoreLocal') {
        CompilerError.throwTodo({
          reason: `Handle StoreLocal kind ${value.lvalue.kind}`,
          loc: value.loc,
        });
      } else if (
        value.kind === 'Destructure' ||
        value.kind === 'PrefixUpdate' ||
        value.kind === 'PostfixUpdate'
      ) {
        CompilerError.throwTodo({
          reason: `Handle ${value.kind}`,
          loc: value.loc,
        });
      } else {
        for (const _ of eachInstructionValueLValue(value)) {
          CompilerError.invariant(false, {
            reason: `Expected all lvalue-producing instructions to be special-cased (got ${value.kind})`,
            loc: value.loc,
          });
        }
        const dependencies: NodeDependencies = new Map();
        for (const operand of eachInstructionValueOperand(instr.value)) {
          const dep = builder.lookup(operand.identifier, operand.loc);
          dependencies.set(dep.node, {
            from: {...dep.from},
            as: {...operand},
          });
        }
        let scopeControl = control;
        const affectedScope = getScopeForInstruction(instr);
        if (affectedScope != null) {
          const previousScopeNode = context.getScope(affectedScope.id);
          scopeControl = previousScopeNode ?? scopeControl;
        }
        const node: InstructionNode = {
          kind: 'Value',
          control: scopeControl,
          dependencies,
          id: builder.nextReactiveId,
          loc: instr.loc,
          outputs: [],
          value: instr,
        };
        if (affectedScope != null) {
          context.recordScope(affectedScope.id, node.id);
        }
        builder.nodes.set(node.id, node);
        lastNode = node.id;
        for (const lvalue of eachInstructionLValue(instr)) {
          builder.declare(lvalue, node.id);
        }
      }
    }

    // handle the terminal
    const terminal = block.terminal;
    switch (terminal.kind) {
      case 'if': {
        /*
         * TODO: we need to see what things the consequent/alternate depended on
         * as mutation/reassignment deps, and then add those as control deps of
         * the if. this ensures that anything depended on in the body will come
         * first.
         *
         * Can likely have a cloneable mapping of the last node for each
         * DeclarationId/ScopeId, and also record which DeclId/ScopeId was accessed
         * during a call to buildBlockScope, and then look at that after processing
         * consequent/alternate
         */
        const testDep = builder.lookup(
          terminal.test.identifier,
          terminal.test.loc,
        );
        const test: NodeReference = {
          node: testDep.node,
          from: testDep.from,
          as: {...terminal.test},
        };
        const branch: BranchNode = {
          kind: 'Branch',
          control,
          dependencies: [],
          id: builder.nextReactiveId,
          loc: terminal.loc,
          outputs: [],
        };
        builder.nodes.set(branch.id, branch);
        const consequentContext = context.clone();
        const consequentControl = builder.controlNode(branch.id, terminal.loc);
        const consequent = buildBlockScope(
          fn,
          builder,
          consequentContext,
          terminal.consequent,
          consequentControl,
        );
        const alternateContext = context.clone();
        const alternateControl = builder.controlNode(branch.id, terminal.loc);
        const alternate =
          terminal.alternate !== terminal.fallthrough
            ? buildBlockScope(
                fn,
                builder,
                alternateContext,
                terminal.alternate,
                alternateControl,
              )
            : alternateControl;
        const ifNode: JoinNode = {
          kind: 'Join',
          control: branch.id,
          id: builder.nextReactiveId,
          loc: terminal.loc,
          outputs: [],
          phis: new Map(),
          terminal: {
            kind: 'If',
            test,
            consequent,
            alternate,
          },
        };
        builder.nodes.set(ifNode.id, ifNode);
        lastNode = ifNode.id;
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
          control,
        };
        builder.nodes.set(returnNode.id, returnNode);
        lastNode = returnNode.id;
        break;
      }
      case 'scope': {
        const body = buildBlockScope(
          fn,
          builder,
          context,
          terminal.block,
          control,
        );
        const scopeNode: ScopeNode = {
          kind: 'Scope',
          body,
          dependencies: new Map(),
          id: builder.nextReactiveId,
          loc: terminal.scope.loc,
          outputs: [],
          scope: terminal.scope,
          control,
        };
        builder.nodes.set(scopeNode.id, scopeNode);
        lastNode = scopeNode.id;
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
  return lastNode;
}

function getScopeForInstruction(instr: Instruction): ReactiveScope | null {
  let scope: ReactiveScope | null = null;
  for (const operand of eachInstructionValueOperand(instr.value)) {
    if (
      operand.identifier.scope == null ||
      instr.id < operand.identifier.scope.range.start ||
      instr.id >= operand.identifier.scope.range.end
    ) {
      continue;
    }
    CompilerError.invariant(
      scope == null || operand.identifier.scope.id === scope.id,
      {
        reason: `Multiple scopes for instruction ${printInstruction(instr)}`,
        loc: instr.loc,
      },
    );
    scope = operand.identifier.scope;
  }
  return scope;
}
