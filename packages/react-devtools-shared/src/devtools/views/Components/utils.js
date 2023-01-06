/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Converts nested hooks paths to the format expected by the backend.
 * e.g. [''] => ['']
 * e.g. [1, 'value', ...] => [...]
 * e.g. [2, 'subhooks', 1, 'value', ...] => [...]
 * e.g. [1, 'subhooks', 3, 'subhooks', 2, 'value', ...] => [...]
 */
export function parseHookPathForEdit(
  path: Array<string | number>,
): Array<string | number> {
  let index = 0;
  for (let i = 0; i < path.length; i++) {
    if (path[i] === 'value') {
      index = i + 1;
      break;
    }
  }
  return path.slice(index);
}
