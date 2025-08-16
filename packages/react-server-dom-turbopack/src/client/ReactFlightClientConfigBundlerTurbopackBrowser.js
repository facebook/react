/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactDebugInfo} from 'shared/ReactTypes';

export function loadChunk(filename: string): Promise<mixed> {
  return __turbopack_load_by_url__(filename);
}

export function addChunkDebugInfo(
  target: ReactDebugInfo,
  filename: string,
): void {
  // TODO
}
