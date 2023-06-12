/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { CompilerError } from "../CompilerError";
import { Environment } from "../HIR/Environment";
import {
  BasicBlock,
  BlockId,
  HIRFunction,
  Identifier,
  IdentifierId,
  makeInstructionId,
  makeType,
  Phi,
  Place,
} from "../HIR/HIR";
import { printIdentifier } from "../HIR/PrintHIR";
import {
  eachTerminalSuccessor,
  mapInstructionLValues,
  mapInstructionOperands,
  mapTerminalOperands,
} from "../HIR/visitors";

type IncompletePhi = {
  oldId: Identifier;
  newId: Identifier;
};

type State = {
  defs: Map<Identifier, Identifier>;
  incompletePhis: IncompletePhi[];
};

class SSABuilder {
  #states: Map<BasicBlock, State> = new Map();
  #current: BasicBlock | null = null;
  unsealedPreds: Map<BasicBlock, number> = new Map();
  #blocks: Map<BlockId, BasicBlock>;
  #env: Environment;
  #unknown: Set<Identifier> = new Set();
  #context: Set<Identifier> = new Set();

  constructor(env: Environment, blocks: ReadonlyMap<BlockId, BasicBlock>) {
    this.#blocks = new Map(blocks);
    this.#env = env;
  }

  get nextSsaId(): IdentifierId {
    return this.#env.nextIdentifierId;
  }

  defineFunction(func: HIRFunction): void {
    for (const [id, block] of func.body.blocks) {
      this.#blocks.set(id, block);
    }
  }

  enter(fn: () => void): void {
    const current = this.#current;
    fn();
    this.#current = current;
  }

  state(): State {
    invariant(
      this.#current !== null,
      "we need to be in a block to access state!"
    );
    return this.#states.get(this.#current)!;
  }

  makeId(oldId: Identifier): Identifier {
    return {
      id: this.nextSsaId,
      name: oldId.name,
      mutableRange: {
        start: makeInstructionId(0),
        end: makeInstructionId(0),
      },
      scope: null, // reset along w the mutable range
      type: makeType(),
    };
  }

  defineContext(oldPlace: Place): Place {
    const newPlace = this.definePlace(oldPlace);
    this.#context.add(oldPlace.identifier);
    return newPlace;
  }

  definePlace(oldPlace: Place): Place {
    const oldId = oldPlace.identifier;
    if (this.#unknown.has(oldId)) {
      CompilerError.invariant(
        `EnterSSA: Expected identifier to be defined before being used`,
        oldPlace.loc,
        `Identifier ${printIdentifier(oldId)} is undefined`
      );
    }

    // Do not redefine context references.
    if (this.#context.has(oldId)) {
      return this.getPlace(oldPlace);
    }

    const newId = this.makeId(oldId);
    this.state().defs.set(oldId, newId);
    return {
      ...oldPlace,
      identifier: newId,
    };
  }

  getPlace(oldPlace: Place): Place {
    const newId = this.getIdAt(oldPlace.identifier, this.#current!.id);
    return {
      ...oldPlace,
      identifier: newId,
    };
  }

  getIdAt(oldId: Identifier, blockId: BlockId): Identifier {
    // check if Place is defined locally
    const block = this.#blocks.get(blockId)!;
    const state = this.#states.get(block)!;

    if (state.defs.has(oldId)) {
      return state.defs.get(oldId)!;
    }

    if (block.preds.size == 0) {
      // We're at the entry block and haven't found our defintion yet.
      // console.log(
      //   `Unable to find "${printIdentifier(
      //     oldId
      //   )}" in bb${blockId}, assuming it's a global`
      // );
      this.#unknown.add(oldId);
      return oldId;
    }

    if (this.unsealedPreds.get(block)! > 0) {
      // We haven't visited all our predecessors, let's place an incomplete phi
      // for now.
      const newId = this.makeId(oldId);
      state.incompletePhis.push({ oldId, newId });
      state.defs.set(oldId, newId);
      return newId;
    }

    // Only one predecessor, let's check there
    if (block.preds.size == 1) {
      const [pred] = block.preds;
      const newId = this.getIdAt(oldId, pred);
      state.defs.set(oldId, newId);
      return newId;
    }

    // There are multiple predecessors, we may need a phi.
    const newId = this.makeId(oldId);
    // Adding a phi may loop back to our block if there is a loop in the CFG.  We
    // update our defs before adding the phi to terminate the recursion rather than
    // looping infinitely.
    state.defs.set(oldId, newId);
    return this.addPhi(block, oldId, newId);
  }

  addPhi(block: BasicBlock, oldId: Identifier, newId: Identifier): Identifier {
    const predDefs: Map<BlockId, Identifier> = new Map();
    for (const predBlockId of block.preds) {
      const predId = this.getIdAt(oldId, predBlockId);
      predDefs.set(predBlockId, predId);
    }

    const phi: Phi = {
      kind: "Phi",
      id: newId,
      operands: predDefs,
      type: makeType(),
    };

    block.phis.add(phi);
    return newId;
  }

  fixIncompletePhis(block: BasicBlock): void {
    const state = this.#states.get(block)!;
    for (const phi of state.incompletePhis) {
      this.addPhi(block, phi.oldId, phi.newId);
    }
  }

  startBlock(block: BasicBlock): void {
    this.#current = block;
    this.#states.set(block, {
      defs: new Map(),
      incompletePhis: [],
    });
  }

  print(): void {
    const text: string[] = [];
    for (const [block, state] of this.#states) {
      text.push(`bb${block.id}:`);
      for (const [oldId, newId] of state.defs) {
        text.push(`  \$${printIdentifier(oldId)}: \$${printIdentifier(newId)}`);
      }

      for (const incompletePhi of state.incompletePhis) {
        text.push(
          `  iphi \$${printIdentifier(
            incompletePhi.newId
          )} = \$${printIdentifier(incompletePhi.oldId)}`
        );
      }
    }

    text.push(`current block: bb${this.#current?.id}`);
    console.log(text.join("\n"));
  }
}

export default function enterSSA(func: HIRFunction): void {
  const builder = new SSABuilder(func.env, func.body.blocks);
  enterSSAImpl(func, builder, func.body.entry);
}

function enterSSAImpl(
  func: HIRFunction,
  builder: SSABuilder,
  rootEntry: BlockId
): void {
  const visitedBlocks: Set<BasicBlock> = new Set();
  for (const [blockId, block] of func.body.blocks) {
    invariant(
      !visitedBlocks.has(block),
      `found a cycle! visiting bb${block.id} again`
    );
    visitedBlocks.add(block);

    builder.startBlock(block);

    if (blockId === rootEntry) {
      // NOTE: func.context should be empty for the root function
      if (func.env.enableOptimizeFunctionExpressions) {
        if (func.context.length !== 0) {
          CompilerError.invariant(
            `Expected function context to be empty for outer function declarations`,
            func.loc
          );
        }
      } else {
        func.context = func.context.map((p) => builder.defineContext(p));
      }
      func.params = func.params.map((p) => builder.definePlace(p));
    }

    for (const instr of block.instructions) {
      mapInstructionLValues(instr, (lvalue) => builder.definePlace(lvalue));
      mapInstructionOperands(instr, (place) => builder.getPlace(place));

      if (
        instr.value.kind === "FunctionExpression" &&
        func.env.enableOptimizeFunctionExpressions
      ) {
        const loweredFunc = instr.value.loweredFunc;
        const entry = loweredFunc.body.blocks.get(loweredFunc.body.entry)!;
        invariant(
          entry.preds.size === 0,
          "Expected function expression entry block to have zero predecessors"
        );
        entry.preds.add(blockId);
        builder.defineFunction(loweredFunc);
        builder.enter(() => {
          loweredFunc.context = loweredFunc.context.map((p) =>
            builder.getPlace(p)
          );
          loweredFunc.params = loweredFunc.params.map((p) =>
            builder.definePlace(p)
          );
          enterSSAImpl(loweredFunc, builder, rootEntry);
        });
        entry.preds.clear();
      }
    }

    mapTerminalOperands(block.terminal, (place) => builder.getPlace(place));
    for (const outputId of eachTerminalSuccessor(block.terminal)) {
      const output = func.body.blocks.get(outputId)!;
      let count;
      if (builder.unsealedPreds.has(output)) {
        count = builder.unsealedPreds.get(output)! - 1;
      } else {
        count = output.preds.size - 1;
      }
      builder.unsealedPreds.set(output, count);

      if (count === 0 && visitedBlocks.has(output)) {
        builder.fixIncompletePhis(output);
      }
    }
  }
}
