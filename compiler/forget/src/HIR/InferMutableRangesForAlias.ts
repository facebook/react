import DisjointSet from "./DisjointSet";
import { Identifier, InstructionId } from "./HIR";
import { buildAliasSets } from "./InferAlias";

export function inferMutableRangesForAlias(aliases: DisjointSet<Identifier>) {
  const aliasSets = buildAliasSets(aliases);
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
}
