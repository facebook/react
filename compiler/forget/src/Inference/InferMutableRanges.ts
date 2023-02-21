/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HIRFunction } from "../HIR/HIR";
import { inferAliases } from "./InferAlias";
import { inferAliasForStores } from "./InferAliasForStores";
import { inferMutableLifetimes } from "./InferMutableLifetimes";
import { inferMutableRangesForAlias } from "./InferMutableRangesForAlias";

export function inferMutableRanges(ir: HIRFunction) {
  // Infer mutable ranges for non fields
  inferMutableLifetimes(ir, false);

  // Calculate aliases
  const aliases = inferAliases(ir);
  let size = aliases.size;
  // Eagerly canonicalize so that if nothing changes we can bail out
  // after a single iteration
  aliases.canonicalize();
  do {
    size = aliases.size;
    // Infer mutable ranges for aliases that are not fields
    inferMutableRangesForAlias(ir, aliases);

    // Update aliasing information of fields
    inferAliasForStores(ir, aliases);
  } while (aliases.size > size || !aliases.canonicalize());

  // Re-infer mutable ranges for all values
  inferMutableLifetimes(ir, true);

  // Re-infer mutable ranges for aliases
  inferMutableRangesForAlias(ir, aliases);
}
