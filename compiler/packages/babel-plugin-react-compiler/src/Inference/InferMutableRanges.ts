/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, Identifier} from '../HIR/HIR';
import DisjointSet from '../Utils/DisjointSet';
import {inferAliasForUncalledFunctions} from './InerAliasForUncalledFunctions';
import {inferAliases} from './InferAlias';
import {inferAliasForFunctionCaptureEffects} from './InferAliasesForFunctionCaptureEffects';
import {inferAliasForPhis} from './InferAliasForPhis';
import {inferAliasForStores} from './InferAliasForStores';
import {inferMutableLifetimes} from './InferMutableLifetimes';
import {inferMutableRangesForAlias} from './InferMutableRangesForAlias';
import {inferMutableRangesForComutation} from './InferMutableRangesForComutation';
import {inferTryCatchAliases} from './InferTryCatchAliases';

export function inferMutableRanges(ir: HIRFunction): DisjointSet<Identifier> {
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
  let prevAliases: Map<Identifier, string> = canonicalize(aliases);
  while (true) {
    // Infer mutable ranges for aliases that are not fields
    inferMutableRangesForAlias(ir, aliases);

    inferMutableRangesForComutation(ir);

    // Update aliasing information of fields
    inferAliasForStores(ir, aliases);

    inferAliasForFunctionCaptureEffects(ir, aliases);

    // Update aliasing information of phis
    inferAliasForPhis(ir, aliases);

    const nextAliases = canonicalize(aliases);
    if (areEqualMaps(prevAliases, nextAliases)) {
      break;
    }
    prevAliases = nextAliases;
  }

  // Re-infer mutable ranges for all values
  inferMutableLifetimes(ir, true);

  /**
   * The second inferMutableLifetimes() call updates mutable ranges
   * of values to account for Store effects. Now we need to update
   * all aliases of such values to extend their ranges as well. Note
   * that the store only mutates the the directly aliased value and
   * not any of its inner captured references. For example:
   *
   * ```
   * let y;
   * if (cond) {
   *   y = [];
   * } else {
   *   y = [{}];
   * }
   * y.push(z);
   * ```
   *
   * The Store effect from the `y.push` modifies the values that `y`
   * directly aliases - the two arrays from the if/else branches -
   * but does not modify values that `y` "contains" such as the
   * object literal or `z`.
   */
  prevAliases = canonicalize(aliases);
  while (true) {
    inferMutableRangesForAlias(ir, aliases);
    inferMutableRangesForComutation(ir);
    inferAliasForPhis(ir, aliases);
    inferAliasForUncalledFunctions(ir, aliases);
    const nextAliases = canonicalize(aliases);
    if (areEqualMaps(prevAliases, nextAliases)) {
      break;
    }
    prevAliases = nextAliases;
  }

  return aliases;
}

/**
 * Canonicalizes the alias set and mutable range information calculated at the current time.
 * The returned value maps each identifier in the program to the root identifier of its alias
 * set and the the mutable range of that set.
 *
 * This ensures that we fixpoint the mutable ranges themselves and not just the alias sets.
 */
function canonicalize(
  aliases: DisjointSet<Identifier>,
): Map<Identifier, string> {
  const entries = new Map<Identifier, string>();
  aliases.forEach((item, root) => {
    entries.set(
      item,
      `${root.id}:${root.mutableRange.start}:${root.mutableRange.end}`,
    );
  });
  return entries;
}

function areEqualMaps<T, U>(a: Map<T, U>, b: Map<T, U>): boolean {
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
