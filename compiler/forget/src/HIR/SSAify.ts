import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import {
  BasicBlock,
  BlockId,
  HIRFunction,
  Identifier,
  Instruction,
  Phi,
  Place,
} from "./HIR";
import { Environment } from "./HIRBuilder";
import { printIdentifier } from "./PrintHIR";

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

  get nextIdentifierId() {
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
      id: this.nextIdentifierId,
      name: oldId.name,
      mutableRange: {
        start: 0,
        end: 0,
      },
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
      const newId = { ...oldId, id: this.nextIdentifierId };
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
    return this.maybeAddPhi(block, oldId, state);
  }

  maybeAddPhi(block: BasicBlock, oldId: Identifier, state: State): Identifier {
    // Adding a phi may loop back to our block if there is a loop in the CFG.  We
    // update our defs before adding the phi to terminate the recursion rather than
    // looping infinitely.
    const newId = this.makeId(oldId);
    state.defs.set(oldId, newId);

    const predDefs: Map<BasicBlock, Identifier> = new Map();
    const predIds: Set<Identifier> = new Set();
    for (const predBlock of block.preds) {
      const predId = this.getIdAt(oldId, predBlock);
      predDefs.set(predBlock, predId);
      predIds.add(predId);
    }

    // if all predecessors have the same id, then there is no need for a phi node.
    // note that in the case of a loop there are guaranteed to be multiple values,
    // since we have already updated this block with a new identifier to terminate
    // the recursion
    if (predIds.size === 1) {
      // there was only a single incoming id so we don't need a phi node,
      // replace with that incoming id instead
      const predId = [...predIds][0]!;
      state.defs.set(oldId, predId);
      return predId;
    }

    const phi: Phi = {
      kind: "Phi",
      id: newId,
      operands: predDefs,
    };

    block.phis.add(phi);
    return newId;
  }

  addPhi(block: BasicBlock, oldId: Identifier, newId: Identifier) {
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

export default function buildSSA(func: HIRFunction, env: Environment) {
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
      rewriteUses(instr, builder);

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

    const outputs = rewriteUsesAndCollectOutputs(block, builder);
    const outputBlocks = outputs.map((id) => func.body.blocks.get(id)!);
    for (const output of outputBlocks) {
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

function rewriteUsesAndCollectOutputs(
  block: BasicBlock,
  builder: SSABuilder
): Array<BlockId> {
  const outputs: Array<BlockId> = [];
  const { terminal } = block;
  switch (terminal.kind) {
    case "return":
    case "throw": {
      if (terminal.value) {
        terminal.value = builder.getPlace(terminal.value);
      }
      break;
    }
    case "goto": {
      outputs.push(terminal.block);
      break;
    }
    case "if": {
      const { consequent, alternate } = terminal;
      terminal.test = builder.getPlace(terminal.test);
      outputs.push(alternate);
      outputs.push(consequent);
      break;
    }
    case "switch": {
      const { cases } = terminal;
      terminal.test = builder.getPlace(terminal.test);
      for (const case_ of [...cases]) {
        if (case_.test) {
          case_.test = builder.getPlace(case_.test);
        }
        outputs.push(case_.block);
      }
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any).kind}'`
      );
    }
  }

  return outputs;
}

function rewriteUses(instr: Instruction, builder: SSABuilder) {
  const instrValue = instr.value;

  switch (instrValue.kind) {
    case "BinaryExpression": {
      instrValue.left = builder.getPlace(instrValue.left);
      instrValue.right = builder.getPlace(instrValue.right);
      break;
    }
    case "Identifier": {
      instr.value = builder.getPlace(instrValue);
      break;
    }
    case "NewExpression":
    case "CallExpression": {
      instrValue.callee = builder.getPlace(instrValue.callee);
      instrValue.args = instrValue.args.map((arg) => builder.getPlace(arg));
      break;
    }
    case "UnaryExpression": {
      instrValue.value = builder.getPlace(instrValue.value);
      break;
    }
    case "JsxExpression": {
      instrValue.tag = builder.getPlace(instrValue.tag);
      for (const [prop, place] of instrValue.props) {
        instrValue.props.set(prop, builder.getPlace(place));
      }
      if (instrValue.children) {
        instrValue.children = instrValue.children.map((p) =>
          builder.getPlace(p)
        );
      }
      break;
    }
    case "ObjectExpression": {
      if (instrValue.properties !== null) {
        const props = instrValue.properties;
        for (const [prop, place] of props) {
          props.set(prop, builder.getPlace(place));
        }
      }
      break;
    }
    case "ArrayExpression": {
      instrValue.elements = instrValue.elements.map((e) => builder.getPlace(e));
      break;
    }
    case "OtherStatement":
    case "Primitive":
    case "JSXText": {
      break;
    }
    default: {
      assertExhaustive(instrValue, "Unexpected instruction kind");
    }
  }
}
