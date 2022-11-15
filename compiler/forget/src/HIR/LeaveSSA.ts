import { HIRFunction } from "./HIR";
import { eachBlockOperand } from "./visitors";

/**
 * Removes SSA form by restoring each `Identifier.id` value to its pre-SSA value,
 * and removing all phi nodes.
 */
export default function leaveSSA(fn: HIRFunction) {
  const ir = fn.body;

  for (const param of fn.params) {
    param.identifier.id = param.identifier.preSsaId ?? param.identifier.id;
  }

  for (const [, block] of ir.blocks) {
    block.phis.clear();
  }

  for (const [, block] of ir.blocks) {
    for (const place of eachBlockOperand(block)) {
      place.identifier.id = place.identifier.preSsaId ?? place.identifier.id;
    }
  }
}
