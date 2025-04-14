/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {DocSearchHit, InternalDocSearchHit} from '../types/algolia';

export function printHierarchy(
  hit: DocSearchHit | InternalDocSearchHit,
): string {
  let val = `${hit.hierarchy.lvl0} > ${hit.hierarchy.lvl1}`;
  if (hit.hierarchy.lvl2 != null) {
    val = val.concat(` > ${hit.hierarchy.lvl2}`);
  }
  if (hit.hierarchy.lvl3 != null) {
    val = val.concat(` > ${hit.hierarchy.lvl3}`);
  }
  if (hit.hierarchy.lvl4 != null) {
    val = val.concat(` > ${hit.hierarchy.lvl4}`);
  }
  if (hit.hierarchy.lvl5 != null) {
    val = val.concat(` > ${hit.hierarchy.lvl5}`);
  }
  if (hit.hierarchy.lvl6 != null) {
    val = val.concat(` > ${hit.hierarchy.lvl6}`);
  }
  return val;
}
