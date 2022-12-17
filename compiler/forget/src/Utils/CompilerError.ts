/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";

// Record a bailout if there is an invariant violation and a recently created compiler context.
// Otherwise, just throws a regular invariant.
function compilerInvariant(
  condition: unknown,
  format: string,
  ...args: any[]
): asserts condition {
  return invariant(condition, format, ...args);
}

export { compilerInvariant as invariant };
