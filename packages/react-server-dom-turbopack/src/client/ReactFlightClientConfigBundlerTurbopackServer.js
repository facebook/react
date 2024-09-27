/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function loadChunk(filename: string): Promise<mixed> {
  return __turbopack_load__(filename);
}
