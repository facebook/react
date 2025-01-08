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
  Place,
  ReactiveScope,
  ScopeId,
} from '../HIR';
import {printIdentifier, printInstruction} from '../HIR/PrintHIR';
import {
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  terminalFallthrough,
} from '../HIR/visitors';
import {getOrInsertWith} from '../Utils/utils';
import {
  AssignNode,
  BranchNode,
  ControlNode,
  EntryNode,
  InstructionNode,
  JoinNode,
  LoadArgumentNode,
  LoadLocalNode,
  makeReactiveId,
  NodeDependencies,
  NodeReference,
  PhiNode,
  populateReactiveGraphNodeOutputs,
  printReactiveGraph,
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
  const entryNode: EntryNode = {
    kind: 'Entry',
    id: builder.nextReactiveId,
    loc: fn.loc,
    outputs: [],
  };
  builder.putNode(entryNode);
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    const node: LoadArgumentNode = {
      kind: 'LoadArgument',
      id: builder.nextReactiveId,
      loc: place.loc,
      outputs: [],
      place: {...place},
      control: entryNode.id,
    };
    builder.putNode(node);
    context.recordDeclarationWrite(place.identifier.declarationId, node.id);
  }

  const exitNode = buildBlockScope(
    fn,
    builder,
    context,
    fn.body.entry,
    entryNode.id,
  );

  const graph = builder.build(fn, exitNode);

  console.log();
  console.log(printReactiveGraph(graph));

  populateReactiveGraphNodeOutputs(graph);
  reversePostorderReactiveGraph(graph);
  return graph;
}

/**
 * TODO:
 * The builder should store not all declarations, but a mapping of Instruction.lvalue to the node that produces
 * them. This means LoadLocal would populate this with a mapping of the loaded value to the node being loaded from.
 *
 * Then Context should store a parent pointer, and then store variable declarations from Declare/Store.
 *
 * In this model:
 *
 * - LoadLocal:
 *   - looks up the node to read from solely using context (potentially going to the parent)
 *   - stores that node into the builder's lvalue->node mapping
 *   - looks up the previous write in context, as a control (local context only)
 *   - stores the read into the context, to sequence reads/writes (in the local context)
 *   - emits no node
 *
 * - StoreLocal:
 *   - looks up the previous write/read in context, as a control (local context only)
 *   - stores the node into the builder's lvalue->node mapping
 *   - lookup the source node of the value from the builder's lvalue-node mapping
 *   - store the write into the current context
 *   - emit a Const/Let/Assign node
 *
 * Aside: collapse Const/Let/Assign to a single Node type with InstrKind variant.
 */
class Builder {
  #nextNodeId: number = 0;
  #environment: Map<IdentifierId, ReactiveId> = new Map();
  #nodes: Map<ReactiveId, ReactiveNode> = new Map();

  build(fn: HIRFunction, exit: ReactiveId): ReactiveGraph {
    const graph: ReactiveGraph = {
      async: fn.async,
      directives: fn.directives,
      env: fn.env,
      exit,
      fnType: fn.fnType,
      generator: fn.generator,
      id: fn.id,
      loc: fn.loc,
      nextNodeId: this.#nextNodeId,
      nodes: this.#nodes,
      params: fn.params,
    };
    return graph;
  }

  get nextReactiveId(): ReactiveId {
    return makeReactiveId(this.#nextNodeId++);
  }

  controlNode(control: ReactiveId, loc: SourceLocation): ReactiveId {
    const node: ControlNode = {
      kind: 'Control',
      id: this.nextReactiveId,
      loc,
      outputs: [],
      control,
      dependencies: [],
    };
    this.putNode(node);
    return node.id;
  }

  putNode(node: ReactiveNode): void {
    this.#nodes.set(node.id, node);
  }

  storeTemporary(place: Place, node: ReactiveId): void {
    this.#environment.set(place.identifier.id, node);
  }

  lookupTemporary(identifier: Identifier, loc: SourceLocation): ReactiveId {
    const dep = this.#environment.get(identifier.id);
    CompilerError.invariant(dep != null, {
      reason: `No source node for identifier ${printIdentifier(identifier)}`,
      loc,
    });
    return dep;
  }
}

class ControlContext {
  constructor(
    public declarations: Map<
      DeclarationId,
      {write: ReactiveId | null; read: ReactiveId | null}
    > = new Map(),
    public scopes: Map<ScopeId, ReactiveId> = new Map(),
    public parent: ControlContext | null = null,
  ) {}

  fork(): ControlContext {
    return new ControlContext(
      /*
       * We reset these maps so that the first reference of each declaration/scope within the branch
       * will depend on the branch's control. subsequent references can then refer to branch-local
       * instance
       */
      new Map(),
      new Map(),
      this,
    );
  }

  // Scopes

  recordScope(scope: ScopeId, node: ReactiveId): void {
    this.scopes.set(scope, node);
  }

  getScope(scope: ScopeId): ReactiveId | null {
    return this.scopes.get(scope) ?? null;
  }

  // Declarations

  // Loads the node that writes the value being read from
  loadDeclarationForRead(
    declarationId: DeclarationId,
    loc: SourceLocation,
  ): ReactiveId {
    const declaration = this.declarations.get(declarationId);
    if (declaration != null && declaration.write != null) {
      return declaration.write;
    }
    if (this.parent == null) {
      CompilerError.invariant(false, {
        reason: `Cannot find declaration #${declarationId}`,
        loc,
      });
    }
    return this.parent.loadDeclarationForRead(declarationId, loc);
  }

  /**
   * Determines the node that should be used as the *control* when reading,
   * which will be the last write in the current context, or null if there are
   * no writes in the current context
   */
  loadDeclarationControlForRead(
    declarationId: DeclarationId,
  ): ReactiveId | null {
    const declaration = this.declarations.get(declarationId);
    if (declaration == null || declaration.write == null) {
      return null;
    }
    return declaration.write;
  }

  /**
   * Determines the node that should be used as the control when writing,
   * which will be the last write *or read* in the current context, or null
   * if there are no reads/writes in the current context.
   */
  loadDeclarationControlForWrite(
    declarationId: DeclarationId,
    loc: SourceLocation,
  ): ReactiveId | null {
    const declaration = this.declarations.get(declarationId);
    if (declaration == null) {
      return null;
    }
    const source = declaration.read ?? declaration.write;
    CompilerError.invariant(source != null, {
      reason: `Expected declaration to have a write or read node`,
      loc,
    });
    return source;
  }

  recordDeclarationWrite(declarationId: DeclarationId, node: ReactiveId): void {
    const declaration = getOrInsertWith(
      this.declarations,
      declarationId,
      () => ({
        write: null,
        read: null,
      }),
    );
    declaration.write = node;
  }

  recordDeclarationRead(declarationId: DeclarationId, node: ReactiveId): void {
    const declaration = getOrInsertWith(
      this.declarations,
      declarationId,
      () => ({
        write: null,
        read: null,
      }),
    );
    declaration.read = node;
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
        // Find the node that defines the version of the value we are reading: the last write
        const source = context.loadDeclarationForRead(
          value.place.identifier.declarationId,
          value.place.loc,
        );
        /*
         * Determine the control, which is either the previous write in this context, or
         * the context's control
         */
        const instructionControl =
          context.loadDeclarationControlForRead(
            value.place.identifier.declarationId,
          ) ?? control;
        const node: LoadLocalNode = {
          kind: 'LoadLocal',
          control: instructionControl,
          id: builder.nextReactiveId,
          loc: value.loc,
          outputs: [],
          value: {
            node: source,
            from: value.place,
            as: lvalue,
          },
        };
        builder.putNode(node);
        lastNode = node.id;
        builder.storeTemporary(lvalue, node.id);
        // Record that we read so that subsequent writes can be sequenced after
        context.recordDeclarationRead(
          value.place.identifier.declarationId,
          node.id,
        );
      } else if (value.kind === 'StoreLocal') {
        /*
         * Determine the control, which is either the previous read/write in this context,
         * or the context's control
         */
        const instructionControl =
          context.loadDeclarationControlForWrite(
            value.lvalue.place.identifier.declarationId,
            value.lvalue.place.loc,
          ) ?? control;

        // Lookup the node that defines the temporary we're storing
        const valueNode = builder.lookupTemporary(
          value.value.identifier,
          value.value.loc,
        );

        const node: AssignNode = {
          kind: 'Assign',
          control: instructionControl,
          id: builder.nextReactiveId,
          instructionKind: value.lvalue.kind,
          loc: value.loc,
          lvalue: value.lvalue.place,
          outputs: [],
          value: {
            node: valueNode,
            from: value.value,
            as: value.value,
          },
        };
        builder.putNode(node);
        lastNode = node.id;
        builder.storeTemporary(lvalue, node.id);
        // Record that the value was written so subsequent reads/writes can be sequenced after
        context.recordDeclarationWrite(
          value.lvalue.place.identifier.declarationId,
          node.id,
        );
      } else if (
        value.kind === 'DeclareLocal' ||
        value.kind === 'Destructure' ||
        value.kind === 'PrefixUpdate' ||
        value.kind === 'PostfixUpdate'
      ) {
        CompilerError.throwTodo({
          reason: `Support ${value.kind} instructions similarly to StoreLocal`,
          loc: value.loc,
        });
      } else if (
        value.kind === 'DeclareContext' ||
        value.kind === 'StoreContext' ||
        value.kind === 'LoadContext'
      ) {
        CompilerError.throwTodo({
          reason: `Support ${value.kind} instructions`,
          loc: value.loc,
        });
      } else {
        for (const _ of eachInstructionValueLValue(value)) {
          CompilerError.invariant(false, {
            reason: `Expected all lvalue-producing instructions to be special-cased (got ${value.kind})`,
            loc: value.loc,
          });
        }
        const instructionScope = getScopeForInstruction(instr);
        let instructionControl = control;
        if (instructionScope != null) {
          const previousScopeNode = context.getScope(instructionScope.id);
          if (previousScopeNode != null) {
            instructionControl = previousScopeNode;
          }
        }

        const dependencies: NodeDependencies = new Map();
        for (const operand of eachInstructionValueOperand(instr.value)) {
          const dep = builder.lookupTemporary(operand.identifier, operand.loc);
          dependencies.set(dep, {
            from: {...operand},
            as: {...operand},
          });
        }
        const node: InstructionNode = {
          kind: 'Value',
          control: instructionControl,
          dependencies,
          id: builder.nextReactiveId,
          loc: instr.loc,
          outputs: [],
          value: instr,
        };
        builder.putNode(node);
        lastNode = node.id;
        builder.storeTemporary(lvalue, node.id);
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
        const testDep = builder.lookupTemporary(
          terminal.test.identifier,
          terminal.test.loc,
        );
        const test: NodeReference = {
          node: testDep,
          from: {...terminal.test},
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
        builder.putNode(branch);
        const consequentContext = context.fork();
        const consequentControl = builder.controlNode(branch.id, terminal.loc);
        const consequent = buildBlockScope(
          fn,
          builder,
          consequentContext,
          terminal.consequent,
          consequentControl,
        );
        const alternateContext = context.fork();
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
        for (const scope of consequentContext.scopes.keys()) {
          context.recordScope(scope, ifNode.id);
        }
        for (const scope of alternateContext.scopes.keys()) {
          context.recordScope(scope, ifNode.id);
        }

        // const redeclaredItems = new Set([
        //   ...consequentContext.declarations.keys(),
        //   ...alternateContext.declarations.keys(),
        // ]);
        // for (const redeclared of redeclaredItems) {
        //   const phiNode: PhiNode = {
        //     operands: new Set(),
        //   };
        //   const existingPhi = Array.from(
        //     fn.body.blocks.get(terminal.fallthrough)!.phis,
        //   ).find(phi => phi.place.identifier.declarationId === redeclared);
        //   CompilerError.invariant(existingPhi != null, {
        //     reason: `Could not find phi for declaration id '${redeclared}'`,
        //     loc: terminal.loc,
        //   });
        //   if (consequentContext.declarations.has(redeclared)) {
        //     phiNode.operands.add(consequent);
        //   }
        //   if (alternateContext.declarations.has(redeclared)) {
        //     phiNode.operands.add(alternate);
        //   }
        //   if (phiNode.operands.size === 1) {
        //     phiNode.operands.add(branch.id);
        //   }
        //   ifNode.phis.set(redeclared, phiNode);

        //   const previousDeclaration = context.getDeclarationId(redeclared);
        //   if (previousDeclaration != null) {
        //     branch.dependencies.push(previousDeclaration);
        //   }
        //   context.recordDeclarationWrite(
        //     existingPhi.place.identifier,
        //     ifNode.id,
        //   );
        //   builder.storeTemporary(existingPhi.place, ifNode.id);
        // }

        builder.putNode(ifNode);
        lastNode = ifNode.id;
        break;
      }
      case 'return': {
        const valueDep = builder.lookupTemporary(
          terminal.value.identifier,
          terminal.value.loc,
        );
        const value: NodeReference = {
          node: valueDep,
          from: {...terminal.value},
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
        builder.putNode(returnNode);
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
        builder.putNode(scopeNode);
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
