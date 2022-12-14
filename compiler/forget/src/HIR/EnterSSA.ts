import { invariant } from "../CompilerError";
import {
  BasicBlock,
  HIRFunction,
  Identifier,
  IdentifierId,
  makeInstructionId,
  makeType,
  Phi,
  Place,
} from "./HIR";
import { Environment } from "./HIRBuilder";
import { printIdentifier } from "./PrintHIR";
import {
  eachTerminalSuccessor,
  mapInstructionOperands,
  mapTerminalOperands,
} from "./visitors";

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
  #env: Environment;

  constructor(env: Environment) {
    this.#env = env;
  }

  get nextSsaId(): IdentifierId {
    return this.#env.nextIdentifierId;
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

  definePlace(oldPlace: Place): Place {
    const oldId = oldPlace.identifier;
    const newId = this.makeId(oldId);
    this.state().defs.set(oldId, newId);
    return {
      ...oldPlace,
      identifier: newId,
    };
  }

  getPlace(oldPlace: Place): Place {
    const newId = this.getIdAt(oldPlace.identifier, this.#current!);
    return {
      ...oldPlace,
      identifier: newId,
    };
  }

  getIdAt(oldId: Identifier, block: BasicBlock): Identifier {
    // check if Place is defined locally
    const state = this.#states.get(block)!;

    if (state.defs.has(oldId)) {
      return state.defs.get(oldId)!;
    }

    if (block.preds.size == 0) {
      // We're at the entry block and haven't found our defintion yet.
      // console.log(
      //   `Unable to find "${printIdentifier(oldId)}", assuming it's a global`
      // );
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
    const predDefs: Map<BasicBlock, Identifier> = new Map();
    for (const predBlock of block.preds) {
      const predId = this.getIdAt(oldId, predBlock);
      predDefs.set(predBlock, predId);
    }

    const phi: Phi = {
      kind: "Phi",
      id: newId,
      operands: predDefs,
    };

    block.phis.add(phi);
    return newId;
  }

  fixIncompletePhis(block: BasicBlock) {
    const state = this.#states.get(block)!;
    for (const phi of state.incompletePhis) {
      this.addPhi(block, phi.oldId, phi.newId);
    }
  }

  startBlock(block: BasicBlock) {
    this.#current = block;
    this.#states.set(block, {
      defs: new Map(),
      incompletePhis: [],
    });
  }

  print() {
    const text = [];
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

export default function enterSSA(func: HIRFunction, env: Environment) {
  const visitedBlocks: Set<BasicBlock> = new Set();
  const builder = new SSABuilder(env);
  for (const [blockId, block] of func.body.blocks) {
    invariant(
      !visitedBlocks.has(block),
      `found a cycle! visiting bb${block.id} again`
    );
    visitedBlocks.add(block);

    builder.startBlock(block);

    if (func.body.entry === blockId) {
      func.params = func.params.map((p) => builder.definePlace(p));
    }

    for (const instr of block.instructions) {
      mapInstructionOperands(instr, (place) => builder.getPlace(place));

      if (instr.lvalue != null) {
        const oldPlace = instr.lvalue.place;
        let newPlace: Place;
        if (oldPlace.memberPath !== null) {
          newPlace = builder.getPlace(oldPlace);
        } else {
          newPlace = builder.definePlace(oldPlace);
        }
        instr.lvalue.place = newPlace;
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
