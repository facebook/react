import invariant from "invariant";
import { assertExhaustive } from "../Common/utils";
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

const unsealedPreds: Map<BasicBlock, number> = new Map();

class SSABuilder {
  #states: Map<BasicBlock, State> = new Map();
  #current: BasicBlock | null = null;
  visitedBlocks: Set<BasicBlock> = new Set();
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

  definePlace(oldPlace: Place): Place {
    const oldId = oldPlace.identifier;
    const newId = { ...oldId, id: this.nextIdentifierId };
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
      console.log(
        `Unable to find "${printIdentifier(oldId)}", assuming it's a global`
      );
      return oldId;
    }

    if (unsealedPreds.get(block)! > 0) {
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

    // There are multiple predecessors, we need a phi.
    const newId = { ...oldId, id: this.nextIdentifierId };
    // Adding a phi may loop back to our block if there is a loop in the CFG.  We
    // update our defs before adding the phi to terminate the recursion rather than
    // looping infinitely.
    state.defs.set(oldId, newId);
    this.addPhi(block, oldId, newId);

    // TODO(gsn): Can we just return `newPlace` rather than looking it up?
    // `addPhi` _can_ mutate it, but _will_ it?
    return state.defs.get(oldId)!;
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
        text.push(`  \$${oldId}: \$${newId}`);
      }

      for (const incompletePhi of state.incompletePhis) {
        text.push(`  iphi \$${incompletePhi.newId} = \$${incompletePhi.oldId}`);
      }
    }

    text.push(`current block: bb${this.#current?.id}`);
    console.log(text.join("\n"));
  }
}

export default function buildSSA(func: HIRFunction, env: Environment) {
  const builder = new SSABuilder(env);
  function visit(blockId: BlockId) {
    const block = func.body.blocks.get(blockId)!;
    if (builder.visitedBlocks.has(block)) {
      return;
    }
    builder.visitedBlocks.add(block);

    builder.startBlock(block);
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
      if (unsealedPreds.has(output)) {
        count = unsealedPreds.get(output)! - 1;
      } else {
        count = output.preds.size - 1;
      }
      unsealedPreds.set(output, count);

      if (count == 0 && builder.visitedBlocks.has(output)) {
        builder.fixIncompletePhis(output);
      }
    }

    for (const output of outputs) {
      visit(output);
    }
  }

  visit(func.body.entry);
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
      for (const case_ of [...cases].reverse()) {
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
