/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, Identifier} from '../HIR/HIR';
import {inferAliases} from './InferAlias';
import {inferAliasForPhis} from './InferAliasForPhis';
import {inferAliasForStores} from './InferAliasForStores';
import {inferMutableLifetimes} from './InferMutableLifetimes';
import {inferMutableRangesForAlias} from './InferMutableRangesForAlias';
import {inferTryCatchAliases} from './InferTryCatchAliases';

export function inferMutableRanges(ir: HIRFunction): void {
  // Infer mutable ranges for non fields
  inferMutableLifetimes(ir, false);

  // Calculate aliases
  const aliases = inferAliases(ir);
  /*
   * Calculate aliases for try/catch, where any value created
   * in the try block could be aliased to the catch param
   */
  inferTryCatchAliases(ir, aliases);

  /*
   * Eagerly canonicalize so that if nothing changes we can bail out
   * after a single iteration
   */
  let prevAliases: Map<Identifier, Identifier> = aliases.canonicalize();
  while (true) {
    // Infer mutable ranges for aliases that are not fields
    inferMutableRangesForAlias(ir, aliases);

    // Update aliasing information of fields
    inferAliasForStores(ir, aliases);

    // Update aliasing information of phis
    inferAliasForPhis(ir, aliases);

    const nextAliases = aliases.canonicalize();
    if (areEqualMaps(prevAliases, nextAliases)) {
      break;
    }
    prevAliases = nextAliases;
  }

  // Re-infer mutable ranges for all values
  inferMutableLifetimes(ir, true);

  // Re-infer mutable ranges for aliases
  inferMutableRangesForAlias(ir, aliases);
}

function areEqualMaps<T>(a: Map<T, T>, b: Map<T, T>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, value] of a) {
    if (!b.has(key)) {
      return false;
    }
    if (b.get(key) !== value) {
      return false;
    }
  }
  return true;
}
