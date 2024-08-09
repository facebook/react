import {CompilerError} from '..';
import {
  BlockId,
  DeclarationId,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  Instruction,
  InstructionId,
  isMutableEffect,
  Phi,
  ScopeId,
  SpreadPattern,
  Terminal,
} from '../HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
  terminalFallthrough,
} from '../HIR/visitors';
import {retainWhere} from '../Utils/utils';

/**
 * New algorithm
 *
 * - build a graph of nodes
 * - nodes are instructions, blocks, or terminals and have dependencies on other nodes
 * - instruction nodes depend on:
 *   - their operands
 *   - Loads depend on the last assignment of that declaration
 *   - for side-effecting instructions, they depend on the last side-effect on each
 *     operand OR the current block id, whichever is closer.
 *     This handles the case of `let x = []; if (cond) { x.push(y) }` where the
 *     x.push() has to be part of the conditioonal block, it can't just depend on the
 *     let x declaration.
 * - terminal nodes represent terminal nodes... do we care about whether the terminal
 *   post-dominates the fallthrough? in any case depends on:
 *   - the terminal's operands
 *   - the successor blocks
 *   - the last assignment of each of the terminal's fallthrough phis
 *
 *
 *
 * rewriting/optimization passes:
 *
 * 1) minimize scope overlap: reorder overlapping but orthogonal scopes so that
 *    they can be memoized independently. must run after assigning scope ids.
 *    solves problem of user wrote mutations in a suboptimal ordering.
 *    ex:
 *
 *    const a = [];
 *    const b = [];
 *    mut(a);
 *    mut(b);
 *
 *    =>
 *
 *    const a = [];
 *    mut(a);
 *    const b = [];
 *    mut(b);
 *
 * 2) bring dependencies closer to their consuming instructions, to avoid having
 *    unnecessary scope declarations/dependencies. solves the problem of
 *    strict order of evaluation causing eg LoadGlobal primitive, loadlocal instrs
 *    to be emitted within a scope and thefore add decls/deps to that scope, when
 *    they could have been emitted later and avoided that.
 *
 *    ex:
 *
 *    const x = []
 *    return <Foo a={a} x={mut(x)} />
 *
 *    memoizes as
 *
 *    let x;
 *    let t0;
 *    let T1;
 *    if ($[0] !== a) {
 *      x = []
 *      t0 = a; // <--- causes `x` to depend on a, extra dep+decl
 *      T1 = Foo; // <--- extra decl
 *      mut(x);
 *      $[1] = x;
 *      $[2] = a
 *      $[3] = T1
 *    } else { ... }
 *    let t2;
 *    if ($[4] !== t0 || $[5] !== x) {
 *       t2 = <T1 a={t0} x={x} />
 *    } else { ... }
 *
 * 3) reordering scopes and their intermediary instructions to maximize merging
 *    of scopes.
 *
 * 4)
 *
 */
export function instructionScheduling(fn: HIRFunction): void {
  type Node = InstructionNode | BlockNode;
  type InstructionNode = {
    kind: 'instruction';
    id: InstructionId;
    instruction: Instruction;
    dependencies: Set<InstructionId>;
  };
  type BlockNode = {
    kind: 'block';
    id: InstructionId;
    terminal: Terminal;
    dependencies: Set<InstructionId>;
    phis: Set<Phi>;
  };
  const exitNodes = new Set<InstructionId>();
  const nodes = new Map<InstructionId, Node>();
  function getNode(id: InstructionId): Node {
    const node = nodes.get(id);
    if (node == undefined) {
      CompilerError.invariant(false, {
        reason: `Expected to find a node for instruction`,
        description: `No node for instruction [${id}]`,
        loc: GeneratedSource,
      });
    }
    return node;
  }

  const params = new Set<IdentifierId>();
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    params.add(place.identifier.id);
  }

  const definitions = new Map<IdentifierId, InstructionId>();
  function getDefinition(id: IdentifierId): InstructionId | null {
    const def = definitions.get(id);
    if (def === undefined) {
      if (params.has(id)) {
        return null;
      }
      CompilerError.invariant(false, {
        reason: `Expected to find an instruction for identifier`,
        description: `No instruction for $${id}`,
        loc: GeneratedSource,
      });
    }
    return def;
  }

  const mutations = new Map<DeclarationId, InstructionId>();
  const scopeMutations = new Map<ScopeId, InstructionId>();

  const activeFallthroughs: Array<{start: InstructionId; end: BlockId}> = [];
  for (const [, block] of fn.body.blocks) {
    const {instructions, terminal} = block;
    retainWhere(activeFallthroughs, active => active.end !== block.id);
    const parentBlock = activeFallthroughs.at(-1);
    const parentNode =
      parentBlock !== undefined ? getNode(parentBlock.start) : null;

    for (const instr of instructions) {
      const node: InstructionNode = {
        kind: 'instruction',
        id: instr.id,
        instruction: instr,
        dependencies: new Set(),
      };
      for (const operand of eachInstructionValueOperand(instr.value)) {
        const scope = operand.identifier.scope;
        if (
          scope !== null &&
          instr.id >= scope.range.start &&
          instr.id < scope.range.end
        ) {
          const lastMutation = scopeMutations.get(scope.id);
          if (lastMutation !== undefined) {
            let dependencyId = lastMutation;
            if (parentNode !== null && parentNode.id > lastMutation) {
              parentNode.dependencies.add(lastMutation);
              dependencyId = parentNode.id;
            }
            node.dependencies.add(dependencyId);
          }
          scopeMutations.set(scope.id, instr.id);
        }
      }
      for (const lvalue of eachInstructionLValue(instr)) {
        const lastMutation = mutations.get(lvalue.identifier.declarationId);
        if (lastMutation !== undefined) {
          let dependencyId = lastMutation;
          if (parentNode !== null && parentNode.id > lastMutation) {
            parentNode.dependencies.add(lastMutation);
            dependencyId = parentNode.id;
          }
          node.dependencies.add(dependencyId);
        }
        mutations.set(lvalue.identifier.declarationId, instr.id);
        definitions.set(lvalue.identifier.id, instr.id);
      }
    }

    const terminalNode: BlockNode = {
      kind: 'block',
      terminal,
      id: terminal.id,
      phis: new Set(),
      dependencies: new Set(),
    };
    const fallthrough = terminalFallthrough(terminal);
    if (fallthrough !== null) {
      const fallthroughBlock = fn.body.blocks.get(fallthrough)!;
      terminalNode.phis = fallthroughBlock.phis;
      activeFallthroughs.push({
        start: terminal.id,
        end: fallthrough,
      });
    }
    for (const operand of eachTerminalOperand(terminal)) {
      const defininingId = getDefinition(operand.identifier.id);
      if (defininingId !== null) {
        terminalNode.dependencies.add(defininingId);
      }
    }
    if (terminal.kind === 'return' || terminal.kind === 'throw') {
      exitNodes.add(terminal.id);
    }
  }
}
