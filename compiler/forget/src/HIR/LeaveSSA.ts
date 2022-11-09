import { BasicBlock, HIRFunction, Identifier, Phi, Place } from "./HIR";
import { eachBlockOperand } from "./visitors";

/**
 * Leaves SSA form by building up a mapping of SSA'd {@link Identifier}s to their original
 * {@link Identifier}, then rewriting all {@link Place}s within a {@link BasicBlock} to reference
 * the original id. This allows us to skip adding instruction copies when removing {@link Phi}s,
 * while still allowing shadowing to work.
 */
export default function leaveSSA(fn: HIRFunction) {
  const ir = fn.body;
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

  for (const [, block] of ir.blocks) {
    for (const place of eachBlockOperand(block)) {
      const originalId = originalIdMap.get(place.identifier);
      if (originalId != null) {
        place.identifier = originalId;
      }
    }
  }
}
