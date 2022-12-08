import DisjointSet from "./DisjointSet";
import { Identifier, InstructionId } from "./HIR";
import { buildAliasSets } from "./InferAlias";

export function inferMutableRangesForAlias(aliases: DisjointSet<Identifier>) {
  const aliasSets = buildAliasSets(aliases);
  for (const aliasSet of aliasSets) {
    // Update mutableRange.end only if the identifiers have actually been
    // mutated.
    const haveIdentifiersBeenMutated = [...aliasSet].some(
      (id) => id.mutableRange.end - id.mutableRange.start > 1
    );

    if (haveIdentifiersBeenMutated) {
      // Find final instruction which mutates this alias set.
      const mutableRangeEnds = [...aliasSet].map((id) => id.mutableRange.end);
      const maxMutableRangeEnd = Math.max(...mutableRangeEnds) as InstructionId;

      // Update mutableRange.end for all aliases in this set.
      for (const alias of aliasSet) {
        alias.mutableRange.end = maxMutableRangeEnd;
      }
    }
  }
}
