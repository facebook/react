import { invariant } from "../CompilerError";
import { HIRFunction, Identifier, Place } from "./HIR";
import { eachInstructionOperand, eachTerminalOperand } from "./visitors";

export default function leaveSSA(fn: HIRFunction) {
  const ir = fn.body;
  const entryBlock = ir.blocks.get(ir.entry);
  invariant(entryBlock, "expected to find the entry basic block");
  const originalIdMap = new Map<
    /* SSA'd id */ Identifier,
    /* original id*/ Identifier
  >();

  for (const [, block] of ir.blocks) {
    for (const phi of block.phis) {
      originalIdMap.set(phi.id, phi.oldId);
      for (const [, ssaId] of phi.operands) {
        originalIdMap.set(ssaId, phi.oldId);
      }
    }
    block.phis.clear();
  }

  if (originalIdMap.size === 0) {
    return;
  }

  function tryRewrite(place: Place) {
    const originalId = originalIdMap.get(place.identifier);
    if (originalId != null) {
      place.identifier = originalId;
    }
  }

  for (const [, block] of ir.blocks) {
    for (const instr of block.instructions) {
      // LValues also need to be rewritten as they might be declaring or reassigning an identifier
      // that was previously SSA'd.
      if (instr.lvalue != null) {
        tryRewrite(instr.lvalue.place);
      }
      for (const place of eachInstructionOperand(instr)) {
        tryRewrite(place);
      }
    }
    for (const place of eachTerminalOperand(block.terminal)) {
      tryRewrite(place);
    }
  }
}
