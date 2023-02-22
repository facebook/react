import { HIRFunction, Identifier, InstructionId } from "../HIR/HIR";
import DisjointSet from "../Utils/DisjointSet";

export function inferMutableRangesForAlias(
  fn: HIRFunction,
  aliases: DisjointSet<Identifier>
) {
  const aliasSets = aliases.buildSets();
  for (const aliasSet of aliasSets) {
    // Update mutableRange.end only if the identifiers have actually been
    // mutated.
    const mutatingIdentifiers = [...aliasSet].filter(
      (id) => id.mutableRange.end - id.mutableRange.start > 1
    );

    if (mutatingIdentifiers.length > 0) {
      // Find final instruction which mutates this alias set.
      let lastMutatingInstructionId = 0;
      for (const id of mutatingIdentifiers) {
        if (id.mutableRange.end > lastMutatingInstructionId) {
          lastMutatingInstructionId = id.mutableRange.end;
        }
      }

      // Update mutableRange.end for all aliases in this set ending before the
      // last mutation.
      for (const alias of aliasSet) {
        if (alias.mutableRange.end < lastMutatingInstructionId) {
          alias.mutableRange.end = lastMutatingInstructionId as InstructionId;
        }
      }
    }
  }

  for (const [_, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      const isPhiMutatedAfterCreation: boolean =
        phi.id.mutableRange.end >
        (block.instructions.at(0)?.id ?? block.terminal.id);
      if (isPhiMutatedAfterCreation) {
        for (const [, operand] of phi.operands) {
          aliases.union([phi.id, operand]);
        }
      }
    }
  }
}
